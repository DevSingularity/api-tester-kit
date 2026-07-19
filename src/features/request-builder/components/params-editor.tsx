"use client";

import { useRequestStore } from "@/store/request-store";
import { KeyValueEditor } from "@/components/key-value-editor";

export function ParamsEditor() {
  const { getActiveRequest, updateParams } = useRequestStore();
  const request = getActiveRequest();

  if (!request) return null;

  return (
    <KeyValueEditor
      items={request.params}
      onChange={(params) => updateParams(request.id, params)}
      keyPlaceholder="Key"
      valuePlaceholder="Value"
      addLabel="Add parameter"
    />
  );
}
