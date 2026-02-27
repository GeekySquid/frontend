/**
 * Market Data Pretty Printer Tests
 * 
 * Tests for the MarketDataPrettyPrinter class to ensure proper formatting
 * and round-trip consistency.
 */

import { MarketDataPrettyPrinter } from '../MarketDataPrettyPrinter';
import { MarketDataParser, ParsedMarketData } from '../MarketDataParser';

describe('MarketDataPrettyPrinter', () => {
  let printer: MarketDataPrettyPrinter;
  let parser: MarketDataParser;

  beforeEach(() => {
    printer = new MarketDataPrettyPrinter();
    parser = new MarketDataParser();
  });

  describe('Basic Printing', () => {
    it('should print valid market data as JSON', () => {
      const data: ParsedMarketData = {
        type: 'tick',
        symbol: 'AAPL',
        price: 175.50,
        timestamp: Date.now(),
      };

      const result = printer.print(data);

      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
      expect(typeof result.output).toBe('string');
      
      const parsed = JSON.parse(result.output as string);
      expect(parsed.type).toBe('tick');
      expect(parsed.symbol).toBe('AAPL');
      expect(parsed.price).toBe(175.50);
    });

    it('should print valid market data as object', () => {
      const objectPrinter = new MarketDataPrettyPrinter({ format: 'object' });
      const data: ParsedMarketData = {
        type: 'quote',
        symbol: 'MSFT',
        price: 380.25,
        timestamp: Date.now(),
        bid: 380.20,
        ask: 380.30,
      };

      const result = objectPrinter.print(data);

      expect(result.success).toBe(true);
      expect(typeof result.output).toBe('object');
      expect((result.output as any).symbol).toBe('MSFT');
      expect((result.output as any).bid).toBe(380.20);
      expect((result.output as any).ask).toBe(380.30);
    });

    it('should handle pretty print formatting', () => {
      const prettyPrinter = new MarketDataPrettyPrinter({ 
        format: 'json', 
        prettyPrint: true,
        indent: 2,
      });
      
      const data: ParsedMarketData = {
        type: 'tick',
        symbol: 'AAPL',
        price: 175.50,
        timestamp: Date.now(),
      };

      const result = prettyPrinter.print(data);

      expect(result.success).toBe(true);
      expect(result.output).toContain('\n');
      expect(result.output).toContain('  ');
    });

    it('should include all optional fields when present', () => {
      const data: ParsedMarketData = {
        type: 'quote',
        symbol: 'GOOGL',
        price: 140.75,
        timestamp: Date.now(),
        volume: 5000,
        bid: 140.70,
        ask: 140.80,
        spread: 0.10,
        high: 141.00,
        low: 140.50,
        open: 140.60,
        previousClose: 140.55,
        source: 'test-source',
      };

      const result = printer.print(data);

      expect(result.success).toBe(true);
      const parsed = JSON.parse(result.output as string);
      expect(parsed.volume).toBe(5000);
      expect(parsed.bid).toBe(140.70);
      expect(parsed.ask).toBe(140.80);
      expect(parsed.spread).toBe(0.10);
      expect(parsed.high).toBe(141.00);
      expect(parsed.low).toBe(140.50);
      expect(parsed.open).toBe(140.60);
      expect(parsed.previousClose).toBe(140.55);
      expect(parsed.source).toBe('test-source');
    });
  });

  describe('Round-Trip Consistency', () => {
    it('should maintain data consistency through parse -> print -> parse cycle', () => {
      const originalData = {
        type: 'tick',
        symbol: 'AAPL',
        price: 175.50,
        timestamp: Date.now(),
      };

      // Parse original data
      const parseResult1 = parser.parse(originalData);
      expect(parseResult1.success).toBe(true);

      // Print parsed data
      const printResult = printer.print(parseResult1.data!);
      expect(printResult.success).toBe(true);

      // Parse printed data
      const parseResult2 = parser.parse(printResult.output as string);
      expect(parseResult2.success).toBe(true);

      // Compare data
      expect(parseResult2.data!.type).toBe(parseResult1.data!.type);
      expect(parseResult2.data!.symbol).toBe(parseResult1.data!.symbol);
      expect(parseResult2.data!.price).toBe(parseResult1.data!.price);
      expect(parseResult2.data!.timestamp).toBe(parseResult1.data!.timestamp);
    });

    it('should maintain round-trip consistency with all optional fields', () => {
      const originalData = {
        type: 'quote',
        symbol: 'MSFT',
        price: 380.25,
        timestamp: Date.now(),
        volume: 10000,
        bid: 380.20,
        ask: 380.30,
        spread: 0.10,
        high: 381.00,
        low: 379.50,
        open: 380.00,
        previousClose: 379.75,
      };

      // Parse -> Print -> Parse
      const parseResult1 = parser.parse(originalData);
      const printResult = printer.print(parseResult1.data!);
      const parseResult2 = parser.parse(printResult.output as string);

      expect(parseResult2.success).toBe(true);
      expect(parseResult2.data!.volume).toBe(parseResult1.data!.volume);
      expect(parseResult2.data!.bid).toBe(parseResult1.data!.bid);
      expect(parseResult2.data!.ask).toBe(parseResult1.data!.ask);
      expect(parseResult2.data!.high).toBe(parseResult1.data!.high);
      expect(parseResult2.data!.low).toBe(parseResult1.data!.low);
      expect(parseResult2.data!.open).toBe(parseResult1.data!.open);
      expect(parseResult2.data!.previousClose).toBe(parseResult1.data!.previousClose);
    });

    it('should handle numeric precision in round-trip', () => {
      const precisionPrinter = new MarketDataPrettyPrinter({ numericPrecision: 2 });
      const precisionParser = new MarketDataParser({ numericPrecision: 2 });

      const originalData = {
        type: 'tick',
        symbol: 'AAPL',
        price: 175.123456,
        timestamp: Date.now(),
      };

      const parseResult1 = precisionParser.parse(originalData);
      const printResult = precisionPrinter.print(parseResult1.data!);
      const parseResult2 = precisionParser.parse(printResult.output as string);

      expect(parseResult2.success).toBe(true);
      expect(parseResult2.data!.price).toBe(175.12);
      expect(parseResult2.data!.price).toBe(parseResult1.data!.price);
    });

    it('should maintain metadata through round-trip when configured', () => {
      const metadataPrinter = new MarketDataPrettyPrinter({ includeMetadata: true });
      const metadataParser = new MarketDataParser({ allowUnknownFields: true });

      const originalData = {
        type: 'tick',
        symbol: 'AAPL',
        price: 175.50,
        timestamp: Date.now(),
        customField1: 'value1',
        customField2: 123,
      };

      const parseResult1 = metadataParser.parse(originalData);
      expect(parseResult1.data!.metadata).toBeDefined();

      const printResult = metadataPrinter.print(parseResult1.data!);
      const parseResult2 = metadataParser.parse(printResult.output as string);

      expect(parseResult2.success).toBe(true);
      expect(parseResult2.data!.metadata).toBeDefined();
      expect(parseResult2.data!.metadata!.customField1).toBe('value1');
      expect(parseResult2.data!.metadata!.customField2).toBe(123);
    });
  });

  describe('Batch Printing', () => {
    it('should print multiple messages in batch', () => {
      const dataArray: ParsedMarketData[] = [
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

      const results = printer.printBatch(dataArray);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });

    it('should handle mixed valid and invalid data in batch', () => {
      const dataArray: any[] = [
        {
          type: 'tick',
          symbol: 'AAPL',
          price: 175.50,
          timestamp: Date.now(),
        },
        {
          // Missing required fields
          type: 'quote',
        },
      ];

      const results = printer.printBatch(dataArray);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBeDefined();
    });
  });

  describe('Formatted Output', () => {
    it('should produce formatted multi-line output', () => {
      const data: ParsedMarketData = {
        type: 'tick',
        symbol: 'AAPL',
        price: 175.50,
        timestamp: Date.now(),
        volume: 5000,
      };

      const formatted = printer.printFormatted(data);

      expect(formatted).toContain('Market Data [TICK]');
      expect(formatted).toContain('Symbol: AAPL');
      expect(formatted).toContain('Price: $175.5000');
      expect(formatted).toContain('Volume: 5000');
    });

    it('should produce compact single-line output', () => {
      const data: ParsedMarketData = {
        type: 'quote',
        symbol: 'MSFT',
        price: 380.25,
        timestamp: Date.now(),
        volume: 10000,
        bid: 380.20,
        ask: 380.30,
      };

      const compact = printer.printCompact(data);

      expect(compact).toContain('[quote]');
      expect(compact).toContain('MSFT');
      expect(compact).toContain('$380.2500');
      expect(compact).toContain('Vol:10000');
      expect(compact).toContain('380.2000/380.3000');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid input data', () => {
      const result = printer.print(null as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Input must be a valid ParsedMarketData object');
    });

    it('should handle missing required fields', () => {
      const invalidData = {
        type: 'tick',
        // missing symbol, price, timestamp
      } as any;

      const result = printer.print(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required field');
    });

    it('should handle invalid message type', () => {
      const invalidData = {
        type: 'invalid_type',
        symbol: 'AAPL',
        price: 175.50,
        timestamp: Date.now(),
      } as any;

      const result = printer.print(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid message type');
    });

    it('should handle invalid numeric values', () => {
      const invalidData = {
        type: 'tick',
        symbol: 'AAPL',
        price: NaN,
        timestamp: Date.now(),
      } as any;

      const result = printer.print(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Price must be a finite number');
    });
  });

  describe('Configuration', () => {
    it('should respect sortKeys configuration', () => {
      const sortedPrinter = new MarketDataPrettyPrinter({ 
        format: 'object',
        sortKeys: true,
      });

      const data: ParsedMarketData = {
        type: 'tick',
        symbol: 'AAPL',
        price: 175.50,
        timestamp: Date.now(),
        volume: 5000,
      };

      const result = sortedPrinter.print(data);

      expect(result.success).toBe(true);
      const keys = Object.keys(result.output as object);
      const sortedKeys = [...keys].sort();
      expect(keys).toEqual(sortedKeys);
    });

    it('should respect includeMetadata configuration', () => {
      const noMetadataPrinter = new MarketDataPrettyPrinter({ 
        includeMetadata: false,
      });

      const data: ParsedMarketData = {
        type: 'tick',
        symbol: 'AAPL',
        price: 175.50,
        timestamp: Date.now(),
        metadata: {
          customField: 'value',
        },
      };

      const result = noMetadataPrinter.print(data);

      expect(result.success).toBe(true);
      const parsed = JSON.parse(result.output as string);
      expect(parsed.customField).toBeUndefined();
    });

    it('should allow configuration updates', () => {
      printer.updateConfig({ numericPrecision: 2 });
      const config = printer.getConfig();

      expect(config.numericPrecision).toBe(2);
    });
  });

  describe('High-Frequency Data Handling', () => {
    it('should handle high-frequency printing efficiently', () => {
      const startTime = performance.now();
      const messageCount = 1000;
      const dataArray: ParsedMarketData[] = [];

      // Generate 1000 messages
      for (let i = 0; i < messageCount; i++) {
        dataArray.push({
          type: 'tick',
          symbol: 'AAPL',
          price: 175.50 + (Math.random() - 0.5) * 2,
          timestamp: Date.now() + i,
          volume: Math.floor(Math.random() * 10000),
        });
      }

      const results = printer.printBatch(dataArray);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(results).toHaveLength(messageCount);
      expect(results.every(r => r.success)).toBe(true);
      expect(totalTime).toBeLessThan(1000); // Should process 1000 messages in under 1 second
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero values', () => {
      const data: ParsedMarketData = {
        type: 'tick',
        symbol: 'AAPL',
        price: 0,
        timestamp: Date.now(),
        volume: 0,
      };

      const result = printer.print(data);

      expect(result.success).toBe(true);
      const parsed = JSON.parse(result.output as string);
      expect(parsed.price).toBe(0);
      expect(parsed.volume).toBe(0);
    });

    it('should handle very large numbers', () => {
      const data: ParsedMarketData = {
        type: 'tick',
        symbol: 'AAPL',
        price: Number.MAX_SAFE_INTEGER,
        timestamp: Date.now(),
      };

      const result = printer.print(data);

      expect(result.success).toBe(true);
      const parsed = JSON.parse(result.output as string);
      expect(parsed.price).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should handle empty string symbol gracefully', () => {
      const data: ParsedMarketData = {
        type: 'tick',
        symbol: '',
        price: 175.50,
        timestamp: Date.now(),
      };

      const result = printer.print(data);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Symbol must be a non-empty string');
    });
  });
});
