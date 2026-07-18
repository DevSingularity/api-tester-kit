"use client";

import { useState } from "react";
import type { HttpMethod } from "@/types";
import { HTTP_METHODS, METHOD_COLORS } from "@/utils";
import { cn } from "@/lib/utils";

interface MethodSelectorProps {
  value: HttpMethod;
  onChange: (method: HttpMethod) => void;
}

export function MethodSelector({ value, onChange }: MethodSelectorProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "h-9 px-3 rounded-l-lg border border-r-0 border-border bg-background text-sm font-mono font-semibold transition-colors hover:bg-muted",
          METHOD_COLORS[value]
        )}
      >
        {value}
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full left-0 z-50 mt-1 w-32 rounded-lg border border-border bg-popover shadow-lg py-1">
            {HTTP_METHODS.map((method) => (
              <button
                key={method}
                onClick={() => {
                  onChange(method);
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left px-3 py-1.5 text-sm font-mono font-medium hover:bg-muted transition-colors",
                  METHOD_COLORS[method],
                  value === method && "bg-muted"
                )}
              >
                {method}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
