"use client";

import { useRequestStore } from "@/store/request-store";
import { useUIStore } from "@/store/ui-store";
import {
  PanelLeftClose,
  PanelLeft,
  Plus,
  Search,
  Settings,
  FolderOpen,
  History,
  Zap,
  Globe,
  Braces,
  Webhook,
  GitCompareArrows,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { DiffDialog } from "@/components/diff-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { icon: Zap, label: "Request", href: "/" },
  { icon: FolderOpen, label: "Collections", href: "/collections" },
  { icon: Globe, label: "Environments", href: "/environments" },
  { icon: History, label: "History", href: "/history" },
  { icon: Braces, label: "GraphQL", href: "/graphql" },
  { icon: Webhook, label: "WebSocket", href: "/websocket" },
  { icon: GitCompareArrows, label: "gRPC", href: "/grpc" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function Sidebar() {
  const { tabs, activeTabId, setActiveTab, createTab, closeTab } =
    useRequestStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <div
      className={cn(
        "flex h-full border-r border-border bg-sidebar text-sidebar-foreground transition-all duration-200",
        sidebarOpen ? "w-64" : "w-12"
      )}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-2 h-12 border-b border-sidebar-border">
          {sidebarOpen && (
            <span className="text-sm font-semibold tracking-tight px-2">
              API Tester
            </span>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleSidebar}
            className="shrink-0"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="size-4" />
            ) : (
              <PanelLeft className="size-4" />
            )}
          </Button>
        </div>

        {sidebarOpen && (
          <>
            <div className="p-2 space-y-1">
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-sidebar-foreground"
                    size="sm"
                    onClick={() => createTab()}
                  >
                    <Plus className="size-4" />
                    New Request
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">New Request (Ctrl+N)</TooltipContent>
              </Tooltip>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-sidebar-foreground"
                size="sm"
              >
                <Search className="size-4" />
                Search
              </Button>
              <DiffDialog />
            </div>

            <Separator />

            <nav className="p-2 space-y-0.5">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                >
                  <item.icon className="size-4" />
                  {item.label}
                </a>
              ))}
            </nav>

            <Separator />

            <ScrollArea className="flex-1">
              <div className="p-2 space-y-0.5">
                <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Open Tabs
                </p>
                {tabs.map((tab) => (
                  <div
                    key={tab.id}
                    className={cn(
                      "group flex items-center gap-1 rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-sidebar-accent",
                      activeTabId === tab.id && "bg-sidebar-accent"
                    )}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <span className="truncate flex-1">{tab.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(tab.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </div>
    </div>
  );
}
