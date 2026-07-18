"use client";

import { useRequestStore } from "@/store/request-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AuthType } from "@/types";

const AUTH_TYPES: { value: AuthType; label: string }[] = [
  { value: "none", label: "No Auth" },
  { value: "bearer", label: "Bearer Token" },
  { value: "basic", label: "Basic Auth" },
  { value: "apikey", label: "API Key" },
  { value: "jwt", label: "JWT" },
  { value: "custom", label: "Custom Headers" },
];

export function AuthEditor() {
  const { getActiveRequest, updateAuth } = useRequestStore();
  const request = getActiveRequest();

  if (!request) return null;

  const auth = request.auth;

  return (
    <div className="space-y-3">
      <Select
        value={auth.type}
        onValueChange={(value) =>
          updateAuth(request.id, { type: value as AuthType })
        }
      >
        <SelectTrigger className="w-48 h-7 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {AUTH_TYPES.map((type) => (
            <SelectItem key={type.value} value={type.value} className="text-xs">
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {auth.type === "bearer" && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Token</Label>
          <Input
            value={auth.bearer?.token ?? ""}
            onChange={(e) =>
              updateAuth(request.id, {
                type: "bearer",
                bearer: { token: e.target.value },
              })
            }
            placeholder="{{TOKEN}} or paste token"
            className="h-7 text-xs font-mono"
          />
        </div>
      )}

      {auth.type === "basic" && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Username</Label>
          <Input
            value={auth.basic?.username ?? ""}
            onChange={(e) =>
              updateAuth(request.id, {
                type: "basic",
                basic: { ...auth.basic, username: e.target.value, password: auth.basic?.password ?? "" },
              })
            }
            placeholder="Username"
            className="h-7 text-xs font-mono"
          />
          <Label className="text-xs text-muted-foreground">Password</Label>
          <Input
            type="password"
            value={auth.basic?.password ?? ""}
            onChange={(e) =>
              updateAuth(request.id, {
                type: "basic",
                basic: { ...auth.basic, password: e.target.value, username: auth.basic?.username ?? "" },
              })
            }
            placeholder="Password"
            className="h-7 text-xs font-mono"
          />
        </div>
      )}

      {auth.type === "apikey" && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Key</Label>
          <Input
            value={auth.apikey?.key ?? ""}
            onChange={(e) =>
              updateAuth(request.id, {
                type: "apikey",
                apikey: { ...auth.apikey, key: e.target.value, value: auth.apikey?.value ?? "", addTo: auth.apikey?.addTo ?? "header" },
              })
            }
            placeholder="X-API-Key"
            className="h-7 text-xs font-mono"
          />
          <Label className="text-xs text-muted-foreground">Value</Label>
          <Input
            value={auth.apikey?.value ?? ""}
            onChange={(e) =>
              updateAuth(request.id, {
                type: "apikey",
                apikey: { ...auth.apikey, value: e.target.value, key: auth.apikey?.key ?? "", addTo: auth.apikey?.addTo ?? "header" },
              })
            }
            placeholder="Your API key"
            className="h-7 text-xs font-mono"
          />
          <Select
            value={auth.apikey?.addTo ?? "header"}
            onValueChange={(value) =>
              updateAuth(request.id, {
                type: "apikey",
                apikey: { ...auth.apikey, addTo: value as "header" | "query", key: auth.apikey?.key ?? "", value: auth.apikey?.value ?? "" },
              })
            }
          >
            <SelectTrigger className="w-40 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="header" className="text-xs">Header</SelectItem>
              <SelectItem value="query" className="text-xs">Query Param</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {auth.type === "none" && (
        <p className="text-xs text-muted-foreground">
          No authentication configured for this request.
        </p>
      )}
    </div>
  );
}
