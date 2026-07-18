# Types & Utilities

## Type Definitions

### File: `src/types/index.ts`

#### HTTP Methods

```typescript
export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "OPTIONS"
  | "HEAD"
  | "TRACE"
  | "CONNECT";
```

All 9 standard HTTP methods are supported. Each method has an associated color for visual distinction in the UI.

#### Auth Types

```typescript
export type AuthType =
  | "none"
  | "basic"
  | "bearer"
  | "jwt"
  | "oauth2"
  | "apikey"
  | "digest"
  | "custom";
```

Authentication types range from simple (none, basic, bearer) to advanced (OAuth2, JWT, AWS Signature). The `custom` type allows arbitrary headers.

#### Body Types

```typescript
export type BodyType =
  | "none"
  | "json"
  | "xml"
  | "html"
  | "text"
  | "binary"
  | "form-data"
  | "x-www-form-urlencoded"
  | "file";
```

Supports all common content types for API request bodies.

#### Proxy Mode

```typescript
export type ProxyMode = "direct" | "proxy" | "auto";
```

- **direct**: Browser sends request directly (subject to CORS)
- **proxy**: Always routes through `/api/proxy` (avoids CORS)
- **auto**: Decides based on URL (proxy for localhost, direct for remote)

#### Key-Value Pair

```typescript
export interface KeyValuePair {
  id: string;        // Unique identifier (crypto.randomUUID)
  key: string;       // Parameter/header name
  value: string;     // Parameter/header value
  description?: string; // Optional description
  enabled: boolean;  // Whether this pair is active
}
```

Used for:
- Query parameters
- Request headers
- URL-encoded form data
- Form data fields
- Custom auth headers

#### Auth Configuration

```typescript
export interface AuthConfig {
  type: AuthType;
  basic?: { username: string; password: string };
  bearer?: { token: string };
  apikey?: { key: string; value: string; addTo: "header" | "query" };
  jwt?: { token: string };
  custom?: { headers: KeyValuePair[] };
}
```

Each auth type stores its configuration differently. The `apikey` type supports adding the key as either a header or query parameter.

#### Request Body

```typescript
export interface RequestBody {
  type: BodyType;
  raw?: string;          // For JSON, XML, HTML, Text
  json?: string;         // Dedicated JSON field
  formUrlEncoded?: KeyValuePair[];  // URL-encoded form
  formData?: Array<KeyValuePair & { type: "text" | "file"; fileName?: string }>;
}
```

#### API Request

```typescript
export interface ApiRequest {
  id: string;              // Unique identifier
  name: string;            // Display name (e.g., "Get Users")
  method: HttpMethod;      // HTTP method
  url: string;             // Full URL with {{variables}}
  params: KeyValuePair[];  // Query parameters
  headers: KeyValuePair[]; // Request headers
  body: RequestBody;       // Request body
  auth: AuthConfig;        // Authentication
  preRequestScript?: string;  // JavaScript to run before request
  testScript?: string;        // JavaScript to run after response
  collectionId?: string;   // Parent collection ID
  folderId?: string;       // Parent folder ID
}
```

#### API Response

```typescript
export interface ApiResponse {
  status: number;              // HTTP status code
  statusText: string;          // Status text (e.g., "OK")
  headers: Record<string, string>;  // Response headers
  body: string;                // Response body as string
  time: number;                // Response time in milliseconds
  size: number;                // Response size in bytes
  timestamp: string;           // ISO timestamp
}
```

#### Request Tab

```typescript
export interface RequestTab {
  id: string;         // Tab identifier
  requestId: string;  // Associated request ID
  name: string;       // Tab display name
  isDirty: boolean;   // Has unsaved changes
  isPinned: boolean;  // Tab is pinned
}
```

#### Collection

```typescript
export interface Collection {
  id: string;
  name: string;
  description?: string;
  requests: ApiRequest[];
  folders: Folder[];
  environments: Record<string, string>;  // Collection-specific variables
  createdAt: string;
  updatedAt: string;
}
```

#### Folder

```typescript
export interface Folder {
  id: string;
  name: string;
  requests: ApiRequest[];
  folders: Folder[];  // Nested folders supported
}
```

#### Environment

```typescript
export interface Environment {
  id: string;
  name: string;                       // e.g., "Production", "Local"
  variables: Record<string, string>;  // key-value pairs
  isSecret: Record<string, boolean>;  // Which values are secrets
  createdAt: string;
  updatedAt: string;
}
```

#### History Entry

```typescript
export interface HistoryEntry {
  id: string;
  request: ApiRequest;
  response: ApiResponse;
  environment?: string;  // Active environment name
  timestamp: string;
}
```

## Utility Functions

### File: `src/utils/index.ts`

#### HTTP Method Constants

```typescript
export const HTTP_METHODS: HttpMethod[] = [
  "GET", "POST", "PUT", "PATCH", "DELETE",
  "OPTIONS", "HEAD", "TRACE", "CONNECT"
];
```

#### Method Colors

```typescript
export const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: "text-emerald-400",
  POST: "text-amber-400",
  PUT: "text-blue-400",
  PATCH: "text-purple-400",
  DELETE: "text-red-400",
  OPTIONS: "text-gray-400",
  HEAD: "text-cyan-400",
  TRACE: "text-gray-500",
  CONNECT: "text-gray-500",
};
```

#### Status Colors

```typescript
export function getStatusColor(status: number): string {
  const prefix = String(status)[0]; // "2", "3", "4", "5"
  return STATUS_COLORS[prefix] ?? "text-gray-400";
}
```

Returns Tailwind color classes based on status code category:
- `2xx` → green (success)
- `3xx` → amber (redirect)
- `4xx` → red (client error)
- `5xx` → red (server error)

#### Formatting Functions

```typescript
// Format bytes: 1024 → "1 KB", 1048576 → "1 MB"
export function formatBytes(bytes: number): string

// Format duration: 150 → "150ms", 1500 → "1.50s"
export function formatDuration(ms: number): string
```

#### ID Generation

```typescript
// Generate UUID v4
export function generateId(): string {
  return crypto.randomUUID();
}
```

#### Variable Substitution

```typescript
// Replace {{variable}} placeholders with values
export function substituteVariables(
  template: string,
  variables: Record<string, string>
): string
```

Example:
```typescript
substituteVariables(
  "https://{{BASE_URL}}/api/users/{{USER_ID}}",
  { BASE_URL: "localhost:3000", USER_ID: "123" }
)
// Returns: "https://localhost:3000/api/users/123"
```

Unresolved variables remain as `{{variable_name}}`.
