import { get, set, del } from "idb-keyval";
import { createJSONStorage, type StateStorage } from "zustand/middleware";

const PREFIX = "api-tester:";

const createIndexedDBStorage = (): StateStorage => ({
  getItem: async (name: string) => {
    try {
      const value = await get<string>(`${PREFIX}${name}`);
      return value ?? null;
    } catch {
      return null;
    }
  },

  setItem: async (name: string, value: string) => {
    try {
      await set(`${PREFIX}${name}`, value);
    } catch (error) {
      console.error(`Failed to save ${name}:`, error);
    }
  },

  removeItem: async (name: string) => {
    try {
      await del(`${PREFIX}${name}`);
    } catch (error) {
      console.error(`Failed to remove ${name}:`, error);
    }
  },
});

export const indexedDBStorage = createJSONStorage(() => createIndexedDBStorage());
