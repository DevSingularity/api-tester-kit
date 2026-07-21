"use client";

import { useEffect } from "react";
import { useRequestStore } from "@/store/request-store";
import { sendRequest } from "@/lib/api-engine";
import { useEnvironmentStore } from "@/store/environment-store";
import { useHistoryStore } from "@/store/history-store";
import { useToastStore } from "@/store/toast-store";
import { useUIStore } from "@/store/ui-store";

export function useKeyboardShortcuts() {
  const {
    getActiveRequest,
    setLoading,
    setResponse,
    proxyMode,
    setCancelController,
    tabs,
    activeTabId,
    createTab,
    closeTab,
    setActiveTab,
  } = useRequestStore();
  const { addEntry } = useHistoryStore();
  const { addToast } = useToastStore();
  const { toggleSidebar } = useUIStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const meta = e.ctrlKey || e.metaKey;

      if (meta && e.key === "Enter") {
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
            addToast(
              `Request completed: ${response.status} ${response.statusText}`,
              response.status >= 400 ? "warning" : "success"
            );
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
            addToast(`Request failed: ${msg}`, "error");
          })
          .finally(() => setLoading(request.id, false));
      }

      if (meta && e.key === "n") {
        e.preventDefault();
        createTab();
      }

      if (meta && e.key === "w") {
        e.preventDefault();
        if (activeTabId) {
          closeTab(activeTabId);
        }
      }

      if (meta && e.key === "Tab" && !e.shiftKey) {
        if (tabs.length < 2) return;
        e.preventDefault();
        const idx = tabs.findIndex((t) => t.id === activeTabId);
        const next = (idx + 1) % tabs.length;
        setActiveTab(tabs[next].id);
      }

      if (meta && e.shiftKey && e.key === "Tab") {
        if (tabs.length < 2) return;
        e.preventDefault();
        const idx = tabs.findIndex((t) => t.id === activeTabId);
        const prev = (idx - 1 + tabs.length) % tabs.length;
        setActiveTab(tabs[prev].id);
      }

      if (meta && e.key === "s") {
        e.preventDefault();
        addToast("Progress auto-saved", "info");
      }

      if (meta && e.key === "b") {
        e.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    getActiveRequest,
    setLoading,
    setResponse,
    proxyMode,
    addEntry,
    setCancelController,
    addToast,
    tabs,
    activeTabId,
    createTab,
    closeTab,
    setActiveTab,
    toggleSidebar,
  ]);
}
