import type { HttpMethod } from "@/types";

export const HTTP_METHODS: HttpMethod[] = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
  "HEAD",
  "TRACE",
  "CONNECT",
];

export const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: "text-emerald-400",
  POST: "text-amber-400",
  PUT: "text-blue-400",
  PATCH: "text-purple-400",
  DELETE: "text-red-400",
  OPTIONS: "text-gray-400",
  HEAD: "text-cyan-400",
  TRACE: "text-gray-500",
  CONNECT: "text-gray-500",
};

export const STATUS_COLORS: Record<string, string> = {
  "2": "text-emerald-400",
  "3": "text-amber-400",
  "4": "text-red-400",
  "5": "text-red-500",
};

export function getStatusColor(status: number): string {
  const prefix = String(status)[0];
  return STATUS_COLORS[prefix] ?? "text-gray-400";
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function substituteVariables(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{([\w.-]+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`);
}
