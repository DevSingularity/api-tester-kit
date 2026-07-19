"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Keyboard } from "lucide-react";

const shortcuts = [
  { keys: ["Ctrl", "Enter"], description: "Send request" },
  { keys: ["Ctrl", "N"], description: "New request tab" },
  { keys: ["Ctrl", "K"], description: "Command palette" },
  { keys: ["?", ""], description: "Show this dialog" },
  { keys: ["Ctrl", "S"], description: "Save (auto-persisted)" },
];

export function ShortcutsDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag !== "INPUT" && tag !== "TEXTAREA" && !(e.target as HTMLElement)?.isContentEditable) {
          e.preventDefault();
          setOpen(true);
        }
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen(true)}
        title="Keyboard shortcuts (?)"
      >
        <Keyboard className="size-3.5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="size-4" />
              Keyboard Shortcuts
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {shortcuts.map((s) => (
              <div key={s.description} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{s.description}</span>
                <div className="flex items-center gap-1">
                  {s.keys.filter(Boolean).map((key, i) => (
                    <span key={i}>
                      <kbd className="inline-flex items-center justify-center h-6 min-w-6 px-1.5 rounded border border-border bg-muted text-[10px] font-mono font-medium">
                        {key}
                      </kbd>
                      {i < s.keys.filter(Boolean).length - 1 && (
                        <span className="text-muted-foreground mx-0.5">+</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
