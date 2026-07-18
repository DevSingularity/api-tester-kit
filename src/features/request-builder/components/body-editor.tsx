"use client";

import { useRequestStore } from "@/store/request-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BodyType } from "@/types";

const BODY_TYPES: { value: BodyType; label: string }[] = [
  { value: "none", label: "None" },
  { value: "json", label: "JSON" },
  { value: "xml", label: "XML" },
  { value: "text", label: "Text" },
  { value: "html", label: "HTML" },
  { value: "x-www-form-urlencoded", label: "URL Encoded" },
  { value: "form-data", label: "Form Data" },
];

export function BodyEditor() {
  const { getActiveRequest, updateBody } = useRequestStore();
  const request = getActiveRequest();

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
        <div className="text-sm text-muted-foreground p-2">
          URL Encoded body editor coming soon.
        </div>
      )}

      {bodyType === "form-data" && (
        <div className="text-sm text-muted-foreground p-2">
          Form Data editor coming soon.
        </div>
      )}
    </div>
  );
}
