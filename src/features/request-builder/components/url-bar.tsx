"use client";

import { useRef, useEffect, useState } from "react";
import type { HttpMethod } from "@/types";
import { useRequestStore } from "@/store/request-store";
import { useEnvironmentStore } from "@/store/environment-store";
import { sendRequest } from "@/lib/api-engine";
import { importCurlCommand } from "@/lib/import-export";
import { MethodSelector } from "@/components/method-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Square, Pencil } from "lucide-react";
import { useHistoryStore } from "@/store/history-store";
import { useToastStore } from "@/store/toast-store";

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

  if (!request) return null;

  const isLoading = loading[request.id];

  const handleSend = async () => {
    if (!request.url) return;

    const controller = new AbortController();
    setCancelController(request.id, controller);
    setLoading(request.id, true);

    try {
      const resolvedRequest = {
        ...request,
        url: resolveVariables(request.url),
      };

      const response = await sendRequest({
        request: resolvedRequest,
        proxyMode,
        variables: useEnvironmentStore.getState().getActiveVariables(),
        signal: controller.signal,
      });

      setResponse(request.id, response);
      addEntry({ request, response });
      addToast(`Request completed: ${response.status} ${response.statusText}`, response.status >= 400 ? "warning" : "success");
    } catch (error) {
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
      {editingName ? (
        <div className="flex items-center gap-0 border-b border-border">
          <input
            ref={nameInputRef}
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={() => {
              if (nameDraft.trim()) {
                updateRequest(request.id, { name: nameDraft.trim() });
              }
              setEditingName(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (nameDraft.trim()) {
                  updateRequest(request.id, { name: nameDraft.trim() });
                }
                setEditingName(false);
              }
              if (e.key === "Escape") {
                setEditingName(false);
              }
            }}
            className="h-7 px-3 text-xs font-medium bg-transparent focus:outline-none focus:ring-0 flex-1"
            placeholder="Request name..."
          />
        </div>
      ) : (
        <div
          className="flex items-center gap-1.5 h-7 px-3 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors group"
          onClick={() => {
            setNameDraft(request.name);
            setEditingName(true);
          }}
        >
          <Pencil className="size-2.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          <span className="text-xs font-medium text-foreground truncate">
            {request.name || "Untitled Request"}
          </span>
        </div>
      )}
      <div className="flex items-center gap-0">
        <MethodSelector
          value={request.method}
          onChange={(method: HttpMethod) => updateMethod(request.id, method)}
        />
        <Input
          ref={(el) => { if (el && !request.url) setTimeout(() => el.focus(), 50); }}
          value={request.url}
          onChange={(e) => updateUrl(request.id, e.target.value)}
          onPaste={handlePaste}
          placeholder="Enter URL or paste cURL"
          className="h-9 rounded-none border-l-0 border-r-0 font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
        />
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
