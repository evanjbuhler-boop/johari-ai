import AppLayout from '@/components/AppLayout';
import ResultsDisplay from '@/components/ResultsDisplay';
import { CheckInResults } from '@/types/checkin';

const mockResults: CheckInResults = {
  byline: "Navigating work pressure while managing perfectionism and self-doubt",
  whatsHappening: {
    summary:
      "You're caught in a cycle where the drive to perform perfectly is creating intense anxiety about making mistakes, which then makes it harder to focus and deliver the quality work you're capable of.",
    themes: ["Perfectionism", "Work Anxiety", "Self-Worth"],
    fullExplanation:
      "This pattern is classic high-functioning anxiety—a psychological phenomenon where the very mechanisms that once helped you succeed have become sources of distress. You've likely built your identity and self-worth around achieving exceptional standards, creating what psychologists call a \"contingent self-esteem\" framework. When your value depends on flawless performance, every task becomes weighted with existential significance. The fear of failure isn't just about the task itself; it represents a threat to your core sense of worthiness.\n\nWhat's happening neurologically is that your amygdala—the brain's threat detection system—has learned to interpret imperfection as danger. Each time you face a challenging work situation, your nervous system activates the same fight-or-flight response it would use for physical threats. This floods your prefrontal cortex (responsible for complex thinking and decision-making) with stress hormones like cortisol, which actually impairs the cognitive functions you need most. The irony is brutal: your anxiety about performing well literally makes it harder to perform well, creating the self-fulfilling prophecy you're experiencing.\n\nFrom a psychodynamic perspective, perfectionism often develops as an adaptive strategy—perhaps you learned early that achievement brought approval, or that mistakes led to criticism or withdrawal of love. These early experiences create what attachment theorists call \"conditional regard,\" where you internalize the belief that you must earn acceptance through performance. Now, as an adult, you've internalized this dynamic: you've become both the demanding parent and the striving child, locked in an exhausting internal relationship where rest and self-compassion feel dangerous because they might lead to the rejection you're trying so hard to prevent.",
    citations: [{ author: 'Brené Brown', year: 2010, title: 'The Gifts of Imperfection' }],
  },
  quotes: [
    { text: "I feel like I'm always one mistake away from being found out", sentiment: 'negative' },
    { text: "Even when I do well, I can't shake the feeling it wasn't good enough", sentiment: 'negative' },
  ],
  reframing: {
    content:
      "What if perfectionism isn't protecting you from failure—it's preventing you from experiencing success? Consider this: every time you complete something well but immediately dismiss it as \"not good enough\" or \"just luck,\" you're training your brain to overlook evidence of your capability. You're essentially running a very sophisticated experiment in selective attention, where you've programmed yourself to notice only the flaws and filter out the achievements. Neuroscience tells us that what we pay attention to literally shapes our neural pathways. By focusing exclusively on what's wrong, you're strengthening the neural networks that detect threats and weakening the ones that recognize safety and success.\n\nThe deeper irony here is that your perfectionism, which feels like a high standard, might actually be lowering your performance. Think about it: when you approach work from a place of fear and self-criticism, you're operating in a threat-based state that narrows your thinking, reduces creativity, and makes you more rigid. Compare that to approaching work from curiosity and self-compassion—states that activate the parts of your brain associated with exploration, flexible problem-solving, and resilience when things don't go as planned. You're not aiming to lower your standards; you're aiming to achieve them from a more resourceful mental state.\n\nHere's a question worth sitting with: What would it look like to treat yourself with the same grace you'd extend to a colleague who was struggling? If someone you respected came to you anxious about a mistake, would you tell them they're one error away from being exposed as incompetent? Or would you help them contextualize the mistake within the larger pattern of their competence? The voice you use with yourself matters—not in a soft, feel-good way, but in a hard, practical way that affects your actual performance and wellbeing. Self-compassion isn't self-indulgence; it's the foundation of sustainable excellence.",
  },
  podcast: {
    title: 'Unlocking Us with Brené Brown',
    host: 'Brené Brown',
    episode: 'The Gifts of Imperfection',
    duration: '40 min',
    description:
      'In this episode, Brené discusses the importance of embracing our imperfections and how they can lead to a more authentic life.',
    whyThisHelps:
      "This episode can help you understand that it's okay to feel imperfect and that embracing these feelings can lead to a more fulfilling life.",
    thumbnail: 'https://via.placeholder.com/300x300?text=Podcast',
    urls: {
      spotify: 'https://open.spotify.com/show/4P86ZzHf7EOlRG7do9LkKZ',
      applePodcasts:
        'https://podcasts.apple.com/us/podcast/unlocking-us-with-bren%C3%A9-brown/id1494350511',
    },
  },
  book: {
    title: 'The Gifts of Imperfection',
    author: 'Brené Brown',
    byline: "Let go of who you think you're supposed to be and embrace who you are",
    description:
      'In this deeply personal book, researcher and thought leader Brené Brown explores the psychology of releasing our definitions of an imperfect life and embracing our authentic selves. Through stories and research, she shows how courage, compassion, and connection can transform the way we live.',
    length: '137 pages / 3-hour read',
    whyThisHelps:
      "This book directly addresses the perfectionism and self-doubt you're experiencing, offering practical strategies to release these feelings of pressure and self-doubt.",
    coverImage: 'https://via.placeholder.com/300x450?text=Book+Cover',
    purchaseUrl: 'https://bookshop.org/books/the-gifts-of-imperfection',
  },
  exercise: {
    title: 'Thought Record',
    description:
      'Identify and challenge negative automatic thoughts using structured CBT techniques.',
    duration: '10-15 minutes',
    whyHelps:
      'Structured reflection helps you examine thoughts objectively rather than accepting them at face value, reducing emotional intensity and creating space for more balanced perspectives.',
    steps: [
      {
        stepNumber: 1,
        title: 'Identify the situation',
        content:
          'Describe what happened that triggered your thoughts. Be specific about time, place, and circumstances.',
        inputRequired: true,
        inputType: 'textarea',
      },
      {
        stepNumber: 2,
        title: 'Notice your emotions',
        content: 'What emotions did you feel? Rate their intensity from 0-10.',
        inputRequired: true,
        inputType: 'textarea',
      },
      {
        stepNumber: 3,
        title: 'Catch your automatic thought',
        content: 'What thought went through your mind? Write it exactly as you thought it.',
        inputRequired: true,
        inputType: 'textarea',
      },
      {
        stepNumber: 4,
        title: 'Find the evidence',
        content: 'What evidence supports this thought? What evidence contradicts it?',
        inputRequired: true,
        inputType: 'textarea',
      },
      {
        stepNumber: 5,
        title: 'Generate an alternative',
        content: "What's a more balanced way to view this situation?",
        inputRequired: true,
        inputType: 'textarea',
      },
    ],
  },
  story: {
    title: 'The Cracked Pot',
    culturalOrigin: 'Indian Parable',
    content:
      "In ancient India, a water bearer served a wealthy household, carrying water from a distant stream each day using two large pots suspended from a pole across his shoulders. One pot was perfect and whole, always delivering a full portion of water. The other had a long crack running down its side, which meant that by the time the water bearer reached the house, it had leaked away half its contents.\n\nFor two full years, this daily ritual continued. The perfect pot took great pride in its accomplishments, delivering exactly what was expected. But the cracked pot grew increasingly ashamed. It could see the trail of water it left behind, the wasted effort, the incomplete delivery. Finally, overwhelmed by its perceived failure, the cracked pot spoke to the water bearer on the path: \"I am ashamed of myself, and I want to apologize to you.\"\n\n\"Why are you ashamed?\" asked the water bearer gently.\n\n\"For these two years, I have been able to deliver only half my load because this crack in my side causes water to leak out all the way back to the house. Because of my flaws, you don't get the full value of your efforts,\" the pot said sorrowfully.\n\nThe water bearer smiled with deep compassion and said, \"As we return to the house, I want you to notice the beautiful flowers along the path.\"\n\nAs they walked up the hill, the cracked pot noticed the sun warming gorgeous wildflowers on its side of the path—brilliant reds, deep purples, golden yellows. But it also noticed that on the other side of the path, where the perfect pot traveled, the ground was bare and brown.\n\nThe water bearer explained: \"I have always known about your crack, and I planted flower seeds on your side of the path. Every day as we walked back from the stream, you watered them. For two years I have been able to pick these beautiful flowers to decorate my master's table. Without you being exactly the way you are, this beauty would not exist.\"",
    whyThisMatters:
      "What you perceive as your greatest flaw may actually be creating something beautiful that you cannot yet see. Your perfectionism makes you acutely aware of every crack, every leak, every imperfection—but it blinds you to the flowers you're watering along the way. Your colleagues might see your thorough attention to detail. Your careful approach might prevent problems others overlook. Your high standards, even when they cause you stress, might be contributing value you're not acknowledging. This story asks: What if the very thing you're ashamed of is creating beauty in ways you haven't noticed? What flowers are you growing while you're busy criticizing your cracks?",
  },
  patterns: [
    'Perfectionism driving anxiety',
    'Self-worth tied to performance',
    'Difficulty accepting mistakes',
  ],
};

export default function ResultsPreview() {
  return (
    <AppLayout showBackground={false}>
      <ResultsDisplay 
        results={mockResults} 
        onNewCheckIn={() => {}} 
        sessionId="preview-session"
        sessionTheme="work stress"
      />
    </AppLayout>
  );
}
