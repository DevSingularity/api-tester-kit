"use client";

import { useRequestStore } from "@/store/request-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { generateId } from "@/utils";
import type { KeyValuePair } from "@/types";

export function ParamsEditor() {
  const { getActiveRequest, updateParams } = useRequestStore();
  const request = getActiveRequest();

  if (!request) return null;

  const params = request.params;

  const update = (index: number, field: keyof KeyValuePair, value: string | boolean) => {
    const newParams = [...params];
    newParams[index] = { ...newParams[index], [field]: value };
    updateParams(request.id, newParams);
  };

  const addParam = () => {
    updateParams(request.id, [
      ...params,
      { id: generateId(), key: "", value: "", enabled: true },
    ]);
  };

  const removeParam = (index: number) => {
    updateParams(
      request.id,
      params.filter((_, i) => i !== index)
    );
  };

  return (
    <div className="space-y-1">
      {params.map((param, index) => (
        <div key={param.id} className="flex items-center gap-1 group">
          <button className="text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab">
            <GripVertical className="size-3.5" />
          </button>
          <input
            type="checkbox"
            checked={param.enabled}
            onChange={(e) => update(index, "enabled", e.target.checked)}
            className="size-3.5 rounded border-border accent-primary"
          />
          <Input
            value={param.key}
            onChange={(e) => update(index, "key", e.target.value)}
            placeholder="Key"
            className="h-7 text-xs font-mono flex-1"
          />
          <Input
            value={param.value}
            onChange={(e) => update(index, "value", e.target.value)}
            placeholder="Value"
            className="h-7 text-xs font-mono flex-1"
          />
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => removeParam(index)}
            className="opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={addParam}
        className="gap-1 text-xs text-muted-foreground"
      >
        <Plus className="size-3" />
        Add parameter
      </Button>
    </div>
  );
}
