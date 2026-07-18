"use client";

import { useState, useCallback } from "react";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Play,
  Loader2,
  Copy,
  Check,
  Plus,
  Trash2,
} from "lucide-react";
import { useEnvironmentStore } from "@/store/environment-store";

type GrpcType = "unary" | "server-streaming" | "client-streaming" | "bidirectional";

interface MetadataEntry {
  key: string;
  value: string;
  enabled: boolean;
}

export default function GrpcPage() {
  const [endpoint, setEndpoint] = useState("https://grpc.example.com");
  const [serviceName, setServiceName] = useState("mypackage.MyService");
  const [methodName, setMethodName] = useState("MyMethod");
  const [grpcType, setGrpcType] = useState<GrpcType>("unary");
  const [requestBody, setRequestBody] = useState("{}");
  const [metadata, setMetadata] = useState<MetadataEntry[]>([
    { key: "content-type", value: "application/grpc+proto", enabled: true },
  ]);
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const resolveVariables = useEnvironmentStore((s) => s.resolveVariables);

  const executeRequest = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const resolvedEndpoint = resolveVariables(endpoint);
      const resolvedService = resolveVariables(serviceName);
      const resolvedMethod = resolveVariables(methodName);
      const resolvedBody = resolveVariables(requestBody);

      const headerObj: Record<string, string> = {};
      for (const m of metadata) {
        if (m.enabled && m.key) {
          headerObj[m.key] = resolveVariables(m.value);
        }
      }

      const fullPath = `/${resolvedService}/${resolvedMethod}`;

      let parsedBody: unknown = {};
      if (resolvedBody.trim()) {
        try {
          parsedBody = JSON.parse(resolvedBody);
        } catch {
          throw new Error("Invalid JSON in request body");
        }
      }

      const res = await fetch(`${resolvedEndpoint}${fullPath}`, {
        method: "POST",
        headers: {
          ...headerObj,
          "content-type": headerObj["content-type"] || "application/json",
        },
        body: JSON.stringify(parsedBody),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
      }

      const contentType = res.headers.get("content-type") || "";
      let responseData: string;

      if (contentType.includes("application/json")) {
        const json = await res.json();
        responseData = JSON.stringify(json, null, 2);
      } else {
        responseData = await res.text();
      }

      setResponse(responseData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, [endpoint, serviceName, methodName, requestBody, metadata, resolveVariables]);

  const copyResponse = useCallback(() => {
    if (response) {
      navigator.clipboard.writeText(response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [response]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-3 px-4 h-12 border-b bg-card">
          <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30">
            gRPC
          </Badge>
          <div className="flex-1 flex items-center gap-2">
            <Input
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="https://grpc.example.com"
              className="h-8 text-sm font-mono"
              onKeyDown={(e) => e.key === "Enter" && executeRequest()}
            />
          </div>
          <Button
            size="sm"
            onClick={executeRequest}
            disabled={loading}
            className="h-8 gap-1.5"
          >
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
            {loading ? "Calling..." : "Call"}
          </Button>
        </header>

        <div className="flex-1 flex min-h-0">
          <div className="flex-1 flex flex-col border-r min-w-0">
            <div className="p-3 border-b space-y-3 bg-card/50">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground mb-1 block">Service</label>
                  <Input
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    placeholder="mypackage.MyService"
                    className="h-7 text-xs font-mono"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground mb-1 block">Method</label>
                  <Input
                    value={methodName}
                    onChange={(e) => setMethodName(e.target.value)}
                    placeholder="MyMethod"
                    className="h-7 text-xs font-mono"
                  />
                </div>
              </div>
              <div className="flex gap-1">
                {(["unary", "server-streaming", "client-streaming", "bidirectional"] as GrpcType[]).map((type) => (
                  <Button
                    key={type}
                    variant={grpcType === type ? "secondary" : "ghost"}
                    size="sm"
                    className="h-6 text-[10px]"
                    onClick={() => setGrpcType(type)}
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between px-3 h-9 border-b bg-card/50">
              <span className="text-xs font-medium">Request Body</span>
              <span className="text-[10px] text-muted-foreground">{requestBody.length} chars</span>
            </div>
            <div className="flex-1 min-h-0">
              <textarea
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                className="w-full h-full resize-none bg-transparent p-3 font-mono text-sm leading-relaxed focus:outline-none"
                placeholder='{"name": "Hello"}'
                spellCheck={false}
              />
            </div>
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center px-3 h-9 border-b bg-card/50">
              <span className="text-xs font-medium">Metadata</span>
            </div>
            <div className="p-3 space-y-2">
              {metadata.map((m, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input
                    value={m.key}
                    onChange={(e) => {
                      const newMetadata = [...metadata];
                      newMetadata[i] = { ...newMetadata[i], key: e.target.value };
                      setMetadata(newMetadata);
                    }}
                    placeholder="Key"
                    className="h-7 text-xs font-mono flex-1"
                  />
                  <Input
                    value={m.value}
                    onChange={(e) => {
                      const newMetadata = [...metadata];
                      newMetadata[i] = { ...newMetadata[i], value: e.target.value };
                      setMetadata(newMetadata);
                    }}
                    placeholder="Value"
                    className="h-7 text-xs font-mono flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-1.5"
                    onClick={() => setMetadata(metadata.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 className="size-3 text-muted-foreground" />
                  </Button>
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setMetadata([...metadata, { key: "", value: "", enabled: true }])}
              >
                <Plus className="size-3" />
                Add Metadata
              </Button>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center justify-between px-3 h-9 border-b bg-card/50">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">Response</span>
                {response && (
                  <Badge variant="secondary" className="h-4 text-[10px]">
                    Success
                  </Badge>
                )}
              </div>
              {response && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-1.5"
                  onClick={copyResponse}
                >
                  {copied ? <Check className="size-2.5 text-green-500" /> : <Copy className="size-2.5" />}
                </Button>
              )}
            </div>
            <div className="flex-1 min-h-0">
              {response ? (
                <ScrollArea className="h-full">
                  <pre className="p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all">
                    {response}
                  </pre>
                </ScrollArea>
              ) : error ? (
                <div className="p-3 text-xs text-destructive">{error}</div>
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                  Send a request to see the response
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
