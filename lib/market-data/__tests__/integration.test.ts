/**
 * Market Data Parser and Validator Integration Tests
 * 
 * Tests the complete parsing and validation pipeline including
 * round-trip consistency validation.
 */

import { 
  MarketDataValidator, 
  createMarketDataValidator,
  validateRoundTrip,
  parseMarketData,
  formatMarketData
} from '../index';

describe('Market Data Integration Tests', () => {
  let validator: MarketDataValidator;

  beforeEach(() => {
    validator = createMarketDataValidator();
  });

  describe('Complete Parsing and Validation Pipeline', () => {
    it('should parse and validate market data with round-trip consistency', () => {
      const rawData = {
        type: 'tick',
        symbol: 'AAPL',
        price: 175.50,
        timestamp: Date.now(),
        volume: 1000,
        bid: 175.45,
        ask: 175.55,
      };

      const result = validator.parseAndValidate(rawData);

      expect(result.parseResult.success).toBe(true);
      expect(result.parseResult.data).toBeDefined();
      expect(result.roundTripResult).toBeDefined();
      expect(result.roundTripResult!.success).toBe(true);
    });

    it('should handle malformed data gracefully', () => {
      const malformedData = {
        type: 'invalid_type',
        symbol: '',
        price: 'not_a_number',
        timestamp: 'invalid_timestamp',
      };

      const result = validator.parseAndValidate(malformedData);

      expect(result.parseResult.success).toBe(false);
      expect(result.parseResult.error).toBeDefined();
      expect(result.roundTripResult).toBeUndefined(); // No round-trip test for failed parse
    });

    it('should process high-frequency data stream efficiently', () => {
      const messageCount = 100;
      const rawDataArray = [];

      // Generate realistic market data stream
      for (let i = 0; i < messageCount; i++) {
        rawDataArray.push({
          type: 'tick',
          symbol: 'AAPL',
          price: 175.50 + (Math.random() - 0.5) * 2,
          timestamp: Date.now() + i,
          volume: Math.floor(Math.random() * 10000) + 1000,
          bid: 175.45 + (Math.random() - 0.5) * 2,
          ask: 175.55 + (Math.random() - 0.5) * 2,
        });
      }

      const startTime = performance.now();
      const results = validator.processStream(rawDataArray);
      const endTime = performance.now();

      expect(results).toHaveLength(messageCount);
      expect(results.every(r => r.parseResult.success)).toBe(true);
      expect(results.every(r => r.roundTripResult?.success)).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should process in under 1 second
    });
  });

  describe('Round-Trip Consistency Validation', () => {
    it('should validate round-trip consistency for various message types', () => {
      const testCases = [
        {
          type: 'tick',
          symbol: 'AAPL',
          price: 175.50,
          timestamp: Date.now(),
          volume: 1000,
        },
        {
          type: 'quote',
          symbol: 'MSFT',
          price: 380.25,
          timestamp: Date.now(),
          bid: 380.20,
          ask: 380.30,
          spread: 0.10,
        },
        {
          type: 'trade',
          symbol: 'GOOGL',
          price: 140.75,
          timestamp: Date.now(),
          volume: 500,
          high: 141.00,
          low: 140.50,
          open: 140.80,
          previousClose: 140.60,
        },
        {
          type: 'heartbeat',
          symbol: 'SYSTEM',
          price: 0,
          timestamp: Date.now(),
        },
      ];

      for (const testCase of testCases) {
        const result = validator.parseAndValidate(testCase);
        
        expect(result.parseResult.success).toBe(true);
        expect(result.roundTripResult?.success).toBe(true);
        expect(result.parseResult.data?.type).toBe(testCase.type);
        expect(result.parseResult.data?.symbol).toBe(testCase.symbol);
      }
    });

    it('should maintain precision through round-trip', () => {
      const preciseValidator = createMarketDataValidator(
        { numericPrecision: 4 },
        { numericPrecision: 4 }
      );

      const rawData = {
        type: 'tick',
        symbol: 'AAPL',
        price: 175.1234,
        timestamp: Date.now(),
        bid: 175.1230,
        ask: 175.1238,
      };

      const result = preciseValidator.parseAndValidate(rawData);

      expect(result.parseResult.success).toBe(true);
      expect(result.roundTripResult?.success).toBe(true);
      expect(result.parseResult.data?.price).toBe(175.1234);
      expect(result.parseResult.data?.bid).toBe(175.1230);
      expect(result.parseResult.data?.ask).toBe(175.1238);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should continue processing valid data after encountering malformed data', () => {
      const mixedDataArray = [
        {
          type: 'tick',
          symbol: 'AAPL',
          price: 175.50,
          timestamp: Date.now(),
        },
        {
          type: 'invalid_type', // This should fail
          symbol: 'MSFT',
          price: 380.25,
          timestamp: Date.now(),
        },
        {
          type: 'quote',
          symbol: 'GOOGL',
          price: 140.75,
          timestamp: Date.now(),
          bid: 140.70,
          ask: 140.80,
        },
      ];

      const results = validator.processStream(mixedDataArray);

      expect(results).toHaveLength(3);
      expect(results[0].parseResult.success).toBe(true); // First message succeeds
      expect(results[1].parseResult.success).toBe(false); // Second message fails
      expect(results[2].parseResult.success).toBe(true); // Third message succeeds
    });

    it('should log errors when configured', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const loggingValidator = createMarketDataValidator({ logErrors: true });
      
      const malformedData = {
        type: 'invalid_type',
        symbol: 'AAPL',
        price: 175.50,
        timestamp: Date.now(),
      };

      const parser = loggingValidator.getParser();
      parser.parseWithErrorHandling(malformedData);

      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Performance and Statistics', () => {
    it('should track parsing statistics', () => {
      const rawData = {
        type: 'tick',
        symbol: 'AAPL',
        price: 175.50,
        timestamp: Date.now(),
      };

      validator.parseAndValidate(rawData);
      validator.parseAndValidate({ invalid: 'data' });

      const stats = validator.getStats();

      expect(stats.parser.totalMessages).toBe(2);
      expect(stats.parser.successfulParses).toBe(1);
      expect(stats.parser.failedParses).toBe(1);
      expect(stats.timestamp).toBeDefined();
    });

    it('should reset statistics', () => {
      const rawData = {
        type: 'tick',
        symbol: 'AAPL',
        price: 175.50,
        timestamp: Date.now(),
      };

      validator.parseAndValidate(rawData);
      validator.resetStats();

      const stats = validator.getStats();

      expect(stats.parser.totalMessages).toBe(0);
      expect(stats.parser.successfulParses).toBe(0);
      expect(stats.parser.failedParses).toBe(0);
    });
  });

  describe('Utility Functions', () => {
    it('should parse market data with default configuration', () => {
      const rawData = {
        type: 'tick',
        symbol: 'AAPL',
        price: 175.50,
        timestamp: Date.now(),
      };

      const result = parseMarketData(rawData);

      expect(result.success).toBe(true);
      expect(result.data?.symbol).toBe('AAPL');
    });

    it('should format market data with default configuration', () => {
      const data = {
        type: 'tick' as const,
        symbol: 'AAPL',
        price: 175.50,
        timestamp: Date.now(),
      };

      const result = formatMarketData(data);

      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
      
      const parsed = JSON.parse(result.output as string);
      expect(parsed.symbol).toBe('AAPL');
    });

    it('should validate round-trip consistency with utility function', () => {
      const data = {
        type: 'tick' as const,
        symbol: 'AAPL',
        price: 175.50,
        timestamp: Date.now(),
      };

      const result = validateRoundTrip(data);

      expect(result.success).toBe(true);
      expect(result.differences).toBeUndefined();
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle realistic market data feed', () => {
      const realisticFeed = [
        // Opening tick
        {
          type: 'tick',
          symbol: 'AAPL',
          price: 175.50,
          timestamp: Date.now(),
          volume: 1000,
          open: 175.50,
        },
        // Quote update
        {
          type: 'quote',
          symbol: 'AAPL',
          price: 175.52,
          timestamp: Date.now() + 100,
          bid: 175.51,
          ask: 175.53,
          spread: 0.02,
        },
        // Trade execution
        {
          type: 'trade',
          symbol: 'AAPL',
          price: 175.53,
          timestamp: Date.now() + 200,
          volume: 500,
          high: 175.55,
          low: 175.50,
        },
        // Heartbeat
        {
          type: 'heartbeat',
          symbol: 'SYSTEM',
          price: 0,
          timestamp: Date.now() + 300,
        },
      ];

      const results = validator.processStream(realisticFeed);

      expect(results).toHaveLength(4);
      expect(results.every(r => r.parseResult.success)).toBe(true);
      expect(results.every(r => r.roundTripResult?.success)).toBe(true);
      
      // Verify specific data integrity
      expect(results[0].parseResult.data?.type).toBe('tick');
      expect(results[1].parseResult.data?.type).toBe('quote');
      expect(results[2].parseResult.data?.type).toBe('trade');
      expect(results[3].parseResult.data?.type).toBe('heartbeat');
    });

    it('should handle edge cases in market data', () => {
      const edgeCases = [
        // Zero volume
        {
          type: 'tick',
          symbol: 'AAPL',
          price: 175.50,
          timestamp: Date.now(),
          volume: 0,
        },
        // Very small spread
        {
          type: 'quote',
          symbol: 'AAPL',
          price: 175.50,
          timestamp: Date.now(),
          bid: 175.4999,
          ask: 175.5001,
        },
        // High precision price
        {
          type: 'tick',
          symbol: 'CRYPTO_BTC',
          price: 45123.123456789,
          timestamp: Date.now(),
        },
      ];

      const results = validator.processStream(edgeCases);

      expect(results).toHaveLength(3);
      expect(results.every(r => r.parseResult.success)).toBe(true);
      expect(results.every(r => r.roundTripResult?.success)).toBe(true);
    });
  });
});