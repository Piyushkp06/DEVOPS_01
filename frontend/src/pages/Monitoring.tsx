import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  Server, 
  TrendingUp, 
  AlertTriangle, 
  RefreshCw,
  Cpu,
  Database,
  Zap,
  BarChart3,
  LineChart as LineChartIcon
} from "lucide-react";
import prometheusService from "@/services/prometheus.service";
import metricsService from "@/services/metrics.service";
import { useToast } from "@/hooks/use-toast";

const Monitoring = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(15000); // 15 seconds
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [healthData, setHealthData] = useState<any>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');

  useEffect(() => {
    fetchAllMetrics();
  }, [selectedTimeRange]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchAllMetrics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, selectedTimeRange]);

  const fetchAllMetrics = async () => {
    try {
      setLoading(true);
      
      const [dashboard, health] = await Promise.all([
        prometheusService.getDashboardMetrics(),
        metricsService.getAllHealthStatuses(),
      ]);

      setDashboardData(dashboard);
      setHealthData(health);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch monitoring data. Please check if Prometheus is running.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getValueFromMetric = (metrics: any[], defaultValue: any = 0) => {
    if (!metrics || metrics.length === 0) return defaultValue;
    return metrics[0].value;
  };

  const formatMetricValue = (value: number, unit: string = '') => {
    if (isNaN(value)) return 'N/A';
    return `${value.toFixed(2)}${unit}`;
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Monitoring Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Real-time metrics from Prometheus and Grafana
            </p>
          </div>
          
          <div className="flex gap-3">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-4 py-2 border rounded-lg bg-background"
            >
              <option value="15m">Last 15 minutes</option>
              <option value="1h">Last 1 hour</option>
              <option value="6h">Last 6 hours</option>
              <option value="24h">Last 24 hours</option>
            </select>

            <Button
              variant={autoRefresh ? "default" : "outline"}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <Activity className="w-4 h-4 mr-2" />
              {autoRefresh ? 'Auto Refresh ON' : 'Auto Refresh OFF'}
            </Button>

            <Button
              onClick={fetchAllMetrics}
              disabled={loading}
              variant="outline"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Backend Health Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Node Backend</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {healthData?.node?.status === 'healthy' ? 'Healthy' : 'Unhealthy'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Port: 3000
                  </p>
                </div>
                <Badge variant={healthData?.node?.status === 'healthy' ? 'default' : 'destructive'}>
                  {healthData?.node?.status === 'healthy' ? '✓ UP' : '✗ DOWN'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Python Backend</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {healthData?.python?.status === 'healthy' ? 'Healthy' : 'Unhealthy'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Port: 8000
                  </p>
                </div>
                <Badge variant={healthData?.python?.status === 'healthy' ? 'default' : 'destructive'}>
                  {healthData?.python?.status === 'healthy' ? '✓ UP' : '✗ DOWN'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Request Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatMetricValue(getValueFromMetric(dashboardData?.requestRate), ' req/s')}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                HTTP requests per second
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatMetricValue(getValueFromMetric(dashboardData?.errorRate, 0) * 100, '%')}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                5xx errors percentage
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Response Time (p95)</CardTitle>
              <Activity className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatMetricValue(getValueFromMetric(dashboardData?.responseTime) * 1000, 'ms')}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                95th percentile latency
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active AI Analyses</CardTitle>
              <Zap className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getValueFromMetric(dashboardData?.aiMetrics?.active, 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Currently processing
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Different Views */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="overview">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="targets">
              <Server className="w-4 h-4 mr-2" />
              Targets
            </TabsTrigger>
            <TabsTrigger value="system">
              <Cpu className="w-4 h-4 mr-2" />
              System
            </TabsTrigger>
            <TabsTrigger value="grafana">
              <LineChartIcon className="w-4 h-4 mr-2" />
              Grafana
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Incidents */}
              <Card>
                <CardHeader>
                  <CardTitle>Incidents by Severity</CardTitle>
                  <CardDescription>Total incidents grouped by severity level</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dashboardData?.incidentMetrics?.bySeverity?.map((metric: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <span className="font-medium">{metric.labels?.severity || 'Unknown'}</span>
                        <Badge>{metric.value}</Badge>
                      </div>
                    )) || <p className="text-muted-foreground">No data available</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Logs */}
              <Card>
                <CardHeader>
                  <CardTitle>Logs by Level</CardTitle>
                  <CardDescription>Log entries grouped by severity level</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dashboardData?.logMetrics?.byLevel?.map((metric: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <span className="font-medium">{metric.labels?.level || 'Unknown'}</span>
                        <Badge variant={
                          metric.labels?.level === 'error' ? 'destructive' : 
                          metric.labels?.level === 'warn' ? 'outline' : 'default'
                        }>
                          {metric.value}
                        </Badge>
                      </div>
                    )) || <p className="text-muted-foreground">No data available</p>}
                  </div>
                </CardContent>
              </Card>

              {/* AI Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>AI Analysis Performance</CardTitle>
                  <CardDescription>Groq API and analysis metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Requests</span>
                      <span className="font-bold">
                        {getValueFromMetric(dashboardData?.aiMetrics?.requests, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Groq API Calls</span>
                      <span className="font-bold">
                        {getValueFromMetric(dashboardData?.aiMetrics?.groqCalls, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Avg Duration</span>
                      <span className="font-bold">
                        {formatMetricValue(getValueFromMetric(dashboardData?.aiMetrics?.duration), 's')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Service Health */}
              <Card>
                <CardHeader>
                  <CardTitle>Service Health Status</CardTitle>
                  <CardDescription>Current health of all monitored services</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dashboardData?.serviceHealth?.map((metric: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <span className="font-medium">{metric.labels?.service_name || 'Service'}</span>
                        <Badge variant={metric.value === 1 ? 'default' : 'destructive'}>
                          {metric.value === 1 ? '✓ Healthy' : '✗ Down'}
                        </Badge>
                      </div>
                    )) || <p className="text-muted-foreground">No services configured</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="targets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Prometheus Targets</CardTitle>
                <CardDescription>Status of all scrape targets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData?.targets?.map((target: any, index: number) => (
                    <div
                      key={index}
                      className={`p-4 border-2 rounded-lg ${
                        target.health === 'up' ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-red-500 bg-red-50 dark:bg-red-950'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{target.labels?.job || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">
                            {target.labels?.instance || target.scrapeUrl}
                          </p>
                        </div>
                        <Badge variant={target.health === 'up' ? 'default' : 'destructive'}>
                          {target.health === 'up' ? '✓ UP' : '✗ DOWN'}
                        </Badge>
                      </div>
                      {target.lastScrape && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Last scrape: {new Date(target.lastScrape).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )) || <p className="text-muted-foreground">No targets found</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>CPU Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {formatMetricValue(getValueFromMetric(dashboardData?.systemMetrics?.cpu), '%')}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Process CPU utilization
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Memory Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {formatMetricValue(getValueFromMetric(dashboardData?.systemMetrics?.memory), ' MB')}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Resident memory size
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Heap Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {formatMetricValue(getValueFromMetric(dashboardData?.systemMetrics?.heap), ' MB')}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Node.js heap size
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="grafana" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Grafana Dashboard</CardTitle>
                <CardDescription>Embedded Grafana visualization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src="http://localhost:3001/d/devops-ai-overview/devops-ai-platform-overview?orgId=1&theme=light&kiosk"
                    className="absolute top-0 left-0 w-full h-full border-0 rounded-lg"
                    title="Grafana Dashboard"
                  />
                </div>
                <div className="mt-4 flex gap-3">
                  <Button variant="outline" asChild>
                    <a href="http://localhost:3001" target="_blank" rel="noopener noreferrer">
                      Open Full Grafana →
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="http://localhost:9090" target="_blank" rel="noopener noreferrer">
                      Open Prometheus →
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Monitoring;
