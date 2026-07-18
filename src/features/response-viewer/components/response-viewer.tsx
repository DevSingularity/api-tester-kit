"use client";

import { useRequestStore } from "@/store/request-store";
import { getStatusColor, formatBytes, formatDuration } from "@/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function ResponseViewer() {
  const { getActiveResponse, loading, getActiveRequest } = useRequestStore();
  const response = getActiveResponse();
  const request = getActiveRequest();
  const isLoading = request ? loading[request.id] : false;
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Sending request...</span>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p className="text-sm">Send a request to see the response</p>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(response.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([response.body], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `response-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  let formattedBody = response.body;
  try {
    formattedBody = JSON.stringify(JSON.parse(response.body), null, 2);
  } catch {
    // Not JSON, keep as-is
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <Badge
          variant="outline"
          className={`text-xs font-mono ${getStatusColor(response.status)}`}
        >
          {response.status} {response.statusText}
        </Badge>
        <span className="text-xs text-muted-foreground font-mono">
          {formatDuration(response.time)}
        </span>
        <span className="text-xs text-muted-foreground font-mono">
          {formatBytes(response.size)}
        </span>
        <div className="flex-1" />
        <Button variant="ghost" size="icon-xs" onClick={handleCopy}>
          <Copy className="size-3" />
          {copied ? "Copied!" : ""}
        </Button>
        <Button variant="ghost" size="icon-xs" onClick={handleDownload}>
          <Download className="size-3" />
        </Button>
      </div>

      <Tabs defaultValue="body" className="flex-1 flex flex-col">
        <div className="border-b border-border px-2">
          <TabsList className="h-8 bg-transparent p-0 gap-0">
            <TabsTrigger
              value="body"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-2.5 py-1 text-xs font-medium"
            >
              Body
            </TabsTrigger>
            <TabsTrigger
              value="headers"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-2.5 py-1 text-xs font-medium"
            >
              Headers
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="body" className="flex-1 m-0 overflow-auto">
          <pre className="p-3 font-mono text-xs text-foreground whitespace-pre-wrap break-words">
            {formattedBody}
          </pre>
        </TabsContent>

        <TabsContent value="headers" className="flex-1 m-0 overflow-auto">
          <div className="p-3 space-y-1">
            {Object.entries(response.headers).map(([key, value]) => (
              <div key={key} className="flex gap-2 text-xs font-mono">
                <span className="text-muted-foreground font-semibold">{key}:</span>
                <span className="text-foreground break-all">{value}</span>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
