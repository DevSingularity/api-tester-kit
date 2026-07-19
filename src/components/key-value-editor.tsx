"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, GripVertical } from "lucide-react";
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

  return (
    <div className="space-y-1">
      {items.map((item, index) => (
        <div
          key={item.id}
          className={cn(
            "flex items-center gap-1 group transition-opacity",
            dragIdx === index && "opacity-50"
          )}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={() => handleDrop(index)}
          onDragEnd={handleDragEnd}
        >
          <button
            className={cn(
              "text-muted-foreground cursor-grab active:cursor-grabbing",
              overIdx === index ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
            onMouseDown={() => handleDragStart(index)}
            title="Drag to reorder"
          >
            <GripVertical className="size-3.5" />
          </button>
          <input
            type="checkbox"
            checked={item.enabled}
            onChange={(e) => update(index, "enabled", e.target.checked)}
            className="size-3.5 rounded border-border accent-primary shrink-0"
          />
          <Input
            value={item.key}
            onChange={(e) => update(index, "key", e.target.value)}
            placeholder={keyPlaceholder}
            className="h-7 text-xs font-mono flex-1"
          />
          <Input
            value={item.value}
            onChange={(e) => update(index, "value", e.target.value)}
            placeholder={valuePlaceholder}
            className="h-7 text-xs font-mono flex-1"
          />
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => removeItem(index)}
            className="opacity-0 group-hover:opacity-100 shrink-0"
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={addItem}
        className="gap-1 text-xs text-muted-foreground"
      >
        <Plus className="size-3" />
        {addLabel}
      </Button>
    </div>
  );
}
