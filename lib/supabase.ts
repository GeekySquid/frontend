import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  total_predictions: number;
  correct_predictions: number;
  win_rate: number;
  favorite_stocks: string[];
  learning_level: 'beginner' | 'intermediate' | 'advanced';
  completed_modules: string[];
  quiz_scores: Record<string, number>;
}

export interface PredictionHistory {
  id: string;
  user_id: string;
  symbol: string;
  timeframe: string;
  user_prediction: 'bullish' | 'bearish';
  ai_prediction: 'bullish' | 'bearish';
  ai_confidence: number;
  target_price: number;
  actual_outcome?: 'bullish' | 'bearish';
  is_correct?: boolean;
  created_at: string;
  resolved_at?: string;
}

export interface LearningProgress {
  id: string;
  user_id: string;
  module_id: string;
  lesson_id: string;
  completed: boolean;
  score?: number;
  time_spent: number;
  completed_at?: string;
  created_at: string;
}

export interface QuizResult {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  answers: Record<string, any>;
  passed: boolean;
  completed_at: string;
}

export interface Watchlist {
  id: string;
  user_id: string;
  symbol: string;
  added_at: string;
  notes?: string;
}
