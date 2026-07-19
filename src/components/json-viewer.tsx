"use client";

import { useState, useCallback, useMemo } from "react";
import { ChevronRight, ChevronDown, Copy, Check, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

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
  searchQuery?: string;
}

function getValueType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function matchesSearch(value: unknown, keyName: string | null, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  if (keyName !== null && keyName.toLowerCase().includes(q)) return true;
  if (typeof value === "string" && value.toLowerCase().includes(q)) return true;
  if (typeof value === "number" || typeof value === "boolean") return String(value).toLowerCase().includes(q);
  return false;
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-amber-400/30 text-foreground rounded px-0.5">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}

function serializeValue(value: unknown): string {
  if (typeof value === "string") return `"${value}"`;
  return String(value);
}

function JsonNode({
  keyName,
  value,
  depth,
  path,
  isLast,
  defaultExpanded = depth < 2,
  searchQuery = "",
}: JsonNodeProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);
  const type = getValueType(value);
  const isContainer = type === "object" || type === "array";

  const entries = useMemo(
    () => type === "object" ? Object.entries(value as Record<string, unknown>) : [],
    [type, value]
  );
  const items = useMemo(
    () => type === "array" ? (value as unknown[]) : [],
    [type, value]
  );
  const openBrace = type === "array" ? "[" : "{";
  const closeBrace = type === "array" ? "]" : "}";
  const isSelfMatch = searchQuery ? matchesSearch(value, keyName, searchQuery) : false;

  const childMatches = useMemo(() => {
    if (!searchQuery || !isContainer) return false;
    const check = (v: unknown, k: string | null): boolean => {
      if (matchesSearch(v, k, searchQuery)) return true;
      if (v && typeof v === "object") {
        if (Array.isArray(v)) return (v as unknown[]).some((item) => check(item, null));
        return Object.entries(v as Record<string, unknown>).some(([ck, cv]) => check(cv, ck));
      }
      return false;
    };
    if (type === "array") return items.some((item) => check(item, null));
    return entries.some(([ck, cv]) => check(cv, ck));
  }, [searchQuery, isContainer, type, items, entries]);

  const handleCopyPath = useCallback(() => {
    navigator.clipboard.writeText(path);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [path]);

  const showNode = !searchQuery || isSelfMatch || childMatches;
  const autoExpand = !!searchQuery && (isSelfMatch || childMatches);

  if (!showNode && depth > 0) return null;

  return (
    <div style={{ paddingLeft: depth * 16 }}>
      <div className="flex items-center gap-1 group">
        {isContainer ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground hover:text-foreground"
          >
            {expanded || autoExpand ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
          </button>
        ) : (
          <div className="size-3" />
        )}
        {keyName !== null && (
          <>
            <span className="text-blue-400 font-mono text-xs">
              {searchQuery ? highlightText(`"${keyName}"`, searchQuery) : `"${keyName}"`}
            </span>
            <span className="text-muted-foreground text-xs">: </span>
          </>
        )}
        {isContainer ? (
          <span className="text-muted-foreground font-mono text-xs">
            {openBrace}
            {!(expanded || autoExpand) && (
              <>
                <span className="text-muted-foreground"> ... </span>
                <span className="text-muted-foreground">{closeBrace}</span>
                {!isLast && <span>,</span>}
              </>
            )}
          </span>
        ) : (
          <span
            className={cn("font-mono text-xs max-w-[400px] truncate", {
              "text-green-400": type === "string",
              "text-amber-400": type === "number",
              "text-purple-400": type === "boolean",
              "text-gray-400": type === "null",
            })}
          >
            {searchQuery
              ? highlightText(serializeValue(value), searchQuery)
              : type === "string"
                ? `"${value}"`
                : String(value)}
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
      {isContainer && (expanded || autoExpand) && (
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
                searchQuery={searchQuery}
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
                searchQuery={searchQuery}
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
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search JSON..."
            className="h-6 text-xs pl-7 pr-6 font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
        <button
          onClick={handleCopyAll}
          className="text-muted-foreground hover:text-foreground text-xs flex items-center gap-1 shrink-0"
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
          searchQuery={searchQuery}
        />
      </div>
    </div>
  );
}