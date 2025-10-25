import { EmotionState } from '@/types/checkin';

// Detect emotion from user message content
export const detectEmotionFromMessage = (message: string): EmotionState => {
  const lowerMessage = message.toLowerCase();
  
  // Anxious detection
  if (
    /racing thoughts?|can'?t stop thinking|overwhelm(ed|ing)?|drown(ing)?|spiral(ing|ling)?|panic|worried sick|terrified/.test(lowerMessage)
  ) {
    return 'anxious';
  }
  
  // Frustrated/Angry detection
  if (
    /fed up|can'?t take it anymore|so over this|done with|furious|pissed|angry|rage|hate this/.test(lowerMessage)
  ) {
    return 'frustrated';
  }
  
  // Sad/Depressed detection
  if (
    /don'?t care anymore|empty|numb|miss|lost|hopeless|depress(ed|ing)?|crying|tears|sad/.test(lowerMessage)
  ) {
    return 'sad';
  }
  
  // Exhausted detection
  if (
    /so tired|can'?t keep going|running on fumes|drained|exhaust(ed|ing)?|worn out|burnt out/.test(lowerMessage)
  ) {
    return 'exhausted';
  }
  
  // Overwhelmed detection (broader)
  if (
    /too much|can'?t keep up|everything at once|swamp(ed)?|bury|crush(ed|ing)?/.test(lowerMessage)
  ) {
    return 'overwhelmed';
  }
  
  return 'neutral';
};

// Get background gradient for emotion
export const getEmotionGradient = (emotion: EmotionState): string => {
  switch (emotion) {
    case 'anxious':
    case 'overwhelmed':
      return 'from-[#4A90E2] via-[#5DADE2] to-[#9B59B6]'; // Cool blues and purples
    case 'frustrated':
      return 'from-[#D35400] via-[#C0392B] to-[#E74C3C]'; // Warm oranges and reds
    case 'sad':
      return 'from-[#95A5A6] via-[#A29BFE] to-[#B19CD9]'; // Warm grays and lavenders
    case 'exhausted':
      return 'from-[#BDC3C7] via-[#95A5A6] to-[#7F8C8D]'; // Desaturated palette
    case 'neutral':
    default:
      return 'from-purple-600/90 via-pink-600/90 to-purple-700/90'; // Default gradient
  }
};

// Get supportive prompt based on context
export const getSupportivePrompt = (
  emotion: EmotionState,
  context: 'vulnerable-share' | 'distress' | 'overwhelmed' | 'general'
): string | null => {
  if (context === 'vulnerable-share') {
    return 'That took courage to say';
  }
  
  if (context === 'distress') {
    return "You're safe. You're here.";
  }
  
  if (context === 'overwhelmed') {
    return 'One thing at a time';
  }
  
  // General supportive messages
  const messages = [
    'Take a breath',
    "I'm here",
    "It's okay to feel this"
  ];
  
  return messages[Math.floor(Math.random() * messages.length)];
};

// Determine if breathing exercise should be triggered
export const shouldTriggerBreathing = (
  emotion: EmotionState,
  userMessage: string
): boolean => {
  if (emotion === 'anxious' || emotion === 'overwhelmed') {
    const anxietyIntensity = /racing|spiraling|panic|terrified|can'?t breathe/.test(
      userMessage.toLowerCase()
    );
    return anxietyIntensity;
  }
  return false;
};
