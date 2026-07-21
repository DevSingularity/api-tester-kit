"use client";

import { useState, useRef } from "react";
import { useRequestStore } from "@/store/request-store";
import { cn } from "@/lib/utils";
import { X, Pin, Plus, Copy, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RequestTabs() {
  const { tabs, activeTabId, setActiveTab, closeTab, pinTab, createTab, renameTab, duplicateTab, reorderTabs } =
    useRequestStore();
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragItem = useRef<number | null>(null);

  const handleRename = (tabId: string) => {
    renameTab(tabId, editingName);
    setEditingTabId(null);
  };

  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (index: number) => {
    if (dragItem.current !== null && dragItem.current !== index) {
      reorderTabs(dragItem.current, index);
    }
    dragItem.current = null;
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    dragItem.current = null;
    setDragOverIndex(null);
  };

  return (
    <div className="flex items-center border-b border-border bg-background overflow-x-auto">
      <div className="flex items-center">
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={() => handleDrop(index)}
            onDragEnd={handleDragEnd}
            className={cn(
              "group flex items-center gap-1 px-3 py-2 text-sm border-r border-border cursor-pointer hover:bg-muted transition-colors min-w-0 max-w-[200px] select-none",
              activeTabId === tab.id && "bg-muted",
              dragOverIndex === index && "border-t-2 border-t-primary"
            )}
            onClick={() => setActiveTab(tab.id)}
            onDoubleClick={() => {
              setEditingTabId(tab.id);
              setEditingName(tab.name);
            }}
          >
            <GripVertical className="size-2.5 text-muted-foreground opacity-0 group-hover:opacity-40 shrink-0 transition-opacity cursor-grab active:cursor-grabbing" />
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
            {editingTabId === tab.id ? (
              <input
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={() => handleRename(tab.id)}
                onKeyDown={(e) => e.key === "Enter" && handleRename(tab.id)}
                className="w-full bg-transparent focus:outline-none text-xs"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="truncate text-xs">{tab.name}</span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                duplicateTab(tab.id);
              }}
              className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
              title="Duplicate tab"
            >
              <Copy className="size-3" />
            </button>
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
        title="New Tab (Ctrl+N)"
      >
        <Plus className="size-3.5" />
      </Button>
    </div>
  );
}
