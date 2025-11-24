-- Drop the old check constraint that only allowed preset values
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS insight_tone_check;

-- Add a comment explaining the column now accepts both preset strings and JSON objects
COMMENT ON COLUMN profiles.insight_tone IS 'Accepts either preset names (clinical, direct, coaching, compassionate, children) or JSON objects with dimensional tone settings';