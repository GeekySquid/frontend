// Data Access Layer - Paper Trades
// Handles database operations for paper trading functionality

import { DatabaseConnection, getDatabase } from '../connection';
import { 
  PaperTrade, 
  TradeOrder, 
  TradeQuery,
  TradeStatus,
  TradeSide,
  OrderType 
} from '../../types/paper-trading';

export class PaperTradesDAL {
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
  // Trade Creation and Management
  // ============================================================================

  async createTrade(order: TradeOrder, currentPrice: number): Promise<PaperTrade> {
    const db = await this.getDb();
    
    const entryPrice = order.orderType === 'market' ? currentPrice : (order.limitPrice || currentPrice);
    
    const result = await db.queryOne<PaperTrade>(
      `INSERT INTO paper_trades (
        user_id, session_id, symbol, side, quantity, entry_price, entry_time,
        status, order_type, limit_price, stop_loss, take_profit
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), 'open', $7, $8, $9, $10)
      RETURNING 
        id, user_id as "userId", session_id as "sessionId", symbol, side, quantity,
        entry_price as "entryPrice", entry_time as "entryTime",
        exit_price as "exitPrice", exit_time as "exitTime", status,
        order_type as "orderType", limit_price as "limitPrice",
        stop_loss as "stopLoss", take_profit as "takeProfit",
        pnl_amount as "pnlAmount", pnl_percentage as "pnlPercentage",
        max_favorable_excursion as "maxFavorableExcursion",
        max_adverse_excursion as "maxAdverseExcursion",
        holding_period as "holdingPeriod",
        created_at as "createdAt", updated_at as "updatedAt"`,
      [
        order.userId, order.sessionId, order.symbol, order.side, order.quantity,
        entryPrice, order.orderType, order.limitPrice, order.stopLoss, order.takeProfit
      ]
    );

    if (!result) {
      throw new Error('Failed to create paper trade');
    }

    return result;
  }

  async closeTrade(
    tradeId: string, 
    exitPrice: number, 
    exitTime?: Date
  ): Promise<PaperTrade> {
    const db = await this.getDb();
    
    const trade = await this.getTradeById(tradeId);
    if (!trade) {
      throw new Error('Trade not found');
    }

    if (trade.status !== 'open') {
      throw new Error('Trade is not open');
    }

    // Calculate P&L
    const pnlAmount = this.calculatePnL(trade, exitPrice);
    const pnlPercentage = (pnlAmount / (trade.entryPrice * trade.quantity)) * 100;
    
    // Calculate holding period
    const holdingPeriod = Math.floor(
      ((exitTime || new Date()).getTime() - trade.entryTime.getTime()) / 1000
    );

    const result = await db.queryOne<PaperTrade>(
      `UPDATE paper_trades 
      SET 
        exit_price = $2,
        exit_time = $3,
        status = 'closed',
        pnl_amount = $4,
        pnl_percentage = $5,
        holding_period = $6,
        updated_at = NOW()
      WHERE id = $1
      RETURNING 
        id, user_id as "userId", session_id as "sessionId", symbol, side, quantity,
        entry_price as "entryPrice", entry_time as "entryTime",
        exit_price as "exitPrice", exit_time as "exitTime", status,
        order_type as "orderType", limit_price as "limitPrice",
        stop_loss as "stopLoss", take_profit as "takeProfit",
        pnl_amount as "pnlAmount", pnl_percentage as "pnlPercentage",
        max_favorable_excursion as "maxFavorableExcursion",
        max_adverse_excursion as "maxAdverseExcursion",
        holding_period as "holdingPeriod",
        created_at as "createdAt", updated_at as "updatedAt"`,
      [tradeId, exitPrice, exitTime || new Date(), pnlAmount, pnlPercentage, holdingPeriod]
    );

    if (!result) {
      throw new Error('Failed to close trade');
    }

    return result;
  }

  async cancelTrade(tradeId: string): Promise<PaperTrade> {
    const db = await this.getDb();
    
    const result = await db.queryOne<PaperTrade>(
      `UPDATE paper_trades 
      SET 
        status = 'cancelled',
        updated_at = NOW()
      WHERE id = $1 AND status = 'open'
      RETURNING 
        id, user_id as "userId", session_id as "sessionId", symbol, side, quantity,
        entry_price as "entryPrice", entry_time as "entryTime",
        exit_price as "exitPrice", exit_time as "exitTime", status,
        order_type as "orderType", limit_price as "limitPrice",
        stop_loss as "stopLoss", take_profit as "takeProfit",
        pnl_amount as "pnlAmount", pnl_percentage as "pnlPercentage",
        max_favorable_excursion as "maxFavorableExcursion",
        max_adverse_excursion as "maxAdverseExcursion",
        holding_period as "holdingPeriod",
        created_at as "createdAt", updated_at as "updatedAt"`,
      [tradeId]
    );

    if (!result) {
      throw new Error('Failed to cancel trade or trade not found');
    }

    return result;
  }

  // ============================================================================
  // Trade Retrieval
  // ============================================================================

  async getTradeById(tradeId: string): Promise<PaperTrade | null> {
    const db = await this.getDb();
    
    const result = await db.queryOne<PaperTrade>(
      `SELECT 
        id, user_id as "userId", session_id as "sessionId", symbol, side, quantity,
        entry_price as "entryPrice", entry_time as "entryTime",
        exit_price as "exitPrice", exit_time as "exitTime", status,
        order_type as "orderType", limit_price as "limitPrice",
        stop_loss as "stopLoss", take_profit as "takeProfit",
        pnl_amount as "pnlAmount", pnl_percentage as "pnlPercentage",
        max_favorable_excursion as "maxFavorableExcursion",
        max_adverse_excursion as "maxAdverseExcursion",
        holding_period as "holdingPeriod",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM paper_trades 
      WHERE id = $1`,
      [tradeId]
    );

    return result;
  }

  async getTrades(query: TradeQuery): Promise<PaperTrade[]> {
    const db = await this.getDb();
    
    let sql = `
      SELECT 
        id, user_id as "userId", session_id as "sessionId", symbol, side, quantity,
        entry_price as "entryPrice", entry_time as "entryTime",
        exit_price as "exitPrice", exit_time as "exitTime", status,
        order_type as "orderType", limit_price as "limitPrice",
        stop_loss as "stopLoss", take_profit as "takeProfit",
        pnl_amount as "pnlAmount", pnl_percentage as "pnlPercentage",
        max_favorable_excursion as "maxFavorableExcursion",
        max_adverse_excursion as "maxAdverseExcursion",
        holding_period as "holdingPeriod",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM paper_trades 
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramIndex = 1;

    if (query.userId) {
      sql += ` AND user_id = $${paramIndex++}`;
      params.push(query.userId);
    }

    if (query.sessionId) {
      sql += ` AND session_id = $${paramIndex++}`;
      params.push(query.sessionId);
    }

    if (query.symbol) {
      sql += ` AND symbol = $${paramIndex++}`;
      params.push(query.symbol);
    }

    if (query.status) {
      sql += ` AND status = $${paramIndex++}`;
      params.push(query.status);
    }

    if (query.startDate) {
      sql += ` AND entry_time >= $${paramIndex++}`;
      params.push(query.startDate);
    }

    if (query.endDate) {
      sql += ` AND entry_time <= $${paramIndex++}`;
      params.push(query.endDate);
    }

    // Add sorting
    const sortBy = query.sortBy || 'entry_time';
    const sortOrder = query.sortOrder || 'desc';
    sql += ` ORDER BY ${sortBy} ${sortOrder}`;

    // Add pagination
    if (query.limit) {
      sql += ` LIMIT $${paramIndex++}`;
      params.push(query.limit);
    }

    if (query.offset) {
      sql += ` OFFSET $${paramIndex++}`;
      params.push(query.offset);
    }

    const results = await db.query<PaperTrade>(sql, params);
    return results;
  }

  async getOpenTrades(userId: string): Promise<PaperTrade[]> {
    return this.getTrades({
      userId,
      status: 'open',
      sortBy: 'entry_time',
      sortOrder: 'desc'
    });
  }

  async getTradesBySession(sessionId: string): Promise<PaperTrade[]> {
    return this.getTrades({
      sessionId,
      sortBy: 'entry_time',
      sortOrder: 'asc'
    });
  }

  // ============================================================================
  // MFE/MAE Tracking
  // ============================================================================

  async updateMFEMAE(
    tradeId: string, 
    currentPrice: number
  ): Promise<void> {
    const db = await this.getDb();
    
    const trade = await this.getTradeById(tradeId);
    if (!trade || trade.status !== 'open') {
      return;
    }

    const currentPnL = this.calculatePnL(trade, currentPrice);
    
    // Update MFE (Maximum Favorable Excursion) - highest profit
    // Update MAE (Maximum Adverse Excursion) - lowest profit (highest loss)
    await db.execute(
      `UPDATE paper_trades 
      SET 
        max_favorable_excursion = GREATEST(max_favorable_excursion, $2),
        max_adverse_excursion = LEAST(max_adverse_excursion, $2),
        updated_at = NOW()
      WHERE id = $1`,
      [tradeId, currentPnL]
    );
  }

  async batchUpdateMFEMAE(
    trades: Array<{ tradeId: string; currentPrice: number }>
  ): Promise<void> {
    const db = await this.getDb();
    
    await db.transaction(async (tx) => {
      for (const { tradeId, currentPrice } of trades) {
        const trade = await this.getTradeById(tradeId);
        if (trade && trade.status === 'open') {
          const currentPnL = this.calculatePnL(trade, currentPrice);
          
          await tx.execute(
            `UPDATE paper_trades 
            SET 
              max_favorable_excursion = GREATEST(max_favorable_excursion, $2),
              max_adverse_excursion = LEAST(max_adverse_excursion, $2),
              updated_at = NOW()
            WHERE id = $1`,
            [tradeId, currentPnL]
          );
        }
      }
    });
  }

  // ============================================================================
  // Trade Statistics
  // ============================================================================

  async getTradeStats(userId: string, days?: number): Promise<{
    totalTrades: number;
    openTrades: number;
    closedTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    totalPnL: number;
    averageWin: number;
    averageLoss: number;
    largestWin: number;
    largestLoss: number;
    averageHoldTime: number;
  }> {
    const db = await this.getDb();
    
    let dateFilter = '';
    const params: any[] = [userId];
    
    if (days) {
      dateFilter = 'AND entry_time >= NOW() - INTERVAL $2 DAY';
      params.push(days);
    }

    const stats = await db.queryOne<{
      total_trades: number;
      open_trades: number;
      closed_trades: number;
      winning_trades: number;
      losing_trades: number;
      total_pnl: number;
      avg_win: number;
      avg_loss: number;
      largest_win: number;
      largest_loss: number;
      avg_hold_time: number;
    }>(
      `SELECT 
        COUNT(*) as total_trades,
        COUNT(*) FILTER (WHERE status = 'open') as open_trades,
        COUNT(*) FILTER (WHERE status = 'closed') as closed_trades,
        COUNT(*) FILTER (WHERE status = 'closed' AND pnl_amount > 0) as winning_trades,
        COUNT(*) FILTER (WHERE status = 'closed' AND pnl_amount < 0) as losing_trades,
        COALESCE(SUM(pnl_amount) FILTER (WHERE status = 'closed'), 0) as total_pnl,
        COALESCE(AVG(pnl_amount) FILTER (WHERE status = 'closed' AND pnl_amount > 0), 0) as avg_win,
        COALESCE(AVG(pnl_amount) FILTER (WHERE status = 'closed' AND pnl_amount < 0), 0) as avg_loss,
        COALESCE(MAX(pnl_amount) FILTER (WHERE status = 'closed'), 0) as largest_win,
        COALESCE(MIN(pnl_amount) FILTER (WHERE status = 'closed'), 0) as largest_loss,
        COALESCE(AVG(holding_period) FILTER (WHERE status = 'closed'), 0) as avg_hold_time
      FROM paper_trades 
      WHERE user_id = $1 ${dateFilter}`,
      params
    );

    if (!stats) {
      return {
        totalTrades: 0,
        openTrades: 0,
        closedTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        totalPnL: 0,
        averageWin: 0,
        averageLoss: 0,
        largestWin: 0,
        largestLoss: 0,
        averageHoldTime: 0
      };
    }

    return {
      totalTrades: stats.total_trades,
      openTrades: stats.open_trades,
      closedTrades: stats.closed_trades,
      winningTrades: stats.winning_trades,
      losingTrades: stats.losing_trades,
      winRate: stats.closed_trades > 0 
        ? (stats.winning_trades / stats.closed_trades) * 100 
        : 0,
      totalPnL: Number(stats.total_pnl),
      averageWin: Number(stats.avg_win),
      averageLoss: Number(stats.avg_loss),
      largestWin: Number(stats.largest_win),
      largestLoss: Number(stats.largest_loss),
      averageHoldTime: Math.round(stats.avg_hold_time)
    };
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private calculatePnL(trade: PaperTrade, currentPrice: number): number {
    const multiplier = trade.side === 'buy' ? 1 : -1;
    return (currentPrice - trade.entryPrice) * trade.quantity * multiplier;
  }

  async getTradeCount(query: Partial<TradeQuery>): Promise<number> {
    const db = await this.getDb();
    
    let sql = 'SELECT COUNT(*) as count FROM paper_trades WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (query.userId) {
      sql += ` AND user_id = $${paramIndex++}`;
      params.push(query.userId);
    }

    if (query.sessionId) {
      sql += ` AND session_id = $${paramIndex++}`;
      params.push(query.sessionId);
    }

    if (query.status) {
      sql += ` AND status = $${paramIndex++}`;
      params.push(query.status);
    }

    const result = await db.queryOne<{ count: number }>(sql, params);
    return result?.count || 0;
  }

  async deleteTrade(tradeId: string): Promise<void> {
    const db = await this.getDb();
    
    await db.execute(
      'DELETE FROM paper_trades WHERE id = $1',
      [tradeId]
    );
  }

  async deleteUserTrades(userId: string): Promise<void> {
    const db = await this.getDb();
    
    await db.execute(
      'DELETE FROM paper_trades WHERE user_id = $1',
      [userId]
    );
  }
}