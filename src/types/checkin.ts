export interface Message {
  role: 'user' | 'assistant';
  content: string;
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
  reflection: string;
  framework: string;
  recommendations: {
    podcast?: string;
    article?: string;
    technique?: string;
  };
  story: string;
}
