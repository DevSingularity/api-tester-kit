"use client";

import { Sidebar } from "@/components/sidebar";

export default function GrpcPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 items-center justify-center text-muted-foreground">
        <div className="text-4xl mb-3 opacity-50">grpc</div>
        <h1 className="text-sm font-semibold mb-1">gRPC Client</h1>
        <p className="text-xs">Coming soon</p>
      </div>
    </div>
  );
}
