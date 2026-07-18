import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { HistoryEntry } from "@/types";
import { generateId } from "@/utils";
import { indexedDBStorage } from "@/lib/indexeddb-storage";

interface HistoryStore {
  entries: HistoryEntry[];
  maxEntries: number;

  addEntry: (entry: Omit<HistoryEntry, "id" | "timestamp">) => void;
  clearHistory: () => void;
  deleteEntry: (id: string) => void;
  searchHistory: (query: string) => HistoryEntry[];
}

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set, get) => ({
      entries: [],
      maxEntries: 500,

      addEntry: (entry) => {
        const newEntry: HistoryEntry = {
          ...entry,
          id: generateId(),
          timestamp: new Date().toISOString(),
        };

        set((state) => ({
          entries: [newEntry, ...state.entries].slice(0, state.maxEntries),
        }));
      },

      clearHistory: () => set({ entries: [] }),

      deleteEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        })),

      searchHistory: (query) => {
        const q = query.toLowerCase();
        return get().entries.filter(
          (e) =>
            e.request.url.toLowerCase().includes(q) ||
            e.request.method.toLowerCase().includes(q)
        );
      },
    }),
    {
      name: "history-store",
      storage: indexedDBStorage as unknown as Parameters<typeof persist>[1]["storage"],
    }
  )
);
