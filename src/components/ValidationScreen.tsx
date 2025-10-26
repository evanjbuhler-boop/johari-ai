import { useEffect, useState } from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { ValidationData } from '@/types/checkin';
import { Button } from '@/components/ui/button';

interface ValidationScreenProps {
  initialData: ValidationData;
  conversationPath: 'nightly_routine' | 'venting_session' | null;
  onConfirm: (data: ValidationData) => void;
  onAdjust: () => void;
}

const ValidationScreen = ({ initialData, onConfirm }: ValidationScreenProps) => {
  const [visibleItems, setVisibleItems] = useState<number>(0);
  const [showValidation, setShowValidation] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [skipped, setSkipped] = useState(false);

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Generate bullets from the validation data
  const generateBullets = (data: ValidationData): string[] => {
    const bullets: string[] = [];
    
    // Add emotion-based bullet
    if (data.emotions && data.emotions.length > 0) {
      bullets.push(`You're feeling ${data.emotions.join(', ').toLowerCase()}`);
    }
    
    // Add stressor-based bullet
    if (data.mainStressors && data.mainStressors.length > 0) {
      bullets.push(`You're dealing with ${data.mainStressors.join(', ').toLowerCase()}`);
    }
    
    // Add pattern/insight from AI
    if (data.aiGeneratedPattern) {
      bullets.push(data.aiGeneratedPattern);
    }
    
    // Add contributing factors
    if (data.contributingFactors && data.contributingFactors.length > 0) {
      const factors = data.contributingFactors.join(', ');
      bullets.push(`${factors.charAt(0).toUpperCase() + factors.slice(1)} are playing a role`);
    }
    
    return bullets.length > 0 ? bullets : [
      "You're feeling stressed about work demands",
      "You're exhausted from lack of quality sleep",
      "You're frustrated by relationship tensions",
      "You want space to reset and find balance"
    ];
  };
  
  const bullets = initialData.validation_bullets || generateBullets(initialData);
  const validationLine = initialData.validation_line || "These feelings make sense.";

  // Sequential animation logic
  useEffect(() => {
    if (prefersReducedMotion || skipped) {
      // Show everything immediately if reduced motion or skipped
      setVisibleItems(bullets.length);
      setShowValidation(true);
      setShowButton(true);
      return;
    }

    // Icon + heading are visible immediately (handled by CSS)
    
    // Sequential bullet reveals
    const bulletTimings = [
      800,   // First bullet after 800ms (icon + heading fade in for 400ms)
      1400,  // Second bullet after 1400ms (600ms pause)
      2000,  // Third bullet after 2000ms (600ms pause)
      2600,  // Fourth bullet after 2600ms (600ms pause)
    ];

    const timers: NodeJS.Timeout[] = [];

    bulletTimings.forEach((timing, index) => {
      const timer = setTimeout(() => {
        setVisibleItems(index + 1);
      }, timing);
      timers.push(timer);
    });

    // Show validation line after last bullet
    const validationTimer = setTimeout(() => {
      setShowValidation(true);
    }, 3200); // 2600ms + 600ms pause
    timers.push(validationTimer);

    // Show button last
    const buttonTimer = setTimeout(() => {
      setShowButton(true);
    }, 3800); // 3200ms + 600ms pause
    timers.push(buttonTimer);

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [bullets.length, prefersReducedMotion, skipped]);

  const handleSkip = () => {
    if (!skipped && !prefersReducedMotion) {
      setSkipped(true);
      setVisibleItems(bullets.length);
      setShowValidation(true);
      setShowButton(true);
    }
  };

  const handleContinue = () => {
    onConfirm(initialData);
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-6 py-12 bg-gradient-to-br from-purple-900/95 via-pink-900/95 to-purple-900/95"
      onClick={handleSkip}
    >
      <div className="w-full max-w-[560px] flex flex-col items-center text-center">
        {/* Icon - fades in immediately */}
        <div 
          className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-400"
        >
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Check className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Heading - fades in immediately */}
        <h1 
          className="text-2xl sm:text-3xl font-semibold text-white mb-10 animate-in fade-in slide-in-from-bottom-2 duration-400"
        >
          Here's what I'm hearing
        </h1>

        {/* Bullets - appear sequentially */}
        <div className="w-full mb-8 space-y-4">
          {bullets.map((bullet, index) => (
            <div
              key={index}
              className={`flex items-center justify-center gap-3 transition-all duration-300 ${
                index < visibleItems || prefersReducedMotion || skipped
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-3'
              }`}
            >
              <span 
                className="flex-shrink-0 text-lg font-bold text-white"
              >
                •
              </span>
              <p className="text-base sm:text-lg text-white leading-relaxed text-center">
                {bullet}
              </p>
            </div>
          ))}
        </div>

        {/* Validation line - appears after bullets */}
        <p 
          className={`text-[15px] italic mb-10 transition-all duration-300 text-white/80 ${
            showValidation || prefersReducedMotion || skipped
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-3'
          }`}
        >
          {validationLine}
        </p>

        {/* Button - appears last */}
        <Button
          onClick={handleContinue}
          className={`gap-2 px-8 py-6 text-base font-semibold rounded-lg transition-all duration-300 bg-white hover:bg-white/90 text-purple-900 ${
            showButton || prefersReducedMotion || skipped
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-3'
          }`}
          style={{
            boxShadow: '0px 2px 8px rgba(255, 255, 255, 0.15)',
            minWidth: '200px',
          }}
        >
          See what might help
          <ChevronRight className="w-5 h-5" />
        </Button>

        {/* Skip hint (only visible during animation) */}
        {!skipped && !prefersReducedMotion && !showButton && (
          <p className="text-xs text-white/50 mt-6 opacity-50">
            Tap anywhere to continue
          </p>
        )}
      </div>
    </div>
  );
};

export default ValidationScreen;
