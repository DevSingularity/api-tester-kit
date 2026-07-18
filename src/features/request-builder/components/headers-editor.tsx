"use client";

import { useRequestStore } from "@/store/request-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { generateId } from "@/utils";
import type { KeyValuePair } from "@/types";

export function HeadersEditor() {
  const { getActiveRequest, updateHeaders } = useRequestStore();
  const request = getActiveRequest();

  if (!request) return null;

  const headers = request.headers;

  const update = (index: number, field: keyof KeyValuePair, value: string | boolean) => {
    const newHeaders = [...headers];
    newHeaders[index] = { ...newHeaders[index], [field]: value };
    updateHeaders(request.id, newHeaders);
  };

  const addHeader = () => {
    updateHeaders(request.id, [
      ...headers,
      { id: generateId(), key: "", value: "", enabled: true },
    ]);
  };

  const removeHeader = (index: number) => {
    updateHeaders(
      request.id,
      headers.filter((_, i) => i !== index)
    );
  };

  return (
    <div className="space-y-1">
      {headers.map((header, index) => (
        <div key={header.id} className="flex items-center gap-1 group">
          <button className="text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab">
            <GripVertical className="size-3.5" />
          </button>
          <input
            type="checkbox"
            checked={header.enabled}
            onChange={(e) => update(index, "enabled", e.target.checked)}
            className="size-3.5 rounded border-border accent-primary"
          />
          <Input
            value={header.key}
            onChange={(e) => update(index, "key", e.target.value)}
            placeholder="Header name"
            className="h-7 text-xs font-mono flex-1"
          />
          <Input
            value={header.value}
            onChange={(e) => update(index, "value", e.target.value)}
            placeholder="Value"
            className="h-7 text-xs font-mono flex-1"
          />
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => removeHeader(index)}
            className="opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={addHeader}
        className="gap-1 text-xs text-muted-foreground"
      >
        <Plus className="size-3" />
        Add header
      </Button>
    </div>
  );
}
