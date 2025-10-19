import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity, AlertTriangle, CheckCircle, RefreshCw, Server, TrendingUp } from 'lucide-react';
import { HOST, GET_ALL_SERVICES_ROUTE } from '@/utils/constants';

interface Service {
  id: string;
  name: string;
  status: 'RUNNING' | 'STOPPED' | 'ERROR' | 'DEGRADED';
  healthScore: number;
  url?: string;
  version?: string;
  lastHealthCheck?: string;
  createdAt: string;
}

const Services = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    running: 0,
    stopped: 0,
    error: 0,
    avgHealth: 0,
  });

  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${HOST}/${GET_ALL_SERVICES_ROUTE}`);
      if (response.ok) {
        const data = await response.json();
        setServices(data);
        
        // Calculate stats
        const running = data.filter((s: Service) => s.status === 'RUNNING').length;
        const stopped = data.filter((s: Service) => s.status === 'STOPPED').length;
        const error = data.filter((s: Service) => s.status === 'ERROR').length;
        const avgHealth = data.reduce((acc: number, s: Service) => acc + (s.healthScore || 0), 0) / (data.length || 1);
        
        setStats({
          total: data.length,
          running,
          stopped,
          error,
          avgHealth: Math.round(avgHealth),
        });
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
    const interval = setInterval(fetchServices, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: { color: string; icon: any } } = {
      RUNNING: { color: 'success', icon: CheckCircle },
      STOPPED: { color: 'secondary', icon: Server },
      ERROR: { color: 'destructive', icon: AlertTriangle },
      DEGRADED: { color: 'warning', icon: Activity },
    };

    const { color, icon: Icon } = variants[status] || variants.STOPPED;
    
    return (
      <Badge variant={color as any} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Services</h1>
          <p className="text-muted-foreground">Monitor service health and performance</p>
        </div>
        <Button onClick={fetchServices} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Registered services</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.running}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.running / stats.total) * 100) : 0}% uptime
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.error}</div>
            <p className="text-xs text-muted-foreground">Services with errors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Health</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgHealth}%</div>
            <Progress value={stats.avgHealth} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Services Table */}
      <Card>
        <CardHeader>
          <CardTitle>Service Status</CardTitle>
          <CardDescription>Real-time monitoring of all services</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Health Score</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Last Check</TableHead>
                <TableHead>URL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading services...
                  </TableCell>
                </TableRow>
              ) : services.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No services found
                  </TableCell>
                </TableRow>
              ) : (
                services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>{getStatusBadge(service.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={service.healthScore} 
                          className={`w-20 h-2 ${getHealthColor(service.healthScore)}`}
                        />
                        <span className="text-sm">{service.healthScore}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{service.version || 'N/A'}</TableCell>
                    <TableCell className="text-sm">
                      {service.lastHealthCheck 
                        ? new Date(service.lastHealthCheck).toLocaleString()
                        : 'Never'}
                    </TableCell>
                    <TableCell>
                      {service.url ? (
                        <a 
                          href={service.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline text-sm"
                        >
                          {service.url}
                        </a>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      </div>
    </Layout>
  );
};

export default Services;
