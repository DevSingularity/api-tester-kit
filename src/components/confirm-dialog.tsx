"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ConfirmOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void;
}

export function useConfirmDialog() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
  }, []);

  const handleConfirm = useCallback(() => {
    options?.onConfirm();
    setOptions(null);
  }, [options]);

  const dialog = options ? (
    <Dialog open={true} onOpenChange={() => setOptions(null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {options.variant === "destructive" && (
              <AlertTriangle className="size-5 text-destructive" />
            )}
            <DialogTitle>{options.title}</DialogTitle>
          </div>
          <DialogDescription>{options.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOptions(null)}>
            {options.cancelLabel ?? "Cancel"}
          </Button>
          <Button
            variant={options.variant === "destructive" ? "destructive" : "default"}
            onClick={handleConfirm}
          >
            {options.confirmLabel ?? "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ) : null;

  return { confirm, dialog };
}
