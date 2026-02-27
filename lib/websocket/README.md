# WebSocket Market Data Manager

A robust WebSocket manager for real-time market data with automatic reconnection, latency monitoring, and HTTP fallback capabilities.

## Features

- **Sub-200ms Latency**: Optimized for high-frequency trading requirements
- **Automatic Reconnection**: Exponential backoff with configurable retry limits
- **HTTP Fallback**: Seamless fallback to HTTP polling when WebSocket fails
- **Connection Monitoring**: Real-time latency and connection quality metrics
- **Symbol Management**: Dynamic subscription/unsubscription of market symbols
- **TypeScript Support**: Full type safety and IntelliSense support

## Quick Start

### Basic Usage

```typescript
import { useWebSocketData } from '@/hooks/useWebSocketData';

function MarketData() {
  const { data, connectionStatus, latency, isRealTime } = useWebSocketData({
    symbols: ['AAPL', 'MSFT', 'GOOGL'],
    enabled: true,
    fallbackToHttp: true
  });

  return (
    <div>
      <div>Status: {connectionStatus}</div>
      <div>Latency: {latency}ms</div>
      <div>Real-time: {isRealTime ? 'Yes' : 'No'}</div>
      
      {Object.values(data).map(stock => (
        <div key={stock.symbol}>
          {stock.symbol}: ${stock.price} ({stock.changePercent}%)
        </div>
      ))}
    </div>
  );
}
```

### Single Stock

```typescript
import { useWebSocketStock } from '@/hooks/useWebSocketData';

function SingleStock() {
  const { data, connectionStatus, latency } = useWebSocketStock('AAPL');

  if (!data) return <div>Loading...</div>;

  return (
    <div>
      <h2>{data.symbol} - {data.name}</h2>
      <div>${data.price}</div>
      <div>{data.change} ({data.changePercent}%)</div>
      <div>Latency: {latency}ms</div>
    </div>
  );
}
```

### Enhanced useRealTimeData Hook

The existing `useRealTimeData` hook has been enhanced with WebSocket support while maintaining backward compatibility:

```typescript
import { useRealTimeData } from '@/hooks/useRealTimeData';

function EnhancedMarketData() {
  const { data, connectionStatus, latency, isRealTime } = useRealTimeData({
    symbols: ['AAPL', 'MSFT'],
    useWebSocket: true, // Enable WebSocket mode
    refreshInterval: 30000 // Fallback HTTP interval
  });

  return (
    <div>
      <div>Mode: {isRealTime ? 'WebSocket' : 'HTTP'}</div>
      <div>Status: {connectionStatus}</div>
      {/* ... render data */}
    </div>
  );
}
```

## Configuration

### WebSocket Manager Configuration

```typescript
import { WebSocketManager } from '@/lib/websocket/WebSocketManager';

const wsManager = new WebSocketManager({
  url: 'wss://api.example.com/market-data',
  reconnectInterval: 3000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000,
  connectionTimeout: 10000
});
```

### Environment Variables

```env
# WebSocket endpoint URL
NEXT_PUBLIC_WS_URL=wss://api.example.com/market-data

# Fallback HTTP API settings
ALPHA_VANTAGE_API_KEY=your_api_key
STEADY_API_KEY=your_api_key
```

## API Reference

### WebSocketManager Class

#### Methods

- `connect()`: Establish WebSocket connection
- `disconnect()`: Close WebSocket connection
- `subscribe(symbols: string[])`: Subscribe to market data for symbols
- `unsubscribe(symbols: string[])`: Unsubscribe from symbols
- `getConnectionStatus()`: Get current connection status
- `isConnected()`: Check if currently connected
- `getLatency()`: Get current connection latency

#### Events

- `connected`: Fired when connection is established
- `disconnected`: Fired when connection is lost
- `message`: Fired when market data is received
- `error`: Fired when an error occurs
- `statusChange`: Fired when connection status changes

### useWebSocketData Hook

#### Parameters

```typescript
interface UseWebSocketDataProps {
  symbols: string[];           // Stock symbols to subscribe to
  enabled?: boolean;           // Enable/disable the hook
  fallbackToHttp?: boolean;    // Enable HTTP fallback
  maxLatency?: number;         // Maximum acceptable latency (ms)
}
```

#### Returns

```typescript
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
```

### Market Data Message Format

```typescript
interface MarketDataMessage {
  type: 'tick' | 'quote' | 'trade';
  symbol: string;
  price: number;
  volume?: number;
  timestamp: number;
  bid?: number;
  ask?: number;
  spread?: number;
}
```

## Connection Management

### Automatic Reconnection

The WebSocket manager implements intelligent reconnection with:

- **Exponential Backoff**: Delays increase exponentially with each failed attempt
- **Jitter**: Random delays prevent thundering herd problems
- **Maximum Attempts**: Configurable limit to prevent infinite reconnection
- **Connection Quality**: Monitors and reports connection health

### Latency Monitoring

- **Real-time Tracking**: Measures message latency continuously
- **Quality Metrics**: Calculates connection quality scores
- **Alerts**: Warns when latency exceeds thresholds
- **Historical Data**: Maintains latency statistics

### HTTP Fallback

When WebSocket connection fails:

1. Automatically switches to HTTP polling
2. Maintains same data interface
3. Continues attempting WebSocket reconnection
4. Seamlessly switches back when WebSocket recovers

## Development Mode

In development, the WebSocket manager uses a mock WebSocket server that:

- Simulates realistic market data
- Provides configurable latency
- Supports all WebSocket operations
- Enables testing without external dependencies

## Production Deployment

For production use:

1. Set `NEXT_PUBLIC_WS_URL` to your WebSocket endpoint
2. Ensure WebSocket server supports the message format
3. Configure appropriate CORS settings
4. Set up monitoring and alerting
5. Test failover scenarios

## Performance Considerations

- **Message Frequency**: Optimized for high-frequency updates (50-200ms intervals)
- **Memory Management**: Automatic cleanup of old data and event listeners
- **CPU Usage**: Efficient event handling and data processing
- **Network Usage**: Minimal overhead with binary message support

## Troubleshooting

### Common Issues

1. **High Latency**: Check network conditions and server performance
2. **Connection Drops**: Verify WebSocket server stability
3. **No Data**: Ensure symbols are properly subscribed
4. **Memory Leaks**: Check for proper cleanup of event listeners

### Debug Mode

Enable debug logging:

```typescript
// In browser console
localStorage.setItem('debug', 'websocket:*');
```

### Connection Quality

Monitor connection quality:

```typescript
import { calculateConnectionQuality } from '@/lib/websocket/utils';

const quality = calculateConnectionQuality(metrics);
console.log('Connection quality:', quality); // 'excellent' | 'good' | 'fair' | 'poor'
```

## Testing

### Unit Tests

```bash
npm test -- websocket
```

### Integration Tests

```bash
npm run test:integration -- websocket
```

### Load Testing

```bash
npm run test:load -- --symbols=100 --duration=60s
```

## Contributing

1. Follow TypeScript best practices
2. Add tests for new features
3. Update documentation
4. Ensure backward compatibility
5. Test with multiple symbols and scenarios

## License

MIT License - see LICENSE file for details