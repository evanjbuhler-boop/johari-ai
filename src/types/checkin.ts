export interface Message {
  role: 'user' | 'assistant';
  content: string;
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
  
  // New structured validation fields
  contributingFactors: string[];
  customFactor?: string;
  patternAccuracy: 'yes' | 'partial' | 'no' | null;
  patternFeedback?: string;
  desiredSupport: string[];
  aiGeneratedPattern?: string;
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
}

export interface CheckInResults {
  // Section 1: Summary/Byline
  byline: string;
  
  // Section 2: User's exact words
  userQuote: string;
  
  // Section 3: Pattern identification
  patterns: string[];
  
  // Section 4: What's Happening (Academic Explanation)
  whatsHappening: {
    summary: string;
    fullExplanation: string;
    citations?: {
      author: string;
      year: number;
      title: string;
    }[];
  };
  
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
  };
  
  // Section 7: Try This Tonight (Exercise)
  exercise?: {
    title: string;
    description: string;
    duration: string;
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
