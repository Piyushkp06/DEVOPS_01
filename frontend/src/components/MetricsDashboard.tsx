import { useEffect, useState } from "react";
import { MetricCard } from "./MetricCard";
import { Activity, Server, BarChart3, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import prometheusService from "@/services/prometheus.service";
import { Link } from "react-router-dom";

export const MetricsDashboard = () => {
  const [metrics, setMetrics] = useState<any>({
    requestRate: 0,
    errorRate: 0,
    responseTime: 0,
    activeConnections: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const [requestRate, errorRate, responseTime, activeConnections] = await Promise.all([
        prometheusService.getRequestRate('5m'),
        prometheusService.getErrorRate('5m'),
        prometheusService.getRequestDuration('5m', 0.95),
        prometheusService.getActiveConnections(),
      ]);

      setMetrics({
        requestRate: requestRate[0]?.value || 0,
        errorRate: (errorRate[0]?.value || 0) * 100,
        responseTime: (responseTime[0]?.value || 0) * 1000,
        activeConnections: activeConnections[0]?.value || 0,
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="p-8 space-y-8">
        {/* Professional Header */}
        <div className="border-b border-border pb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-foreground tracking-tight">
                Infrastructure Overview
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Real-time monitoring and performance metrics for your infrastructure
              </p>
            </div>
            <Link to="/monitoring">
              <Button variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" />
                Full Monitoring Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Grafana Dashboard Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Activity className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-xl font-medium text-foreground">System Metrics</h2>
              <p className="text-muted-foreground text-sm">Live dashboard from Grafana</p>
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src="http://localhost:3001/d/devops-ai-overview/devops-ai-platform-overview?orgId=1&theme=light&kiosk"
                className="absolute top-0 left-0 w-full h-full border-0"
                title="Grafana Dashboard"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" size="sm" asChild>
              <a href="http://localhost:3001" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Grafana
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="http://localhost:9090" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Prometheus
              </a>
            </Button>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-xl font-medium text-foreground">Key Performance Indicators</h2>
              <p className="text-muted-foreground text-sm">Critical system health metrics from Prometheus</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Request Rate"
              value={loading ? "Loading..." : `${metrics.requestRate.toFixed(2)} req/s`}
              trend={{
                direction: "up",
                value: "+5%",
              }}
              status="success"
            />
            
            <MetricCard
              title="Error Rate"
              value={loading ? "Loading..." : `${metrics.errorRate.toFixed(2)}%`}
              trend={{
                direction: metrics.errorRate < 1 ? "down" : "up",
                value: metrics.errorRate < 1 ? "Good" : "High",
              }}
              status={metrics.errorRate < 1 ? "success" : "danger"}
            />
            
            <MetricCard
              title="Response Time (p95)"
              value={loading ? "Loading..." : `${metrics.responseTime.toFixed(0)}ms`}
              trend={{
                direction: "neutral",
                value: "Stable",
              }}
              status="success"
            />

            <MetricCard
              title="Active Connections"
              value={loading ? "Loading..." : metrics.activeConnections}
              trend={{
                direction: "neutral",
                value: "Real-time",
              }}
              status="neutral"
            />
          </div>
        </div>
      </div>
    </div>
  );
};