"use client";

import { useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { UrlBar } from "@/features/request-builder/components/url-bar";
import { RequestTabs } from "@/features/request-builder/components/request-tabs";
import { RequestPanel } from "@/features/request-builder/components/request-panel";
import { ResponseViewer } from "@/features/response-viewer/components/response-viewer";
import { useRequestStore } from "@/store/request-store";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { Separator } from "@/components/ui/separator";
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
import { Settings, Globe, FolderPlus } from "lucide-react";
import { EnvQuickEdit } from "@/components/env-quick-edit";
import { cn } from "@/lib/utils";
import { useCollectionStore } from "@/store/collection-store";
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
  useKeyboardShortcuts();

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
                          onClick={() => addRequestToCollection(c.id, request)}
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

        <div className="flex-1 flex min-h-0">
          <div className="flex-1 flex flex-col min-w-0 border-r border-border">
            <RequestPanel />
          </div>

          <Separator orientation="vertical" />

          <div className="flex-1 flex flex-col min-w-0">
            <ResponseViewer />
          </div>
        </div>
      </div>
    </div>
  );
}
