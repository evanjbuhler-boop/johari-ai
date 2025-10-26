-- Create exercises library table
CREATE TABLE public.exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  duration TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  steps JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user exercise history table
CREATE TABLE public.user_exercise_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id),
  recommended_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, exercise_id, recommended_at)
);

-- Enable RLS
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_exercise_history ENABLE ROW LEVEL SECURITY;

-- Exercises are readable by everyone (public content)
CREATE POLICY "Exercises are viewable by everyone" 
ON public.exercises 
FOR SELECT 
USING (true);

-- Users can view their own exercise history
CREATE POLICY "Users can view own exercise history" 
ON public.user_exercise_history 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own exercise history
CREATE POLICY "Users can insert own exercise history" 
ON public.user_exercise_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create index for efficient querying
CREATE INDEX idx_user_exercise_history_user_date 
ON public.user_exercise_history(user_id, recommended_at DESC);

-- Insert 50 evidence-based exercises
INSERT INTO public.exercises (title, description, duration, category, tags, steps) VALUES

-- CBT Exercises (10)
('Thought Record', 'Identify and challenge negative automatic thoughts using structured CBT techniques.', '10-15 minutes', 'CBT', ARRAY['anxiety', 'depression', 'negative-thoughts'], 
'[{"stepNumber":1,"title":"Identify the situation","content":"Describe what happened that triggered your thoughts. Be specific about time, place, and circumstances.","inputRequired":true,"inputType":"textarea"},{"stepNumber":2,"title":"Notice your emotions","content":"What emotions did you feel? Rate their intensity from 0-10.","inputRequired":true,"inputType":"textarea"},{"stepNumber":3,"title":"Catch your automatic thought","content":"What thought went through your mind? Write it exactly as you thought it.","inputRequired":true,"inputType":"textarea"},{"stepNumber":4,"title":"Find the evidence","content":"What evidence supports this thought? What evidence contradicts it?","inputRequired":true,"inputType":"textarea"},{"stepNumber":5,"title":"Generate an alternative","content":"What''s a more balanced way to view this situation?","inputRequired":true,"inputType":"textarea"}]'),

('Behavioral Activation Plan', 'Schedule meaningful activities to combat low mood and withdrawal.', '15 minutes', 'CBT', ARRAY['depression', 'motivation', 'behavioral-activation'],
'[{"stepNumber":1,"title":"Identify valued activities","content":"List 3-5 activities that used to bring you joy or align with your values, even if they don''t feel appealing right now.","inputRequired":true,"inputType":"textarea"},{"stepNumber":2,"title":"Rate difficulty","content":"Rate each activity on difficulty (1=easy, 10=very hard) and importance (1=not important, 10=very important).","inputRequired":true,"inputType":"textarea"},{"stepNumber":3,"title":"Choose and schedule","content":"Pick one activity with moderate difficulty and high importance. When will you do it? Be specific.","inputRequired":true,"inputType":"text"},{"stepNumber":4,"title":"Break it down","content":"If the activity feels overwhelming, break it into smaller steps. What''s the first tiny step?","inputRequired":true,"inputType":"textarea"},{"stepNumber":5,"title":"Plan for obstacles","content":"What might get in the way? How will you handle it?","inputRequired":true,"inputType":"textarea"}]'),

('Cognitive Distortion Detective', 'Learn to spot and name common thinking errors.', '10 minutes', 'CBT', ARRAY['anxiety', 'negative-thoughts', 'awareness'],
'[{"stepNumber":1,"title":"Recall a recent distressing thought","content":"Write down a thought that upset you today or this week.","inputRequired":true,"inputType":"textarea"},{"stepNumber":2,"title":"Review distortion types","content":"Review these common distortions: All-or-Nothing Thinking, Overgeneralization, Mental Filter, Catastrophizing, Emotional Reasoning, Should Statements, Labeling, Personalization.","inputRequired":false},{"stepNumber":3,"title":"Name the distortion","content":"Which distortion(s) best describe your thought? You might spot more than one.","inputRequired":true,"inputType":"textarea"},{"stepNumber":4,"title":"Reframe it","content":"Now that you''ve named the distortion, how would you rewrite this thought more accurately?","inputRequired":true,"inputType":"textarea"}]'),

('Problem-Solving Worksheet', 'Break down overwhelming problems into manageable action steps.', '15-20 minutes', 'CBT', ARRAY['stress', 'overwhelm', 'decision-making'],
'[{"stepNumber":1,"title":"Define the problem","content":"Describe the problem clearly and specifically. What exactly needs to be solved?","inputRequired":true,"inputType":"textarea"},{"stepNumber":2,"title":"Brainstorm solutions","content":"List ALL possible solutions, even unrealistic ones. Don''t judge yet—just generate options.","inputRequired":true,"inputType":"textarea"},{"stepNumber":3,"title":"Evaluate pros and cons","content":"For your top 3 solutions, list the pros and cons of each.","inputRequired":true,"inputType":"textarea"},{"stepNumber":4,"title":"Choose and plan","content":"Select the best solution. What are the specific steps to implement it?","inputRequired":true,"inputType":"textarea"},{"stepNumber":5,"title":"Set a review date","content":"When will you check in on your progress? Schedule it now.","inputRequired":true,"inputType":"text"}]'),

('Worry Time Technique', 'Contain anxious thoughts to a specific time period rather than letting them dominate your day.', '15 minutes', 'CBT', ARRAY['anxiety', 'worry', 'time-management'],
'[{"stepNumber":1,"title":"Schedule your worry time","content":"Pick a specific 15-minute block today when you''ll address your worries. Not before bed!","inputRequired":true,"inputType":"text"},{"stepNumber":2,"title":"Collect worries throughout the day","content":"When worries pop up, write them down and tell yourself: ''I''ll think about this during worry time.''","inputRequired":true,"inputType":"textarea"},{"stepNumber":3,"title":"Review your worry list","content":"During your scheduled time, go through each worry. Is it productive (solvable) or unproductive (out of your control)?","inputRequired":true,"inputType":"textarea"},{"stepNumber":4,"title":"Problem-solve or let go","content":"For productive worries, make an action plan. For unproductive ones, practice letting them go.","inputRequired":true,"inputType":"textarea"}]'),

('Cost-Benefit Analysis', 'Weigh the advantages and disadvantages of maintaining a particular belief or behavior.', '15 minutes', 'CBT', ARRAY['decision-making', 'beliefs', 'change'],
'[{"stepNumber":1,"title":"Identify the belief or behavior","content":"What belief or behavior pattern are you examining? Be specific.","inputRequired":true,"inputType":"textarea"},{"stepNumber":2,"title":"List the benefits","content":"What are ALL the advantages of holding this belief or continuing this behavior? Include short-term comfort.","inputRequired":true,"inputType":"textarea"},{"stepNumber":3,"title":"List the costs","content":"What are ALL the disadvantages? How does it impact your life, relationships, goals?","inputRequired":true,"inputType":"textarea"},{"stepNumber":4,"title":"Weigh the evidence","content":"Looking at your lists, does the cost outweigh the benefit? What does this tell you?","inputRequired":true,"inputType":"textarea"},{"stepNumber":5,"title":"Consider alternatives","content":"If you decided to change, what would you do instead? What would be different?","inputRequired":true,"inputType":"textarea"}]'),

('Evidence-Based Worry Evaluation', 'Test the validity of anxious predictions using evidence.', '10 minutes', 'CBT', ARRAY['anxiety', 'worry', 'reality-testing'],
'[{"stepNumber":1,"title":"State your worry","content":"What are you worried will happen? Be specific about your prediction.","inputRequired":true,"inputType":"textarea"},{"stepNumber":2,"title":"Estimate probability","content":"What''s the realistic probability this will happen? (0-100%)","inputRequired":true,"inputType":"text"},{"stepNumber":3,"title":"Examine past evidence","content":"How many times has this actually happened before versus how many times you''ve worried about it?","inputRequired":true,"inputType":"textarea"},{"stepNumber":4,"title":"Consider alternatives","content":"What are 3 other possible outcomes that are more likely?","inputRequired":true,"inputType":"textarea"},{"stepNumber":5,"title":"Plan coping","content":"Even if your worry came true, how would you cope? What resources do you have?","inputRequired":true,"inputType":"textarea"}]'),

('Downward Arrow Technique', 'Uncover core beliefs by exploring the meaning behind your thoughts.', '15 minutes', 'CBT', ARRAY['self-awareness', 'core-beliefs', 'deep-work'],
'[{"stepNumber":1,"title":"Start with a thought","content":"Write down an automatic thought that''s been bothering you.","inputRequired":true,"inputType":"textarea"},{"stepNumber":2,"title":"Ask: What would that mean?","content":"If that thought were true, what would it mean about you, others, or the world?","inputRequired":true,"inputType":"textarea"},{"stepNumber":3,"title":"Keep going deeper","content":"And if THAT were true, what would it mean? Continue asking this 2-3 more times.","inputRequired":true,"inputType":"textarea"},{"stepNumber":4,"title":"Identify the core belief","content":"You''ve likely uncovered a core belief. What is it? (e.g., ''I''m unlovable'', ''The world is dangerous'')","inputRequired":true,"inputType":"textarea"},{"stepNumber":5,"title":"Challenge it","content":"Is this core belief absolutely true? What evidence contradicts it?","inputRequired":true,"inputType":"textarea"}]'),

('Thought Defusion Practice', 'Create distance from difficult thoughts by changing your relationship with them.', '5-10 minutes', 'CBT', ARRAY['mindfulness', 'thoughts', 'defusion'],
'[{"stepNumber":1,"title":"Notice the thought","content":"Identify a thought that''s been bothering you. Write it down.","inputRequired":true,"inputType":"textarea"},{"stepNumber":2,"title":"Add: I''m having the thought that...","content":"Rewrite your thought starting with: ''I''m having the thought that...'' Notice how this creates distance.","inputRequired":true,"inputType":"textarea"},{"stepNumber":3,"title":"Further: I notice I''m having the thought that...","content":"Add another layer: ''I notice I''m having the thought that...'' How does this feel?","inputRequired":true,"inputType":"textarea"},{"stepNumber":4,"title":"Sing it","content":"Say your original thought in the tune of ''Happy Birthday''. This breaks the thought''s power. How silly does it seem now?","inputRequired":false},{"stepNumber":5,"title":"Reflect","content":"Thoughts are just words, not facts. How does this exercise change your relationship with this thought?","inputRequired":true,"inputType":"textarea"}]'),

('Exposure Hierarchy Builder', 'Create a step-by-step plan to gradually face feared situations.', '20 minutes', 'CBT', ARRAY['anxiety', 'exposure', 'phobia', 'avoidance'],
'[{"stepNumber":1,"title":"Identify your fear","content":"What situation or object are you avoiding? Be specific.","inputRequired":true,"inputType":"textarea"},{"stepNumber":2,"title":"Break it into steps","content":"List 8-10 steps from least to most anxiety-provoking. Start with something manageable, end with your ultimate goal.","inputRequired":true,"inputType":"textarea"},{"stepNumber":3,"title":"Rate anxiety levels","content":"Rate the anxiety you''d expect for each step (0-10). Aim for gradual increases.","inputRequired":true,"inputType":"textarea"},{"stepNumber":4,"title":"Start small","content":"Choose a step rated 3-4 to start with. When will you try it?","inputRequired":true,"inputType":"text"},{"stepNumber":5,"title":"Plan support","content":"What coping strategies will you use? Who can support you?","inputRequired":true,"inputType":"textarea"}]');

-- Will continue with more exercises in next part due to length
