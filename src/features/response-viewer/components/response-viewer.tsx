"use client";

import { useRequestStore } from "@/store/request-store";
import { getStatusColor, formatBytes, formatDuration } from "@/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Copy,
  Download,
  Code,
  FileText,
  WrapText,
  Search,
  Cookie,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useMemo } from "react";
import { JsonViewer } from "@/components/json-viewer";
import { CodeGenerator } from "@/components/code-generator-panel";
import { ResponseSearch } from "@/components/response-search";
import { useToastStore } from "@/store/toast-store";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ParsedCookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: string;
  maxAge?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: string;
}

function parseCookies(headers: Record<string, string>): ParsedCookie[] {
  const cookies: ParsedCookie[] = [];
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === "set-cookie") {
      const parts = value.split(";");
      const [name, ...valParts] = parts[0].split("=");
      const cookie: ParsedCookie = { name: name.trim(), value: valParts.join("=").trim() };
      for (let i = 1; i < parts.length; i++) {
        const attr = parts[i].trim();
        const [attrKey, ...attrVal] = attr.split("=");
        const attrName = attrKey.toLowerCase();
        if (attrName === "domain") cookie.domain = attrVal.join("=");
        else if (attrName === "path") cookie.path = attrVal.join("=");
        else if (attrName === "expires") cookie.expires = attrVal.join("=");
        else if (attrName === "max-age") cookie.maxAge = attrVal.join("=");
        else if (attrName === "secure") cookie.secure = true;
        else if (attrName === "httponly") cookie.httpOnly = true;
        else if (attrName === "samesite") cookie.sameSite = attrVal.join("=");
      }
      cookies.push(cookie);
    }
  }
  return cookies;
}

function formatJSType(value: unknown): string {
  if (typeof value === "string") return `"${value.replace(/"/g, '\\"')}"`;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null) return "null";
  if (Array.isArray(value)) return `[${value.map(formatJSType).join(", ")}]`;
  return JSON.stringify(value, null, 2);
}

function formatCurlBody(body: string): string {
  return `-d '${body.replace(/'/g, "\\'")}'`;
}

export function ResponseViewer() {
  const { getActiveResponse, loading, getActiveRequest } = useRequestStore();
  const response = getActiveResponse();
  const request = getActiveRequest();
  const isLoading = request ? loading[request.id] : false;
  const { addToast } = useToastStore();
  const downloadCounter = useRef(0);
  const [viewMode, setViewMode] = useState<"preview" | "raw">("preview");
  const [wordWrap, setWordWrap] = useState(true);
  const [headerSearch, setHeaderSearch] = useState("");

  const isJson = useMemo(() => {
    if (!response) return false;
    try {
      JSON.parse(response.body);
      return true;
    } catch {
      return false;
    }
  }, [response]);

  const filteredHeaders = useMemo(() => {
    if (!response) return [];
    const entries = Object.entries(response.headers);
    if (!headerSearch) return entries;
    return entries.filter(
      ([key, value]) =>
        key.toLowerCase().includes(headerSearch.toLowerCase()) ||
        value.toLowerCase().includes(headerSearch.toLowerCase())
    );
  }, [response, headerSearch]);

  const cookies = useMemo(() => {
    if (!response) return [];
    return parseCookies(response.headers);
  }, [response]);

  const timingBar = useMemo(() => {
    if (!response) return null;
    const ms = response.time;
    const barClass =
      ms < 200
        ? "bg-emerald-500"
        : ms < 500
          ? "bg-amber-500"
          : ms < 1000
            ? "bg-orange-500"
            : "bg-red-500";
    return { ms, barClass, label: formatDuration(ms) };
  }, [response]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Sending request...</span>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p className="text-sm">Send a request to see the response</p>
      </div>
    );
  }

  const handleCopy = (format?: string) => {
    let text = response.body;
    if (format === "minified" && isJson) {
      text = JSON.stringify(JSON.parse(response.body));
    } else if (format === "js" && isJson) {
      const parsed = JSON.parse(response.body);
      text = typeof parsed === "object" ? formatJSType(parsed) : text;
    } else if (format === "curl" && request) {
      const req = request;
      const method = req.method;
      const headers = req.headers
        .filter((h) => h.enabled && h.key)
        .map((h) => `-H '${h.key}: ${h.value}'`)
        .join(" ");
      const body =
        req.body.raw && req.body.type !== "none"
          ? ` ${formatCurlBody(req.body.raw)}`
          : "";
      text = `curl -X ${method} ${headers} '${req.url}'${body}`;
    }
    navigator.clipboard.writeText(text);
    addToast("Copied to clipboard", "success");
  };

  const handleDownload = () => {
    downloadCounter.current += 1;
    const blob = new Blob([response.body], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `response-${downloadCounter.current}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("Response downloaded", "success");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <Badge
          variant="outline"
          className={cn("text-xs font-mono shrink-0", getStatusColor(response.status))}
        >
          {response.status} {response.statusText}
        </Badge>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono shrink-0">
          <Clock className="size-3" />
          <span>{formatDuration(response.time)}</span>
        </div>
        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden hidden sm:block">
          <div
            className={cn("h-full rounded-full transition-all", timingBar?.barClass)}
            style={{ width: `${Math.min((timingBar?.ms || 0) / 10, 100)}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {formatBytes(response.size)}
        </span>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setWordWrap(!wordWrap)}
          className={cn(wordWrap && "text-primary")}
          title="Toggle word wrap"
        >
          <WrapText className="size-3" />
        </Button>
        <ResponseSearch body={response.body} />
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer">
            <Copy className="size-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-36">
            <DropdownMenuItem onClick={() => handleCopy()}>
              Copy as raw text
            </DropdownMenuItem>
            {isJson && (
              <>
                <DropdownMenuItem onClick={() => handleCopy("minified")}>
                  Copy as minified JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCopy("js")}>
                  Copy as JS object
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem onClick={() => handleCopy("curl")}>
              Copy as cURL
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost" size="icon-xs" onClick={handleDownload} title="Download response">
          <Download className="size-3" />
        </Button>
      </div>

      <Tabs defaultValue="body" className="flex-1 flex flex-col">
        <div className="border-b border-border px-2 flex items-center justify-between">
          <TabsList className="h-8 bg-transparent p-0 gap-0">
            <TabsTrigger
              value="body"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-2.5 py-1 text-xs font-medium"
            >
              Body
            </TabsTrigger>
            <TabsTrigger
              value="headers"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-2.5 py-1 text-xs font-medium"
            >
              Headers
            </TabsTrigger>
            {cookies.length > 0 && (
              <TabsTrigger
                value="cookies"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-2.5 py-1 text-xs font-medium"
              >
                <Cookie className="size-3 mr-1" />
                Cookies ({cookies.length})
              </TabsTrigger>
            )}
            <TabsTrigger
              value="code"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-2.5 py-1 text-xs font-medium"
            >
              Code
            </TabsTrigger>
          </TabsList>
          {isJson && (
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setViewMode("preview")}
                className={cn(viewMode === "preview" && "text-primary")}
                title="Preview (formatted)"
              >
                <Code className="size-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setViewMode("raw")}
                className={cn(viewMode === "raw" && "text-primary")}
                title="Raw (unformatted)"
              >
                <FileText className="size-3" />
              </Button>
            </div>
          )}
        </div>

        <TabsContent value="body" className="flex-1 m-0 overflow-auto">
          {viewMode === "preview" && isJson ? (
            <JsonViewer data={response.body} className="h-full" />
          ) : (
            <pre
              className={cn(
                "p-3 font-mono text-xs text-foreground",
                wordWrap ? "whitespace-pre-wrap break-words" : "whitespace-pre overflow-x-auto"
              )}
            >
              {response.body}
            </pre>
          )}
        </TabsContent>

        <TabsContent value="headers" className="flex-1 m-0 overflow-auto">
          <div className="p-3 space-y-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
              <input
                type="text"
                value={headerSearch}
                onChange={(e) => setHeaderSearch(e.target.value)}
                placeholder="Search headers..."
                className="w-full h-7 pl-7 pr-2 text-xs font-mono bg-muted rounded border border-border focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="space-y-1">
              {filteredHeaders.map(([key, value]) => (
                <div key={key} className="flex gap-2 text-xs font-mono">
                  <span className="text-muted-foreground font-semibold shrink-0">{key}:</span>
                  <span className="text-foreground break-all">{value}</span>
                </div>
              ))}
              {filteredHeaders.length === 0 && (
                <p className="text-xs text-muted-foreground">No headers match your search</p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="cookies" className="flex-1 m-0 overflow-auto">
          <div className="p-3 space-y-2">
            {cookies.map((c, i) => (
              <div key={i} className="p-2 rounded-lg border border-border bg-muted/30 space-y-1">
                <div className="flex items-center gap-2">
                  <Cookie className="size-3 text-amber-400 shrink-0" />
                  <span className="text-xs font-semibold font-mono">{c.name}</span>
                  <span className="text-xs font-mono text-muted-foreground">=</span>
                  <span className="text-xs font-mono text-foreground truncate">{c.value}</span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
                  {c.domain && <span>Domain: {c.domain}</span>}
                  {c.path && <span>Path: {c.path}</span>}
                  {c.expires && <span>Expires: {c.expires}</span>}
                  {c.maxAge && <span>Max-Age: {c.maxAge}</span>}
                  {c.secure && <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">Secure</Badge>}
                  {c.httpOnly && <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">HttpOnly</Badge>}
                  {c.sameSite && <span>SameSite: {c.sameSite}</span>}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="code" className="flex-1 m-0 overflow-auto p-3">
          <CodeGenerator />
        </TabsContent>
      </Tabs>
    </div>
  );
}
