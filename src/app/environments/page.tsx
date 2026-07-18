"use client";

import { useState } from "react";
import { useEnvironmentStore } from "@/store/environment-store";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Eye, EyeOff, Globe } from "lucide-react";
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

  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedEnv, setSelectedEnv] = useState<string | null>(null);
  const [newVarKey, setNewVarKey] = useState("");
  const [newVarValue, setNewVarValue] = useState("");
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const activeEnv = environments.find((e) => e.id === selectedEnv);

  const handleCreate = () => {
    if (newName.trim()) {
      const id = createEnvironment(newName.trim());
      setNewName("");
      setShowNewDialog(false);
      setSelectedEnv(id);
    }
  };

  const handleAddVariable = () => {
    if (activeEnv && newVarKey.trim()) {
      setVariable(activeEnv.id, newVarKey.trim(), newVarValue);
      setNewVarKey("");
      setNewVarValue("");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex min-w-0">
        <div className="w-64 border-r border-border flex flex-col">
          <header className="flex items-center justify-between h-12 px-3 border-b border-border shrink-0">
            <h1 className="text-sm font-semibold">Environments</h1>
            <Button
              size="icon-xs"
              onClick={() => setShowNewDialog(true)}
            >
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
                None
              </button>
              {environments.map((env) => (
                <button
                  key={env.id}
                  className={`w-full text-left px-2.5 py-1.5 text-sm rounded-md transition-colors flex items-center justify-between ${
                    selectedEnv === env.id ? "bg-muted" : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedEnv(env.id)}
                >
                  <span className="truncate">{env.name}</span>
                  <div className="flex items-center gap-1">
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
                        deleteEnvironment(env.id);
                        if (selectedEnv === env.id) setSelectedEnv(null);
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
                </div>
                <Button
                  size="sm"
                  variant={activeEnvironmentId === activeEnv.id ? "outline" : "default"}
                  onClick={() =>
                    setActiveEnvironment(
                      activeEnvironmentId === activeEnv.id ? null : activeEnv.id
                    )
                  }
                >
                  {activeEnvironmentId === activeEnv.id ? "Deactivate" : "Set Active"}
                </Button>
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
                    <Button size="sm" onClick={handleAddVariable}>
                      Add
                    </Button>
                  </div>

                  {Object.entries(activeEnv.variables).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 group">
                      <Input
                        value={key}
                        readOnly
                        className="h-7 text-xs font-mono flex-1 bg-muted/50"
                      />
                      <div className="flex-1 relative">
                        <Input
                          value={showSecrets[key] ? value : "••••••••"}
                          readOnly
                          className="h-7 text-xs font-mono pr-8 bg-muted/50"
                        />
                        <button
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
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
                        onClick={() => deleteVariable(activeEnv.id, key)}
                        className="opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  ))}

                  {Object.keys(activeEnv.variables).length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-8">
                      No variables defined. Add one above.
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <p className="text-sm">Select or create an environment</p>
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
