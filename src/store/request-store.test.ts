import { describe, it, expect, beforeEach } from "vitest";
import { useRequestStore } from "@/store/request-store";

describe("RequestStore", () => {
  beforeEach(() => {
    const store = useRequestStore.getState();
    store.tabs.forEach((tab) => store.closeTab(tab.id));
  });

  it("creates a tab with default request", () => {
    const { createTab } = useRequestStore.getState();
    createTab();

    const state = useRequestStore.getState();
    expect(state.tabs.length).toBe(1);
    expect(state.tabs[0].isPinned).toBe(false);
    expect(state.tabs[0].isDirty).toBe(false);

    const requestId = state.tabs[0].requestId;
    expect(state.requests[requestId]).toBeDefined();
    expect(state.requests[requestId].method).toBe("GET");
    expect(state.requests[requestId].url).toBe("");
  });

  it("creates tab with overrides", () => {
    const { createTab } = useRequestStore.getState();
    createTab({ method: "POST", url: "https://api.example.com" });

    const state = useRequestStore.getState();
    const requestId = state.tabs[0].requestId;
    expect(state.requests[requestId].method).toBe("POST");
    expect(state.requests[requestId].url).toBe("https://api.example.com");
  });

  it("closes a tab", () => {
    const { createTab } = useRequestStore.getState();
    createTab();

    const state1 = useRequestStore.getState();
    expect(state1.tabs.length).toBe(1);

    const tabId = state1.tabs[0].id;
    state1.closeTab(tabId);

    const state2 = useRequestStore.getState();
    expect(state2.tabs.length).toBe(0);
  });

  it("sets active tab", () => {
    const { createTab } = useRequestStore.getState();
    createTab();
    createTab();

    const state1 = useRequestStore.getState();
    const secondTabId = state1.tabs[1].id;
    state1.setActiveTab(secondTabId);

    const state2 = useRequestStore.getState();
    expect(state2.activeTabId).toBe(secondTabId);
  });

  it("toggles pin on tab", () => {
    const { createTab } = useRequestStore.getState();
    createTab();

    const state1 = useRequestStore.getState();
    const tabId = state1.tabs[0].id;
    expect(state1.tabs[0].isPinned).toBe(false);

    state1.pinTab(tabId);

    const state2 = useRequestStore.getState();
    expect(state2.tabs[0].isPinned).toBe(true);

    state2.pinTab(tabId);

    const state3 = useRequestStore.getState();
    expect(state3.tabs[0].isPinned).toBe(false);
  });

  it("updates request URL", () => {
    const { createTab } = useRequestStore.getState();
    createTab();

    const state1 = useRequestStore.getState();
    const requestId = state1.tabs[0].requestId;
    state1.updateUrl(requestId, "https://api.test.com/users");

    const state2 = useRequestStore.getState();
    expect(state2.requests[requestId].url).toBe("https://api.test.com/users");
  });

  it("updates request method", () => {
    const { createTab } = useRequestStore.getState();
    createTab();

    const state1 = useRequestStore.getState();
    const requestId = state1.tabs[0].requestId;
    state1.updateMethod(requestId, "POST");

    const state2 = useRequestStore.getState();
    expect(state2.requests[requestId].method).toBe("POST");
  });

  it("sets response", () => {
    const { createTab } = useRequestStore.getState();
    createTab();

    const state1 = useRequestStore.getState();
    const requestId = state1.tabs[0].requestId;
    state1.setResponse(requestId, {
      status: 200,
      statusText: "OK",
      headers: { "content-type": "application/json" },
      body: '{"ok":true}',
      time: 150,
      size: 14,
      timestamp: new Date().toISOString(),
    });

    const state2 = useRequestStore.getState();
    expect(state2.responses[requestId]).toBeDefined();
    expect(state2.responses[requestId].status).toBe(200);
  });

  it("sets loading state", () => {
    const { createTab } = useRequestStore.getState();
    createTab();

    const state1 = useRequestStore.getState();
    const requestId = state1.tabs[0].requestId;
    state1.setLoading(requestId, true);

    const state2 = useRequestStore.getState();
    expect(state2.loading[requestId]).toBe(true);
  });

  it("getActiveRequest returns null when no tabs", () => {
    const { getActiveRequest } = useRequestStore.getState();
    expect(getActiveRequest()).toBeNull();
  });

  it("getActiveRequest returns active request", () => {
    const { createTab } = useRequestStore.getState();
    createTab({ url: "https://active.test" });

    const state = useRequestStore.getState();
    const active = state.getActiveRequest();
    expect(active).not.toBeNull();
    expect(active?.url).toBe("https://active.test");
  });

  it("setProxyMode updates mode", () => {
    const { setProxyMode } = useRequestStore.getState();
    setProxyMode("direct");

    const state = useRequestStore.getState();
    expect(state.proxyMode).toBe("direct");
  });

  it("cleans up tab resources on close", () => {
    const { createTab } = useRequestStore.getState();
    createTab({ url: "https://cleanup.test" });

    const state1 = useRequestStore.getState();
    const requestId = state1.tabs[0].requestId;
    state1.setResponse(requestId, {
      status: 200,
      statusText: "OK",
      headers: {},
      body: "{}",
      time: 100,
      size: 2,
      timestamp: new Date().toISOString(),
    });

    state1.closeTab(state1.tabs[0].id);

    const state2 = useRequestStore.getState();
    expect(state2.requests[requestId]).toBeUndefined();
    expect(state2.responses[requestId]).toBeUndefined();
  });
});
