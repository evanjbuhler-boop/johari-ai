import AppLayout from '@/components/AppLayout';
import ResultsDisplay from '@/components/ResultsDisplay';
import { CheckInResults } from '@/types/checkin';
import recommendationsData from '@/data/recommendations.json';
import { useMemo } from 'react';

// Helper to randomly select an item from array
const getRandomItem = <T,>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

const mockResults: CheckInResults = {
  byline: "Navigating work pressure while managing perfectionism and self-doubt",
  whatsHappening: {
    summary:
      "You're caught in a cycle where the drive to perform perfectly is creating intense anxiety about making mistakes, which then makes it harder to focus and deliver the quality work you're capable of.",
    themes: ["Perfectionism", "Work Anxiety", "Self-Worth"],
    fullExplanation:
      "Here's what I'm noticing: you've built a version of success that depends on never making mistakes. And I get it—perfectionism probably helped you achieve a lot. But somewhere along the way, it stopped being a tool and became a trap. Every task now carries this weight of \"if I mess this up, it means something fundamental about who I am.\" That's exhausting, and it's also not true.\n\nYour brain has learned to treat imperfection like a threat. So when you're facing something challenging at work, your nervous system kicks into the same mode it would use if you were facing actual danger. Your thinking gets narrower, your creativity shuts down, and suddenly the very qualities you need to do good work become harder to access. It's like trying to paint a masterpiece while someone's yelling that the building is on fire.\n\nI'm curious about where this started for you. Often, perfectionism develops because at some point, we learned that our worth was tied to what we achieved. Maybe approval came when you exceeded expectations, or maybe criticism came when you fell short. Over time, you might have internalized that message so deeply that you don't even need anyone else anymore—you've become both the demanding voice and the one trying desperately to meet those demands. That's a lonely place to be, and it makes rest feel dangerous instead of necessary.",
    citations: [
      { author: 'Nolen-Hoeksema, S.', year: 2001, title: 'Gender differences in depression' },
      { author: 'Teasdale, J.D. et al.', year: 2002, title: 'Metacognitive awareness and prevention of relapse in depression' },
    ],
  },
  quotes: [
    { text: "I feel like I'm always one mistake away from being found out", sentiment: 'negative' },
    { text: "Even when I do well, I can't shake the feeling it wasn't good enough", sentiment: 'negative' },
  ],
  reframing: {
    content:
      "I wonder if perfectionism is actually protecting you—or preventing you from seeing what's already working. Every time you achieve something and immediately dismiss it as \"not good enough\" or \"just luck,\" you're training your brain to overlook evidence of your capability. You're filtering reality to only see the flaws, which means you're making decisions based on incomplete information.\n\nHere's what's interesting: the perfectionism that feels like a high standard might actually be limiting your performance. When you approach work from fear and self-criticism, your thinking narrows, your creativity shuts down, and you become rigid. Compare that to approaching work from curiosity—that's when your brain can actually do its best work. You're not lowering your standards by being kinder to yourself; you're creating the conditions where you can actually meet them.\n\nBut here's the question I keep coming back to: How would you respond if a colleague came to you with the same anxiety you're carrying? Would you tell them they're one mistake away from being exposed? Or would you help them see the bigger picture of their competence? That voice you use with yourself—the one that's constantly bracing for failure—it's not neutral. It's actively shaping what you're capable of seeing and doing. What if treating yourself with the same grace you'd extend to others isn't self-indulgence, but actually the most practical thing you could do?",
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
  // Randomly select a podcast and book from recommendations on each render
  const dynamicResults = useMemo(() => {
    const selectedPodcast = getRandomItem(recommendationsData.podcasts);
    const selectedBook = getRandomItem(recommendationsData.books);

    // Find Spotify and Apple Podcasts links
    const spotifyLink = 
      selectedPodcast.links.primary.label.includes('Spotify') 
        ? selectedPodcast.links.primary.url
        : selectedPodcast.links.alternatives.find((alt: any) => alt.label.includes('Spotify'))?.url 
        || selectedPodcast.links.primary.url;
    
    const applePodcastsLink = 
      selectedPodcast.links.primary.label.includes('Apple') 
        ? selectedPodcast.links.primary.url
        : selectedPodcast.links.alternatives.find((alt: any) => alt.label.includes('Apple'))?.url 
        || selectedPodcast.links.primary.url;

    return {
      ...mockResults,
      podcast: {
        title: selectedPodcast.show,
        host: selectedPodcast.host,
        episode: selectedPodcast.title,
        duration: selectedPodcast.duration,
        description: selectedPodcast.description,
        whyThisHelps: selectedPodcast.whyThisHelps,
        thumbnail: selectedPodcast.coverImage,
        urls: {
          spotify: spotifyLink,
          applePodcasts: applePodcastsLink,
        },
      },
      book: {
        title: selectedBook.title,
        author: selectedBook.author,
        byline: selectedBook.helpsWith.slice(0, 3).join(', '),
        description: selectedBook.description,
        length: selectedBook.readTime,
        whyThisHelps: selectedBook.whyThisHelps,
        coverImage: selectedBook.coverImage,
        purchaseUrl: selectedBook.links.primary.url,
      },
    };
  }, []);

  return (
    <AppLayout showBackground={false} hideSettingsIcons>
      <ResultsDisplay 
        results={dynamicResults} 
        onNewCheckIn={() => {}} 
        sessionId="preview-session"
        sessionTheme="work stress"
      />
    </AppLayout>
  );
}
