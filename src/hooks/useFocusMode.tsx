import { useState, useEffect } from 'react';

export const useFocusMode = () => {
  const [isEnabled, setIsEnabled] = useState(() => {
    const saved = localStorage.getItem('focusMode');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('focusMode', isEnabled.toString());
    
    // Apply focus mode class to root element for global styling
    if (isEnabled) {
      document.documentElement.classList.add('focus-mode');
    } else {
      document.documentElement.classList.remove('focus-mode');
    }
  }, [isEnabled]);

  const toggle = () => {
    setIsEnabled(prev => !prev);
  };

  return {
    isEnabled,
    toggle,
  };
};
