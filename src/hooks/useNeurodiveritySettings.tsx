import { useState, useEffect } from 'react';

export interface NeurodiveritySettings {
  usePlainLanguage: boolean;
  includeContentWarnings: boolean;
  oneQuestionPerMessage: boolean;
  showVisualProgress: boolean;
  explainQuestions: boolean;
}

const DEFAULT_SETTINGS: NeurodiveritySettings = {
  usePlainLanguage: false,
  includeContentWarnings: false,
  oneQuestionPerMessage: false,
  showVisualProgress: true, // Default on
  explainQuestions: true,   // Default on
};

export const useNeurodiveritySettings = () => {
  const [settings, setSettings] = useState<NeurodiveritySettings>(() => {
    const saved = localStorage.getItem('neurodiveritySettings');
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
    localStorage.setItem('neurodiveritySettings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (key: keyof NeurodiveritySettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return {
    settings,
    updateSetting,
    resetSettings,
  };
};
