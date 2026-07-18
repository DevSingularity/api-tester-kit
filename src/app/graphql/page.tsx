"use client";

import { Sidebar } from "@/components/sidebar";
import { Braces } from "lucide-react";

export default function GraphQLPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 items-center justify-center text-muted-foreground">
        <Braces className="size-12 mb-3 opacity-50" />
        <h1 className="text-sm font-semibold mb-1">GraphQL Playground</h1>
        <p className="text-xs">Coming soon</p>
      </div>
    </div>
  );
}
