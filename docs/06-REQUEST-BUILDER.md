# Request Builder

## Overview

The Request Builder is the primary interface for constructing and sending HTTP requests. It provides a tabbed editor with separate panels for parameters, headers, body, authentication, and scripts.

## Component Hierarchy

```
Request Builder
├── UrlBar (src/features/request-builder/components/url-bar.tsx)
│   ├── MethodSelector (src/components/method-selector.tsx)
│   ├── URL Input
│   └── Send/Cancel Button
│
├── RequestTabs (src/features/request-builder/components/request-tabs.tsx)
│   └── Tab items (open requests)
│
└── RequestPanel (src/features/request-builder/components/request-panel.tsx)
    ├── ParamsEditor
    ├── HeadersEditor
    ├── BodyEditor
    ├── AuthEditor
    └── ScriptEditor
```

## URL Bar

**File**: `src/features/request-builder/components/url-bar.tsx`

### Layout

```
┌──────────┬────────────────────────────────────┬──────────┐
│  GET ▼   │  https://api.example.com/users     │  Send    │
│          │                                     │          │
└──────────┴────────────────────────────────────┴──────────┘
```

### Features

1. **Method Selector**: Dropdown with all HTTP methods, color-coded
2. **URL Input**: Monospace font, supports `{{variables}}`
3. **Send Button**: Sends request on click or `Ctrl+Enter`
4. **Cancel Button**: Appears during loading, aborts request

### Keyboard Shortcut

- `Ctrl+Enter` / `Cmd+Enter`: Send request

### Flow

1. User types URL and selects method
2. Clicks "Send" or presses `Ctrl+Enter`
3. `sendRequest()` is called with current request data
4. Loading spinner replaces Send button
5. Response is stored in request store
6. Entry is added to history

---

## Method Selector

**File**: `src/components/method-selector.tsx`

### Methods and Colors

| Method | Color | Use Case |
|---|---|---|
| GET | emerald-400 | Read data |
| POST | amber-400 | Create data |
| PUT | blue-400 | Replace data |
| PATCH | purple-400 | Partial update |
| DELETE | red-400 | Remove data |
| OPTIONS | gray-400 | CORS preflight |
| HEAD | cyan-400 | Headers only |
| TRACE | gray-500 | Diagnostic |
| CONNECT | gray-500 | Tunnel |

---

## Params Editor

**File**: `src/features/request-builder/components/params-editor.tsx`

### Layout

```
☑ Key           ☑ Value           [×]
─────────────────────────────────────
☑ page          1                  [×]
☑ limit         10                 [×]
☐ sort          created_at         [×]
+ Add parameter
```

### Features

- **Checkbox**: Enable/disable parameter
- **Key Input**: Parameter name
- **Value Input**: Parameter value
- **Drag Handle**: Reorder (visual only)
- **Delete Button**: Remove parameter
- **Add Button**: Add new empty parameter

### Behavior

- Disabled parameters are not sent with the request
- Variables can be used in values: `{{PAGE_SIZE}}`
- Empty key/value pairs are ignored

---

## Headers Editor

**File**: `src/features/request-builder/components/headers-editor.tsx`

### Layout

```
☑ Key              ☑ Value                    [×]
──────────────────────────────────────────────────
☑ Content-Type     application/json           [×]
☑ Accept           application/json           [×]
☐ Authorization    Bearer {{TOKEN}}           [×]
+ Add header
```

### Features

Same as Params Editor, but for HTTP headers.

### Common Headers

| Header | Value | Purpose |
|---|---|---|
| Content-Type | application/json | Request body format |
| Accept | application/json | Expected response format |
| Authorization | Bearer {{TOKEN}} | Auth token |
| X-API-Key | {{API_KEY}} | API key auth |

---

## Body Editor

**File**: `src/features/request-builder/components/body-editor.tsx`

### Body Types

| Type | Editor | Use Case |
|---|---|---|
| None | (empty) | GET, HEAD requests |
| JSON | Textarea | REST APIs |
| XML | Textarea | SOAP APIs |
| Text | Textarea | Plain text |
| HTML | Textarea | HTML content |
| URL Encoded | (coming soon) | Form submissions |
| Form Data | (coming soon) | File uploads |

### JSON Editor

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "roles": ["admin", "user"]
}
```

Features:
- Monospace font
- Variable substitution supported
- Placeholder shows example JSON

---

## Auth Editor

**File**: `src/features/request-builder/components/auth-editor.tsx`

### Auth Types

#### No Auth
No authentication headers are added.

#### Bearer Token
```
Authorization: Bearer {{TOKEN}}
```
Input: Single token field

#### Basic Auth
```
Authorization: Basic base64(username:password)
```
Inputs: Username + Password fields

#### API Key
```
X-API-Key: {{API_KEY}}
```
Inputs: Key name + Value + Location (header/query)

#### JWT
```
Authorization: Bearer {{JWT_TOKEN}}
```
Input: JWT token field

#### Custom Headers
Allows adding arbitrary authentication headers.

---

## Script Editor

**File**: `src/features/request-builder/components/script-editor.tsx`

### Pre-request Script

Runs before the request is sent. Useful for:
- Setting dynamic variables
- Logging
- Request validation

```javascript
// Example
console.log('Sending request to:', vars.BASE_URL);
vars.TIMESTAMP = Date.now();
```

### Test Script

Runs after the response is received. Useful for:
- Assertions
- Response validation
- Data extraction

```javascript
// Example
expect(response.status).toBe(200);
expect(response.body).toHaveProperty('id');
console.log('Response time:', response.time, 'ms');
```

### Available Variables

| Variable | Description |
|---|---|
| `response.status` | HTTP status code |
| `response.body` | Parsed response body |
| `response.headers` | Response headers |
| `response.time` | Response time in ms |
| `vars` | Environment variables (mutable) |

### Running Tests

Click "Run Tests" button to execute the test script. Results show:
- Passed assertions (green badge)
- Failed assertions (red badge with messages)
- Console logs

---

## Request Tabs

**File**: `src/features/request-builder/components/request-tabs.tsx`

### Features

- Multiple tabs open simultaneously
- Active tab highlighted
- Pin tab (right-click or pin icon)
- Close tab (X button)
- Add new tab (+ button)
- Tab names match request names

### Tab Behavior

- Creating a tab auto-activates it
- Closing a tab switches to nearest adjacent tab
- Pinned tabs are visually distinguished

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Enter` | Send request |
| `Ctrl+S` | Save (prevent default, for future use) |
| `Ctrl+K` | Open command palette |
| `Ctrl+Shift+P` | Open command palette |
| `Escape` | Close command palette |
