"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GitCompareArrows } from "lucide-react";
import { RequestDiff } from "@/components/request-diff";

export function DiffDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5">
          <GitCompareArrows className="size-3.5" />
          Diff
        </Button>
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
