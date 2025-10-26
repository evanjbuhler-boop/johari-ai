-- Add preview column to saved_items table
ALTER TABLE public.saved_items
ADD COLUMN preview TEXT;

-- Add a comment explaining the column
COMMENT ON COLUMN public.saved_items.preview IS 'One-sentence preview generated from the resource content';