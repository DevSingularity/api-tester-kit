import { create } from "zustand";
import { persist } from "zustand/middleware";
import { indexedDBStorage } from "@/lib/indexeddb-storage";

export interface PerformanceEntry {
  id: string;
  endpointKey: string;
  method: string;
  url: string;
  status: number;
  time: number;
  ttfb: number;
  download: number;
  size: number;
  timestamp: string;
}

interface PerformanceStore {
  entries: PerformanceEntry[];
  addEntry: (entry: Omit<PerformanceEntry, "id">) => void;
  getEntriesForEndpoint: (endpointKey: string) => PerformanceEntry[];
  getRecentEntries: (limit?: number) => PerformanceEntry[];
  clearEntries: () => void;
}

export function normalizeEndpoint(url: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.hostname}${u.pathname}`;
  } catch {
    return url;
  }
}

export const usePerformanceStore = create<PerformanceStore>()(
  persist(
    (set, get) => ({
      entries: [],

      addEntry: (entry) => {
        const fullEntry: PerformanceEntry = { id: crypto.randomUUID(), ...entry };
        set((state) => ({
          entries: [fullEntry, ...state.entries].slice(0, 200),
        }));
      },

      getEntriesForEndpoint: (endpointKey) => {
        return get().entries.filter((e) => e.endpointKey === endpointKey).slice(0, 20);
      },

      getRecentEntries: (limit = 10) => get().entries.slice(0, limit),

      clearEntries: () => set({ entries: [] }),
    }),
    {
      name: "performance-store",
      storage: indexedDBStorage as unknown as Parameters<typeof persist>[1]["storage"],
    }
  )
);
