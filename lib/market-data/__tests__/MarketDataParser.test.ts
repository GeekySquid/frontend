/**
 * Market Data Parser Tests
 * 
 * Tests for the MarketDataParser class to ensure robust parsing
 * and error handling capabilities.
 */

import { MarketDataParser, ParsedMarketData } from '../MarketDataParser';

describe('MarketDataParser', () => {
  let parser: MarketDataParser;

  beforeEach(() => {
    parser = new MarketDataParser();
  });

  describe('Basic Parsing', () => {
    it('should parse valid market data message', () => {
      const rawData = {
        type: 'tick',
        symbol: 'AAPL',
        price: 175.50,
        timestamp: Date.now(),
      };

      const result = parser.parse(rawData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.type).toBe('tick');
      expect(result.data!.symbol).toBe('AAPL');
      expect(result.data!.price).toBe(175.50);
      expect(result.data!.timestamp).toBe(rawData.timestamp);
    });

    it('should parse JSON string input', () => {
      const rawData = JSON.stringify({
        type: 'quote',
        symbol: 'MSFT',
        price: 380.25,
        timestamp: Date.now(),
        bid: 380.20,
        ask: 380.30,
      });

      const result = parser.parse(rawData);

      expect(result.success).toBe(true);
      expect(result.data!.symbol).toBe('MSFT');
      expect(result.data!.bid).toBe(380.20);
      expect(result.data!.ask).toBe(380.30);
    });

    it('should normalize symbol to uppercase', () => {
      const rawData = {
        type: 'tick',
        symbol: 'aapl',
        price: 175.50,
        timestamp: Date.now(),
      };

      const result = parser.parse(rawData);

      expect(result.success).toBe(true);
      expect(result.data!.symbol).toBe('AAPL');
    });

    it('should calculate spread when bid and ask are provided', () => {
      const rawData = {
        type: 'quote',
        symbol: 'GOOGL',
        price: 140.75,
        timestamp: Date.now(),
        bid: 140.70,
        ask: 140.80,
      };

      const result = parser.parse(rawData);

      expect(result.success).toBe(true);
      expect(result.data!.spread).toBe(0.10);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON string', () => {
      const rawData = '{ invalid json }';

      const result = parser.parse(rawData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to parse JSON');
    });

    it('should handle missing required fields', () => {
      const rawData = {
        type: 'tick',
        // missing symbol, price, timestamp
      };

      const result = parser.parse(rawData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required fields');
    });

    it('should handle invalid message type', () => {
      const rawData = {
        type: 'invalid_type',
        symbol: 'AAPL',
        price: 175.50,
        timestamp: Date.now(),
      };

      const result = parser.parse(rawData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid message type');
    });

    it('should handle negative price', () => {
      const rawData = {
        type: 'tick',
        symbol: 'AAPL',
        price: -175.50,
        timestamp: Date.now(),
      };

      const result = parser.parse(rawData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('price cannot be negative');
    });

    it('should handle invalid timestamp', () => {
      const rawData = {
        type: 'tick',
        symbol: 'AAPL',
        price: 175.50,
        timestamp: 'invalid_timestamp',
      };

      const result = parser.parse(rawData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Timestamp string cannot be parsed');
    });

    it('should handle bid >= ask in strict mode', () => {
      const strictParser = new MarketDataParser({ strictMode: true });
      const rawData = {
        type: 'quote',
        symbol: 'AAPL',
        price: 175.50,
        timestamp: Date.now(),
        bid: 175.60,
        ask: 175.50, // ask <= bid
      };

      const result = strictParser.parse(rawData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Bid price must be less than ask price');
    });
  });

  describe('Batch Processing', () => {
    it('should parse multiple messages in batch', () => {
      const rawDataArray = [
        {
          type: 'tick',
          symbol: 'AAPL',
          price: 175.50,
          timestamp: Date.now(),
        },
        {
          type: 'quote',
          symbol: 'MSFT',
          price: 380.25,
          timestamp: Date.now(),
          bid: 380.20,
          ask: 380.30,
        },
      ];

      const results = parser.parseBatch(rawDataArray);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(results[0].data!.symbol).toBe('AAPL');
      expect(results[1].data!.symbol).toBe('MSFT');
    });

    it('should handle mixed valid and invalid messages in batch', () => {
      const rawDataArray = [
        {
          type: 'tick',
          symbol: 'AAPL',
          price: 175.50,
          timestamp: Date.now(),
        },
        {
          type: 'invalid_type',
          symbol: 'MSFT',
          price: 380.25,
          timestamp: Date.now(),
        },
      ];

      const results = parser.parseBatch(rawDataArray);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
    });
  });

  describe('Configuration', () => {
    it('should respect strict mode configuration', () => {
      const strictParser = new MarketDataParser({ strictMode: true });
      const rawData = {
        type: 'tick',
        symbol: 'AAPL',
        price: 175.50,
        timestamp: Date.now(),
        unknownField: 'should cause warning in strict mode',
      };

      const result = strictParser.parse(rawData);

      expect(result.success).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings![0]).toContain('Unknown fields found');
    });

    it('should handle numeric precision configuration', () => {
      const preciseParser = new MarketDataParser({ numericPrecision: 2 });
      const rawData = {
        type: 'tick',
        symbol: 'AAPL',
        price: 175.123456,
        timestamp: Date.now(),
      };

      const result = preciseParser.parse(rawData);

      expect(result.success).toBe(true);
      expect(result.data!.price).toBe(175.12);
    });

    it('should validate timestamp age when configured', () => {
      const parser = new MarketDataParser({
        validateTimestamp: true,
        maxTimestampAge: 1000, // 1 second
      });

      const rawData = {
        type: 'tick',
        symbol: 'AAPL',
        price: 175.50,
        timestamp: Date.now() - 2000, // 2 seconds ago
      };

      const result = parser.parse(rawData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Timestamp is too old');
    });
  });

  describe('Statistics', () => {
    it('should track parsing statistics', () => {
      const rawData = {
        type: 'tick',
        symbol: 'AAPL',
        price: 175.50,
        timestamp: Date.now(),
      };

      parser.parse(rawData);
      parser.parse({ invalid: 'data' });

      const stats = parser.getStats();

      expect(stats.totalMessages).toBe(2);
      expect(stats.successfulParses).toBe(1);
      expect(stats.failedParses).toBe(1);
      expect(stats.averageParseTime).toBeGreaterThan(0);
    });

    it('should reset statistics', () => {
      const rawData = {
        type: 'tick',
        symbol: 'AAPL',
        price: 175.50,
        timestamp: Date.now(),
      };

      parser.parse(rawData);
      parser.resetStats();

      const stats = parser.getStats();

      expect(stats.totalMessages).toBe(0);
      expect(stats.successfulParses).toBe(0);
      expect(stats.failedParses).toBe(0);
    });
  });

  describe('High-Frequency Data Handling', () => {
    it('should handle high-frequency data streams efficiently', () => {
      const startTime = performance.now();
      const messageCount = 1000;
      const messages = [];

      // Generate 1000 messages
      for (let i = 0; i < messageCount; i++) {
        messages.push({
          type: 'tick',
          symbol: 'AAPL',
          price: 175.50 + (Math.random() - 0.5) * 2,
          timestamp: Date.now() + i,
          volume: Math.floor(Math.random() * 10000),
        });
      }

      const results = parser.parseBatch(messages);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(results).toHaveLength(messageCount);
      expect(results.every(r => r.success)).toBe(true);
      expect(totalTime).toBeLessThan(1000); // Should process 1000 messages in under 1 second
      
      const stats = parser.getStats();
      expect(stats.averageParseTime).toBeLessThan(1); // Average parse time should be under 1ms
    });
  });

  describe('Edge Cases', () => {
    it('should handle null and undefined values', () => {
      const result1 = parser.parse(null);
      const result2 = parser.parse(undefined);

      expect(result1.success).toBe(false);
      expect(result2.success).toBe(false);
    });

    it('should handle empty object', () => {
      const result = parser.parse({});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required fields');
    });

    it('should handle very large numbers', () => {
      const rawData = {
        type: 'tick',
        symbol: 'AAPL',
        price: Number.MAX_SAFE_INTEGER,
        timestamp: Date.now(),
      };

      const result = parser.parse(rawData);

      expect(result.success).toBe(true);
      expect(result.data!.price).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should handle NaN and Infinity', () => {
      const rawData = {
        type: 'tick',
        symbol: 'AAPL',
        price: NaN,
        timestamp: Date.now(),
      };

      const result = parser.parse(rawData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('price must be a finite number');
    });
  });
});