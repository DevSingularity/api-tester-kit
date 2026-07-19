"use client";

import { useRequestStore } from "@/store/request-store";
import { KeyValueEditor } from "@/components/key-value-editor";

export function HeadersEditor() {
  const { getActiveRequest, updateHeaders } = useRequestStore();
  const request = getActiveRequest();

  if (!request) return null;

  return (
    <KeyValueEditor
      items={request.headers}
      onChange={(headers) => updateHeaders(request.id, headers)}
      keyPlaceholder="Header name"
      valuePlaceholder="Value"
      addLabel="Add header"
    />
  );
}
