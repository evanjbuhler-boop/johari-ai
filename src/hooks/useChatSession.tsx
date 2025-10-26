import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Calculate time of day based on local hour
const getTimeOfDay = (date: Date): string => {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

export const useChatSession = () => {
  const { user } = useAuth();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);

  const startSession = async (
    therapyApproach?: string | null, 
    neurodiveritySettings?: any
  ) => {
    if (!user) return null;

    try {
      const now = new Date();
      const startTime = Date.now();
      setSessionStartTime(startTime);
      
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          therapy_approach: therapyApproach || null,
          neurodiversity_settings: neurodiveritySettings || null,
          time_of_day: getTimeOfDay(now),
          timezone_offset: now.getTimezoneOffset(),
          started_at: now.toISOString(),
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

  const endSession = async (
    sessionId: string | null, 
    completed: boolean = true,
    messageCount?: number
  ) => {
    if (!user || !sessionId) return;

    try {
      const updates: any = {
        ended_at: new Date().toISOString(),
        completed
      };
      
      // Calculate session duration if we have start time
      if (sessionStartTime) {
        updates.session_duration_seconds = Math.floor((Date.now() - sessionStartTime) / 1000);
      }
      
      // Add message count if provided
      if (messageCount !== undefined) {
        updates.message_count = messageCount;
      }
      
      await supabase
        .from('chat_sessions')
        .update(updates)
        .eq('id', sessionId)
        .eq('user_id', user.id);
      
      setSessionStartTime(null);
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
