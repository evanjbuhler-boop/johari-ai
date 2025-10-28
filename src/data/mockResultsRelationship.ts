import { CheckInResults } from '@/types/checkin';

// Example showing theory of mind applied to relationship dynamics
export const relationshipMockResults: CheckInResults = {
  byline: "Navigating ambiguity and longing after a relationship that never quite committed",
  whatsHappening: {
    summary:
      "You're experiencing emotional conflict between your desire for clarity and the uncertainty created by your ex's mixed signals. This ambiguity is triggering fears about your self-worth and future relationships.",
    themes: ["longing", "ambiguity", "self-worth"],
    fullExplanation:
      "The emotional conflict stems from unresolved ambiguity in the relationship. Humans are neurologically wired to resolve uncertainty, and when someone significant sends mixed signals, the brain enters a heightened state trying to decode meaning. Often, the blanks get filled with worst-case interpretations—their inability to commit becomes internalized as evidence of inadequacy rather than information about their own struggles with vulnerability.\n\nPeople who struggle with commitment are rarely doing so maliciously. They're often caught between genuine feelings and deep-seated fears they may not fully understand themselves. Attachment research shows that individuals who experienced inconsistent caregiving or relational trauma often develop conflicted relationship patterns—simultaneously desiring connection while fearing the vulnerability it requires. When operating from this framework, even wanting someone can trigger defensive withdrawal.\n\nThe emotional turmoil extends beyond this specific relationship—it's activating deeper questions about self-worth, trust, and safety in intimacy. These are the concerns that drive rumination and compulsive reviewing of conversations for missed signs. What's notable in this pattern is the asymmetry of responsibility: taking full ownership of decoding their mixed signals while they take none of the responsibility for providing clarity. This creates an exhausting and ultimately unfair dynamic.",
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
      "Significant energy is being directed toward decoding their behavior and identifying personal failures that might explain their uncertainty. But their ambivalence may have little to do with your adequacy. Someone can genuinely care while simultaneously lacking the psychological capacity to show up in the way a committed relationship requires.\n\nConsider an alternative framework: perhaps commitment is being withheld not because of deficiency in you, but because of their own fear of vulnerability. People with unresolved attachment wounds often develop a pattern of approaching intimacy to a point where it feels warm, then withdrawing before it feels threatening. This isn't rational decision-making about your worthiness—it's an automatic protective response rooted in their own history.\n\nNotice the asymmetry in how responsibility is being distributed. You're reviewing every conversation and interaction, searching for the moment that caused their withdrawal. But what about their responsibility to provide the clarity and consistency you needed? Their inability to commit is being treated as a verdict on your value, when it might be information about their current capacity for intimacy. The assumption that their ambiguity must be decoded—that there's a hidden message about your inadequacy—may itself be a cognitive distortion worth examining.\n\nSometimes people aren't clear because they themselves aren't clear. The most self-respecting response may not be trying to fix their ambiguity, but rather acknowledging your own need for something more stable and choosing to honor that need.\n\n**Questions to consider:**\n• If their uncertainty reflects their own struggles with vulnerability rather than your inadequacy, how does that change the story you're telling yourself?\n• What would it mean to stop taking responsibility for making sense of mixed signals they're not willing to clarify?\n• Are you filtering out the moments where they failed to meet your legitimate needs for consistency and clarity?",
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
      "The wolf being fed is the one that interprets this situation as evidence of inadequacy. Each time the relationship is replayed looking for mistakes, each time their ambivalence is interpreted as rejection, that narrative grows stronger. But there's another possibility—one where worth isn't determined by someone else's capacity to recognize it. The choice of which interpretation to strengthen shapes not just how this situation is remembered, but how future relationships are approached.",
  },
  patterns: [
    'Interpreting others\' ambiguity as self-rejection',
    'Taking full responsibility for relationship dynamics',
    'Difficulty accepting uncertainty',
  ],
};
