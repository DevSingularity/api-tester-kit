"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRequestStore } from "@/store/request-store";
import { useUIStore } from "@/store/ui-store";
import { useHistoryStore } from "@/store/history-store";
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
  Webhook,
  Database,
  Play,
  PanelLeft,
  Copy,
  Trash2,
  Wifi,
  Zap,
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
  const { commandPaletteOpen, setCommandPaletteOpen, toggleSidebar } = useUIStore();
  const { createTab, duplicateTab, proxyMode, setProxyMode } = useRequestStore();
  const { clearHistory } = useHistoryStore();
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
        id: "duplicate-tab",
        label: "Duplicate Tab",
        icon: <Copy className="size-4" />,
        action: () => {
          const state = useRequestStore.getState();
          const activeTab = state.activeTabId;
          if (activeTab) {
            duplicateTab(activeTab);
          }
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
        id: "graphql",
        label: "Go to GraphQL",
        icon: <Zap className="size-4" />,
        action: () => {
          window.location.href = "/graphql";
        },
        category: "Navigation",
      },
      {
        id: "websocket",
        label: "Go to WebSocket",
        icon: <Wifi className="size-4" />,
        action: () => {
          window.location.href = "/websocket";
        },
        category: "Navigation",
      },
      {
        id: "grpc",
        label: "Go to gRPC",
        icon: <Database className="size-4" />,
        action: () => {
          window.location.href = "/grpc";
        },
        category: "Navigation",
      },
      {
        id: "runner",
        label: "Go to Runner",
        icon: <Play className="size-4" />,
        action: () => {
          window.location.href = "/runner";
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
      {
        id: "toggle-sidebar",
        label: "Toggle Sidebar",
        icon: <PanelLeft className="size-4" />,
        action: () => {
          toggleSidebar();
          setCommandPaletteOpen(false);
        },
        category: "Preferences",
      },
      {
        id: "toggle-proxy",
        label: `Proxy: ${proxyMode === "proxy" ? "Proxy" : proxyMode === "direct" ? "Direct" : "Auto"}`,
        icon: <Wifi className="size-4" />,
        action: () => {
          const modes = ["proxy", "direct", "auto"] as const;
          const idx = modes.indexOf(proxyMode);
          setProxyMode(modes[(idx + 1) % modes.length]);
          setCommandPaletteOpen(false);
        },
        category: "Preferences",
      },
      {
        id: "clear-history",
        label: "Clear History",
        icon: <Trash2 className="size-4" />,
        action: () => {
          clearHistory();
          setCommandPaletteOpen(false);
        },
        category: "General",
      },
    ],
    [createTab, duplicateTab, setCommandPaletteOpen, theme, setTheme, toggleSidebar, proxyMode, setProxyMode, clearHistory]
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
