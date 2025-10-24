-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  age TEXT NOT NULL,
  location TEXT NOT NULL,
  life_stage TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies: Users can only see and edit their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create saved_items table
CREATE TABLE public.saved_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('podcast', 'book', 'exercise', 'story')),
  title TEXT NOT NULL,
  description TEXT,
  
  -- Podcast specific fields
  podcast_host TEXT,
  podcast_episode TEXT,
  podcast_duration TEXT,
  podcast_why_helps TEXT,
  podcast_thumbnail TEXT,
  podcast_urls JSONB,
  
  -- Book specific fields
  book_author TEXT,
  book_byline TEXT,
  book_length TEXT,
  book_why_helps TEXT,
  book_cover_image TEXT,
  book_sample_url TEXT,
  book_purchase_url TEXT,
  
  -- Exercise specific fields
  exercise_duration TEXT,
  exercise_steps JSONB,
  
  -- Story specific fields
  story_content TEXT,
  story_why_matters TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on saved_items
ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;

-- Saved items policies: Users can only see and manage their own saved items
CREATE POLICY "Users can view own saved items"
  ON public.saved_items
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved items"
  ON public.saved_items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved items"
  ON public.saved_items
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for profile updates
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, age, location, life_stage)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', ''),
    COALESCE(new.email, ''),
    COALESCE(new.raw_user_meta_data->>'age', ''),
    COALESCE(new.raw_user_meta_data->>'location', ''),
    COALESCE(new.raw_user_meta_data->>'life_stage', '')
  );
  RETURN new;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();