-- Create recommendation ratings table to track user feedback
CREATE TABLE public.recommendation_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('podcast', 'book', 'exercise', 'story')),
  recommendation_title TEXT NOT NULL,
  rating TEXT NOT NULL CHECK (rating IN ('up', 'down')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, session_id, recommendation_type)
);

-- Enable RLS
ALTER TABLE public.recommendation_ratings ENABLE ROW LEVEL SECURITY;

-- Users can view their own ratings
CREATE POLICY "Users can view own ratings" 
ON public.recommendation_ratings 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own ratings
CREATE POLICY "Users can insert own ratings" 
ON public.recommendation_ratings 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own ratings
CREATE POLICY "Users can update own ratings" 
ON public.recommendation_ratings 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own ratings
CREATE POLICY "Users can delete own ratings" 
ON public.recommendation_ratings 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_recommendation_ratings_user_session 
ON public.recommendation_ratings(user_id, session_id);

COMMENT ON TABLE public.recommendation_ratings IS 'Stores user ratings (thumbs up/down) for recommendations to improve future suggestions';