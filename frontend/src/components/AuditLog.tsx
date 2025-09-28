import { Clock, CheckCircle, AlertCircle, XCircle, Zap } from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: Date;
  action: string;
  reason: string;
  status: "success" | "warning" | "error" | "pending";
  service?: string;
}

const mockLogEntries: LogEntry[] = [
  {
    id: "1",
    timestamp: new Date("2025-09-28 12:45:00"),
    action: "Restarted auth-api deployment",
    reason: "High Error Rate (30%) detected by anomaly agent",
    status: "success",
    service: "auth-api",
  },
  {
    id: "2",
    timestamp: new Date("2025-09-28 11:30:15"),
    action: "Scaled up payment-service replicas to 5",
    reason: "CPU usage exceeded 80% threshold for 5 minutes",
    status: "success",
    service: "payment-service",
  },
  {
    id: "3",
    timestamp: new Date("2025-09-28 10:15:42"),
    action: "Applied memory limit increase to user-service",
    reason: "Memory usage consistently above 90%",
    status: "warning",
    service: "user-service",
  },
  {
    id: "4",
    timestamp: new Date("2025-09-28 09:22:33"),
    action: "Initiated database connection pool optimization",
    reason: "Connection pool exhaustion detected",
    status: "success",
    service: "postgres-main",
  },
  {
    id: "5",
    timestamp: new Date("2025-09-28 08:45:11"),
    action: "Failed to restart notification-service",
    reason: "Service dependency check failed",
    status: "error",
    service: "notification-service",
  },
];

export const AuditLog = () => {
  const getStatusIcon = (status: LogEntry["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 status-success" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 status-warning" />;
      case "error":
        return <XCircle className="w-4 h-4 status-danger" />;
      case "pending":
        return <Clock className="w-4 h-4 text-muted-foreground animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: LogEntry["status"]) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case "success":
        return `${baseClasses} bg-success/20 text-success`;
      case "warning":
        return `${baseClasses} bg-warning/20 text-warning`;
      case "error":
        return `${baseClasses} bg-destructive/20 text-destructive`;
      case "pending":
        return `${baseClasses} bg-muted text-muted-foreground`;
      default:
        return baseClasses;
    }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Zap className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">
              Autonomous Agent Audit Log
            </h1>
          </div>
          <p className="text-muted-foreground">
            Track all automated actions taken by the AI agent on your infrastructure
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="metric-card">
            <div className="text-sm text-muted-foreground mb-1">Total Actions</div>
            <div className="text-2xl font-bold text-foreground">47</div>
          </div>
          <div className="metric-card">
            <div className="text-sm text-muted-foreground mb-1">Successful</div>
            <div className="text-2xl font-bold status-success">39</div>
          </div>
          <div className="metric-card">
            <div className="text-sm text-muted-foreground mb-1">Warnings</div>
            <div className="text-2xl font-bold status-warning">6</div>
          </div>
          <div className="metric-card">
            <div className="text-sm text-muted-foreground mb-1">Failed</div>
            <div className="text-2xl font-bold status-danger">2</div>
          </div>
        </div>

        {/* Log Entries */}
        <div className="metric-card">
          <h2 className="text-xl font-semibold text-foreground mb-6">Recent Actions</h2>
          
          <div className="space-y-4">
            {mockLogEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start space-x-4 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
              >
                <div className="mt-1">
                  {getStatusIcon(entry.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-foreground">
                        {entry.action}
                      </h3>
                      {entry.service && (
                        <span className="text-xs text-primary font-mono bg-primary/10 px-2 py-1 rounded mt-1 inline-block">
                          {entry.service}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={getStatusBadge(entry.status)}>
                        {entry.status}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Reason:</strong> {entry.reason}
                  </p>
                  
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="w-3 h-3 mr-1" />
                    {entry.timestamp.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-6">
            <button className="text-primary hover:text-primary-glow text-sm font-medium">
              Load more entries →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};