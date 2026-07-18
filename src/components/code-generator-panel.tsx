"use client";

import { useState } from "react";
import { useRequestStore } from "@/store/request-store";
import {
  generateCode,
  CODE_LANGUAGES,
  type CodeLanguage,
} from "@/lib/code-generator";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Check } from "lucide-react";

export function CodeGenerator() {
  const { getActiveRequest } = useRequestStore();
  const request = getActiveRequest();
  const [language, setLanguage] = useState<CodeLanguage>("curl");
  const [copied, setCopied] = useState(false);

  if (!request) return null;

  const code = generateCode(request, language);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Select value={language} onValueChange={(v) => setLanguage(v as CodeLanguage)}>
          <SelectTrigger className="w-48 h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CODE_LANGUAGES.map((lang) => (
              <SelectItem key={lang.value} value={lang.value} className="text-xs">
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={handleCopy} className="h-7 text-xs gap-1">
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="p-3 font-mono text-xs bg-muted/50 rounded-lg border border-border overflow-auto max-h-80 whitespace-pre-wrap break-words">
        {code}
      </pre>
    </div>
  );
}
