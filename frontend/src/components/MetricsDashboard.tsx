import { MetricCard } from "./MetricCard";
import { Activity, Server, BarChart3 } from "lucide-react";

export const MetricsDashboard = () => {
  return (
    <div className="h-full overflow-auto">
      <div className="p-8 space-y-8">
        {/* Professional Header */}
        <div className="border-b border-border pb-6">
          <h1 className="text-3xl font-semibold text-foreground tracking-tight">
            Infrastructure Overview
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Real-time monitoring and performance metrics for your infrastructure
          </p>
        </div>

        {/* Grafana Dashboard Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Activity className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-xl font-medium text-foreground">System Metrics</h2>
              <p className="text-muted-foreground text-sm">Live dashboard integration</p>
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-xl p-8 min-h-[400px] flex items-center justify-center backdrop-blur-sm">
            <div className="text-center space-y-4 max-w-lg">
              <div className="w-16 h-16 mx-auto bg-muted/20 border border-border rounded-xl flex items-center justify-center">
                <Server className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground">Grafana Dashboard</h3>
                <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                  Connect your Grafana instance to display real-time metrics, graphs, and monitoring data from your infrastructure.
                </p>
              </div>
              <div className="inline-block px-4 py-2 bg-muted/50 border border-border rounded-lg text-xs font-mono text-muted-foreground">
                &lt;iframe src="your-grafana-dashboard-url" /&gt;
              </div>
            </div>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-xl font-medium text-foreground">Key Performance Indicators</h2>
              <p className="text-muted-foreground text-sm">Critical system health metrics</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MetricCard
              title="Service Latency"
              value="125ms"
              trend={{
                direction: "up",
                value: "+5%",
              }}
              status="success"
            />
            
            <MetricCard
              title="Error Rate"
              value="0.1%"
              trend={{
                direction: "down",
                value: "-0.05%",
              }}
              status="success"
            />
            
            <MetricCard
              title="Active Pods"
              value={15}
              trend={{
                direction: "neutral",
                value: "Stable",
              }}
              status="neutral"
            />
          </div>
        </div>
      </div>
    </div>
  );
};