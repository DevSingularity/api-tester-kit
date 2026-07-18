# Persistence Layer

## Overview

The persistence layer provides offline-first data storage using IndexedDB via the `idb-keyval` library. It wraps key-value operations with error handling and a prefixed namespace.

## File: `src/lib/storage.ts`

## Architecture

```
┌─────────────────────────────────────────────────┐
│                 Application Code                 │
│                                                  │
│  saveToStorage("collections", collections)       │
│  loadFromStorage<Collection[]>("collections")    │
│  removeFromStorage("collections")                │
│  clearStorage()                                  │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│              Storage Layer (storage.ts)           │
│                                                  │
│  Prefix: "api-tester:"                          │
│  Library: idb-keyval (IndexedDB wrapper)         │
│                                                  │
│  saveToStorage<T>(key, value)                    │
│  loadFromStorage<T>(key) → T | undefined         │
│  removeFromStorage(key)                          │
│  clearStorage()                                  │
│  getAllKeys() → string[]                         │
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
│    api-tester:collections                        │
│    api-tester:environments                       │
│    api-tester:history                            │
│    api-tester:settings                           │
└─────────────────────────────────────────────────┘
```

## API

### `saveToStorage<T>(key: string, value: T): Promise<void>`

Stores a value in IndexedDB.

```typescript
await saveToStorage("collections", [
  { id: "1", name: "My Collection", ... },
  { id: "2", name: "Another", ... },
]);
```

**Key format**: `api-tester:{key}`

---

### `loadFromStorage<T>(key: string): Promise<T | undefined>`

Retrieves a value from IndexedDB.

```typescript
const collections = await loadFromStorage<Collection[]>("collections");
if (collections) {
  // Use collections
}
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

**Safety**: Only removes keys with the `api-tester:` prefix, leaving other IndexedDB data intact.

---

### `getAllKeys(): Promise<string[]>`

Returns all stored keys (without the prefix).

```typescript
const keys = await getAllKeys();
// ["collections", "environments", "history"]
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

Errors are logged but not thrown, ensuring the application remains functional even if storage is unavailable (e.g., in private browsing mode).

## Storage Keys

| Key | Type | Description |
|---|---|---|
| `collections` | `Collection[]` | All API collections |
| `environments` | `Environment[]` | All environments |
| `history` | `HistoryEntry[]` | Request history |
| `settings` | `Record<string, unknown>` | User preferences |

## idb-keyval Library

The `idb-keyval` library provides a simple API over IndexedDB:

```typescript
import { get, set, del, keys } from "idb-keyval";

// Basic operations
await set("key", value);
const value = await get("key");
await del("key");
const allKeys = await keys();
```

**Features**:
- Promise-based API
- Automatic IndexedDB creation
- Works in all modern browsers
- ~1KB gzipped

## Browser Support

| Browser | IndexedDB | Status |
|---|---|---|
| Chrome 24+ | ✅ | Full support |
| Firefox 16+ | ✅ | Full support |
| Safari 10+ | ✅ | Full support |
| Edge 12+ | ✅ | Full support |
| IE 10+ | ⚠️ | Partial (no Promises) |

## Offline-First Strategy

The application follows an offline-first approach:

1. **Load**: On startup, load data from IndexedDB into Zustand stores
2. **Modify**: User interactions modify Zustand state
3. **Persist**: After modifications, save back to IndexedDB
4. **Sync**: (Future) Sync with cloud backend when online

### Current Implementation

Currently, the stores initialize with empty arrays. The persistence layer is ready for integration but not yet wired into the stores. To enable persistence:

```typescript
// In store initialization
const useCollectionStore = create<CollectionStore>((set, get) => ({
  collections: await loadFromStorage<Collection[]>("collections") ?? [],
  // ...
}));

// After mutations
set((state) => {
  const newCollections = [...state.collections, newCollection];
  saveToStorage("collections", newCollections);
  return { collections: newCollections };
});
```

## Future Enhancements

1. **Auto-save**: Debounced persistence after each state change
2. **Migration**: Version-based schema migrations
3. **Encryption**: Encrypt sensitive data (API keys, tokens)
4. **Cloud Sync**: Sync with a backend API
5. **Conflict Resolution**: Handle concurrent edits across devices
