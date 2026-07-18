# GraphQL Playground

## Overview

Full-featured GraphQL playground with query execution, variable substitution, headers management, and query history.

## Route: `/graphql`

## Features

- **Query Editor**: Raw text editor with format and copy buttons
- **Variables Editor**: JSON editor for query variables
- **Headers Manager**: Add/remove custom headers with enable/disable toggle
- **Response Viewer**: Formatted JSON response display
- **Query History**: Tracks recent queries for quick replay
- **Environment Variables**: Supports `{{variable}}` syntax in URL, query, and variables

## UI Layout

```
┌─────────────────────────────────────────────────────────┐
│ [GraphQL] [URL Input...........................] [Run] │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────┐ ┌─────────────────────┐        │
│ │ [Copy] [Format]     │ │ [Variables] [Headers]│        │
│ │                     │ │                     │        │
│ │  query GetUsers {   │ │  {"id": 1}          │        │
│ │    users {          │ │                     │        │
│ │      id             │ │  OR                 │        │
│ │      name           │ │                     │        │
│ │      email          │ │  [Header] [Value]   │        │
│ │    }                │ │  [+] Add Header     │        │
│ │  }                  │ │                     │        │
│ │                     │ │                     │        │
│ │  42 chars           │ │                     │        │
│ └─────────────────────┘ └─────────────────────┘        │
├─────────────────────────────────────────────────────────┤
│ Response                                                │
│ ┌─────────────────────────────────────────────────────┐│
│ │ {                                                   ││
│ │   "data": {                                         ││
│ │     "users": [                                      ││
│ │       { "id": 1, "name": "John", ... }              ││
│ │     ]                                               ││
│ │   }                                                 ││
│ │ }                                                   ││
│ └─────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────┤
│ Recent Queries: [api.example.com] [graphql.test] ...   │
└─────────────────────────────────────────────────────────┘
```

## Usage

### Basic Query

1. Enter the GraphQL endpoint URL
2. Write your query in the editor
3. Click **Run** or press **Enter**
4. View the response below

### Using Variables

1. Click the **Variables** tab
2. Enter JSON variables:
   ```json
   {
     "userId": 123,
     "limit": 10
   }
   ```
3. Reference in query: `query GetUser($userId: ID!) { user(id: $userId) { ... } }`

### Custom Headers

1. Click the **Headers** tab
2. Add headers like `Authorization: Bearer <token>`
3. Headers support environment variables

### Format Query

Click the **Format** button to auto-format the query with proper indentation.

## Implementation

- **State**: Local React state (not persisted)
- **Request**: Direct `fetch()` to GraphQL endpoint
- **History**: Stored in component state (last 50 queries)
- **Environment**: Uses `useEnvironmentStore` for variable resolution

## Dependencies

- `@/store/environment-store` - Variable resolution
- `@/store/history-store` - History tracking
- `@/components/sidebar` - Navigation
- `@/components/ui/*` - UI components
