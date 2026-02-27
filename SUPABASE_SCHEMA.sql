-- FinNexus Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_predictions INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0.00,
  favorite_stocks TEXT[] DEFAULT '{}',
  learning_level TEXT DEFAULT 'beginner' CHECK (learning_level IN ('beginner', 'intermediate', 'advanced')),
  completed_modules TEXT[] DEFAULT '{}',
  quiz_scores JSONB DEFAULT '{}'::jsonb
);

-- Prediction History Table
CREATE TABLE IF NOT EXISTS prediction_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  user_prediction TEXT NOT NULL CHECK (user_prediction IN ('bullish', 'bearish')),
  ai_prediction TEXT NOT NULL CHECK (ai_prediction IN ('bullish', 'bearish')),
  ai_confidence DECIMAL(5,2) NOT NULL,
  target_price DECIMAL(10,2) NOT NULL,
  actual_outcome TEXT CHECK (actual_outcome IN ('bullish', 'bearish')),
  is_correct BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Learning Progress Table
CREATE TABLE IF NOT EXISTS learning_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  score INTEGER,
  time_spent INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, module_id, lesson_id)
);

-- Quiz Results Table
CREATE TABLE IF NOT EXISTS quiz_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  quiz_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  answers JSONB NOT NULL,
  passed BOOLEAN NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Watchlist Table
CREATE TABLE IF NOT EXISTS watchlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  UNIQUE(user_id, symbol)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prediction_history_user_id ON prediction_history(user_id);
CREATE INDEX IF NOT EXISTS idx_prediction_history_symbol ON prediction_history(symbol);
CREATE INDEX IF NOT EXISTS idx_prediction_history_created_at ON prediction_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_learning_progress_user_id ON learning_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Prediction History Policies
CREATE POLICY "Users can view own predictions" ON prediction_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own predictions" ON prediction_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own predictions" ON prediction_history
  FOR UPDATE USING (auth.uid() = user_id);

-- Learning Progress Policies
CREATE POLICY "Users can view own progress" ON learning_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON learning_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON learning_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Quiz Results Policies
CREATE POLICY "Users can view own quiz results" ON quiz_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz results" ON quiz_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Watchlist Policies
CREATE POLICY "Users can view own watchlist" ON watchlist
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert to own watchlist" ON watchlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from own watchlist" ON watchlist
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can update own watchlist" ON watchlist
  FOR UPDATE USING (auth.uid() = user_id);

-- Functions

-- Function to update user profile stats
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles
  SET 
    total_predictions = (
      SELECT COUNT(*) FROM prediction_history WHERE user_id = NEW.user_id
    ),
    correct_predictions = (
      SELECT COUNT(*) FROM prediction_history 
      WHERE user_id = NEW.user_id AND is_correct = TRUE
    ),
    win_rate = (
      SELECT CASE 
        WHEN COUNT(*) > 0 THEN 
          (COUNT(*) FILTER (WHERE is_correct = TRUE)::DECIMAL / COUNT(*) * 100)
        ELSE 0 
      END
      FROM prediction_history 
      WHERE user_id = NEW.user_id AND is_correct IS NOT NULL
    ),
    updated_at = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stats when prediction is resolved
CREATE TRIGGER update_stats_on_prediction
AFTER INSERT OR UPDATE ON prediction_history
FOR EACH ROW
WHEN (NEW.is_correct IS NOT NULL)
EXECUTE FUNCTION update_user_stats();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, created_at)
  VALUES (NEW.id, NEW.email, NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_user_profile();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_profiles updated_at
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
