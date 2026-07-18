# Request Diff

## Overview

Compare two open requests side-by-side to identify differences in method, URL, headers, and body. Useful for debugging API changes or comparing request configurations.

## Access

Click the **Diff** button in the sidebar, or use the keyboard shortcut `Ctrl+D`.

## Features

- **Side-by-side comparison** of two requests
- **Color-coded differences**: green for additions, red for removals, amber for modifications
- **Stats summary**: Shows count of added, removed, and modified lines
- **Copy diff**: Copy the diff output for sharing or documentation

## UI Layout

```
┌──────────────────────────────────────────────────────┐
│ Request Diff                                         │
├──────────────────────────────────────────────────────┤
│ Left (Original): [Request A ▼]  →  Right (Modified): [Request B ▼] │
├──────────────────────────────────────────────────────┤
│ +2 added  -1 removed  ~3 modified        [Copy]     │
├──────────────────────────────────────────────────────┤
│ Method                                               │
│ ┌─────────────────────┬─────────────────────┐       │
│ │ GET                 │ POST                │       │
│ └─────────────────────┴─────────────────────┘       │
│                                                      │
│ URL                                                  │
│ ┌─────────────────────┬─────────────────────┐       │
│ │ - /api/v1/users     │ + /api/v2/users     │       │
│ └─────────────────────┴─────────────────────┘       │
│                                                      │
│ Headers                                              │
│ ┌─────────────────────┬─────────────────────┐       │
│ │ Content-Type: json  │ Content-Type: json  │       │
│ │ - Auth: Bearer abc  │ + Auth: Bearer xyz  │       │
│ └─────────────────────┴─────────────────────┘       │
└──────────────────────────────────────────────────────┘
```

## Comparison Areas

| Area | What's Compared |
|---|---|
| Method | HTTP method (GET, POST, etc.) |
| URL | Full request URL |
| Headers | All headers with key-value pairs |
| Body | Raw body content (line by line) |

## Implementation

- **State**: Component-local state (left/right tab selection)
- **Diff Algorithm**: Line-by-line comparison for body, key-value comparison for headers
- **Rendering**: Two-column layout with color coding

## Dependencies

- `@/store/request-store` - Access to open tabs and requests
- `@/components/ui/*` - UI components
