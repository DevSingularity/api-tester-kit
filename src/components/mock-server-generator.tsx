"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Check, Download, Server } from "lucide-react";
import { useCollectionStore } from "@/store/collection-store";
import { generateMockServerFromCollection } from "@/lib/mock-server-generator";

type Framework = "express" | "hono";

export function MockServerGenerator() {
  const { collections } = useCollectionStore();
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [framework, setFramework] = useState<Framework>("express");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const selectedCollection = collections.find((c) => c.id === selectedCollectionId);

  const generate = useCallback(() => {
    if (!selectedCollection) return;
    const code = generateMockServerFromCollection(selectedCollection, framework);
    setGeneratedCode(code);
  }, [selectedCollection, framework]);

  const copyCode = useCallback(() => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [generatedCode]);

  const downloadCode = useCallback(() => {
    if (!generatedCode || !selectedCollection) return;
    const ext = framework === "express" ? "js" : "ts";
    const filename = `${selectedCollection.name.toLowerCase().replace(/\s+/g, "-")}-mock.${ext}`;
    const blob = new Blob([generatedCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [generatedCode, selectedCollection, framework]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Server className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium">Mock Server Generator</span>
      </div>

      <div className="flex gap-2">
        <select
          className="flex-1 h-8 px-2 text-xs bg-muted/50 rounded border border-border"
          value={selectedCollectionId ?? ""}
          onChange={(e) => {
            setSelectedCollectionId(e.target.value || null);
            setGeneratedCode(null);
          }}
        >
          <option value="">Select a collection...</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.requests.length} requests)
            </option>
          ))}
        </select>

        <div className="flex gap-1">
          {(["express", "hono"] as Framework[]).map((fw) => (
            <Button
              key={fw}
              variant={framework === fw ? "secondary" : "ghost"}
              size="sm"
              className="h-8 text-xs"
              onClick={() => setFramework(fw)}
            >
              {fw === "express" ? "Express" : "Hono"}
            </Button>
          ))}
        </div>
      </div>

      {selectedCollection && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-5 text-[10px]">
            {selectedCollection.requests.length} endpoints
          </Badge>
          <Button size="sm" className="h-7 text-xs gap-1" onClick={generate}>
            Generate
          </Button>
        </div>
      )}

      {generatedCode && (
        <>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={copyCode}>
              {copied ? <Check className="size-2.5" /> : <Copy className="size-2.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={downloadCode}>
              <Download className="size-2.5" />
              Download
            </Button>
          </div>
          <ScrollArea className="h-64">
            <pre className="p-3 font-mono text-xs leading-relaxed bg-muted/30 rounded-lg whitespace-pre-wrap break-all">
              {generatedCode}
            </pre>
          </ScrollArea>
        </>
      )}

      {!selectedCollection && (
        <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
          Select a collection to generate a mock server
        </div>
      )}
    </div>
  );
}
