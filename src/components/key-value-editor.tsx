"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, GripVertical, ClipboardPaste, Search, X } from "lucide-react";
import { generateId } from "@/utils";
import type { KeyValuePair } from "@/types";
import { cn } from "@/lib/utils";

interface KeyValueEditorProps {
  items: KeyValuePair[];
  onChange: (items: KeyValuePair[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  addLabel?: string;
}

export function KeyValueEditor({
  items,
  onChange,
  keyPlaceholder = "Key",
  valuePlaceholder = "Value",
  addLabel = "Add",
}: KeyValueEditorProps) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [showBulkPaste, setShowBulkPaste] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [filterText, setFilterText] = useState("");

  const filteredItems = useMemo(() => {
    if (!filterText.trim()) return items;
    const lower = filterText.toLowerCase();
    return items.filter(
      (item) =>
        item.key.toLowerCase().includes(lower) ||
        item.value.toLowerCase().includes(lower)
    );
  }, [items, filterText]);

  const update = (index: number, field: keyof KeyValuePair, value: string | boolean) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange(newItems);
  };

  const addItem = () => {
    onChange([...items, { id: generateId(), key: "", value: "", enabled: true }]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleBulkPaste = () => {
    const lines = bulkText.split("\n").filter((l) => l.trim());
    const parsed: KeyValuePair[] = [];
    for (const line of lines) {
      const sep = line.includes(":") ? ":" : line.includes("=") ? "=" : "\t";
      const idx = line.indexOf(sep);
      if (idx > 0) {
        parsed.push({
          id: generateId(),
          key: line.slice(0, idx).trim(),
          value: line.slice(idx + 1).trim(),
          enabled: true,
        });
      }
    }
    if (parsed.length > 0) {
      onChange([...items, ...parsed]);
    }
    setBulkText("");
    setShowBulkPaste(false);
  };

  const handleDragStart = (index: number) => {
    setDragIdx(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setOverIdx(index);
  };

  const handleDrop = useCallback((index: number) => {
    if (dragIdx === null || dragIdx === index) {
      setDragIdx(null);
      setOverIdx(null);
      return;
    }
    const newItems = [...items];
    const [moved] = newItems.splice(dragIdx, 1);
    newItems.splice(index, 0, moved);
    onChange(newItems);
    setDragIdx(null);
    setOverIdx(null);
  }, [dragIdx, items, onChange]);

  const handleDragEnd = () => {
    setDragIdx(null);
    setOverIdx(null);
  };

  const displayItems = filterText.trim() ? filteredItems : items;

  return (
    <div className="space-y-1">
      <div className="relative">
        <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
        <Input
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder="Filter by key or value..."
          className="h-7 text-xs font-mono pl-6 pr-7"
        />
        {filterText && (
          <button
            onClick={() => setFilterText("")}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="size-3" />
          </button>
        )}
      </div>
      {displayItems.map((item) => {
        const realIndex = items.indexOf(item);
        return (
        <div
          key={item.id}
          className={cn(
            "flex items-center gap-1 group transition-opacity",
            dragIdx === realIndex && "opacity-50"
          )}
          draggable
          onDragStart={() => handleDragStart(realIndex)}
          onDragOver={(e) => handleDragOver(e, realIndex)}
          onDrop={() => handleDrop(realIndex)}
          onDragEnd={handleDragEnd}
        >
          <button
            className={cn(
              "text-muted-foreground cursor-grab active:cursor-grabbing",
              overIdx === realIndex ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
            onMouseDown={() => handleDragStart(realIndex)}
            title="Drag to reorder"
          >
            <GripVertical className="size-3.5" />
          </button>
          <input
            type="checkbox"
            checked={item.enabled}
            onChange={(e) => update(realIndex, "enabled", e.target.checked)}
            className="size-3.5 rounded border-border accent-primary shrink-0"
          />
          <Input
            value={item.key}
            onChange={(e) => update(realIndex, "key", e.target.value)}
            placeholder={keyPlaceholder}
            className="h-7 text-xs font-mono flex-1"
          />
          <Input
            value={item.value}
            onChange={(e) => update(realIndex, "value", e.target.value)}
            placeholder={valuePlaceholder}
            className="h-7 text-xs font-mono flex-1"
          />
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => removeItem(realIndex)}
            className="opacity-0 group-hover:opacity-100 shrink-0"
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      );
      })}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={addItem}
          className="gap-1 text-xs text-muted-foreground"
        >
          <Plus className="size-3" />
          {addLabel}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowBulkPaste(!showBulkPaste)}
          className="gap-1 text-xs text-muted-foreground"
        >
          <ClipboardPaste className="size-3" />
          Bulk Paste
        </Button>
      </div>
      {showBulkPaste && (
        <div className="space-y-2 p-2 bg-muted/30 rounded-lg border border-border">
          <Textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder="Paste Key: Value pairs, one per line&#10;Lines can use :, =, or Tab as separator"
            className="h-24 text-xs font-mono resize-none"
            spellCheck={false}
          />
          <div className="flex gap-2">
            <Button variant="default" size="sm" className="h-7 text-xs" onClick={handleBulkPaste}>
              Apply
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setShowBulkPaste(false); setBulkText(""); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
