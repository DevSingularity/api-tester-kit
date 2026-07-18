"use client";

import { useState, useCallback, useMemo } from "react";
import { ChevronRight, ChevronDown, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface JsonViewerProps {
  data: string;
  className?: string;
}

interface JsonNodeProps {
  keyName: string | null;
  value: unknown;
  depth: number;
  path: string;
  isLast: boolean;
  defaultExpanded?: boolean;
}

function getValueType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function JsonNode({
  keyName,
  value,
  depth,
  path,
  isLast,
  defaultExpanded = depth < 2,
}: JsonNodeProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);
  const type = getValueType(value);
  const isContainer = type === "object" || type === "array";

  const entries = type === "object" ? Object.entries(value as Record<string, unknown>) : [];
  const items = type === "array" ? (value as unknown[]) : [];
  const openBrace = type === "array" ? "[" : "{";
  const closeBrace = type === "array" ? "]" : "}";

  const handleCopyPath = useCallback(() => {
    navigator.clipboard.writeText(path);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [path]);

  return (
    <div style={{ paddingLeft: depth * 16 }}>
      <div className="flex items-center gap-1 group">
        {isContainer ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground hover:text-foreground"
          >
            {expanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
          </button>
        ) : (
          <div className="size-3" />
        )}
        {keyName !== null && (
          <>
            <span className="text-blue-400 font-mono text-xs">&quot;{keyName}&quot;</span>
            <span className="text-muted-foreground text-xs">: </span>
          </>
        )}
        {isContainer ? (
          <span className="text-muted-foreground font-mono text-xs">
            {openBrace}
            {!expanded && (
              <>
                <span className="text-muted-foreground"> ... </span>
                <span className="text-muted-foreground">{closeBrace}</span>
                {!isLast && <span>,</span>}
              </>
            )}
          </span>
        ) : (
          <span
            className={cn("font-mono text-xs", {
              "text-green-400": type === "string",
              "text-amber-400": type === "number",
              "text-purple-400": type === "boolean",
              "text-gray-400": type === "null",
            })}
          >
            {type === "string" ? `"${value}"` : String(value)}
            {!isLast && <span className="text-muted-foreground text-xs">,</span>}
          </span>
        )}
        <button
          onClick={handleCopyPath}
          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
        </button>
      </div>
      {isContainer && expanded && (
        <>
          {type === "array" &&
            items.map((item, i) => (
              <JsonNode
                key={i}
                keyName={null}
                value={item}
                depth={depth + 1}
                path={`${path}[${i}]`}
                isLast={i === items.length - 1}
                defaultExpanded={depth < 1}
              />
            ))}
          {type === "object" &&
            entries.map(([key, val], i) => (
              <JsonNode
                key={key}
                keyName={key}
                value={val}
                depth={depth + 1}
                path={path ? `${path}.${key}` : key}
                isLast={i === entries.length - 1}
                defaultExpanded={depth < 1}
              />
            ))}
          <div style={{ paddingLeft: depth * 16 }}>
            <span className="text-muted-foreground font-mono text-xs">
              {closeBrace}
            </span>
            {!isLast && <span className="text-muted-foreground text-xs">,</span>}
          </div>
        </>
      )}
    </div>
  );
}

export function JsonViewer({ data, className }: JsonViewerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);

  const parsed = useMemo(() => {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }, [data]);

  const handleCopyAll = useCallback(() => {
    navigator.clipboard.writeText(data);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [data]);

  if (parsed === null) {
    return (
      <pre className={cn("p-3 font-mono text-xs text-foreground whitespace-pre-wrap break-words", className)}>
        {data}
      </pre>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <div className="sticky top-0 flex items-center gap-2 px-3 py-1.5 bg-background border-b border-border z-10">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search JSON..."
          className="h-6 text-xs px-2 font-mono bg-muted rounded border border-border flex-1 focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          onClick={handleCopyAll}
          className="text-muted-foreground hover:text-foreground text-xs flex items-center gap-1"
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="p-3 overflow-auto max-h-[600px]">
        <JsonNode
          keyName={null}
          value={parsed}
          depth={0}
          path=""
          isLast={true}
        />
      </div>
    </div>
  );
}
