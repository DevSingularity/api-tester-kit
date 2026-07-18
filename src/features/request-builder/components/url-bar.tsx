"use client";

import { useState } from "react";
import type { HttpMethod } from "@/types";
import { useRequestStore } from "@/store/request-store";
import { useEnvironmentStore } from "@/store/environment-store";
import { sendRequest } from "@/lib/api-engine";
import { MethodSelector } from "@/components/method-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Square } from "lucide-react";
import { useHistoryStore } from "@/store/history-store";

export function UrlBar() {
  const {
    getActiveRequest,
    updateUrl,
    updateMethod,
    setLoading,
    setResponse,
    loading,
    proxyMode,
    cancelRequest,
  } = useRequestStore();
  const { resolveVariables } = useEnvironmentStore();
  const { addEntry } = useHistoryStore();
  const request = getActiveRequest();
  const [localUrl, setLocalUrl] = useState("");

  if (!request) return null;

  const isLoading = loading[request.id];

  const handleSend = async () => {
    if (!request.url) return;

    const abortController = new AbortController();
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
        signal: abortController.signal,
      });

      setResponse(request.id, response);
      addEntry({ request, response });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
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
    } finally {
      setLoading(request.id, false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleSend();
    }
  };

  return (
    <div className="flex items-center gap-0">
      <MethodSelector
        value={request.method}
        onChange={(method: HttpMethod) => updateMethod(request.id, method)}
      />
      <Input
        value={request.url}
        onChange={(e) => {
          setLocalUrl(e.target.value);
          updateUrl(request.id, e.target.value);
        }}
        onKeyDown={handleKeyDown}
        placeholder="Enter URL or paste cURL"
        className="h-9 rounded-none border-l-0 border-r-0 font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      {isLoading ? (
        <Button
          size="sm"
          variant="destructive"
          className="h-9 rounded-l-none rounded-r-lg px-3"
          onClick={() => cancelRequest(request.id)}
        >
          <Square className="size-4" />
        </Button>
      ) : (
        <Button
          size="sm"
          className="h-9 rounded-l-none rounded-r-lg px-3"
          onClick={handleSend}
          disabled={!request.url}
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          Send
        </Button>
      )}
    </div>
  );
}
