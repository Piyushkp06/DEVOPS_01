import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { MetricsDashboard } from "./MetricsDashboard";
import { AIChatCopilot } from "./AIChatCopilot";
import { AuditLog } from "./AuditLog";

export type ActiveView = "metrics" | "chat" | "audit";

export const Dashboard = () => {
  const [activeView, setActiveView] = useState<ActiveView>("metrics");

  const renderActiveView = () => {
    switch (activeView) {
      case "metrics":
        return <MetricsDashboard />;
      case "chat":
        return <AIChatCopilot />;
      case "audit":
        return <AuditLog />;
      default:
        return <MetricsDashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <main className="flex-1 overflow-hidden">
        {renderActiveView()}
      </main>
    </div>
  );
};