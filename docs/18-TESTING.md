# Testing

## Overview

The project uses Vitest as the testing framework with React Testing Library for component tests and jsdom as the test environment.

## Setup

### Dependencies

- `vitest` - Test runner and assertion library
- `@testing-library/react` - React component testing utilities
- `@testing-library/jest-dom` - Custom DOM matchers
- `@testing-library/user-event` - User interaction simulation
- `jsdom` - Browser environment simulation
- `fake-indexeddb` - IndexedDB mock for persistence tests

### Configuration

`vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
```

### Setup File

`src/test/setup.ts`:

- Imports `@testing-library/jest-dom/vitest` for matchers
- Imports `fake-indexeddb/auto` for IndexedDB mocking
- Mocks `window.matchMedia`
- Mocks `ResizeObserver` and `IntersectionObserver`

## Running Tests

```bash
# Run tests in watch mode
pnpm test

# Run tests once
pnpm test:run

# Run with coverage
pnpm test:coverage
```

## Test Structure

Tests are co-located with source files using the `.test.ts` or `.test.tsx` extension:

```
src/
├── utils/
│   ├── index.ts
│   └── utils.test.ts         # Utils tests
├── store/
│   ├── request-store.ts
│   ├── request-store.test.ts # Store tests
│   ├── environment-store.ts
│   └── environment-store.test.ts
└── components/
    ├── button.tsx
    └── button.test.tsx       # Component tests (future)
```

## Test Categories

### Unit Tests (utils, helpers)

```typescript
import { describe, it, expect } from "vitest";
import { formatBytes } from "@/utils";

describe("formatBytes", () => {
  it("formats 0 bytes", () => {
    expect(formatBytes(0)).toBe("0 B");
  });

  it("formats kilobytes", () => {
    expect(formatBytes(1024)).toBe("1 KB");
  });
});
```

### Store Tests (Zustand)

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { useRequestStore } from "@/store/request-store";

describe("RequestStore", () => {
  beforeEach(() => {
    const store = useRequestStore.getState();
    store.tabs.forEach((tab) => store.closeTab(tab.id));
  });

  it("creates a tab", () => {
    const { createTab } = useRequestStore.getState();
    createTab();

    const state = useRequestStore.getState();
    expect(state.tabs.length).toBe(1);
  });
});
```

### Component Tests (future)

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "./button";

describe("Button", () => {
  it("renders with text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeDefined();
  });
});
```

## Current Test Coverage

| Module | Tests | Status |
|---|---|---|
| `src/utils/` | 18 tests | Complete |
| `src/store/request-store` | 12 tests | Complete |
| `src/store/environment-store` | 10 tests | Complete |
| `src/store/collection-store` | 5 tests | Complete |
| `src/store/history-store` | 7 tests | Complete |
| **Total** | **54 tests** | |

## Writing New Tests

### Best Practices

1. **Co-locate tests** with source files
2. **Use `describe` blocks** to group related tests
3. **Use `beforeEach`** to reset state between tests
4. **Test behavior, not implementation**
5. **Use `screen` queries** for component tests
6. **Mock external dependencies** in setup file

### Common Patterns

```typescript
// Testing async operations
it("loads data", async () => {
  const { loadData } = useMyStore.getState();
  await loadData();
  
  const state = useMyStore.getState();
  expect(state.data).toBeDefined();
});

// Testing Zustand stores
it("updates state", () => {
  const { setValue } = useMyStore.getState();
  setValue("test");
  
  const state = useMyStore.getState();
  expect(state.value).toBe("test");
});

// Testing user interactions
it("handles click", async () => {
  const user = userEvent.setup();
  render(<Button onClick={mockFn}>Click</Button>);
  
  await user.click(screen.getByText("Click"));
  expect(mockFn).toHaveBeenCalled();
});
```

## Coverage Reports

Generate coverage reports:

```bash
pnpm test:coverage
```

Reports are generated in `coverage/` directory with:
- `text` - Console output
- `json` - JSON report
- `html` - HTML report
