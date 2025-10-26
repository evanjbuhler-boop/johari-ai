import { useState, useEffect } from 'react';

export interface NeurodiveritySettings {
  usePlainLanguage: boolean;
  includeContentWarnings: boolean;
  explainQuestions: boolean;
  offerVisualCues: boolean;
  geniusMode: boolean;
}

const DEFAULT_SETTINGS: NeurodiveritySettings = {
  usePlainLanguage: false,
  includeContentWarnings: true,  // Default on
  explainQuestions: true,        // Default on
  offerVisualCues: false,
  geniusMode: false,
};

export const useNeurodiveritySettings = () => {
  const [settings, setSettings] = useState<NeurodiveritySettings>(() => {
    const saved = localStorage.getItem('neurodiveritySettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        
        // Migration: Remove old fields and only keep valid ones
        const validSettings: NeurodiveritySettings = {
          usePlainLanguage: parsed.usePlainLanguage ?? DEFAULT_SETTINGS.usePlainLanguage,
          includeContentWarnings: parsed.includeContentWarnings ?? DEFAULT_SETTINGS.includeContentWarnings,
          explainQuestions: parsed.explainQuestions ?? DEFAULT_SETTINGS.explainQuestions,
          offerVisualCues: parsed.offerVisualCues ?? DEFAULT_SETTINGS.offerVisualCues,
          geniusMode: parsed.geniusMode ?? DEFAULT_SETTINGS.geniusMode,
        };
        
        // Save the cleaned settings back to localStorage
        localStorage.setItem('neurodiveritySettings', JSON.stringify(validSettings));
        
        return validSettings;
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('neurodiveritySettings', JSON.stringify(settings));
    // Broadcast updates so all hook instances sync live (same-tab + cross-components)
    window.dispatchEvent(new CustomEvent('neurodiveritySettingsUpdated', { detail: settings }));
  }, [settings]);

  // Runtime migration guard (handles hot reload without remount)
  useEffect(() => {
    const saved = localStorage.getItem('neurodiveritySettings');
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if ('oneQuestionPerMessage' in parsed || 'showVisualProgress' in parsed) {
        const validSettings: NeurodiveritySettings = {
          usePlainLanguage: parsed.usePlainLanguage ?? DEFAULT_SETTINGS.usePlainLanguage,
          includeContentWarnings: parsed.includeContentWarnings ?? DEFAULT_SETTINGS.includeContentWarnings,
          explainQuestions: parsed.explainQuestions ?? DEFAULT_SETTINGS.explainQuestions,
          offerVisualCues: parsed.offerVisualCues ?? DEFAULT_SETTINGS.offerVisualCues,
          geniusMode: parsed.geniusMode ?? DEFAULT_SETTINGS.geniusMode,
        };
        setSettings(validSettings);
        localStorage.setItem('neurodiveritySettings', JSON.stringify(validSettings));
      }
    } catch {}
  }, []);

  // Listen for cross-component updates and storage changes
  useEffect(() => {
    const handleUpdate = (e: any) => {
      try {
        if (e?.detail) {
          setSettings(e.detail as NeurodiveritySettings);
        }
      } catch {}
    };
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'neurodiveritySettings' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setSettings(parsed as NeurodiveritySettings);
        } catch {}
      }
    };
    window.addEventListener('neurodiveritySettingsUpdated', handleUpdate as EventListener);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('neurodiveritySettingsUpdated', handleUpdate as EventListener);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

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
