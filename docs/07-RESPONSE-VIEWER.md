# Response Viewer

## Overview

The Response Viewer displays HTTP response data with multiple views: body (JSON viewer), headers, and code generation. It includes search functionality and response metadata.

## Component Hierarchy

```
ResponseViewer (src/features/response-viewer/components/response-viewer.tsx)
├── Status Bar
│   ├── Status Badge (color-coded)
│   ├── Response Time
│   ├── Response Size
│   ├── ResponseSearch
│   ├── Copy Button
│   └── Download Button
│
└── Tabs
    ├── Body Tab → JsonViewer
    ├── Headers Tab → Header list
    └── Code Tab → CodeGenerator
```

## Status Bar

```
┌──────┬──────────┬──────────┬────────────────────┬────────┬──────────┐
│ 200  │ 150ms    │ 2.3 KB   │ [Search...] 1/5    │ [Copy] │ [Export] │
│  OK  │          │          │                    │        │          │
└──────┴──────────┴──────────┴────────────────────┴────────┴──────────┘
```

### Components

| Element | Description |
|---|---|
| **Status Badge** | Shows status code + text, color-coded by category |
| **Response Time** | Duration in ms or seconds |
| **Response Size** | Formatted byte size (B, KB, MB) |
| **Response Search** | Search within response body |
| **Copy Button** | Copies response body to clipboard |
| **Download Button** | Downloads response as .txt file |

### Status Code Colors

| Code Range | Color | Meaning |
|---|---|---|
| 2xx | emerald-400 | Success |
| 3xx | amber-400 | Redirect |
| 4xx | red-400 | Client Error |
| 5xx | red-500 | Server Error |

---

## Body Tab (JSON Viewer)

### File: `src/components/json-viewer.tsx`

#### Features

1. **Tree View**: Nested JSON displayed as collapsible tree
2. **Syntax Highlighting**: Different colors for keys, strings, numbers, booleans, null
3. **Expand/Collapse**: Click chevron to expand/collapse nodes
4. **Copy Path**: Click copy icon to copy JSON path (e.g., `data.users[0].name`)
5. **Copy All**: Copy entire JSON to clipboard
6. **Search**: Filter/highlight within JSON

#### Visual Example

```json
{
  "status": 200,                    // amber (number)
  "data": {                         // expandable object
    "users": [                      // expandable array
      {                             // expandable object
        "id": 1,                    // amber (number)
        "name": "John Doe",         // green (string)
        "active": true,             // purple (boolean)
        "metadata": null            // gray (null)
      }
    ],
    "total": 42                     // amber (number)
  }
}
```

#### Expand/Collapse Behavior

- Default expansion depth: 2 levels
- Click chevron (▶/▼) to toggle
- Collapsed shows `{ ... }` or `[ ... ]`
- All nodes expandable except primitives

#### JSON Path Format

Paths follow JavaScript dot notation:
- Object: `data.users[0].name`
- Array: `data.users[0].roles[1]`
- Nested: `response.data.items[2].metadata.created_at`

---

## Headers Tab

### Display

```
content-type:    application/json; charset=utf-8
cache-control:   no-cache
x-request-id:    abc123-def456
date:            Sat, 18 Jul 2026 12:00:00 GMT
```

### Format

- Key in muted foreground
- Value in foreground
- Monospace font
- Word-break for long values
- Sorted by header name

---

## Code Tab

### File: `src/components/code-generator-panel.tsx`

Generates code snippets for the current request in multiple languages.

### Languages

| Language | Library | Example |
|---|---|---|
| cURL | CLI | `curl -X GET ...` |
| JavaScript | Fetch API | `fetch(url, options)` |
| TypeScript | Fetch API | `async function fetchData()` |
| Python | requests | `requests.get(url)` |
| Go | net/http | `http.NewRequest(...)` |
| PHP | cURL | `curl_init()` |

### Features

- Language selector dropdown
- Copy button with success feedback
- Monospace code display
- Handles auth headers automatically

---

## Response Search

### File: `src/components/response-search.tsx`

### Features

| Feature | Description |
|---|---|
| Real-time search | Results update as you type |
| Match counter | Shows "current/total" (e.g., "3/15") |
| Navigation | Previous/Next buttons |
| Case-insensitive | Matches regardless of case |
| Clear button | Resets search |

### Implementation

The search uses `String.indexOf()` in a loop to find all match positions:

```typescript
const matches = useMemo(() => {
  if (!query) return [];
  const indices: number[] = [];
  let idx = body.toLowerCase().indexOf(query.toLowerCase());
  while (idx !== -1) {
    indices.push(idx);
    idx = body.toLowerCase().indexOf(query.toLowerCase(), idx + 1);
  }
  return indices;
}, [body, query]);
```

---

## Loading State

When a request is in progress:

```
┌─────────────────────────────────────────┐
│                                         │
│           ◌ Sending request...          │
│           (spinning loader)             │
│                                         │
└─────────────────────────────────────────┘
```

The spinner uses Tailwind's `animate-spin` on a circular border.

---

## Empty State

When no response is available:

```
┌─────────────────────────────────────────┐
│                                         │
│    Send a request to see the response   │
│                                         │
└─────────────────────────────────────────┘
```

---

## Download Feature

Clicking the download button:
1. Creates a Blob from the response body
2. Generates a temporary URL
3. Creates a hidden `<a>` element
4. Triggers click to download
5. Revokes the temporary URL

File naming: `response-{counter}.txt` (counter increments per session)

---

## Response Data Flow

```
User clicks "Send"
       │
       ▼
sendRequest() returns ApiResponse
       │
       ▼
requestStore.setResponse(requestId, response)
       │
       ▼
ResponseViewer re-renders
       │
       ▼
┌───────────────────────────┐
│ Status Bar:               │
│   Badge: 200 OK (green)   │
│   Time: 150ms             │
│   Size: 2.3 KB            │
├───────────────────────────┤
│ Body Tab:                 │
│   JsonViewer parses JSON  │
│   Displays tree structure │
├───────────────────────────┤
│ Headers Tab:              │
│   Lists all headers       │
├───────────────────────────┤
│ Code Tab:                 │
│   Generates code snippet  │
└───────────────────────────┘
```
