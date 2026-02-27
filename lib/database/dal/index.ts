// Data Access Layer - Index
// Exports all DAL classes and provides a unified database service

export { UserQualificationsDAL } from './user-qualifications';
export { PaperTradesDAL } from './paper-trades';
export { TradingSessionsDAL } from './trading-sessions';
export { TradeAnalyticsDAL } from './trade-analytics';
export { MarketTicksDAL } from './market-ticks';

// Re-export database connection utilities
export { 
  getDatabase, 
  initializeDatabase, 
  checkDatabaseHealth,
  closeDatabaseConnection,
  type DatabaseConnection 
} from '../connection';

// Re-export all types
export * from '../../types/paper-trading';

import { DatabaseConnection, getDatabase } from '../connection';
import { UserQualificationsDAL } from './user-qualifications';
import { PaperTradesDAL } from './paper-trades';
import { TradingSessionsDAL } from './trading-sessions';
import { TradeAnalyticsDAL } from './trade-analytics';
import { MarketTicksDAL } from './market-ticks';

/**
 * Unified Database Service
 * Provides a single interface to all data access layers
 */
export class DatabaseService {
  private db: DatabaseConnection;
  
  public readonly userQualifications: UserQualificationsDAL;
  public readonly paperTrades: PaperTradesDAL;
  public readonly tradingSessions: TradingSessionsDAL;
  public readonly tradeAnalytics: TradeAnalyticsDAL;
  public readonly marketTicks: MarketTicksDAL;

  constructor(db?: DatabaseConnection) {
    this.db = db || null as any;
    
    // Initialize all DAL instances with the same database connection
    this.userQualifications = new UserQualificationsDAL(this.db);
    this.paperTrades = new PaperTradesDAL(this.db);
    this.tradingSessions = new TradingSessionsDAL(this.db);
    this.tradeAnalytics = new TradeAnalyticsDAL(this.db);
    this.marketTicks = new MarketTicksDAL(this.db);
  }

  /**
   * Initialize the database service
   */
  static async create(): Promise<DatabaseService> {
    const db = await getDatabase();
    return new DatabaseService(db);
  }

  /**
   * Get the underlying database connection
   */
  async getConnection(): Promise<DatabaseConnection> {
    if (!this.db) {
      this.db = await getDatabase();
    }
    return this.db;
  }

  /**
   * Execute a transaction across multiple DAL operations
   */
  async transaction<T>(callback: (service: DatabaseService) => Promise<T>): Promise<T> {
    const db = await this.getConnection();
    
    return db.transaction(async (txDb) => {
      const txService = new DatabaseService(txDb);
      return callback(txService);
    });
  }

  /**
   * Health check for all database components
   */
  async healthCheck(): Promise<{
    overall: boolean;
    components: {
      connection: boolean;
      userQualifications: boolean;
      paperTrades: boolean;
      tradingSessions: boolean;
      tradeAnalytics: boolean;
      marketTicks: boolean;
    };
    message: string;
  }> {
    try {
      const db = await this.getConnection();
      
      // Test basic connection
      await db.query('SELECT 1 as test');
      
      // Test each table exists and is accessible
      const tests = {
        connection: true,
        userQualifications: false,
        paperTrades: false,
        tradingSessions: false,
        tradeAnalytics: false,
        marketTicks: false
      };

      try {
        await db.query('SELECT COUNT(*) FROM user_qualifications LIMIT 1');
        tests.userQualifications = true;
      } catch (e) {
        console.warn('user_qualifications table check failed:', e);
      }

      try {
        await db.query('SELECT COUNT(*) FROM paper_trades LIMIT 1');
        tests.paperTrades = true;
      } catch (e) {
        console.warn('paper_trades table check failed:', e);
      }

      try {
        await db.query('SELECT COUNT(*) FROM trading_sessions LIMIT 1');
        tests.tradingSessions = true;
      } catch (e) {
        console.warn('trading_sessions table check failed:', e);
      }

      try {
        await db.query('SELECT COUNT(*) FROM trade_analytics LIMIT 1');
        tests.tradeAnalytics = true;
      } catch (e) {
        console.warn('trade_analytics table check failed:', e);
      }

      try {
        await db.query('SELECT COUNT(*) FROM market_ticks LIMIT 1');
        tests.marketTicks = true;
      } catch (e) {
        console.warn('market_ticks table check failed:', e);
      }

      const allHealthy = Object.values(tests).every(Boolean);
      
      return {
        overall: allHealthy,
        components: tests,
        message: allHealthy 
          ? 'All database components are healthy'
          : 'Some database components are not accessible'
      };
    } catch (error) {
      return {
        overall: false,
        components: {
          connection: false,
          userQualifications: false,
          paperTrades: false,
          tradingSessions: false,
          tradeAnalytics: false,
          marketTicks: false
        },
        message: `Database health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    totalUsers: number;
    qualifiedUsers: number;
    totalTrades: number;
    activeSessions: number;
    totalAnalytics: number;
    totalTicks: number;
    uniqueSymbols: number;
  }> {
    try {
      const [
        userStats,
        tradeCount,
        sessionCount,
        analyticsCount,
        tickStats
      ] = await Promise.all([
        this.userQualifications.getQualificationStats(),
        this.paperTrades.getTradeCount({}),
        this.tradingSessions.getSessionCount({ status: 'active' }),
        this.tradeAnalytics.getAnalyticsCount({}),
        this.marketTicks.getStorageStats()
      ]);

      return {
        totalUsers: userStats.totalUsers,
        qualifiedUsers: userStats.qualifiedUsers,
        totalTrades: tradeCount,
        activeSessions: sessionCount,
        totalAnalytics: analyticsCount,
        totalTicks: tickStats.totalTicks,
        uniqueSymbols: tickStats.uniqueSymbols
      };
    } catch (error) {
      console.error('Failed to get database stats:', error);
      return {
        totalUsers: 0,
        qualifiedUsers: 0,
        totalTrades: 0,
        activeSessions: 0,
        totalAnalytics: 0,
        totalTicks: 0,
        uniqueSymbols: 0
      };
    }
  }

  /**
   * Clean up old data across all tables
   */
  async cleanup(options: {
    tickRetentionDays?: number;
    analyticsRetentionDays?: number;
    completedSessionRetentionDays?: number;
  } = {}): Promise<{
    ticksDeleted: number;
    analyticsDeleted: number;
    sessionsDeleted: number;
  }> {
    const {
      tickRetentionDays = 30,
      analyticsRetentionDays = 90,
      completedSessionRetentionDays = 365
    } = options;

    try {
      const [ticksDeleted] = await Promise.all([
        this.marketTicks.cleanupOldTicks(tickRetentionDays)
      ]);

      // For analytics and sessions, we'd need to implement cleanup methods
      // For now, return 0 for those
      return {
        ticksDeleted,
        analyticsDeleted: 0,
        sessionsDeleted: 0
      };
    } catch (error) {
      console.error('Database cleanup failed:', error);
      throw error;
    }
  }
}

// Singleton instance for easy access
let dbService: DatabaseService | null = null;

/**
 * Get the singleton database service instance
 */
export async function getDatabaseService(): Promise<DatabaseService> {
  if (!dbService) {
    dbService = await DatabaseService.create();
  }
  return dbService;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetDatabaseService(): void {
  dbService = null;
}