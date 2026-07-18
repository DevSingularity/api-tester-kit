# Folder Structure

## Complete Directory Layout

```
api-tester-kit/
├── .git/                          # Git repository
├── .gitignore                     # Git ignore rules
├── AGENTS.md                      # AI agent instructions
├── README.md                      # Project readme
├── components.json                # shadcn/ui configuration
├── eslint.config.mjs              # ESLint configuration
├── next.config.ts                 # Next.js configuration
├── next-env.d.ts                  # Next.js TypeScript declarations
├── package.json                   # Dependencies and scripts
├── pnpm-lock.yaml                 # pnpm lockfile
├── pnpm-workspace.yaml            # pnpm workspace config
├── postcss.config.mjs             # PostCSS configuration
├── tsconfig.json                  # TypeScript configuration
│
├── docs/                          # Documentation
│   ├── README.md                  # Documentation index
│   ├── ARCHITECTURE.md            # System architecture
│   ├── 01-SETUP.md                # Project setup
│   ├── 02-TYPES-AND-UTILS.md      # Types and utilities
│   ├── 03-STORES.md               # Zustand stores
│   ├── 04-UI-COMPONENTS.md        # UI components
│   ├── 05-API-ENGINE.md           # API engine and proxy
│   ├── 06-REQUEST-BUILDER.md      # Request builder features
│   ├── 07-RESPONSE-VIEWER.md      # Response viewer features
│   ├── 08-CODE-GENERATION.md      # Code generation
│   ├── 09-IMPORT-EXPORT.md        # Import/export functionality
│   ├── 10-SCRIPTING.md            # Script execution
│   ├── 11-COLLECTION-RUNNER.md    # Collection runner
│   ├── 12-PERSISTENCE.md          # Persistence layer
│   ├── 13-KEYBOARD-SHORTCUTS.md   # Keyboard shortcuts
│   ├── 14-FOLDER-STRUCTURE.md     # This file
│   ├── 15-GRAPHQL.md              # GraphQL playground
│   ├── 16-WEBSOCKET.md            # WebSocket client
│   └── 17-GRPC.md                 # gRPC client
│
├── public/                        # Static assets
│   ├── favicon.ico                # Favicon
│   ├── file.svg                   # File icon
│   ├── globe.svg                  # Globe icon
│   ├── next.svg                   # Next.js logo
│   ├── vercel.svg                 # Vercel logo
│   └── window.svg                 # Window icon
│
└── src/                           # Source code
    │
    ├── app/                       # Next.js App Router pages
    │   ├── globals.css            # Global styles + CSS variables
    │   ├── layout.tsx             # Root layout (providers, fonts)
    │   ├── page.tsx               # Main request builder page
    │   │
    │   ├── api/                   # API routes
    │   │   └── proxy/
    │   │       └── route.ts       # CORS proxy endpoint
    │   │
    │   ├── collections/
    │   │   └── page.tsx           # Collections management
    │   │
    │   ├── environments/
    │   │   └── page.tsx           # Environment variables
    │   │
    │   ├── graphql/
    │   │   └── page.tsx           # GraphQL playground
    │   │
    │   ├── grpc/
    │   │   └── page.tsx           # gRPC client
    │   │
    │   ├── history/
    │   │   └── page.tsx           # Request history
    │   │
    │   ├── runner/
    │   │   └── page.tsx           # Collection runner
    │   │
    │   ├── settings/
    │   │   └── page.tsx           # App settings
    │   │
    │   └── websocket/
    │       └── page.tsx           # WebSocket client
    │
    ├── components/                # Shared components
    │   ├── ui/                    # shadcn/ui components
    │   │   ├── badge.tsx
    │   │   ├── button.tsx
    │   │   ├── collapsible.tsx
    │   │   ├── dialog.tsx
    │   │   ├── dropdown-menu.tsx
    │   │   ├── input.tsx
    │   │   ├── label.tsx
    │   │   ├── popover.tsx
    │   │   ├── scroll-area.tsx
    │   │   ├── select.tsx
    │   │   ├── separator.tsx
    │   │   ├── switch.tsx
    │   │   ├── tabs.tsx
    │   │   ├── textarea.tsx
    │   │   └── tooltip.tsx
    │   │
    │   ├── code-generator-panel.tsx   # Code generation UI
    │   ├── command-palette.tsx        # Command palette (Ctrl+K)
    │   ├── import-export-dialog.tsx   # Import/export dialog
    │   ├── json-viewer.tsx            # Interactive JSON tree
    │   ├── method-selector.tsx        # HTTP method dropdown
    │   ├── query-provider.tsx         # TanStack Query provider
    │   ├── response-search.tsx        # Response body search
    │   ├── sidebar.tsx                # Main sidebar
    │   ├── theme-provider.tsx         # Theme management
    │   └── url-autocomplete.tsx       # URL suggestions
    │
    ├── features/                  # Feature modules
    │   ├── api-client/            # (future: API client logic)
    │   ├── collections/           # (future: collection features)
    │   ├── environments/          # (future: environment features)
    │   ├── history/               # (future: history features)
    │   │
    │   ├── request-builder/       # Request builder feature
    │   │   └── components/
    │   │       ├── auth-editor.tsx
    │   │       ├── body-editor.tsx
    │   │       ├── headers-editor.tsx
    │   │       ├── params-editor.tsx
    │   │       ├── request-panel.tsx
    │   │       ├── request-tabs.tsx
    │   │       ├── script-editor.tsx
    │   │       └── url-bar.tsx
    │   │
    │   └── response-viewer/       # Response viewer feature
    │       └── components/
    │           └── response-viewer.tsx
    │
    ├── hooks/                     # Custom React hooks
    │   └── use-keyboard-shortcuts.ts
    │
    ├── lib/                       # Core libraries
    │   ├── api-engine.ts          # HTTP client + proxy logic
    │   ├── cn.ts                  # className utility (duplicate)
    │   ├── code-generator.ts      # Multi-language code gen
    │   ├── import-export.ts       # Format converters
    │   ├── indexeddb-storage.ts   # Zustand IndexedDB adapter
    │   ├── script-runner.ts       # Script execution sandbox
    │   ├── storage.ts             # IndexedDB persistence
    │   └── utils.ts               # shadcn/ui cn() utility
    │
    ├── store/                     # Zustand stores
    │   ├── collection-store.ts    # Collection CRUD
    │   ├── environment-store.ts   # Environment variables
    │   ├── history-store.ts       # Request history
    │   ├── request-store.ts       # Requests, tabs, responses
    │   └── ui-store.ts            # UI state (theme, sidebar)
    │
    ├── types/                     # TypeScript types
    │   └── index.ts               # All type definitions
    │
    └── utils/                     # Utility functions
        └── index.ts               # Constants, formatters, helpers
```

## File Count Summary

| Directory | Files | Purpose |
|---|---|---|
| `src/app/` | 11 | Page routes + API |
| `src/components/` | 16 | Shared UI components |
| `src/components/ui/` | 15 | shadcn/ui primitives |
| `src/features/` | 9 | Feature-specific components |
| `src/hooks/` | 1 | Custom React hooks |
| `src/lib/` | 8 | Core libraries |
| `src/store/` | 5 | Zustand stores |
| `src/types/` | 1 | Type definitions |
| `src/utils/` | 1 | Utility functions |
| `docs/` | 18 | Documentation |
| Root | 10 | Config files |
| **Total** | **~95** | |

## Naming Conventions

### Files

| Type | Convention | Example |
|---|---|---|
| React Component | `kebab-case.tsx` | `url-bar.tsx` |
| TypeScript Module | `kebab-case.ts` | `api-engine.ts` |
| Page Route | `page.tsx` | `page.tsx` |
| API Route | `route.ts` | `route.ts` |
| CSS | `kebab-case.css` | `globals.css` |
| Test | `*.test.ts` | `utils.test.ts` |

### Directories

| Type | Convention | Example |
|---|---|---|
| Feature | `kebab-case` | `request-builder/` |
| Component | `kebab-case` | `json-viewer.tsx` |
| Store | `kebab-case-store.ts` | `request-store.ts` |
| Lib | `kebab-case.ts` | `api-engine.ts` |

### Exports

| Type | Convention | Example |
|---|---|---|
| Default Export | `PascalCase` | `export default function Home()` |
| Named Export | `camelCase` | `export function sendRequest()` |
| Type Export | `PascalCase` | `export interface ApiRequest` |
| Constant Export | `UPPER_SNAKE_CASE` | `export const HTTP_METHODS` |

## Adding New Features

1. **New Route**: Create `src/app/{route}/page.tsx`
2. **New Component**: Create in `src/components/` (shared) or `src/features/{feature}/components/` (feature-specific)
3. **New Store**: Create `src/store/{name}-store.ts`
4. **New Library**: Create `src/lib/{name}.ts`
5. **New Type**: Add to `src/types/index.ts`
6. **New Hook**: Create in `src/hooks/`
