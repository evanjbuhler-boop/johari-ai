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
  byline: "You've constructed a contingent self-worth system where value is exclusively derived from flawless performance, creating decision paralysis when facing project choices",
  whatsHappening: {
    byline: "You've built a cognitive architecture where self-worth is contingent on external performance metrics. When project deadlines approach and the possibility of imperfect execution emerges, your threat-detection system activates as if professional mistakes carry existential consequences. This creates a feedback loop where anxiety about performance actively impairs the cognitive functions required for quality work.",
    summary:
      "The cognitive architecture here is contingent self-worth with an external locus of evaluation. You've constructed a self-appraisal system that measures value exclusively through achievement markers—project completion, peer approval, absence of visible mistakes. When facing the current project decision, your brain interprets potential imperfection not as professional feedback but as evidence of fundamental inadequacy.",
    themes: ["Contingent Self-Worth", "Performance Anxiety", "Decision Paralysis"],
    fullExplanation:
      "Here's what I'm noticing: You've developed a self-worth architecture where personal value requires constant external validation through flawless execution. This showed up tonight when discussing the project choice—the decision feels impossible because each option carries the weight of proving or disproving your competence. The system works like this: Your self-concept fluctuates based on performance outcomes rather than existing as a stable internal foundation. When projects go well, you experience temporary relief (not genuine confidence). When facing uncertainty about outcomes, your nervous system activates threat responses because the self-structure itself feels at risk. The cost: decision-making becomes paralyzed because you're not just choosing between project approaches—you're trying to make decisions that will retroactively validate past choices and prove your worth.",
    citations: [
      { author: 'Crocker, J. & Wolfe, C.T.', year: 2001, title: 'Contingencies of self-worth' },
      { author: 'Deci, E.L. & Ryan, R.M.', year: 2000, title: 'The "what" and "why" of goal pursuits' },
    ],
  },
  quotes: [
    { text: "I feel like I'm always one mistake away from being found out", sentiment: 'negative' },
    { text: "Even when I do well, I can't shake the feeling it wasn't good enough", sentiment: 'negative' },
  ],
  reframing: {
    content:
      "Right now you're seeing project decisions as referendums on your competence—where choosing wrong would prove fundamental inadequacy. Given the mechanism we just discussed (contingent self-worth with external validation dependence), here's another way: The paralysis isn't because the decision is objectively difficult; it's because you're asking the decision to carry impossible weight (prove past-you wasn't wrong, guarantee future-you will be validated, eliminate all uncertainty). No decision can do that. In practical terms tonight: What if you separated 'What do I want to try?' from 'What would prove I'm competent?'\n\nThe mechanism of contingent self-worth creates a specific trap: You can't make authentic choices because every decision must serve the self-worth system. This isn't about lacking confidence—it's about having built an architecture where decisions must perform multiple functions simultaneously (advance your work AND prove your value AND undo past doubts). That's why clarity feels impossible. The cognitive load isn't just evaluating project options; it's trying to make one choice solve an existential equation.\n\nConsider this: When Steve Jobs was fired from Apple, he faced the same architecture—his identity was fused with Apple's success, so losing that external validation felt like losing himself. His paralysis wasn't about career strategy; it was about trying to make his next move undo the 'proof' of inadequacy that being fired represented. What shifted wasn't his circumstances—it was separating 'What interests me now?' from 'What would vindicate my past?' NeXT and Pixar weren't strategic reputation repairs; they were curiosity-driven experiments made without requiring them to resolve past uncertainty.\n\nYour current project paralysis has the same architecture. You're not just choosing between approaches—you're trying to make the decision prove something about your past choices and future worth. Given the mechanism we discussed (contingent self-worth), the alternative isn't 'being more confident.' It's recognizing that decisions can't carry that weight. **What if you asked: 'Which option am I genuinely curious about?' rather than 'Which option proves I was right all along?'** **What becomes possible when you separate present choice from past validation?**",
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
    title: 'The Antidote: Happiness for People Who Can\'t Stand Positive Thinking',
    author: 'Oliver Burkeman',
    byline: "Embracing uncertainty and imperfection as a path to genuine confidence",
    description:
      'What if "positive thinking" and relentless optimism aren\'t the solution—but part of the problem? Burkeman investigates the "negative path" to happiness: embracing uncertainty, imperfection, and even failure. Through ancient philosophy and cutting-edge psychology, he shows why trying to feel good all the time makes us miserable, and how accepting negative feelings can set us free.',
    length: '256 pages / 5-hour read',
    whyThisHelps:
      "Burkeman specifically addresses the trap you're in: trying to make present decisions that will retroactively 'fix' past ones. Chapter 4 ('Goal Crazy') deconstructs why decision paralysis intensifies when we're trying to prove something about our past rather than simply choosing based on present values. He introduces 'negative capability'—the ability to make decisions without needing them to resolve past uncertainty. This directly targets your mechanism: you're not just indecisive, you're trying to make decisions carry too much weight (they must prove past-you wasn't wrong). Burkeman offers a framework for separating 'What do I want now?' from 'What would vindicate my past?'",
    coverImage: 'https://via.placeholder.com/300x450?text=The+Antidote',
    purchaseUrl: 'https://bookshop.org/books/the-antidote',
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
    title: 'Steve Jobs and the Identity Trap',
    culturalOrigin: 'Modern Business History',
    content:
      "In 1985, at age 30, Steve Jobs was fired from Apple—the company he co-founded in his parents' garage. It wasn't a gentle resignation or a mutual parting. The board of directors, led by the CEO Jobs himself had recruited, voted him out. For someone who had built his entire identity around being 'the founder of Apple,' this wasn't just a career setback. It was existential erasure.\n\nWhat's rarely discussed is what happened during the months after. Jobs didn't immediately bounce into his next venture with renewed confidence. He went through a period of intense paralysis and self-doubt. He later described it as feeling like he'd 'been publicly proven a failure.' Every decision felt impossible because he was trying to make his next move undo what Apple's rejection had 'proven' about him. Should he stay in tech? Would that be admitting defeat? Should he leave entirely? Would that be running away? Each option felt like it would either confirm his inadequacy or require giving up his identity.\n\nThe breakthrough wasn't a sudden burst of clarity. It was a subtle shift in what questions he was asking. He stopped trying to make decisions that would retroactively prove the board wrong, and started making decisions based on genuine curiosity. NeXT Computer wasn't a strategic move to reclaim his reputation—it was an experiment with educational computing because it interested him. Pixar wasn't about proving he could succeed in a different industry—it was about exploring animation technology because it was fascinating. Neither venture was designed to answer the question 'Was I right all along?' They were just things he wanted to try, independent of validating his past.\n\nIronically, both ventures eventually vindicated him in massive ways (Apple bought NeXT, bringing Jobs back; Pixar became a revolutionary studio). But the decisions weren't made with that goal. They were made after Jobs stopped asking 'What would prove I wasn't a failure?' and started asking 'What am I actually curious about right now?'",
    whyThisMatters:
      "Jobs' story isn't about 'failure leading to success'—that's too simple. It's about what happens when your identity is fused with external validation (Apple's success = his worth), and then that validation is suddenly removed. After being fired, Jobs went through exactly what you're experiencing: decision paralysis that comes from trying to make choices that will retroactively prove your adequacy. Every option feels impossible because you're not just choosing a path—you're trying to choose something that will undo past 'evidence' of inadequacy. Jobs' paralysis broke when he stopped asking 'What decision will validate my past?' and started asking 'What genuinely interests me right now, independent of proving anything?' Your current project paralysis has the same architecture: you're trying to make decisions carry the weight of existential proof. Jobs' path suggests separating 'What do I want to try?' from 'What would prove I was right?' As you wind down tonight, consider: What would you choose if the decision didn't have to prove anything about your past or guarantee anything about your future? What becomes possible when you let a choice just be a choice?",
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

    console.log('🎵 Selected podcast:', selectedPodcast.show, selectedPodcast.links);

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

    console.log('🎧 Podcast URLs extracted:', { 
      spotify: spotifyLink, 
      applePodcasts: applePodcastsLink 
    });

    // Find book store links
    const bookshopLink = selectedBook.links.primary.url;
    const amazonLink = selectedBook.links.alternatives.find((alt: any) => alt.label.includes('Amazon'))?.url || '';
    const libraryLink = selectedBook.links.alternatives.find((alt: any) => alt.label.includes('Library'))?.url || '';

    const podcastData = {
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
    };

    console.log('📻 Final podcast object:', podcastData);

    return {
      ...mockResults,
      podcast: podcastData,
      book: {
        title: selectedBook.title,
        author: selectedBook.author,
        byline: selectedBook.helpsWith.slice(0, 3).join(', '),
        description: selectedBook.description,
        length: selectedBook.readTime,
        whyThisHelps: selectedBook.whyThisHelps,
        coverImage: selectedBook.coverImage,
        purchaseUrl: bookshopLink,
        urls: {
          bookshop: bookshopLink,
          amazon: amazonLink,
          library: libraryLink,
        },
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
