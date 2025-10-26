-- Create chat_sessions table to track session metadata
CREATE TABLE public.chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  session_type TEXT, -- 'nightly_routine', 'venting_session', etc.
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions"
ON public.chat_sessions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can insert own sessions"
ON public.chat_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions"
ON public.chat_sessions
FOR UPDATE
USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_started_at ON public.chat_sessions(started_at DESC);