"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Eye, EyeOff, Globe } from "lucide-react";
import { useEnvironmentStore } from "@/store/environment-store";

export function EnvQuickEdit() {
  const {
    environments,
    activeEnvironmentId,
    globalVariables,
    setVariable,
    deleteVariable,
    setGlobalVariable,
  } = useEnvironmentStore();

  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [isGlobal, setIsGlobal] = useState(false);

  const activeEnvironment = environments.find((e) => e.id === activeEnvironmentId);
  const variables = isGlobal ? globalVariables : (activeEnvironment?.variables ?? {});

  const addVariable = useCallback(() => {
    if (!newKey.trim()) return;

    if (isGlobal) {
      setGlobalVariable(newKey.trim(), newValue);
    } else if (activeEnvironmentId) {
      setVariable(activeEnvironmentId, newKey.trim(), newValue);
    }

    setNewKey("");
    setNewValue("");
  }, [newKey, newValue, isGlobal, activeEnvironmentId, setGlobalVariable, setVariable]);

  const removeVariable = useCallback(
    (key: string) => {
      if (isGlobal) {
        setGlobalVariable(key, "");
      } else if (activeEnvironmentId) {
        deleteVariable(activeEnvironmentId, key);
      }
    },
    [isGlobal, activeEnvironmentId, deleteVariable, setGlobalVariable]
  );

  const toggleSecret = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="size-3.5 text-muted-foreground" />
          <span className="text-xs font-medium">Environment Variables</span>
        </div>
        <div className="flex gap-1">
          <Button
            variant={!isGlobal && activeEnvironmentId ? "secondary" : "ghost"}
            size="sm"
            className="h-6 text-[10px]"
            onClick={() => setIsGlobal(false)}
            disabled={!activeEnvironmentId}
          >
            {activeEnvironment?.name ?? "None"}
          </Button>
          <Button
            variant={isGlobal ? "secondary" : "ghost"}
            size="sm"
            className="h-6 text-[10px]"
            onClick={() => setIsGlobal(true)}
          >
            Global
          </Button>
        </div>
      </div>

      {environments.length === 0 && !isGlobal && (
        <p className="text-[10px] text-muted-foreground">
          No environments. Create one in the Environments page.
        </p>
      )}

      <ScrollArea className="h-48">
        <div className="space-y-1">
          {Object.entries(variables).map(([key, value]) => {
            if (!isGlobal && !value) return null;
            return (
              <div key={key} className="flex items-center gap-1 group">
                <span className="text-[10px] font-mono text-muted-foreground w-20 truncate shrink-0">
                  {`{{${key}}}`}
                </span>
                <div className="flex-1 relative">
                  <Input
                    type={showSecrets[key] ? "text" : "password"}
                    value={value}
                    onChange={(e) => {
                      if (isGlobal) {
                        setGlobalVariable(key, e.target.value);
                      } else if (activeEnvironmentId) {
                        setVariable(activeEnvironmentId, key, e.target.value);
                      }
                    }}
                    className="h-6 text-[10px] font-mono pr-6"
                  />
                  <button
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                    onClick={() => toggleSecret(key)}
                  >
                    {showSecrets[key] ? (
                      <EyeOff className="size-2.5 text-muted-foreground" />
                    ) : (
                      <Eye className="size-2.5 text-muted-foreground" />
                    )}
                  </button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1 opacity-0 group-hover:opacity-100"
                  onClick={() => removeVariable(key)}
                >
                  <Trash2 className="size-2.5 text-muted-foreground" />
                </Button>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="flex gap-1">
        <Input
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder="Key"
          className="h-6 text-[10px] font-mono flex-1"
          onKeyDown={(e) => e.key === "Enter" && addVariable()}
        />
        <Input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="Value"
          className="h-6 text-[10px] font-mono flex-1"
          onKeyDown={(e) => e.key === "Enter" && addVariable()}
        />
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-1.5"
          onClick={addVariable}
          disabled={!newKey.trim()}
        >
          <Plus className="size-2.5" />
        </Button>
      </div>
    </div>
  );
}
