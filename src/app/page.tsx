"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Sidebar } from "@/components/sidebar";
import { UrlBar } from "@/features/request-builder/components/url-bar";
import { RequestTabs } from "@/features/request-builder/components/request-tabs";
import { RequestPanel } from "@/features/request-builder/components/request-panel";
import { ResponseViewer } from "@/features/response-viewer/components/response-viewer";
import { useRequestStore } from "@/store/request-store";
import { useUIStore } from "@/store/ui-store";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Settings, Globe, FolderPlus, Terminal, GripVertical } from "lucide-react";
import { EnvQuickEdit } from "@/components/env-quick-edit";
import { ShortcutsDialog } from "@/components/shortcuts-dialog";
import { cn } from "@/lib/utils";
import { useCollectionStore } from "@/store/collection-store";
import { useToastStore } from "@/store/toast-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Home() {
  const { createTab, tabs, getActiveRequest } = useRequestStore();
  const { collections, addRequestToCollection } = useCollectionStore();
  const request = getActiveRequest();
  const { addToast } = useToastStore();
  const { panelSplitPercent, setPanelSplitPercent } = useUIStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useKeyboardShortcuts();

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let percent = ((e.clientX - rect.left) / rect.width) * 100;
      percent = Math.max(20, Math.min(80, percent));
      setPanelSplitPercent(percent);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [setPanelSplitPercent]);

  useEffect(() => {
    if (isDragging) {
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      return () => {
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [isDragging]);

  useEffect(() => {
    if (tabs.length === 0) {
      createTab();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between h-12 px-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <UrlBar />
          </div>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            {request && (
              <Tooltip>
                <TooltipTrigger>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className={cn(
                        "inline-flex items-center justify-center rounded-md p-1.5",
                        "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                        "cursor-pointer"
                      )}
                    >
                      <FolderPlus className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {collections.map((c) => (
                        <DropdownMenuItem
                          key={c.id}
                          onClick={() => {
                            addRequestToCollection(c.id, request);
                            addToast(`Request saved to "${c.name}"`, "success");
                          }}
                        >
                          {c.name}
                        </DropdownMenuItem>
                      ))}
                      {collections.length === 0 && (
                        <DropdownMenuItem disabled>No collections</DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TooltipTrigger>
                <TooltipContent>Add to Collection</TooltipContent>
              </Tooltip>
            )}
            {request && request.url && (
              <Tooltip>
                <TooltipTrigger
                  className={cn(
                    "inline-flex items-center justify-center rounded-md p-1.5",
                    "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    "cursor-pointer"
                  )}
                  onClick={() => {
                    const headers = request.headers
                      .filter((h) => h.enabled && h.key)
                      .map((h) => `-H '${h.key}: ${h.value}'`)
                      .join(" ");
                    const body =
                      request.body.raw && request.body.type !== "none"
                        ? ` -d '${request.body.raw.replace(/'/g, "\\'")}'`
                        : "";
                    const curl = `curl -X ${request.method} ${headers} '${request.url}'${body}`;
                    navigator.clipboard.writeText(curl);
                    addToast("Request copied as cURL", "success");
                  }}
                >
                  <Terminal className="size-4" />
                </TooltipTrigger>
                <TooltipContent>Copy as cURL</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger>
                <Popover>
                  <PopoverTrigger
                    className={cn(
                      "inline-flex items-center justify-center rounded-md p-1.5",
                      "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                      "disabled:pointer-events-none disabled:opacity-50",
                      "cursor-pointer"
                    )}
                  >
                    <Globe className="size-4" />
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <EnvQuickEdit />
                  </PopoverContent>
                </Popover>
              </TooltipTrigger>
              <TooltipContent>Environments</TooltipContent>
            </Tooltip>
            <ShortcutsDialog />
            <Tooltip>
              <TooltipTrigger
                className={cn(
                  "inline-flex items-center justify-center rounded-md p-1.5",
                  "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  "disabled:pointer-events-none disabled:opacity-50",
                  "cursor-pointer"
                )}
              >
                <Settings className="size-4" />
              </TooltipTrigger>
              <TooltipContent>Settings</TooltipContent>
            </Tooltip>
          </div>
        </header>

        <RequestTabs />

        <div className="flex-1 flex min-h-0" ref={containerRef}>
          <div
            className="flex flex-col min-w-0 border-r border-border"
            style={{ width: `${panelSplitPercent}%` }}
          >
            <RequestPanel />
          </div>

          <div
            className={cn(
              "relative cursor-col-resize shrink-0 flex items-center justify-center",
              "w-2 bg-transparent hover:bg-accent/50 group transition-colors",
              isDragging && "bg-accent/50"
            )}
            onMouseDown={handleResizeStart}
          >
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-border group-hover:bg-primary/30 transition-colors" />
            <GripVertical className="size-3 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors relative z-10" />
          </div>

          <div
            className="flex flex-col min-w-0"
            style={{ width: `${100 - panelSplitPercent}%` }}
          >
            <ResponseViewer />
          </div>
        </div>
      </div>
    </div>
  );
}
