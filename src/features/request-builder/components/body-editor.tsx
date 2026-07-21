"use client";

import { useState, useCallback } from "react";
import { useRequestStore } from "@/store/request-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VariablePicker } from "@/components/variable-picker";
import { Plus, Trash2, FileUp } from "lucide-react";
import type { BodyType, KeyValuePair } from "@/types";
import { generateId } from "@/utils";

const BODY_TYPES: { value: BodyType; label: string }[] = [
  { value: "none", label: "None" },
  { value: "json", label: "JSON" },
  { value: "xml", label: "XML" },
  { value: "text", label: "Text" },
  { value: "html", label: "HTML" },
  { value: "x-www-form-urlencoded", label: "URL Encoded" },
  { value: "form-data", label: "Form Data" },
];

interface FormDataField extends KeyValuePair {
  type: "text" | "file";
  fileName?: string;
}

function parseFormUrlEncoded(raw: string | undefined): KeyValuePair[] {
  if (!raw) return [];
  try {
    return raw.split("&").filter(Boolean).map((pair) => {
      const [key, value] = pair.split("=").map(decodeURIComponent);
      return { id: generateId(), key, value, enabled: true };
    });
  } catch {
    return [];
  }
}

function parseFormData(raw: string | undefined): FormDataField[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((f: { key?: string; value?: string; type?: string; fileName?: string }) => ({
        id: generateId(),
        key: f.key ?? "",
        value: f.value ?? "",
        enabled: true,
        type: f.type === "file" ? "file" as const : "text" as const,
        fileName: f.fileName,
      }));
    }
  } catch {
  }
  return [];
}

function FormUrlEncodedEditor({ requestId }: { requestId: string }) {
  const { getActiveRequest, updateBody, updateHeaders } = useRequestStore();
  const req = requestId ? getActiveRequest() : null;
  const initialFields = parseFormUrlEncoded(req?.body.raw);
  const [fields, setFields] = useState<KeyValuePair[]>(initialFields);

  const syncFields = useCallback((newFields: KeyValuePair[]) => {
    const active = useRequestStore.getState().getActiveRequest();
    if (!active) return;
    const serialized = newFields
      .filter((f) => f.enabled && f.key)
      .map((f) => `${encodeURIComponent(f.key)}=${encodeURIComponent(f.value)}`)
      .join("&");
    updateBody(requestId, "x-www-form-urlencoded", serialized);
    const hasContentType = active.headers.some((h) => h.key.toLowerCase() === "content-type");
    if (!hasContentType) {
      updateHeaders(requestId, [
        ...active.headers,
        { id: generateId(), key: "Content-Type", value: "application/x-www-form-urlencoded", enabled: true },
      ]);
    }
  }, [requestId, updateBody, updateHeaders]);

  return (
    <div key={requestId} className="space-y-2">
      {fields.map((field, i) => (
        <div key={field.id} className="flex gap-2 items-center">
          <Input
            value={field.key}
            onChange={(e) => {
              const newFields = [...fields];
              newFields[i] = { ...newFields[i], key: e.target.value };
              setFields(newFields);
              syncFields(newFields);
            }}
            placeholder="Key"
            className="h-7 text-xs font-mono flex-1"
          />
          <Input
            value={field.value}
            onChange={(e) => {
              const newFields = [...fields];
              newFields[i] = { ...newFields[i], value: e.target.value };
              setFields(newFields);
              syncFields(newFields);
            }}
            placeholder="Value"
            className="h-7 text-xs font-mono flex-1"
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-1.5"
            onClick={() => {
              const newFields = fields.filter((_, idx) => idx !== i);
              setFields(newFields);
              syncFields(newFields);
            }}
          >
            <Trash2 className="size-3 text-muted-foreground" />
          </Button>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-xs gap-1"
        onClick={() => {
          const newFields = [...fields, { id: generateId(), key: "", value: "", enabled: true }];
          setFields(newFields);
        }}
      >
        <Plus className="size-3" />
        Add Field
      </Button>
    </div>
  );
}

function FormDataEditor({ requestId }: { requestId: string }) {
  const { getActiveRequest, updateBody } = useRequestStore();
  const req = getActiveRequest();
  const initialFields = parseFormData(req?.body.raw);
  const [fields, setFields] = useState<FormDataField[]>(initialFields);

  const syncFields = useCallback((newFields: FormDataField[]) => {
    const serialized = JSON.stringify(
      newFields.filter((f) => f.enabled && f.key).map((f) => ({
        key: f.key,
        value: f.type === "file" ? `[File: ${f.fileName || "upload"}]` : f.value,
        type: f.type,
      }))
    );
    updateBody(requestId, "form-data", serialized);
  }, [requestId, updateBody]);

  return (
    <div key={requestId} className="space-y-2">
      {fields.map((field, i) => (
        <div key={field.id} className="flex gap-2 items-center">
          <Select
            value={field.type}
            onValueChange={(value) => {
              if (value === "text" || value === "file") {
                const newFields = [...fields];
                newFields[i] = { ...newFields[i], type: value };
                setFields(newFields);
                syncFields(newFields);
              }
            }}
          >
            <SelectTrigger className="w-20 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text" className="text-xs">Text</SelectItem>
              <SelectItem value="file" className="text-xs">File</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={field.key}
            onChange={(e) => {
              const newFields = [...fields];
              newFields[i] = { ...newFields[i], key: e.target.value };
              setFields(newFields);
              syncFields(newFields);
            }}
            placeholder="Key"
            className="h-7 text-xs font-mono flex-1"
          />
          {field.type === "text" ? (
            <Input
              value={field.value}
              onChange={(e) => {
                const newFields = [...fields];
                newFields[i] = { ...newFields[i], value: e.target.value };
                setFields(newFields);
                syncFields(newFields);
              }}
              placeholder="Value"
              className="h-7 text-xs font-mono flex-1"
            />
          ) : (
            <div className="flex-1 flex items-center gap-1 h-7 px-2 border rounded text-xs text-muted-foreground">
              <FileUp className="size-3" />
              <span className="truncate">{field.fileName || "Choose file..."}</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-1.5"
            onClick={() => {
              const newFields = fields.filter((_, idx) => idx !== i);
              setFields(newFields);
              syncFields(newFields);
            }}
          >
            <Trash2 className="size-3 text-muted-foreground" />
          </Button>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-xs gap-1"
        onClick={() => {
          const newFields = [
            ...fields,
            { id: generateId(), key: "", value: "", enabled: true, type: "text" as const },
          ];
          setFields(newFields);
        }}
      >
        <Plus className="size-3" />
        Add Field
      </Button>
    </div>
  );
}

export function BodyEditor() {
  const { getActiveRequest, updateBody, updateHeaders } = useRequestStore();
  const request = getActiveRequest();

  if (!request) return null;

  const bodyType = request.body.type;

  const setContentType = (ct: string) => {
    const existing = request.headers.find(h => h.key.toLowerCase() === "content-type");
    if (existing) {
      updateHeaders(request.id, request.headers.map(h =>
        h.id === existing.id ? { ...h, value: ct } : h
      ));
    } else {
      updateHeaders(request.id, [
        ...request.headers,
        { id: generateId(), key: "Content-Type", value: ct, enabled: true },
      ]);
    }
  };

  const onBodyTypeChange = (value: string | null) => {
    if (!value) return;
    const newType = value as BodyType;
    updateBody(request.id, newType);
    if (newType === "json") setContentType("application/json");
    else if (newType === "xml") setContentType("application/xml");
    else if (newType === "text") setContentType("text/plain");
    else if (newType === "html") setContentType("text/html");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Select value={bodyType} onValueChange={onBodyTypeChange}>
          <SelectTrigger className="w-40 h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BODY_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value} className="text-xs">
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {bodyType !== "none" && (bodyType === "json" || bodyType === "xml" || bodyType === "text" || bodyType === "html") && (
        <div className="relative">
          <div className="flex items-center justify-end mb-1">
            <VariablePicker
              onSelect={(key) => {
                const current = request.body.raw ?? "";
                updateBody(request.id, bodyType, current + `{{${key}}}`);
              }}
            />
          </div>
          <textarea
            value={request.body.raw ?? ""}
            onChange={(e) => updateBody(request.id, bodyType, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                e.preventDefault();
                const textarea = e.currentTarget;
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const value = textarea.value;
                textarea.value = value.substring(0, start) + "    " + value.substring(end);
                textarea.selectionStart = textarea.selectionEnd = start + 4;
                updateBody(request.id, bodyType, textarea.value);
              }
            }}
            onBlur={() => {
              if (bodyType === "json") {
                try {
                  const parsed = JSON.parse(request.body.raw ?? "");
                  updateBody(request.id, bodyType, JSON.stringify(parsed, null, 2));
                } catch {
                }
              }
            }}
            placeholder={
              bodyType === "json"
                ? '{\n  "key": "value"\n}'
                : bodyType === "xml"
                  ? "<root>\n  <element>value</element>\n</root>"
                  : "Enter body content..."
            }
            className="w-full h-64 p-3 font-mono text-xs bg-muted/50 rounded-lg border border-border resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            spellCheck={false}
          />
        </div>
      )}

      {bodyType === "x-www-form-urlencoded" && (
        <FormUrlEncodedEditor requestId={request.id} />
      )}

      {bodyType === "form-data" && (
        <FormDataEditor requestId={request.id} />
      )}
    </div>
  );
}