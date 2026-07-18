# Project Setup

## Prerequisites

- **Node.js**: v18+ (tested with v24.13.0)
- **pnpm**: v11+ (tested with v11.7.0)
- **Git**: Latest version

## Initialization

```bash
# Create project with Next.js App Router
pnpm create next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --use-pnpm \
  --turbopack

# Approve build scripts (required for sharp, unrs-resolver)
pnpm approve-builds sharp unrs-resolver
pnpm install
```

## Dependencies

### Core Dependencies

| Package | Purpose | Version |
|---|---|---|
| `next` | React framework | 16.2.10 |
| `react` | UI library | 19.2.4 |
| `react-dom` | React DOM renderer | 19.2.4 |
| `zustand` | State management | 5.0.14 |
| `@tanstack/react-query` | Server state management | 5.101.2 |
| `react-hook-form` | Form handling | 7.81.0 |
| `@hookform/resolvers` | Zod integration for RHF | 5.4.0 |
| `zod` | Schema validation | 4.4.3 |
| `lucide-react` | Icon library | 1.25.0 |
| `framer-motion` | Animations | 12.42.2 |
| `idb-keyval` | IndexedDB key-value storage | 6.3.0 |
| `clsx` | Conditional classnames | 2.1.1 |
| `tailwind-merge` | Tailwind class deduplication | 3.6.0 |
| `class-variance-authority` | Component variants | 0.7.1 |
| `cmdk` | Command palette | 1.1.1 |

### Radix UI Primitives

| Package | Purpose |
|---|---|
| `@radix-ui/react-dialog` | Modal dialogs |
| `@radix-ui/react-dropdown-menu` | Dropdown menus |
| `@radix-ui/react-tabs` | Tab components |
| `@radix-ui/react-tooltip` | Tooltips |
| `@radix-ui/react-select` | Select dropdowns |
| `@radix-ui/react-switch` | Toggle switches |
| `@radix-ui/react-collapsible` | Collapsible sections |
| `@radix-ui/react-scroll-area` | Custom scrollbars |
| `@radix-ui/react-separator` | Dividers |
| `@radix-ui/react-slot` | Component composition |
| `@radix-ui/react-popover` | Popover panels |
| `@radix-ui/react-label` | Form labels |
| `@radix-ui/react-context-menu` | Right-click menus |

### Dev Dependencies

| Package | Purpose |
|---|---|
| `tailwindcss` | CSS framework |
| `@tailwindcss/postcss` | PostCSS integration |
| `typescript` | TypeScript compiler |
| `eslint` | Linting |
| `eslint-config-next` | Next.js ESLint rules |

## Configuration Files

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "strict": true,
    "noEmit": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### `components.json` (shadcn/ui)
```json
{
  "style": "base-nova",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

### `next.config.ts`
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack enabled by default in dev
  // Server-side proxy for CORS handling
};

export default nextConfig;
```

## Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `pnpm dev` | Start development server with Turbopack |
| `build` | `pnpm build` | Production build |
| `start` | `pnpm start` | Start production server |
| `lint` | `pnpm lint` | Run ESLint |

## Post-Setup

1. Install shadcn/ui components:
   ```bash
   pnpm dlx shadcn@latest add button input tabs dialog select \
     separator scroll-area tooltip badge dropdown-menu \
     collapsible label switch popover
   ```

2. Create custom components:
   - `src/components/ui/textarea.tsx` (manual, not in shadcn registry for base-nova)

3. Set up globals.css with CSS variables for light/dark themes
