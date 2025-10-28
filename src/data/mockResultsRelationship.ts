import { CheckInResults } from '@/types/checkin';

// Example showing theory of mind applied to relationship dynamics
export const relationshipMockResults: CheckInResults = {
  byline: "Navigating ambiguity and longing after a relationship that never quite committed",
  whatsHappening: {
    summary:
      "You're experiencing emotional conflict between your desire for clarity and the uncertainty created by your ex's mixed signals. This ambiguity is triggering fears about your self-worth and future relationships.",
    themes: ["longing", "ambiguity", "self-worth"],
    fullExplanation:
      "The uncertainty you're experiencing feels unbearable because humans are wired to resolve ambiguity. When someone important to us sends mixed messages, our brain goes into overdrive trying to figure out what it means—and often, we fill in the blanks with our worst fears. You're interpreting their inability to commit as evidence about your value, when it might actually be evidence about their own struggles with vulnerability or fear.\n\nWhat's harder to see from inside the experience is that your ex might be just as confused as you are. People who struggle with commitment aren't usually doing it maliciously—they're often caught between genuine feelings and deep-seated fears they may not fully understand themselves. Maybe they learned early that getting close to someone meant getting hurt, or that their needs wouldn't be met. When you're operating from that blueprint, even wanting someone can feel dangerous.\n\nThe emotional turmoil you're feeling isn't just about this relationship ending—it's triggering older questions about whether you're enough, whether you can trust people, whether love is safe. Those are the questions that keep you up at night, replaying conversations and looking for signs you might have missed. But here's what I'm noticing: you're taking full responsibility for making sense of their mixed signals, while they're taking none of the responsibility for being clear. That's an exhausting position to be in, and it's not actually fair to you.",
    citations: [
      { author: 'Mikulincer, M. & Shaver, P.R.', year: 2007, title: 'Attachment in Adulthood: Structure, Dynamics, and Change' },
      { author: 'Lerner, H.', year: 2014, title: 'The Dance of Anger: A Woman\'s Guide to Changing Patterns' },
    ],
  },
  quotes: [
    { text: "They said they care about me but can't commit—what does that even mean?", sentiment: 'negative' },
    { text: "I keep wondering what I could have done differently", sentiment: 'negative' },
  ],
  reframing: {
    content:
      "I'm curious about something: you're spending a lot of energy trying to decode their behavior and figure out what you might have done wrong. But what if their uncertainty isn't actually about you? What if someone can genuinely care about you and still not be in a place where they can show up the way a relationship needs them to?\n\nConsider this possibility: maybe they're not withholding commitment because you're not enough—maybe they're withholding it because they're scared of what happens when they let someone in. People who've been hurt before sometimes develop this pattern where they get close enough to feel the warmth but pull back before they feel the burn. It's not rational, and it's not about you being deficient. It's about them being stuck.\n\nBut here's where I want to gently challenge you: you're accepting a version of this where you're responsible for their uncertainty. You're reviewing everything you said and did, looking for the moment you scared them off. But what about the moments they scared you? What about the fact that you needed clarity and consistency, and they couldn't provide that? You're treating their inability to commit as a referendum on your worth, but what if it's actually information about their capacity right now?\n\nThe hardest thing might be accepting that you can't think your way to the answer. You can't decode what they meant or figure out the perfect thing you should have said. Sometimes people aren't clear because they themselves aren't clear. And sometimes the most loving thing we can do—for them and for ourselves—is to stop trying to fix their ambiguity and start honoring our own need for something more solid.",
  },
  podcast: {
    title: 'Where Should We Begin?',
    host: 'Esther Perel',
    episode: 'I Want to Trust You, But I Keep Testing You',
    duration: '48 min',
    description:
      'Esther Perel explores how past hurts shape our capacity for trust and vulnerability in new relationships, and why some people push away the very connection they crave.',
    whyThisHelps:
      'This episode helps you understand that relationship patterns often have less to do with you and more to do with unresolved fears and attachment wounds.',
    thumbnail: 'https://via.placeholder.com/300x300?text=Podcast',
    urls: {
      spotify: 'https://open.spotify.com/show/2iMNaHUWdpLtBO3eZqUmYx',
      applePodcasts: 'https://podcasts.apple.com/us/podcast/where-should-we-begin-with-esther-perel/id1237931798',
    },
  },
  book: {
    title: 'Attached',
    author: 'Amir Levine & Rachel Heller',
    byline: 'Understanding attachment styles and how they shape relationships',
    description:
      'This book reveals how understanding attachment styles can help you identify compatible partners and navigate relationship dynamics with more clarity and less anxiety.',
    length: '304 pages / 5-hour read',
    whyThisHelps:
      'Understanding attachment theory can help you see that relationship struggles often stem from mismatched attachment needs rather than personal failings.',
    coverImage: 'https://via.placeholder.com/300x450?text=Book+Cover',
    purchaseUrl: 'https://bookshop.org/books/attached-the-new-science-of-adult-attachment-and-how-it-can-help-you-find-and-keep-love',
  },
  exercise: {
    title: 'Theory of Mind Perspective Taking',
    description:
      'Practice seeing relationship dynamics from multiple perspectives, including the possibility that the other person is struggling with their own fears rather than rejecting you.',
    duration: '15-20 minutes',
    whyHelps:
      'This exercise helps you step outside your own narrative and consider alternative explanations for others\' behavior, reducing self-blame and expanding your understanding.',
    steps: [
      {
        stepNumber: 1,
        title: 'Name your interpretation',
        content:
          'Write down your current interpretation of what their behavior means. Be honest about the story you\'re telling yourself (e.g., "They don\'t want me because I\'m not enough").',
        inputRequired: true,
        inputType: 'textarea',
      },
      {
        stepNumber: 2,
        title: 'Consider their context',
        content:
          'What do you know about their history with relationships, vulnerability, or commitment? What fears or wounds might they be carrying?',
        inputRequired: true,
        inputType: 'textarea',
      },
      {
        stepNumber: 3,
        title: 'Generate alternative explanations',
        content:
          'List 3-5 alternative explanations for their behavior that have nothing to do with your worth. What if their actions are about their own fears, patterns, or unresolved pain?',
        inputRequired: true,
        inputType: 'textarea',
      },
      {
        stepNumber: 4,
        title: 'Notice what shifts',
        content:
          'How does it feel to consider these alternative explanations? Does anything change about how you see yourself or the situation?',
        inputRequired: true,
        inputType: 'textarea',
      },
    ],
  },
  story: {
    title: 'The Two Wolves',
    culturalOrigin: 'Cherokee Teaching',
    content:
      "An old Cherokee told his grandson about a battle that goes on inside all people. He said, 'My son, there is a battle between two wolves inside us all.\n\nOne wolf is Evil. It is anger, envy, jealousy, sorrow, regret, greed, arrogance, self-pity, guilt, resentment, inferiority, lies, false pride, superiority, and ego.\n\nThe other wolf is Good. It is joy, peace, love, hope, serenity, humility, kindness, benevolence, empathy, generosity, truth, compassion, and faith.'\n\nThe grandson thought about it and then asked his grandfather, 'Which wolf wins?'\n\nThe old Cherokee simply replied, 'The one you feed.'",
    whyThisMatters:
      "Right now, you're feeding the wolf that tells you this situation is evidence of your inadequacy. Every time you replay the relationship looking for your mistakes, every time you interpret their ambivalence as rejection, you're feeding that wolf. But there's another wolf—one that knows your worth isn't determined by someone else's capacity to see it. Which wolf are you choosing to feed?",
  },
  patterns: [
    'Interpreting others\' ambiguity as self-rejection',
    'Taking full responsibility for relationship dynamics',
    'Difficulty accepting uncertainty',
  ],
};
