import { create } from "zustand";

type Theme = "light" | "dark" | "system";

interface UIStore {
  theme: Theme;
  sidebarOpen: boolean;
  sidebarWidth: number;
  commandPaletteOpen: boolean;

  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  theme: "dark",
  sidebarOpen: true,
  sidebarWidth: 260,
  commandPaletteOpen: false,

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
}));
