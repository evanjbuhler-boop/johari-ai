import { Message, CheckInResults } from '@/types/checkin';

// Mock AI responses for development - replace with actual Claude API calls
export const getMockAIResponse = (messages: Message[]): string => {
  const userMessage = messages[messages.length - 1].content.toLowerCase();
  const exchangeCount = Math.floor(messages.filter(m => m.role === 'user').length);

  if (exchangeCount === 1) {
    if (userMessage.includes('stress') || userMessage.includes('anxious') || userMessage.includes('overwhelmed')) {
      return "I hear that you're feeling stressed. That sounds really challenging. Can you tell me more about what's been weighing on you the most?";
    }
    return "Thank you for sharing that with me. I'm here to listen. What aspect of your day has been on your mind the most?";
  } else if (exchangeCount === 2) {
    return "I appreciate you opening up about that. How have you been taking care of yourself lately? Have you been getting enough rest?";
  } else if (exchangeCount === 3) {
    return "That's helpful to know. How about your daily routines - have you been able to maintain healthy eating habits and physical activity?";
  } else if (exchangeCount === 4) {
    return "I see. And one last question - have there been any particular conflicts or difficult interactions that stood out to you recently?";
  }
  
  return "Thank you for sharing all of that with me. I have a good understanding now.";
};

export const generateMockResults = (messages: Message[]): CheckInResults => {
  return {
    byline: "You're navigating multiple demands while running low on rest. Here's what might help right now.",
    patterns: [
      "Sleep deprivation (4 hours) → heightened emotional reactivity",
      "Work pressure + exhaustion → snapping at your partner",
      "Guilt about the conflict → more stress → worse sleep (reinforcing cycle)"
    ],
    whatsHappening: {
      summary: "You're experiencing what psychologists call 'cumulative stress'—when multiple smaller stressors compound into feeling overwhelming.",
      themes: ["Work pressure", "Sleep deprivation", "Relationship strain"],
      fullExplanation: "What you're experiencing aligns with the concept of 'cognitive load' - when our mental capacity is stretched across too many demands simultaneously. This is compounded by what psychologists call 'decision fatigue,' where the quality of our decisions deteriorates after making many decisions throughout the day.\n\nResearch in occupational psychology shows that sleep deprivation significantly amplifies stress responses and reduces emotional regulation capacity. A 2019 study in the Journal of Sleep Research found that even partial sleep restriction can lead to increased irritability and conflict in relationships.\n\nYour body and mind are signaling the need for more intentional rest and boundary-setting. The tension headache and snapping at your partner aren't character flaws—they're physiological stress signals that your nervous system needs support.",
      citations: [
        { author: "Baumeister, R. F.", year: 1998, title: "Ego Depletion: Is the Active Self a Limited Resource?" },
        { author: "Killgore, W. D.", year: 2010, title: "Effects of Sleep Deprivation on Cognition. Progress in Brain Research" }
      ]
    },
    podcast: {
      title: "The Happiness Lab",
      host: "Dr. Laurie Santos",
      episode: "Managing Stress Through Realistic Expectations",
      duration: "35 min",
      description: "In this episode, Dr. Santos discusses how our unrealistic expectations about productivity and performance create unnecessary stress, and offers science-backed strategies for setting healthier boundaries.",
      whyThisHelps: "You mentioned feeling like you're failing at everything. This episode addresses the trap of perfectionism and offers practical ways to recalibrate your expectations.",
      thumbnail: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&h=400&fit=crop",
      urls: {
        spotify: "https://open.spotify.com/show/3i5TCKhc6GY42pOWkpWveG",
        applePodcasts: "https://podcasts.apple.com/us/podcast/the-happiness-lab-with-dr-laurie-santos/id1474245040"
      }
    },
    book: {
      title: "Why We Sleep",
      author: "Matthew Walker",
      byline: "The new science of sleep and dreams",
      description: "A groundbreaking exploration of sleep and its vital importance to our health, revealing how sleep deprivation affects every aspect of our physical and mental well-being.",
      length: "368 pages (~7 hour read)",
      whyThisHelps: "Understanding the science behind why sleep matters might help you prioritize rest without guilt. Sleep isn't optional—it's the foundation for emotional regulation and clear thinking.",
      coverImage: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=300&h=450&fit=crop",
      sampleUrl: "https://www.penguinrandomhouse.com/books/557683/why-we-sleep-by-matthew-walker-phd/",
      purchaseUrl: "https://www.amazon.com/Why-We-Sleep-Unlocking-Dreams/dp/1501144316"
    },
    exercise: {
      title: "The 4-7-8 Breathing Reset",
      description: "This simple 5-minute breathing technique activates your parasympathetic nervous system, helping to calm racing thoughts and reduce physical tension. Developed by Dr. Andrew Weil, it's particularly effective before sleep or during moments of acute stress.",
      duration: "5 minutes",
      steps: [
        {
          stepNumber: 1,
          title: "Find Your Position",
          content: "Sit or lie down in a comfortable position. Place the tip of your tongue against the ridge of tissue behind your upper front teeth. You'll keep it there throughout the exercise.\n\nWhen you're ready to begin, click Next.",
          inputRequired: false
        },
        {
          stepNumber: 2,
          title: "Empty Your Lungs",
          content: "Exhale completely through your mouth, making a whoosh sound.\n\nThis prepares your body for the full breathing cycle.\n\nClick Next when you've exhaled fully.",
          inputRequired: false
        },
        {
          stepNumber: 3,
          title: "Inhale for 4",
          content: "Close your mouth and inhale quietly through your nose while mentally counting to 4.\n\n1... 2... 3... 4...\n\nDon't rush. Let the breath be gentle and full.",
          inputRequired: false
        },
        {
          stepNumber: 4,
          title: "Hold for 7",
          content: "Hold your breath for a mental count of 7.\n\n1... 2... 3... 4... 5... 6... 7...\n\nStay relaxed. This is where the calming effect begins.",
          inputRequired: false
        },
        {
          stepNumber: 5,
          title: "Exhale for 8",
          content: "Exhale completely through your mouth, making a whoosh sound, for a count of 8.\n\n1... 2... 3... 4... 5... 6... 7... 8...\n\nLet all the air out. This long exhale activates your relaxation response.\n\nRepeat this cycle 3 more times on your own, then click Next.",
          inputRequired: false
        },
        {
          stepNumber: 6,
          title: "Notice the Change",
          content: "Take a moment to notice how your body feels now compared to when you started.\n\nDo you feel any different? More relaxed? Calmer?\n\nYou can use this technique anytime you need to reset—before bed, during a work break, or when emotions feel overwhelming.",
          inputRequired: false
        }
      ]
    },
    story: {
      title: "The Farmer and the Horse",
      culturalOrigin: "Chinese Taoist Parable",
      content: "There's an old story of a farmer whose horse ran away. His neighbor said, 'Such bad luck!' The farmer replied, 'Maybe.' The next day, the horse returned with three wild horses. 'How wonderful!' said the neighbor. 'Maybe,' said the farmer. When his son tried to tame one of the wild horses and broke his leg, the neighbor exclaimed, 'How terrible!' The farmer simply said, 'Maybe.' The next week, officers came to draft young men into the army, but the son was excused because of his broken leg. The neighbor congratulated the farmer on his good fortune, to which the farmer responded, 'Maybe.'\n\nThis story reminds us that we can't always see the full picture of how events will unfold. What feels overwhelming today may lead to unexpected growth tomorrow. The key is maintaining perspective and being gentle with ourselves during uncertain times.",
      whyThisMatters: "You're judging this moment—the bad sleep, the conflict with your partner, the work stress—as catastrophic. But you don't yet know what this difficult period might teach you or where it might lead. Sometimes our hardest moments become our most transformative ones."
    },
    cbt: {
      distortion: "Catastrophizing",
      userThought: "I'm going to fail at work and ruin my relationship",
      reframe: "You're juggling a lot right now, and one rough week doesn't define your competence or your relationship. Your partner knows you're stressed. Your boss hasn't said you're failing. You're extrapolating from feeling overwhelmed to total collapse, but that's the anxiety talking, not reality.",
      practice: "Before bed tonight, text your partner one specific thing you appreciate about them. Tomorrow at work, identify one task you can delegate or push to next week. You can't do everything - pick what matters most right now."
    },
    reflection: "It sounds like you're navigating a period of transition and growth. The stress you're experiencing seems to stem from balancing multiple responsibilities while trying to maintain your well-being. Your awareness of these challenges is already a positive step forward.",
    framework: "What you're experiencing aligns with the concept of 'cognitive load' - when our mental capacity is stretched across too many demands simultaneously. This is compounded by what psychologists call 'decision fatigue,' where the quality of our decisions deteriorates after making many decisions throughout the day. Your body and mind are signaling the need for more intentional rest and boundary-setting.",
    recommendations: {
      podcast: "Try 'The Happiness Lab' by Dr. Laurie Santos, particularly the episode on managing stress through realistic expectations.",
      article: "'The Science of Self-Care' on Greater Good Magazine explores evidence-based approaches to maintaining emotional balance.",
      technique: "Consider the '3-3-3 Rule' for anxiety: Name 3 things you see, 3 sounds you hear, and move 3 parts of your body. This grounds you in the present moment and interrupts the stress cycle."
    }
  };
};
