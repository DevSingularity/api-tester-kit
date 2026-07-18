"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { useCollectionStore } from "@/store/collection-store";
import { useRequestStore } from "@/store/request-store";
import { useEnvironmentStore } from "@/store/environment-store";
import { sendRequest } from "@/lib/api-engine";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Play, Square, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { getStatusColor, formatDuration } from "@/utils";
import type { ApiRequest, ApiResponse } from "@/types";

interface RunResult {
  request: ApiRequest;
  response: ApiResponse | null;
  status: "pending" | "running" | "success" | "error";
  error?: string;
}

export default function RunnerPage() {
  const { collections } = useCollectionStore();
  const { proxyMode } = useRequestStore();
  const { getActiveVariables } = useEnvironmentStore();
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [results, setResults] = useState<RunResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const collection = collections.find((c) => c.id === selectedCollection);

  const handleRun = async () => {
    if (!collection || collection.requests.length === 0) return;

    setIsRunning(true);
    const controller = new AbortController();
    setAbortController(controller);

    const initialResults: RunResult[] = collection.requests.map((req) => ({
      request: req,
      response: null,
      status: "pending" as const,
    }));
    setResults(initialResults);

    for (let i = 0; i < collection.requests.length; i++) {
      if (controller.signal.aborted) break;

      const req = collection.requests[i];
      setResults((prev) =>
        prev.map((r, idx) =>
          idx === i ? { ...r, status: "running" as const } : r
        )
      );

      try {
        const response = await sendRequest({
          request: req,
          proxyMode,
          variables: getActiveVariables(),
          signal: controller.signal,
        });

        setResults((prev) =>
          prev.map((r, idx) =>
            idx === i
              ? { ...r, response, status: "success" as const }
              : r
          )
        );
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Request failed";
        setResults((prev) =>
          prev.map((r, idx) =>
            idx === i
              ? { ...r, status: "error" as const, error: errorMsg }
              : r
          )
        );
      }
    }

    setIsRunning(false);
    setAbortController(null);
  };

  const handleStop = () => {
    abortController?.abort();
    setIsRunning(false);
    setAbortController(null);
  };

  const stats = {
    total: results.length,
    success: results.filter((r) => r.status === "success").length,
    error: results.filter((r) => r.status === "error").length,
    pending: results.filter((r) => r.status === "pending").length,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between h-12 px-4 border-b border-border shrink-0">
          <h1 className="text-sm font-semibold">Collection Runner</h1>
          <div className="flex items-center gap-2">
            {isRunning ? (
              <Button size="sm" variant="destructive" onClick={handleStop} className="gap-1">
                <Square className="size-3.5" />
                Stop
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleRun}
                disabled={!collection || collection.requests.length === 0}
                className="gap-1"
              >
                <Play className="size-3.5" />
                Run Collection
              </Button>
            )}
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <div className="w-64 border-r border-border flex flex-col">
            <div className="p-3 border-b border-border">
              <p className="text-xs font-medium text-muted-foreground mb-2">Select Collection</p>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-0.5">
                {collections.map((col) => (
                  <button
                    key={col.id}
                    className={`w-full text-left px-2.5 py-1.5 text-sm rounded-md transition-colors ${
                      selectedCollection === col.id ? "bg-muted" : "hover:bg-muted/50"
                    }`}
                    onClick={() => {
                      setSelectedCollection(col.id);
                      setResults([]);
                    }}
                  >
                    <span className="truncate block">{col.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {col.requests.length} requests
                    </span>
                  </button>
                ))}
                {collections.length === 0 && (
                  <p className="text-xs text-muted-foreground p-2">
                    No collections found
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            {results.length > 0 && (
              <div className="flex items-center gap-4 px-4 py-2 border-b border-border text-xs">
                <span className="text-muted-foreground">Total: {stats.total}</span>
                <span className="text-emerald-400">Success: {stats.success}</span>
                <span className="text-red-400">Failed: {stats.error}</span>
                <span className="text-muted-foreground">Pending: {stats.pending}</span>
              </div>
            )}

            <ScrollArea className="flex-1">
              {results.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <Play className="size-10 mb-3 opacity-50" />
                  <p className="text-sm">
                    {collection
                      ? "Click Run to execute all requests"
                      : "Select a collection to run"}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {results.map((result, index) => (
                    <div
                      key={result.request.id}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30"
                    >
                      <div className="shrink-0">
                        {result.status === "pending" && (
                          <Clock className="size-4 text-muted-foreground" />
                        )}
                        {result.status === "running" && (
                          <Loader2 className="size-4 text-primary animate-spin" />
                        )}
                        {result.status === "success" && (
                          <CheckCircle className="size-4 text-emerald-400" />
                        )}
                        {result.status === "error" && (
                          <XCircle className="size-4 text-red-400" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground font-mono w-6">
                        {index + 1}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-mono w-14 justify-center ${
                          result.status === "success" && result.response
                            ? getStatusColor(result.response.status)
                            : ""
                        }`}
                      >
                        {result.response ? result.response.status : "—"}
                      </Badge>
                      <span className="text-xs font-mono font-semibold text-muted-foreground w-14">
                        {result.request.method}
                      </span>
                      <span className="text-xs font-mono truncate flex-1">
                        {result.request.name}
                      </span>
                      {result.response && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {formatDuration(result.response.time)}
                        </span>
                      )}
                      {result.error && (
                        <span className="text-[10px] text-red-400 truncate max-w-48">
                          {result.error}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}
