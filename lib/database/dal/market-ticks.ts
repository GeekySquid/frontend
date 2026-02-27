// Data Access Layer - Market Ticks
// Handles database operations for market data storage and retrieval

import { DatabaseConnection, getDatabase } from '../connection';
import { MarketTick, MarketDataMessage } from '../../types/paper-trading';

export class MarketTicksDAL {
  private db: DatabaseConnection;

  constructor(db?: DatabaseConnection) {
    this.db = db || null as any;
  }

  private async getDb(): Promise<DatabaseConnection> {
    if (!this.db) {
      this.db = await getDatabase();
    }
    return this.db;
  }

  // ============================================================================
  // Market Data Storage
  // ============================================================================

  async storeTick(
    symbol: string,
    price: number,
    volume?: number,
    bid?: number,
    ask?: number,
    source: string = 'unknown',
    timestamp?: Date
  ): Promise<MarketTick> {
    const db = await this.getDb();
    
    const tickTime = timestamp || new Date();
    const spread = (bid && ask) ? ask - bid : undefined;
    
    const result = await db.queryOne<MarketTick>(
      `INSERT INTO market_ticks (symbol, price, volume, bid, ask, spread, timestamp, source)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING 
        id, symbol, price, volume, bid, ask, spread, timestamp, source,
        created_at as "createdAt"`,
      [symbol, price, volume, bid, ask, spread, tickTime, source]
    );

    if (!result) {
      throw new Error('Failed to store market tick');
    }

    return result;
  }

  async storeMultipleTicks(ticks: Array<{
    symbol: string;
    price: number;
    volume?: number;
    bid?: number;
    ask?: number;
    source?: string;
    timestamp?: Date;
  }>): Promise<MarketTick[]> {
    const db = await this.getDb();
    
    const results: MarketTick[] = [];
    
    await db.transaction(async (tx) => {
      for (const tick of ticks) {
        const tickTime = tick.timestamp || new Date();
        const spread = (tick.bid && tick.ask) ? tick.ask - tick.bid : undefined;
        
        const result = await tx.queryOne<MarketTick>(
          `INSERT INTO market_ticks (symbol, price, volume, bid, ask, spread, timestamp, source)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING 
            id, symbol, price, volume, bid, ask, spread, timestamp, source,
            created_at as "createdAt"`,
          [
            tick.symbol, tick.price, tick.volume, tick.bid, tick.ask, 
            spread, tickTime, tick.source || 'unknown'
          ]
        );
        
        if (result) {
          results.push(result);
        }
      }
    });

    return results;
  }

  async storeMarketDataMessage(message: MarketDataMessage): Promise<MarketTick> {
    return this.storeTick(
      message.symbol,
      message.price,
      message.volume,
      message.bid,
      message.ask,
      message.source,
      new Date(message.timestamp)
    );
  }

  // ============================================================================
  // Market Data Retrieval
  // ============================================================================

  async getLatestTick(symbol: string): Promise<MarketTick | null> {
    const db = await this.getDb();
    
    const result = await db.queryOne<MarketTick>(
      `SELECT 
        id, symbol, price, volume, bid, ask, spread, timestamp, source,
        created_at as "createdAt"
      FROM market_ticks 
      WHERE symbol = $1 
      ORDER BY timestamp DESC 
      LIMIT 1`,
      [symbol]
    );

    return result;
  }

  async getLatestTicks(symbols: string[]): Promise<MarketTick[]> {
    const db = await this.getDb();
    
    if (symbols.length === 0) {
      return [];
    }

    // Use DISTINCT ON to get the latest tick for each symbol
    const results = await db.query<MarketTick>(
      `SELECT DISTINCT ON (symbol)
        id, symbol, price, volume, bid, ask, spread, timestamp, source,
        created_at as "createdAt"
      FROM market_ticks 
      WHERE symbol = ANY($1)
      ORDER BY symbol, timestamp DESC`,
      [symbols]
    );

    return results;
  }

  async getTickHistory(
    symbol: string,
    startTime: Date,
    endTime: Date,
    limit?: number
  ): Promise<MarketTick[]> {
    const db = await this.getDb();
    
    let sql = `
      SELECT 
        id, symbol, price, volume, bid, ask, spread, timestamp, source,
        created_at as "createdAt"
      FROM market_ticks 
      WHERE symbol = $1 AND timestamp >= $2 AND timestamp <= $3
      ORDER BY timestamp ASC
    `;
    
    const params: any[] = [symbol, startTime, endTime];
    
    if (limit) {
      sql += ` LIMIT $4`;
      params.push(limit);
    }

    const results = await db.query<MarketTick>(sql, params);
    return results;
  }

  async getRecentTicks(
    symbol: string,
    minutes: number = 60,
    limit?: number
  ): Promise<MarketTick[]> {
    const db = await this.getDb();
    
    const startTime = new Date(Date.now() - minutes * 60 * 1000);
    
    let sql = `
      SELECT 
        id, symbol, price, volume, bid, ask, spread, timestamp, source,
        created_at as "createdAt"
      FROM market_ticks 
      WHERE symbol = $1 AND timestamp >= $2
      ORDER BY timestamp DESC
    `;
    
    const params: any[] = [symbol, startTime];
    
    if (limit) {
      sql += ` LIMIT $3`;
      params.push(limit);
    }

    const results = await db.query<MarketTick>(sql, params);
    return results;
  }

  // ============================================================================
  // Price Analysis and Statistics
  // ============================================================================

  async getPriceRange(
    symbol: string,
    startTime: Date,
    endTime: Date
  ): Promise<{
    high: number;
    low: number;
    open: number;
    close: number;
    volume: number;
    tickCount: number;
  } | null> {
    const db = await this.getDb();
    
    const result = await db.queryOne<{
      high: number;
      low: number;
      open: number;
      close: number;
      volume: number;
      tick_count: number;
    }>(
      `SELECT 
        MAX(price) as high,
        MIN(price) as low,
        (SELECT price FROM market_ticks WHERE symbol = $1 AND timestamp >= $2 AND timestamp <= $3 ORDER BY timestamp ASC LIMIT 1) as open,
        (SELECT price FROM market_ticks WHERE symbol = $1 AND timestamp >= $2 AND timestamp <= $3 ORDER BY timestamp DESC LIMIT 1) as close,
        COALESCE(SUM(volume), 0) as volume,
        COUNT(*) as tick_count
      FROM market_ticks 
      WHERE symbol = $1 AND timestamp >= $2 AND timestamp <= $3`,
      [symbol, startTime, endTime]
    );

    if (!result || result.tick_count === 0) {
      return null;
    }

    return {
      high: result.high,
      low: result.low,
      open: result.open,
      close: result.close,
      volume: result.volume,
      tickCount: result.tick_count
    };
  }

  async getVWAP(
    symbol: string,
    startTime: Date,
    endTime: Date
  ): Promise<number | null> {
    const db = await this.getDb();
    
    const result = await db.queryOne<{ vwap: number }>(
      `SELECT 
        CASE 
          WHEN SUM(volume) > 0 THEN SUM(price * volume) / SUM(volume)
          ELSE AVG(price)
        END as vwap
      FROM market_ticks 
      WHERE symbol = $1 AND timestamp >= $2 AND timestamp <= $3 AND volume > 0`,
      [symbol, startTime, endTime]
    );

    return result?.vwap || null;
  }

  async getPriceMovement(
    symbol: string,
    minutes: number = 60
  ): Promise<{
    currentPrice: number;
    previousPrice: number;
    change: number;
    changePercent: number;
    high: number;
    low: number;
  } | null> {
    const db = await this.getDb();
    
    const endTime = new Date();
    const startTime = new Date(Date.now() - minutes * 60 * 1000);
    
    const current = await this.getLatestTick(symbol);
    if (!current) {
      return null;
    }

    const range = await this.getPriceRange(symbol, startTime, endTime);
    if (!range) {
      return {
        currentPrice: current.price,
        previousPrice: current.price,
        change: 0,
        changePercent: 0,
        high: current.price,
        low: current.price
      };
    }

    const change = current.price - range.open;
    const changePercent = range.open > 0 ? (change / range.open) * 100 : 0;

    return {
      currentPrice: current.price,
      previousPrice: range.open,
      change,
      changePercent,
      high: range.high,
      low: range.low
    };
  }

  // ============================================================================
  // Data Management and Cleanup
  // ============================================================================

  async cleanupOldTicks(daysToKeep: number = 30): Promise<number> {
    const db = await this.getDb();
    
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    
    const result = await db.execute(
      'DELETE FROM market_ticks WHERE created_at < $1',
      [cutoffDate]
    );

    return result.rowCount;
  }

  async getStorageStats(): Promise<{
    totalTicks: number;
    uniqueSymbols: number;
    oldestTick: Date | null;
    newestTick: Date | null;
    averageTicksPerSymbol: number;
    storageSize: string;
  }> {
    const db = await this.getDb();
    
    const stats = await db.queryOne<{
      total_ticks: number;
      unique_symbols: number;
      oldest_tick: Date;
      newest_tick: Date;
      avg_ticks_per_symbol: number;
    }>(
      `SELECT 
        COUNT(*) as total_ticks,
        COUNT(DISTINCT symbol) as unique_symbols,
        MIN(timestamp) as oldest_tick,
        MAX(timestamp) as newest_tick,
        COUNT(*) / NULLIF(COUNT(DISTINCT symbol), 0) as avg_ticks_per_symbol
      FROM market_ticks`
    );

    // Get approximate storage size (PostgreSQL specific)
    const sizeResult = await db.queryOne<{ size: string }>(
      `SELECT pg_size_pretty(pg_total_relation_size('market_ticks')) as size`
    ).catch(() => ({ size: 'Unknown' }));

    return {
      totalTicks: stats?.total_ticks || 0,
      uniqueSymbols: stats?.unique_symbols || 0,
      oldestTick: stats?.oldest_tick || null,
      newestTick: stats?.newest_tick || null,
      averageTicksPerSymbol: Math.round(stats?.avg_ticks_per_symbol || 0),
      storageSize: sizeResult?.size || 'Unknown'
    };
  }

  async deleteSymbolData(symbol: string): Promise<number> {
    const db = await this.getDb();
    
    const result = await db.execute(
      'DELETE FROM market_ticks WHERE symbol = $1',
      [symbol]
    );

    return result.rowCount;
  }

  async deleteOldData(symbol: string, daysToKeep: number): Promise<number> {
    const db = await this.getDb();
    
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    
    const result = await db.execute(
      'DELETE FROM market_ticks WHERE symbol = $1 AND created_at < $2',
      [symbol, cutoffDate]
    );

    return result.rowCount;
  }

  // ============================================================================
  // Bulk Operations
  // ============================================================================

  async getSymbolList(): Promise<string[]> {
    const db = await this.getDb();
    
    const results = await db.query<{ symbol: string }>(
      'SELECT DISTINCT symbol FROM market_ticks ORDER BY symbol'
    );

    return results.map(r => r.symbol);
  }

  async getTickCount(symbol?: string): Promise<number> {
    const db = await this.getDb();
    
    let sql = 'SELECT COUNT(*) as count FROM market_ticks';
    const params: any[] = [];
    
    if (symbol) {
      sql += ' WHERE symbol = $1';
      params.push(symbol);
    }

    const result = await db.queryOne<{ count: number }>(sql, params);
    return result?.count || 0;
  }

  async getLatestPrices(limit: number = 100): Promise<Array<{
    symbol: string;
    price: number;
    timestamp: Date;
    source: string;
  }>> {
    const db = await this.getDb();
    
    const results = await db.query<{
      symbol: string;
      price: number;
      timestamp: Date;
      source: string;
    }>(
      `SELECT DISTINCT ON (symbol) symbol, price, timestamp, source
      FROM market_ticks 
      ORDER BY symbol, timestamp DESC
      LIMIT $1`,
      [limit]
    );

    return results;
  }

  // ============================================================================
  // Real-time Data Support
  // ============================================================================

  async getSubscribedSymbols(): Promise<string[]> {
    // In a real implementation, this might track which symbols are actively being monitored
    // For now, return symbols that have recent activity
    const db = await this.getDb();
    
    const recentTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
    
    const results = await db.query<{ symbol: string }>(
      `SELECT DISTINCT symbol 
      FROM market_ticks 
      WHERE timestamp >= $1 
      ORDER BY symbol`,
      [recentTime]
    );

    return results.map(r => r.symbol);
  }

  async updateTickIfNewer(
    symbol: string,
    price: number,
    timestamp: Date,
    volume?: number,
    bid?: number,
    ask?: number,
    source: string = 'unknown'
  ): Promise<MarketTick | null> {
    const db = await this.getDb();
    
    // Check if we already have a newer tick
    const latest = await this.getLatestTick(symbol);
    
    if (latest && latest.timestamp >= timestamp) {
      return null; // Don't store older data
    }

    return this.storeTick(symbol, price, volume, bid, ask, source, timestamp);
  }
}