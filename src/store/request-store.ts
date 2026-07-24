import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ApiRequest,
  ApiResponse,
  RequestTab,
  HttpMethod,
  KeyValuePair,
  AuthConfig,
  BodyType,
  ProxyMode,
} from "@/types";
import { generateId } from "@/utils";
import { indexedDBStorage } from "@/lib/indexeddb-storage";

export interface ScriptResultData {
  logs: string[];
  errors: string[];
  assertions: { passed: number; failed: number; messages: string[] };
}

interface RequestStore {
  tabs: RequestTab[];
  activeTabId: string | null;
  requests: Record<string, ApiRequest>;
  responses: Record<string, ApiResponse>;
  previousResponses: Record<string, ApiResponse>;
  loading: Record<string, boolean>;
  proxyMode: ProxyMode;
  cancelControllers: Record<string, AbortController>;
  testResults: Record<string, ScriptResultData | null>;
  streamingBody: Record<string, string>;
  isStreaming: Record<string, boolean>;

  createTab: (request?: Partial<ApiRequest>) => string;
  duplicateTab: (tabId: string) => void;
  closeTab: (tabId: string) => void;
  renameTab: (tabId: string, name: string) => void;
  updateTab: (tabId: string, updates: Partial<RequestTab>) => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
  setActiveTab: (tabId: string) => void;
  pinTab: (tabId: string) => void;
  updateRequest: (requestId: string, updates: Partial<ApiRequest>) => void;
  updateMethod: (requestId: string, method: HttpMethod) => void;
  updateUrl: (requestId: string, url: string) => void;
  updateHeaders: (requestId: string, headers: KeyValuePair[]) => void;
  updateBody: (requestId: string, bodyType: BodyType, content?: string) => void;
  updateAuth: (requestId: string, auth: AuthConfig) => void;
  updateParams: (requestId: string, params: KeyValuePair[]) => void;
  setResponse: (requestId: string, response: ApiResponse) => void;
  setLoading: (requestId: string, loading: boolean) => void;
  setProxyMode: (mode: ProxyMode) => void;
  setCancelController: (requestId: string, controller: AbortController) => void;
  cancelRequest: (requestId: string) => void;
  setTestResults: (requestId: string, results: ScriptResultData | null) => void;
  appendStreamChunk: (requestId: string, chunk: string) => void;
  resetStreaming: (requestId: string) => void;
  stopStreaming: (requestId: string) => void;
  getActiveRequest: () => ApiRequest | null;
  getActiveResponse: () => ApiResponse | null;
}

function createDefaultRequest(overrides?: Partial<ApiRequest>): ApiRequest {
  return {
    id: generateId(),
    name: "New Request",
    method: "GET",
    url: "",
    params: [],
    headers: [
      { id: generateId(), key: "Content-Type", value: "application/json", enabled: true },
    ],
    body: { type: "none" },
    auth: { type: "none" },
    ...overrides,
  };
}

interface PersistedRequestStore {
  tabs: RequestTab[];
  activeTabId: string | null;
  requests: Record<string, ApiRequest>;
  proxyMode: ProxyMode;
}

export const useRequestStore = create<RequestStore>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: null,
      requests: {},
      responses: {},
      previousResponses: {},
      loading: {},
      proxyMode: "proxy" as ProxyMode,
      cancelControllers: {},
      testResults: {},
      streamingBody: {},
      isStreaming: {},

      createTab: (requestOverrides) => {
        const request = createDefaultRequest(requestOverrides);
        const tab: RequestTab = {
          id: generateId(),
          requestId: request.id,
          name: request.name,
          isDirty: false,
          isPinned: false,
        };

        set((state) => ({
          tabs: [...state.tabs, tab],
          activeTabId: tab.id,
          requests: { ...state.requests, [request.id]: request },
        }));

        return tab.id;
      },

      duplicateTab: (tabId) => {
        const state = get();
        const tab = state.tabs.find((t) => t.id === tabId);
        if (!tab) return;
        const sourceRequest = state.requests[tab.requestId];
        if (!sourceRequest) return;

        const newRequest: ApiRequest = {
          ...sourceRequest,
          id: generateId(),
          name: `${sourceRequest.name} (copy)`,
        };
        const newTab: RequestTab = {
          id: generateId(),
          requestId: newRequest.id,
          name: newRequest.name,
          isDirty: false,
          isPinned: false,
        };

        set((state) => ({
          tabs: [...state.tabs, newTab],
          activeTabId: newTab.id,
          requests: { ...state.requests, [newRequest.id]: newRequest },
        }));
      },

      closeTab: (tabId) => {
        set((state) => {
          const tab = state.tabs.find((t) => t.id === tabId);
          if (!tab) return state;

          const newTabs = state.tabs.filter((t) => t.id !== tabId);
          const newRequests = { ...state.requests };
          delete newRequests[tab.requestId];
          const newResponses = { ...state.responses };
          delete newResponses[tab.requestId];

          let newActiveId = state.activeTabId;
          if (state.activeTabId === tabId) {
            const idx = state.tabs.findIndex((t) => t.id === tabId);
            newActiveId = newTabs[Math.min(idx, newTabs.length - 1)]?.id ?? null;
          }

          const newStreamingBody = { ...state.streamingBody };
          delete newStreamingBody[tab.requestId];
          const newIsStreaming = { ...state.isStreaming };
          delete newIsStreaming[tab.requestId];
          const newTestResults = { ...state.testResults };
          delete newTestResults[tab.requestId];

          return {
            tabs: newTabs,
            activeTabId: newActiveId,
            requests: newRequests,
            responses: newResponses,
            streamingBody: newStreamingBody,
            isStreaming: newIsStreaming,
            testResults: newTestResults,
          };
        });
      },

      setActiveTab: (tabId) => set({ activeTabId: tabId }),

      reorderTabs: (fromIndex, toIndex) =>
        set((state) => {
          const newTabs = [...state.tabs];
          const [moved] = newTabs.splice(fromIndex, 1);
          newTabs.splice(toIndex, 0, moved);
          return { tabs: newTabs };
        }),

      renameTab: (tabId, name) =>
        set((state) => ({
          tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, name } : t)),
        })),

      updateTab: (tabId, updates) =>
        set((state) => ({
          tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, ...updates } : t)),
        })),

      pinTab: (tabId) =>
        set((state) => ({
          tabs: state.tabs.map((t) =>
            t.id === tabId ? { ...t, isPinned: !t.isPinned } : t
          ),
        })),

      updateRequest: (requestId, updates) =>
        set((state) => ({
          requests: {
            ...state.requests,
            [requestId]: { ...state.requests[requestId], ...updates },
          },
        })),

      updateMethod: (requestId, method) =>
        set((state) => ({
          requests: {
            ...state.requests,
            [requestId]: { ...state.requests[requestId], method },
          },
        })),

      updateUrl: (requestId, url) =>
        set((state) => ({
          requests: {
            ...state.requests,
            [requestId]: { ...state.requests[requestId], url },
          },
        })),

      updateHeaders: (requestId, headers) =>
        set((state) => ({
          requests: {
            ...state.requests,
            [requestId]: { ...state.requests[requestId], headers },
          },
        })),

      updateBody: (requestId, bodyType, content) =>
        set((state) => {
          const request = state.requests[requestId];
          if (!request) return state;
          return {
            requests: {
              ...state.requests,
              [requestId]: {
                ...request,
                body: {
                  type: bodyType,
                  raw: content ?? request.body.raw,
                },
              },
            },
          };
        }),

      updateAuth: (requestId, auth) =>
        set((state) => ({
          requests: {
            ...state.requests,
            [requestId]: { ...state.requests[requestId], auth },
          },
        })),

      updateParams: (requestId, params) =>
        set((state) => ({
          requests: {
            ...state.requests,
            [requestId]: { ...state.requests[requestId], params },
          },
        })),

      setResponse: (requestId, response) =>
        set((state) => {
          const old = state.responses[requestId];
          return {
            previousResponses: old ? { ...state.previousResponses, [requestId]: old } : state.previousResponses,
            responses: { ...state.responses, [requestId]: response },
          };
        }),

      setLoading: (requestId, loading) =>
        set((state) => ({
          loading: { ...state.loading, [requestId]: loading },
        })),

      setProxyMode: (mode) => set({ proxyMode: mode }),

      setCancelController: (requestId, controller) =>
        set((state) => ({
          cancelControllers: { ...state.cancelControllers, [requestId]: controller },
        })),

      cancelRequest: (requestId) => {
        const controller = get().cancelControllers[requestId];
        if (controller) {
          controller.abort();
        }
      },

      setTestResults: (requestId, results) =>
        set((state) => ({
          testResults: { ...state.testResults, [requestId]: results },
        })),

      appendStreamChunk: (requestId, chunk) =>
        set((state) => ({
          streamingBody: {
            ...state.streamingBody,
            [requestId]: (state.streamingBody[requestId] ?? "") + chunk,
          },
          isStreaming: { ...state.isStreaming, [requestId]: true },
        })),

      resetStreaming: (requestId) =>
        set((state) => ({
          streamingBody: { ...state.streamingBody, [requestId]: "" },
          isStreaming: { ...state.isStreaming, [requestId]: false },
        })),

      stopStreaming: (requestId) =>
        set((state) => ({
          isStreaming: { ...state.isStreaming, [requestId]: false },
        })),

      getActiveRequest: () => {
        const state = get();
        const tab = state.tabs.find((t) => t.id === state.activeTabId);
        if (!tab) return null;
        return state.requests[tab.requestId] ?? null;
      },

      getActiveResponse: () => {
        const state = get();
        const tab = state.tabs.find((t) => t.id === state.activeTabId);
        if (!tab) return null;
        return state.responses[tab.requestId] ?? null;
      },
    }),
    {
      name: "request-store",
      storage: indexedDBStorage as unknown as Parameters<typeof persist>[1]["storage"],
      partialize: (state: RequestStore): PersistedRequestStore => ({
        tabs: state.tabs,
        activeTabId: state.activeTabId,
        requests: state.requests,
        proxyMode: state.proxyMode,
      }),
    }
  )
);
