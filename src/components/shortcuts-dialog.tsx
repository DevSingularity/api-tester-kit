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

const shortcutGroups = [
  {
    title: "Requests",
    shortcuts: [
      { keys: ["Ctrl", "Enter"], description: "Send active request" },
      { keys: ["Ctrl", "N"], description: "New request tab" },
      { keys: ["Ctrl", "W"], description: "Close current tab" },
      { keys: ["Ctrl", "Tab"], description: "Next tab" },
      { keys: ["Ctrl", "Shift", "Tab"], description: "Previous tab" },
    ],
  },
  {
    title: "Navigation",
    shortcuts: [
      { keys: ["Ctrl", "K"], description: "Command palette" },
      { keys: ["?"], description: "Keyboard shortcuts" },
    ],
  },
  {
    title: "General",
    shortcuts: [
      { keys: ["Ctrl", "S"], description: "Save (auto-persisted)" },
      { keys: ["Ctrl", "B"], description: "Toggle sidebar" },
    ],
  },
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
          <div className="space-y-4">
            {shortcutGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {group.title}
                </h3>
                <div className="space-y-1.5">
                  {group.shortcuts.map((s) => (
                    <div
                      key={s.description}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground">{s.description}</span>
                      <div className="flex items-center gap-1">
                        {s.keys.filter(Boolean).map((key, i) => (
                          <span key={key}>
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
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
