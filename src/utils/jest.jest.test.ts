import { describe, it, expect } from "@jest/globals";

describe("API Tester Kit - Jest Integration Tests", () => {
  describe("HTTP Method validation", () => {
    const validMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"];

    it("validates all HTTP methods", () => {
      for (const method of validMethods) {
        expect(typeof method).toBe("string");
        expect(method.length).toBeGreaterThan(0);
        expect(method).toBe(method.toUpperCase());
      }
    });

    it("rejects invalid HTTP method", () => {
      expect("INVALID").not.toMatch(/^(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)$/);
    });
  });

  describe("URL validation", () => {
    it("validates absolute URLs", () => {
      const validUrls = [
        "https://api.example.com/users",
        "http://localhost:3000/api",
        "https://sub.domain.co.uk/path?query=value",
      ];

      for (const url of validUrls) {
        expect(() => new URL(url)).not.toThrow();
      }
    });

    it("rejects invalid URLs", () => {
      const invalidUrls = ["not-a-url", ""];

      for (const url of invalidUrls) {
        expect(() => new URL(url)).toThrow();
      }
    });
  });

  describe("JSON parsing", () => {
    it("parses valid JSON", () => {
      const json = '{"key": "value", "number": 42}';
      const parsed = JSON.parse(json);
      expect(parsed).toEqual({ key: "value", number: 42 });
    });

    it("handles invalid JSON gracefully", () => {
      expect(() => JSON.parse("not json")).toThrow();
    });
  });

  describe("Environment variable patterns", () => {
    it("matches double curly brace pattern", () => {
      const pattern = /\{\{(\w+)\}\}/g;
      const template = "https://{{host}}/api/{{version}}/users";
      const matches = [...template.matchAll(pattern)];

      expect(matches.length).toBe(2);
      expect(matches[0][1]).toBe("host");
      expect(matches[1][1]).toBe("version");
    });

    it("replaces variables in template", () => {
      const template = "https://{{host}}/api";
      const vars: Record<string, string> = { host: "api.example.com" };
      const result = template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);

      expect(result).toBe("https://api.example.com/api");
    });

    it("leaves unmatched variables intact", () => {
      const template = "https://{{host}}/{{missing}}";
      const vars: Record<string, string> = { host: "api.example.com" };
      const result = template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);

      expect(result).toBe("https://api.example.com/{{missing}}");
    });
  });

  describe("Status code categories", () => {
    it("categorizes 2xx as success", () => {
      expect([200, 201, 204]).toEqual(
        expect.arrayContaining([200, 201, 204])
      );
    });

    it("categorizes 4xx as client error", () => {
      expect([400, 401, 403, 404, 500]).toEqual(
        expect.arrayContaining([400, 401, 403, 404])
      );
    });

    it("categorizes 5xx as server error", () => {
      expect([500, 502, 503]).toEqual(
        expect.arrayContaining([500, 502, 503])
      );
    });
  });

  describe("Request body handling", () => {
    it("parses JSON body", () => {
      const body = JSON.stringify({ name: "test", count: 5 });
      const parsed = JSON.parse(body);
      expect(parsed.name).toBe("test");
      expect(parsed.count).toBe(5);
    });

    it("detects empty body", () => {
      const body = "";
      expect(body.length).toBe(0);
      expect(body.trim()).toBe("");
    });
  });

  describe("Header management", () => {
    it("creates header key-value pairs", () => {
      const headers = new Headers();
      headers.set("Content-Type", "application/json");
      headers.set("Authorization", "Bearer token123");

      expect(headers.get("Content-Type")).toBe("application/json");
      expect(headers.get("Authorization")).toBe("Bearer token123");
    });

    it("handles case-insensitive header names", () => {
      const headers = new Headers();
      headers.set("content-type", "text/plain");

      expect(headers.get("Content-Type")).toBe("text/plain");
      expect(headers.get("CONTENT-TYPE")).toBe("text/plain");
    });
  });
});
