import { create } from "zustand";
import type { Collection } from "@/types";
import { generateId } from "@/utils";

interface CollectionStore {
  collections: Collection[];

  createCollection: (name: string) => string;
  deleteCollection: (id: string) => void;
  renameCollection: (id: string, name: string) => void;
  getCollections: () => Collection[];
}

export const useCollectionStore = create<CollectionStore>((set, get) => ({
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

  getCollections: () => get().collections,
}));
