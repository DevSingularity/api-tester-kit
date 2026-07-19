"use client";

import { useState } from "react";
import { useCollectionStore } from "@/store/collection-store";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ImportExportDialog } from "@/components/import-export-dialog";
import { useConfirmDialog } from "@/components/confirm-dialog";
import { useToastStore } from "@/store/toast-store";
import { EmptyState } from "@/components/empty-state";
import { Plus, FolderOpen, Trash2, Edit2, Upload, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function CollectionsPage() {
  const { collections, createCollection, deleteCollection, renameCollection } =
    useCollectionStore();
  const { addToast } = useToastStore();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [importExportOpen, setImportExportOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);

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
                <div
                  key={collection.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FolderOpen className="size-4 text-muted-foreground" />
                    {editingId === collection.id ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={handleRename}
                        onKeyDown={(e) => e.key === "Enter" && handleRename()}
                        className="h-6 text-sm w-48"
                        autoFocus
                      />
                    ) : (
                      <span className="text-sm font-medium">{collection.name}</span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {collection.requests.length} requests
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => {
                        setSelectedCollection(collection.id);
                        setImportExportOpen(true);
                      }}
                    >
                      <Download className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => {
                        setEditingId(collection.id);
                        setEditName(collection.name);
                      }}
                    >
                      <Edit2 className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleDelete(collection.id, collection.name)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
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
