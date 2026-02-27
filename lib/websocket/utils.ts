import { MarketDataMessage, ConnectionMetrics, LatencyMetrics } from '@/lib/types/websocket';

/**
 * Validates if a WebSocket message meets latency requirements
 */
export function validateLatency(message: MarketDataMessage, maxLatency = 200): boolean {
  const latency = Date.now() - message.timestamp;
  return latency <= maxLatency;
}

/**
 * Calculates connection quality based on latency and reliability
 */
export function calculateConnectionQuality(metrics: ConnectionMetrics): 'excellent' | 'good' | 'fair' | 'poor' {
  const { latency, reconnectCount, uptime } = metrics;
  
  // Calculate uptime percentage (assuming 24 hours as baseline)
  const uptimePercentage = Math.min(uptime / (24 * 60 * 60 * 1000), 1);
  
  // Quality scoring
  let score = 100;
  
  // Latency penalty
  if (latency.average > 200) score -= 30;
  else if (latency.average > 100) score -= 15;
  else if (latency.average > 50) score -= 5;
  
  // Reconnection penalty
  score -= Math.min(reconnectCount * 10, 40);
  
  // Uptime bonus/penalty
  score *= uptimePercentage;
  
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 50) return 'fair';
  return 'poor';
}

/**
 * Formats latency for display
 */
export function formatLatency(latency: number): string {
  if (latency < 1) return '<1ms';
  if (latency < 1000) return `${Math.round(latency)}ms`;
  return `${(latency / 1000).toFixed(1)}s`;
}

/**
 * Formats connection uptime for display
 */
export function formatUptime(uptime: number): string {
  const seconds = Math.floor(uptime / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * Creates a mock market data message for testing
 */
export function createMockMessage(symbol: string, basePrice = 100): MarketDataMessage {
  const price = basePrice + (Math.random() - 0.5) * 2;
  const bid = price - 0.01;
  const ask = price + 0.01;
  
  return {
    type: 'tick',
    symbol: symbol.toUpperCase(),
    price: parseFloat(price.toFixed(2)),
    volume: Math.floor(Math.random() * 10000) + 1000,
    timestamp: Date.now(),
    bid: parseFloat(bid.toFixed(2)),
    ask: parseFloat(ask.toFixed(2)),
    spread: parseFloat((ask - bid).toFixed(3))
  };
}

/**
 * Calculates moving average for latency metrics
 */
export function updateLatencyMetrics(
  current: LatencyMetrics, 
  newLatency: number, 
  maxSamples = 100
): LatencyMetrics {
  const samples = [...current.samples, newLatency];
  
  // Keep only the most recent samples
  if (samples.length > maxSamples) {
    samples.splice(0, samples.length - maxSamples);
  }
  
  const average = samples.reduce((sum, val) => sum + val, 0) / samples.length;
  const min = Math.min(current.min, newLatency);
  const max = Math.max(current.max, newLatency);
  
  return {
    current: newLatency,
    average: parseFloat(average.toFixed(2)),
    min,
    max,
    samples
  };
}

/**
 * Determines if reconnection should be attempted based on error type
 */
export function shouldReconnect(error: Event | Error, attemptCount: number, maxAttempts: number): boolean {
  if (attemptCount >= maxAttempts) return false;
  
  // Don't reconnect for certain error types
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('unauthorized') || message.includes('forbidden')) {
      return false;
    }
  }
  
  return true;
}

/**
 * Calculates exponential backoff delay for reconnection
 */
export function calculateBackoffDelay(
  attemptCount: number, 
  baseDelay = 1000, 
  maxDelay = 30000,
  jitter = true
): number {
  const exponentialDelay = Math.min(baseDelay * Math.pow(2, attemptCount), maxDelay);
  
  if (jitter) {
    // Add random jitter to prevent thundering herd
    const jitterAmount = exponentialDelay * 0.1;
    return exponentialDelay + (Math.random() - 0.5) * jitterAmount;
  }
  
  return exponentialDelay;
}

/**
 * Validates WebSocket URL format
 */
export function validateWebSocketUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'ws:' || parsed.protocol === 'wss:';
  } catch {
    return false;
  }
}

/**
 * Gets appropriate WebSocket protocol based on current page protocol
 */
export function getWebSocketProtocol(): 'ws:' | 'wss:' {
  if (typeof window !== 'undefined') {
    return window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  }
  return 'ws:';
}