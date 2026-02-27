/**
 * Market Data Parser and Validator - Main Export
 * 
 * Provides a unified interface for parsing and validating market data feeds
 * with round-trip consistency validation.
 */

export { MarketDataParser, type ParsedMarketData, type ParseResult, type ParserConfig, type ParserStats } from './MarketDataParser';
export { MarketDataPrettyPrinter, type PrinterConfig, type PrintResult } from './MarketDataPrettyPrinter';

import { MarketDataParser, ParsedMarketData, ParserConfig } from './MarketDataParser';
import { MarketDataPrettyPrinter, PrinterConfig } from './MarketDataPrettyPrinter';

/**
 * Combined Market Data Validator with round-trip testing
 */
export class MarketDataValidator {
  private parser: MarketDataParser;
  private printer: MarketDataPrettyPrinter;

  constructor(
    parserConfig: Partial<ParserConfig> = {},
    printerConfig: Partial<PrinterConfig> = {}
  ) {
    this.parser = new MarketDataParser(parserConfig);
    this.printer = new MarketDataPrettyPrinter(printerConfig);
  }

  /**
   * Parse and validate market data with round-trip consistency check
   */
  parseAndValidate(rawData: any): {
    parseResult: ReturnType<MarketDataParser['parse']>;
    roundTripResult?: ReturnType<MarketDataPrettyPrinter['validateRoundTrip']>;
  } {
    const parseResult = this.parser.parse(rawData);
    
    if (!parseResult.success || !parseResult.data) {
      return { parseResult };
    }

    // Perform round-trip validation
    const roundTripResult = this.printer.validateRoundTrip(parseResult.data, this.parser);

    return {
      parseResult,
      roundTripResult,
    };
  }

  /**
   * Process high-frequency data stream with validation
   */
  processStream(rawDataArray: any[]): Array<{
    index: number;
    parseResult: ReturnType<MarketDataParser['parse']>;
    roundTripResult?: ReturnType<MarketDataPrettyPrinter['validateRoundTrip']>;
  }> {
    return rawDataArray.map((rawData, index) => ({
      index,
      ...this.parseAndValidate(rawData),
    }));
  }

  /**
   * Get combined statistics from parser and validator
   */
  getStats() {
    return {
      parser: this.parser.getStats(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Reset all statistics
   */
  resetStats(): void {
    this.parser.resetStats();
  }

  /**
   * Get parser instance for direct access
   */
  getParser(): MarketDataParser {
    return this.parser;
  }

  /**
   * Get printer instance for direct access
   */
  getPrinter(): MarketDataPrettyPrinter {
    return this.printer;
  }
}

/**
 * Create a default market data validator instance
 */
export function createMarketDataValidator(
  parserConfig?: Partial<ParserConfig>,
  printerConfig?: Partial<PrinterConfig>
): MarketDataValidator {
  return new MarketDataValidator(parserConfig, printerConfig);
}

/**
 * Utility function to validate round-trip consistency for a single data item
 */
export function validateRoundTrip(data: ParsedMarketData): {
  success: boolean;
  error?: string;
  differences?: string[];
} {
  const parser = new MarketDataParser();
  const printer = new MarketDataPrettyPrinter();
  
  return printer.validateRoundTrip(data, parser);
}

/**
 * Utility function to parse market data with default configuration
 */
export function parseMarketData(rawData: any) {
  const parser = new MarketDataParser();
  return parser.parse(rawData);
}

/**
 * Utility function to format market data with default configuration
 */
export function formatMarketData(data: ParsedMarketData) {
  const printer = new MarketDataPrettyPrinter();
  return printer.print(data);
}