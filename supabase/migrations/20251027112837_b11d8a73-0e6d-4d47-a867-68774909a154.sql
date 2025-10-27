-- Delete existing short stories
DELETE FROM public.stories;

-- Insert longer, properly detailed stories/parables (2+ paragraphs each)
INSERT INTO public.stories (title, content, source, cultural_origin, why_matters, tags) VALUES
(
  'The Starving Tigress',
  'A prince was walking through a forest when he came upon a tigress, weak from hunger and desperate. She was so starved that she was about to eat her own newborn cubs to survive. The prince was overcome with compassion for both the mother and her young.

After contemplating deeply, he made an extraordinary decision. He offered his own body to the tigress so she could eat and regain strength to care for her cubs. He climbed to a cliff above where she lay and threw himself down, sacrificing his life so that she and her cubs might live. This act of ultimate selflessness and compassion became one of the most powerful teachings in Buddhist tradition about the depths of love and sacrifice possible in the human heart.',
  'Jataka Tales',
  'Buddhist',
  'Shows that true compassion sometimes requires personal sacrifice, helping us see beyond our own needs.',
  ARRAY['compassion', 'sacrifice', 'selflessness', 'suffering']
),
(
  'The Mustard Seed',
  'A young mother, Kisa Gotami, was devastated when her only child died suddenly. Unable to accept the loss, she carried the lifeless body from house to house, desperately begging for medicine to revive him. Most people turned her away, until someone directed her to the Buddha.

The Buddha listened with deep compassion and said he could help—but first, she must bring him a mustard seed from a household that has never experienced death. Filled with hope, Kisa Gotami went from door to door throughout the village. At each house, people were willing to give her mustard seeds, but when she asked if anyone in their family had died, every single household had lost someone—a parent, a spouse, a child, a sibling. As the day wore on, she began to understand: death touches every family. Suffering is universal. She returned to the Buddha without the mustard seed but with a profound realization. She was not alone in her grief—loss is part of the human experience. This understanding brought her the first peace she had felt since her child died.',
  'Buddhist Scripture',
  'Buddhist',
  'Teaches that suffering is universal and we are not alone in our pain.',
  ARRAY['grief', 'loss', 'acceptance', 'suffering', 'perspective']
),
(
  'The Angry Snake',
  'There was once a venomous snake that lived near a village path. It would strike at anyone who passed by, terrorizing travelers and villagers alike. One day, a wise monk walked past, and the snake lunged to bite him. But the monk, unmoved and calm, looked at the snake with compassion and said, "You are causing so much suffering—to others and to yourself. Please, stop biting people."

Moved by the monk''s peaceful presence, the snake agreed and stopped attacking villagers. Months later, the monk returned to the path and found the snake bruised, battered, and weak. The villagers, discovering the snake had become docile, had thrown stones at it and beaten it mercilessly. The snake said sadly, "I did what you told me. I stopped biting, and now look what has happened."

The monk smiled gently and replied, "I told you not to bite—but I never said you couldn''t hiss." The snake understood: compassion does not mean allowing others to harm you. You can be kind without becoming a victim. You can set boundaries without cruelty.',
  'Hindu Parable',
  'Indian',
  'We can be compassionate without becoming doormats; healthy boundaries are necessary.',
  ARRAY['boundaries', 'compassion', 'assertiveness', 'self-protection']
);