"use client";

import { useMemo } from "react";
import type { ApiResponse } from "@/types";
import { cn } from "@/lib/utils";

interface DiffLine {
  type: "same" | "added" | "removed";
  value: string;
  lineNumA?: number;
  lineNumB?: number;
}

function computeDiff(a: string, b: string): DiffLine[] {
  const linesA = a.split("\n");
  const linesB = b.split("\n");

  const lcs: number[][] = Array.from({ length: linesA.length + 1 }, () =>
    Array(linesB.length + 1).fill(0)
  );

  for (let i = 1; i <= linesA.length; i++) {
    for (let j = 1; j <= linesB.length; j++) {
      if (linesA[i - 1] === linesB[j - 1]) {
        lcs[i][j] = lcs[i - 1][j - 1] + 1;
      } else {
        lcs[i][j] = Math.max(lcs[i - 1][j], lcs[i][j - 1]);
      }
    }
  }

  const result: DiffLine[] = [];
  let i = linesA.length;
  let j = linesB.length;
  const temp: DiffLine[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && linesA[i - 1] === linesB[j - 1]) {
      temp.push({ type: "same", value: linesA[i - 1], lineNumA: i, lineNumB: j });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
      temp.push({ type: "added", value: linesB[j - 1], lineNumB: j });
      j--;
    } else {
      temp.push({ type: "removed", value: linesA[i - 1], lineNumA: i });
      i--;
    }
  }

  for (let k = temp.length - 1; k >= 0; k--) {
    result.push(temp[k]);
  }

  return result;
}

function diffHeaders(
  a: Record<string, string>,
  b: Record<string, string>
): { key: string; oldValue?: string; newValue?: string; type: "same" | "added" | "removed" | "changed" }[] {
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const entries: { key: string; oldValue?: string; newValue?: string; type: "same" | "added" | "removed" | "changed" }[] = [];

  for (const key of [...allKeys].sort()) {
    const va = a[key];
    const vb = b[key];
    if (va === undefined) {
      entries.push({ key, newValue: vb, type: "added" });
    } else if (vb === undefined) {
      entries.push({ key, oldValue: va, type: "removed" });
    } else if (va !== vb) {
      entries.push({ key, oldValue: va, newValue: vb, type: "changed" });
    } else {
      entries.push({ key, oldValue: va, newValue: vb, type: "same" });
    }
  }

  return entries;
}

interface ResponseDiffProps {
  previous: ApiResponse;
  current: ApiResponse;
}

export function ResponseDiff({ previous, current }: ResponseDiffProps) {
  const bodyDiff = useMemo(() => computeDiff(previous.body, current.body), [previous.body, current.body]);
  const headerDiff = useMemo(() => diffHeaders(previous.headers, current.headers), [previous.headers, current.headers]);

  const isJsonPrev = useMemo(() => { try { JSON.parse(previous.body); return true; } catch { return false; } }, [previous.body]);
  const isJsonCurr = useMemo(() => { try { JSON.parse(current.body); return true; } catch { return false; } }, [current.body]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-1.5 border-b border-border bg-muted/20 text-[10px] text-muted-foreground flex items-center gap-3 shrink-0">
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-sm bg-red-500/70" /> Removed
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-sm bg-green-500/70" /> Added
        </span>
        <span className="ml-auto">
          {previous.status} {previous.statusText} → {current.status} {current.statusText}
        </span>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="p-3 space-y-4">
          {/* Header diff */}
          <div>
            <h4 className="text-xs font-semibold mb-2">Headers</h4>
            <div className="space-y-0.5">
              {headerDiff.map((h) => (
                <div
                  key={h.key}
                  className={cn(
                    "text-[11px] font-mono p-1 rounded",
                    h.type === "added" && "bg-green-500/10 text-green-400",
                    h.type === "removed" && "bg-red-500/10 text-red-400",
                    h.type === "changed" && "bg-amber-500/10 text-amber-400",
                    h.type === "same" && "text-muted-foreground"
                  )}
                >
                  {h.type === "added" && (
                    <span className="text-green-400 mr-1">+</span>
                  )}
                  {h.type === "removed" && (
                    <span className="text-red-400 mr-1">-</span>
                  )}
                  {h.type === "changed" && (
                    <span className="text-amber-400 mr-1">~</span>
                  )}
                  {h.key}: {h.newValue ?? h.oldValue}
                  {h.type === "changed" && (
                    <span className="text-muted-foreground ml-1">(was: {h.oldValue})</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Body diff */}
          <div>
            <h4 className="text-xs font-semibold mb-2">
              Body {isJsonPrev && isJsonCurr ? "(formatted)" : "(line-by-line)"}
            </h4>
            <div className="bg-muted/30 rounded-lg overflow-hidden">
              <div className="flex border-b border-border text-[10px] text-muted-foreground">
                <div className="w-12 shrink-0 text-right pr-2 py-1 border-r border-border">Prev</div>
                <div className="w-12 shrink-0 text-right pr-2 py-1">Curr</div>
                <div className="flex-1 py-1 px-2" />
              </div>
              {bodyDiff.map((line, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex font-mono text-[11px] leading-5",
                    line.type === "added" && "bg-green-500/10",
                    line.type === "removed" && "bg-red-500/10"
                  )}
                >
                  <div className="w-12 shrink-0 text-right pr-2 text-muted-foreground/50 border-r border-border select-none">
                    {line.lineNumA ?? ""}
                  </div>
                  <div className="w-12 shrink-0 text-right pr-2 text-muted-foreground/50 select-none">
                    {line.lineNumB ?? ""}
                  </div>
                  <div className="flex-1 px-2 whitespace-pre-wrap break-words">
                    {line.type === "added" && <span className="text-green-400">+ {line.value}</span>}
                    {line.type === "removed" && <span className="text-red-400">- {line.value}</span>}
                    {line.type === "same" && <span className="text-foreground/70">{line.value}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
