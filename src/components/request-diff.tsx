"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GitCompareArrows, ArrowRight, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRequestStore } from "@/store/request-store";

interface DiffLine {
  type: "added" | "removed" | "unchanged" | "modified";
  left?: string;
  right?: string;
  key: string;
}

interface DiffSection {
  title: string;
  lines: DiffLine[];
}

function computeRequestDiff(
  leftRequest: Record<string, unknown> | undefined,
  rightRequest: Record<string, unknown> | undefined
): DiffSection[] {
  if (!leftRequest || !rightRequest) return [];

  const sections: DiffSection[] = [];

  const methodDiff: DiffLine[] = [];
  if (leftRequest.method !== rightRequest.method) {
    methodDiff.push({
      type: "modified",
      left: leftRequest.method as string,
      right: rightRequest.method as string,
      key: "method",
    });
  } else {
    methodDiff.push({
      type: "unchanged",
      left: leftRequest.method as string,
      right: rightRequest.method as string,
      key: "method",
    });
  }
  sections.push({ title: "Method", lines: methodDiff });

  const urlDiff: DiffLine[] = [];
  if (leftRequest.url !== rightRequest.url) {
    urlDiff.push({
      type: "modified",
      left: leftRequest.url as string,
      right: rightRequest.url as string,
      key: "url",
    });
  } else {
    urlDiff.push({
      type: "unchanged",
      left: leftRequest.url as string,
      right: rightRequest.url as string,
      key: "url",
    });
  }
  sections.push({ title: "URL", lines: urlDiff });

  const leftHeaders = (leftRequest.headers as Array<{ key: string; value: string }>) ?? [];
  const rightHeaders = (rightRequest.headers as Array<{ key: string; value: string }>) ?? [];
  const headerLines: DiffLine[] = [];
  const allHeaderKeys = new Set([...leftHeaders.map((h) => h.key), ...rightHeaders.map((h) => h.key)]);
  for (const key of allHeaderKeys) {
    const leftH = leftHeaders.find((h) => h.key === key);
    const rightH = rightHeaders.find((h) => h.key === key);
    if (leftH && rightH) {
      headerLines.push({
        type: leftH.value === rightH.value ? "unchanged" : "modified",
        left: `${key}: ${leftH.value}`,
        right: `${key}: ${rightH.value}`,
        key,
      });
    } else if (leftH) {
      headerLines.push({ type: "removed", left: `${key}: ${leftH.value}`, key });
    } else if (rightH) {
      headerLines.push({ type: "added", right: `${key}: ${rightH.value}`, key });
    }
  }
  sections.push({ title: "Headers", lines: headerLines });

  const leftBody = (leftRequest.body as { raw?: string })?.raw ?? "";
  const rightBody = (rightRequest.body as { raw?: string })?.raw ?? "";
  const bodyLines: DiffLine[] = [];
  if (leftBody === rightBody) {
    bodyLines.push({ type: "unchanged", left: leftBody || "(empty)", right: rightBody || "(empty)", key: "body" });
  } else {
    const leftLines = leftBody.split("\n");
    const rightLines = rightBody.split("\n");
    const maxLen = Math.max(leftLines.length, rightLines.length);
    for (let i = 0; i < maxLen; i++) {
      const l = leftLines[i];
      const r = rightLines[i];
      if (l === r) {
        bodyLines.push({ type: "unchanged", left: l ?? "", right: r ?? "", key: `body-${i}` });
      } else if (l !== undefined && r !== undefined) {
        bodyLines.push({ type: "modified", left: l, right: r, key: `body-${i}` });
      } else if (l !== undefined) {
        bodyLines.push({ type: "removed", left: l, key: `body-${i}` });
      } else {
        bodyLines.push({ type: "added", right: r, key: `body-${i}` });
      }
    }
  }
  sections.push({ title: "Body", lines: bodyLines });

  return sections;
}

export function RequestDiff() {
  const { tabs, requests } = useRequestStore();
  const [leftTabId, setLeftTabId] = useState<string | null>(null);
  const [rightTabId, setRightTabId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const leftRequest = leftTabId ? requests[tabs.find((t) => t.id === leftTabId)?.requestId ?? ""] : undefined;
  const rightRequest = rightTabId ? requests[tabs.find((t) => t.id === rightTabId)?.requestId ?? ""] : undefined;

  const diff = useMemo(
    () => computeRequestDiff(leftRequest as unknown as Record<string, unknown>, rightRequest as unknown as Record<string, unknown>),
    [leftRequest, rightRequest]
  );

  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    let modified = 0;
    for (const section of diff) {
      for (const line of section.lines) {
        if (line.type === "added") added++;
        else if (line.type === "removed") removed++;
        else if (line.type === "modified") modified++;
      }
    }
    return { added, removed, modified };
  }, [diff]);

  const copyDiff = useCallback(() => {
    const text = diff
      .map(
        (section) =>
          `=== ${section.title} ===\n` +
          section.lines
            .map((l) => {
              if (l.type === "unchanged") return `  ${l.left}`;
              if (l.type === "added") return `+ ${l.right}`;
              if (l.type === "removed") return `- ${l.left}`;
              return `- ${l.left}\n+ ${l.right}`;
            })
            .join("\n")
      )
      .join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [diff]);

  const selectableTabs = tabs.filter((t) => t.id !== rightTabId);
  const selectableTabsRight = tabs.filter((t) => t.id !== leftTabId);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <GitCompareArrows className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium">Request Diff</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="text-[10px] text-muted-foreground mb-1 block">Left (Original)</label>
          <select
            className="w-full h-8 px-2 text-xs bg-muted/50 rounded border border-border"
            value={leftTabId ?? ""}
            onChange={(e) => setLeftTabId(e.target.value || null)}
          >
            <option value="">Select request...</option>
            {selectableTabs.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.name}
              </option>
            ))}
          </select>
        </div>
        <ArrowRight className="size-4 text-muted-foreground mt-4" />
        <div className="flex-1">
          <label className="text-[10px] text-muted-foreground mb-1 block">Right (Modified)</label>
          <select
            className="w-full h-8 px-2 text-xs bg-muted/50 rounded border border-border"
            value={rightTabId ?? ""}
            onChange={(e) => setRightTabId(e.target.value || null)}
          >
            <option value="">Select request...</option>
            {selectableTabsRight.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {leftRequest && rightRequest && diff.length > 0 && (
        <>
          <div className="flex items-center gap-2">
            {stats.added > 0 && (
              <Badge variant="outline" className="h-5 text-[10px] bg-green-500/10 text-green-600 border-green-500/30">
                +{stats.added} added
              </Badge>
            )}
            {stats.removed > 0 && (
              <Badge variant="outline" className="h-5 text-[10px] bg-red-500/10 text-red-600 border-red-500/30">
                -{stats.removed} removed
              </Badge>
            )}
            {stats.modified > 0 && (
              <Badge variant="outline" className="h-5 text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30">
                ~{stats.modified} modified
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-5 ml-auto text-[10px] gap-1"
              onClick={copyDiff}
            >
              {copied ? <Check className="size-2.5" /> : <Copy className="size-2.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          <ScrollArea className="h-96">
            <div className="space-y-4">
              {diff.map((section) => (
                <div key={section.title}>
                  <div className="text-[10px] font-medium text-muted-foreground mb-1">{section.title}</div>
                  <div className="rounded-lg border overflow-hidden">
                    {section.lines.map((line) => (
                      <div
                        key={line.key}
                        className={cn(
                          "flex text-xs font-mono",
                          line.type === "added" && "bg-green-500/5",
                          line.type === "removed" && "bg-red-500/5",
                          line.type === "modified" && "bg-amber-500/5"
                        )}
                      >
                        <div className="w-1/2 px-2 py-0.5 border-r min-h-[20px] whitespace-pre-wrap break-all">
                          {line.type === "removed" || line.type === "modified" ? (
                            <span className="text-red-600 dark:text-red-400">
                              {line.type === "removed" ? "- " : "- "}
                              {line.left}
                            </span>
                          ) : line.type === "added" ? null : (
                            <span className="text-muted-foreground">{line.left}</span>
                          )}
                        </div>
                        <div className="w-1/2 px-2 py-0.5 min-h-[20px] whitespace-pre-wrap break-all">
                          {line.type === "added" || line.type === "modified" ? (
                            <span className="text-green-600 dark:text-green-400">
                              {line.type === "added" ? "+ " : "+ "}
                              {line.right}
                            </span>
                          ) : line.type === "removed" ? null : (
                            <span className="text-muted-foreground">{line.right}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </>
      )}

      {(!leftRequest || !rightRequest) && (
        <div className="flex items-center justify-center h-32 text-xs text-muted-foreground">
          Select two requests to compare
        </div>
      )}
    </div>
  );
}
