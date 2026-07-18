"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRequestStore } from "@/store/request-store";
import { useUIStore } from "@/store/ui-store";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Settings,
  FolderOpen,
  Globe,
  History,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  category: string;
}

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const { createTab } = useRequestStore();
  const { theme, setTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const items: CommandItem[] = useMemo(
    () => [
      {
        id: "new-request",
        label: "New Request",
        icon: <Plus className="size-4" />,
        action: () => {
          createTab();
          setCommandPaletteOpen(false);
        },
        category: "General",
      },
      {
        id: "collections",
        label: "Go to Collections",
        icon: <FolderOpen className="size-4" />,
        action: () => {
          window.location.href = "/collections";
        },
        category: "Navigation",
      },
      {
        id: "environments",
        label: "Go to Environments",
        icon: <Globe className="size-4" />,
        action: () => {
          window.location.href = "/environments";
        },
        category: "Navigation",
      },
      {
        id: "history",
        label: "Go to History",
        icon: <History className="size-4" />,
        action: () => {
          window.location.href = "/history";
        },
        category: "Navigation",
      },
      {
        id: "settings",
        label: "Go to Settings",
        icon: <Settings className="size-4" />,
        action: () => {
          window.location.href = "/settings";
        },
        category: "Navigation",
      },
      {
        id: "toggle-theme",
        label: `Switch to ${theme === "dark" ? "Light" : "Dark"} Theme`,
        icon: theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />,
        action: () => {
          setTheme(theme === "dark" ? "light" : "dark");
          setCommandPaletteOpen(false);
        },
        category: "Preferences",
      },
    ],
    [createTab, setCommandPaletteOpen, theme, setTheme]
  );

  const filtered = useMemo(() => {
    if (!query) return items;
    const q = query.toLowerCase();
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [items, query]);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    setSelectedIndex(0);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "p") {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if (e.key === "Escape" && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  const handleDialogKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      filtered[selectedIndex].action();
    }
  };

  return (
    <Dialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <DialogContent className="sm:max-w-lg p-0 gap-0" onKeyDown={handleDialogKeyDown}>
        <div className="border-b border-border">
          <Input
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Type a command or search..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-10 text-sm"
            autoFocus
          />
        </div>
        <div className="max-h-80 overflow-auto py-1">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No results found
            </div>
          ) : (
            filtered.map((item, index) => (
              <button
                key={item.id}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors",
                index === selectedIndex && "bg-muted"
                )}
                onClick={item.action}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span className="text-muted-foreground">{item.icon}</span>
                <span className="flex-1 text-left">{item.label}</span>
                <span className="text-[10px] text-muted-foreground">
                  {item.category}
                </span>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
