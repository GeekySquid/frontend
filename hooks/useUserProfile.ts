import { useState, useEffect } from 'react';
import { supabase, UserProfile } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user!.id);

      if (error) throw error;
      await fetchProfile();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return { profile, loading, error, updateProfile, refetch: fetchProfile };
}
