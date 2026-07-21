"use client";

import { useState, useMemo } from "react";
import { useEnvironmentStore } from "@/store/environment-store";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToastStore } from "@/store/toast-store";
import { Plus, Trash2, Eye, EyeOff, Globe, Search, Check, Copy, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function EnvironmentsPage() {
  const {
    environments,
    activeEnvironmentId,
    createEnvironment,
    deleteEnvironment,
    setActiveEnvironment,
    setVariable,
    deleteVariable,
  } = useEnvironmentStore();
  const { addToast } = useToastStore();

  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedEnv, setSelectedEnv] = useState<string | null>(null);
  const [newVarKey, setNewVarKey] = useState("");
  const [newVarValue, setNewVarValue] = useState("");
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [varSearch, setVarSearch] = useState("");
  const [editingVar, setEditingVar] = useState<{ key: string; value: string } | null>(null);

  const activeEnv = environments.find((e) => e.id === selectedEnv);

  const filteredVars = useMemo(() => {
    if (!activeEnv) return [];
    const entries = Object.entries(activeEnv.variables);
    if (!varSearch) return entries;
    const q = varSearch.toLowerCase();
    return entries.filter(
      ([key, value]) =>
        key.toLowerCase().includes(q) || value.toLowerCase().includes(q)
    );
  }, [activeEnv, varSearch]);

  const handleCreate = () => {
    if (newName.trim()) {
      const id = createEnvironment(newName.trim());
      setNewName("");
      setShowNewDialog(false);
      setSelectedEnv(id);
      addToast(`Environment "${newName.trim()}" created`, "success");
    }
  };

  const handleAddVariable = () => {
    if (activeEnv && newVarKey.trim()) {
      setVariable(activeEnv.id, newVarKey.trim(), newVarValue);
      addToast(`Variable "${newVarKey.trim()}" added`, "success");
      setNewVarKey("");
      setNewVarValue("");
    }
  };

  const handleDeleteVariable = (key: string) => {
    if (activeEnv) {
      deleteVariable(activeEnv.id, key);
      addToast(`Variable "${key}" deleted`, "success");
    }
  };

  const handleSaveEdit = () => {
    if (activeEnv && editingVar) {
      setVariable(activeEnv.id, editingVar.key, editingVar.value);
      setEditingVar(null);
      addToast(`Variable "${editingVar.key}" updated`, "success");
    }
  };

  const handleCopyRef = (key: string) => {
    navigator.clipboard.writeText(`{{${key}}}`);
    addToast(`Copied {{${key}}} to clipboard`, "success");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex min-w-0">
        <div className="w-64 border-r border-border flex flex-col shrink-0">
          <header className="flex items-center justify-between h-12 px-3 border-b border-border shrink-0">
            <h1 className="text-sm font-semibold">Environments</h1>
            <Button size="icon-xs" onClick={() => setShowNewDialog(true)}>
              <Plus className="size-3.5" />
            </Button>
          </header>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-0.5">
              <button
                className={`w-full text-left px-2.5 py-1.5 text-sm rounded-md transition-colors ${
                  !selectedEnv ? "bg-muted" : "hover:bg-muted/50"
                }`}
                onClick={() => setSelectedEnv(null)}
              >
                <div className="flex items-center gap-2">
                  <Globe className="size-3.5 text-muted-foreground" />
                  <span>None</span>
                </div>
              </button>
              {environments.map((env) => (
                <button
                  key={env.id}
                  className={`w-full text-left px-2.5 py-1.5 text-sm rounded-md transition-colors flex items-center justify-between ${
                    selectedEnv === env.id ? "bg-muted" : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedEnv(env.id)}
                >
                  <span className="truncate flex-1 text-left">{env.name}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {activeEnvironmentId === env.id && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        Active
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveEnvironment(
                          activeEnvironmentId === env.id ? null : env.id
                        );
                        addToast(
                          activeEnvironmentId === env.id
                            ? `Environment "${env.name}" deactivated`
                            : `Environment "${env.name}" activated`,
                          "success"
                        );
                      }}
                    >
                      <Check className="size-2.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteEnvironment(env.id);
                        if (selectedEnv === env.id) setSelectedEnv(null);
                        addToast(`Environment "${env.name}" deleted`, "success");
                      }}
                    >
                      <Trash2 className="size-2.5" />
                    </Button>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {activeEnv ? (
            <>
              <header className="flex items-center justify-between h-12 px-4 border-b border-border shrink-0">
                <div className="flex items-center gap-2">
                  <Globe className="size-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold">{activeEnv.name}</h2>
                  <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                    {Object.keys(activeEnv.variables).length} vars
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                    <Input
                      value={varSearch}
                      onChange={(e) => setVarSearch(e.target.value)}
                      placeholder="Search variables..."
                      className="h-7 text-xs pl-7 w-44"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant={activeEnvironmentId === activeEnv.id ? "outline" : "default"}
                    onClick={() => {
                      setActiveEnvironment(
                        activeEnvironmentId === activeEnv.id ? null : activeEnv.id
                      );
                      addToast(
                        activeEnvironmentId === activeEnv.id
                          ? `Environment "${activeEnv.name}" deactivated`
                          : `Environment "${activeEnv.name}" activated`,
                        "success"
                      );
                    }}
                  >
                    {activeEnvironmentId === activeEnv.id ? "Deactivate" : "Set Active"}
                  </Button>
                </div>
              </header>

              <div className="flex-1 overflow-auto p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Input
                      value={newVarKey}
                      onChange={(e) => setNewVarKey(e.target.value)}
                      placeholder="Variable name"
                      className="h-7 text-xs font-mono flex-1"
                    />
                    <Input
                      value={newVarValue}
                      onChange={(e) => setNewVarValue(e.target.value)}
                      placeholder="Value"
                      className="h-7 text-xs font-mono flex-1"
                    />
                    <Button size="sm" onClick={handleAddVariable} disabled={!newVarKey.trim()}>
                      Add
                    </Button>
                  </div>

                  {editingVar && (
                    <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                      <Input
                        value={editingVar.key}
                        onChange={(e) =>
                          setEditingVar({ ...editingVar, key: e.target.value })
                        }
                        placeholder="Key"
                        className="h-7 text-xs font-mono flex-1"
                      />
                      <Input
                        value={editingVar.value}
                        onChange={(e) =>
                          setEditingVar({ ...editingVar, value: e.target.value })
                        }
                        placeholder="Value"
                        className="h-7 text-xs font-mono flex-1"
                      />
                      <Button size="sm" onClick={handleSaveEdit}>
                        <Check className="size-3 mr-1" />
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingVar(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}

                  {filteredVars.length > 0 ? (
                    <div className="space-y-1">
                      {filteredVars.map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2 group">
                          <code className="text-[10px] text-muted-foreground font-mono shrink-0 w-6 text-right">
                            $&#123;
                          </code>
                          <Input
                            value={key}
                            readOnly
                            className="h-7 text-xs font-mono flex-1 bg-muted/50 cursor-pointer"
                            onClick={() => {
                              setEditingVar({ key, value });
                            }}
                          />
                          <div className="flex-1 relative">
                            <Input
                              value={showSecrets[key] ? value : "••••••••"}
                              readOnly
                              className="h-7 text-xs font-mono pr-8 bg-muted/50 cursor-pointer"
                              onClick={() => {
                                setEditingVar({ key, value });
                              }}
                            />
                            <button
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              onClick={() =>
                                setShowSecrets((prev) => ({
                                  ...prev,
                                  [key]: !prev[key],
                                }))
                              }
                            >
                              {showSecrets[key] ? (
                                <EyeOff className="size-3" />
                              ) : (
                                <Eye className="size-3" />
                              )}
                            </button>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleCopyRef(key)}
                            title="Copy {{key}} reference"
                          >
                            <Copy className="size-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleDeleteVariable(key)}
                          >
                            <Trash2 className="size-3 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Sparkles className="size-8 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">
                        {varSearch
                          ? "No variables match your search"
                          : "No variables defined"}
                      </p>
                      <p className="text-xs mt-1">
                        {varSearch
                          ? "Try a different search term"
                          : 'Add variables above or click "Add"'}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-border">
                    <p className="text-xs font-medium mb-1">Usage</p>
                    <p className="text-[10px] text-muted-foreground">
                      Reference variables in your URLs and headers using {"{{variableName}}"}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                      <code className="bg-muted px-1.5 py-0.5 rounded">{"{{base_url}}"}</code>
                      <span>→</span>
                      <code className="bg-muted px-1.5 py-0.5 rounded">https://api.example.com</code>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Globe className="size-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select or create an environment</p>
                <p className="text-xs mt-1">
                  Environments let you define variables that can be referenced in your requests
                </p>
              </div>
            </div>
          )}
        </div>

        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>New Environment</DialogTitle>
            </DialogHeader>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Environment name (e.g., Production)"
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
      </div>
    </div>
  );
}
