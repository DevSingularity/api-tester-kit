"use client";

import { useState, useCallback } from "react";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Play,
  Loader2,
  Copy,
  Check,
  Trash2,
  Plus,
  History,
} from "lucide-react";
import { useEnvironmentStore } from "@/store/environment-store";
import { useHistoryStore } from "@/store/history-store";

interface GraphQLResponse {
  data?: unknown;
  errors?: Array<{ message: string; locations?: unknown; path?: unknown[] }>;
  extensions?: Record<string, unknown>;
}

interface HistoryEntry {
  id: string;
  url: string;
  query: string;
  timestamp: string;
}

const DEFAULT_QUERY = `query GetUsers {
  users {
    id
    name
    email
  }
}`;

export default function GraphQLPage() {
  const [url, setUrl] = useState("https://api.example.com/graphql");
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [variables, setVariables] = useState("{}");
  const [headers, setHeaders] = useState<Array<{ key: string; value: string; enabled: boolean }>>([
    { key: "Content-Type", value: "application/json", enabled: true },
  ]);
  const [response, setResponse] = useState<GraphQLResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"variables" | "headers">("variables");
  const [queryHistory, setQueryHistory] = useState<HistoryEntry[]>([]);

  const resolveVariables = useEnvironmentStore((s) => s.resolveVariables);
  const addHistoryEntry = useHistoryStore((s) => s.addEntry);

  const executeQuery = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    const startTime = Date.now();

    try {
      const resolvedUrl = resolveVariables(url);
      const resolvedQuery = resolveVariables(query);
      const resolvedVariables = resolveVariables(variables);

      const headerObj: Record<string, string> = {};
      for (const h of headers) {
        if (h.enabled && h.key) {
          headerObj[h.key] = resolveVariables(h.value);
        }
      }
      if (!headerObj["Content-Type"]) {
        headerObj["Content-Type"] = "application/json";
      }

      let parsedVariables: Record<string, unknown> = {};
      if (resolvedVariables.trim()) {
        try {
          parsedVariables = JSON.parse(resolvedVariables);
        } catch {
          throw new Error("Invalid JSON in variables");
        }
      }

      const res = await fetch(resolvedUrl, {
        method: "POST",
        headers: headerObj,
        body: JSON.stringify({
          query: resolvedQuery,
          variables: parsedVariables,
        }),
      });

      const duration = Date.now() - startTime;
      const data = await res.json();

      setResponse(data as GraphQLResponse);

      const newEntry: HistoryEntry = {
        id: crypto.randomUUID(),
        url: resolvedUrl,
        query: resolvedQuery,
        timestamp: new Date().toISOString(),
      };
      setQueryHistory((prev) => [newEntry, ...prev].slice(0, 50));

      addHistoryEntry({
        request: {
          id: crypto.randomUUID(),
          name: "GraphQL Query",
          method: "POST",
          url: resolvedUrl,
          params: [],
          headers: Object.entries(headerObj).map(([key, value]) => ({
            id: crypto.randomUUID(),
            key,
            value,
            enabled: true,
          })),
          body: { type: "json", raw: resolvedQuery },
          auth: { type: "none" },
        },
        response: {
          status: res.status,
          statusText: res.statusText,
          headers: Object.fromEntries(res.headers.entries()),
          body: JSON.stringify(data),
          time: duration,
          size: JSON.stringify(data).length,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, [url, query, variables, headers, resolveVariables, addHistoryEntry]);

  const copyQuery = useCallback(() => {
    navigator.clipboard.writeText(query);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [query]);

  const loadFromHistory = useCallback((entry: HistoryEntry) => {
    setUrl(entry.url);
    setQuery(entry.query);
  }, []);

  const formatQuery = useCallback(() => {
    try {
      let formatted = query;
      formatted = formatted.replace(/\s+/g, " ").trim();
      let indent = 0;
      let result = "";
      for (let i = 0; i < formatted.length; i++) {
        const char = formatted[i];
        if (char === "{") {
          indent++;
          result += " {\n" + "  ".repeat(indent);
        } else if (char === "}") {
          indent--;
          result += "\n" + "  ".repeat(indent) + "}";
        } else if (char === "," || (char === " " && formatted[i + 1] !== "{" && formatted[i + 1] !== "}")) {
          if (char === ",") {
            result += "\n" + "  ".repeat(indent);
          } else {
            result += char;
          }
        } else {
          result += char;
        }
      }
      setQuery(result.trim());
    } catch {
      // ignore format errors
    }
  }, [query]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-3 px-4 h-12 border-b bg-card">
          <Badge variant="outline" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30">
            GraphQL
          </Badge>
          <div className="flex-1 flex items-center gap-2">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.example.com/graphql"
              className="h-8 text-sm font-mono"
              onKeyDown={(e) => e.key === "Enter" && executeQuery()}
            />
          </div>
          <Button
            size="sm"
            onClick={executeQuery}
            disabled={loading}
            className="h-8 gap-1.5"
          >
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
            {loading ? "Running..." : "Run"}
          </Button>
        </header>

        <div className="flex-1 flex min-h-0">
          <div className="flex-1 flex flex-col border-r min-w-0">
            <div className="flex items-center justify-between px-3 h-9 border-b bg-card/50">
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs font-medium"
                  onClick={copyQuery}
                >
                  {copied ? <Check className="size-3 mr-1" /> : <Copy className="size-3 mr-1" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs font-medium"
                  onClick={formatQuery}
                >
                  Format
                </Button>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {query.length} chars
              </span>
            </div>
            <div className="flex-1 relative min-h-0">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-full resize-none bg-transparent p-3 font-mono text-sm leading-relaxed focus:outline-none"
                placeholder="Enter your GraphQL query..."
                spellCheck={false}
              />
            </div>
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center gap-1 px-3 h-9 border-b bg-card/50">
              <Button
                variant={activeTab === "variables" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setActiveTab("variables")}
              >
                Variables
              </Button>
              <Button
                variant={activeTab === "headers" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setActiveTab("headers")}
              >
                Headers ({headers.filter((h) => h.enabled && h.key).length})
              </Button>
            </div>
            <div className="flex-1 min-h-0">
              {activeTab === "variables" ? (
                <textarea
                  value={variables}
                  onChange={(e) => setVariables(e.target.value)}
                  className="w-full h-full resize-none bg-transparent p-3 font-mono text-sm leading-relaxed focus:outline-none"
                  placeholder='{"id": 1}'
                  spellCheck={false}
                />
              ) : (
                <div className="p-3 space-y-2">
                  {headers.map((h, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <Input
                        value={h.key}
                        onChange={(e) => {
                          const newHeaders = [...headers];
                          newHeaders[i] = { ...newHeaders[i], key: e.target.value };
                          setHeaders(newHeaders);
                        }}
                        placeholder="Header name"
                        className="h-7 text-xs font-mono flex-1"
                      />
                      <Input
                        value={h.value}
                        onChange={(e) => {
                          const newHeaders = [...headers];
                          newHeaders[i] = { ...newHeaders[i], value: e.target.value };
                          setHeaders(newHeaders);
                        }}
                        placeholder="Value"
                        className="h-7 text-xs font-mono flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-1.5"
                        onClick={() => {
                          const newHeaders = headers.filter((_, idx) => idx !== i);
                          setHeaders(newHeaders);
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
                    onClick={() => setHeaders([...headers, { key: "", value: "", enabled: true }])}
                  >
                    <Plus className="size-3" />
                    Add Header
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Separator orientation="vertical" />

          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center px-3 h-9 border-b bg-card/50">
              <span className="text-xs font-medium">Response</span>
              {response && (
                <Badge variant="secondary" className="ml-2 h-5 text-[10px]">
                  {response.errors ? "Error" : "Success"}
                </Badge>
              )}
            </div>
            <div className="flex-1 min-h-0">
              {response ? (
                <ScrollArea className="h-full">
                  <pre className="p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all">
                    {JSON.stringify(response, null, 2)}
                  </pre>
                </ScrollArea>
              ) : error ? (
                <div className="p-3 text-xs text-destructive">{error}</div>
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                  Run a query to see the response
                </div>
              )}
            </div>
          </div>
        </div>

        {queryHistory.length > 0 && (
          <div className="border-t bg-card/50">
            <div className="flex items-center gap-2 px-3 py-1.5">
              <History className="size-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Recent Queries</span>
            </div>
            <div className="flex gap-1 px-3 pb-2 overflow-x-auto">
              {queryHistory.slice(0, 5).map((entry) => (
                <Button
                  key={entry.id}
                  variant="outline"
                  size="sm"
                  className="h-6 text-[10px] font-mono shrink-0"
                  onClick={() => loadFromHistory(entry)}
                >
                  {entry.url.replace(/^https?:\/\//, "").slice(0, 20)}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
