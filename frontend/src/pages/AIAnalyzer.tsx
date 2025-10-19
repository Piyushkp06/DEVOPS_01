import { Layout } from "@/components/Layout";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sparkles, 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  TrendingUp,
  TrendingDown,
  Activity,
  FileText,
  Clock,
  Server
} from "lucide-react";
import { AI_ROUTES } from "@/utils/constants";

interface AnalysisResult {
  summary: string;
  severity: string;
  recommendations: string[];
  metrics?: {
    errorRate?: number;
    responseTime?: number;
    uptime?: number;
  };
  timestamp: string;
}

const AIAnalyzer = () => {
  const [analysisType, setAnalysisType] = useState("logs");
  const [timeRange, setTimeRange] = useState("1h");
  const [customInput, setCustomInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(AI_ROUTES.ANALYZE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: analysisType,
          timeRange: timeRange,
          customData: customInput || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during analysis");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "critical":
      case "high":
        return <TrendingDown className="h-4 w-4" />;
      case "medium":
        return <Activity className="h-4 w-4" />;
      case "low":
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-500" />
            AI Analyzer
          </h1>
          <p className="text-muted-foreground mt-1">
            Powered by Groq AI - Analyze logs, incidents, and services with advanced AI
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Configuration
              </CardTitle>
              <CardDescription>
                Set up your analysis parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="analysis-type">Analysis Type</Label>
                <Select value={analysisType} onValueChange={setAnalysisType}>
                  <SelectTrigger id="analysis-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="logs">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Logs Analysis
                      </div>
                    </SelectItem>
                    <SelectItem value="incidents">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Incidents Analysis
                      </div>
                    </SelectItem>
                    <SelectItem value="services">
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4" />
                        Services Analysis
                      </div>
                    </SelectItem>
                    <SelectItem value="custom">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Custom Analysis
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time-range">Time Range</Label>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger id="time-range">
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15m">Last 15 minutes</SelectItem>
                    <SelectItem value="1h">Last 1 hour</SelectItem>
                    <SelectItem value="6h">Last 6 hours</SelectItem>
                    <SelectItem value="24h">Last 24 hours</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {analysisType === "custom" && (
                <div className="space-y-2">
                  <Label htmlFor="custom-input">Custom Data</Label>
                  <Textarea
                    id="custom-input"
                    placeholder="Enter your custom data or logs to analyze..."
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    rows={6}
                    className="resize-none"
                  />
                </div>
              )}

              <Button 
                onClick={handleAnalyze} 
                disabled={loading || (analysisType === "custom" && !customInput)}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analyze with AI
                  </>
                )}
              </Button>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Results Panel */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Analysis Results
              </CardTitle>
              <CardDescription>
                AI-powered insights and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!result && !loading && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Sparkles className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Analysis Yet</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Configure your analysis parameters and click "Analyze with AI" to get started.
                  </p>
                </div>
              )}

              {loading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-16 w-16 animate-spin text-purple-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Analyzing...</h3>
                  <p className="text-sm text-muted-foreground">
                    AI is processing your data. This may take a moment.
                  </p>
                </div>
              )}

              {result && (
                <Tabs defaultValue="summary" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                    {result.metrics && <TabsTrigger value="metrics">Metrics</TabsTrigger>}
                  </TabsList>

                  <TabsContent value="summary" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {new Date(result.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <Badge variant={getSeverityColor(result.severity)} className="flex items-center gap-1">
                        {getSeverityIcon(result.severity)}
                        {result.severity}
                      </Badge>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Analysis Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[300px] pr-4">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {result.summary}
                          </p>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="recommendations" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">AI Recommendations</CardTitle>
                        <CardDescription>
                          Actionable insights to improve your infrastructure
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[300px] pr-4">
                          {result.recommendations.length > 0 ? (
                            <ul className="space-y-3">
                              {result.recommendations.map((rec, index) => (
                                <li key={index} className="flex items-start gap-3">
                                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm leading-relaxed">{rec}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No specific recommendations at this time.
                            </p>
                          )}
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {result.metrics && (
                    <TabsContent value="metrics" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {result.metrics.errorRate !== undefined && (
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm font-medium text-muted-foreground">
                                Error Rate
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">
                                {result.metrics.errorRate.toFixed(2)}%
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {result.metrics.responseTime !== undefined && (
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm font-medium text-muted-foreground">
                                Avg Response Time
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">
                                {result.metrics.responseTime}ms
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {result.metrics.uptime !== undefined && (
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm font-medium text-muted-foreground">
                                Uptime
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">
                                {result.metrics.uptime.toFixed(2)}%
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default AIAnalyzer;
