import { create } from "zustand";
import { persist } from "zustand/middleware";
import { indexedDBStorage } from "@/lib/indexeddb-storage";

type Theme = "light" | "dark" | "system";

interface UIStore {
  theme: Theme;
  sidebarOpen: boolean;
  sidebarWidth: number;
  commandPaletteOpen: boolean;
  panelSplitPercent: number;

  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
  setPanelSplitPercent: (percent: number) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      theme: "dark" as Theme,
      sidebarOpen: true,
      sidebarWidth: 260,
      commandPaletteOpen: false,
      panelSplitPercent: 50,

      setTheme: (theme) => {
        set({ theme });
        if (typeof document !== "undefined") {
          const root = document.documentElement;
          root.classList.remove("light", "dark");
          if (theme === "system") {
            const sys = window.matchMedia("(prefers-color-scheme: dark)").matches
              ? "dark"
              : "light";
            root.classList.add(sys);
          } else {
            root.classList.add(theme);
          }
        }
      },

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarWidth: (width) => set({ sidebarWidth: width }),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      toggleCommandPalette: () =>
        set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
      setPanelSplitPercent: (percent) => set({ panelSplitPercent: percent }),
    }),
    {
      name: "ui-store",
      storage: indexedDBStorage as unknown as Parameters<typeof persist>[1]["storage"],
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        sidebarWidth: state.sidebarWidth,
        panelSplitPercent: state.panelSplitPercent,
      }),
    }
  )
);
