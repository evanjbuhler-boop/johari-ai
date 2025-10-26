-- Create table for validation feedback
CREATE TABLE IF NOT EXISTS public.validation_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_data JSONB NOT NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('positive', 'negative')),
  feedback_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.validation_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can insert their own feedback" 
ON public.validation_feedback 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback" 
ON public.validation_feedback 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_validation_feedback_user_id ON public.validation_feedback(user_id);
CREATE INDEX idx_validation_feedback_created_at ON public.validation_feedback(created_at DESC);