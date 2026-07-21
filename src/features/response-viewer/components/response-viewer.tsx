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
  Activity,
  BarChart3,
  Info,
  Gauge,
  FileJson,
  TrendingUp,
  Save,
  Trash2,
  Eye,
  Layers,
  Table2,
  Network,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useMemo, useCallback } from "react";
import { JsonViewer } from "@/components/json-viewer";
import { CodeGenerator } from "@/components/code-generator-panel";
import { ResponseSearch } from "@/components/response-search";
import { useToastStore } from "@/store/toast-store";
import { usePerformanceStore, normalizeEndpoint } from "@/store/performance-store";
import type { ApiResponse } from "@/types";
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

function formatTransferSpeed(bytes: number, ms: number): string {
  if (ms <= 0 || bytes <= 0) return "0 B/s";
  const bytesPerSec = (bytes / ms) * 1000;
  if (bytesPerSec >= 1024 * 1024) return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
  if (bytesPerSec >= 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
  return `${Math.round(bytesPerSec)} B/s`;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil(p * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
}

interface ServerTimingEntry {
  name: string;
  description?: string;
  duration?: number;
}

function parseServerTiming(header: string): ServerTimingEntry[] {
  return header.split(",").map((part) => {
    const items = part.trim().split(";");
    const name = items[0];
    const entry: ServerTimingEntry = { name };
    for (let i = 1; i < items.length; i++) {
      const eqIdx = items[i].indexOf("=");
      if (eqIdx === -1) continue;
      const key = items[i].slice(0, eqIdx).trim();
      const val = items[i].slice(eqIdx + 1).trim().replace(/^"|"$/g, "");
      if (key === "dur") entry.duration = parseFloat(val);
      else if (key === "desc") entry.description = val;
    }
    return entry;
  });
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

  const handleSaveResponse = useCallback(() => {
    if (!response || !request) return;
    const blob = new Blob([response.body], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const filename = `${request.method.toLowerCase()}-${request.url.replace(/[^a-zA-Z0-9]/g, "-").slice(0, 30)}.json`;
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    addToast("Response saved", "success");
  }, [response, request, addToast]);

  const responseInfo = useMemo(() => {
    if (!response) return null;
    const h = response.headers;
    return {
      contentType: h["content-type"] || h["Content-Type"] || "",
      contentLength: h["content-length"] || h["Content-Length"] || "",
      server: h["server"] || h["Server"] || "",
      date: h["date"] || h["Date"] || "",
      encoding: h["content-encoding"] || h["Content-Encoding"] || "",
    };
  }, [response]);

  const isPreviewable = useMemo(() => {
    const ct = responseInfo?.contentType.toLowerCase() || "";
    const body = response?.body || "";
    if (ct.includes("text/html")) return "html";
    if (ct.includes("image/svg+xml") || body.trim().startsWith("<svg")) return "svg";
    if (body.trim().startsWith("data:image")) return "image";
    return null;
  }, [responseInfo, response]);

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
        <Button variant="ghost" size="icon-xs" onClick={handleSaveResponse} title="Save response as file">
          <Save className="size-3" />
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
              value="performance"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-2.5 py-1 text-xs font-medium"
            >
              <Activity className="size-3 mr-1" />
              Performance
            </TabsTrigger>
            <TabsTrigger
              value="code"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-2.5 py-1 text-xs font-medium"
            >
              Code
            </TabsTrigger>
            {isPreviewable && (
              <TabsTrigger
                value="preview"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-2.5 py-1 text-xs font-medium"
              >
                <Eye className="size-3 mr-1" />
                Preview
              </TabsTrigger>
            )}
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

        {responseInfo && (responseInfo.contentType || responseInfo.server || responseInfo.date) && (
          <div className="flex items-center gap-2 px-3 py-1 bg-muted/20 border-b border-border text-[10px] text-muted-foreground font-mono shrink-0">
            {responseInfo.contentType && (
              <span className="flex items-center gap-1 truncate max-w-[200px]" title={responseInfo.contentType}>
                <FileText className="size-2.5 shrink-0" />
                {responseInfo.contentType.split(";")[0]}
              </span>
            )}
            {responseInfo.contentLength && (
              <span className="shrink-0">{formatBytes(Number(responseInfo.contentLength))}</span>
            )}
            {responseInfo.encoding && (
              <span className="shrink-0">{responseInfo.encoding}</span>
            )}
            {responseInfo.server && (
              <span className="shrink-0 truncate max-w-[100px]" title={responseInfo.server}>
                {responseInfo.server}
              </span>
            )}
            {responseInfo.date && (
              <span className="ml-auto shrink-0 hidden sm:inline">{responseInfo.date}</span>
            )}
          </div>
        )}

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

        <TabsContent value="performance" className="flex-1 m-0 overflow-auto p-3 space-y-4">
          <PerformanceTabContent response={response} url={request?.url ?? ""} />
        </TabsContent>

        <TabsContent value="code" className="flex-1 m-0 overflow-auto p-3">
          <CodeGenerator />
        </TabsContent>
        {isPreviewable && (
          <TabsContent value="preview" className="flex-1 m-0 overflow-auto">
            {isPreviewable === "html" ? (
              <iframe
                srcDoc={response.body}
                sandbox="allow-same-origin"
                className="w-full h-full border-0"
                title="HTML Preview"
              />
            ) : isPreviewable === "svg" ? (
              <div
                className="w-full h-full p-4 flex items-center justify-center bg-white"
                dangerouslySetInnerHTML={{ __html: response.body }}
              />
            ) : (
              <div className="w-full h-full p-4 flex items-center justify-center">
                <img
                  src={response.body}
                  alt="Response preview"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function PerformanceTabContent({ response, url }: { response: ApiResponse; url: string }) {
  const entries = usePerformanceStore((s) => s.entries);
  const { addToast } = useToastStore();
  const endpointKey = normalizeEndpoint(url);
  const history = useMemo(
    () =>
      entries
        .filter((e) => e.endpointKey === endpointKey)
        .slice(0, 20)
        .reverse(),
    [entries, endpointKey]
  );

  const timing = response.timing;
  const hasBreakdown = timing && (timing.ttfb || timing.download);

  // Server-Timing header
  const serverTiming = useMemo(() => {
    const hdr = response.headers?.["server-timing"] || response.headers?.["Server-Timing"];
    return hdr ? parseServerTiming(hdr) : null;
  }, [response]);

  // Transfer speed
  const transferSpeed = useMemo(() => {
    if (response.size <= 0 || response.time <= 0) return null;
    const dlMs = timing?.download ?? response.time;
    return formatTransferSpeed(response.size, dlMs);
  }, [response, timing]);

  // Stats
  const times = history.map((e) => e.time);
  const avgTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  const minTime = times.length > 0 ? Math.min(...times) : 0;
  const maxTime = times.length > 0 ? Math.max(...times) : 0;
  const sortedTimes = [...times].sort((a, b) => a - b);
  const p50 = percentile(sortedTimes, 0.5);
  const p90 = percentile(sortedTimes, 0.9);
  const p95 = percentile(sortedTimes, 0.95);
  const p99 = percentile(sortedTimes, 0.99);

  const chartMax = Math.max(maxTime, 1);

  // Total time line points
  const totalPoints = useMemo(() => {
    if (history.length < 2) return "";
    return history
      .map((e, i) => {
        const x = (i / (history.length - 1)) * 300;
        const y = 76 - ((e.time / chartMax) * 72);
        return `${x},${y}`;
      })
      .join(" ");
  }, [history, chartMax]);

  // TTFB line points
  const hasTtfbHistory = history.some((e) => e.ttfb > 0);
  const ttfbPoints = useMemo(() => {
    if (history.length < 2 || !hasTtfbHistory) return "";
    return history
      .map((e, i) => {
        const x = (i / (history.length - 1)) * 300;
        const y = 76 - (((e.ttfb || 0) / chartMax) * 72);
        return `${x},${y}`;
      })
      .join(" ");
  }, [history, chartMax, hasTtfbHistory]);

  const handleExport = () => {
    const data = {
      endpoint: endpointKey,
      currentResponse: {
        status: response.status,
        time: response.time,
        timing: response.timing,
        size: response.size,
        timestamp: response.timestamp,
      },
      history: history.map((e) => ({
        method: e.method,
        status: e.status,
        time: e.time,
        ttfb: e.ttfb,
        download: e.download,
        size: e.size,
        timestamp: e.timestamp,
      })),
      stats: { avg: avgTime, min: minTime, max: maxTime, p50, p90, p95, p99, totalRequests: history.length },
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const urlObj = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = urlObj;
    a.download = `perf-${endpointKey.replace(/[^a-zA-Z0-9]/g, "-").slice(0, 40)}.json`;
    a.click();
    URL.revokeObjectURL(urlObj);
    addToast("Performance data exported", "success");
  };

  return (
    <>
      {/* Timing Breakdown + Server-Timing */}
      <div>
        <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
          <BarChart3 className="size-3" />
          Timing Breakdown
          {transferSpeed && (
            <span className="ml-auto text-[10px] text-muted-foreground font-normal flex items-center gap-1">
              <Gauge className="size-2.5" />
              {transferSpeed}
            </span>
          )}
        </h4>
        {hasBreakdown ? (
          <TimingBreakdown timing={timing} total={response.time} />
        ) : (
          <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg flex items-center gap-2">
            <Info className="size-3 shrink-0" />
            <span>
              Detailed timing breakdown not available for this response.
              {response.time > 0 && (
                <>{' '}Total time: <strong>{formatDuration(response.time)}</strong>.</>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Server-Timing */}
      {serverTiming && serverTiming.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
            <Activity className="size-3" />
            Server-Timing
          </h4>
          <div className="space-y-1">
            {serverTiming.map((entry, i) => (
              <div key={i} className="flex items-center gap-2 text-xs font-mono p-1.5 bg-muted/30 rounded">
                <span className="font-medium text-foreground">{entry.name}</span>
                {entry.description && (
                  <span className="text-muted-foreground">— {entry.description}</span>
                )}
                {entry.duration !== undefined && (
                  <span className="ml-auto text-foreground">{formatDuration(entry.duration)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Response Time History */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold flex items-center gap-1.5">
            <Activity className="size-3" />
            Response Time History
          </h4>
          {history.length >= 2 && (
            <Button variant="ghost" size="icon-xs" onClick={handleExport} title="Export performance data">
              <FileJson className="size-3" />
            </Button>
          )}
        </div>
        {history.length >= 2 ? (
          <>
            <div className="bg-muted/30 rounded-lg p-2">
              <svg viewBox="0 0 300 80" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
                <line x1={0} y1={4} x2={300} y2={4} stroke="hsl(var(--border))" strokeWidth={0.5} />
                <line x1={0} y1={40} x2={300} y2={40} stroke="hsl(var(--border))" strokeWidth={0.5} />
                <line x1={0} y1={76} x2={300} y2={76} stroke="hsl(var(--border))" strokeWidth={0.5} />
                <text x={298} y={6} className="fill-muted-foreground" fontSize={7} textAnchor="end">
                  {formatDuration(chartMax)}
                </text>
                <text x={298} y={42} className="fill-muted-foreground" fontSize={7} textAnchor="end">
                  {formatDuration(chartMax / 2)}
                </text>
                <text x={298} y={78} className="fill-muted-foreground" fontSize={7} textAnchor="end">
                  0ms
                </text>
                {/* Total area fill */}
                <polygon points={`0,76 ${totalPoints} 300,76`} fill="hsl(var(--primary) / 0.1)" />
                {/* Total line */}
                <polyline points={totalPoints} fill="none" stroke="hsl(var(--primary))" strokeWidth={1.5} />
                {history.map((e, i) => {
                  const x = (i / (history.length - 1)) * 300;
                  const y = 76 - ((e.time / chartMax) * 72);
                  return (
                    <circle key={e.id} cx={x} cy={y} r={2} fill="hsl(var(--primary))">
                      <title>{`${e.method} ${e.status}: ${formatDuration(e.time)}`}</title>
                    </circle>
                  );
                })}
                {/* TTFB line overlay */}
                {hasTtfbHistory && (
                  <>
                    <polyline points={ttfbPoints} fill="none" stroke="hsl(var(--primary))" strokeWidth={1} strokeDasharray="3 2" opacity={0.6} />
                    {history.map((e, i) => {
                      if (!e.ttfb) return null;
                      const x = (i / (history.length - 1)) * 300;
                      const y = 76 - ((e.ttfb / chartMax) * 72);
                      return <circle key={`ttfb-${e.id}`} cx={x} cy={y} r={1.5} fill="hsl(var(--primary))" opacity={0.5} />;
                    })}
                  </>
                )}
              </svg>
              {hasTtfbHistory && (
                <div className="flex items-center gap-3 text-[9px] text-muted-foreground mt-1 px-1">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-0.5 bg-primary rounded-full" /> Total
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-0.5 bg-primary rounded-full opacity-60" style={{ strokeDasharray: "3 2" }} /> TTFB
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
              <span>Oldest</span>
              <span>{history.length} requests</span>
              <span>Newest</span>
            </div>
          </>
        ) : (
          <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg flex items-center gap-2">
            <Activity className="size-3 shrink-0" />
            <span>
              {history.length === 1
                ? "Send more requests to see response time trends."
                : "No historical data yet. Send some requests first."}
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      {history.length >= 2 && (
        <div>
          <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
            <TrendingUp className="size-3" />
            Distribution
          </h4>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "P50", value: formatDuration(p50), desc: "Median" },
              { label: "P90", value: formatDuration(p90), desc: "90th percentile" },
              { label: "P95", value: formatDuration(p95), desc: "95th percentile" },
              { label: "P99", value: formatDuration(p99), desc: "99th percentile" },
            ].map(({ label, value, desc }) => (
              <div key={label} className="p-2 bg-muted/30 rounded-lg text-center">
                <div className="text-[10px] font-semibold text-foreground">{label}</div>
                <div className="text-xs font-mono mt-0.5">{value}</div>
                <div className="text-[9px] text-muted-foreground">{desc}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="p-2 bg-muted/30 rounded-lg text-center">
              <div className="text-[10px] text-muted-foreground">Average</div>
              <div className="text-xs font-mono font-semibold mt-0.5">{formatDuration(avgTime)}</div>
            </div>
            <div className="p-2 bg-muted/30 rounded-lg text-center">
              <div className="text-[10px] text-muted-foreground">Min</div>
              <div className="text-xs font-mono font-semibold mt-0.5">{formatDuration(minTime)}</div>
            </div>
            <div className="p-2 bg-muted/30 rounded-lg text-center">
              <div className="text-[10px] text-muted-foreground">Max</div>
              <div className="text-xs font-mono font-semibold mt-0.5">{formatDuration(maxTime)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Waterfall Timeline */}
      {hasBreakdown && (() => {
        const phases: { label: string; value: number; offset: number; color: string; desc: string }[] = [];
        let cumOffset = 0;
        if (timing.dnsLookup && timing.dnsLookup > 0) {
          phases.push({ label: "DNS", value: timing.dnsLookup, offset: cumOffset, color: "bg-sky-500", desc: "DNS Lookup" });
          cumOffset += timing.dnsLookup;
        }
        if (timing.tcpConnect && timing.tcpConnect > 0) {
          phases.push({ label: "TCP", value: timing.tcpConnect, offset: cumOffset, color: "bg-teal-500", desc: "TCP Connect" });
          cumOffset += timing.tcpConnect;
        }
        if (timing.tlsHandshake && timing.tlsHandshake > 0) {
          phases.push({ label: "TLS", value: timing.tlsHandshake, offset: cumOffset, color: "bg-indigo-500", desc: "TLS Handshake" });
          cumOffset += timing.tlsHandshake;
        }
        if (timing.ttfb && timing.ttfb > cumOffset) {
          phases.push({ label: "Waiting", value: timing.ttfb - cumOffset, offset: cumOffset, color: "bg-amber-500", desc: "TTFB" });
          cumOffset = timing.ttfb;
        }
        if (timing.download && timing.download > 0) {
          phases.push({ label: "Download", value: timing.download, offset: cumOffset, color: "bg-violet-500", desc: "Body Download" });
        }
        if (phases.length < 2) return null;
        const waterfallTotal = phases.reduce((s, p) => s + p.value, 0) || 1;
        return (
          <div>
            <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
              <Layers className="size-3" />
              Waterfall Timeline
            </h4>
            <div className="bg-muted/30 rounded-lg p-3 space-y-1.5">
              {phases.map((p) => {
                const pctOfTotal = (p.value / waterfallTotal) * 100;
                const offsetPct = (p.offset / response.time) * 100;
                return (
                  <div key={p.label} className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground w-10 shrink-0">{p.label}</span>
                    <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden relative">
                      <div
                        className={cn("h-full rounded-full absolute top-0", p.color)}
                        style={{ left: `${offsetPct}%`, width: `${Math.max(pctOfTotal, 1)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-foreground w-12 text-right shrink-0">{formatDuration(p.value)}</span>
                  </div>
                );
              })}
              <div className="flex items-center gap-2 pt-1 border-t border-border mt-1">
                <span className="text-[10px] font-mono text-muted-foreground w-10 shrink-0">Total</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden relative">
                  <div className="h-full rounded-full bg-foreground/60 absolute top-0 left-0 w-full" />
                </div>
                <span className="text-[10px] font-mono text-foreground w-12 text-right shrink-0">{formatDuration(response.time)}</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Response Size History */}
      {history.filter((e) => e.size > 0).length >= 2 && (() => {
        const sizeHistory = history.filter((e) => e.size > 0);
        const sizeMax = Math.max(...sizeHistory.map((e) => e.size), 1);
        const sizePoints = sizeHistory
          .map((e, i) => {
            const x = (i / (sizeHistory.length - 1)) * 300;
            const y = 76 - ((e.size / sizeMax) * 72);
            return `${x},${y}`;
          })
          .join(" ");
        return (
          <div>
            <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
              <BarChart3 className="size-3" />
              Response Size History
            </h4>
            <div className="bg-muted/30 rounded-lg p-2">
              <svg viewBox="0 0 300 80" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
                <line x1={0} y1={76} x2={300} y2={76} stroke="hsl(var(--border))" strokeWidth={0.5} />
                <polygon points={`0,76 ${sizePoints} 300,76`} fill="hsl(var(--chart-2) / 0.12)" />
                <polyline points={sizePoints} fill="none" stroke="hsl(var(--chart-2))" strokeWidth={1.5} />
                {sizeHistory.map((e, i) => {
                  const x = (i / (sizeHistory.length - 1)) * 300;
                  const y = 76 - ((e.size / sizeMax) * 72);
                  return (
                    <circle key={e.id} cx={x} cy={y} r={2} fill="hsl(var(--chart-2))">
                      <title>{`${formatBytes(e.size)}`}</title>
                    </circle>
                  );
                })}
                <text x={298} y={10} className="fill-muted-foreground" fontSize={7} textAnchor="end">
                  {formatBytes(sizeMax)}
                </text>
                <text x={298} y={78} className="fill-muted-foreground" fontSize={7} textAnchor="end">
                  0 B
                </text>
              </svg>
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
              <span>Oldest</span>
              <span>{sizeHistory.length} responses</span>
              <span>Newest</span>
            </div>
          </div>
        );
      })()}

      {/* Status Code Distribution */}
      {history.length >= 2 && (() => {
        const counts = { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0 };
        for (const e of history) {
          if (e.status >= 200 && e.status < 300) counts["2xx"]++;
          else if (e.status >= 300 && e.status < 400) counts["3xx"]++;
          else if (e.status >= 400 && e.status < 500) counts["4xx"]++;
          else if (e.status >= 500) counts["5xx"]++;
        }
        const total = counts["2xx"] + counts["3xx"] + counts["4xx"] + counts["5xx"];
        if (total === 0) return null;
        const bars = [
          { key: "2xx", count: counts["2xx"], color: "bg-emerald-500", label: "2xx Success" },
          { key: "3xx", count: counts["3xx"], color: "bg-amber-400", label: "3xx Redirect" },
          { key: "4xx", count: counts["4xx"], color: "bg-orange-500", label: "4xx Client Error" },
          { key: "5xx", count: counts["5xx"], color: "bg-red-500", label: "5xx Server Error" },
        ].filter((b) => b.count > 0);
        return (
          <div>
            <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
              <Table2 className="size-3" />
              Status Distribution
            </h4>
            <div className="bg-muted/30 rounded-lg p-3 space-y-2">
              <div className="flex h-4 rounded-full overflow-hidden">
                {bars.map((b) => (
                  <div
                    key={b.key}
                    className={b.color}
                    style={{ width: `${(b.count / total) * 100}%` }}
                    title={`${b.label}: ${b.count} (${Math.round((b.count / total) * 100)}%)`}
                  />
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {bars.map((b) => (
                  <div key={b.key} className="flex items-center gap-1.5 text-[10px]">
                    <span className={cn("size-2 rounded-sm shrink-0", b.color)} />
                    <span className="text-muted-foreground">{b.key}</span>
                    <span className="text-foreground font-mono">{b.count}</span>
                    <span className="text-muted-foreground">({Math.round((b.count / total) * 100)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Latency Overview Grid */}
      {history.length >= 4 && (() => {
        const gridItems = [...history].reverse();
        return (
          <div>
            <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
              <Network className="size-3" />
              Latency Overview
            </h4>
            <div className="bg-muted/30 rounded-lg p-2">
              <div className="flex flex-wrap gap-0.5">
                {gridItems.map((e) => {
                  const t = e.time;
                  const color =
                    t < 200
                      ? "bg-emerald-500"
                      : t < 500
                        ? "bg-amber-400"
                        : t < 1000
                          ? "bg-orange-500"
                          : "bg-red-500";
                  return (
                    <div
                      key={e.id}
                      className={cn("size-3 rounded-sm", color)}
                      title={`${e.method} ${e.status}: ${formatDuration(e.time)}`}
                    />
                  );
                })}
              </div>
              <div className="flex items-center gap-2 mt-1.5 text-[9px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-emerald-500" /> &lt;200ms</span>
                <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-amber-400" /> &lt;500ms</span>
                <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-orange-500" /> &lt;1s</span>
                <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-red-500" /> &ge;1s</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Data Management */}
      {history.length > 0 && (
        <div className="pt-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-destructive"
            onClick={() => {
              usePerformanceStore.getState().clearEndpointEntries(endpointKey);
              addToast("Performance history cleared for this endpoint", "success");
            }}
          >
            <Trash2 className="size-3" />
            Clear history
          </Button>
        </div>
      )}
    </>
  );
}

function TimingBreakdown({
  timing,
  total,
}: {
  timing: NonNullable<ApiResponse["timing"]>;
  total: number;
}) {
  const segments = [
    { label: "TTFB", value: timing.ttfb ?? 0, color: "bg-sky-500", desc: "Time to first byte" },
    { label: "Download", value: timing.download ?? 0, color: "bg-violet-500", desc: "Body download" },
  ];

  return (
    <div className="space-y-2">
      {segments.map((seg) => {
        const pct = total > 0 ? (seg.value / total) * 100 : 0;
        return (
          <div key={seg.label} className="flex items-center gap-2">
            <div className="w-16 shrink-0">
              <div className="text-xs font-medium">{seg.label}</div>
              <div className="text-[9px] text-muted-foreground leading-tight">{seg.desc}</div>
            </div>
            <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", seg.color)}
                style={{ width: `${Math.max(pct, 1)}%` }}
              />
            </div>
            <div className="w-14 text-right text-xs font-mono shrink-0">
              {formatDuration(seg.value)}
            </div>
          </div>
        );
      })}
      <div className="flex items-center gap-2 pt-1.5 mt-1.5 border-t border-border">
        <div className="w-16 shrink-0">
          <div className="text-xs font-medium">Total</div>
        </div>
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-foreground/60" style={{ width: "100%" }} />
        </div>
        <div className="w-14 text-right text-xs font-mono shrink-0">
          {formatDuration(total)}
        </div>
      </div>
    </div>
  );
}
