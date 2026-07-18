# State Management (Zustand Stores)

## Overview

The application uses **Zustand** for state management with 5 separate stores, each responsible for a specific domain. Stores are lightweight, have no boilerplate, and support selectors for optimal re-rendering.

## Store Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Zustand Stores                           │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │  Request Store   │  │ Environment     │                  │
│  │  (request-store) │  │ Store           │                  │
│  │                 │  │ (env-store)     │                  │
│  │  State:         │  │                 │                  │
│  │  - tabs         │  │  State:         │                  │
│  │  - requests     │  │  - environments │                  │
│  │  - responses    │  │  - activeEnvId  │                  │
│  │  - loading      │  │  - globalVars   │                  │
│  │  - proxyMode    │  │                 │                  │
│  └─────────────────┘  └─────────────────┘                  │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │  Collection     │  │  History        │  │    UI       │ │
│  │  Store          │  │  Store          │  │  Store      │ │
│  │                 │  │                 │  │             │ │
│  │  State:         │  │  State:         │  │  State:     │ │
│  │  - collections  │  │  - entries      │  │  - theme    │ │
│  │                 │  │  - maxEntries   │  │  - sidebar  │ │
│  └─────────────────┘  └─────────────────┘  │  - cmdPal   │ │
│                                              └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Request Store

**File**: `src/store/request-store.ts`

The primary store managing HTTP requests, tabs, responses, and the proxy mode.

### State

```typescript
interface RequestStore {
  tabs: RequestTab[];                          // Open request tabs
  activeTabId: string | null;                  // Currently active tab
  requests: Record<string, ApiRequest>;        // All request objects keyed by ID
  responses: Record<string, ApiResponse>;      // Response objects keyed by request ID
  loading: Record<string, boolean>;            // Loading state per request ID
  proxyMode: ProxyMode;                        // "direct" | "proxy" | "auto"
  cancelControllers: Record<string, AbortController>;  // Abort controllers per request
}
```

### Actions

| Action | Description |
|---|---|
| `createTab(request?)` | Creates a new tab with optional request overrides. Returns tab ID. |
| `closeTab(tabId)` | Closes a tab, removes associated request/response, switches to adjacent tab. |
| `setActiveTab(tabId)` | Switches to the specified tab. |
| `pinTab(tabId)` | Toggles pin state on a tab. |
| `updateRequest(id, updates)` | Partially updates a request object. |
| `updateMethod(id, method)` | Updates the HTTP method. |
| `updateUrl(id, url)` | Updates the URL. |
| `updateHeaders(id, headers)` | Replaces all headers. |
| `updateBody(id, type, content?)` | Updates body type and optional content. |
| `updateAuth(id, auth)` | Replaces auth configuration. |
| `updateParams(id, params)` | Replaces all query parameters. |
| `setResponse(id, response)` | Stores a response for a request. |
| `setLoading(id, loading)` | Sets loading state for a request. |
| `setProxyMode(mode)` | Changes proxy mode. |
| `cancelRequest(id)` | Aborts an in-flight request. |
| `getActiveRequest()` | Returns the request for the active tab. |
| `getActiveResponse()` | Returns the response for the active tab. |

### Default Request

When `createTab()` is called without arguments, it creates:

```typescript
{
  id: generateId(),
  name: "New Request",
  method: "GET",
  url: "",
  params: [],
  headers: [
    { id: generateId(), key: "Content-Type", value: "application/json", enabled: true }
  ],
  body: { type: "none" },
  auth: { type: "none" },
}
```

### Tab Management

- Closing a tab automatically switches to the nearest adjacent tab
- Tabs can be pinned (pinned tabs are visually distinguished)
- Active tab ID is always tracked for responsive UI updates

---

## 2. Environment Store

**File**: `src/store/environment-store.ts`

Manages environment variables for request URL/header substitution.

### State

```typescript
interface EnvironmentStore {
  environments: Environment[];                  // All environments
  activeEnvironmentId: string | null;           // Currently active environment
  globalVariables: Record<string, string>;      // Variables available in all envs
}
```

### Actions

| Action | Description |
|---|---|
| `createEnvironment(name)` | Creates a new environment. Returns ID. |
| `deleteEnvironment(id)` | Removes an environment. Deactivates if it was active. |
| `updateEnvironment(id, updates)` | Partially updates an environment. |
| `setActiveEnvironment(id)` | Sets the active environment. Pass `null` to deactivate. |
| `setVariable(envId, key, value)` | Sets a variable in an environment. |
| `deleteVariable(envId, key)` | Removes a variable from an environment. |
| `setGlobalVariable(key, value)` | Sets a global variable. |
| `getActiveVariables()` | Returns merged global + active environment variables. |
| `resolveVariables(template)` | Replaces `{{var}}` placeholders in a string. |

### Variable Resolution Priority

```
Global Variables  <  Active Environment Variables
```

Environment variables override global variables with the same name.

### Example

```typescript
// Set global
store.setGlobalVariable("PORT", "3000");

// Set in "Production" environment
store.setVariable(prodEnvId, "BASE_URL", "https://api.example.com");
store.setVariable(prodEnvId, "TOKEN", "abc123");

// Activate
store.setActiveEnvironment(prodEnvId);

// Resolve
store.resolveVariables("https://{{BASE_URL}}/users/{{TOKEN}}");
// → "https://api.example.com/users/abc123"
```

---

## 3. Collection Store

**File**: `src/store/collection-store.ts`

Manages API collections (groups of requests).

### State

```typescript
interface CollectionStore {
  collections: Collection[];
}
```

### Actions

| Action | Description |
|---|---|
| `createCollection(name)` | Creates a new collection. Returns ID. |
| `deleteCollection(id)` | Removes a collection. |
| `renameCollection(id, name)` | Renames a collection. |
| `getCollections()` | Returns all collections. |

### Collection Structure

```
Collection
├── name: string
├── description?: string
├── requests: ApiRequest[]
├── folders: Folder[]
│   ├── name: string
│   ├── requests: ApiRequest[]
│   └── folders: Folder[]  (recursive)
└── environments: Record<string, string>
```

---

## 4. History Store

**File**: `src/store/history-store.ts`

Tracks all API request/response pairs.

### State

```typescript
interface HistoryStore {
  entries: HistoryEntry[];
  maxEntries: number;  // Default: 500
}
```

### Actions

| Action | Description |
|---|---|
| `addEntry(entry)` | Adds a new history entry. Auto-prunes oldest if > maxEntries. |
| `clearHistory()` | Removes all history entries. |
| `deleteEntry(id)` | Removes a specific entry. |
| `searchHistory(query)` | Filters entries by URL or method. |

### Automatic Pruning

History is capped at `maxEntries` (default 500). When exceeded, oldest entries are removed:

```typescript
entries: [newEntry, ...state.entries].slice(0, state.maxEntries);
```

---

## 5. UI Store

**File**: `src/store/ui-store.ts`

Manages UI state (theme, sidebar, command palette).

### State

```typescript
interface UIStore {
  theme: Theme;                     // "light" | "dark" | "system"
  sidebarOpen: boolean;             // Sidebar visibility
  sidebarWidth: number;             // Sidebar width in pixels
  commandPaletteOpen: boolean;      // Command palette visibility
}
```

### Actions

| Action | Description |
|---|---|
| `setTheme(theme)` | Changes theme and applies to DOM. |
| `toggleSidebar()` | Toggles sidebar visibility. |
| `setSidebarWidth(width)` | Sets sidebar width. |
| `setCommandPaletteOpen(open)` | Opens/closes command palette. |
| `toggleCommandPalette()` | Toggles command palette. |

### Theme Application

```typescript
setTheme: (theme) => {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  if (theme === "system") {
    const sys = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark" : "light";
    root.classList.add(sys);
  } else {
    root.classList.add(theme);
  }
};
```

The theme provider (`src/components/theme-provider.tsx`) also persists the theme to localStorage.
