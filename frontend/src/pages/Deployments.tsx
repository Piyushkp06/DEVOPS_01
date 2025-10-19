import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, XCircle, Clock, RefreshCw, GitBranch, User, Calendar } from 'lucide-react';
import { HOST, GET_ALL_DEPLOYMENTS_ROUTE } from '@/utils/constants';

interface Deployment {
  id: string;
  version: string;
  environment: 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION';
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'IN_PROGRESS';
  serviceId: string;
  deployedBy?: string;
  deployedAt: string;
  notes?: string;
}

const Deployments = () => {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeployments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${HOST}/${GET_ALL_DEPLOYMENTS_ROUTE}`);
      if (response.ok) {
        const data = await response.json();
        // Sort by date descending
        const sorted = data.sort((a: Deployment, b: Deployment) => 
          new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime()
        );
        setDeployments(sorted);
      }
    } catch (error) {
      console.error('Error fetching deployments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeployments();
  }, []);

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: { color: string; icon: any } } = {
      SUCCESS: { color: 'success', icon: CheckCircle },
      FAILED: { color: 'destructive', icon: XCircle },
      PENDING: { color: 'secondary', icon: Clock },
      IN_PROGRESS: { color: 'warning', icon: Clock },
    };

    const { color, icon: Icon } = variants[status] || variants.PENDING;
    
    return (
      <Badge variant={color as any} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getEnvironmentBadge = (env: string) => {
    const variants: { [key: string]: string } = {
      PRODUCTION: 'destructive',
      STAGING: 'warning',
      DEVELOPMENT: 'default',
    };
    
    return <Badge variant={variants[env] as any}>{env}</Badge>;
  };

  const groupByEnvironment = (env: string) => {
    return deployments.filter(d => d.environment === env);
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deployments</h1>
          <p className="text-muted-foreground">Track deployment history across environments</p>
        </div>
        <Button onClick={fetchDeployments} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Production Deployments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-destructive" />
              Production
            </CardTitle>
            <CardDescription>{groupByEnvironment('PRODUCTION').length} deployments</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {groupByEnvironment('PRODUCTION').map((deployment, index) => (
                  <Card key={deployment.id} className="relative">
                    {index !== groupByEnvironment('PRODUCTION').length - 1 && (
                      <div className="absolute left-6 top-full h-4 w-0.5 bg-border" />
                    )}
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${
                          deployment.status === 'SUCCESS' ? 'bg-green-500' :
                          deployment.status === 'FAILED' ? 'bg-red-500' :
                          'bg-yellow-500'
                        }`} />
                        <span className="font-mono text-sm font-semibold">{deployment.version}</span>
                      </div>
                      
                      <div className="space-y-2">
                        {getStatusBadge(deployment.status)}
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(deployment.deployedAt).toLocaleString()}
                        </div>
                        
                        {deployment.deployedBy && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            {deployment.deployedBy}
                          </div>
                        )}
                        
                        <div className="text-xs font-mono text-muted-foreground">
                          Service: {deployment.serviceId}
                        </div>
                        
                        {deployment.notes && (
                          <p className="text-xs text-muted-foreground border-l-2 pl-2">
                            {deployment.notes}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {groupByEnvironment('PRODUCTION').length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No production deployments
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Staging Deployments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-warning" />
              Staging
            </CardTitle>
            <CardDescription>{groupByEnvironment('STAGING').length} deployments</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {groupByEnvironment('STAGING').map((deployment, index) => (
                  <Card key={deployment.id} className="relative">
                    {index !== groupByEnvironment('STAGING').length - 1 && (
                      <div className="absolute left-6 top-full h-4 w-0.5 bg-border" />
                    )}
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${
                          deployment.status === 'SUCCESS' ? 'bg-green-500' :
                          deployment.status === 'FAILED' ? 'bg-red-500' :
                          'bg-yellow-500'
                        }`} />
                        <span className="font-mono text-sm font-semibold">{deployment.version}</span>
                      </div>
                      
                      <div className="space-y-2">
                        {getStatusBadge(deployment.status)}
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(deployment.deployedAt).toLocaleString()}
                        </div>
                        
                        {deployment.deployedBy && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            {deployment.deployedBy}
                          </div>
                        )}
                        
                        <div className="text-xs font-mono text-muted-foreground">
                          Service: {deployment.serviceId}
                        </div>
                        
                        {deployment.notes && (
                          <p className="text-xs text-muted-foreground border-l-2 pl-2">
                            {deployment.notes}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {groupByEnvironment('STAGING').length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No staging deployments
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Development Deployments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-muted-foreground" />
              Development
            </CardTitle>
            <CardDescription>{groupByEnvironment('DEVELOPMENT').length} deployments</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {groupByEnvironment('DEVELOPMENT').map((deployment, index) => (
                  <Card key={deployment.id} className="relative">
                    {index !== groupByEnvironment('DEVELOPMENT').length - 1 && (
                      <div className="absolute left-6 top-full h-4 w-0.5 bg-border" />
                    )}
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${
                          deployment.status === 'SUCCESS' ? 'bg-green-500' :
                          deployment.status === 'FAILED' ? 'bg-red-500' :
                          'bg-yellow-500'
                        }`} />
                        <span className="font-mono text-sm font-semibold">{deployment.version}</span>
                      </div>
                      
                      <div className="space-y-2">
                        {getStatusBadge(deployment.status)}
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(deployment.deployedAt).toLocaleString()}
                        </div>
                        
                        {deployment.deployedBy && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            {deployment.deployedBy}
                          </div>
                        )}
                        
                        <div className="text-xs font-mono text-muted-foreground">
                          Service: {deployment.serviceId}
                        </div>
                        
                        {deployment.notes && (
                          <p className="text-xs text-muted-foreground border-l-2 pl-2">
                            {deployment.notes}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {groupByEnvironment('DEVELOPMENT').length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No development deployments
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      </div>
    </Layout>
  );
};

export default Deployments;
