// Data Access Layer - Trade Analytics
// Handles database operations for trade analytics and learning insights

import { DatabaseConnection, getDatabase } from '../connection';
import { 
  TradeAnalytics, 
  FinancialMetrics,
  TimingMetrics,
  LearningScores,
  MissedOpportunity,
  AnalyticsQuery 
} from '../../types/paper-trading';

export class TradeAnalyticsDAL {
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
  // Analytics Creation and Updates
  // ============================================================================

  async createTradeAnalytics(
    tradeId: string,
    userId: string,
    financialMetrics: FinancialMetrics,
    timingMetrics: TimingMetrics,
    learningScores: LearningScores,
    missedOpportunities: MissedOpportunity[] = [],
    behavioralFlags: string[] = []
  ): Promise<TradeAnalytics> {
    const db = await this.getDb();
    
    const result = await db.queryOne<TradeAnalytics>(
      `INSERT INTO trade_analytics (
        trade_id, user_id, financial_metrics, timing_metrics, 
        learning_scores, missed_opportunities, behavioral_flags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING 
        id, trade_id as "tradeId", user_id as "userId",
        financial_metrics as "financialMetrics", timing_metrics as "timingMetrics",
        learning_scores as "learningScores", missed_opportunities as "missedOpportunities",
        behavioral_flags as "behavioralFlags", created_at as "createdAt"`,
      [
        tradeId, userId, 
        JSON.stringify(financialMetrics),
        JSON.stringify(timingMetrics),
        JSON.stringify(learningScores),
        JSON.stringify(missedOpportunities),
        behavioralFlags
      ]
    );

    if (!result) {
      throw new Error('Failed to create trade analytics');
    }

    // Parse JSON fields back to objects
    result.financialMetrics = JSON.parse(result.financialMetrics as any);
    result.timingMetrics = JSON.parse(result.timingMetrics as any);
    result.learningScores = JSON.parse(result.learningScores as any);
    result.missedOpportunities = JSON.parse(result.missedOpportunities as any);

    return result;
  }

  async updateTradeAnalytics(
    tradeId: string,
    updates: {
      financialMetrics?: FinancialMetrics;
      timingMetrics?: TimingMetrics;
      learningScores?: LearningScores;
      missedOpportunities?: MissedOpportunity[];
      behavioralFlags?: string[];
    }
  ): Promise<TradeAnalytics> {
    const db = await this.getDb();
    
    const setParts: string[] = [];
    const params: any[] = [tradeId];
    let paramIndex = 2;

    if (updates.financialMetrics) {
      setParts.push(`financial_metrics = $${paramIndex++}`);
      params.push(JSON.stringify(updates.financialMetrics));
    }

    if (updates.timingMetrics) {
      setParts.push(`timing_metrics = $${paramIndex++}`);
      params.push(JSON.stringify(updates.timingMetrics));
    }

    if (updates.learningScores) {
      setParts.push(`learning_scores = $${paramIndex++}`);
      params.push(JSON.stringify(updates.learningScores));
    }

    if (updates.missedOpportunities) {
      setParts.push(`missed_opportunities = $${paramIndex++}`);
      params.push(JSON.stringify(updates.missedOpportunities));
    }

    if (updates.behavioralFlags) {
      setParts.push(`behavioral_flags = $${paramIndex++}`);
      params.push(updates.behavioralFlags);
    }

    if (setParts.length === 0) {
      throw new Error('No updates provided');
    }

    const result = await db.queryOne<TradeAnalytics>(
      `UPDATE trade_analytics 
      SET ${setParts.join(', ')}
      WHERE trade_id = $1
      RETURNING 
        id, trade_id as "tradeId", user_id as "userId",
        financial_metrics as "financialMetrics", timing_metrics as "timingMetrics",
        learning_scores as "learningScores", missed_opportunities as "missedOpportunities",
        behavioral_flags as "behavioralFlags", created_at as "createdAt"`,
      params
    );

    if (!result) {
      throw new Error('Trade analytics not found');
    }

    // Parse JSON fields back to objects
    result.financialMetrics = JSON.parse(result.financialMetrics as any);
    result.timingMetrics = JSON.parse(result.timingMetrics as any);
    result.learningScores = JSON.parse(result.learningScores as any);
    result.missedOpportunities = JSON.parse(result.missedOpportunities as any);

    return result;
  }

  // ============================================================================
  // Analytics Retrieval
  // ============================================================================

  async getTradeAnalytics(tradeId: string): Promise<TradeAnalytics | null> {
    const db = await this.getDb();
    
    const result = await db.queryOne<TradeAnalytics>(
      `SELECT 
        id, trade_id as "tradeId", user_id as "userId",
        financial_metrics as "financialMetrics", timing_metrics as "timingMetrics",
        learning_scores as "learningScores", missed_opportunities as "missedOpportunities",
        behavioral_flags as "behavioralFlags", created_at as "createdAt"
      FROM trade_analytics 
      WHERE trade_id = $1`,
      [tradeId]
    );

    if (!result) {
      return null;
    }

    // Parse JSON fields back to objects
    result.financialMetrics = JSON.parse(result.financialMetrics as any);
    result.timingMetrics = JSON.parse(result.timingMetrics as any);
    result.learningScores = JSON.parse(result.learningScores as any);
    result.missedOpportunities = JSON.parse(result.missedOpportunities as any);

    return result;
  }

  async getUserAnalytics(query: AnalyticsQuery): Promise<TradeAnalytics[]> {
    const db = await this.getDb();
    
    let sql = `
      SELECT 
        id, trade_id as "tradeId", user_id as "userId",
        financial_metrics as "financialMetrics", timing_metrics as "timingMetrics",
        learning_scores as "learningScores", missed_opportunities as "missedOpportunities",
        behavioral_flags as "behavioralFlags", created_at as "createdAt"
      FROM trade_analytics 
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramIndex = 1;

    if (query.userId) {
      sql += ` AND user_id = $${paramIndex++}`;
      params.push(query.userId);
    }

    if (query.tradeId) {
      sql += ` AND trade_id = $${paramIndex++}`;
      params.push(query.tradeId);
    }

    if (query.startDate) {
      sql += ` AND created_at >= $${paramIndex++}`;
      params.push(query.startDate);
    }

    if (query.endDate) {
      sql += ` AND created_at <= $${paramIndex++}`;
      params.push(query.endDate);
    }

    if (query.minScore) {
      sql += ` AND (learning_scores->>'overallScore')::numeric >= $${paramIndex++}`;
      params.push(query.minScore);
    }

    if (query.maxScore) {
      sql += ` AND (learning_scores->>'overallScore')::numeric <= $${paramIndex++}`;
      params.push(query.maxScore);
    }

    sql += ' ORDER BY created_at DESC';

    if (query.limit) {
      sql += ` LIMIT $${paramIndex++}`;
      params.push(query.limit);
    }

    if (query.offset) {
      sql += ` OFFSET $${paramIndex++}`;
      params.push(query.offset);
    }

    const results = await db.query<TradeAnalytics>(sql, params);
    
    // Parse JSON fields for all results
    return results.map(result => ({
      ...result,
      financialMetrics: JSON.parse(result.financialMetrics as any),
      timingMetrics: JSON.parse(result.timingMetrics as any),
      learningScores: JSON.parse(result.learningScores as any),
      missedOpportunities: JSON.parse(result.missedOpportunities as any)
    }));
  }

  // ============================================================================
  // Analytics Aggregation and Insights
  // ============================================================================

  async getUserLearningProgress(
    userId: string, 
    days: number = 30
  ): Promise<{
    averageOverallScore: number;
    averageEntryScore: number;
    averageExitScore: number;
    averageRiskScore: number;
    improvementTrend: number; // Percentage change over period
    totalAnalyzedTrades: number;
    commonWeaknesses: string[];
    commonStrengths: string[];
  }> {
    const db = await this.getDb();
    
    const stats = await db.queryOne<{
      avg_overall: number;
      avg_entry: number;
      avg_exit: number;
      avg_risk: number;
      total_trades: number;
    }>(
      `SELECT 
        AVG((learning_scores->>'overallScore')::numeric) as avg_overall,
        AVG((learning_scores->>'entryQuality')::numeric) as avg_entry,
        AVG((learning_scores->>'exitQuality')::numeric) as avg_exit,
        AVG((learning_scores->>'riskManagement')::numeric) as avg_risk,
        COUNT(*) as total_trades
      FROM trade_analytics 
      WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '$2 days'`,
      [userId, days]
    );

    // Calculate improvement trend (compare first half vs second half of period)
    const midPoint = new Date(Date.now() - (days * 24 * 60 * 60 * 1000 / 2));
    
    const firstHalfAvg = await db.queryOne<{ avg_score: number }>(
      `SELECT AVG((learning_scores->>'overallScore')::numeric) as avg_score
      FROM trade_analytics 
      WHERE user_id = $1 
        AND created_at >= NOW() - INTERVAL '$2 days'
        AND created_at < $3`,
      [userId, days, midPoint]
    );

    const secondHalfAvg = await db.queryOne<{ avg_score: number }>(
      `SELECT AVG((learning_scores->>'overallScore')::numeric) as avg_score
      FROM trade_analytics 
      WHERE user_id = $1 AND created_at >= $2`,
      [userId, midPoint]
    );

    // Get common improvement areas and strengths
    const weaknessesResult = await db.query<{ area: string; count: number }>(
      `SELECT 
        jsonb_array_elements_text(learning_scores->'improvementAreas') as area,
        COUNT(*) as count
      FROM trade_analytics 
      WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '$2 days'
      GROUP BY area
      ORDER BY count DESC
      LIMIT 5`,
      [userId, days]
    );

    const strengthsResult = await db.query<{ area: string; count: number }>(
      `SELECT 
        jsonb_array_elements_text(learning_scores->'strengths') as area,
        COUNT(*) as count
      FROM trade_analytics 
      WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '$2 days'
      GROUP BY area
      ORDER BY count DESC
      LIMIT 5`,
      [userId, days]
    );

    const improvementTrend = (firstHalfAvg?.avg_score && secondHalfAvg?.avg_score)
      ? ((secondHalfAvg.avg_score - firstHalfAvg.avg_score) / firstHalfAvg.avg_score) * 100
      : 0;

    return {
      averageOverallScore: Math.round(stats?.avg_overall || 0),
      averageEntryScore: Math.round(stats?.avg_entry || 0),
      averageExitScore: Math.round(stats?.avg_exit || 0),
      averageRiskScore: Math.round(stats?.avg_risk || 0),
      improvementTrend: Math.round(improvementTrend * 100) / 100,
      totalAnalyzedTrades: stats?.total_trades || 0,
      commonWeaknesses: weaknessesResult.map(w => w.area),
      commonStrengths: strengthsResult.map(s => s.area)
    };
  }

  async getMissedOpportunitiesAnalysis(
    userId: string,
    days: number = 30
  ): Promise<{
    totalMissedValue: number;
    averageMissedPerTrade: number;
    mostCommonMissType: string;
    missedOpportunityCount: number;
    topMissedOpportunities: Array<{
      type: string;
      count: number;
      averageValue: number;
      totalValue: number;
    }>;
  }> {
    const db = await this.getDb();
    
    // Get all missed opportunities for the user in the specified period
    const opportunities = await db.query<{
      missed_opportunities: string;
    }>(
      `SELECT missed_opportunities
      FROM trade_analytics 
      WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '$2 days'
        AND jsonb_array_length(missed_opportunities) > 0`,
      [userId, days]
    );

    // Parse and analyze missed opportunities
    const allOpportunities: MissedOpportunity[] = [];
    opportunities.forEach(row => {
      const parsed = JSON.parse(row.missed_opportunities);
      if (Array.isArray(parsed)) {
        allOpportunities.push(...parsed);
      }
    });

    if (allOpportunities.length === 0) {
      return {
        totalMissedValue: 0,
        averageMissedPerTrade: 0,
        mostCommonMissType: 'none',
        missedOpportunityCount: 0,
        topMissedOpportunities: []
      };
    }

    // Calculate statistics
    const totalMissedValue = allOpportunities.reduce((sum, opp) => sum + opp.potentialGain, 0);
    const averageMissedPerTrade = totalMissedValue / opportunities.length;

    // Group by type
    const typeStats = allOpportunities.reduce((acc, opp) => {
      if (!acc[opp.type]) {
        acc[opp.type] = { count: 0, totalValue: 0 };
      }
      acc[opp.type].count++;
      acc[opp.type].totalValue += opp.potentialGain;
      return acc;
    }, {} as Record<string, { count: number; totalValue: number }>);

    const topMissedOpportunities = Object.entries(typeStats)
      .map(([type, stats]) => ({
        type,
        count: stats.count,
        averageValue: stats.totalValue / stats.count,
        totalValue: stats.totalValue
      }))
      .sort((a, b) => b.totalValue - a.totalValue);

    const mostCommonMissType = topMissedOpportunities[0]?.type || 'none';

    return {
      totalMissedValue: Math.round(totalMissedValue * 100) / 100,
      averageMissedPerTrade: Math.round(averageMissedPerTrade * 100) / 100,
      mostCommonMissType,
      missedOpportunityCount: allOpportunities.length,
      topMissedOpportunities
    };
  }

  async getBehavioralPatterns(
    userId: string,
    days: number = 30
  ): Promise<{
    totalFlags: number;
    mostCommonPattern: string;
    patternFrequency: Record<string, number>;
    riskLevel: 'low' | 'medium' | 'high';
    recommendations: string[];
  }> {
    const db = await this.getDb();
    
    const patterns = await db.query<{ behavioral_flags: string[] }>(
      `SELECT behavioral_flags
      FROM trade_analytics 
      WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '$2 days'
        AND array_length(behavioral_flags, 1) > 0`,
      [userId, days]
    );

    const allFlags = patterns.flatMap(p => p.behavioral_flags);
    
    if (allFlags.length === 0) {
      return {
        totalFlags: 0,
        mostCommonPattern: 'none',
        patternFrequency: {},
        riskLevel: 'low',
        recommendations: ['Continue your disciplined trading approach!']
      };
    }

    // Count pattern frequency
    const patternFrequency = allFlags.reduce((acc, flag) => {
      acc[flag] = (acc[flag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostCommonPattern = Object.entries(patternFrequency)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none';

    // Determine risk level based on pattern frequency and severity
    const highRiskPatterns = ['revenge_trading', 'overtrading', 'fomo'];
    const highRiskCount = allFlags.filter(flag => highRiskPatterns.includes(flag)).length;
    
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (highRiskCount > allFlags.length * 0.5) {
      riskLevel = 'high';
    } else if (highRiskCount > allFlags.length * 0.2) {
      riskLevel = 'medium';
    }

    // Generate recommendations based on patterns
    const recommendations = this.generateBehavioralRecommendations(patternFrequency, riskLevel);

    return {
      totalFlags: allFlags.length,
      mostCommonPattern,
      patternFrequency,
      riskLevel,
      recommendations
    };
  }

  private generateBehavioralRecommendations(
    patterns: Record<string, number>,
    riskLevel: 'low' | 'medium' | 'high'
  ): string[] {
    const recommendations: string[] = [];

    if (patterns.overtrading) {
      recommendations.push('Consider setting daily trade limits to avoid overtrading');
    }

    if (patterns.revenge_trading) {
      recommendations.push('Take breaks after losses to avoid emotional revenge trading');
    }

    if (patterns.fomo) {
      recommendations.push('Stick to your trading plan and avoid FOMO-driven decisions');
    }

    if (patterns.fear_of_loss) {
      recommendations.push('Work on position sizing to reduce fear and improve decision making');
    }

    if (patterns.confirmation_bias) {
      recommendations.push('Actively seek out opposing viewpoints before making trades');
    }

    if (riskLevel === 'high') {
      recommendations.push('Consider reducing position sizes until behavioral patterns improve');
    }

    if (recommendations.length === 0) {
      recommendations.push('Your trading behavior shows good discipline. Keep it up!');
    }

    return recommendations;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  async deleteTradeAnalytics(tradeId: string): Promise<void> {
    const db = await this.getDb();
    
    await db.execute(
      'DELETE FROM trade_analytics WHERE trade_id = $1',
      [tradeId]
    );
  }

  async deleteUserAnalytics(userId: string): Promise<void> {
    const db = await this.getDb();
    
    await db.execute(
      'DELETE FROM trade_analytics WHERE user_id = $1',
      [userId]
    );
  }

  async getAnalyticsCount(query: Partial<AnalyticsQuery>): Promise<number> {
    const db = await this.getDb();
    
    let sql = 'SELECT COUNT(*) as count FROM trade_analytics WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (query.userId) {
      sql += ` AND user_id = $${paramIndex++}`;
      params.push(query.userId);
    }

    if (query.startDate) {
      sql += ` AND created_at >= $${paramIndex++}`;
      params.push(query.startDate);
    }

    if (query.endDate) {
      sql += ` AND created_at <= $${paramIndex++}`;
      params.push(query.endDate);
    }

    const result = await db.queryOne<{ count: number }>(sql, params);
    return result?.count || 0;
  }
}