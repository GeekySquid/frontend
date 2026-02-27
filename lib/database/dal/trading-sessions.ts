// Data Access Layer - Trading Sessions
// Handles database operations for trading session management

import { DatabaseConnection, getDatabase } from '../connection';
import { 
  TradingSession, 
  SessionSummary, 
  SessionStatus,
  SessionQuery 
} from '../../types/paper-trading';

export class TradingSessionsDAL {
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
  // Session Management
  // ============================================================================

  async createSession(userId: string): Promise<TradingSession> {
    const db = await this.getDb();
    
    // End any existing active sessions for this user
    await this.endActiveSessions(userId);
    
    const result = await db.queryOne<TradingSession>(
      `INSERT INTO trading_sessions (
        user_id, start_time, status, trade_count, win_count, loss_count,
        total_pnl, win_rate, average_win, average_loss, largest_win, largest_loss,
        average_hold_time, total_volume, unique_symbols
      ) VALUES ($1, NOW(), 'active', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ARRAY[]::TEXT[])
      RETURNING 
        id, user_id as "userId", start_time as "startTime", end_time as "endTime",
        status, trade_count as "tradeCount", win_count as "winCount", loss_count as "lossCount",
        total_pnl as "totalPnl", win_rate as "winRate", average_win as "averageWin",
        average_loss as "averageLoss", largest_win as "largestWin", largest_loss as "largestLoss",
        average_hold_time as "averageHoldTime", total_volume as "totalVolume",
        unique_symbols as "uniqueSymbols", created_at as "createdAt", updated_at as "updatedAt"`,
      [userId]
    );

    if (!result) {
      throw new Error('Failed to create trading session');
    }

    return result;
  }

  async getSessionById(sessionId: string): Promise<TradingSession | null> {
    const db = await this.getDb();
    
    const result = await db.queryOne<TradingSession>(
      `SELECT 
        id, user_id as "userId", start_time as "startTime", end_time as "endTime",
        status, trade_count as "tradeCount", win_count as "winCount", loss_count as "lossCount",
        total_pnl as "totalPnl", win_rate as "winRate", average_win as "averageWin",
        average_loss as "averageLoss", largest_win as "largestWin", largest_loss as "largestLoss",
        average_hold_time as "averageHoldTime", total_volume as "totalVolume",
        unique_symbols as "uniqueSymbols", created_at as "createdAt", updated_at as "updatedAt"
      FROM trading_sessions 
      WHERE id = $1`,
      [sessionId]
    );

    return result;
  }

  async getCurrentSession(userId: string): Promise<TradingSession | null> {
    const db = await this.getDb();
    
    const result = await db.queryOne<TradingSession>(
      `SELECT 
        id, user_id as "userId", start_time as "startTime", end_time as "endTime",
        status, trade_count as "tradeCount", win_count as "winCount", loss_count as "lossCount",
        total_pnl as "totalPnl", win_rate as "winRate", average_win as "averageWin",
        average_loss as "averageLoss", largest_win as "largestWin", largest_loss as "largestLoss",
        average_hold_time as "averageHoldTime", total_volume as "totalVolume",
        unique_symbols as "uniqueSymbols", created_at as "createdAt", updated_at as "updatedAt"
      FROM trading_sessions 
      WHERE user_id = $1 AND status = 'active'
      ORDER BY start_time DESC
      LIMIT 1`,
      [userId]
    );

    return result;
  }

  async endSession(sessionId: string): Promise<TradingSession> {
    const db = await this.getDb();
    
    const result = await db.queryOne<TradingSession>(
      `UPDATE trading_sessions 
      SET 
        status = 'completed',
        end_time = NOW(),
        updated_at = NOW()
      WHERE id = $1 AND status = 'active'
      RETURNING 
        id, user_id as "userId", start_time as "startTime", end_time as "endTime",
        status, trade_count as "tradeCount", win_count as "winCount", loss_count as "lossCount",
        total_pnl as "totalPnl", win_rate as "winRate", average_win as "averageWin",
        average_loss as "averageLoss", largest_win as "largestWin", largest_loss as "largestLoss",
        average_hold_time as "averageHoldTime", total_volume as "totalVolume",
        unique_symbols as "uniqueSymbols", created_at as "createdAt", updated_at as "updatedAt"`,
      [sessionId]
    );

    if (!result) {
      throw new Error('Session not found or already ended');
    }

    return result;
  }

  async pauseSession(sessionId: string): Promise<TradingSession> {
    const db = await this.getDb();
    
    const result = await db.queryOne<TradingSession>(
      `UPDATE trading_sessions 
      SET 
        status = 'paused',
        updated_at = NOW()
      WHERE id = $1 AND status = 'active'
      RETURNING 
        id, user_id as "userId", start_time as "startTime", end_time as "endTime",
        status, trade_count as "tradeCount", win_count as "winCount", loss_count as "lossCount",
        total_pnl as "totalPnl", win_rate as "winRate", average_win as "averageWin",
        average_loss as "averageLoss", largest_win as "largestWin", largest_loss as "largestLoss",
        average_hold_time as "averageHoldTime", total_volume as "totalVolume",
        unique_symbols as "uniqueSymbols", created_at as "createdAt", updated_at as "updatedAt"`,
      [sessionId]
    );

    if (!result) {
      throw new Error('Session not found or not active');
    }

    return result;
  }

  async resumeSession(sessionId: string): Promise<TradingSession> {
    const db = await this.getDb();
    
    const result = await db.queryOne<TradingSession>(
      `UPDATE trading_sessions 
      SET 
        status = 'active',
        updated_at = NOW()
      WHERE id = $1 AND status = 'paused'
      RETURNING 
        id, user_id as "userId", start_time as "startTime", end_time as "endTime",
        status, trade_count as "tradeCount", win_count as "winCount", loss_count as "lossCount",
        total_pnl as "totalPnl", win_rate as "winRate", average_win as "averageWin",
        average_loss as "averageLoss", largest_win as "largestWin", largest_loss as "largestLoss",
        average_hold_time as "averageHoldTime", total_volume as "totalVolume",
        unique_symbols as "uniqueSymbols", created_at as "createdAt", updated_at as "updatedAt"`,
      [sessionId]
    );

    if (!result) {
      throw new Error('Session not found or not paused');
    }

    return result;
  }

  // ============================================================================
  // Session Statistics Updates
  // ============================================================================

  async updateSessionStats(
    sessionId: string,
    tradeData: {
      pnlAmount: number;
      holdingPeriod: number;
      volume: number;
      symbol: string;
    }
  ): Promise<void> {
    const db = await this.getDb();
    
    const session = await this.getSessionById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const isWin = tradeData.pnlAmount > 0;
    const isLoss = tradeData.pnlAmount < 0;
    
    // Calculate new statistics
    const newTradeCount = session.tradeCount + 1;
    const newWinCount = session.winCount + (isWin ? 1 : 0);
    const newLossCount = session.lossCount + (isLoss ? 1 : 0);
    const newTotalPnl = session.totalPnl + tradeData.pnlAmount;
    const newWinRate = newTradeCount > 0 ? (newWinCount / newTradeCount) * 100 : 0;
    
    // Calculate average win/loss
    const newAverageWin = newWinCount > 0 
      ? ((session.averageWin * session.winCount) + (isWin ? tradeData.pnlAmount : 0)) / newWinCount
      : 0;
    
    const newAverageLoss = newLossCount > 0 
      ? ((session.averageLoss * session.lossCount) + (isLoss ? tradeData.pnlAmount : 0)) / newLossCount
      : 0;
    
    // Update largest win/loss
    const newLargestWin = Math.max(session.largestWin, isWin ? tradeData.pnlAmount : 0);
    const newLargestLoss = Math.min(session.largestLoss, isLoss ? tradeData.pnlAmount : 0);
    
    // Calculate average hold time
    const newAverageHoldTime = 
      ((session.averageHoldTime * session.tradeCount) + tradeData.holdingPeriod) / newTradeCount;
    
    // Update total volume
    const newTotalVolume = session.totalVolume + tradeData.volume;
    
    // Update unique symbols
    const uniqueSymbols = [...new Set([...session.uniqueSymbols, tradeData.symbol])];

    await db.execute(
      `UPDATE trading_sessions 
      SET 
        trade_count = $2,
        win_count = $3,
        loss_count = $4,
        total_pnl = $5,
        win_rate = $6,
        average_win = $7,
        average_loss = $8,
        largest_win = $9,
        largest_loss = $10,
        average_hold_time = $11,
        total_volume = $12,
        unique_symbols = $13,
        updated_at = NOW()
      WHERE id = $1`,
      [
        sessionId, newTradeCount, newWinCount, newLossCount, newTotalPnl,
        newWinRate, newAverageWin, newAverageLoss, newLargestWin, newLargestLoss,
        newAverageHoldTime, newTotalVolume, uniqueSymbols
      ]
    );
  }

  // ============================================================================
  // Session Queries
  // ============================================================================

  async getSessions(query: SessionQuery): Promise<TradingSession[]> {
    const db = await this.getDb();
    
    let sql = `
      SELECT 
        id, user_id as "userId", start_time as "startTime", end_time as "endTime",
        status, trade_count as "tradeCount", win_count as "winCount", loss_count as "lossCount",
        total_pnl as "totalPnl", win_rate as "winRate", average_win as "averageWin",
        average_loss as "averageLoss", largest_win as "largestWin", largest_loss as "largestLoss",
        average_hold_time as "averageHoldTime", total_volume as "totalVolume",
        unique_symbols as "uniqueSymbols", created_at as "createdAt", updated_at as "updatedAt"
      FROM trading_sessions 
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramIndex = 1;

    if (query.userId) {
      sql += ` AND user_id = $${paramIndex++}`;
      params.push(query.userId);
    }

    if (query.status) {
      sql += ` AND status = $${paramIndex++}`;
      params.push(query.status);
    }

    if (query.startDate) {
      sql += ` AND start_time >= $${paramIndex++}`;
      params.push(query.startDate);
    }

    if (query.endDate) {
      sql += ` AND start_time <= $${paramIndex++}`;
      params.push(query.endDate);
    }

    sql += ' ORDER BY start_time DESC';

    if (query.limit) {
      sql += ` LIMIT $${paramIndex++}`;
      params.push(query.limit);
    }

    if (query.offset) {
      sql += ` OFFSET $${paramIndex++}`;
      params.push(query.offset);
    }

    const results = await db.query<TradingSession>(sql, params);
    return results;
  }

  async getSessionHistory(userId: string, limit: number = 10): Promise<TradingSession[]> {
    return this.getSessions({
      userId,
      status: 'completed',
      limit
    });
  }

  async getActiveSession(userId: string): Promise<TradingSession | null> {
    const sessions = await this.getSessions({
      userId,
      status: 'active',
      limit: 1
    });
    
    return sessions.length > 0 ? sessions[0] : null;
  }

  // ============================================================================
  // Session Analytics
  // ============================================================================

  async generateSessionSummary(sessionId: string): Promise<SessionSummary> {
    const db = await this.getDb();
    
    const session = await this.getSessionById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Get best and worst trades for this session
    const bestTrade = await db.queryOne<any>(
      `SELECT 
        id, symbol, side, quantity, entry_price as "entryPrice", exit_price as "exitPrice",
        pnl_amount as "pnlAmount", pnl_percentage as "pnlPercentage"
      FROM paper_trades 
      WHERE session_id = $1 AND status = 'closed' AND pnl_amount IS NOT NULL
      ORDER BY pnl_amount DESC 
      LIMIT 1`,
      [sessionId]
    );

    const worstTrade = await db.queryOne<any>(
      `SELECT 
        id, symbol, side, quantity, entry_price as "entryPrice", exit_price as "exitPrice",
        pnl_amount as "pnlAmount", pnl_percentage as "pnlPercentage"
      FROM paper_trades 
      WHERE session_id = $1 AND status = 'closed' AND pnl_amount IS NOT NULL
      ORDER BY pnl_amount ASC 
      LIMIT 1`,
      [sessionId]
    );

    // Calculate session duration
    const duration = session.endTime 
      ? Math.floor((session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60))
      : Math.floor((new Date().getTime() - session.startTime.getTime()) / (1000 * 60));

    // Generate learning insights based on session performance
    const learningInsights = this.generateLearningInsights(session);

    return {
      sessionId: session.id,
      duration,
      totalTrades: session.tradeCount,
      profitableTrades: session.winCount,
      winRate: session.winRate,
      totalPnl: session.totalPnl,
      bestTrade: bestTrade || null,
      worstTrade: worstTrade || null,
      averageHoldTime: session.averageHoldTime,
      symbolsTraded: session.uniqueSymbols,
      learningInsights
    };
  }

  private generateLearningInsights(session: TradingSession): string[] {
    const insights: string[] = [];

    // Win rate insights
    if (session.winRate > 70) {
      insights.push('Excellent win rate! You\'re making consistently good trading decisions.');
    } else if (session.winRate > 50) {
      insights.push('Good win rate. Focus on improving your entry and exit timing.');
    } else if (session.winRate < 40) {
      insights.push('Consider reviewing your trading strategy and risk management approach.');
    }

    // Risk-reward insights
    if (session.winCount > 0 && session.lossCount > 0) {
      const riskRewardRatio = Math.abs(session.averageWin / session.averageLoss);
      if (riskRewardRatio > 2) {
        insights.push('Great risk-reward ratio! Your winners are significantly larger than your losers.');
      } else if (riskRewardRatio < 1) {
        insights.push('Consider improving your risk-reward ratio by letting winners run longer or cutting losses sooner.');
      }
    }

    // Hold time insights
    if (session.averageHoldTime < 300) { // Less than 5 minutes
      insights.push('You tend to hold positions for very short periods. Consider if you\'re giving trades enough time to develop.');
    } else if (session.averageHoldTime > 3600) { // More than 1 hour
      insights.push('You hold positions for extended periods. Make sure you\'re not holding losing positions too long.');
    }

    // Diversification insights
    if (session.uniqueSymbols.length === 1) {
      insights.push('Consider diversifying across multiple symbols to spread risk.');
    } else if (session.uniqueSymbols.length > 10) {
      insights.push('You traded many different symbols. Focus on fewer, well-researched opportunities.');
    }

    return insights;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private async endActiveSessions(userId: string): Promise<void> {
    const db = await this.getDb();
    
    await db.execute(
      `UPDATE trading_sessions 
      SET 
        status = 'completed',
        end_time = NOW(),
        updated_at = NOW()
      WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );
  }

  async getSessionCount(query: Partial<SessionQuery>): Promise<number> {
    const db = await this.getDb();
    
    let sql = 'SELECT COUNT(*) as count FROM trading_sessions WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (query.userId) {
      sql += ` AND user_id = $${paramIndex++}`;
      params.push(query.userId);
    }

    if (query.status) {
      sql += ` AND status = $${paramIndex++}`;
      params.push(query.status);
    }

    const result = await db.queryOne<{ count: number }>(sql, params);
    return result?.count || 0;
  }

  async deleteSession(sessionId: string): Promise<void> {
    const db = await this.getDb();
    
    // Note: This will cascade delete all trades in the session due to foreign key constraint
    await db.execute(
      'DELETE FROM trading_sessions WHERE id = $1',
      [sessionId]
    );
  }

  async deleteUserSessions(userId: string): Promise<void> {
    const db = await this.getDb();
    
    await db.execute(
      'DELETE FROM trading_sessions WHERE user_id = $1',
      [userId]
    );
  }
}