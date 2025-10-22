import { prometheusAPI } from './api.config';

export interface PrometheusQueryResult {
  metric: Record<string, string>;
  value?: [number, string];
  values?: Array<[number, string]>;
}

export interface PrometheusResponse {
  status: string;
  data: {
    resultType: string;
    result: PrometheusQueryResult[];
  };
}

export interface MetricValue {
  timestamp: number;
  value: number;
  labels?: Record<string, string>;
}

class PrometheusService {
  /**
   * Execute instant PromQL query
   */
  async query(promQL: string, time?: number): Promise<PrometheusQueryResult[]> {
    try {
      const params: any = { query: promQL };
      if (time) params.time = time;

      const response = await prometheusAPI.get<PrometheusResponse>('/api/v1/query', { params });
      return response.data.data.result;
    } catch (error) {
      console.error('Prometheus query error:', error);
      return [];
    }
  }

  /**
   * Execute range PromQL query
   */
  async queryRange(
    promQL: string,
    start: number,
    end: number,
    step: string = '15s'
  ): Promise<PrometheusQueryResult[]> {
    try {
      const response = await prometheusAPI.get<PrometheusResponse>('/api/v1/query_range', {
        params: { query: promQL, start, end, step }
      });
      return response.data.data.result;
    } catch (error) {
      console.error('Prometheus range query error:', error);
      return [];
    }
  }

  /**
   * Get HTTP request rate
   */
  async getRequestRate(timeRange: string = '5m'): Promise<MetricValue[]> {
    const query = `rate(http_requests_total[${timeRange}])`;
    const result = await this.query(query);
    return this.formatMetricValues(result);
  }

  /**
   * Get HTTP request duration (p95)
   */
  async getRequestDuration(timeRange: string = '5m', quantile: number = 0.95): Promise<MetricValue[]> {
    const query = `histogram_quantile(${quantile}, rate(http_request_duration_seconds_bucket[${timeRange}]))`;
    const result = await this.query(query);
    return this.formatMetricValues(result);
  }

  /**
   * Get error rate
   */
  async getErrorRate(timeRange: string = '5m'): Promise<MetricValue[]> {
    const query = `
      rate(http_requests_total{status_code=~"5.."}[${timeRange}]) / 
      rate(http_requests_total[${timeRange}])
    `;
    const result = await this.query(query);
    return this.formatMetricValues(result);
  }

  /**
   * Get active connections
   */
  async getActiveConnections(): Promise<MetricValue[]> {
    const query = 'active_connections';
    const result = await this.query(query);
    return this.formatMetricValues(result);
  }

  /**
   * Get AI analysis metrics
   */
  async getAIAnalysisMetrics() {
    const [requests, duration, active, groqCalls] = await Promise.all([
      this.query('ai_analysis_requests_total'),
      this.query('ai_analysis_duration_seconds'),
      this.query('active_ai_analyses'),
      this.query('groq_api_calls_total'),
    ]);

    return {
      requests: this.formatMetricValues(requests),
      duration: this.formatMetricValues(duration),
      active: this.formatMetricValues(active),
      groqCalls: this.formatMetricValues(groqCalls),
    };
  }

  /**
   * Get incident metrics
   */
  async getIncidentMetrics() {
    const [total, bySeverity, byStatus] = await Promise.all([
      this.query('incidents_total'),
      this.query('sum by (severity) (incidents_total)'),
      this.query('sum by (status) (incidents_total)'),
    ]);

    return {
      total: this.formatMetricValues(total),
      bySeverity: this.formatMetricValues(bySeverity),
      byStatus: this.formatMetricValues(byStatus),
    };
  }

  /**
   * Get log metrics
   */
  async getLogMetrics() {
    const [total, byLevel, byService] = await Promise.all([
      this.query('logs_total'),
      this.query('sum by (level) (logs_total)'),
      this.query('sum by (service) (logs_total)'),
    ]);

    return {
      total: this.formatMetricValues(total),
      byLevel: this.formatMetricValues(byLevel),
      byService: this.formatMetricValues(byService),
    };
  }

  /**
   * Get service health status
   */
  async getServiceHealth(): Promise<MetricValue[]> {
    const query = 'services_health_status';
    const result = await this.query(query);
    return this.formatMetricValues(result);
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics() {
    const [cpu, memory, heap] = await Promise.all([
      this.query('rate(process_cpu_seconds_total[5m]) * 100'),
      this.query('process_resident_memory_bytes / 1024 / 1024'), // Convert to MB
      this.query('nodejs_heap_size_used_bytes / 1024 / 1024'), // Convert to MB
    ]);

    return {
      cpu: this.formatMetricValues(cpu),
      memory: this.formatMetricValues(memory),
      heap: this.formatMetricValues(heap),
    };
  }

  /**
   * Get Prometheus targets status
   */
  async getTargets(): Promise<any[]> {
    try {
      const response = await prometheusAPI.get('/api/v1/targets');
      return response.data.data.activeTargets || [];
    } catch (error) {
      console.error('Get targets error:', error);
      return [];
    }
  }

  /**
   * Check Prometheus health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await prometheusAPI.get('/-/healthy');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get time series data for charts
   */
  async getTimeSeriesData(
    metric: string,
    timeRange: string = '1h',
    step: string = '1m'
  ): Promise<Array<{ timestamp: number; value: number }>> {
    const now = Math.floor(Date.now() / 1000);
    const timeRanges: Record<string, number> = {
      '15m': 900,
      '1h': 3600,
      '6h': 21600,
      '24h': 86400,
    };
    
    const start = now - (timeRanges[timeRange] || 3600);
    const result = await this.queryRange(metric, start, now, step);

    if (result.length === 0) return [];

    const data: Array<{ timestamp: number; value: number }> = [];
    result[0].values?.forEach(([timestamp, value]) => {
      data.push({
        timestamp: timestamp * 1000, // Convert to milliseconds
        value: parseFloat(value),
      });
    });

    return data;
  }

  /**
   * Format metric values helper
   */
  private formatMetricValues(results: PrometheusQueryResult[]): MetricValue[] {
    return results.map(result => ({
      timestamp: result.value ? result.value[0] : Date.now() / 1000,
      value: parseFloat(result.value ? result.value[1] : '0'),
      labels: result.metric,
    }));
  }

  /**
   * Get comprehensive dashboard data
   */
  async getDashboardMetrics() {
    try {
      const [
        requestRate,
        errorRate,
        responseTime,
        activeConnections,
        aiMetrics,
        incidentMetrics,
        logMetrics,
        serviceHealth,
        systemMetrics,
        targets,
      ] = await Promise.all([
        this.getRequestRate('5m'),
        this.getErrorRate('5m'),
        this.getRequestDuration('5m', 0.95),
        this.getActiveConnections(),
        this.getAIAnalysisMetrics(),
        this.getIncidentMetrics(),
        this.getLogMetrics(),
        this.getServiceHealth(),
        this.getSystemMetrics(),
        this.getTargets(),
      ]);

      return {
        requestRate,
        errorRate,
        responseTime,
        activeConnections,
        aiMetrics,
        incidentMetrics,
        logMetrics,
        serviceHealth,
        systemMetrics,
        targets,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      throw error;
    }
  }
}

export default new PrometheusService();
