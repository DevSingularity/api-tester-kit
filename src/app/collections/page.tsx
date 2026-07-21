"use client";

import { useState } from "react";
import { useCollectionStore } from "@/store/collection-store";
import { useRequestStore } from "@/store/request-store";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ImportExportDialog } from "@/components/import-export-dialog";
import { useConfirmDialog } from "@/components/confirm-dialog";
import { useToastStore } from "@/store/toast-store";
import { EmptyState } from "@/components/empty-state";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  FolderOpen,
  Trash2,
  Edit2,
  Upload,
  Download,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { METHOD_COLORS } from "@/utils";
import type { HttpMethod } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export default function CollectionsPage() {
  const { collections, createCollection, deleteCollection, renameCollection } =
    useCollectionStore();
  const { createTab } = useRequestStore();
  const { addToast } = useToastStore();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [importExportOpen, setImportExportOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedCollections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = () => {
    if (newName.trim()) {
      createCollection(newName.trim());
      setNewName("");
      setShowNewDialog(false);
      addToast(`Collection "${newName.trim()}" created`, "success");
    }
  };

  const handleRename = () => {
    if (editingId && editName.trim()) {
      renameCollection(editingId, editName.trim());
      addToast(`Collection renamed to "${editName.trim()}"`, "success");
      setEditingId(null);
      setEditName("");
    }
  };

  const handleDelete = (id: string, name: string) => {
    confirm({
      title: "Delete Collection",
      description: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      confirmLabel: "Delete",
      variant: "destructive",
      onConfirm: () => {
        deleteCollection(id);
        addToast(`Collection "${name}" deleted`, "success");
      },
    });
  };

  const handleOpenRequest = (request: { id: string; name: string; method: string; url: string }) => {
    createTab({
      id: request.id,
      name: request.name,
      method: request.method as HttpMethod,
      url: request.url,
    });
    addToast(`Opened "${request.name}"`, "info");
  };

  const activeCollection = collections.find((c) => c.id === selectedCollection);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between h-12 px-4 border-b border-border shrink-0">
          <h1 className="text-sm font-semibold">Collections</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedCollection(null);
                setImportExportOpen(true);
              }}
              className="gap-1"
            >
              <Upload className="size-3.5" />
              Import
            </Button>
            <Button size="sm" onClick={() => setShowNewDialog(true)} className="gap-1">
              <Plus className="size-3.5" />
              New
            </Button>
          </div>
        </header>

        <ScrollArea className="flex-1 p-4">
          {collections.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="No collections yet"
              description="Create one to organize your requests"
              action={
                <Button size="sm" onClick={() => setShowNewDialog(true)} className="gap-1">
                  <Plus className="size-3.5" />
                  New Collection
                </Button>
              }
            />
          ) : (
            <div className="space-y-2">
              {collections.map((collection) => (
                <Collapsible
                  key={collection.id}
                  open={expandedCollections.has(collection.id)}
                  onOpenChange={() => toggleExpanded(collection.id)}
                  className="rounded-lg border border-border"
                >
                  <div className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                    <CollapsibleTrigger className="flex items-center gap-2 flex-1 min-w-0">
                      {expandedCollections.has(collection.id) ? (
                        <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                      )}
                      <FolderOpen className="size-4 text-muted-foreground shrink-0" />
                      {editingId === collection.id ? (
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={handleRename}
                          onKeyDown={(e) => e.key === "Enter" && handleRename()}
                          className="h-6 text-sm w-48"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="text-sm font-medium truncate">{collection.name}</span>
                      )}
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                        {collection.requests.length}
                      </Badge>
                    </CollapsibleTrigger>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCollection(collection.id);
                          setImportExportOpen(true);
                        }}
                      >
                        <Download className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(collection.id);
                          setEditName(collection.name);
                        }}
                      >
                        <Edit2 className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(collection.id, collection.name);
                        }}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>

                  <CollapsibleContent>
                    {collection.requests.length === 0 ? (
                      <div className="px-10 pb-3 text-xs text-muted-foreground">
                        No requests in this collection. Add requests from the request page.
                      </div>
                    ) : (
                      <div className="pb-2 px-2 space-y-0.5">
                        {collection.requests.map((req) => (
                          <div
                            key={req.id}
                            className="group flex items-center gap-2 px-3 py-1.5 rounded-md text-xs hover:bg-muted cursor-pointer transition-colors"
                            onClick={() => handleOpenRequest(req)}
                          >
                            <span
                              className={cn(
                                "font-mono font-semibold text-[10px] uppercase w-12 shrink-0",
                                METHOD_COLORS[req.method as HttpMethod] || ""
                              )}
                            >
                              {req.method}
                            </span>
                            <span className="truncate flex-1">{req.name}</span>
                            <span className="truncate text-muted-foreground max-w-[200px] hidden sm:block">
                              {req.url}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </ScrollArea>

        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>New Collection</DialogTitle>
            </DialogHeader>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Collection name"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ImportExportDialog
          open={importExportOpen}
          onOpenChange={setImportExportOpen}
          collection={activeCollection}
        />
        {confirmDialog}
      </div>
    </div>
  );
}
