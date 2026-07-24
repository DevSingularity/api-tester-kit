"use client";

import { useRef, useEffect, useState } from "react";
import type { HttpMethod } from "@/types";
import { useRequestStore } from "@/store/request-store";
import { useEnvironmentStore } from "@/store/environment-store";
import { sendRequest, sendStreamingRequest } from "@/lib/api-engine";
import { executeScript } from "@/lib/script-runner";
import { importCurlCommand } from "@/lib/import-export";
import { MethodSelector } from "@/components/method-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Send, Square, Pencil, Timer, Radio } from "lucide-react";
import { useHistoryStore } from "@/store/history-store";
import { useToastStore } from "@/store/toast-store";
import { usePerformanceStore, normalizeEndpoint } from "@/store/performance-store";
import { UrlAutocomplete } from "@/components/url-autocomplete";
import { VariablePicker } from "@/components/variable-picker";

export function UrlBar() {
  const {
    getActiveRequest,
    updateUrl,
    updateMethod,
    updateRequest,
    setLoading,
    setResponse,
    loading,
    proxyMode,
    cancelRequest,
    setCancelController,
    appendStreamChunk,
    resetStreaming,
    stopStreaming,
  } = useRequestStore();
  const { resolveVariables } = useEnvironmentStore();
  const { addEntry } = useHistoryStore();
  const { addToast } = useToastStore();
  const request = getActiveRequest();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const state = useRequestStore.getState();
    const activeRequest = state.getActiveRequest();
    if (!activeRequest) return;

    const text = e.clipboardData.getData("text");
    if (!text.trim().toLowerCase().startsWith("curl ")) return;
    e.preventDefault();

    try {
      const parsed = importCurlCommand(text);
      state.updateUrl(activeRequest.id, parsed.url);
      state.updateMethod(activeRequest.id, parsed.method);
      if (parsed.headers.length > 0) {
        const existingHeaders = activeRequest.headers.filter(
          (h) => !h.key || h.key === "Content-Type"
        );
        const merged = [...existingHeaders];
        for (const ph of parsed.headers) {
          if (!merged.some((mh) => mh.key.toLowerCase() === ph.key.toLowerCase())) {
            merged.push(ph);
          }
        }
        state.updateHeaders(activeRequest.id, merged);
      }
      if (parsed.body.type !== "none" && parsed.body.raw) {
        state.updateBody(activeRequest.id, parsed.body.type, parsed.body.raw);
      }
      addToast("cURL command parsed successfully", "success");
    } catch {
      // If parsing fails, treat as regular URL input
    }
  };

  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  useEffect(() => {
    if (!request) return;
    const hasAcceptEventStream = request.headers.some(
      (h) => h.enabled && h.key.toLowerCase() === "accept" && h.value.toLowerCase().includes("text/event-stream")
    );
    const isSseUrl = /\/events?$|\/sse$|\/stream$|\/subscribe$/i.test(request.url);
    if (!request.stream && (isSseUrl || hasAcceptEventStream)) {
      updateRequest(request.id, { stream: true });
    }
  }, [request?.url, request?.headers]);

  if (!request) return null;

  const isLoading = loading[request.id];

  const TIMEOUT_OPTIONS = [
    { label: "No timeout", value: 0 },
    { label: "5s", value: 5000 },
    { label: "10s", value: 10000 },
    { label: "30s", value: 30000 },
    { label: "60s", value: 60000 },
  ] as const;

  const currentTimeout = request.timeout ?? 0;

  const handleSend = async () => {
    if (!request.url) return;

    const controller = new AbortController();
    setCancelController(request.id, controller);
    setLoading(request.id, true);

    if (currentTimeout > 0) {
      const timeoutId = setTimeout(() => controller.abort(), currentTimeout);
      controller.signal.addEventListener("abort", () => clearTimeout(timeoutId), { once: true });
    }

    const variables = useEnvironmentStore.getState().getActiveVariables();
    let resolvedVars = { ...variables };

    const preScript = request.preRequestScript?.trim();
    if (preScript) {
      const preResult = executeScript(preScript, {
        request,
        response: null,
        variables: resolvedVars,
      });
      resolvedVars = { ...preResult.variables };
      if (preResult.errors.length > 0) {
        addToast(`Pre-request script errors: ${preResult.errors.join(", ")}`, "warning");
      }
    }

    try {
      const resolvedRequest = {
        ...request,
        url: resolveVariables(request.url),
      };

      let response: import("@/types").ApiResponse;

      if (request.stream) {
        resetStreaming(request.id);
        response = await sendStreamingRequest({
          request: resolvedRequest,
          proxyMode,
          variables: resolvedVars,
          signal: controller.signal,
          onResponseInit: (status, statusText, headers) => {
            setResponse(request.id, { status, statusText, headers, body: "", time: 0, size: 0, timestamp: new Date().toISOString() });
          },
          onChunk: (chunk) => {
            appendStreamChunk(request.id, chunk);
          },
        });
      } else {
        response = await sendRequest({
          request: resolvedRequest,
          proxyMode,
          variables: resolvedVars,
          signal: controller.signal,
        });
      }

      stopStreaming(request.id);
      setResponse(request.id, response);
      addEntry({ request, response });
      usePerformanceStore.getState().addEntry({
        endpointKey: normalizeEndpoint(request.url),
        method: request.method,
        url: request.url,
        status: response.status,
        time: response.time,
        ttfb: response.timing?.ttfb || response.time,
        download: response.timing?.download || 0,
        size: response.size,
        timestamp: response.timestamp,
      });

      const testScript = request.testScript?.trim();
      if (testScript) {
        const testResult = executeScript(testScript, {
          request,
          response,
          variables: resolvedVars,
        });
        useRequestStore.getState().setTestResults(request.id, {
          logs: testResult.logs,
          errors: testResult.errors,
          assertions: testResult.assertions,
        });
        if (testResult.assertions.failed > 0) {
          addToast(`Tests: ${testResult.assertions.passed} passed, ${testResult.assertions.failed} failed`, "warning");
        } else if (testResult.assertions.passed > 0) {
          addToast(`Tests: ${testResult.assertions.passed} passed`, "success");
        }
      }

      addToast(`Request completed: ${response.status} ${response.statusText}`, response.status >= 400 ? "warning" : "success");
    } catch (error) {
      stopStreaming(request.id);
      if (error instanceof DOMException && error.name === "AbortError") return;
      const errorMessage =
        error instanceof Error ? error.message : "Request failed";
      setResponse(request.id, {
        status: 0,
        statusText: "Error",
        headers: {},
        body: JSON.stringify({ error: errorMessage }),
        time: 0,
        size: 0,
        timestamp: new Date().toISOString(),
      });
      addToast(`Request failed: ${errorMessage}`, "error");
    } finally {
      setLoading(request.id, false);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-w-0 gap-0">
      <div className="flex items-center gap-0">
        <MethodSelector
          value={request.method}
          onChange={(method: HttpMethod) => updateMethod(request.id, method)}
        />
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "inline-flex items-center justify-center h-9 px-1.5",
              "text-muted-foreground hover:text-foreground border-y border-border",
              "cursor-pointer",
              currentTimeout > 0 && "text-amber-400"
            )}
            title={`Timeout: ${currentTimeout > 0 ? `${currentTimeout / 1000}s` : "None"}`}
          >
            <Timer className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-32">
            {TIMEOUT_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => updateRequest(request.id, { timeout: opt.value })}
                className={cn("text-xs", currentTimeout === opt.value && "text-primary font-medium")}
              >
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <UrlAutocomplete
          value={request.url}
          onChange={(url) => updateUrl(request.id, url)}
          className="flex-1"
        >
          <Input
            ref={(el) => { if (el && !request.url) setTimeout(() => el.focus(), 50); }}
            value={request.url}
            onChange={(e) => updateUrl(request.id, e.target.value)}
            onPaste={handlePaste}
            placeholder="Enter URL or paste cURL"
            className="h-9 rounded-none border-l-0 border-r-0 font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </UrlAutocomplete>
        <VariablePicker
          onSelect={(key) => updateUrl(request.id, request.url + `{{${key}}}`)}
        />
        <button
          onClick={() => updateRequest(request.id, { stream: !request.stream })}
          className={cn(
            "inline-flex items-center justify-center h-9 px-2 border-y border-border text-xs gap-1",
            "text-muted-foreground hover:text-foreground cursor-pointer",
            request.stream && "text-primary"
          )}
          title={request.stream ? "Streaming enabled" : "Streaming disabled"}
        >
          <Radio className={cn("size-3.5", request.stream && "animate-pulse")} />
        </button>
        {isLoading ? (
          <Button
            size="sm"
            variant="destructive"
            className="h-9 rounded-l-none rounded-r-lg px-3"
            onClick={() => cancelRequest(request.id)}
            title="Cancel request"
          >
            <Square className="size-4" />
          </Button>
        ) : (
          <Button
            size="sm"
            className="h-9 rounded-l-none rounded-r-lg px-3"
            onClick={handleSend}
            disabled={!request.url}
            title="Send Request (Ctrl+Enter)"
          >
            <Send className="size-4" />
            Send
          </Button>
        )}
      </div>
    </div>
  );
}
