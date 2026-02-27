/**
 * Market Data Parser and Validator
 * 
 * Implements robust parsing and validation infrastructure for market data feeds.
 * Handles malformed data gracefully while ensuring round-trip consistency.
 * 
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5
 */

import { MarketDataMessage } from '../types/websocket';

export interface ParsedMarketData {
  type: 'tick' | 'quote' | 'trade' | 'heartbeat';
  symbol: string;
  price: number;
  volume?: number;
  timestamp: number;
  bid?: number;
  ask?: number;
  spread?: number;
  high?: number;
  low?: number;
  open?: number;
  previousClose?: number;
  source?: string;
  metadata?: Record<string, any>;
}

export interface ParseResult {
  success: boolean;
  data?: ParsedMarketData;
  error?: string;
  warnings?: string[];
  originalData?: any;
}

export interface ParserConfig {
  strictMode: boolean;
  allowUnknownFields: boolean;
  validateTimestamp: boolean;
  maxTimestampAge: number; // milliseconds
  requiredFields: string[];
  numericPrecision: number;
  logErrors: boolean;
}

export interface ParserStats {
  totalMessages: number;
  successfulParses: number;
  failedParses: number;
  warningCount: number;
  averageParseTime: number;
  lastParseTime: number;
  errorTypes: Record<string, number>;
}

export class MarketDataParser {
  private config: ParserConfig;
  private stats: ParserStats;
  private parseTimings: number[] = [];

  constructor(config: Partial<ParserConfig> = {}) {
    this.config = {
      strictMode: config.strictMode ?? false,
      allowUnknownFields: config.allowUnknownFields ?? true,
      validateTimestamp: config.validateTimestamp ?? true,
      maxTimestampAge: config.maxTimestampAge ?? 60000, // 1 minute
      requiredFields: config.requiredFields ?? ['type', 'symbol', 'price', 'timestamp'],
      numericPrecision: config.numericPrecision ?? 4,
      logErrors: config.logErrors ?? true,
    };

    this.stats = {
      totalMessages: 0,
      successfulParses: 0,
      failedParses: 0,
      warningCount: 0,
      averageParseTime: 0,
      lastParseTime: 0,
      errorTypes: {},
    };
  }

  /**
   * Parse market data according to the defined data format specification
   * Requirement 14.1: Parse market data according to defined format
   */
  parse(rawData: any): ParseResult {
    const startTime = performance.now();
    this.stats.totalMessages++;

    try {
      // Handle different input formats
      let data: any;
      if (typeof rawData === 'string') {
        try {
          data = JSON.parse(rawData);
        } catch (error) {
          return this.createErrorResult('INVALID_JSON', 'Failed to parse JSON string', rawData);
        }
      } else if (typeof rawData === 'object' && rawData !== null) {
        data = rawData;
      } else {
        return this.createErrorResult('INVALID_INPUT', 'Input must be a JSON string or object', rawData);
      }

      // Validate required fields
      const missingFields = this.validateRequiredFields(data);
      if (missingFields.length > 0) {
        return this.createErrorResult(
          'MISSING_FIELDS',
          `Missing required fields: ${missingFields.join(', ')}`,
          rawData
        );
      }

      // Parse and validate individual fields
      const parseResult = this.parseFields(data);
      if (!parseResult.success) {
        return parseResult;
      }

      // Additional validations
      const validationResult = this.validateParsedData(parseResult.data!);
      if (!validationResult.success) {
        return validationResult;
      }

      // Record successful parse
      this.recordParseTime(startTime);
      this.stats.successfulParses++;

      return {
        success: true,
        data: parseResult.data,
        warnings: parseResult.warnings,
        originalData: rawData,
      };

    } catch (error) {
      this.recordParseTime(startTime);
      return this.createErrorResult(
        'PARSE_EXCEPTION',
        `Unexpected parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        rawData
      );
    }
  }

  /**
   * Parse multiple market data messages in batch for high-frequency streams
   * Requirement 14.5: Handle high-frequency data streams without data loss
   */
  parseBatch(rawDataArray: any[]): ParseResult[] {
    const results: ParseResult[] = [];
    
    for (const rawData of rawDataArray) {
      results.push(this.parse(rawData));
    }

    return results;
  }

  /**
   * Parse market data with error handling and continue processing
   * Requirement 14.2: Log errors and continue processing valid data
   */
  parseWithErrorHandling(rawData: any): ParseResult {
    const result = this.parse(rawData);
    
    if (!result.success && this.config.logErrors) {
      console.error('Market data parsing error:', {
        error: result.error,
        data: result.originalData,
        timestamp: new Date().toISOString(),
      });
    }

    return result;
  }

  private validateRequiredFields(data: any): string[] {
    const missingFields: string[] = [];
    
    for (const field of this.config.requiredFields) {
      if (!(field in data) || data[field] === null || data[field] === undefined) {
        missingFields.push(field);
      }
    }

    return missingFields;
  }

  private parseFields(data: any): ParseResult {
    const warnings: string[] = [];
    const parsed: Partial<ParsedMarketData> = {};

    try {
      // Parse type field
      if (typeof data.type === 'string') {
        const validTypes = ['tick', 'quote', 'trade', 'heartbeat'];
        if (validTypes.includes(data.type)) {
          parsed.type = data.type as ParsedMarketData['type'];
        } else {
          return this.createErrorResult('INVALID_TYPE', `Invalid message type: ${data.type}`, data);
        }
      } else {
        return this.createErrorResult('INVALID_TYPE_FORMAT', 'Type must be a string', data);
      }

      // Parse symbol field
      if (typeof data.symbol === 'string' && data.symbol.trim().length > 0) {
        parsed.symbol = data.symbol.trim().toUpperCase();
      } else {
        return this.createErrorResult('INVALID_SYMBOL', 'Symbol must be a non-empty string', data);
      }

      // Parse price field
      const price = this.parseNumericField(data.price, 'price');
      if (price.error) {
        return this.createErrorResult('INVALID_PRICE', price.error, data);
      }
      parsed.price = price.value!;

      // Parse timestamp field
      const timestamp = this.parseTimestamp(data.timestamp);
      if (timestamp.error) {
        return this.createErrorResult('INVALID_TIMESTAMP', timestamp.error, data);
      }
      parsed.timestamp = timestamp.value!;

      // Parse optional numeric fields
      const optionalNumericFields = ['volume', 'bid', 'ask', 'spread', 'high', 'low', 'open', 'previousClose'];
      for (const field of optionalNumericFields) {
        if (field in data && data[field] !== null && data[field] !== undefined) {
          const result = this.parseNumericField(data[field], field);
          if (result.error) {
            if (this.config.strictMode) {
              return this.createErrorResult(`INVALID_${field.toUpperCase()}`, result.error, data);
            } else {
              warnings.push(`Invalid ${field}: ${result.error}`);
            }
          } else {
            (parsed as any)[field] = result.value;
          }
        }
      }

      // Parse source field
      if ('source' in data && typeof data.source === 'string') {
        parsed.source = data.source;
      }

      // Handle unknown fields
      if (this.config.allowUnknownFields) {
        const knownFields = new Set([
          'type', 'symbol', 'price', 'timestamp', 'volume', 'bid', 'ask', 'spread',
          'high', 'low', 'open', 'previousClose', 'source'
        ]);
        
        const unknownFields: Record<string, any> = {};
        for (const [key, value] of Object.entries(data)) {
          if (!knownFields.has(key)) {
            unknownFields[key] = value;
          }
        }

        if (Object.keys(unknownFields).length > 0) {
          parsed.metadata = unknownFields;
          if (this.config.strictMode) {
            warnings.push(`Unknown fields found: ${Object.keys(unknownFields).join(', ')}`);
          }
        }
      }

      return {
        success: true,
        data: parsed as ParsedMarketData,
        warnings: warnings.length > 0 ? warnings : undefined,
      };

    } catch (error) {
      return this.createErrorResult(
        'FIELD_PARSE_ERROR',
        `Error parsing fields: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data
      );
    }
  }

  private parseNumericField(value: any, fieldName: string): { value?: number; error?: string } {
    if (typeof value === 'number') {
      if (isNaN(value) || !isFinite(value)) {
        return { error: `${fieldName} must be a finite number` };
      }
      if (value < 0 && ['price', 'volume'].includes(fieldName)) {
        return { error: `${fieldName} cannot be negative` };
      }
      return { value: Number(value.toFixed(this.config.numericPrecision)) };
    }

    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      if (isNaN(parsed) || !isFinite(parsed)) {
        return { error: `${fieldName} string cannot be converted to number` };
      }
      if (parsed < 0 && ['price', 'volume'].includes(fieldName)) {
        return { error: `${fieldName} cannot be negative` };
      }
      return { value: Number(parsed.toFixed(this.config.numericPrecision)) };
    }

    return { error: `${fieldName} must be a number or numeric string` };
  }

  private parseTimestamp(value: any): { value?: number; error?: string } {
    let timestamp: number;

    if (typeof value === 'number') {
      timestamp = value;
    } else if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      if (isNaN(parsed)) {
        const dateTimestamp = Date.parse(value);
        if (isNaN(dateTimestamp)) {
          return { error: 'Timestamp string cannot be parsed' };
        }
        timestamp = dateTimestamp;
      } else {
        timestamp = parsed;
      }
    } else {
      return { error: 'Timestamp must be a number or string' };
    }

    // Validate timestamp range (assume milliseconds if > year 2000 in seconds)
    if (timestamp < 946684800000 && timestamp > 946684800) {
      // Convert from seconds to milliseconds
      timestamp *= 1000;
    }

    if (this.config.validateTimestamp) {
      const now = Date.now();
      const age = now - timestamp;
      
      if (age > this.config.maxTimestampAge) {
        return { error: `Timestamp is too old (${age}ms ago)` };
      }
      
      if (timestamp > now + 5000) { // Allow 5 seconds in the future
        return { error: 'Timestamp is in the future' };
      }
    }

    return { value: timestamp };
  }

  private validateParsedData(data: ParsedMarketData): ParseResult {
    const warnings: string[] = [];

    // Validate bid/ask relationship
    if (data.bid !== undefined && data.ask !== undefined) {
      if (data.bid >= data.ask) {
        if (this.config.strictMode) {
          return this.createErrorResult('INVALID_SPREAD', 'Bid price must be less than ask price', data);
        } else {
          warnings.push('Bid price is greater than or equal to ask price');
        }
      }

      // Calculate spread if not provided
      if (data.spread === undefined) {
        data.spread = Number((data.ask - data.bid).toFixed(this.config.numericPrecision));
      }
    }

    // Validate price against bid/ask
    if (data.bid !== undefined && data.price < data.bid) {
      warnings.push('Price is below bid');
    }
    if (data.ask !== undefined && data.price > data.ask) {
      warnings.push('Price is above ask');
    }

    // Validate OHLC relationships
    if (data.high !== undefined && data.low !== undefined && data.high < data.low) {
      if (this.config.strictMode) {
        return this.createErrorResult('INVALID_OHLC', 'High price must be greater than or equal to low price', data);
      } else {
        warnings.push('High price is less than low price');
      }
    }

    return {
      success: true,
      data,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  private createErrorResult(errorType: string, message: string, originalData: any): ParseResult {
    this.stats.failedParses++;
    this.stats.errorTypes[errorType] = (this.stats.errorTypes[errorType] || 0) + 1;

    return {
      success: false,
      error: message,
      originalData,
    };
  }

  private recordParseTime(startTime: number): void {
    const parseTime = performance.now() - startTime;
    this.parseTimings.push(parseTime);
    
    // Keep only last 1000 timings for average calculation
    if (this.parseTimings.length > 1000) {
      this.parseTimings.shift();
    }

    this.stats.lastParseTime = parseTime;
    this.stats.averageParseTime = this.parseTimings.reduce((a, b) => a + b, 0) / this.parseTimings.length;
  }

  /**
   * Get parser statistics for monitoring and debugging
   */
  getStats(): ParserStats {
    return { ...this.stats };
  }

  /**
   * Reset parser statistics
   */
  resetStats(): void {
    this.stats = {
      totalMessages: 0,
      successfulParses: 0,
      failedParses: 0,
      warningCount: 0,
      averageParseTime: 0,
      lastParseTime: 0,
      errorTypes: {},
    };
    this.parseTimings = [];
  }

  /**
   * Update parser configuration
   */
  updateConfig(newConfig: Partial<ParserConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current parser configuration
   */
  getConfig(): ParserConfig {
    return { ...this.config };
  }
}