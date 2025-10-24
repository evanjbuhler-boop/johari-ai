import { useEffect } from 'react';
import { Brain, Heart, Moon, Sparkles } from 'lucide-react';
import { ValidationData } from '@/types/checkin';

interface ValidationScreenProps {
  initialData: ValidationData;
  onConfirm: (data: ValidationData) => void;
  onAdjust: () => void;
}

const ValidationScreen = ({ initialData, onConfirm }: ValidationScreenProps) => {
  // Auto-advance to recommendations after 30 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onConfirm(initialData);
    }, 30000);

    return () => clearTimeout(timer);
  }, [initialData, onConfirm]);

  // Format insights from the data
  const primaryEmotions = initialData.emotions.slice(0, 3).join(', ') || 'Processing';
  const stressorsText = initialData.mainStressors.length > 0 
    ? initialData.mainStressors.slice(0, 2).join(' and ') 
    : 'General life pressure';
  const sleepStatus = initialData.sleepHours 
    ? `${initialData.sleepHours}h (${initialData.sleepQuality?.toLowerCase() || 'moderate'})` 
    : 'Sleep data collected';
  const supportApproach = initialData.desiredSupport || 'Personalized guidance';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Background gradient effect */}
      <div className="absolute inset-0 opacity-30">
        <div 
          className="absolute inset-0 animated-gradient"
          style={{ filter: 'blur(100px)' }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">Processing your insights</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">
            Here's What I'm Seeing
          </h1>
          <p className="text-muted-foreground text-lg">
            Give me 30 seconds to prepare your recommendations...
          </p>
        </div>

        {/* Insights grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Emotional state */}
          <div 
            className="group bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 hover:border-primary/30 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4"
            style={{ animationDelay: '200ms', boxShadow: 'var(--shadow-soft)' }}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-400/20 to-pink-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                <Heart className="h-6 w-6 text-rose-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                  Emotional State
                </h3>
                <p className="text-lg font-medium text-foreground leading-snug">
                  {primaryEmotions}
                </p>
              </div>
            </div>
          </div>

          {/* Main stressors */}
          <div 
            className="group bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 hover:border-primary/30 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4"
            style={{ animationDelay: '300ms', boxShadow: 'var(--shadow-soft)' }}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                <Brain className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                  Key Stressors
                </h3>
                <p className="text-lg font-medium text-foreground leading-snug">
                  {stressorsText}
                </p>
              </div>
            </div>
          </div>

          {/* Sleep & physical */}
          <div 
            className="group bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 hover:border-primary/30 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4"
            style={{ animationDelay: '400ms', boxShadow: 'var(--shadow-soft)' }}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400/20 to-indigo-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                <Moon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                  Physical State
                </h3>
                <p className="text-lg font-medium text-foreground leading-snug">
                  {sleepStatus}
                </p>
              </div>
            </div>
          </div>

          {/* Support approach */}
          <div 
            className="group bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 hover:border-primary/30 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4"
            style={{ animationDelay: '500ms', boxShadow: 'var(--shadow-soft)' }}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400/20 to-green-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                  Support Focus
                </h3>
                <p className="text-lg font-medium text-foreground leading-snug">
                  {supportApproach}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="mt-12 text-center animate-in fade-in duration-700 delay-700">
          <div className="inline-flex flex-col items-center gap-3">
            <div className="flex gap-1.5">
              <div 
                className="w-2 h-2 rounded-full bg-primary animate-pulse"
                style={{ animationDelay: '0ms' }}
              />
              <div 
                className="w-2 h-2 rounded-full bg-primary animate-pulse"
                style={{ animationDelay: '200ms' }}
              />
              <div 
                className="w-2 h-2 rounded-full bg-primary animate-pulse"
                style={{ animationDelay: '400ms' }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Crafting your personalized recommendations...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidationScreen;
