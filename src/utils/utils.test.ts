import { describe, it, expect } from "vitest";
import {
  generateId,
  formatBytes,
  formatDuration,
  HTTP_METHODS,
  getStatusColor,
  substituteVariables,
} from "@/utils";

describe("generateId", () => {
  it("generates a string ID", () => {
    const id = generateId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("generates unique IDs", () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });
});

describe("formatBytes", () => {
  it("formats 0 bytes", () => {
    expect(formatBytes(0)).toBe("0 B");
  });

  it("formats bytes", () => {
    expect(formatBytes(100)).toBe("100 B");
  });

  it("formats kilobytes", () => {
    expect(formatBytes(1024)).toBe("1 KB");
  });

  it("formats megabytes", () => {
    expect(formatBytes(1048576)).toBe("1 MB");
  });

  it("formats gigabytes", () => {
    expect(formatBytes(1073741824)).toBe("1 GB");
  });
});

describe("formatDuration", () => {
  it("formats milliseconds", () => {
    expect(formatDuration(100)).toBe("100ms");
  });

  it("formats seconds with 2 decimal places", () => {
    expect(formatDuration(1500)).toBe("1.50s");
  });

  it("formats larger durations as seconds", () => {
    expect(formatDuration(90000)).toBe("90.00s");
  });
});

describe("HTTP_METHODS", () => {
  it("contains all HTTP methods", () => {
    expect(HTTP_METHODS).toContain("GET");
    expect(HTTP_METHODS).toContain("POST");
    expect(HTTP_METHODS).toContain("PUT");
    expect(HTTP_METHODS).toContain("DELETE");
    expect(HTTP_METHODS).toContain("PATCH");
    expect(HTTP_METHODS).toContain("HEAD");
    expect(HTTP_METHODS).toContain("OPTIONS");
  });
});

describe("getStatusColor", () => {
  it("returns emerald for 2xx", () => {
    expect(getStatusColor(200)).toBe("text-emerald-400");
    expect(getStatusColor(201)).toBe("text-emerald-400");
  });

  it("returns amber for 3xx", () => {
    expect(getStatusColor(301)).toBe("text-amber-400");
    expect(getStatusColor(304)).toBe("text-amber-400");
  });

  it("returns red for 4xx", () => {
    expect(getStatusColor(400)).toBe("text-red-400");
    expect(getStatusColor(404)).toBe("text-red-400");
  });

  it("returns red-500 for 5xx", () => {
    expect(getStatusColor(500)).toBe("text-red-500");
    expect(getStatusColor(503)).toBe("text-red-500");
  });

  it("returns gray for unknown", () => {
    expect(getStatusColor(100)).toBe("text-gray-400");
  });
});

describe("substituteVariables", () => {
  it("replaces variables in template", () => {
    const vars = { host: "api.example.com", token: "abc123" };
    expect(substituteVariables("https://{{host}}/api", vars)).toBe("https://api.example.com/api");
  });

  it("leaves unmatched variables as-is", () => {
    expect(substituteVariables("{{missing}}", {})).toBe("{{missing}}");
  });

  it("handles multiple variables", () => {
    const vars = { a: "1", b: "2" };
    expect(substituteVariables("{{a}}-{{b}}", vars)).toBe("1-2");
  });
});
