/**
 * Market Data Round-Trip Integration Tests
 * 
 * Tests the complete parse -> print -> parse cycle to ensure data consistency.
 * Validates Requirements 14.3 and 14.4.
 */

import { MarketDataParser } from '../MarketDataParser';
import { MarketDataPrettyPrinter } from '../MarketDataPrettyPrinter';

describe('Market Data Round-Trip Integration', () => {
  let parser: MarketDataParser;
  let printer: MarketDataPrettyPrinter;

  beforeEach(() => {
    parser = new MarketDataParser();
    printer = new MarketDataPrettyPrinter();
  });

  describe('Round-Trip Property Validation', () => {
    it('should maintain equivalence through parse -> print -> parse for tick messages', () => {
      const originalData = {
        type: 'tick',
        symbol: 'AAPL',
        price: 175.50,
        timestamp: Date.now(),
      };

      // First parse
      const parse1 = parser.parse(originalData);
      expect(parse1.success).toBe(true);

      // Print
      const print1 = printer.print(parse1.data!);
      expect(print1.success).toBe(true);

      // Second parse
      const parse2 = parser.parse(print1.output!);
      expect(parse2.success).toBe(true);

      // Verify equivalence
      expect(parse2.data).toEqual(parse1.data);
    });

    it('should maintain equivalence for quote messages with bid/ask', () => {
      const originalData = {
        type: 'quote',
        symbol: 'MSFT',
        price: 380.25,
        timestamp: Date.now(),
        bid: 380.20,
        ask: 380.30,
        spread: 0.10,
      };

      const parse1 = parser.parse(originalData);
      const print1 = printer.print(parse1.data!);
      const parse2 = parser.parse(print1.output!);

      expect(parse2.data).toEqual(parse1.data);
    });

    it('should maintain equivalence for trade messages with volume', () => {
      const originalData = {
        type: 'trade',
        symbol: 'GOOGL',
        price: 140.75,
        timestamp: Date.now(),
        volume: 5000,
      };

      const parse1 = parser.parse(originalData);
      const print1 = printer.print(parse1.data!);
      const parse2 = parser.parse(print1.output!);

      expect(parse2.data).toEqual(parse1.data);
    });

    it('should maintain equivalence for heartbeat messages', () => {
      const originalData = {
        type: 'heartbeat',
        symbol: 'SYSTEM',
        price: 0,
        timestamp: Date.now(),
      };

      const parse1 = parser.parse(originalData);
      const print1 = printer.print(parse1.data!);
      const parse2 = parser.parse(print1.output!);

      expect(parse2.data).toEqual(parse1.data);
    });

    it('should maintain equivalence with all optional fields', () => {
      const originalData = {
        type: 'quote',
        symbol: 'TSLA',
        price: 245.80,
        timestamp: Date.now(),
        volume: 15000,
        bid: 245.75,
        ask: 245.85,
        spread: 0.10,
        high: 246.50,
        low: 244.20,
        open: 245.00,
        previousClose: 244.90,
        source: 'test-provider',
      };

      const parse1 = parser.parse(originalData);
      const print1 = printer.print(parse1.data!);
      const parse2 = parser.parse(print1.output!);

      expect(parse2.data).toEqual(parse1.data);
    });

    it('should handle multiple round-trips without data degradation', () => {
      const originalData = {
        type: 'tick',
        symbol: 'NVDA',
        price: 485.30,
        timestamp: Date.now(),
        volume: 8000,
      };

      let currentData = originalData;
      
      // Perform 5 round-trips
      for (let i = 0; i < 5; i++) {
        const parseResult = parser.parse(currentData);
        expect(parseResult.success).toBe(true);
        
        const printResult = printer.print(parseResult.data!);
        expect(printResult.success).toBe(true);
        
        currentData = JSON.parse(printResult.output as string);
      }

      // Final parse to verify
      const finalParse = parser.parse(currentData);
      const initialParse = parser.parse(originalData);
      
      expect(finalParse.data).toEqual(initialParse.data);
    });
  });

  describe('Error Handling During Round-Trip', () => {
    it('should handle malformed data gracefully during parse phase', () => {
      const malformedData = '{ invalid json }';

      const parseResult = parser.parseWithErrorHandling(malformedData);
      
      expect(parseResult.success).toBe(false);
      expect(parseResult.error).toBeDefined();
    });

    it('should continue processing valid data after encountering errors', () => {
      const dataArray = [
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
        {
          type: 'quote',
          symbol: 'GOOGL',
          price: 140.75,
          timestamp: Date.now(),
          bid: 140.70,
          ask: 140.80,
        },
      ];

      const parseResults = parser.parseBatch(dataArray);
      
      expect(parseResults[0].success).toBe(true);
      expect(parseResults[1].success).toBe(false);
      expect(parseResults[2].success).toBe(true);

      // Print valid results
      const validData = parseResults.filter(r => r.success).map(r => r.data!);
      const printResults = printer.printBatch(validData);
      
      expect(printResults).toHaveLength(2);
      expect(printResults.every(r => r.success)).toBe(true);
    });

    it('should log errors and continue processing in batch mode', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const dataArray = [
        { type: 'tick', symbol: 'AAPL', price: 175.50, timestamp: Date.now() },
        { invalid: 'data' },
        { type: 'quote', symbol: 'MSFT', price: 380.25, timestamp: Date.now() },
      ];

      const results = dataArray.map(data => parser.parseWithErrorHandling(data));
      
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('High-Frequency Data Stream Simulation', () => {
    it('should handle high-frequency round-trips without data loss', () => {
      const messageCount = 100;
      const messages = [];

      // Generate high-frequency messages
      for (let i = 0; i < messageCount; i++) {
        messages.push({
          type: 'tick',
          symbol: 'AAPL',
          price: 175.50 + (Math.random() - 0.5) * 2,
          timestamp: Date.now() + i,
          volume: Math.floor(Math.random() * 10000),
        });
      }

      // Process all messages through round-trip
      const parseResults = parser.parseBatch(messages);
      expect(parseResults.every(r => r.success)).toBe(true);

      const validData = parseResults.map(r => r.data!);
      const printResults = printer.printBatch(validData);
      expect(printResults.every(r => r.success)).toBe(true);

      const reparsedResults = printResults.map(r => 
        parser.parse(r.output as string)
      );
      expect(reparsedResults.every(r => r.success)).toBe(true);

      // Verify data consistency
      for (let i = 0; i < messageCount; i++) {
        expect(reparsedResults[i].data).toEqual(parseResults[i].data);
      }
    });

    it('should maintain performance under high-frequency load', () => {
      const messageCount = 1000;
      const messages = [];

      for (let i = 0; i < messageCount; i++) {
        messages.push({
          type: 'tick',
          symbol: 'AAPL',
          price: 175.50 + (Math.random() - 0.5) * 2,
          timestamp: Date.now() + i,
        });
      }

      const startTime = performance.now();

      // Full round-trip
      const parseResults = parser.parseBatch(messages);
      const validData = parseResults.map(r => r.data!);
      const printResults = printer.printBatch(validData);
      const reparsedResults = printResults.map(r => 
        parser.parse(r.output as string)
      );

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(reparsedResults.every(r => r.success)).toBe(true);
      expect(totalTime).toBeLessThan(2000); // Should complete in under 2 seconds
    });
  });

  describe('Numeric Precision Consistency', () => {
    it('should maintain numeric precision through round-trip', () => {
      const precisionParser = new MarketDataParser({ numericPrecision: 4 });
      const precisionPrinter = new MarketDataPrettyPrinter({ numericPrecision: 4 });

      const originalData = {
        type: 'tick',
        symbol: 'AAPL',
        price: 175.123456789,
        timestamp: Date.now(),
      };

      const parse1 = precisionParser.parse(originalData);
      const print1 = precisionPrinter.print(parse1.data!);
      const parse2 = precisionParser.parse(print1.output!);

      expect(parse2.data!.price).toBe(175.1235);
      expect(parse2.data!.price).toBe(parse1.data!.price);
    });

    it('should handle different precision configurations consistently', () => {
      const parser2 = new MarketDataParser({ numericPrecision: 2 });
      const printer2 = new MarketDataPrettyPrinter({ numericPrecision: 2 });

      const originalData = {
        type: 'quote',
        symbol: 'MSFT',
        price: 380.256789,
        timestamp: Date.now(),
        bid: 380.201234,
        ask: 380.309876,
      };

      const parse1 = parser2.parse(originalData);
      const print1 = printer2.print(parse1.data!);
      const parse2 = parser2.parse(print1.output!);

      expect(parse2.data!.price).toBe(380.26);
      expect(parse2.data!.bid).toBe(380.20);
      expect(parse2.data!.ask).toBe(380.31);
      expect(parse2.data).toEqual(parse1.data);
    });
  });

  describe('Metadata Preservation', () => {
    it('should preserve metadata through round-trip when configured', () => {
      const metadataParser = new MarketDataParser({ allowUnknownFields: true });
      const metadataPrinter = new MarketDataPrettyPrinter({ includeMetadata: true });

      const originalData = {
        type: 'tick',
        symbol: 'AAPL',
        price: 175.50,
        timestamp: Date.now(),
        customField1: 'value1',
        customField2: 123,
        customField3: true,
      };

      const parse1 = metadataParser.parse(originalData);
      expect(parse1.data!.metadata).toBeDefined();

      const print1 = metadataPrinter.print(parse1.data!);
      const parse2 = metadataParser.parse(print1.output!);

      expect(parse2.data!.metadata).toBeDefined();
      expect(parse2.data!.metadata!.customField1).toBe('value1');
      expect(parse2.data!.metadata!.customField2).toBe(123);
      expect(parse2.data!.metadata!.customField3).toBe(true);
    });

    it('should exclude metadata when configured not to include it', () => {
      const metadataParser = new MarketDataParser({ allowUnknownFields: true });
      const noMetadataPrinter = new MarketDataPrettyPrinter({ includeMetadata: false });

      const originalData = {
        type: 'tick',
        symbol: 'AAPL',
        price: 175.50,
        timestamp: Date.now(),
        customField: 'value',
      };

      const parse1 = metadataParser.parse(originalData);
      const print1 = noMetadataPrinter.print(parse1.data!);
      const printed = JSON.parse(print1.output as string);

      expect(printed.customField).toBeUndefined();
    });
  });

  describe('Statistics and Monitoring', () => {
    it('should track parsing statistics during round-trip', () => {
      const messages = [
        { type: 'tick', symbol: 'AAPL', price: 175.50, timestamp: Date.now() },
        { type: 'quote', symbol: 'MSFT', price: 380.25, timestamp: Date.now() },
        { invalid: 'data' },
      ];

      messages.forEach(msg => parser.parseWithErrorHandling(msg));

      const stats = parser.getStats();
      
      expect(stats.totalMessages).toBe(3);
      expect(stats.successfulParses).toBe(2);
      expect(stats.failedParses).toBe(1);
      expect(stats.averageParseTime).toBeGreaterThan(0);
    });

    it('should reset statistics correctly', () => {
      const message = { type: 'tick', symbol: 'AAPL', price: 175.50, timestamp: Date.now() };
      
      parser.parse(message);
      parser.resetStats();

      const stats = parser.getStats();
      
      expect(stats.totalMessages).toBe(0);
      expect(stats.successfulParses).toBe(0);
      expect(stats.failedParses).toBe(0);
    });
  });
});
