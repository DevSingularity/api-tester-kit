"use client";

import { useRequestStore } from "@/store/request-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ParamsEditor } from "./params-editor";
import { HeadersEditor } from "./headers-editor";
import { BodyEditor } from "./body-editor";
import { AuthEditor } from "./auth-editor";
import { ScriptEditor } from "./script-editor";

export function RequestPanel() {
  const { getActiveRequest } = useRequestStore();
  const request = getActiveRequest();

  if (!request) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p className="text-sm">No request open. Create a new tab to start.</p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="params" className="flex flex-col h-full">
      <div className="border-b border-border px-2">
        <TabsList className="h-9 bg-transparent p-0 gap-0">
          <TabsTrigger
            value="params"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-3 py-1.5 text-xs font-medium"
          >
            Params
          </TabsTrigger>
          <TabsTrigger
            value="headers"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-3 py-1.5 text-xs font-medium"
          >
            Headers
          </TabsTrigger>
          <TabsTrigger
            value="body"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-3 py-1.5 text-xs font-medium"
          >
            Body
          </TabsTrigger>
          <TabsTrigger
            value="auth"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-3 py-1.5 text-xs font-medium"
          >
            Auth
          </TabsTrigger>
          <TabsTrigger
            value="scripts"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-3 py-1.5 text-xs font-medium"
          >
            Scripts
          </TabsTrigger>
        </TabsList>
      </div>
      <div className="flex-1 overflow-auto">
        <TabsContent value="params" className="m-0 p-2">
          <ParamsEditor />
        </TabsContent>
        <TabsContent value="headers" className="m-0 p-2">
          <HeadersEditor />
        </TabsContent>
        <TabsContent value="body" className="m-0 p-2">
          <BodyEditor />
        </TabsContent>
        <TabsContent value="auth" className="m-0 p-2">
          <AuthEditor />
        </TabsContent>
        <TabsContent value="scripts" className="m-0 p-2">
          <ScriptEditor />
        </TabsContent>
      </div>
    </Tabs>
  );
}
