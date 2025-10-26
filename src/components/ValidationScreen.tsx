import { useEffect, useState } from 'react';
import { Check, ChevronRight, ThumbsUp, ThumbsDown } from 'lucide-react';
import { ValidationData } from '@/types/checkin';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const [showFeedback, setShowFeedback] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const { toast } = useToast();

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Generate bullets from the validation data (fallback if AI doesn't provide them)
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
    
    return bullets.length > 0 ? bullets.slice(0, 3) : [
      "You're feeling stressed about work demands",
      "The lack of rest is making everything harder",
      "Your body is signaling it needs recovery"
    ];
  };
  
  const bullets = initialData.validation_bullets || generateBullets(initialData);
  const validationLine = initialData.validation_line || "These feelings make sense given what you're navigating.";

  // Sequential animation logic
  useEffect(() => {
    if (prefersReducedMotion || skipped) {
      // Show everything immediately if reduced motion or skipped
      setVisibleItems(bullets.length);
      setShowValidation(true);
      setShowButton(true);
      setShowFeedback(true);
      return;
    }

    // Icon + heading are visible immediately (handled by CSS)
    
    // Sequential bullet reveals
    const bulletTimings = [
      800,   // First bullet after 800ms
      1400,  // Second bullet after 1400ms
      2000,  // Third bullet after 2000ms
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
    }, 2600); // 2000ms + 600ms pause
    timers.push(validationTimer);

    // Show feedback after validation
    const feedbackTimer = setTimeout(() => {
      setShowFeedback(true);
    }, 3200); // 2600ms + 600ms pause
    timers.push(feedbackTimer);

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
      setShowFeedback(true);
    }
  };

  const handleFeedback = async (type: 'positive' | 'negative') => {
    setFeedbackGiven(true);
    setShowFeedbackInput(type === 'negative');
    
    // Save feedback immediately if positive (no text needed)
    if (type === 'positive') {
      await saveFeedback(type, '');
    }
  };

  const saveFeedback = async (type: 'positive' | 'negative', text: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No user logged in, skipping feedback save');
        return;
      }

      // Direct insert - types will be updated after migration
      const { error } = await (supabase as any)
        .from('validation_feedback')
        .insert({
          user_id: user.id,
          session_data: initialData,
          feedback_type: type,
          feedback_text: text || null
        });

      if (error) {
        console.error('Error saving feedback:', error);
      } else {
        toast({
          title: 'Thank you for your feedback!',
          description: 'This helps us improve your experience'
        });
      }
    } catch (error) {
      console.error('Error saving feedback:', error);
    }
  };

  const handleSubmitFeedback = async () => {
    await saveFeedback('negative', feedbackText);
    setShowFeedbackInput(false);
  };

  const handleContinue = () => {
    onConfirm(initialData);
  };

  return (
    <div 
      className="relative min-h-screen flex items-center justify-center px-6 py-12 overflow-hidden"
      onClick={handleSkip}
    >
      {/* Flowing gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-violet-500"></div>
      
      {/* Wave overlays */}
      <div className="absolute inset-0 bg-gradient-to-tl from-transparent via-violet-400/40 to-purple-300/60 opacity-50" style={{ clipPath: 'ellipse(75% 55% at 25% 45%)' }}></div>
      <div className="absolute inset-0 bg-gradient-to-br from-pink-300/40 via-transparent to-violet-400/40 opacity-40" style={{ clipPath: 'ellipse(65% 75% at 75% 55%)' }}></div>
      
      {/* Soft blur orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-violet-400 blur-3xl opacity-30"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-pink-400 blur-3xl opacity-25"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-purple-400 blur-3xl opacity-20"></div>
      
      <div className="relative z-10 w-full max-w-[560px] flex flex-col items-center text-center">
        {/* Icon - fades in immediately */}
        <div 
          className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-400"
        >
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Check className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Heading - fades in immediately */}
        <h1 
          className="text-2xl sm:text-3xl font-semibold text-white mb-10 animate-in fade-in slide-in-from-bottom-2 duration-400 drop-shadow-lg"
        >
          Here's what I'm hearing
        </h1>

        {/* Bullets - appear sequentially */}
        <div className="w-full mb-8 space-y-4">
          {bullets.map((bullet, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 transition-all duration-300 ${
                index < visibleItems || prefersReducedMotion || skipped
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-3'
              }`}
            >
              <span 
                className="flex-shrink-0 text-lg font-bold text-white drop-shadow mt-0.5"
              >
                •
              </span>
              <p className="text-base sm:text-lg text-white leading-relaxed text-left drop-shadow flex-1">
                {bullet}
              </p>
            </div>
          ))}
        </div>

        {/* Validation line - appears after bullets */}
        <p 
          className={`text-[15px] italic mb-8 transition-all duration-300 text-white/90 drop-shadow ${
            showValidation || prefersReducedMotion || skipped
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-3'
          }`}
        >
          {validationLine}
        </p>

        {/* Feedback Section - appears after validation line */}
        {!feedbackGiven && (
          <div 
            className={`mb-6 transition-all duration-300 ${
              showFeedback || prefersReducedMotion || skipped
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-3'
            }`}
          >
            <p className="text-sm text-white/80 mb-3 drop-shadow">
              Does this reflect your mood and vibe?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => handleFeedback('positive')}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all text-white border border-white/30"
              >
                <ThumbsUp className="w-5 h-5" />
                <span className="text-sm font-medium">Yes</span>
              </button>
              <button
                onClick={() => handleFeedback('negative')}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all text-white border border-white/30"
              >
                <ThumbsDown className="w-5 h-5" />
                <span className="text-sm font-medium">Not quite</span>
              </button>
            </div>
          </div>
        )}

        {/* Feedback Input - appears if user clicks thumbs down */}
        {showFeedbackInput && (
          <div className="w-full mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-sm text-white/80 mb-2 drop-shadow">Tell us more (optional):</p>
            <Textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="What would make this more accurate?"
              className="bg-white/20 backdrop-blur-sm border-white/30 text-white placeholder:text-white/50 min-h-[80px] mb-3"
            />
            <Button
              onClick={handleSubmitFeedback}
              className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30"
            >
              Submit Feedback
            </Button>
          </div>
        )}

        {/* Thank you message after feedback */}
        {feedbackGiven && !showFeedbackInput && (
          <p className="text-sm text-white/80 mb-6 animate-in fade-in duration-300 drop-shadow">
            Thank you for your feedback! 🙏
          </p>
        )}

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
          <p className="text-xs text-white/60 mt-6 opacity-60 drop-shadow">
            Tap anywhere to continue
          </p>
        )}
      </div>
    </div>
  );
};

export default ValidationScreen;
