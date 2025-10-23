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
  // Section 1: Empathetic byline with user's exact words
  userQuote: string;
  
  // Section 2: Pattern identification
  patterns: string[];
  
  // Section 3: Applied CBT
  cbt: {
    distortion: string;        // Named cognitive distortion
    userThought: string;        // Quoted thought pattern from user
    reframe: string;            // Specific reframe
    practice: string;           // Actionable instruction
  };
  
  // Keep existing fields for backward compatibility
  reflection: string;
  framework: string;
  recommendations: {
    podcast?: string;
    article?: string;
    technique?: string;
  };
  story: string;
}
