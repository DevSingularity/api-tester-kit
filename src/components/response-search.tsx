"use client";

import { useState, useMemo } from "react";
import { Search, ChevronUp, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ResponseSearchProps {
  body: string;
  className?: string;
}

export function ResponseSearch({ body, className }: ResponseSearchProps) {
  const [query, setQuery] = useState("");
  const [currentMatch, setCurrentMatch] = useState(0);

  const matches = useMemo(() => {
    if (!query) return [];
    const indices: number[] = [];
    let idx = body.toLowerCase().indexOf(query.toLowerCase());
    while (idx !== -1) {
      indices.push(idx);
      idx = body.toLowerCase().indexOf(query.toLowerCase(), idx + 1);
    }
    return indices;
  }, [body, query]);

  const totalMatches = matches.length;

  const handleNext = () => {
    setCurrentMatch((prev) => (prev + 1) % totalMatches);
  };

  const handlePrev = () => {
    setCurrentMatch((prev) => (prev - 1 + totalMatches) % totalMatches);
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setCurrentMatch(0);
          }}
          placeholder="Search response..."
          className="h-6 text-xs pl-6 pr-6"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setCurrentMatch(0);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            <X className="size-3" />
          </button>
        )}
      </div>
      {query && (
        <>
          <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap">
            {totalMatches > 0 ? `${currentMatch + 1}/${totalMatches}` : "0 results"}
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handlePrev}
            disabled={totalMatches === 0}
          >
            <ChevronUp className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleNext}
            disabled={totalMatches === 0}
          >
            <ChevronDown className="size-3" />
          </Button>
        </>
      )}
    </div>
  );
}
