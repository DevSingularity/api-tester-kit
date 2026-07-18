"use client";

import { useState } from "react";
import { useRequestStore } from "@/store/request-store";
import { executeScript } from "@/lib/script-runner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, XCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ScriptEditor() {
  const { getActiveRequest, getActiveResponse } = useRequestStore();
  const request = getActiveRequest();
  const response = getActiveResponse();
  const [preScript, setPreScript] = useState("");
  const [testScript, setTestScript] = useState(
    '// Example: expect(response.status).toBe(200)\n// expect(response.body).toBeDefined()'
  );
  const [scriptResults, setScriptResults] = useState<{
    logs: string[];
    errors: string[];
    assertions: { passed: number; failed: number; messages: string[] };
  } | null>(null);

  if (!request) return null;

  const handleRunTest = () => {
    if (!testScript.trim()) return;

    const result = executeScript(testScript, {
      request,
      response,
      variables: {},
    });

    setScriptResults({
      logs: result.logs,
      errors: result.errors,
      assertions: result.assertions,
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Pre-request Script
          </label>
        </div>
        <textarea
          value={preScript}
          onChange={(e) => setPreScript(e.target.value)}
          placeholder="// Runs before the request is sent&#10;// Example:&#10;console.log('Preparing request...')"
          className="w-full h-28 p-2 font-mono text-xs bg-muted/50 rounded-lg border border-border resize-none focus:outline-none focus:ring-1 focus:ring-ring"
          spellCheck={false}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Test Script
          </label>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRunTest}
            disabled={!response}
            className="h-6 text-xs gap-1"
          >
            <Play className="size-3" />
            Run Tests
          </Button>
        </div>
        <textarea
          value={testScript}
          onChange={(e) => setTestScript(e.target.value)}
          placeholder="// Runs after the response is received&#10;// Example:&#10;expect(response.status).toBe(200)"
          className="w-full h-28 p-2 font-mono text-xs bg-muted/50 rounded-lg border border-border resize-none focus:outline-none focus:ring-1 focus:ring-ring"
          spellCheck={false}
        />
      </div>

      {scriptResults && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-mono">
              {scriptResults.assertions.passed} passed
            </Badge>
            {scriptResults.assertions.failed > 0 && (
              <Badge variant="destructive" className="text-[10px] font-mono">
                {scriptResults.assertions.failed} failed
              </Badge>
            )}
          </div>

          <ScrollArea className="max-h-40">
            <div className="space-y-1">
              {scriptResults.assertions.messages.map((msg, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs">
                  <XCircle className="size-3 text-red-400 mt-0.5 shrink-0" />
                  <span className="text-red-400 font-mono">{msg}</span>
                </div>
              ))}
              {scriptResults.logs.map((log, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs">
                  <span className="text-muted-foreground font-mono">› {log}</span>
                </div>
              ))}
              {scriptResults.errors.map((err, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs">
                  <XCircle className="size-3 text-red-400 mt-0.5 shrink-0" />
                  <span className="text-red-400 font-mono">{err}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      <div className="text-[10px] text-muted-foreground space-y-0.5">
        <p>Available in scripts:</p>
        <p className="font-mono">response.status, response.body, response.headers, response.time</p>
        <p className="font-mono">expect(value).toBe(), .toEqual(), .toContain(), .toBeTruthy()</p>
      </div>
    </div>
  );
}
