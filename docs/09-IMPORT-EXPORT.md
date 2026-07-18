# Import & Export

## Overview

The import/export system supports multiple formats for interoperability with other API testing tools. It can parse external formats into the internal `Collection` and `ApiRequest` types, and export collections to various formats.

## File: `src/lib/import-export.ts`

## Import Formats

### 1. Postman Collection

**Function**: `importPostmanCollection(data: unknown): Collection`

**Supported Structure**:
```json
{
  "info": {
    "name": "My Collection",
    "description": "Description here"
  },
  "item": [
    {
      "name": "Get Users",
      "request": {
        "method": "GET",
        "header": [
          { "key": "Accept", "value": "application/json" }
        ],
        "url": {
          "raw": "https://api.example.com/users",
          "query": [
            { "key": "page", "value": "1" }
          ]
        }
      }
    },
    {
      "name": "Folder",
      "item": [...]
    }
  ]
}
```

**Mapping**:
| Postman Field | Internal Field |
|---|---|
| `info.name` | `collection.name` |
| `item[].name` | `request.name` |
| `request.method` | `request.method` |
| `request.url.raw` | `request.url` |
| `request.header` | `request.headers` |
| `request.url.query` | `request.params` |
| `request.body.raw` | `request.body.raw` |

**Recursive Parsing**: Folders (`item[]` with nested `item`) are parsed recursively into the `folders` array.

---

### 2. OpenAPI/Swagger Schema

**Function**: `importOpenAPISchema(data: unknown): Collection`

**Supported Structure**:
```json
{
  "info": {
    "title": "Pet Store API",
    "version": "1.0.0"
  },
  "paths": {
    "/pets": {
      "get": {
        "summary": "List all pets",
        "parameters": [
          { "name": "limit", "in": "query", "required": false }
        ]
      },
      "post": {
        "summary": "Create a pet"
      }
    }
  }
}
```

**Mapping**:
| OpenAPI Field | Internal Field |
|---|---|
| `info.title` | `collection.name` |
| `paths[path]` | `request.url` |
| `method` | `request.method` |
| `summary` | `request.name` |
| `parameters[].name` | `request.params[].key` |

**Limitations**:
- Only query parameters are mapped (not path/header params)
- Request body schemas are not parsed
- Only GET, POST, PUT, PATCH, DELETE methods are supported

---

### 3. cURL Command

**Function**: `importCurlCommand(curl: string): ApiRequest`

**Supported Syntax**:
```bash
curl -X POST https://api.example.com/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token123" \
  -d '{"name": "John"}'
```

**Parsing**:
| cURL Flag | Internal Field |
|---|---|
| `-X METHOD` | `request.method` |
| URL (positional) | `request.url` |
| `-H "Key: Value"` | `request.headers` |
| `-d '...'` | `request.body.raw` |

**Regex Patterns**:
```typescript
// URL
/['"]?(https?:\/\/[^\s'"]+)['"]?/

// Method
/-X\s+(\w+)/

// Headers (global match)
/-H\s+['"]([^'"]+)['"]/g

// Body
/-d\s+['"]([\s\S]+?)['"]/
```

---

### 4. HAR File (HTTP Archive)

**Function**: `importHARFile(data: unknown): ApiRequest[]`

**Supported Structure**:
```json
{
  "log": {
    "entries": [
      {
        "request": {
          "method": "GET",
          "url": "https://api.example.com/users",
          "headers": [
            { "name": "Accept", "value": "application/json" }
          ],
          "postData": {
            "text": "{\"name\": \"John\"}"
          }
        },
        "response": {
          "status": 200,
          "statusText": "OK",
          "headers": [...],
          "content": { "text": "..." },
          "timings": { "send": 1, "wait": 100, "receive": 50 }
        }
      }
    ]
  }
}
```

**Mapping**:
| HAR Field | Internal Field |
|---|---|
| `request.method` | `request.method` |
| `request.url` | `request.url` |
| `request.headers` | `request.headers` |
| `request.postData.text` | `request.body.raw` |

**Note**: Only requests are imported (responses are discarded).

---

## Export Formats

### 1. JSON

**Function**: `exportToJSON(collection: Collection): string`

Returns the collection as formatted JSON (2-space indent).

```json
{
  "id": "abc-123",
  "name": "My Collection",
  "requests": [...],
  "folders": [...]
}
```

---

### 2. YAML

**Function**: `exportToYAML(collection: Collection): string`

Custom YAML serializer (no external dependency).

```yaml
# Exported from API Tester Kit
name: "My Collection"
requests:
  - name: "Get Users"
    method: "GET"
    url: "https://api.example.com/users"
```

**Features**:
- Proper indentation (2 spaces)
- String quoting
- Array dash notation
- Nested object support

---

### 3. Markdown

**Function**: `exportToMarkdown(collection: Collection): string`

Generates documentation-ready Markdown.

```markdown
# My Collection

## Get Users

- **Method:** GET
- **URL:** https://api.example.com/users

**Headers:**

- Accept: application/json
```

**Features**:
- Heading levels for hierarchy
- Bold labels for metadata
- Bullet lists for headers
- Clean, readable output

---

## UI Integration

### Import/Export Dialog

**File**: `src/components/import-export-dialog.tsx`

**Modes**:
1. **Import Mode**: When `collection` prop is `null`
2. **Export Mode**: When `collection` prop is provided

**Import UI**:
```
┌─────────────────────────────────────────┐
│ Import Collection                       │
├─────────────────────────────────────────┤
│ [Postman] [cURL] [HAR] [JSON]          │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │  📤 Click to upload or paste here   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │  (Textarea for pasting)             │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Import Postman Collection]             │
│                                         │
│ ✓ Collection "Imported" imported!       │
└─────────────────────────────────────────┘
```

**Export UI**:
```
┌─────────────────────────────────────────┐
│ Export Collection                       │
├─────────────────────────────────────────┤
│ Format: [JSON ▼]                        │
│                                         │
│ [Export My Collection]                  │
└─────────────────────────────────────────┘
```

**Download Behavior**:
1. Generate content string
2. Create Blob with appropriate MIME type
3. Generate temporary URL
4. Create hidden `<a>` element with `download` attribute
5. Trigger click
6. Revoke URL

| Format | MIME Type | Extension |
|---|---|---|
| JSON | application/json | .json |
| YAML | text/yaml | .yaml |
| Markdown | text/markdown | .md |

### Collections Page Integration

The Collections page (`/collections`) includes:
- **Import Button**: Opens dialog in import mode
- **Export Button** (per collection): Opens dialog in export mode
- **New Collection**: Creates empty collection
- **Rename**: Inline editing
- **Delete**: Removes collection
