"use client";

import { useHistoryStore } from "@/store/history-store";
import { Sidebar } from "@/components/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { getStatusColor, formatDuration, formatBytes } from "@/utils";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { Search, Trash2, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { useConfirmDialog } from "@/components/confirm-dialog";
import { useToastStore } from "@/store/toast-store";

export default function HistoryPage() {
  const { entries, clearHistory, deleteEntry } = useHistoryStore();
  const { addToast } = useToastStore();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return entries;
    const q = search.toLowerCase();
    return entries.filter(
      (e) =>
        e.request.url.toLowerCase().includes(q) ||
        e.request.method.toLowerCase().includes(q)
    );
  }, [entries, search]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between h-12 px-4 border-b border-border shrink-0">
          <h1 className="text-sm font-semibold">History</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (entries.length === 0) return;
              confirm({
                title: "Clear History",
                description: `Are you sure you want to clear all ${entries.length} history entries?`,
                confirmLabel: "Clear All",
                variant: "destructive",
                onConfirm: () => {
                  clearHistory();
                  addToast("History cleared", "success");
                },
              });
            }}
            className="gap-1 text-destructive"
          >
            <Trash2 className="size-3.5" />
            Clear
          </Button>
        </header>

        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search history..."
              className="h-7 text-xs pl-8"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {filtered.length === 0 ? (
            <EmptyState
              icon={entries.length === 0 ? History : Search}
              title={entries.length === 0 ? "No history yet" : "No results found"}
              description={entries.length === 0 ? "Send a request to see it here" : "Try a different search term"}
            />
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors group"
                >
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-mono w-14 justify-center ${getStatusColor(entry.response.status)}`}
                  >
                    {entry.response.status}
                  </Badge>
                  <span className="text-xs font-mono font-semibold text-muted-foreground w-14">
                    {entry.request.method}
                  </span>
                  <span className="text-xs font-mono truncate flex-1">
                    {entry.request.url}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {formatDuration(entry.response.time)}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {formatBytes(entry.response.size)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="opacity-0 group-hover:opacity-100"
                    onClick={() => deleteEntry(entry.id)}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        {confirmDialog}
      </div>
    </div>
  );
}
