'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWebSocketData } from './useWebSocketData';

interface StockData {
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
  marketCap?: number;
  timestamp: number;
}

interface UseRealTimeDataProps {
  symbols: string[];
  refreshInterval?: number; // in milliseconds
  enabled?: boolean;
  useWebSocket?: boolean; // New option to enable WebSocket
}

interface UseRealTimeDataReturn {
  data: Record<string, StockData>;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
  connectionStatus?: string; // WebSocket connection status
  latency?: number; // WebSocket latency
  isRealTime?: boolean; // Whether using real-time WebSocket data
}

export function useRealTimeData({
  symbols,
  refreshInterval = 30000, // 30 seconds default
  enabled = true,
  useWebSocket = false // Default to HTTP for backward compatibility
}: UseRealTimeDataProps): UseRealTimeDataReturn {
  // Use WebSocket data if enabled
  const webSocketData = useWebSocketData({
    symbols,
    enabled: enabled && useWebSocket,
    fallbackToHttp: true
  });

  // HTTP-based data (original implementation)
  const [data, setData] = useState<Record<string, StockData>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled || symbols.length === 0 || useWebSocket) return;

    setLoading(true);
    setError(null);

    try {
      const symbolsParam = symbols.join(',');
      const response = await fetch(`/api/live-data?type=stocks&symbols=${symbolsParam}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.data && Array.isArray(result.data)) {
        const newData: Record<string, StockData> = {};
        result.data.forEach((stock: StockData) => {
          newData[stock.symbol] = stock;
        });
        setData(newData);
        setLastUpdated(new Date());
      } else {
        throw new Error('Invalid data format received');
      }
    } catch (err) {
      console.error('Error fetching real-time data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [symbols, enabled, useWebSocket]);

  // Initial fetch for HTTP mode
  useEffect(() => {
    if (!useWebSocket) {
      fetchData();
    }
  }, [fetchData, useWebSocket]);

  // Set up interval for real-time updates (HTTP mode only)
  useEffect(() => {
    if (!enabled || refreshInterval <= 0 || useWebSocket) return;

    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval, enabled, useWebSocket]);

  const refresh = useCallback(() => {
    if (useWebSocket) {
      webSocketData.reconnect();
    } else {
      fetchData();
    }
  }, [fetchData, useWebSocket, webSocketData]);

  // Return WebSocket data if enabled, otherwise HTTP data
  if (useWebSocket) {
    return {
      data: webSocketData.data,
      loading: webSocketData.loading,
      error: webSocketData.error,
      lastUpdated: webSocketData.lastUpdated,
      refresh,
      connectionStatus: webSocketData.connectionStatus,
      latency: webSocketData.latency,
      isRealTime: webSocketData.isRealTime
    };
  }

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh
  };
}

// Hook for single stock
export function useStockData(symbol: string, refreshInterval?: number, useWebSocket = false) {
  const { data, loading, error, lastUpdated, refresh, connectionStatus, latency, isRealTime } = useRealTimeData({
    symbols: [symbol],
    refreshInterval,
    enabled: !!symbol,
    useWebSocket
  });

  return {
    data: data[symbol] || null,
    loading,
    error,
    lastUpdated,
    refresh,
    connectionStatus,
    latency,
    isRealTime
  };
}

// Hook for market indices
export function useMarketIndices(refreshInterval = 60000) { // 1 minute for indices
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchIndices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/live-data?type=indices');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.data && Array.isArray(result.data)) {
        setData(result.data);
        setLastUpdated(new Date());
      } else {
        throw new Error('Invalid indices data format');
      }
    } catch (err) {
      console.error('Error fetching market indices:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch indices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIndices();
  }, [fetchIndices]);

  useEffect(() => {
    if (refreshInterval <= 0) return;

    const interval = setInterval(fetchIndices, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchIndices, refreshInterval]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh: fetchIndices
  };
}