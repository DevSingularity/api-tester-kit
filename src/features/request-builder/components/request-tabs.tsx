"use client";

import { useRequestStore } from "@/store/request-store";
import { cn } from "@/lib/utils";
import { X, Pin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RequestTabs() {
  const { tabs, activeTabId, setActiveTab, closeTab, pinTab, createTab } =
    useRequestStore();

  return (
    <div className="flex items-center border-b border-border bg-background overflow-x-auto">
      <div className="flex items-center">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={cn(
              "group flex items-center gap-1.5 px-3 py-2 text-sm border-r border-border cursor-pointer hover:bg-muted transition-colors min-w-0 max-w-[180px]",
              activeTabId === tab.id && "bg-muted"
            )}
            onClick={() => setActiveTab(tab.id)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                pinTab(tab.id);
              }}
              className={cn(
                "shrink-0 opacity-0 group-hover:opacity-100 transition-opacity",
                tab.isPinned && "opacity-100 text-amber-400"
              )}
            >
              <Pin className="size-3" />
            </button>
            <span className="truncate">{tab.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        className="shrink-0 m-1"
        onClick={() => createTab()}
      >
        <Plus className="size-3.5" />
      </Button>
    </div>
  );
}
