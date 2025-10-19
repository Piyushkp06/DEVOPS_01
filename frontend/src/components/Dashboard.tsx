import { useState } from "react";
import { MetricsDashboard } from "./MetricsDashboard";
import { AIChatCopilot } from "./AIChatCopilot";
import { AuditLog } from "./AuditLog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, MessageSquare, FileText } from "lucide-react";

export type ActiveView = "metrics" | "chat" | "audit";

export const Dashboard = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Monitor your infrastructure and AI-powered insights
        </p>
      </div>

      <Tabs defaultValue="metrics" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Metrics
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            AI Chat
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Audit Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          <MetricsDashboard />
        </TabsContent>

        <TabsContent value="chat" className="space-y-4">
          <AIChatCopilot />
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <AuditLog />
        </TabsContent>
      </Tabs>
    </div>
  );
};