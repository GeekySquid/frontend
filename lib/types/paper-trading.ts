// Interactive Learning & Paper Trading System - TypeScript Interfaces
// Core data models for the paper trading system

// ============================================================================
// User Qualification System
// ============================================================================

export interface UserQualification {
  id: string;
  userId: string;
  isQualified: boolean;
  qualificationDate?: Date;
  totalScore: number;
  simulationsCompleted: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface QualificationModule {
  id: string;
  userId: string;
  moduleId: string;
  completionDate: Date;
  score: number;
  attempts: number;
  createdAt: Date;
}

export interface QualificationStatus {
  isQualified: boolean;
  completedModules: string[];
  requiredModules: string[];
  quizScores: Record<string, number>;
  simulationCount: number;
  qualificationDate?: Date;
  totalScore: number;
  missingRequirements: string[];
}

// ============================================================================
// Trading Session Management
// ============================================================================

export type SessionStatus = 'active' | 'completed' | 'paused';

export interface TradingSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  status: SessionStatus;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  totalPnl: number;
  winRate: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  averageHoldTime: number; // in seconds
  totalVolume: number;
  uniqueSymbols: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionSummary {
  sessionId: string;
  duration: number; // in minutes
  totalTrades: number;
  profitableTrades: number;
  winRate: number;
  totalPnl: number;
  bestTrade: PaperTrade;
  worstTrade: PaperTrade;
  averageHoldTime: number;
  symbolsTraded: string[];
  learningInsights: string[];
}

// ============================================================================
// Paper Trading Core
// ============================================================================

export type TradeSide = 'buy' | 'sell';
export type TradeStatus = 'open' | 'closed' | 'cancelled';
export type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit';

export interface PaperTrade {
  id: string;
  userId: string;
  sessionId: string;
  symbol: string;
  side: TradeSide;
  quantity: number;
  entryPrice: number;
  entryTime: Date;
  exitPrice?: number;
  exitTime?: Date;
  status: TradeStatus;
  orderType: OrderType;
  limitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  pnlAmount?: number;
  pnlPercentage?: number;
  maxFavorableExcursion: number; // MFE - maximum profit during trade
  maxAdverseExcursion: number;   // MAE - maximum loss during trade
  holdingPeriod?: number; // in seconds
  createdAt: Date;
  updatedAt: Date;
}

export interface TradeOrder {
  userId: string;
  sessionId: string;
  symbol: string;
  side: TradeSide;
  quantity: number;
  orderType: OrderType;
  limitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  timeInForce?: 'GTC' | 'IOC' | 'FOK' | 'DAY';
}

export interface TradeResult {
  success: boolean;
  trade?: PaperTrade;
  error?: string;
  message: string;
}

// ============================================================================
// Analytics and Learning System
// ============================================================================

export interface FinancialMetrics {
  pnlAmount: number;
  pnlPercentage: number;
  riskRewardRatio: number;
  maxDrawdown: number;
  maxRunup: number;
  holdingPeriod: number;
  entryPrice: number;
  exitPrice: number;
  commission: number;
  netPnl: number;
}

export interface TimingMetrics {
  entryTiming: 'early' | 'optimal' | 'late';
  exitTiming: 'early' | 'optimal' | 'late';
  holdingPeriod: number;
  optimalEntryPrice?: number;
  optimalExitPrice?: number;
  timingScore: number; // 0-100
  marketCondition: 'trending' | 'ranging' | 'volatile';
}

export interface LearningScores {
  entryQuality: number;    // 0-100 score for entry decision quality
  exitQuality: number;     // 0-100 score for exit decision quality
  riskManagement: number;  // 0-100 score for risk management discipline
  overallScore: number;    // 0-100 overall trade quality score
  improvementAreas: string[];
  strengths: string[];
}

export interface MissedOpportunity {
  type: 'missed_profit' | 'early_exit' | 'late_entry' | 'poor_timing';
  description: string;
  potentialGain: number;
  potentialGainPercentage: number;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
  learningTip: string;
}

export interface BehavioralInsight {
  pattern: 'overtrading' | 'revenge_trading' | 'fomo' | 'fear_of_loss' | 'confirmation_bias';
  description: string;
  frequency: number;
  impact: 'positive' | 'negative' | 'neutral';
  recommendation: string;
}

export interface TradeAnalytics {
  id: string;
  tradeId: string;
  userId: string;
  financialMetrics: FinancialMetrics;
  timingMetrics: TimingMetrics;
  learningScores: LearningScores;
  missedOpportunities: MissedOpportunity[];
  behavioralFlags: string[];
  createdAt: Date;
}

// ============================================================================
// Market Data System
// ============================================================================

export interface MarketTick {
  id: string;
  symbol: string;
  price: number;
  volume?: number;
  bid?: number;
  ask?: number;
  spread?: number;
  timestamp: Date;
  source: string;
  createdAt: Date;
}

export interface MarketDataMessage {
  type: 'tick' | 'quote' | 'trade' | 'orderbook';
  symbol: string;
  price: number;
  volume?: number;
  timestamp: number;
  bid?: number;
  ask?: number;
  spread?: number;
  source: string;
}

export interface RealTimePrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: number;
  source: string;
}

// ============================================================================
// Trading Engine Interfaces
// ============================================================================

export interface TradeExecutor {
  placeTrade(order: TradeOrder): Promise<TradeResult>;
  closeTrade(tradeId: string, exitPrice?: number): Promise<TradeResult>;
  getOpenTrades(userId: string): Promise<PaperTrade[]>;
  calculateFloatingPnL(trade: PaperTrade, currentPrice: number): number;
  updateMFEMAE(tradeId: string, currentPrice: number): Promise<void>;
}

export interface PositionManager {
  getPositions(userId: string): Promise<Position[]>;
  getPosition(userId: string, symbol: string): Promise<Position | null>;
  updatePosition(trade: PaperTrade): Promise<void>;
  calculatePortfolioValue(userId: string): Promise<number>;
  getRiskMetrics(userId: string): Promise<RiskMetrics>;
}

export interface Position {
  userId: string;
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  dayChange: number;
  dayChangePercent: number;
  lastUpdated: Date;
}

export interface RiskMetrics {
  totalPortfolioValue: number;
  totalUnrealizedPnL: number;
  totalRealizedPnL: number;
  dayPnL: number;
  maxDrawdown: number;
  sharpeRatio: number;
  winRate: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  consecutiveWins: number;
  consecutiveLosses: number;
}

// ============================================================================
// Session Management Interfaces
// ============================================================================

export interface SessionTracker {
  startSession(userId: string): Promise<string>; // returns sessionId
  endSession(sessionId: string): Promise<SessionSummary>;
  updateSessionStats(sessionId: string, trade: PaperTrade): Promise<void>;
  getCurrentSession(userId: string): Promise<TradingSession | null>;
  getSessionHistory(userId: string, limit?: number): Promise<TradingSession[]>;
}

// ============================================================================
// Analytics Engine Interfaces
// ============================================================================

export interface TradeAnalyzer {
  analyzeCompletedTrade(trade: PaperTrade, tickData: MarketTick[]): Promise<TradeAnalytics>;
  calculateMissedOpportunities(trade: PaperTrade, tickData: MarketTick[]): Promise<MissedOpportunity[]>;
  generateLearningScores(trade: PaperTrade, analysis: TradeAnalytics): Promise<LearningScores>;
  detectBehavioralPatterns(userId: string, recentTrades: PaperTrade[]): Promise<BehavioralInsight[]>;
}

export interface PerformanceAggregator {
  calculateSessionStats(sessionId: string): Promise<SessionSummary>;
  getPerformanceTrends(userId: string, days: number): Promise<PerformanceTrend[]>;
  generateLearningRecommendations(userId: string): Promise<LearningRecommendation[]>;
  getLeaderboardStats(userId: string): Promise<LeaderboardEntry>;
}

export interface PerformanceTrend {
  date: Date;
  totalPnL: number;
  tradeCount: number;
  winRate: number;
  averageHoldTime: number;
  riskScore: number;
  learningScore: number;
}

export interface LearningRecommendation {
  type: 'module' | 'practice' | 'strategy' | 'risk_management';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimatedTime: number; // in minutes
  moduleId?: string;
  reason: string;
}

export interface LeaderboardEntry {
  userId: string;
  rank: number;
  totalPnL: number;
  winRate: number;
  tradeCount: number;
  riskAdjustedReturn: number;
  learningScore: number;
  achievements: string[];
}

// ============================================================================
// WebSocket and Real-time Data
// ============================================================================

export interface WebSocketManager {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  subscribe(symbols: string[]): void;
  unsubscribe(symbols: string[]): void;
  onMessage(callback: (message: MarketDataMessage) => void): void;
  getConnectionStatus(): 'connected' | 'disconnected' | 'reconnecting';
  getSubscribedSymbols(): string[];
}

// ============================================================================
// Configuration and System Types
// ============================================================================

export interface TradingSystemConfig {
  maxPositionsPerUser: number;
  maxPositionSize: number;
  allowedSymbols: string[];
  tradingHours: {
    start: string; // HH:MM format
    end: string;
    timezone: string;
  };
  riskLimits: {
    maxDailyLoss: number;
    maxDrawdown: number;
    maxLeverage: number;
  };
  commissions: {
    stockTrade: number;
    optionTrade: number;
    cryptoTrade: number;
  };
}

export interface LearningSystemConfig {
  requiredModules: string[];
  minimumQuizScore: number;
  requiredSimulations: number;
  qualificationExpiry: number; // days
  retestCooldown: number; // hours
}

export interface AnalyticsConfig {
  tickDataRetention: number; // days
  analysisDelay: number; // milliseconds
  scoringWeights: {
    entry: number;
    exit: number;
    risk: number;
    timing: number;
  };
  behavioralAnalysis: {
    enabled: boolean;
    lookbackPeriod: number; // days
    minTradesForPattern: number;
  };
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ============================================================================
// Database Query Types
// ============================================================================

export interface TradeQuery {
  userId?: string;
  sessionId?: string;
  symbol?: string;
  status?: TradeStatus;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
  sortBy?: 'entry_time' | 'exit_time' | 'pnl_amount' | 'pnl_percentage';
  sortOrder?: 'asc' | 'desc';
}

export interface SessionQuery {
  userId?: string;
  status?: SessionStatus;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface AnalyticsQuery {
  userId?: string;
  tradeId?: string;
  startDate?: Date;
  endDate?: Date;
  minScore?: number;
  maxScore?: number;
  limit?: number;
  offset?: number;
}

// ============================================================================
// Event Types for Real-time Updates
// ============================================================================

export interface TradeEvent {
  type: 'trade_opened' | 'trade_closed' | 'trade_updated' | 'mfe_mae_updated';
  userId: string;
  sessionId: string;
  tradeId: string;
  trade: PaperTrade;
  timestamp: Date;
}

export interface SessionEvent {
  type: 'session_started' | 'session_ended' | 'session_updated';
  userId: string;
  sessionId: string;
  session: TradingSession;
  timestamp: Date;
}

export interface PriceUpdateEvent {
  type: 'price_update';
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: Date;
  affectedTrades: string[]; // trade IDs that need MFE/MAE updates
}

// ============================================================================
// Utility Types
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type CreateTradeRequest = Omit<TradeOrder, 'userId' | 'sessionId'>;
export type UpdateTradeRequest = Partial<Pick<PaperTrade, 'stopLoss' | 'takeProfit' | 'limitPrice'>>;

export type TradeWithAnalytics = PaperTrade & {
  analytics?: TradeAnalytics;
  currentPrice?: number;
  unrealizedPnL?: number;
};

export type SessionWithTrades = TradingSession & {
  trades: PaperTrade[];
  analytics: TradeAnalytics[];
};