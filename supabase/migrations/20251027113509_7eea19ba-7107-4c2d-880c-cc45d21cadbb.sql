-- Add why_helps field to exercises table
ALTER TABLE public.exercises 
ADD COLUMN why_helps text;

-- Update existing exercises with why_helps explanations
UPDATE public.exercises 
SET why_helps = 'Structured reflection helps you examine thoughts objectively rather than accepting them at face value, reducing emotional intensity and creating space for more balanced perspectives.'
WHERE title = 'Thought Record';

UPDATE public.exercises 
SET why_helps = 'When anxiety feels overwhelming, grounding techniques redirect your attention to the present moment, interrupting the spiral of worry and restoring a sense of safety in your body.'
WHERE title = 'Box Breathing';

UPDATE public.exercises 
SET why_helps = 'Self-compassion counteracts the harsh inner critic that intensifies suffering, allowing you to acknowledge pain while treating yourself with the same kindness you''d offer a friend.'
WHERE title = 'Self-Compassion Break';

UPDATE public.exercises 
SET why_helps = 'Progressive muscle relaxation releases physical tension that accumulates during stress, teaching your nervous system to distinguish between tension and relaxation.'
WHERE title = 'Progressive Muscle Relaxation';

UPDATE public.exercises 
SET why_helps = 'Body scan meditation builds awareness of how emotions manifest physically, helping you notice stress signals early and respond before they escalate.'
WHERE title = 'Body Scan Meditation';

UPDATE public.exercises 
SET why_helps = 'Values clarification reconnects you with what truly matters, providing direction when you feel lost and motivation when you feel stuck.'
WHERE title = 'Values Clarification';

UPDATE public.exercises 
SET why_helps = 'Gratitude practice shifts attention from what''s wrong to what''s working, rewiring neural pathways toward noticing positive aspects of life without dismissing real struggles.'
WHERE title = 'Gratitude Practice';

UPDATE public.exercises 
SET why_helps = 'Worry time contains anxious thoughts to a specific period, preventing them from hijacking your entire day while still giving them space to be processed.'
WHERE title = 'Worry Time';

UPDATE public.exercises 
SET why_helps = 'When emotions feel unmanageable, ice dive creates an immediate physiological shift that interrupts the emotional intensity and creates space for clearer thinking.'
WHERE title = 'Ice Dive';

UPDATE public.exercises 
SET why_helps = 'Future self visualization connects present actions with long-term values, making it easier to choose difficult but meaningful behaviors over comfortable avoidance.'
WHERE title = 'Future Self Visualization';