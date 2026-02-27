// lib/backend-client.ts
import axios, { AxiosInstance, AxiosResponse } from 'axios';

export interface PredictionResponse {
  symbol: string;
  predicted_price: number;
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  timestamp: string;
  model_version: string;
  cached: boolean;
}

export interface BatchPredictionResponse {
  predictions: PredictionResponse[];
  total: number;
  successful: number;
  failed: number;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
  models_loaded: boolean;
}

export interface MetricsResponse {
  total_requests: number;
  successful_predictions: number;
  failed_predictions: number;
  cache_hit_rate: number;
  average_response_time: number;
  uptime: number;
}

class BackendClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_STOCK_AI_BACKEND_URL || 'http://localhost:8000';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // 30 seconds timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for API key if available
    this.client.interceptors.request.use((config) => {
      const apiKey = process.env.STOCK_AI_BACKEND_API_KEY;
      if (apiKey) {
        config.headers['X-API-Key'] = apiKey;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Backend API Error:', error.response?.data || error.message);
        throw error;
      }
    );
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await this.client.get<HealthResponse>('/health');
      return response.data.status === 'healthy';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  async getHealth(): Promise<HealthResponse> {
    const response = await this.client.get<HealthResponse>('/health');
    return response.data;
  }

  async getMetrics(): Promise<MetricsResponse> {
    const response = await this.client.get<MetricsResponse>('/metrics');
    return response.data;
  }

  async getPrediction(symbol: string): Promise<PredictionResponse> {
    const response = await this.client.get<PredictionResponse>(
      `/api/v1/predict?symbol=${encodeURIComponent(symbol.toUpperCase())}`
    );
    return response.data;
  }

  async getBatchPredictions(symbols: string[]): Promise<BatchPredictionResponse> {
    const response = await this.client.post<BatchPredictionResponse>(
      '/api/v1/predict/batch',
      { symbols: symbols.map(s => s.toUpperCase()) }
    );
    return response.data;
  }

  // Utility method to check if backend is available
  async checkConnection(): Promise<{ available: boolean; latency?: number; error?: string }> {
    const startTime = Date.now();
    try {
      await this.isHealthy();
      const latency = Date.now() - startTime;
      return { available: true, latency };
    } catch (error) {
      return { 
        available: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

// Export singleton instance
export const backendClient = new BackendClient();