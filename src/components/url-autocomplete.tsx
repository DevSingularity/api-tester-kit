"use client";

import { useState, useMemo, useCallback } from "react";
import { useHistoryStore } from "@/store/history-store";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

interface UrlAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function UrlAutocomplete({
  value,
  onChange,
  className,
}: UrlAutocompleteProps) {
  const [focused, setFocused] = useState(false);
  const { entries } = useHistoryStore();

  const suggestions = useMemo(() => {
    if (!value) return [];
    const q = value.toLowerCase();
    const urls = new Set<string>();

    for (const entry of entries) {
      if (entry.request.url.toLowerCase().includes(q)) {
        urls.add(entry.request.url);
      }
    }

    return Array.from(urls).slice(0, 8);
  }, [value, entries]);

  const handleSelect = useCallback(
    (url: string) => {
      onChange(url);
      setFocused(false);
    },
    [onChange]
  );

  return (
    <div className={cn("relative", className)}>
      {focused && suggestions.length > 0 && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setFocused(false)}
          />
          <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-border bg-popover shadow-lg py-1 max-h-60 overflow-auto">
            {suggestions.map((url) => (
              <button
                key={url}
                className="w-full text-left px-3 py-1.5 text-xs font-mono hover:bg-muted transition-colors flex items-center gap-2"
                onClick={() => handleSelect(url)}
              >
                <Clock className="size-3 text-muted-foreground shrink-0" />
                <span className="truncate">{url}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
