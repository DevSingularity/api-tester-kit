# API Engine & Proxy Layer

## Overview

The API engine is the core HTTP client that handles request construction, variable substitution, authentication, and response parsing. It operates in two modes: **direct** (browser fetch) and **proxy** (server-side fetch via Next.js API route).

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   API Engine (api-engine.ts)              │
│                                                          │
│  1. substituteVariables()   → Replace {{var}} in URL    │
│  2. buildHeaders()          → Merge headers + auth       │
│  3. buildUrl()              → Append query params        │
│  4. buildBody()             → Serialize request body     │
│  5. sendRequest()           → Execute fetch              │
│                                                          │
└─────────────────────┬───────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          │                       │
          ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│  Direct Mode    │    │  Proxy Mode     │
│  (Browser)      │    │  (Server)       │
│                 │    │                 │
│  fetch(url,     │    │  fetch(         │
│    { method,    │    │    "/api/proxy",│
│    headers,     │    │    { method:    │
│    body })      │    │      "POST",   │
│                 │    │    body: JSON   │
│  ⚠ CORS        │    │      { method,  │
│  restricted     │    │        url,     │
│                 │    │        headers, │
└─────────────────┘    │        body }}  │
                       │  })            │
                       │                │
                       │  ✓ No CORS     │
                       │  ✓ Hidden URLs │
                       └─────────────────┘
```

## API Engine

**File**: `src/lib/api-engine.ts`

### `sendRequest(options: SendRequestOptions): Promise<ApiResponse>`

The main function that executes an HTTP request.

```typescript
interface SendRequestOptions {
  request: ApiRequest;        // The request configuration
  proxyMode: ProxyMode;       // "direct" | "proxy" | "auto"
  variables: Record<string, string>;  // Environment variables
  signal?: AbortSignal;       // For cancellation
}
```

### Request Building Pipeline

#### 1. Variable Substitution

```typescript
function substituteVariables(
  template: string,
  variables: Record<string, string>
): string
```

Replaces `{{VARIABLE_NAME}}` placeholders with actual values.

**Example**:
```
Input:  "https://{{BASE_URL}}/api/{{VERSION}}/users"
Vars:   { BASE_URL: "localhost:3000", VERSION: "v2" }
Output: "https://localhost:3000/api/v2/users"
```

#### 2. Header Building

```typescript
function buildHeaders(
  request: ApiRequest,
  variables: Record<string, string>
): Record<string, string>
```

Combines:
- Custom headers (enabled ones only)
- Auth headers (Authorization: Bearer/Basic)
- API Key headers

**Auth Header Formats**:
| Auth Type | Header Format |
|---|---|
| Bearer | `Authorization: Bearer <token>` |
| Basic | `Authorization: Basic <base64(user:pass)>` |
| API Key (header) | `<key>: <value>` |

#### 3. URL Building

```typescript
function buildUrl(
  request: ApiRequest,
  variables: Record<string, string>
): string
```

Appends enabled query parameters to the URL.

**Example**:
```
URL:    "https://api.example.com/users"
Params: [{ key: "page", value: "1", enabled: true },
         { key: "limit", value: "10", enabled: true }]
Output: "https://api.example.com/users?page=1&limit=10"
```

#### 4. Body Building

```typescript
function buildBody(
  request: ApiRequest,
  variables: Record<string, string>
): string | undefined
```

Serializes the body based on type:
- **none**: Returns `undefined`
- **json/xml/text/html**: Returns raw content with variable substitution
- **x-www-form-urlencoded**: Returns URL-encoded string

### Response Parsing

```typescript
{
  status: response.status,
  statusText: response.statusText,
  headers: responseHeaders,     // All response headers
  body: responseBody,           // Body as text
  time: endTime - startTime,    // Duration in ms
  size: new Blob([responseBody]).size,  // Size in bytes
  timestamp: new Date().toISOString(),
}
```

## Proxy Layer

**File**: `src/app/api/proxy/route.ts`

### Purpose

The proxy route solves CORS issues by routing requests through the Next.js server.

### Request Format

```typescript
// Client sends POST to /api/proxy
{
  method: "GET",           // HTTP method
  url: "https://...",      // Target URL
  headers: { ... },        // Request headers
  body: "...",             // Request body (optional)
}
```

### Response Format

```typescript
{
  status: 200,
  statusText: "OK",
  headers: { "content-type": "application/json", ... },
  body: "{ ... }",
  time: 150.23,            // Response time in ms
  size: 1024,              // Response size in bytes
}
```

### Features

1. **CORS Bypass**: Server-side fetch has no CORS restrictions
2. **Streaming Support**: Handles SSE, binary streams, video/audio
3. **Header Forwarding**: Custom headers are passed through
4. **Error Handling**: Returns structured error responses
5. **Timing**: Measures response time server-side

### Streaming Mode

For content types like `text/event-stream`, `application/octet-stream`, `video/*`, `audio/*`:

```typescript
// Streams response directly to client
const stream = new ReadableStream({
  async start(controller) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      controller.enqueue(encoder.encode(decoder.decode(value, { stream: true })));
    }
    controller.close();
  },
});

return new Response(stream, {
  headers: {
    "Content-Type": "text/plain",
    "X-Original-Status": String(response.status),
    "X-Response-Time": String(endTime - startTime),
  },
});
```

### Security Considerations

The proxy route:
- Removes `host`, `origin`, and `referer` headers before forwarding
- Validates URL format before making requests
- Returns structured errors without exposing internal details
- Does not store or log request data

## Proxy Modes

| Mode | Behavior | Use Case |
|---|---|---|
| `proxy` | Always routes through `/api/proxy` | Default, safest option |
| `direct` | Browser sends directly | Same-origin APIs |
| `auto` | Decides based on URL | Advanced usage |

## Localhost Support

The proxy layer properly handles local development:

```
http://localhost:3000
http://localhost:5000
http://localhost:8000
http://127.0.0.1:8080
http://host.docker.internal:5000
```

Since the proxy runs server-side, there are no CORS issues with localhost APIs.

## Cancellation

Requests can be cancelled using `AbortController`:

```typescript
const controller = new AbortController();
// Store controller in request store
// ...
// Cancel
controller.abort();
```

The `signal` is passed through to `fetch()`, which throws a `DOMException` with name `"AbortError"` when aborted.
