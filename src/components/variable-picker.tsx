"use client";

import { useState, useMemo } from "react";
import { useEnvironmentStore } from "@/store/environment-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Braces } from "lucide-react";

interface VariablePickerProps {
  onSelect: (variable: string) => void;
  align?: "start" | "end";
}

export function VariablePicker({ onSelect, align = "start" }: VariablePickerProps) {
  const [open, setOpen] = useState(false);
  const { environments, activeEnvironmentId, globalVariables } = useEnvironmentStore();

  const allVars = useMemo(() => {
    const vars: { key: string; source: string }[] = [];
    for (const [key] of Object.entries(globalVariables)) {
      vars.push({ key, source: "Global" });
    }
    const activeEnv = environments.find((e) => e.id === activeEnvironmentId);
    if (activeEnv) {
      for (const [key] of Object.entries(activeEnv.variables)) {
        if (!vars.some((v) => v.key === key)) {
          vars.push({ key, source: activeEnv.name });
        }
      }
    }
    return vars;
  }, [environments, activeEnvironmentId, globalVariables]);

  if (allVars.length === 0) return null;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => setOpen(!open)}
        className="text-muted-foreground"
        title="Insert variable"
      >
        <Braces className="size-3.5" />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className={cn(
              "absolute z-50 top-full mt-1 min-w-40 rounded-lg border border-border bg-popover shadow-lg py-1 max-h-48 overflow-auto",
              align === "end" ? "right-0" : "left-0"
            )}
          >
            <div className="px-3 py-1 text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">
              Variables
            </div>
            {allVars.map((v) => (
              <button
                key={v.key}
                className="w-full text-left px-3 py-1.5 text-xs font-mono hover:bg-muted transition-colors flex items-center gap-2"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(v.key);
                  setOpen(false);
                }}
              >
                <span className="text-foreground">{`{{${v.key}}}`}</span>
                <span className="ml-auto text-[9px] text-muted-foreground">{v.source}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
