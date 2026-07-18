import { create } from "zustand";
import type { HistoryEntry } from "@/types";
import { generateId } from "@/utils";

interface HistoryStore {
  entries: HistoryEntry[];
  maxEntries: number;

  addEntry: (entry: Omit<HistoryEntry, "id" | "timestamp">) => void;
  clearHistory: () => void;
  deleteEntry: (id: string) => void;
  searchHistory: (query: string) => HistoryEntry[];
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
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
}));
