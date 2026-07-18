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

interface RequestStore {
  tabs: RequestTab[];
  activeTabId: string | null;
  requests: Record<string, ApiRequest>;
  responses: Record<string, ApiResponse>;
  loading: Record<string, boolean>;
  proxyMode: ProxyMode;
  cancelControllers: Record<string, AbortController>;

  createTab: (request?: Partial<ApiRequest>) => string;
  closeTab: (tabId: string) => void;
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
      loading: {},
      proxyMode: "proxy" as ProxyMode,
      cancelControllers: {},

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

          return {
            tabs: newTabs,
            activeTabId: newActiveId,
            requests: newRequests,
            responses: newResponses,
          };
        });
      },

      setActiveTab: (tabId) => set({ activeTabId: tabId }),

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
        set((state) => ({
          responses: { ...state.responses, [requestId]: response },
        })),

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
