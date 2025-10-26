-- Remove session_type and add therapy_approach to chat_sessions
ALTER TABLE public.chat_sessions 
DROP COLUMN session_type,
ADD COLUMN therapy_approach TEXT;