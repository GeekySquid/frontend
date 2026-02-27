/**
 * Simple validation script for market data parser
 */

import { MarketDataParser, MarketDataPrettyPrinter, MarketDataValidator } from './lib/market-data';

// Test basic functionality
const parser = new MarketDataParser();
const printer = new MarketDataPrettyPrinter();
const validator = new MarketDataValidator();

// Test data
const testData = {
  type: 'tick',
  symbol: 'AAPL',
  price: 175.50,
  timestamp: Date.now(),
  volume: 1000,
  bid: 175.45,
  ask: 175.55,
};

console.log('Testing market data parser...');

// Test parsing
const parseResult = parser.parse(testData);
console.log('Parse result:', parseResult.success ? 'SUCCESS' : 'FAILED');

if (parseResult.success && parseResult.data) {
  // Test printing
  const printResult = printer.print(parseResult.data);
  console.log('Print result:', printResult.success ? 'SUCCESS' : 'FAILED');
  
  // Test round-trip validation
  const roundTripResult = printer.validateRoundTrip(parseResult.data, parser);
  console.log('Round-trip validation:', roundTripResult.success ? 'SUCCESS' : 'FAILED');
  
  // Test combined validator
  const validationResult = validator.parseAndValidate(testData);
  console.log('Combined validation:', validationResult.parseResult.success && validationResult.roundTripResult?.success ? 'SUCCESS' : 'FAILED');
}

console.log('Market data parser validation complete!');