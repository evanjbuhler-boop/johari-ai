-- Add feedback and context fields to recommendation_ratings table
ALTER TABLE public.recommendation_ratings
ADD COLUMN IF NOT EXISTS feedback_reason TEXT,
ADD COLUMN IF NOT EXISTS session_theme TEXT,
ADD COLUMN IF NOT EXISTS user_profile_context JSONB;

-- Add index for querying ratings by recommendation type for ML analysis
CREATE INDEX IF NOT EXISTS idx_recommendation_ratings_type_rating 
ON public.recommendation_ratings(recommendation_type, rating);

-- Add index for querying by session theme for personalization
CREATE INDEX IF NOT EXISTS idx_recommendation_ratings_session_theme 
ON public.recommendation_ratings(session_theme) 
WHERE session_theme IS NOT NULL;

-- Add a comment explaining the purpose of these fields
COMMENT ON COLUMN public.recommendation_ratings.feedback_reason IS 
'User-provided explanation for downvotes - critical for improving recommendations';

COMMENT ON COLUMN public.recommendation_ratings.session_theme IS 
'Theme/topic of the session (e.g., work stress, anxiety) - helps personalize recommendations';

COMMENT ON COLUMN public.recommendation_ratings.user_profile_context IS 
'Snapshot of relevant user profile data at time of rating - enables better ML training';