import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, RefreshCw, Filter, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { HOST, GET_ALL_LOGS_ROUTE } from '@/utils/constants';

interface Log {
  id: string;
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  message: string;
  serviceId: string;
  timestamp: string;
  metadata?: any;
}

const Logs = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${HOST}/${GET_ALL_LOGS_ROUTE}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
        setFilteredLogs(data);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let filtered = logs;
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.serviceId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by level
    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter);
    }

    setFilteredLogs(filtered);
  }, [searchTerm, levelFilter, logs]);

  const getLevelBadge = (level: string) => {
    const variants: { [key: string]: { color: string; icon: any } } = {
      ERROR: { color: 'destructive', icon: XCircle },
      WARN: { color: 'warning', icon: AlertCircle },
      INFO: { color: 'default', icon: CheckCircle },
      DEBUG: { color: 'secondary', icon: CheckCircle },
    };

    const { color, icon: Icon } = variants[level] || variants.INFO;
    
    return (
      <Badge variant={color as any} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {level}
      </Badge>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System Logs</h1>
            <p className="text-muted-foreground">Monitor and analyze system logs in real-time</p>
          </div>
          <Button onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filter Logs</CardTitle>
            <CardDescription>Search and filter logs by level or keywords</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="ERROR">Error</SelectItem>
                  <SelectItem value="WARN">Warning</SelectItem>
                  <SelectItem value="INFO">Info</SelectItem>
                  <SelectItem value="DEBUG">Debug</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Log Entries ({filteredLogs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Level</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      Loading logs...
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      No logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{getLevelBadge(log.level)}</TableCell>
                      <TableCell className="text-sm">{formatTimestamp(log.timestamp)}</TableCell>
                      <TableCell className="font-mono text-sm">{log.serviceId}</TableCell>
                      <TableCell className="max-w-md truncate">{log.message}</TableCell>
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

export default Logs;
