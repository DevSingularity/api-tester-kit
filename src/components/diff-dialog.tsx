"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { GitCompareArrows } from "lucide-react";
import { RequestDiff } from "@/components/request-diff";
import { cn } from "@/lib/utils";

export function DiffDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium",
          "bg-transparent text-foreground shadow-xs",
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          "disabled:pointer-events-none disabled:opacity-50",
          "h-8 cursor-pointer"
        )}
      >
        <GitCompareArrows className="size-3.5" />
        Diff
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompareArrows className="size-4" />
            Request Diff
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto">
          <RequestDiff />
        </div>
      </DialogContent>
    </Dialog>
  );
}
