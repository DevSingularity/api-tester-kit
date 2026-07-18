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
import { Plus, Trash2, FileUp } from "lucide-react";
import type { BodyType, KeyValuePair } from "@/types";

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

export function BodyEditor() {
  const { getActiveRequest, updateBody } = useRequestStore();
  const request = getActiveRequest();
  const [formDataFields, setFormDataFields] = useState<FormDataField[]>([]);
  const [formUrlEncodedFields, setFormUrlEncodedFields] = useState<KeyValuePair[]>([]);

  const syncFormUrlEncoded = useCallback((fields: KeyValuePair[]) => {
    const serialized = fields
      .filter((f) => f.enabled && f.key)
      .map((f) => `${encodeURIComponent(f.key)}=${encodeURIComponent(f.value)}`)
      .join("&");
    updateBody(request!.id, "x-www-form-urlencoded", serialized);
  }, [request, updateBody]);

  const syncFormData = useCallback((fields: FormDataField[]) => {
    const serialized = JSON.stringify(
      fields.filter((f) => f.enabled && f.key).map((f) => ({
        key: f.key,
        value: f.type === "file" ? `[File: ${f.fileName || "upload"}]` : f.value,
        type: f.type,
      }))
    );
    updateBody(request!.id, "form-data", serialized);
  }, [request, updateBody]);

  if (!request) return null;

  const bodyType = request.body.type;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Select
          value={bodyType}
          onValueChange={(value) => updateBody(request.id, value as BodyType)}
        >
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
          <textarea
            value={request.body.raw ?? ""}
            onChange={(e) => updateBody(request.id, bodyType, e.target.value)}
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
        <div className="space-y-2">
          {formUrlEncodedFields.map((field, i) => (
            <div key={field.id} className="flex gap-2 items-center">
              <Input
                value={field.key}
                onChange={(e) => {
                  const newFields = [...formUrlEncodedFields];
                  newFields[i] = { ...newFields[i], key: e.target.value };
                  setFormUrlEncodedFields(newFields);
                  syncFormUrlEncoded(newFields);
                }}
                placeholder="Key"
                className="h-7 text-xs font-mono flex-1"
              />
              <Input
                value={field.value}
                onChange={(e) => {
                  const newFields = [...formUrlEncodedFields];
                  newFields[i] = { ...newFields[i], value: e.target.value };
                  setFormUrlEncodedFields(newFields);
                  syncFormUrlEncoded(newFields);
                }}
                placeholder="Value"
                className="h-7 text-xs font-mono flex-1"
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-1.5"
                onClick={() => {
                  const newFields = formUrlEncodedFields.filter((_, idx) => idx !== i);
                  setFormUrlEncodedFields(newFields);
                  syncFormUrlEncoded(newFields);
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
                ...formUrlEncodedFields,
                { id: crypto.randomUUID(), key: "", value: "", enabled: true },
              ];
              setFormUrlEncodedFields(newFields);
            }}
          >
            <Plus className="size-3" />
            Add Field
          </Button>
        </div>
      )}

      {bodyType === "form-data" && (
        <div className="space-y-2">
          {formDataFields.map((field, i) => (
            <div key={field.id} className="flex gap-2 items-center">
              <Select
                value={field.type}
                onValueChange={(value) => {
                  if (value === "text" || value === "file") {
                    const newFields = [...formDataFields];
                    newFields[i] = { ...newFields[i], type: value };
                    setFormDataFields(newFields);
                    syncFormData(newFields);
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
                  const newFields = [...formDataFields];
                  newFields[i] = { ...newFields[i], key: e.target.value };
                  setFormDataFields(newFields);
                  syncFormData(newFields);
                }}
                placeholder="Key"
                className="h-7 text-xs font-mono flex-1"
              />
              {field.type === "text" ? (
                <Input
                  value={field.value}
                  onChange={(e) => {
                    const newFields = [...formDataFields];
                    newFields[i] = { ...newFields[i], value: e.target.value };
                    setFormDataFields(newFields);
                    syncFormData(newFields);
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
                  const newFields = formDataFields.filter((_, idx) => idx !== i);
                  setFormDataFields(newFields);
                  syncFormData(newFields);
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
                ...formDataFields,
                {
                  id: crypto.randomUUID(),
                  key: "",
                  value: "",
                  enabled: true,
                  type: "text" as const,
                },
              ];
              setFormDataFields(newFields);
            }}
          >
            <Plus className="size-3" />
            Add Field
          </Button>
        </div>
      )}
    </div>
  );
}
