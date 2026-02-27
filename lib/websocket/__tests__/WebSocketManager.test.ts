/**
 * @jest-environment jsdom
 */

import { WebSocketManager, MarketDataMessage } from '../WebSocketManager';
import { validateLatency, calculateConnectionQuality, formatLatency } from '../utils';

// Mock WebSocket for testing
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(public url: string) {
    // Simulate connection delay
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 100);
  }

  send(data: string) {
    console.log('Mock WebSocket send:', data);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }
}

// Mock global WebSocket
(global as any).WebSocket = MockWebSocket;

describe('WebSocketManager', () => {
  let wsManager: WebSocketManager;

  beforeEach(() => {
    wsManager = new WebSocketManager({
      url: 'ws://localhost:8080/test',
      reconnectInterval: 1000,
      maxReconnectAttempts: 3,
      heartbeatInterval: 5000,
      connectionTimeout: 2000
    });
  });

  afterEach(() => {
    wsManager.disconnect();
  });

  test('should initialize with correct default status', () => {
    expect(wsManager.getConnectionStatus()).toBe('disconnected');
    expect(wsManager.isConnected()).toBe(false);
    expect(wsManager.getSubscribedSymbols()).toEqual([]);
  });

  test('should connect successfully', async () => {
    const connectPromise = wsManager.connect();
    
    // Should change status to connecting
    expect(wsManager.getConnectionStatus()).toBe('connecting');
    
    await connectPromise;
    
    // Should be connected after successful connection
    expect(wsManager.getConnectionStatus()).toBe('connected');
    expect(wsManager.isConnected()).toBe(true);
  });

  test('should handle symbol subscription', async () => {
    await wsManager.connect();
    
    const symbols = ['AAPL', 'MSFT', 'GOOGL'];
    wsManager.subscribe(symbols);
    
    const subscribedSymbols = wsManager.getSubscribedSymbols();
    expect(subscribedSymbols).toEqual(symbols);
  });

  test('should handle symbol unsubscription', async () => {
    await wsManager.connect();
    
    wsManager.subscribe(['AAPL', 'MSFT', 'GOOGL']);
    wsManager.unsubscribe(['MSFT']);
    
    const subscribedSymbols = wsManager.getSubscribedSymbols();
    expect(subscribedSymbols).toEqual(['AAPL', 'GOOGL']);
  });

  test('should emit events correctly', async () => {
    const connectedHandler = jest.fn();
    const statusChangeHandler = jest.fn();
    
    wsManager.on('connected', connectedHandler);
    wsManager.on('statusChange', statusChangeHandler);
    
    await wsManager.connect();
    
    expect(connectedHandler).toHaveBeenCalled();
    expect(statusChangeHandler).toHaveBeenCalledWith('connecting');
    expect(statusChangeHandler).toHaveBeenCalledWith('connected');
  });

  test('should disconnect properly', async () => {
    await wsManager.connect();
    expect(wsManager.isConnected()).toBe(true);
    
    wsManager.disconnect();
    expect(wsManager.getConnectionStatus()).toBe('disconnected');
    expect(wsManager.isConnected()).toBe(false);
  });
});

describe('WebSocket Utils', () => {
  test('validateLatency should work correctly', () => {
    const message: MarketDataMessage = {
      type: 'tick',
      symbol: 'AAPL',
      price: 150.00,
      timestamp: Date.now() - 50 // 50ms ago
    };
    
    expect(validateLatency(message, 200)).toBe(true);
    expect(validateLatency(message, 25)).toBe(false);
  });

  test('formatLatency should format correctly', () => {
    expect(formatLatency(0.5)).toBe('<1ms');
    expect(formatLatency(50)).toBe('50ms');
    expect(formatLatency(1500)).toBe('1.5s');
  });

  test('calculateConnectionQuality should return correct quality', () => {
    const excellentMetrics = {
      connectionTime: Date.now(),
      reconnectCount: 0,
      totalMessages: 1000,
      latency: {
        current: 25,
        average: 30,
        min: 20,
        max: 50,
        samples: [25, 30, 35]
      },
      uptime: 24 * 60 * 60 * 1000 // 24 hours
    };
    
    expect(calculateConnectionQuality(excellentMetrics)).toBe('excellent');
    
    const poorMetrics = {
      ...excellentMetrics,
      reconnectCount: 10,
      latency: {
        ...excellentMetrics.latency,
        average: 500
      },
      uptime: 60 * 1000 // 1 minute
    };
    
    expect(calculateConnectionQuality(poorMetrics)).toBe('poor');
  });
});