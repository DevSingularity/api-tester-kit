import { describe, it, expect, beforeEach } from "vitest";
import { useHistoryStore } from "@/store/history-store";

describe("HistoryStore", () => {
  beforeEach(() => {
    const store = useHistoryStore.getState();
    store.clearHistory();
  });

  it("adds a history entry", () => {
    const { addEntry } = useHistoryStore.getState();
    addEntry({
      request: {
        id: "req-1",
        name: "Test",
        method: "GET",
        url: "https://api.test.com/users",
        params: [],
        headers: [],
        body: { type: "none" },
        auth: { type: "none" },
      },
      response: {
        status: 200,
        statusText: "OK",
        headers: {},
        body: "{}",
        time: 100,
        size: 2,
        timestamp: new Date().toISOString(),
      },
    });

    const state = useHistoryStore.getState();
    expect(state.entries.length).toBe(1);
    expect(state.entries[0].request.method).toBe("GET");
  });

  it("clears history", () => {
    const { addEntry, clearHistory } = useHistoryStore.getState();
    addEntry({
      request: {
        id: "req-1",
        name: "Test",
        method: "GET",
        url: "https://api.test.com",
        params: [],
        headers: [],
        body: { type: "none" },
        auth: { type: "none" },
      },
      response: {
        status: 200,
        statusText: "OK",
        headers: {},
        body: "{}",
        time: 100,
        size: 2,
        timestamp: new Date().toISOString(),
      },
    });

    clearHistory();

    const state = useHistoryStore.getState();
    expect(state.entries.length).toBe(0);
  });

  it("deletes a specific entry", () => {
    const { addEntry } = useHistoryStore.getState();
    addEntry({
      request: {
        id: "req-1",
        name: "Test",
        method: "GET",
        url: "https://api.test.com",
        params: [],
        headers: [],
        body: { type: "none" },
        auth: { type: "none" },
      },
      response: {
        status: 200,
        statusText: "OK",
        headers: {},
        body: "{}",
        time: 100,
        size: 2,
        timestamp: new Date().toISOString(),
      },
    });

    const entryId = useHistoryStore.getState().entries[0].id;
    useHistoryStore.getState().deleteEntry(entryId);

    const state = useHistoryStore.getState();
    expect(state.entries.length).toBe(0);
  });

  it("searches history by URL", () => {
    const { addEntry } = useHistoryStore.getState();
    addEntry({
      request: {
        id: "req-1",
        name: "Test",
        method: "GET",
        url: "https://api.test.com/users",
        params: [],
        headers: [],
        body: { type: "none" },
        auth: { type: "none" },
      },
      response: {
        status: 200,
        statusText: "OK",
        headers: {},
        body: "{}",
        time: 100,
        size: 2,
        timestamp: new Date().toISOString(),
      },
    });
    addEntry({
      request: {
        id: "req-2",
        name: "Test 2",
        method: "POST",
        url: "https://api.other.com/posts",
        params: [],
        headers: [],
        body: { type: "none" },
        auth: { type: "none" },
      },
      response: {
        status: 201,
        statusText: "Created",
        headers: {},
        body: "{}",
        time: 200,
        size: 2,
        timestamp: new Date().toISOString(),
      },
    });

    const results = useHistoryStore.getState().searchHistory("users");
    expect(results.length).toBe(1);
    expect(results[0].request.url).toContain("users");
  });

  it("searches history by method", () => {
    const { addEntry } = useHistoryStore.getState();
    addEntry({
      request: {
        id: "req-1",
        name: "Test",
        method: "GET",
        url: "https://api.test.com",
        params: [],
        headers: [],
        body: { type: "none" },
        auth: { type: "none" },
      },
      response: {
        status: 200,
        statusText: "OK",
        headers: {},
        body: "{}",
        time: 100,
        size: 2,
        timestamp: new Date().toISOString(),
      },
    });
    addEntry({
      request: {
        id: "req-2",
        name: "Test 2",
        method: "POST",
        url: "https://api.test.com",
        params: [],
        headers: [],
        body: { type: "none" },
        auth: { type: "none" },
      },
      response: {
        status: 201,
        statusText: "Created",
        headers: {},
        body: "{}",
        time: 200,
        size: 2,
        timestamp: new Date().toISOString(),
      },
    });

    const results = useHistoryStore.getState().searchHistory("POST");
    expect(results.length).toBe(1);
    expect(results[0].request.method).toBe("POST");
  });

  it("respects maxEntries limit", () => {
    const { addEntry } = useHistoryStore.getState();
    for (let i = 0; i < 510; i++) {
      addEntry({
        request: {
          id: `req-${i}`,
          name: `Test ${i}`,
          method: "GET",
          url: `https://api.test.com/${i}`,
          params: [],
          headers: [],
          body: { type: "none" },
          auth: { type: "none" },
        },
        response: {
          status: 200,
          statusText: "OK",
          headers: {},
          body: "{}",
          time: 100,
          size: 2,
          timestamp: new Date().toISOString(),
        },
      });
    }

    const state = useHistoryStore.getState();
    expect(state.entries.length).toBe(500);
  });

  it("newest entries are first", () => {
    const { addEntry } = useHistoryStore.getState();
    addEntry({
      request: {
        id: "req-1",
        name: "First",
        method: "GET",
        url: "https://first.com",
        params: [],
        headers: [],
        body: { type: "none" },
        auth: { type: "none" },
      },
      response: {
        status: 200,
        statusText: "OK",
        headers: {},
        body: "{}",
        time: 100,
        size: 2,
        timestamp: new Date().toISOString(),
      },
    });
    addEntry({
      request: {
        id: "req-2",
        name: "Second",
        method: "GET",
        url: "https://second.com",
        params: [],
        headers: [],
        body: { type: "none" },
        auth: { type: "none" },
      },
      response: {
        status: 200,
        statusText: "OK",
        headers: {},
        body: "{}",
        time: 100,
        size: 2,
        timestamp: new Date().toISOString(),
      },
    });

    const state = useHistoryStore.getState();
    expect(state.entries[0].request.url).toBe("https://second.com");
    expect(state.entries[1].request.url).toBe("https://first.com");
  });
});
