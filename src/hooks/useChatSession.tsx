import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useChatSession = () => {
  const { user } = useAuth();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const startSession = async (therapyApproach?: string | null) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          therapy_approach: therapyApproach || null,
          started_at: new Date().toISOString(),
          completed: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error starting session:', error);
        return null;
      }

      setCurrentSessionId(data.id);
      return data.id;
    } catch (error) {
      console.error('Error starting session:', error);
      return null;
    }
  };

  const endSession = async (sessionId: string | null, completed: boolean = true) => {
    if (!user || !sessionId) return;

    try {
      await supabase
        .from('chat_sessions')
        .update({
          ended_at: new Date().toISOString(),
          completed
        })
        .eq('id', sessionId)
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  const getLastSession = async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching last session:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching last session:', error);
      return null;
    }
  };

  return {
    currentSessionId,
    startSession,
    endSession,
    getLastSession
  };
};
