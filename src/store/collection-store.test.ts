import { describe, it, expect, beforeEach } from "vitest";
import { useCollectionStore } from "@/store/collection-store";

describe("CollectionStore", () => {
  beforeEach(() => {
    const store = useCollectionStore.getState();
    store.collections.forEach((c) => store.deleteCollection(c.id));
  });

  it("creates a collection", () => {
    const { createCollection } = useCollectionStore.getState();
    createCollection("My API");

    const state = useCollectionStore.getState();
    expect(state.collections.length).toBe(1);
    expect(state.collections[0].name).toBe("My API");
    expect(state.collections[0].requests).toEqual([]);
    expect(state.collections[0].folders).toEqual([]);
  });

  it("deletes a collection", () => {
    const { createCollection } = useCollectionStore.getState();
    const id = createCollection("To Delete");

    useCollectionStore.getState().deleteCollection(id);

    const state = useCollectionStore.getState();
    expect(state.collections.length).toBe(0);
  });

  it("renames a collection", () => {
    const { createCollection, renameCollection } = useCollectionStore.getState();
    const id = createCollection("Old Name");

    renameCollection(id, "New Name");

    const state = useCollectionStore.getState();
    expect(state.collections[0].name).toBe("New Name");
  });

  it("getCollections returns all collections", () => {
    const { createCollection, getCollections } = useCollectionStore.getState();
    createCollection("First");
    createCollection("Second");

    const collections = getCollections();
    expect(collections.length).toBe(2);
  });

  it("creates multiple collections with unique IDs", () => {
    const { createCollection } = useCollectionStore.getState();
    createCollection("A");
    createCollection("B");

    const state = useCollectionStore.getState();
    expect(state.collections[0].id).not.toBe(state.collections[1].id);
  });
});
