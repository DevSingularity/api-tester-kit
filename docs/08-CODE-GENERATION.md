# Code Generation

## Overview

The code generation engine converts API requests into code snippets in 6 programming languages. Each generator takes an `ApiRequest` object and produces idiomatic code for the target language.

## File: `src/lib/code-generator.ts`

## Supported Languages

| Language | Method | Library | Output Type |
|---|---|---|---|
| cURL | CLI | cURL | Shell command |
| JavaScript | `fetch()` | Fetch API | Promise chain |
| TypeScript | `fetch()` | Fetch API | Async/await |
| Python | `requests` | requests | Function call |
| Go | `http.NewRequest` | net/http | Full program |
| PHP | `curl_*` | PHP cURL | Full script |

## API

### `generateCode(request: ApiRequest, language: CodeLanguage): string`

Main entry point that dispatches to language-specific generators.

```typescript
type CodeLanguage = "curl" | "javascript" | "typescript" | "python" | "go" | "php";

const CODE_LANGUAGES: { value: CodeLanguage; label: string }[] = [
  { value: "curl", label: "cURL" },
  { value: "javascript", label: "JavaScript (Fetch)" },
  { value: "typescript", label: "TypeScript (Fetch)" },
  { value: "python", label: "Python (Requests)" },
  { value: "go", label: "Go (net/http)" },
  { value: "php", label: "PHP (cURL)" },
];
```

## Language Generators

### 1. cURL (`generateCurl`)

**Input**:
```json
{
  "method": "POST",
  "url": "https://api.example.com/users",
  "headers": [{ "key": "Content-Type", "value": "application/json", "enabled": true }],
  "auth": { "type": "bearer", "bearer": { "token": "abc123" } },
  "body": { "type": "json", "raw": "{\"name\": \"John\"}" }
}
```

**Output**:
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer abc123" \
  -d '{"name": "John"}' \
  "https://api.example.com/users"
```

**Features**:
- Proper escaping of quotes and newlines
- Bearer token in Authorization header
- Basic auth with `-u` flag
- POST body with `-d`

---

### 2. JavaScript (`generateJavaScript`)

**Output**:
```javascript
fetch('https://api.example.com/users', {
  method: 'POST',
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({"name": "John"})
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

**Features**:
- Uses Fetch API
- Promise chain style
- Includes error handling

---

### 3. TypeScript (`generateTypeScript`)

**Output**:
```typescript
interface Response {
  status: number;
  data: unknown;
}

async function fetchData(): Promise<Response> {
  const response = await fetch('https://api.example.com/users', {
    method: 'POST',
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({"name": "John"}),
  });

  const data = await response.json();
  return { status: response.status, data };
}

fetchData().then(console.log);
```

**Features**:
- Type definitions
- Async/await syntax
- Return type annotation

---

### 4. Python (`generatePython`)

**Output**:
```python
import requests

url = "https://api.example.com/users"
headers = {
    "Content-Type": "application/json"
}
payload = {"name": "John"}

response = requests.post(url, headers=headers, json=payload)
print(response.status_code)
print(response.json())
```

**Features**:
- Uses `requests` library
- JSON body via `json=` parameter
- Prints status and response

---

### 5. Go (`generateGo`)

**Output**:
```go
package main

import (
	"fmt"
	"net/http"
	"io"
	"strings"
)

func main() {
	body := strings.NewReader(`{"name": "John"}`)
	req, _ := http.NewRequest("POST", "https://api.example.com/users", body)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer abc123")

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)
	fmt.Println(string(respBody))
}
```

**Features**:
- Full compilable program
- Uses `net/http` standard library
- String reader for body
- Proper imports

---

### 6. PHP (`generatePHP`)

**Output**:
```php
<?php

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "https://api.example.com/users");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");

curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer abc123',
]);

curl_setopt($ch, CURLOPT_POSTFIELDS, '{"name": "John"}');

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "Status: " . $httpCode . "\n";
echo $response;
```

**Features**:
- Uses PHP cURL extension
- Sets headers as array
- Returns status code and body

---

## Auth Handling by Language

| Auth Type | cURL | JS | TS | Python | Go | PHP |
|---|---|---|---|---|---|---|
| Bearer | `-H "Authorization: Bearer ..."` | Header | Header | Header | Header | Header |
| Basic | `-u "user:pass"` | Header (Base64) | Header (Base64) | Header (Base64) | Header (Base64) | Header |
| API Key | `-H "Key: Value"` | Header | Header | Header | Header | Header |

## Body Handling by Language

| Body Type | cURL | JS | TS | Python | Go | PHP |
|---|---|---|---|---|---|---|
| JSON | `-d '...'` | `JSON.stringify()` | `JSON.stringify()` | `json=` | `strings.NewReader()` | `CURLOPT_POSTFIELDS` |
| None | (omitted) | (omitted) | (omitted) | (omitted) | `nil` | (omitted) |

## Integration

The code generator is used in:

1. **Response Viewer Code Tab**: Shows generated code for the last request
2. **Code Generator Panel** (`src/components/code-generator-panel.tsx`): Standalone panel with language selector

### Component Usage

```tsx
import { CodeGenerator } from "@/components/code-generator-panel";

// In response viewer
<TabsContent value="code">
  <CodeGenerator />
</TabsContent>
```

The component:
- Reads the active request from Zustand store
- Allows language selection via dropdown
- Shows generated code in monospace pre block
- Provides copy-to-clipboard button
