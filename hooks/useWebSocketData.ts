'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getWebSocketManager, MarketDataMessage, ConnectionStatus } from '@/lib/websocket/WebSocketManager';

interface WebSocketStockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  bid?: number;
  ask?: number;
  spread?: number;
  marketCap?: number;
  timestamp: number;
  latency?: number;
}

interface UseWebSocketDataProps {
  symbols: string[];
  enabled?: boolean;
  fallbackToHttp?: boolean;
  maxLatency?: number;
}

interface UseWebSocketDataReturn {
  data: Record<string, WebSocketStockData>;
  loading: boolean;
  error: string | null;
  connectionStatus: ConnectionStatus;
  latency: number;
  lastUpdated: Date | null;
  reconnect: () => void;
  isRealTime: boolean;
}

export function useWebSocketData({
  symbols,
  enabled = true,
  fallbackToHttp = true,
  maxLatency = 200
}: UseWebSocketDataProps): UseWebSocketDataReturn {
  const [data, setData] = useState<Record<string, WebSocketStockData>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [latency, setLatency] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRealTime, setIsRealTime] = useState(false);
  
  const wsManager = useRef(getWebSocketManager());
  const httpFallbackTimer = useRef<NodeJS.Timeout | null>(null);
  const previousCloseRef = useRef<Record<string, number>>({});

  // Initialize previous close prices from existing data
  useEffect(() => {
    symbols.forEach(symbol => {
      if (data[symbol] && !previousCloseRef.current[symbol]) {
        previousCloseRef.current[symbol] = data[symbol].price;
      }
    });
  }, [symbols, data]);

  const handleMessage = useCallback((message: MarketDataMessage) => {
    const messageLatency = Date.now() - message.timestamp;
    
    // Check latency requirement
    if (messageLatency > maxLatency) {
      console.warn(`High latency: ${messageLatency}ms for ${message.symbol}`);
    }

    setData(prevData => {
      const currentData = prevData[message.symbol];
      const previousClose = previousCloseRef.current[message.symbol] || message.price;
      
      const change = message.price - previousClose;
      const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

      const updatedStock: WebSocketStockData = {
        symbol: message.symbol,
        name: getCompanyName(message.symbol),
        price: message.price,
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2)),
        volume: message.volume || (currentData?.volume || 0),
        high: Math.max(message.price, currentData?.high || message.price),
        low: Math.min(message.price, currentData?.low || message.price),
        open: currentData?.open || message.price,
        previousClose,
        bid: message.bid,
        ask: message.ask,
        spread: message.spread,
        marketCap: currentData?.marketCap,
        timestamp: message.timestamp,
        latency: messageLatency
      };

      return {
        ...prevData,
        [message.symbol]: updatedStock
      };
    });

    setLatency(messageLatency);
    setLastUpdated(new Date());
    setIsRealTime(true);
  }, [maxLatency]);

  const handleStatusChange = useCallback((status: ConnectionStatus) => {
    setConnectionStatus(status);
    
    if (status === 'connected') {
      setError(null);
      setIsRealTime(true);
      // Clear any HTTP fallback timer when WebSocket connects
      if (httpFallbackTimer.current) {
        clearInterval(httpFallbackTimer.current);
        httpFallbackTimer.current = null;
      }
    } else if (status === 'disconnected' && fallbackToHttp) {
      setIsRealTime(false);
      startHttpFallback();
    }
  }, [fallbackToHttp]);

  const handleError = useCallback((wsError: Error) => {
    setError(wsError.message);
    if (fallbackToHttp) {
      setIsRealTime(false);
      startHttpFallback();
    }
  }, [fallbackToHttp]);

  const startHttpFallback = useCallback(() => {
    if (httpFallbackTimer.current) return;

    console.log('Starting HTTP fallback for real-time data');
    
    const fetchHttpData = async () => {
      try {
        const symbolsParam = symbols.join(',');
        const response = await fetch(`/api/live-data?type=stocks&symbols=${symbolsParam}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.data && Array.isArray(result.data)) {
          const newData: Record<string, WebSocketStockData> = {};
          result.data.forEach((stock: any) => {
            // Store previous close for change calculation
            if (!previousCloseRef.current[stock.symbol]) {
              previousCloseRef.current[stock.symbol] = stock.previousClose || stock.price;
            }

            newData[stock.symbol] = {
              ...stock,
              latency: 0, // HTTP doesn't have real-time latency
              timestamp: Date.now()
            };
          });
          
          setData(newData);
          setLastUpdated(new Date());
          setError(null);
        }
      } catch (err) {
        console.error('HTTP fallback error:', err);
        setError(err instanceof Error ? err.message : 'HTTP fallback failed');
      }
    };

    // Initial fetch
    fetchHttpData();
    
    // Set up polling interval (30 seconds for HTTP fallback)
    httpFallbackTimer.current = setInterval(fetchHttpData, 30000);
  }, [symbols]);

  const reconnect = useCallback(() => {
    wsManager.current.disconnect();
    wsManager.current.connect();
  }, []);

  // Set up WebSocket connection and event listeners
  useEffect(() => {
    if (!enabled || symbols.length === 0) return;

    const ws = wsManager.current;
    
    // Set up event listeners
    ws.on('message', handleMessage);
    ws.on('statusChange', handleStatusChange);
    ws.on('error', handleError);

    // Connect and subscribe
    const initializeConnection = async () => {
      setLoading(true);
      try {
        await ws.connect();
        ws.subscribe(symbols);
      } catch (err) {
        console.error('Failed to initialize WebSocket connection:', err);
        if (fallbackToHttp) {
          startHttpFallback();
        }
      } finally {
        setLoading(false);
      }
    };

    initializeConnection();

    // Cleanup function
    return () => {
      ws.off('message', handleMessage);
      ws.off('statusChange', handleStatusChange);
      ws.off('error', handleError);
      
      if (httpFallbackTimer.current) {
        clearInterval(httpFallbackTimer.current);
        httpFallbackTimer.current = null;
      }
    };
  }, [symbols, enabled, handleMessage, handleStatusChange, handleError, fallbackToHttp, startHttpFallback]);

  // Update subscriptions when symbols change
  useEffect(() => {
    if (!enabled || symbols.length === 0) return;

    const ws = wsManager.current;
    if (ws.isConnected()) {
      // Get current subscriptions
      const currentSymbols = ws.getSubscribedSymbols();
      
      // Find symbols to add and remove
      const symbolsToAdd = symbols.filter(s => !currentSymbols.includes(s.toUpperCase()));
      const symbolsToRemove = currentSymbols.filter(s => !symbols.map(sym => sym.toUpperCase()).includes(s));
      
      if (symbolsToAdd.length > 0) {
        ws.subscribe(symbolsToAdd);
      }
      
      if (symbolsToRemove.length > 0) {
        ws.unsubscribe(symbolsToRemove);
      }
    }
  }, [symbols, enabled]);

  return {
    data,
    loading,
    error,
    connectionStatus,
    latency,
    lastUpdated,
    reconnect,
    isRealTime
  };
}

// Enhanced hook for single stock with WebSocket support
export function useWebSocketStock(symbol: string, enabled = true) {
  const { data, loading, error, connectionStatus, latency, lastUpdated, reconnect, isRealTime } = useWebSocketData({
    symbols: symbol ? [symbol] : [],
    enabled: enabled && !!symbol
  });

  return {
    data: data[symbol] || null,
    loading,
    error,
    connectionStatus,
    latency,
    lastUpdated,
    reconnect,
    isRealTime
  };
}

// Helper function to get company names
function getCompanyName(symbol: string): string {
  const companies: { [key: string]: string } = {
    'NVDA': 'NVIDIA Corp',
    'AAPL': 'Apple Inc',
    'MSFT': 'Microsoft Corp',
    'GOOGL': 'Alphabet Inc',
    'TSLA': 'Tesla Inc',
    'AMZN': 'Amazon.com Inc',
    'META': 'Meta Platforms',
    'NFLX': 'Netflix Inc',
    'AMD': 'Advanced Micro Devices',
    'INTC': 'Intel Corp',
    'JPM': 'JPMorgan Chase',
    'V': 'Visa Inc',
    'JNJ': 'Johnson & Johnson',
    'WMT': 'Walmart Inc',
    'PG': 'Procter & Gamble'
  };
  return companies[symbol] || symbol;
}