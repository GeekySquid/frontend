'use client';

import { EventEmitter } from 'events';

export interface MarketDataMessage {
  type: 'tick' | 'quote' | 'trade';
  symbol: string;
  price: number;
  volume?: number;
  timestamp: number;
  bid?: number;
  ask?: number;
  spread?: number;
}

export interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  connectionTimeout: number;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting' | 'connecting';

export class WebSocketManager extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private subscribedSymbols: Set<string> = new Set();
  private connectionStatus: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private connectionTimer: NodeJS.Timeout | null = null;
  private lastMessageTime = 0;
  private connectionStartTime = 0;

  constructor(config: Partial<WebSocketConfig> = {}) {
    super();
    
    this.config = {
      url: config.url || this.getWebSocketUrl(),
      reconnectInterval: config.reconnectInterval || 3000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      heartbeatInterval: config.heartbeatInterval || 30000,
      connectionTimeout: config.connectionTimeout || 10000,
    };
  }

  private getWebSocketUrl(): string {
    // Use environment variable or fallback to mock WebSocket server
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (wsUrl) {
      return wsUrl;
    }
    
    // For development, we'll simulate WebSocket with a mock server
    // Check if window is available (client-side)
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      return `${protocol}//${host}/api/ws/market-data`;
    }
    
    // Fallback for server-side rendering
    return 'ws://localhost:3000/api/ws/market-data';
  }

  async connect(): Promise<void> {
    if (this.connectionStatus === 'connected' || this.connectionStatus === 'connecting') {
      return;
    }

    this.connectionStatus = 'connecting';
    this.connectionStartTime = Date.now();
    this.emit('statusChange', this.connectionStatus);

    try {
      // For now, we'll simulate WebSocket connection since we don't have a real WebSocket server
      // In production, this would connect to a real WebSocket endpoint
      await this.simulateConnection();
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.handleConnectionError();
    }
  }

  private async simulateConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Simulate connection delay
      this.connectionTimer = setTimeout(() => {
        try {
          // Create a mock WebSocket-like object for development
          this.ws = this.createMockWebSocket();
          this.onConnectionOpen();
          resolve();
        } catch (error) {
          reject(error);
        }
      }, 100 + Math.random() * 200); // Simulate 100-300ms connection time
    });
  }

  private createMockWebSocket(): any {
    // Mock WebSocket for development - simulates real WebSocket behavior
    const mockWs = {
      readyState: 1, // OPEN
      send: (data: string) => {
        console.log('Mock WebSocket send:', data);
      },
      close: () => {
        console.log('Mock WebSocket close');
        this.onConnectionClose();
      }
    };

    // Start sending mock market data
    this.startMockDataStream();
    
    return mockWs;
  }

  private startMockDataStream(): void {
    // Simulate real-time market data updates
    const sendMockData = () => {
      if (this.connectionStatus !== 'connected') return;

      this.subscribedSymbols.forEach(symbol => {
        const mockMessage: MarketDataMessage = {
          type: 'tick',
          symbol,
          price: this.generateMockPrice(symbol),
          volume: Math.floor(Math.random() * 10000) + 1000,
          timestamp: Date.now(),
          bid: 0,
          ask: 0,
        };
        
        // Add bid/ask spread
        mockMessage.bid = mockMessage.price - 0.01;
        mockMessage.ask = mockMessage.price + 0.01;
        mockMessage.spread = mockMessage.ask - mockMessage.bid;

        this.onMessage(mockMessage);
      });

      // Schedule next update with realistic frequency (50-200ms for active trading)
      const nextUpdate = 50 + Math.random() * 150;
      setTimeout(sendMockData, nextUpdate);
    };

    // Start the mock data stream
    setTimeout(sendMockData, 1000);
  }

  private generateMockPrice(symbol: string): number {
    // Generate realistic price movements based on symbol
    const basePrices: { [key: string]: number } = {
      'AAPL': 175.50,
      'MSFT': 380.25,
      'GOOGL': 140.75,
      'TSLA': 245.80,
      'NVDA': 485.30,
      'AMZN': 155.90,
      'META': 325.40,
    };

    const basePrice = basePrices[symbol] || 100;
    
    // Simulate realistic price movement (±0.1% typical tick)
    const maxChange = basePrice * 0.001; // 0.1% max change per tick
    const change = (Math.random() - 0.5) * 2 * maxChange;
    
    return Math.max(0.01, basePrice + change);
  }

  private onConnectionOpen(): void {
    this.connectionStatus = 'connected';
    this.reconnectAttempts = 0;
    this.lastMessageTime = Date.now();
    
    const latency = Date.now() - this.connectionStartTime;
    console.log(`WebSocket connected with ${latency}ms latency`);
    
    this.emit('statusChange', this.connectionStatus);
    this.emit('connected', { latency });
    
    this.startHeartbeat();
    
    // Re-subscribe to symbols if we were previously subscribed
    if (this.subscribedSymbols.size > 0) {
      this.resubscribeSymbols();
    }
  }

  private onConnectionClose(): void {
    this.connectionStatus = 'disconnected';
    this.emit('statusChange', this.connectionStatus);
    this.emit('disconnected');
    
    this.stopHeartbeat();
    
    if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.scheduleReconnect();
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('error', new Error('Max reconnection attempts reached'));
    }
  }

  private onMessage(message: MarketDataMessage): void {
    this.lastMessageTime = Date.now();
    
    // Validate message latency requirement (<200ms)
    const latency = Date.now() - message.timestamp;
    if (latency > 200) {
      console.warn(`High latency detected: ${latency}ms for ${message.symbol}`);
    }
    
    this.emit('message', message);
    this.emit(`data:${message.symbol}`, message);
  }

  private handleConnectionError(): void {
    this.connectionStatus = 'disconnected';
    this.emit('statusChange', this.connectionStatus);
    this.emit('error', new Error('Connection failed'));
    
    if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.connectionStatus = 'reconnecting';
    this.emit('statusChange', this.connectionStatus);
    
    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts),
      30000 // Max 30 seconds
    );
    
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.connectionStatus === 'connected') {
        // Check if we've received messages recently
        const timeSinceLastMessage = Date.now() - this.lastMessageTime;
        
        if (timeSinceLastMessage > this.config.heartbeatInterval * 2) {
          console.warn('No messages received, connection may be stale');
          this.disconnect();
          this.connect();
        }
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private resubscribeSymbols(): void {
    const symbols = Array.from(this.subscribedSymbols);
    this.subscribedSymbols.clear();
    this.subscribe(symbols);
  }

  subscribe(symbols: string[]): void {
    symbols.forEach(symbol => {
      this.subscribedSymbols.add(symbol.toUpperCase());
    });

    if (this.ws && this.connectionStatus === 'connected') {
      const message = {
        action: 'subscribe',
        symbols: symbols.map(s => s.toUpperCase())
      };
      
      this.ws.send(JSON.stringify(message));
      console.log(`Subscribed to symbols: ${symbols.join(', ')}`);
    }
  }

  unsubscribe(symbols: string[]): void {
    symbols.forEach(symbol => {
      this.subscribedSymbols.delete(symbol.toUpperCase());
    });

    if (this.ws && this.connectionStatus === 'connected') {
      const message = {
        action: 'unsubscribe',
        symbols: symbols.map(s => s.toUpperCase())
      };
      
      this.ws.send(JSON.stringify(message));
      console.log(`Unsubscribed from symbols: ${symbols.join(', ')}`);
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }
    
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.connectionStatus = 'disconnected';
    this.emit('statusChange', this.connectionStatus);
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  getSubscribedSymbols(): string[] {
    return Array.from(this.subscribedSymbols);
  }

  isConnected(): boolean {
    return this.connectionStatus === 'connected';
  }

  getLatency(): number {
    if (!this.lastMessageTime) return 0;
    return Date.now() - this.lastMessageTime;
  }
}

// Singleton instance for global use
let wsManagerInstance: WebSocketManager | null = null;

export function getWebSocketManager(): WebSocketManager {
  if (!wsManagerInstance) {
    wsManagerInstance = new WebSocketManager();
  }
  return wsManagerInstance;
}