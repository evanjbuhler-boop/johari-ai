-- Add lightweight tracking fields to chat_sessions
ALTER TABLE public.chat_sessions
ADD COLUMN message_count INTEGER DEFAULT 0,
ADD COLUMN neurodiversity_settings JSONB,
ADD COLUMN session_duration_seconds INTEGER,
ADD COLUMN time_of_day TEXT, -- 'morning', 'afternoon', 'evening', 'night'
ADD COLUMN timezone_offset INTEGER; -- minutes from UTC for accurate time_of_day calculation