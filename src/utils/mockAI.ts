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
    reflection: "It sounds like you're navigating a period of transition and growth. The stress you're experiencing seems to stem from balancing multiple responsibilities while trying to maintain your well-being. Your awareness of these challenges is already a positive step forward.",
    framework: "What you're experiencing aligns with the concept of 'cognitive load' - when our mental capacity is stretched across too many demands simultaneously. This is compounded by what psychologists call 'decision fatigue,' where the quality of our decisions deteriorates after making many decisions throughout the day. Your body and mind are signaling the need for more intentional rest and boundary-setting.",
    recommendations: {
      podcast: "Try 'The Happiness Lab' by Dr. Laurie Santos, particularly the episode on managing stress through realistic expectations.",
      article: "'The Science of Self-Care' on Greater Good Magazine explores evidence-based approaches to maintaining emotional balance.",
      technique: "Consider the '3-3-3 Rule' for anxiety: Name 3 things you see, 3 sounds you hear, and move 3 parts of your body. This grounds you in the present moment and interrupts the stress cycle."
    },
    story: "There's an old story of a farmer whose horse ran away. His neighbor said, 'Such bad luck!' The farmer replied, 'Maybe.' The next day, the horse returned with three wild horses. 'How wonderful!' said the neighbor. 'Maybe,' said the farmer. When his son tried to tame one of the wild horses and broke his leg, the neighbor exclaimed, 'How terrible!' The farmer simply said, 'Maybe.' The next week, officers came to draft young men into the army, but the son was excused because of his broken leg. The neighbor congratulated the farmer on his good fortune, to which the farmer responded, 'Maybe.' \n\nThis story reminds us that we can't always see the full picture of how events will unfold. What feels overwhelming today may lead to unexpected growth tomorrow. The key is maintaining perspective and being gentle with ourselves during uncertain times."
  };
};
