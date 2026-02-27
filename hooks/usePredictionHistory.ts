import { useState, useEffect } from 'react';
import { supabase, PredictionHistory } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function usePredictionHistory() {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState<PredictionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchPredictions();
    } else {
      setPredictions([]);
      setLoading(false);
    }
  }, [user]);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('prediction_history')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPredictions(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const savePrediction = async (prediction: Omit<PredictionHistory, 'id' | 'user_id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('prediction_history')
        .insert({
          ...prediction,
          user_id: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      await fetchPredictions();
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updatePrediction = async (id: string, updates: Partial<PredictionHistory>) => {
    try {
      const { error } = await supabase
        .from('prediction_history')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user!.id);

      if (error) throw error;
      await fetchPredictions();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return { predictions, loading, error, savePrediction, updatePrediction, refetch: fetchPredictions };
}
