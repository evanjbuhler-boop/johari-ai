import { useState, useEffect } from 'react';

export type TherapyApproach = 
  | 'blended'
  | 'cbt'
  | 'act'
  | 'stoicism'
  | 'ifs';

export interface TherapyApproachSettings {
  approach: TherapyApproach;
}

const DEFAULT_SETTINGS: TherapyApproachSettings = {
  approach: 'blended',
};

export const THERAPY_APPROACHES = [
  { value: 'blended', label: 'Blended', description: 'Mix of all therapeutic approaches' },
  { value: 'cbt', label: 'Cognitive Behavioral Therapy', description: 'Focus on thoughts and behaviors' },
  { value: 'act', label: 'Acceptance and Commitment Therapy', description: 'Mindfulness and values-based action' },
  { value: 'stoicism', label: 'Stoicism', description: 'Ancient philosophy for resilience' },
  { value: 'ifs', label: 'Internal Family Systems', description: 'Explore different parts of yourself' },
] as const;

export const useTherapyApproach = () => {
  const [settings, setSettings] = useState<TherapyApproachSettings>(() => {
    const saved = localStorage.getItem('therapyApproach');
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('therapyApproach', JSON.stringify(settings));
  }, [settings]);

  const setApproach = (approach: TherapyApproach) => {
    setSettings({ approach });
  };

  return {
    settings,
    setApproach,
  };
};
