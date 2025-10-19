import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle, Clock, RefreshCw, Sparkles } from 'lucide-react';
import { HOST, GET_ALL_INCIDENTS_ROUTE, UPDATE_INCIDENT_ROUTE, AI_ANALYZE_URL } from '@/utils/constants';

interface Incident {
  id: string;
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  serviceId: string;
  createdAt: string;
  resolvedAt?: string;
}

const Incidents = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<string>('');
  const [analyzingAI, setAnalyzingAI] = useState(false);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${HOST}/${GET_ALL_INCIDENTS_ROUTE}`);
      if (response.ok) {
        const data = await response.json();
        setIncidents(data);
      }
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const updateIncidentStatus = async (incidentId: string, status: string) => {
    try {
      const response = await fetch(`${HOST}/${UPDATE_INCIDENT_ROUTE(incidentId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      
      if (response.ok) {
        fetchIncidents();
      }
    } catch (error) {
      console.error('Error updating incident:', error);
    }
  };

  const getAISuggestions = async (incident: Incident) => {
    setAnalyzingAI(true);
    setAiSuggestion('');
    
    try {
      const response = await fetch(AI_ANALYZE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: 'incident_resolution',
          data: {
            incident_id: incident.id,
            title: incident.title,
            description: incident.description,
            severity: incident.severity,
          },
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setAiSuggestion(data.analysis || 'No suggestions available');
      }
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      setAiSuggestion('Failed to get AI suggestions. Please try again.');
    } finally {
      setAnalyzingAI(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants: { [key: string]: string } = {
      CRITICAL: 'destructive',
      HIGH: 'destructive',
      MEDIUM: 'warning',
      LOW: 'default',
    };
    
    return <Badge variant={variants[severity] as any}>{severity}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: { color: string; icon: any } } = {
      OPEN: { color: 'destructive', icon: AlertCircle },
      IN_PROGRESS: { color: 'warning', icon: Clock },
      RESOLVED: { color: 'success', icon: CheckCircle },
      CLOSED: { color: 'secondary', icon: CheckCircle },
    };

    const { color, icon: Icon } = variants[status] || variants.OPEN;
    
    return (
      <Badge variant={color as any} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const groupedIncidents = {
    open: incidents.filter(i => i.status === 'OPEN'),
    inProgress: incidents.filter(i => i.status === 'IN_PROGRESS'),
    resolved: incidents.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED'),
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Incidents</h1>
          <p className="text-muted-foreground">Manage and resolve system incidents</p>
        </div>
        <Button onClick={fetchIncidents} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Open Incidents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Open ({groupedIncidents.open.length})
            </CardTitle>
            <CardDescription>Incidents requiring attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {groupedIncidents.open.map((incident) => (
              <Dialog key={incident.id}>
                <DialogTrigger asChild>
                  <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => setSelectedIncident(incident)}>
                    <CardContent className="pt-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-sm">{incident.title}</h3>
                        {getSeverityBadge(incident.severity)}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{incident.description}</p>
                      <div className="flex justify-between items-center">
                        {getStatusBadge(incident.status)}
                        <span className="text-xs text-muted-foreground">
                          {new Date(incident.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{incident.title}</DialogTitle>
                    <DialogDescription>Incident Details and AI-Assisted Resolution</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <p className="text-sm text-muted-foreground mt-1">{incident.description}</p>
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <label className="text-sm font-medium">Severity</label>
                        <div className="mt-1">{getSeverityBadge(incident.severity)}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Service ID</label>
                        <p className="text-sm text-muted-foreground mt-1 font-mono">{incident.serviceId}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Update Status</label>
                      <Select
                        value={incident.status}
                        onValueChange={(value) => updateIncidentStatus(incident.id, value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OPEN">Open</SelectItem>
                          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                          <SelectItem value="RESOLVED">Resolved</SelectItem>
                          <SelectItem value="CLOSED">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Button
                        onClick={() => getAISuggestions(incident)}
                        disabled={analyzingAI}
                        className="w-full"
                      >
                        <Sparkles className={`mr-2 h-4 w-4 ${analyzingAI ? 'animate-pulse' : ''}`} />
                        {analyzingAI ? 'Analyzing...' : 'Get AI Suggestions'}
                      </Button>
                      {aiSuggestion && (
                        <Textarea
                          value={aiSuggestion}
                          readOnly
                          className="mt-2 min-h-[150px]"
                        />
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </CardContent>
        </Card>

        {/* In Progress Incidents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              In Progress ({groupedIncidents.inProgress.length})
            </CardTitle>
            <CardDescription>Incidents being worked on</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {groupedIncidents.inProgress.map((incident) => (
              <Card key={incident.id} className="cursor-pointer hover:bg-accent transition-colors">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-sm">{incident.title}</h3>
                    {getSeverityBadge(incident.severity)}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{incident.description}</p>
                  <div className="flex justify-between items-center">
                    {getStatusBadge(incident.status)}
                    <span className="text-xs text-muted-foreground">
                      {new Date(incident.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Resolved Incidents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Resolved ({groupedIncidents.resolved.length})
            </CardTitle>
            <CardDescription>Completed incidents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {groupedIncidents.resolved.map((incident) => (
              <Card key={incident.id} className="opacity-70">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-sm">{incident.title}</h3>
                    {getSeverityBadge(incident.severity)}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{incident.description}</p>
                  <div className="flex justify-between items-center">
                    {getStatusBadge(incident.status)}
                    <span className="text-xs text-muted-foreground">
                      {incident.resolvedAt && new Date(incident.resolvedAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>
      </div>
    </Layout>
  );
};

export default Incidents;
