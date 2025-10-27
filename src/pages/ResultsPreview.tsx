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
      "This pattern is classic high-functioning anxiety. You've likely succeeded by setting extremely high standards, but now those same standards are becoming a source of stress rather than motivation. The fear of falling short is creating a self-fulfilling prophecy—your anxiety about performance is affecting your actual performance.",
    citations: [{ author: 'Brené Brown', year: 2010, title: 'The Gifts of Imperfection' }],
  },
  quotes: [
    { text: "I feel like I'm always one mistake away from being found out", sentiment: 'negative' },
    { text: "Even when I do well, I can't shake the feeling it wasn't good enough", sentiment: 'negative' },
  ],
  reframing: {
    content:
      "What if perfectionism isn't protecting you from failure—it's preventing you from experiencing success? Every time you achieve something but immediately dismiss it, you're training your brain to overlook evidence of your capability. The irony is that by trying so hard to avoid mistakes, you're creating the conditions for them. What would it look like to treat yourself with the same grace you'd extend to a colleague who was struggling?",
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
    title: 'The Starving Tigress',
    culturalOrigin: 'Jataka Tales',
    content:
      "A prince was walking through a forest when he came upon a tigress, weak from hunger and desperate. She was so starved that she was about to eat her own newborn cubs to survive. The prince was overcome with compassion for both the mother and her young.\n\nAfter contemplating deeply, he made an extraordinary decision. He offered his own body to the tigress so she could eat and regain strength to care for her cubs. He climbed to a cliff above where she lay and threw himself down, sacrificing his life so that she and her cubs might live. This act of ultimate selflessness and compassion became one of the most powerful teachings in Buddhist tradition about the depths of love and sacrifice possible in the human heart.",
    whyThisMatters:
      "True compassion sometimes requires personal sacrifice, helping us see beyond our own immediate needs. In your situation, you're sacrificing your peace of mind to meet impossible standards—but what if the sacrifice should be of the perfectionism itself, rather than your wellbeing? This story reminds us that we're all struggling, and the greatest act of compassion can be toward ourselves.",
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
