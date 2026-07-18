"use client";

import { useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { UrlBar } from "@/features/request-builder/components/url-bar";
import { RequestTabs } from "@/features/request-builder/components/request-tabs";
import { RequestPanel } from "@/features/request-builder/components/request-panel";
import { ResponseViewer } from "@/features/response-viewer/components/response-viewer";
import { useRequestStore } from "@/store/request-store";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { createTab, tabs } = useRequestStore();

  useEffect(() => {
    if (tabs.length === 0) {
      createTab();
    }
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between h-12 px-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <UrlBar />
          </div>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button variant="ghost" size="icon-sm" />
                }
              >
                <Settings className="size-4" />
              </TooltipTrigger>
              <TooltipContent>Settings</TooltipContent>
            </Tooltip>
          </div>
        </header>

        <RequestTabs />

        <div className="flex-1 flex min-h-0">
          <div className="flex-1 flex flex-col min-w-0 border-r border-border">
            <RequestPanel />
          </div>

          <Separator orientation="vertical" />

          <div className="flex-1 flex flex-col min-w-0">
            <ResponseViewer />
          </div>
        </div>
      </div>
    </div>
  );
}
