import type { ApiRequest, Collection, KeyValuePair, HttpMethod, BodyType } from "@/types";
import { generateId } from "@/utils";

interface PostmanRequest {
  method: string;
  header?: Array<{ key: string; value: string; disabled?: boolean }>;
  url?: { raw?: string; query?: Array<{ key: string; value: string; disabled?: boolean }> };
  body?: { mode: string; raw?: string };
}

interface PostmanItem {
  name: string;
  request?: PostmanRequest;
  item?: PostmanItem[];
}

interface PostmanCollection {
  info: { name: string; description?: string };
  item: PostmanItem[];
}

interface OpenAPIPathOperation {
  summary?: string;
  parameters?: Array<{ name: string; in: string; required?: boolean }>;
}

interface OpenAPISchema {
  info: { title: string; version: string };
  paths: Record<string, Record<string, OpenAPIPathOperation>>;
}

interface HARRequest {
  method: string;
  url: string;
  headers: Array<{ name: string; value: string }>;
  postData?: { text?: string; mimeType?: string };
}

interface HARResponse {
  status: number;
  statusText: string;
  headers: Array<{ name: string; value: string }>;
  content: { text?: string; size: number };
  timings: { send: number; wait: number; receive: number };
}

interface HAREntry {
  request: HARRequest;
  response: HARResponse;
}

interface HARFile {
  log: {
    entries: HAREntry[];
  };
}

function methodFromString(method: string): HttpMethod {
  const m = method.toUpperCase();
  if (["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD", "TRACE", "CONNECT"].includes(m)) {
    return m as HttpMethod;
  }
  return "GET";
}

function mapPostmanBody(body?: PostmanRequest["body"]): { type: BodyType; raw?: string } {
  if (!body) return { type: "none" };
  switch (body.mode) {
    case "raw":
      return { type: "json", raw: body.raw };
    case "urlencoded":
      return { type: "x-www-form-urlencoded" };
    case "formdata":
      return { type: "form-data" };
    default:
      return { type: "none" };
  }
}

function mapPostmanHeaders(headers?: PostmanRequest["header"]): KeyValuePair[] {
  if (!headers) return [];
  return headers.map((h: { key: string; value: string; disabled?: boolean }) => ({
    id: generateId(),
    key: h.key,
    value: h.value,
    enabled: !h.disabled,
  }));
}

function parsePostmanItem(items: PostmanItem[]): { requests: ApiRequest[]; folders: Collection["folders"] } {
  const requests: ApiRequest[] = [];
  const folders: Collection["folders"] = [];

  for (const item of items) {
    if (item.item) {
      const sub = parsePostmanItem(item.item);
      folders.push({
        id: generateId(),
        name: item.name,
        requests: sub.requests,
        folders: sub.folders,
      });
    } else if (item.request) {
      const req = item.request;
      requests.push({
        id: generateId(),
        name: item.name,
        method: methodFromString(req.method),
        url: req.url?.raw ?? "",
        params: (req.url?.query ?? []).map((q: { key: string; value: string; disabled?: boolean }) => ({
          id: generateId(),
          key: q.key,
          value: q.value,
          enabled: !q.disabled,
        })),
        headers: mapPostmanHeaders(req.header),
        body: mapPostmanBody(req.body),
        auth: { type: "none" },
      });
    }
  }

  return { requests, folders };
}

export function importPostmanCollection(data: unknown): Collection {
  const collection = data as PostmanCollection;
  const { requests, folders } = parsePostmanItem(collection.item ?? []);

  return {
    id: generateId(),
    name: collection.info?.name ?? "Imported Collection",
    description: collection.info?.description,
    requests,
    folders,
    environments: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function importOpenAPISchema(data: unknown): Collection {
  const schema = data as OpenAPISchema;
  const requests: ApiRequest[] = [];

  for (const [path, methods] of Object.entries(schema.paths ?? {})) {
    for (const [method, operation] of Object.entries(methods)) {
      if (["get", "post", "put", "patch", "delete"].includes(method)) {
        requests.push({
          id: generateId(),
          name: operation.summary ?? `${method.toUpperCase()} ${path}`,
          method: methodFromString(method),
          url: path,
          params: (operation.parameters ?? [])
            .filter((p) => p.in === "query")
            .map((p) => ({
              id: generateId(),
              key: p.name,
              value: "",
              enabled: p.required ?? false,
            })),
          headers: [],
          body: { type: "none" },
          auth: { type: "none" },
        });
      }
    }
  }

  return {
    id: generateId(),
    name: schema.info?.title ?? "Imported API",
    requests,
    folders: [],
    environments: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function importCurlCommand(curl: string): ApiRequest {
  const urlMatch = curl.match(/['"]?(https?:\/\/[^\s'"]+)['"]?/);
  const url = urlMatch?.[1] ?? "";

  const methodMatch = curl.match(/-X\s+(\w+)/);
  const method = methodFromString(methodMatch?.[1] ?? "GET");

  const headerRegex = /-H\s+['"]([^'"]+)['"]/g;
  const headers: KeyValuePair[] = [];
  let match: RegExpExecArray | null;
  while ((match = headerRegex.exec(curl)) !== null) {
    const [key, value] = match[1].split(/:\s*(.+)/);
    if (key && value) {
      headers.push({
        id: generateId(),
        key: key.trim(),
        value: value.trim(),
        enabled: true,
      });
    }
  }

  const bodyMatch = curl.match(/-d\s+['"]([\s\S]+?)['"]/);
  const body = bodyMatch?.[1] ?? "";

  return {
    id: generateId(),
    name: "Imported cURL",
    method,
    url,
    params: [],
    headers,
    body: body ? { type: "json", raw: body } : { type: "none" },
    auth: { type: "none" },
  };
}

export function importHARFile(data: unknown): ApiRequest[] {
  const har = data as HARFile;
  return (har.log?.entries ?? []).map((entry: HAREntry) => ({
    id: generateId(),
    name: `${entry.request.method} ${new URL(entry.request.url).pathname}`,
    method: methodFromString(entry.request.method),
    url: entry.request.url,
    params: [],
    headers: entry.request.headers.map((h: { name: string; value: string }) => ({
      id: generateId(),
      key: h.name,
      value: h.value,
      enabled: true,
    })),
    body: entry.request.postData?.text
      ? { type: "json" as const, raw: entry.request.postData.text }
      : { type: "none" as const },
    auth: { type: "none" as const },
  }));
}

export function exportToJSON(collection: Collection): string {
  return JSON.stringify(collection, null, 2);
}

export function exportToYAML(collection: Collection): string {
  function yamlify(obj: unknown, indent = 0): string {
    const prefix = "  ".repeat(indent);
    if (typeof obj === "string") return `"${obj}"`;
    if (typeof obj === "number" || typeof obj === "boolean") return String(obj);
    if (obj === null || obj === undefined) return "null";
    if (Array.isArray(obj)) {
      if (obj.length === 0) return "[]";
      return "\n" + obj.map((item) => `${prefix}- ${yamlify(item, indent + 1).trimStart()}`).join("\n");
    }
    if (typeof obj === "object") {
      const entries = Object.entries(obj as Record<string, unknown>);
      if (entries.length === 0) return "{}";
      return "\n" + entries.map(([key, value]) => {
        const val = yamlify(value, indent + 1);
        if (val.startsWith("\n")) {
          return `${prefix}${key}:${val}`;
        }
        return `${prefix}${key}: ${val}`;
      }).join("\n");
    }
    return String(obj);
  }
  return `# Exported from API Tester Kit\n${yamlify(collection).trimStart()}`;
}

export function exportToMarkdown(collection: Collection): string {
  let md = `# ${collection.name}\n\n`;
  if (collection.description) md += `${collection.description}\n\n`;

  function addRequests(requests: ApiRequest[], level = 2) {
    for (const req of requests) {
      md += `${"#".repeat(level)} ${req.name}\n\n`;
      md += `- **Method:** ${req.method}\n`;
      md += `- **URL:** ${req.url}\n\n`;
      if (req.headers.length > 0) {
        md += `**Headers:**\n\n`;
        for (const h of req.headers) {
          if (h.enabled) md += `- ${h.key}: ${h.value}\n`;
        }
        md += "\n";
      }
    }
  }

  addRequests(collection.requests);
  return md;
}
