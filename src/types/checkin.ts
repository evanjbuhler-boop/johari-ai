export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  id?: string;
  showPathButtons?: boolean;
  pathButtonsUsed?: boolean;
}

export type ConversationPath = 'nightly_routine' | 'venting_session' | null;

export interface ValidationData {
  emotions: string[];
  stressLevel: number;
  mainStressors: string[];
  sleepHours?: number;
  sleepQuality?: string;
  exercise?: string;
  caffeineIntake?: string;
  conflicts?: string;
  
  // Enhanced natural data extraction
  emotional_state?: string[]; // ["anxious", "sad", "frustrated"]
  primary_stressors?: string[]; // ["work_deadline", "relationship_conflict", "sleep_deprivation"]
  sleep_hours?: number | null;
  sleep_quality?: 'poor' | 'fair' | 'good' | null;
  exercise_today?: boolean;
  exercise_type?: 'walk' | 'gym' | 'yoga' | 'none' | string;
  caffeine_intake?: 'none' | 'moderate' | 'high';
  overwhelm_sources?: string[];
  interpersonal_conflicts?: boolean;
  conflict_with?: 'partner' | 'parent' | 'coworker' | 'friend' | string | null;
  support_mentioned?: string[];
  isolation_signals?: boolean;
  
  // Agency & Circle of Influence
  things_they_control?: string[];
  things_outside_control?: string[];
  
  // Patterns over time
  recurring_theme?: 'mother_relationship' | 'work_stress' | 'self_worth' | string;
  progress_indicators?: string[];
  
  // New structured validation fields
  contributingFactors: string[];
  customFactor?: string;
  patternAccuracy: 'yes' | 'partial' | 'no' | null;
  patternFeedback?: string;
  desiredSupport: string[];
  aiGeneratedPattern?: string;
  
  // AI-generated reasoning for each insight
  emotionReasoning?: string;
  stressorReasoning?: string;
  sleepReasoning?: string;
  supportReasoning?: string;
  
  // New validation screen fields
  validation_bullets?: string[];
  validation_line?: string;
}

// Emotion state for adaptive UI
export type EmotionState = 'anxious' | 'frustrated' | 'sad' | 'exhausted' | 'overwhelmed' | 'neutral' | null;

export interface AIResponse {
  content: string;
  detectedEmotion?: EmotionState;
  triggerBreathing?: boolean;
  supportivePrompt?: string;
}

export interface EmotionalData {
  emotionalState: string;
  stressLevel: number;
  sleepQuality?: string;
  exercise?: string;
  diet?: string;
  caffeineIntake?: string;
  conflicts?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  age: string;
  location: string;
  lifeStage: string;
  insightTone?: 'clinical' | 'direct' | 'coaching' | 'compassionate' | 'children';
}

export interface CheckInResults {
  // Section 1: Summary/Byline
  byline: string;
  
  // Section 2: What's Happening
  whatsHappening: {
    byline?: string; // Dynamic byline that adapts to tone setting
    summary: string;
    themes: string[];
    fullExplanation: string;
    citations?: {
      author: string;
      year: number;
      title: string;
    }[];
  };
  
  // Section 2.5: The Theory (Academic Teaching)
  theTheory?: {
    byline?: string; // Engaging hook for the research section
    content: string;
    tags?: string[]; // Specific psychological concepts like "catastrophizing", "anxious attachment", etc.
  };
  
  // Section 3: Quotes from conversation
  quotes?: {
    text: string;
    sentiment: 'positive' | 'negative' | 'neutral';
  }[];
  
  // Section 4: Reframing perspective
  reframing?: {
    content: string;
  };
  
  // Section 5: Pattern identification (keep for compatibility)
  patterns: string[];
  
  // Section 5: Listen to This (Podcast)
  podcast?: {
    title: string;
    host: string;
    episode: string;
    duration: string;
    description: string;
    whyThisHelps: string;
    thumbnail: string;
    urls: {
      spotify?: string;
      applePodcasts?: string;
      direct?: string;
    };
  };
  
  // Section 6: Quick Read (Book/Article)
  book?: {
    title: string;
    author: string;
    byline: string;
    description: string;
    length: string;
    whyThisHelps: string;
    coverImage: string;
    sampleUrl?: string;
    purchaseUrl?: string;
    urls?: {
      bookshop?: string;
      barnesNoble?: string;
      amazon?: string;
      library?: string;
    };
  };
  
  // Section 7: Try This Tonight (Exercise)
  exercise?: {
    title: string;
    description: string;
    duration: string;
    whyHelps?: string;
    steps: {
      stepNumber: number;
      title: string;
      content: string;
      inputRequired: boolean;
      inputType?: 'text' | 'textarea';
    }[];
  };
  
  // Section 8: A Different Perspective (Story)
  story?: {
    title: string;
    culturalOrigin: string;
    content: string;
    whyThisMatters: string;
  };
  
  // Keep existing fields for backward compatibility
  cbt?: {
    distortion: string;
    userThought: string;
    reframe: string;
    practice: string;
  };
  reflection?: string;
  framework?: string;
  recommendations?: {
    podcast?: string;
    article?: string;
    technique?: string;
  };
}

export interface SavedItem {
  id: string;
  type: 'podcast' | 'book' | 'exercise' | 'story';
  title: string;
  subtitle?: string;
  savedDate: string;
  content: any; // Original content object
}
