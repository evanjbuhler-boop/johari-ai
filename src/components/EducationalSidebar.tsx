import { useState, useEffect } from 'react';
import { X, Lightbulb, Brain, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

type SidebarPhase = 'highlight' | 'worry' | 'lifestyle' | 'uncertainty' | 'sleep' | 'conflict' | 'guilt' | 'rumination' | 'avoidance';

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
  },
  uncertainty: {
    headline: "It's okay not to have all the answers",
    body: "Intolerance of uncertainty (IU) is one of the strongest predictors of generalized anxiety. When you say \"I don't know\" repeatedly, you may be experiencing what researchers call \"uncertainty distress\"—the discomfort of not having a clear answer.\n\nStudies by Carleton et al. (2012) show that high IU correlates with rumination, worry, and avoidance behaviors. But here's what matters: uncertainty tolerance is trainable.\n\nCognitive-behavioral approaches focus on acknowledging uncertainty without demanding immediate resolution. The goal isn't to find all the answers—it's to reduce the emotional distress that uncertainty triggers.\n\nSaying \"I don't know\" isn't a failure. It's data. It tells us where the ambiguity sits, which is the first step in processing it.",
    icon: <Brain className="h-6 w-6 text-primary" />
  },
  sleep: {
    headline: "Why sleep disruption amplifies everything",
    body: "Sleep deprivation doesn't just make you tired—it fundamentally alters emotional regulation. Research by Walker & van der Helm (2009) demonstrates that after one night of poor sleep, amygdala reactivity increases by 60%, while prefrontal cortex regulation decreases.\n\nThis means your brain becomes hypervigilant to threats and less capable of putting them in perspective. What would normally be manageable stress becomes overwhelming.\n\nChronic sleep restriction (less than 6 hours) is linked to increased cortisol, impaired memory consolidation, and heightened inflammatory markers—all of which contribute to anxiety and depression.\n\nTracking your sleep patterns isn't about perfect sleep hygiene. It's about identifying when insufficient rest is amplifying emotional reactivity beyond what the situation warrants.",
    icon: <Zap className="h-6 w-6 text-primary" />
  },
  conflict: {
    headline: "Understanding conflict vs. communication breakdown",
    body: "Interpersonal conflict often isn't about the content of disagreement—it's about attachment threat and perceived invalidation.\n\nGottman's research on relationship dynamics identifies \"the four horsemen\": criticism, contempt, defensiveness, and stonewalling. When conflicts escalate, it's usually because one or more of these patterns has been activated, shifting the interaction from problem-solving to self-protection.\n\nNeurologically, perceived relational threat activates the same brain regions as physical danger (anterior cingulate cortex, insula). Your body doesn't distinguish between \"my partner is upset with me\" and \"I'm in danger.\"\n\nThe key question isn't \"who's right?\" but \"what need isn't being met?\" Conflict is usually a signal that connection, validation, or autonomy feels threatened—not that the other person is fundamentally wrong.",
    icon: <Brain className="h-6 w-6 text-primary" />
  },
  guilt: {
    headline: "The difference between guilt and responsibility",
    body: "Guilt is an adaptive emotion when it signals a values violation: you did something that conflicts with who you want to be. This is functional guilt—it motivates repair and growth.\n\nBut maladaptive guilt (what therapists call \"toxic guilt\") occurs when you hold yourself responsible for outcomes outside your control, or when self-criticism becomes habitual rather than corrective.\n\nTangney & Dearing's research (2002) distinguishes guilt (\"I did something bad\") from shame (\"I am bad\"). Guilt can be productive. Shame is almost always destructive, leading to withdrawal, defensiveness, and self-punishment.\n\nIf you're experiencing guilt, ask: \"Did I actually violate my values, or am I taking on responsibility that isn't mine?\" And: \"Is this guilt prompting meaningful action, or just self-flagellation?\"\n\nResponsibility means acknowledging your role. Guilt without agency becomes rumination.",
    icon: <Lightbulb className="h-6 w-6 text-primary" />
  },
  rumination: {
    headline: "Why your mind keeps returning to the same thought",
    body: "Rumination is repetitive, passive thinking about distress without moving toward solutions. Nolen-Hoeksema's research shows it's one of the strongest predictors of depression and anxiety disorders.\n\nYour brain returns to the same thought because it's trying to resolve something—but without new information or a different perspective, it just loops. Rumination feels productive (\"I'm thinking about the problem\") but it's actually maintenance behavior for distress.\n\nNeurologically, rumination activates the default mode network (DMN)—the brain's \"self-referential\" system. When the DMN is overactive without executive control (prefrontal cortex), thoughts become sticky and circular.\n\nThe antidote isn't thought suppression (which backfires). It's behavioral activation: shifting from mental rehearsal to concrete action, or from problem-focused thinking to value-focused behavior.\n\nIf you notice yourself returning to the same worry, that's a cue to interrupt the loop—not with answers, but with movement.",
    icon: <Brain className="h-6 w-6 text-primary" />
  },
  avoidance: {
    headline: "Understanding experiential avoidance",
    body: "Avoidance is one of the most powerful short-term anxiety reducers—and one of the strongest long-term anxiety maintainers.\n\nACT (Acceptance and Commitment Therapy) research by Hayes et al. identifies \"experiential avoidance\" as a core psychological inflexibility process: the unwillingness to stay in contact with uncomfortable internal experiences (thoughts, emotions, sensations).\n\nWhen you avoid what's uncomfortable, your nervous system learns: \"This is dangerous. I was right to escape.\" The relief reinforces the avoidance, which shrinks your window of tolerance over time.\n\nBut here's the key: avoidance isn't weakness. It's a learned protective strategy. Your brain is trying to keep you safe.\n\nThe goal isn't to eliminate avoidance—it's to notice when avoidance is running your decisions. Are you moving away from discomfort (avoidance-driven) or toward what matters (values-driven)?\n\nSometimes the most growth happens not by solving the problem, but by staying present with the discomfort long enough to see it won't consume you.",
    icon: <Lightbulb className="h-6 w-6 text-primary" />
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
