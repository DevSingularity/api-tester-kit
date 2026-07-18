"use client";

import { Sidebar } from "@/components/sidebar";
import { useRequestStore } from "@/store/request-store";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Moon, Sun, Monitor } from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { proxyMode, setProxyMode } = useRequestStore();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center h-12 px-4 border-b border-border shrink-0">
          <h1 className="text-sm font-semibold">Settings</h1>
        </header>

        <div className="flex-1 overflow-auto p-6 max-w-2xl space-y-6">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Appearance</h2>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Theme</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select your preferred theme
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("light")}
                >
                  <Sun className="size-3.5 mr-1" />
                  Light
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("dark")}
                >
                  <Moon className="size-3.5 mr-1" />
                  Dark
                </Button>
                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("system")}
                >
                  <Monitor className="size-3.5 mr-1" />
                  System
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Network</h2>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Proxy Mode</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Route requests through the built-in proxy to avoid CORS issues
                </p>
              </div>
              <Select
                value={proxyMode}
                onValueChange={(value) =>
                  setProxyMode(value as "direct" | "proxy" | "auto")
                }
              >
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="proxy" className="text-xs">
                    Proxy
                  </SelectItem>
                  <SelectItem value="direct" className="text-xs">
                    Direct
                  </SelectItem>
                  <SelectItem value="auto" className="text-xs">
                    Auto
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold">About</h2>
            <Separator />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>API Tester Kit v0.1.0</p>
              <p>A modern Postman alternative built with Next.js</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
