-- Add insight_tone column to profiles table
ALTER TABLE public.profiles
ADD COLUMN insight_tone TEXT DEFAULT 'clinical' NOT NULL;

-- Add check constraint for valid tone values
ALTER TABLE public.profiles
ADD CONSTRAINT insight_tone_check 
CHECK (insight_tone IN ('clinical', 'direct', 'coaching', 'compassionate', 'children'));