import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageCircle, CheckSquare, Sparkles, Library, Shield, Lock, Trash2, Bookmark, ChevronRight, Lightbulb, Heart, LifeBuoy, RefreshCw } from 'lucide-react';
import welcomeHero from '@/assets/welcome-hero.jpg';

interface WelcomeModalProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const WelcomeModal = ({ isOpen = false, onOpenChange }: WelcomeModalProps) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    // If controlled externally, use that
    if (isOpen !== undefined) {
      setOpen(isOpen);
      return;
    }

    // Otherwise, check if first time visit and delay 3 seconds
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      const timer = setTimeout(() => {
        setOpen(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    localStorage.setItem('hasSeenWelcome', 'true');
    setOpen(false);
    setStep(1); // Reset for next time
    onOpenChange?.(false);
  };

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl p-0 gap-0 border-0">
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-purple-500/10 backdrop-blur-xl h-[680px] flex flex-col">
          
          {/* Screen 1: Hero Welcome */}
          {step === 1 && (
            <>
              <div className="relative h-full flex flex-col items-center justify-center p-8 text-center">
                {/* Hero Image */}
                <div className="relative w-full max-w-lg mb-8 rounded-2xl overflow-hidden shadow-2xl">
                  <img 
                    src={welcomeHero} 
                    alt="Mental wellness journey" 
                    className="w-full h-auto object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent"></div>
                </div>

                {/* Hero Text */}
                <div className="space-y-4 max-w-xl">
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent leading-tight">
                    Welcome to Johari AI
                  </h1>
                  <p className="text-xl md:text-2xl text-muted-foreground font-medium">
                    Identify your blindspots in days, not years
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Screen 2: How It Works */}
          {step === 2 && (
            <>
              {/* Header */}
              <div className="p-8 text-center border-b border-border/50 flex-shrink-0">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-semibold mb-2">How It Works</h2>
                <p className="text-muted-foreground">Three simple steps to support your mental wellness</p>
              </div>

              {/* Steps */}
              <div className="p-8 space-y-6 flex-1 overflow-y-auto">
                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1 text-base">1. Check-in & Chat</h3>
                    <p className="text-sm text-muted-foreground">Tell me what's on your mind - I'll listen, educate you and challenge you, all without judgment.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <CheckSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1 text-base">2. Validate Your Experience</h3>
                    <p className="text-sm text-muted-foreground">Review and confirm the emotions and stressors we identified together.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1 text-base">3. Get Personalized Recommendations</h3>
                    <p className="text-sm text-muted-foreground">Receive curated insights, exercises, podcasts and books tailored to your needs.</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Screen 3: Privacy Matters */}
          {step === 3 && (
            <>
              <div className="p-6 text-center border-b border-border/50 flex-shrink-0">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-semibold mb-2">Your Privacy Matters</h2>
                <p className="text-muted-foreground">Built with privacy-first design from the ground up</p>
              </div>

              <div className="p-6 space-y-5 flex-1">
                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Trash2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1 text-base">Your conversations disappear</h3>
                    <p className="text-sm text-muted-foreground">The moment your session ends, your conversations are permanently deleted from our servers. We cannot see, retrieve or access anything you share during your check-in.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Lock className="w-6 h-6 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1 text-base">We only track patterns</h3>
                    <p className="text-sm text-muted-foreground">The only data we retain is lightweight session metadata: timestamp, duration, therapy modality used and completion status.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Bookmark className="w-6 h-6 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1 text-base">You control what stays</h3>
                    <p className="text-sm text-muted-foreground">We save resources you explicitly bookmark, but your library is entirely under your control - you can add or remove items at anytime.</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Screen 4: Tips for Success */}
          {step === 4 && (
            <>
              <div className="p-8 text-center border-b border-border/50 flex-shrink-0">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 mb-4">
                  <Lightbulb className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-semibold mb-2">Quick Start Tips</h2>
                <p className="text-muted-foreground">Make the most of your experience</p>
              </div>

              <div className="p-8 space-y-6 flex-1 overflow-y-auto">
                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-amber-600 dark:text-amber-400" strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1 text-base">Be honest about how you're feeling</h3>
                    <p className="text-sm text-muted-foreground">The more you share, the better I can support you.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-amber-600 dark:text-amber-400" strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1 text-base">Try different approaches</h3>
                    <p className="text-sm text-muted-foreground">Not sure what works? We'll explore together. The default setting will blend modalities based on your mood and input.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <Library className="w-6 h-6 text-amber-600 dark:text-amber-400" strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1 text-base">Come back anytime</h3>
                    <p className="text-sm text-muted-foreground">Your progress is always here when you need it.</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Screen 5: Important Notice */}
          {step === 5 && (
            <>
              <div className="p-8 text-center border-b border-border/50 flex-shrink-0">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-semibold mb-2">Important Notice</h2>
                <p className="text-muted-foreground">Please read before getting started</p>
              </div>

              <div className="p-8 space-y-6 flex-1 overflow-y-auto">
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-5">
                  <h3 className="font-semibold mb-3 text-base flex items-center gap-2">
                    <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    Johari AI is Not a Replacement for Therapy
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    I'm most helpful between therapy sessions or as a supplement to ongoing care.
                  </p>
                </div>

                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-5">
                  <h3 className="font-semibold mb-3 text-base flex items-center gap-2 text-red-600 dark:text-red-400">
                    <LifeBuoy className="w-5 h-5" />
                    In Crisis? Get Immediate Help
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    If you're experiencing a mental health crisis or having thoughts of self-harm, please reach out immediately:
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="font-semibold">988 Suicide & Crisis Lifeline | Crisis Text Line: Text HOME to 741741</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Footer with step indicator and button */}
          <div className="p-8 pt-4 space-y-4 flex-shrink-0">
            {/* Step dots */}
            <div className="flex justify-center gap-2">
              <div className={`h-2 w-2 rounded-full transition-all ${step === 1 ? 'bg-primary w-6' : 'bg-muted-foreground/30'}`} />
              <div className={`h-2 w-2 rounded-full transition-all ${step === 2 ? 'bg-primary w-6' : 'bg-muted-foreground/30'}`} />
              <div className={`h-2 w-2 rounded-full transition-all ${step === 3 ? 'bg-primary w-6' : 'bg-muted-foreground/30'}`} />
              <div className={`h-2 w-2 rounded-full transition-all ${step === 4 ? 'bg-primary w-6' : 'bg-muted-foreground/30'}`} />
              <div className={`h-2 w-2 rounded-full transition-all ${step === 5 ? 'bg-primary w-6' : 'bg-muted-foreground/30'}`} />
            </div>

            <Button 
              onClick={handleNext}
              size="lg"
              className="w-full text-lg h-14 rounded-xl gap-2"
              style={{
                background: 'linear-gradient(135deg, hsl(340, 75%, 70%), hsl(260, 60%, 65%))',
                boxShadow: '0 4px 20px rgba(255, 138, 180, 0.4)'
              }}
            >
              {step === 1 ? (
                "Get Started"
              ) : step < 5 ? (
                <>
                  Next
                  <ChevronRight className="w-5 h-5" />
                </>
              ) : (
                "I Understand"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;
