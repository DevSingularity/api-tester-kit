"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Download, FileText, Code } from "lucide-react";
import {
  importPostmanCollection,
  importCurlCommand,
  importHARFile,
  exportToJSON,
  exportToYAML,
  exportToMarkdown,
} from "@/lib/import-export";
import type { Collection } from "@/types";
import { useCollectionStore } from "@/store/collection-store";

interface ImportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection?: Collection;
}

export function ImportExportDialog({
  open,
  onOpenChange,
  collection,
}: ImportExportDialogProps) {
  const { createCollection } = useCollectionStore();
  const [importText, setImportText] = useState("");
  const [exportFormat, setExportFormat] = useState<"json" | "yaml" | "markdown">("json");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = (type: "postman" | "curl" | "har" | "json") => {
    setError(null);
    setSuccess(null);

    try {
      if (type === "curl") {
        importCurlCommand(importText);
        createCollection("Imported cURL");
        setSuccess("cURL command imported successfully!");
      } else {
        const data = JSON.parse(importText);
        let imported: Collection;

        if (type === "postman") {
          imported = importPostmanCollection(data);
        } else if (type === "har") {
          imported = {
            id: crypto.randomUUID(),
            name: "HAR Import",
            requests: importHARFile(data),
            folders: [],
            environments: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        } else {
          imported = {
            id: crypto.randomUUID(),
            name: data.name ?? "Imported",
            requests: data.requests ?? [],
            folders: data.folders ?? [],
            environments: data.environments ?? {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }

        createCollection(imported.name);
        setSuccess(`Collection "${imported.name}" imported successfully!`);
      }
      setImportText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import. Check the format.");
    }
  };

  const handleExport = () => {
    if (!collection) return;

    let content: string;
    let filename: string;
    let mimeType: string;

    switch (exportFormat) {
      case "json":
        content = exportToJSON(collection);
        filename = `${collection.name}.json`;
        mimeType = "application/json";
        break;
      case "yaml":
        content = exportToYAML(collection);
        filename = `${collection.name}.yaml`;
        mimeType = "text/yaml";
        break;
      case "markdown":
        content = exportToMarkdown(collection);
        filename = `${collection.name}.md`;
        mimeType = "text/markdown";
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    onOpenChange(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setImportText(text);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {collection ? "Export Collection" : "Import Collection"}
          </DialogTitle>
        </DialogHeader>

        {collection ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Format:</span>
              <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as "json" | "yaml" | "markdown")}>
                <SelectTrigger className="w-40 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json" className="text-xs">JSON</SelectItem>
                  <SelectItem value="yaml" className="text-xs">YAML</SelectItem>
                  <SelectItem value="markdown" className="text-xs">Markdown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleExport} className="w-full">
              <Download className="size-4 mr-2" />
              Export {collection.name}
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="postman" className="w-full">
            <TabsList className="w-full h-9">
              <TabsTrigger value="postman" className="flex-1 text-xs">Postman</TabsTrigger>
              <TabsTrigger value="curl" className="flex-1 text-xs">cURL</TabsTrigger>
              <TabsTrigger value="har" className="flex-1 text-xs">HAR</TabsTrigger>
              <TabsTrigger value="json" className="flex-1 text-xs">JSON</TabsTrigger>
            </TabsList>

            <TabsContent value="postman" className="space-y-3">
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="size-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground mt-1">.json files only</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Or paste Postman collection JSON here..."
                className="h-32 font-mono text-xs"
              />
              <Button
                onClick={() => handleImport("postman")}
                disabled={!importText}
                className="w-full"
              >
                <FileText className="size-4 mr-2" />
                Import Postman Collection
              </Button>
            </TabsContent>

            <TabsContent value="curl" className="space-y-3">
              <Textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={'curl -X POST https://api.example.com/data \\\n  -H "Content-Type: application/json" \\\n  -d \'{"key": "value"}\''}
                className="h-32 font-mono text-xs"
              />
              <Button
                onClick={() => handleImport("curl")}
                disabled={!importText}
                className="w-full"
              >
                <Code className="size-4 mr-2" />
                Import cURL Command
              </Button>
            </TabsContent>

            <TabsContent value="har" className="space-y-3">
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="size-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload HAR file
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".har"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                onClick={() => handleImport("har")}
                disabled={!importText}
                className="w-full"
              >
                <FileText className="size-4 mr-2" />
                Import HAR File
              </Button>
            </TabsContent>

            <TabsContent value="json" className="space-y-3">
              <Textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste collection JSON here..."
                className="h-32 font-mono text-xs"
              />
              <Button
                onClick={() => handleImport("json")}
                disabled={!importText}
                className="w-full"
              >
                <FileText className="size-4 mr-2" />
                Import JSON Collection
              </Button>
            </TabsContent>
          </Tabs>
        )}

        {error && (
          <p className="text-xs text-destructive mt-2">{error}</p>
        )}
        {success && (
          <p className="text-xs text-emerald-500 mt-2">{success}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
