-- Add 'research' as a valid item_type to saved_items
-- This will allow us to categorize "What the Research Says" separately from stories

-- First, we need to update any existing 'story' items that are actually research
-- (items with title "What the Research Says" or "The Theory")
UPDATE saved_items 
SET item_type = 'research'
WHERE item_type = 'story' 
AND title IN ('What the Research Says', 'The Theory', 'What the Research Says');

-- Note: The item_type column is already text type, so no schema change needed
-- But we should add a comment to document the valid types
COMMENT ON COLUMN saved_items.item_type IS 'Valid types: podcast, book, exercise, story, research';