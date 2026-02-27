/**
 * Market Data Pretty Printer
 * 
 * Formats parsed market data back into the original format for validation.
 * Ensures round-trip consistency: parse -> print -> parse produces equivalent data.
 * 
 * Requirements: 14.3, 14.4
 */

import { ParsedMarketData } from './MarketDataParser';

export interface PrinterConfig {
  format: 'json' | 'object';
  prettyPrint: boolean;
  indent: number;
  includeMetadata: boolean;
  sortKeys: boolean;
  numericPrecision: number;
}

export interface PrintResult {
  success: boolean;
  output?: string | object;
  error?: string;
}

export class MarketDataPrettyPrinter {
  private config: PrinterConfig;

  constructor(config: Partial<PrinterConfig> = {}) {
    this.config = {
      format: config.format ?? 'json',
      prettyPrint: config.prettyPrint ?? false,
      indent: config.indent ?? 2,
      includeMetadata: config.includeMetadata ?? true,
      sortKeys: config.sortKeys ?? false,
      numericPrecision: config.numericPrecision ?? 4,
    };
  }

  /**
   * Format parsed market data back into the original format
   * Requirement 14.3: Format parsed market data back into original format
   */
  print(data: ParsedMarketData): PrintResult {
    try {
      // Validate input data
      const validationError = this.validateInput(data);
      if (validationError) {
        return {
          success: false,
          error: validationError,
        };
      }

      // Build output object
      const output = this.buildOutputObject(data);

      // Format according to configuration
      if (this.config.format === 'json') {
        const jsonString = this.config.prettyPrint
          ? JSON.stringify(output, null, this.config.indent)
          : JSON.stringify(output);

        return {
          success: true,
          output: jsonString,
        };
      } else {
        return {
          success: true,
          output,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Pretty print error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Format multiple parsed market data messages in batch
   */
  printBatch(dataArray: ParsedMarketData[]): PrintResult[] {
    return dataArray.map(data => this.print(data));
  }

  /**
   * Format parsed market data as a formatted string for display
   */
  printFormatted(data: ParsedMarketData): string {
    const lines: string[] = [];
    
    lines.push(`Market Data [${data.type.toUpperCase()}]`);
    lines.push(`Symbol: ${data.symbol}`);
    lines.push(`Price: $${this.formatNumber(data.price)}`);
    lines.push(`Timestamp: ${new Date(data.timestamp).toISOString()}`);

    if (data.volume !== undefined) {
      lines.push(`Volume: ${this.formatNumber(data.volume, 0)}`);
    }

    if (data.bid !== undefined && data.ask !== undefined) {
      lines.push(`Bid: $${this.formatNumber(data.bid)}`);
      lines.push(`Ask: $${this.formatNumber(data.ask)}`);
      lines.push(`Spread: $${this.formatNumber(data.spread || 0)}`);
    }

    if (data.high !== undefined) {
      lines.push(`High: $${this.formatNumber(data.high)}`);
    }

    if (data.low !== undefined) {
      lines.push(`Low: $${this.formatNumber(data.low)}`);
    }

    if (data.open !== undefined) {
      lines.push(`Open: $${this.formatNumber(data.open)}`);
    }

    if (data.previousClose !== undefined) {
      lines.push(`Previous Close: $${this.formatNumber(data.previousClose)}`);
    }

    if (data.source) {
      lines.push(`Source: ${data.source}`);
    }

    if (data.metadata && this.config.includeMetadata) {
      lines.push(`Metadata: ${JSON.stringify(data.metadata)}`);
    }

    return lines.join('\n');
  }

  /**
   * Format parsed market data as a compact single-line string
   */
  printCompact(data: ParsedMarketData): string {
    const parts: string[] = [
      data.symbol,
      `$${this.formatNumber(data.price)}`,
    ];

    if (data.volume !== undefined) {
      parts.push(`Vol:${this.formatNumber(data.volume, 0)}`);
    }

    if (data.bid !== undefined && data.ask !== undefined) {
      parts.push(`${this.formatNumber(data.bid)}/${this.formatNumber(data.ask)}`);
    }

    return `[${data.type}] ${parts.join(' ')}`;
  }

  private validateInput(data: ParsedMarketData): string | null {
    if (!data || typeof data !== 'object') {
      return 'Input must be a valid ParsedMarketData object';
    }

    const requiredFields = ['type', 'symbol', 'price', 'timestamp'];
    for (const field of requiredFields) {
      if (!(field in data) || data[field as keyof ParsedMarketData] === null || data[field as keyof ParsedMarketData] === undefined) {
        return `Missing required field: ${field}`;
      }
    }

    const validTypes = ['tick', 'quote', 'trade', 'heartbeat'];
    if (!validTypes.includes(data.type)) {
      return `Invalid message type: ${data.type}`;
    }

    if (typeof data.symbol !== 'string' || data.symbol.length === 0) {
      return 'Symbol must be a non-empty string';
    }

    if (typeof data.price !== 'number' || !isFinite(data.price)) {
      return 'Price must be a finite number';
    }

    if (typeof data.timestamp !== 'number' || !isFinite(data.timestamp)) {
      return 'Timestamp must be a finite number';
    }

    return null;
  }

  private buildOutputObject(data: ParsedMarketData): any {
    const output: any = {
      type: data.type,
      symbol: data.symbol,
      price: this.roundNumber(data.price),
      timestamp: data.timestamp,
    };

    // Add optional fields if present
    const optionalFields: (keyof ParsedMarketData)[] = [
      'volume', 'bid', 'ask', 'spread', 'high', 'low', 'open', 'previousClose', 'source'
    ];

    for (const field of optionalFields) {
      if (data[field] !== undefined && data[field] !== null) {
        const value = data[field];
        if (typeof value === 'number') {
          output[field] = this.roundNumber(value);
        } else {
          output[field] = value;
        }
      }
    }

    // Add metadata if configured and present
    if (this.config.includeMetadata && data.metadata) {
      Object.assign(output, data.metadata);
    }

    // Sort keys if configured
    if (this.config.sortKeys) {
      const sorted: any = {};
      Object.keys(output).sort().forEach(key => {
        sorted[key] = output[key];
      });
      return sorted;
    }

    return output;
  }

  private roundNumber(value: number): number {
    return Number(value.toFixed(this.config.numericPrecision));
  }

  private formatNumber(value: number, precision?: number): string {
    const p = precision !== undefined ? precision : this.config.numericPrecision;
    return value.toFixed(p);
  }

  /**
   * Update printer configuration
   */
  updateConfig(newConfig: Partial<PrinterConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current printer configuration
   */
  getConfig(): PrinterConfig {
    return { ...this.config };
  }
  /**
   * Validate round-trip consistency: parse -> print -> parse
   * Requirement 14.4: Ensure round-trip consistency
   */
  validateRoundTrip(data: ParsedMarketData, parser: any): {
    success: boolean;
    error?: string;
    differences?: string[];
  } {
    try {
      // Print the data
      const printResult = this.print(data);

      if (!printResult.success || !printResult.output) {
        return {
          success: false,
          error: `Print failed: ${printResult.error}`,
        };
      }

      // Parse the printed output
      const reparsed = parser.parse(printResult.output);

      if (!reparsed.success || !reparsed.data) {
        return {
          success: false,
          error: `Reparse failed: ${reparsed.error}`,
        };
      }

      // Compare original and reparsed data
      const differences = this.compareData(data, reparsed.data);

      if (differences.length > 0) {
        return {
          success: false,
          error: 'Round-trip validation failed: data mismatch',
          differences,
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Round-trip validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  private compareData(original: ParsedMarketData, reparsed: ParsedMarketData): string[] {
    const differences: string[] = [];

    // Compare all fields
    const fields: (keyof ParsedMarketData)[] = [
      'type', 'symbol', 'price', 'timestamp', 'volume', 'bid', 'ask',
      'spread', 'high', 'low', 'open', 'previousClose', 'source'
    ];

    for (const field of fields) {
      const origValue = original[field];
      const reparsedValue = reparsed[field];

      if (origValue !== undefined && reparsedValue !== undefined) {
        if (typeof origValue === 'number' && typeof reparsedValue === 'number') {
          // Compare numbers with precision tolerance
          const diff = Math.abs(origValue - reparsedValue);
          const tolerance = Math.pow(10, -this.config.numericPrecision);
          if (diff > tolerance) {
            differences.push(`${field}: ${origValue} !== ${reparsedValue}`);
          }
        } else if (origValue !== reparsedValue) {
          differences.push(`${field}: ${origValue} !== ${reparsedValue}`);
        }
      } else if (origValue !== reparsedValue) {
        differences.push(`${field}: ${origValue} !== ${reparsedValue}`);
      }
    }

    return differences;
  }
}
