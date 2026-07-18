# Architecture

## Overview

API Tester Kit follows a **feature-based architecture** with clear separation of concerns. The application is built as a single-page application (SPA) using Next.js App Router with client-side state management via Zustand.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │  Sidebar  │  │ Request      │  │  Response Viewer      │  │
│  │  (Nav)    │  │ Builder      │  │  (Body/Headers/Code)  │  │
│  │           │  │ (URL/Tabs)   │  │                       │  │
│  │           │  │ (Params)     │  │  JSON Viewer          │  │
│  │           │  │ (Headers)    │  │  Search               │  │
│  │           │  │ (Body)       │  │  Code Generator       │  │
│  │           │  │ (Auth)       │  │                       │  │
│  │           │  │ (Scripts)    │  │                       │  │
│  └──────────┘  └──────────────┘  └───────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   Zustand Stores                      │   │
│  │  request-store │ env-store │ collection │ history │ ui│   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   Lib Layer                           │   │
│  │  api-engine │ code-generator │ import-export │        │   │
│  │  script-runner │ storage │ utils                      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ fetch (proxy or direct)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js API Route                         │
│                    /api/proxy                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Receives: { method, url, headers, body }            │   │
│  │  Forwards to target API                              │   │
│  │  Returns: { status, headers, body, time, size }      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   Target API     │
                    │  (localhost/     │
                    │   remote/cloud)  │
                    └──────────────────┘
```

## Data Flow

### Request Execution Flow

```
User clicks "Send"
       │
       ▼
┌─────────────────┐
│ 1. Resolve      │  Replace {{variables}} in URL, headers, body
│    Variables    │  using active environment
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. Build        │  Construct final URL with query params
│    Request      │  Apply auth headers (Bearer, Basic, API Key)
└────────┬────────┘  Serialize body (JSON, form-data, etc.)
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ 3. Proxy Mode?  │─Yes─▶│ /api/proxy      │
│                 │     │ (Server-side     │
│                 │     │  fetch)          │
└────────┬────────┘     └────────┬────────┘
         │ No                     │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│ 4. Direct       │     │ 5. Target API   │
│    Browser      │     │    Response     │
│    fetch()      │     │                 │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     ▼
         ┌─────────────────┐
         │ 6. Parse        │  Extract status, headers, body
         │    Response     │  Calculate time and size
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │ 7. Update       │  Store response in Zustand
         │    State        │  Add to history
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │ 8. Render       │  Display in Response Viewer
         │    Response     │  JSON Viewer, Headers, Code
         └─────────────────┘
```

### State Management Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      Zustand Stores                           │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Request     │  │ Environment │  │ Collection  │         │
│  │  Store       │  │ Store       │  │ Store       │         │
│  │             │  │             │  │             │         │
│  │  - tabs     │  │  - envs     │  │  - collections│       │
│  │  - requests │  │  - active   │  │  - CRUD     │         │
│  │  - responses│  │  - vars     │  │             │         │
│  │  - loading  │  │  - resolve  │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐                           │
│  │  History     │  │    UI       │                           │
│  │  Store       │  │  Store      │                           │
│  │             │  │             │                           │
│  │  - entries  │  │  - theme    │                           │
│  │  - search   │  │  - sidebar  │                           │
│  │  - clear    │  │  - cmd pal  │                           │
│  └─────────────┘  └─────────────┘                           │
└──────────────────────────────────────────────────────────────┘
```

## Design Patterns

### 1. Feature-Based Architecture
Each feature has its own directory under `src/features/`:
```
src/features/
  api-client/       - API client logic
  collections/      - Collection management
  environments/     - Environment variables
  history/          - Request history
  request-builder/  - Request editor UI
  response-viewer/  - Response display UI
```

### 2. Composition Over Inheritance
Components are composed from small, reusable pieces rather than using class inheritance.

### 3. Hooks for State Logic
All complex state logic is extracted into custom hooks:
- `useKeyboardShortcuts` - Global keyboard shortcuts
- `useTheme` - Theme management

### 4. Server-Side Proxy
The `/api/proxy` route handles CORS by proxying requests through the server, avoiding browser CORS restrictions.

### 5. Optimistic UI Updates
Tab operations (create, close, switch) update the UI immediately before any async operations.

## Performance Considerations

1. **Lazy Loading**: Pages are statically generated where possible
2. **Code Splitting**: Each route is a separate chunk
3. **Memoization**: Zustand selectors prevent unnecessary re-renders
4. **Debounced Search**: History and URL autocomplete use debounced input
5. **Virtualized Lists**: History page handles large datasets efficiently

## Security Model

1. **No Secrets in Client**: API keys and tokens are only sent through the proxy
2. **Proxy Layer**: Server-side proxy hides target URLs and credentials
3. **Input Validation**: All user input is validated with TypeScript types
4. **XSS Prevention**: React's built-in XSS protection + DOMPurify for HTML rendering
5. **CORS Handling**: Proxy route manages CORS headers server-side
