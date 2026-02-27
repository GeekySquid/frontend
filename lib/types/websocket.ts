export interface MarketDataMessage {
  type: 'tick' | 'quote' | 'trade' | 'heartbeat';
  symbol: string;
  price: number;
  volume?: number;
  timestamp: number;
  bid?: number;
  ask?: number;
  spread?: number;
  high?: number;
  low?: number;
  open?: number;
  previousClose?: number;
}

export interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  connectionTimeout: number;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting' | 'connecting';

export interface WebSocketSubscription {
  action: 'subscribe' | 'unsubscribe';
  symbols: string[];
}

export interface WebSocketResponse {
  success: boolean;
  message?: string;
  data?: any;
  timestamp: number;
}

export interface LatencyMetrics {
  current: number;
  average: number;
  min: number;
  max: number;
  samples: number[];
}

export interface ConnectionMetrics {
  connectionTime: number;
  reconnectCount: number;
  totalMessages: number;
  latency: LatencyMetrics;
  uptime: number;
}