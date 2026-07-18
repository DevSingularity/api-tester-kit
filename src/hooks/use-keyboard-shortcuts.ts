"use client";

import { useEffect } from "react";
import { useRequestStore } from "@/store/request-store";
import { sendRequest } from "@/lib/api-engine";
import { useEnvironmentStore } from "@/store/environment-store";
import { useHistoryStore } from "@/store/history-store";

export function useKeyboardShortcuts() {
  const { getActiveRequest, setLoading, setResponse, proxyMode, setCancelController } =
    useRequestStore();
  const { addEntry } = useHistoryStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Enter / Cmd+Enter: Send request
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        const request = getActiveRequest();
        if (!request || !request.url) return;

        const controller = new AbortController();
        setCancelController(request.id, controller);
        setLoading(request.id, true);

        sendRequest({
          request,
          proxyMode,
          variables: useEnvironmentStore.getState().getActiveVariables(),
          signal: controller.signal,
        })
          .then((response) => {
            setResponse(request.id, response);
            addEntry({ request, response });
          })
          .catch((error) => {
            if (error instanceof DOMException && error.name === "AbortError")
              return;
            const msg =
              error instanceof Error ? error.message : "Request failed";
            setResponse(request.id, {
              status: 0,
              statusText: "Error",
              headers: {},
              body: JSON.stringify({ error: msg }),
              time: 0,
              size: 0,
              timestamp: new Date().toISOString(),
            });
          })
          .finally(() => setLoading(request.id, false));
      }

      // Ctrl+S / Cmd+S: Save (prevent default)
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [getActiveRequest, setLoading, setResponse, proxyMode, addEntry, setCancelController]);
}
