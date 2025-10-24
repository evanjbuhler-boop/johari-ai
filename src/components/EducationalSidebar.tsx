import { useState, useEffect } from 'react';
import { X, Lightbulb, Brain, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

type SidebarPhase = 'highlight' | 'worry' | 'lifestyle';

interface SidebarContent {
  headline: string;
  body: string;
  icon: React.ReactNode;
}

const sidebarContent: Record<SidebarPhase, SidebarContent> = {
  highlight: {
    headline: "Why we ask about one moment, not your whole day",
    body: "Your brain processes specific memories better than vague summaries. When you reflect on one concrete moment—good or hard—you're helping your mind organize what happened instead of swirling in generalities.\n\nResearch shows people who focus on detailed moments report clearer emotions and lower anxiety than those who try to summarize their entire day.\n\nOver time, this practice trains you to notice these moments in real-time, which helps you respond to stress as it happens instead of carrying it around all day.",
    icon: <Lightbulb className="h-6 w-6 text-primary" />
  },
  worry: {
    headline: "What's happening right now",
    body: "You're doing what therapists call a \"worry containment exercise.\"\n\nBy naming your specific worries here—at a designated time—you're training your brain to process them intentionally, not at 2am when you're trying to sleep.\n\nThis works because anxiety loves vague, unnamed threats. The moment you get specific about what you're worried about, your brain can start working on it instead of spinning in circles.\n\nWith practice, your brain learns: \"I can set this down for now and pick it up during check-in time.\"",
    icon: <Brain className="h-6 w-6 text-primary" />
  },
  lifestyle: {
    headline: "Why we check in on your body",
    body: "Your emotional state and physical state aren't separate—they're deeply connected.\n\nPoor sleep, low energy, skipped meals, or physical tension don't just make you tired. They amplify anxiety, lower your stress tolerance, and make everything feel harder than it is.\n\nBy tracking these patterns over time, you'll start to see correlations: \"When I sleep less than 6 hours, my anxiety is always worse the next day\" or \"Skipping my workout makes me feel more irritable.\"\n\nThis isn't about fixing everything at once. It's about seeing what's actually affecting your mood so you can make informed decisions.",
    icon: <Zap className="h-6 w-6 text-primary" />
  }
};

interface EducationalSidebarProps {
  phase: SidebarPhase;
  onDismiss: () => void;
  onDisableAllTips?: () => void;
}

const EducationalSidebar = ({ phase, onDismiss, onDisableAllTips }: EducationalSidebarProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const content = sidebarContent[phase];

  useEffect(() => {
    // Delay showing sidebar for smooth entrance
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Handle escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300); // Wait for animation to complete
  };

  const handleDisableAllTips = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDisableAllTips?.();
      onDismiss();
    }, 300);
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40 md:hidden"
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* Desktop sidebar (right) / Mobile bottom sheet */}
      <aside
        className={`
          fixed z-50 bg-card
          transition-all duration-300 ease-out
          
          /* Desktop: right sidebar */
          md:top-1/2 md:-translate-y-1/2 md:right-0
          md:w-80 md:rounded-l-lg md:border-l-4
          md:shadow-lg
          
          /* Mobile: bottom sheet */
          bottom-0 left-0 right-0
          rounded-t-2xl border-t-4
          shadow-2xl
          
          /* Common */
          border-primary overflow-hidden
          
          ${isVisible 
            ? 'md:translate-x-0 translate-y-0' 
            : 'md:translate-x-full translate-y-full'
          }
        `}
        role="complementary"
        aria-label="Educational tip"
      >
        {/* Mobile drag handle */}
        <div className="md:hidden flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Collapsed Header - Always visible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 flex items-center justify-between gap-3 hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            {content.icon}
            <span className="font-semibold text-sm leading-tight text-left">
              {content.headline}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss();
              }}
              className="h-8 w-8"
              aria-label="Close tip"
            >
              <X className="h-4 w-4" />
            </Button>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </button>

        {/* Expanded Content */}
        <div
          className={`overflow-hidden transition-all duration-300 ${
            isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-6 pb-6 overflow-y-auto max-h-80">
            {/* Body */}
            <div className="text-sm text-muted-foreground leading-relaxed space-y-3 mb-4">
              {content.body.split('\n\n').map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDismiss}
                className="flex-1"
              >
                Got it
              </Button>
              {onDisableAllTips && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDisableAllTips}
                  className="flex-1 text-muted-foreground"
                >
                  Don't show tips
                </Button>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default EducationalSidebar;
