import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Collection, ApiRequest } from "@/types";
import { generateId } from "@/utils";
import { indexedDBStorage } from "@/lib/indexeddb-storage";

interface CollectionStore {
  collections: Collection[];

  createCollection: (name: string) => string;
  deleteCollection: (id: string) => void;
  renameCollection: (id: string, name: string) => void;
  addRequestToCollection: (collectionId: string, request: ApiRequest) => void;
  addRequestsToCollection: (collectionId: string, requests: ApiRequest[]) => void;
  getCollections: () => Collection[];
}

export const useCollectionStore = create<CollectionStore>()(
  persist(
    (set, get) => ({
      collections: [],

      createCollection: (name) => {
        const collection: Collection = {
          id: generateId(),
          name,
          requests: [],
          folders: [],
          environments: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          collections: [...state.collections, collection],
        }));

        return collection.id;
      },

      deleteCollection: (id) =>
        set((state) => ({
          collections: state.collections.filter((c) => c.id !== id),
        })),

      renameCollection: (id, name) =>
        set((state) => ({
          collections: state.collections.map((c) =>
            c.id === id
              ? { ...c, name, updatedAt: new Date().toISOString() }
              : c
          ),
        })),

  addRequestToCollection: (collectionId, request) =>
    set((state) => ({
      collections: state.collections.map((c) =>
        c.id === collectionId
          ? {
              ...c,
              requests: [...c.requests, { ...request, collectionId }],
              updatedAt: new Date().toISOString(),
            }
          : c
      ),
    })),

  addRequestsToCollection: (collectionId, requests) =>
    set((state) => ({
      collections: state.collections.map((c) =>
        c.id === collectionId
          ? {
              ...c,
              requests: [
                ...c.requests,
                ...requests.map((r) => ({ ...r, collectionId })),
              ],
              updatedAt: new Date().toISOString(),
            }
          : c
      ),
    })),

      getCollections: () => get().collections,
    }),
    {
      name: "collection-store",
      storage: indexedDBStorage as unknown as Parameters<typeof persist>[1]["storage"],
    }
  )
);
