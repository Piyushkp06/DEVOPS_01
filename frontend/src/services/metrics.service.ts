import { nodeBackendAPI, pythonBackendAPI } from './api.config';

class MetricsService {
  /**
   * Get Node backend raw metrics (Prometheus format)
   */
  async getNodeBackendMetrics(): Promise<string> {
    try {
      const response = await nodeBackendAPI.get('/metrics', {
        headers: { 'Accept': 'text/plain' }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching Node backend metrics:', error);
      return '';
    }
  }

  /**
   * Get Python backend raw metrics (Prometheus format)
   */
  async getPythonBackendMetrics(): Promise<string> {
    try {
      const response = await pythonBackendAPI.get('/metrics', {
        headers: { 'Accept': 'text/plain' }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching Python backend metrics:', error);
      return '';
    }
  }

  /**
   * Get Node backend health
   */
  async getNodeBackendHealth() {
    try {
      const response = await nodeBackendAPI.get('/health');
      return response.data;
    } catch (error) {
      console.error('Error fetching Node backend health:', error);
      return null;
    }
  }

  /**
   * Get Python backend health
   */
  async getPythonBackendHealth() {
    try {
      const response = await pythonBackendAPI.get('/health');
      return response.data;
    } catch (error) {
      console.error('Error fetching Python backend health:', error);
      return null;
    }
  }

  /**
   * Parse Prometheus text format metrics
   */
  parsePrometheusMetrics(text: string): Record<string, any[]> {
    const metrics: Record<string, any[]> = {};
    const lines = text.split('\n');

    for (const line of lines) {
      if (line.startsWith('#') || !line.trim()) continue;

      const match = line.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)\{?([^}]*)\}?\s+([0-9.eE+-]+)/);
      if (match) {
        const [, name, labels, value] = match;
        if (!metrics[name]) metrics[name] = [];
        metrics[name].push({
          labels: labels ? this.parseLabels(labels) : {},
          value: parseFloat(value)
        });
      }
    }

    return metrics;
  }

  /**
   * Parse Prometheus labels
   */
  private parseLabels(labelString: string): Record<string, string> {
    const labels: Record<string, string> = {};
    const pairs = labelString.match(/([a-zA-Z_][a-zA-Z0-9_]*)="([^"]*)"/g) || [];
    
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      labels[key] = value.replace(/"/g, '');
    }
    
    return labels;
  }

  /**
   * Get all backend health statuses
   */
  async getAllHealthStatuses() {
    const [nodeHealth, pythonHealth] = await Promise.all([
      this.getNodeBackendHealth(),
      this.getPythonBackendHealth(),
    ]);

    return {
      node: {
        status: nodeHealth ? 'healthy' : 'unhealthy',
        ...nodeHealth,
      },
      python: {
        status: pythonHealth ? 'healthy' : 'unhealthy',
        ...pythonHealth,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

export default new MetricsService();
