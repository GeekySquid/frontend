-- Interactive Learning & Paper Trading System Database Schema
-- Migration 001: Core paper trading tables and indexes

-- User qualifications tracking
CREATE TABLE IF NOT EXISTS user_qualifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  is_qualified BOOLEAN DEFAULT FALSE,
  qualification_date TIMESTAMP,
  total_score INTEGER DEFAULT 0,
  simulations_completed INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Module completion tracking
CREATE TABLE IF NOT EXISTS qualification_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  module_id VARCHAR(255) NOT NULL,
  completion_date TIMESTAMP NOT NULL,
  score INTEGER NOT NULL,
  attempts INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES user_qualifications(user_id) ON DELETE CASCADE,
  UNIQUE(user_id, module_id)
);

-- Trading sessions
CREATE TABLE IF NOT EXISTS trading_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  trade_count INTEGER DEFAULT 0,
  win_count INTEGER DEFAULT 0,
  loss_count INTEGER DEFAULT 0,
  total_pnl DECIMAL(15,2) DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0,
  average_win DECIMAL(15,2) DEFAULT 0,
  average_loss DECIMAL(15,2) DEFAULT 0,
  largest_win DECIMAL(15,2) DEFAULT 0,
  largest_loss DECIMAL(15,2) DEFAULT 0,
  average_hold_time INTEGER DEFAULT 0, -- in seconds
  total_volume BIGINT DEFAULT 0,
  unique_symbols TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Paper trades
CREATE TABLE IF NOT EXISTS paper_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  session_id UUID NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  side VARCHAR(10) NOT NULL CHECK (side IN ('buy', 'sell')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  entry_price DECIMAL(15,4) NOT NULL CHECK (entry_price > 0),
  entry_time TIMESTAMP NOT NULL,
  exit_price DECIMAL(15,4),
  exit_time TIMESTAMP,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
  order_type VARCHAR(20) DEFAULT 'market' CHECK (order_type IN ('market', 'limit', 'stop', 'stop_limit')),
  limit_price DECIMAL(15,4),
  stop_loss DECIMAL(15,4),
  take_profit DECIMAL(15,4),
  pnl_amount DECIMAL(15,2),
  pnl_percentage DECIMAL(8,4),
  max_favorable_excursion DECIMAL(15,4) DEFAULT 0,
  max_adverse_excursion DECIMAL(15,4) DEFAULT 0,
  holding_period INTEGER, -- in seconds
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (session_id) REFERENCES trading_sessions(id) ON DELETE CASCADE
);

-- Trade analytics
CREATE TABLE IF NOT EXISTS trade_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  financial_metrics JSONB NOT NULL,
  timing_metrics JSONB NOT NULL,
  learning_scores JSONB NOT NULL,
  missed_opportunities JSONB DEFAULT '[]'::jsonb,
  behavioral_flags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (trade_id) REFERENCES paper_trades(id) ON DELETE CASCADE,
  UNIQUE(trade_id)
);

-- Market data tick storage (for analytics and backtesting)
CREATE TABLE IF NOT EXISTS market_ticks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(20) NOT NULL,
  price DECIMAL(15,4) NOT NULL CHECK (price > 0),
  volume BIGINT,
  bid DECIMAL(15,4),
  ask DECIMAL(15,4),
  spread DECIMAL(15,4),
  timestamp TIMESTAMP NOT NULL,
  source VARCHAR(50) DEFAULT 'unknown',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Performance indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_user_qualifications_user_id ON user_qualifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_qualifications_qualified ON user_qualifications(is_qualified, user_id);

CREATE INDEX IF NOT EXISTS idx_qualification_modules_user_id ON qualification_modules(user_id);
CREATE INDEX IF NOT EXISTS idx_qualification_modules_module_id ON qualification_modules(module_id);
CREATE INDEX IF NOT EXISTS idx_qualification_modules_completion ON qualification_modules(user_id, completion_date);

CREATE INDEX IF NOT EXISTS idx_trading_sessions_user_id ON trading_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_sessions_status ON trading_sessions(status);
CREATE INDEX IF NOT EXISTS idx_trading_sessions_active ON trading_sessions(user_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_trading_sessions_date_range ON trading_sessions(user_id, start_time, end_time);

CREATE INDEX IF NOT EXISTS idx_paper_trades_user_id ON paper_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_paper_trades_session_id ON paper_trades(session_id);
CREATE INDEX IF NOT EXISTS idx_paper_trades_status ON paper_trades(status);
CREATE INDEX IF NOT EXISTS idx_paper_trades_symbol ON paper_trades(symbol);
CREATE INDEX IF NOT EXISTS idx_paper_trades_user_symbol ON paper_trades(user_id, symbol);
CREATE INDEX IF NOT EXISTS idx_paper_trades_entry_time ON paper_trades(entry_time);
CREATE INDEX IF NOT EXISTS idx_paper_trades_open_trades ON paper_trades(user_id, status) WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_trade_analytics_trade_id ON trade_analytics(trade_id);
CREATE INDEX IF NOT EXISTS idx_trade_analytics_user_id ON trade_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_analytics_scores ON trade_analytics USING GIN (learning_scores);

CREATE INDEX IF NOT EXISTS idx_market_ticks_symbol_timestamp ON market_ticks(symbol, timestamp);
CREATE INDEX IF NOT EXISTS idx_market_ticks_timestamp ON market_ticks(timestamp);
CREATE INDEX IF NOT EXISTS idx_market_ticks_symbol_recent ON market_ticks(symbol, timestamp DESC);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_trades_session_status ON paper_trades(session_id, status);
CREATE INDEX IF NOT EXISTS idx_trades_user_time_range ON paper_trades(user_id, entry_time, exit_time);
CREATE INDEX IF NOT EXISTS idx_analytics_user_created ON trade_analytics(user_id, created_at);

-- Partial indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_open_trades_by_user ON paper_trades(user_id, symbol, entry_time) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_recent_ticks ON market_ticks(symbol, price, timestamp) WHERE timestamp > NOW() - INTERVAL '1 day';

-- Comments for documentation
COMMENT ON TABLE user_qualifications IS 'Tracks user qualification status for paper trading access';
COMMENT ON TABLE qualification_modules IS 'Records completion of learning modules required for qualification';
COMMENT ON TABLE trading_sessions IS 'Manages paper trading sessions with cumulative statistics';
COMMENT ON TABLE paper_trades IS 'Stores individual paper trade records with complete lifecycle data';
COMMENT ON TABLE trade_analytics IS 'Contains detailed analytics and learning insights for each trade';
COMMENT ON TABLE market_ticks IS 'Historical market data for analytics and backtesting';

COMMENT ON COLUMN paper_trades.max_favorable_excursion IS 'Maximum profit reached during the trade lifecycle';
COMMENT ON COLUMN paper_trades.max_adverse_excursion IS 'Maximum loss reached during the trade lifecycle';
COMMENT ON COLUMN trade_analytics.financial_metrics IS 'JSON containing P&L, risk-reward ratios, and financial KPIs';
COMMENT ON COLUMN trade_analytics.timing_metrics IS 'JSON containing entry/exit timing analysis and optimal timing data';
COMMENT ON COLUMN trade_analytics.learning_scores IS 'JSON containing educational scores for entry, exit, and risk management quality';
COMMENT ON COLUMN trade_analytics.missed_opportunities IS 'JSON array of missed profit opportunities and timing issues';