# Persistence Layer

## Overview

The persistence layer provides offline-first data storage using IndexedDB via the `idb-keyval` library. It wraps key-value operations with error handling and a prefixed namespace. All Zustand stores are now wired with automatic persistence.

## Files

- `src/lib/storage.ts` - Low-level storage functions
- `src/lib/indexeddb-storage.ts` - Zustand-compatible storage adapter

## Architecture

```
┌─────────────────────────────────────────────────┐
│                 Application Code                 │
│                                                  │
│  Zustand Store (useCollectionStore)              │
│  useEnvironmentStore                             │
│  useHistoryStore                                 │
│  useRequestStore                                 │
│  useUIStore                                      │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│          Zustand persist Middleware               │
│                                                  │
│  Partialize: Only persist serializable state     │
│  Storage: IndexedDB adapter (JSON serialized)    │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│         IndexedDB Storage Adapter                │
│         (indexeddb-storage.ts)                   │
│                                                  │
│  Wraps idb-keyval for Zustand's StateStorage     │
│  Handles JSON serialization/deserialization      │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│                 IndexedDB                        │
│                                                  │
│  Database: (managed by idb-keyval)              │
│  Store: keyval                                   │
│                                                  │
│  Keys (with prefix):                             │
│    api-tester:request-store                      │
│    api-tester:environment-store                  │
│    api-tester:collection-store                   │
│    api-tester:history-store                      │
│    api-tester:ui-store                           │
└─────────────────────────────────────────────────┘
```

## Zustand Persistence Integration

All stores use Zustand's `persist` middleware with the custom IndexedDB adapter:

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { indexedDBStorage } from "@/lib/indexeddb-storage";

interface MyStore {
  data: Item[];
  addItem: (item: Item) => void;
}

interface PersistedStore {
  data: Item[];
}

export const useMyStore = create<MyStore>()(
  persist(
    (set, get) => ({
      data: [],
      addItem: (item) => set((state) => ({ data: [...state.data, item] })),
    }),
    {
      name: "my-store",
      storage: indexedDBStorage as unknown as Parameters<typeof persist>[1]["storage"],
      partialize: (state: MyStore): PersistedStore => ({
        data: state.data,
      }),
    }
  )
);
```

## What Gets Persisted

| Store | Persisted State | Excluded (Runtime) |
|---|---|---|
| `request-store` | tabs, activeTabId, requests, proxyMode | responses, loading, cancelControllers |
| `environment-store` | environments, activeEnvironmentId, globalVariables | - |
| `collection-store` | collections | - |
| `history-store` | entries, maxEntries | - |
| `ui-store` | theme, sidebarOpen, sidebarWidth | commandPaletteOpen |

## Low-Level Storage API (storage.ts)

### `saveToStorage<T>(key: string, value: T): Promise<void>`

Stores a value in IndexedDB.

```typescript
await saveToStorage("collections", [
  { id: "1", name: "My Collection", ... },
]);
```

**Key format**: `api-tester:{key}`

---

### `loadFromStorage<T>(key: string): Promise<T | undefined>`

Retrieves a value from IndexedDB.

```typescript
const collections = await loadFromStorage<Collection[]>("collections");
```

Returns `undefined` if key doesn't exist or an error occurs.

---

### `removeFromStorage(key: string): Promise<void>`

Deletes a specific key from IndexedDB.

```typescript
await removeFromStorage("collections");
```

---

### `clearStorage(): Promise<void>`

Removes all keys with the `api-tester:` prefix.

```typescript
await clearStorage();
// All API Tester data is removed
```

**Safety**: Only removes keys with the `api-tester:` prefix.

---

### `getAllKeys(): Promise<string[]>`

Returns all stored keys (without the prefix).

```typescript
const keys = await getAllKeys();
// ["request-store", "environment-store", ...]
```

## IndexedDB Storage Adapter (indexeddb-storage.ts)

The adapter implements Zustand's `StateStorage` interface:

```typescript
import type { StateStorage } from "zustand/middleware";
import { get, set, del } from "idb-keyval";

const PREFIX = "api-tester:";

export const indexedDBStorage: StateStorage = {
  getItem: async (name: string) => {
    return await get<string>(`${PREFIX}${name}`) ?? null;
  },
  setItem: async (name: string, value: string) => {
    await set(`${PREFIX}${name}`, value);
  },
  removeItem: async (name: string) => {
    await del(`${PREFIX}${name}`);
  },
};
```

Wrapped with `createJSONStorage` for automatic serialization:

```typescript
export const indexedDBStorage = createJSONStorage(() => createIndexedDBStorage());
```

## Error Handling

All operations are wrapped in try/catch with console.error logging:

```typescript
export async function saveToStorage<T>(key: string, value: T): Promise<void> {
  try {
    await set(`${PREFIX}${key}`, value);
  } catch (error) {
    console.error(`Failed to save ${key}:`, error);
  }
}
```

Errors are logged but not thrown, ensuring the application remains functional even if storage is unavailable.

## Offline-First Strategy

The application follows an offline-first approach:

1. **Load**: On startup, Zustand's persist middleware loads data from IndexedDB
2. **Modify**: User interactions modify Zustand state
3. **Persist**: Zustand automatically saves changes to IndexedDB (debounced)
4. **Sync**: (Future) Sync with cloud backend when online

## Browser Support

| Browser | IndexedDB | Status |
|---|---|---|
| Chrome 24+ | ✅ | Full support |
| Firefox 16+ | ✅ | Full support |
| Safari 10+ | ✅ | Full support |
| Edge 12+ | ✅ | Full support |

## Future Enhancements

1. **Encryption**: Encrypt sensitive data (API keys, tokens)
2. **Cloud Sync**: Sync with a backend API
3. **Conflict Resolution**: Handle concurrent edits across devices
4. **Migration**: Version-based schema migrations for data format changes
