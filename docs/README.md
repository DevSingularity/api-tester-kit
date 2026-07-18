# API Tester Kit - Documentation

A modern, production-grade API testing platform built with Next.js 16, React 19, TypeScript, and Tailwind CSS v4. Designed as a Postman alternative with a clean UI inspired by Linear, Raycast, Vercel Dashboard, and Arc Browser.

## Quick Links

| Document | Description |
|---|---|
| [Architecture](./ARCHITECTURE.md) | System architecture, design patterns, and data flow |
| [Setup](./01-SETUP.md) | Project initialization, dependencies, and configuration |
| [Types & Utils](./02-TYPES-AND-UTILS.md) | TypeScript types, utility functions, and constants |
| [State Management](./03-STORES.md) | Zustand stores (request, environment, collection, history, UI) |
| [UI Components](./04-UI-COMPONENTS.md) | Layout, sidebar, command palette, and shared components |
| [API Engine](./05-API-ENGINE.md) | HTTP client, proxy layer, variable substitution |
| [Request Builder](./06-REQUEST-BUILDER.md) | Method selector, URL bar, params/headers/body/auth tabs |
| [Response Viewer](./07-RESPONSE-VIEWER.md) | Response display, JSON viewer, search, code generation |
| [Code Generation](./08-CODE-GENERATION.md) | Multi-language code snippet generation |
| [Import & Export](./09-IMPORT-EXPORT.md) | Postman, OpenAPI, cURL, HAR, JSON, YAML, Markdown |
| [Scripting](./10-SCRIPTING.md) | Pre/post request scripts, assertion framework |
| [Collection Runner](./11-COLLECTION-RUNNER.md) | Sequential request execution, results tracking |
| [Persistence](./12-PERSISTENCE.md) | IndexedDB storage layer for offline support |
| [Keyboard Shortcuts](./13-KEYBOARD-SHORTCUTS.md) | All keyboard shortcuts and command palette |
| [Folder Structure](./14-FOLDER-STRUCTURE.md) | Complete project directory layout |
| [GraphQL](./15-GRAPHQL.md) | GraphQL playground features |
| [WebSocket](./16-WEBSOCKET.md) | WebSocket client features |
| [gRPC](./17-GRPC.md) | gRPC client features |
| [Testing](./18-TESTING.md) | Vitest testing setup and test structure |

## Tech Stack

| Category | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.10 |
| UI Library | React | 19.2.4 |
| Language | TypeScript | 5.9.3 |
| Styling | Tailwind CSS | 4.3.3 |
| Components | shadcn/ui (base-nova) | 4.13.0 |
| State | Zustand | 5.0.14 |
| Data Fetching | TanStack Query | 5.101.2 |
| Forms | React Hook Form | 7.81.0 |
| Validation | Zod | 4.4.3 |
| Icons | Lucide React | 1.25.0 |
| Animations | Framer Motion | 12.42.2 |
| Persistence | idb-keyval | 6.3.0 |
| Package Manager | pnpm | 11.7.0 |

## Routes

| Route | Purpose | Status |
|---|---|---|
| `/` | Main HTTP request builder | Complete |
| `/collections` | Collection management with CRUD | Complete |
| `/environments` | Environment variable management | Complete |
| `/history` | Request history with search | Complete |
| `/settings` | Theme and proxy settings | Complete |
| `/runner` | Collection runner with sequential execution | Complete |
| `/graphql` | GraphQL playground | Complete |
| `/websocket` | WebSocket client | Complete |
| `/grpc` | gRPC client | Complete |
| `/api/proxy` | CORS proxy API route | Complete |

## Running

```bash
# Development
pnpm dev

# Production build
pnpm build && pnpm start

# Lint
pnpm lint

# Test
pnpm test:run
```
