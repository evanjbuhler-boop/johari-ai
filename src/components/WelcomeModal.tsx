import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageCircle, CheckSquare, Sparkles, Library, Compass, Brain, Shield, Lock, Trash2, Save, ChevronRight, Lightbulb, Pause, Settings } from 'lucide-react';

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
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl p-0 gap-0 border-0">
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-purple-500/10 backdrop-blur-xl">
          
          {/* Step 1: How It Works */}
          {step === 1 && (
            <>
              {/* Header */}
              <div className="p-8 text-center border-b border-border/50">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-semibold mb-2">Welcome to Johari AI</h2>
                <p className="text-xl text-foreground mb-2">Your Mental Wellness Companion</p>
                <p className="text-muted-foreground">Here's how it works</p>
              </div>

              {/* Steps */}
              <div className="p-8 space-y-6">
                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">1. Check-in & Chat</h3>
                    <p className="text-sm text-muted-foreground">Share how you're feeling in a supportive, judgment-free environment</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckSquare className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">2. Validate Your Experience</h3>
                    <p className="text-sm text-muted-foreground">Review and confirm the emotions and stressors we identified together</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">3. Get Personalized Recommendations</h3>
                    <p className="text-sm text-muted-foreground">Receive curated exercises, podcasts and books tailored to your needs</p>
                  </div>
                </div>

                {/* Settings info */}
                <div className="pt-4 border-t border-border/50 space-y-3">
                  <div className="flex gap-3 items-start text-sm">
                    <Compass className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Choose your modality</span> - Select from CBT, ACT, Stoicism, IFS or a blended approach
                    </p>
                  </div>
                  <div className="flex gap-3 items-start text-sm">
                    <Brain className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Customize for neurodiversity</span> - Toggle plain language, content warnings and more
                    </p>
                  </div>
                  <div className="flex gap-3 items-start text-sm">
                    <Library className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Access your library anytime</span> - All your past recommendations saved in one place
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Step 2: Privacy & Trust */}
          {step === 2 && (
            <>
              <div className="p-8 text-center border-b border-border/50">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-semibold mb-2">Your Privacy Matters</h2>
                <p className="text-muted-foreground">Built with privacy-first design</p>
              </div>

              <div className="p-8 space-y-6">
                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Trash2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Your conversations disappear</h3>
                    <p className="text-sm text-muted-foreground">We never store your chat messages. Once your session ends, your conversations are gone forever.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Lock className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">We only track patterns</h3>
                    <p className="text-sm text-muted-foreground">Session metadata only: when you checked in, how long, completion status. No personal content, ever.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Save className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">You control what stays</h3>
                    <p className="text-sm text-muted-foreground">Only resources you explicitly save (podcasts, books, exercises) go to your library. Everything else vanishes.</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/50">
                  <p className="text-sm text-center text-muted-foreground">
                    <span className="font-medium text-foreground">Privacy by design</span> - GDPR & HIPAA-friendly architecture. Your mental health journey stays private.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Step 3: Quick Start Tips */}
          {step === 3 && (
            <>
              <div className="p-8 text-center border-b border-border/50">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 mb-4">
                  <Lightbulb className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-semibold mb-2">Quick Start Tips</h2>
                <p className="text-muted-foreground">Make the most of your experience</p>
              </div>

              <div className="p-8 space-y-6">
                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Be as open as you're comfortable</h3>
                    <p className="text-sm text-muted-foreground">The more you share, the better we can support you. But remember, there's no pressure - go at your own pace.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <Pause className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Pause anytime, resume later</h3>
                    <p className="text-sm text-muted-foreground">Need a break? Click "Pause" to save your spot. Come back whenever you're ready to continue.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <Settings className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Adjust settings mid-chat</h3>
                    <p className="text-sm text-muted-foreground">Toggle visual cues, genius mode, or therapy approach anytime using the icons in the top right.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <Library className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Save what resonates</h3>
                    <p className="text-sm text-muted-foreground">Found a helpful podcast or exercise? Click the bookmark icon to access it later from your Library.</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Footer with step indicator and button */}
          <div className="p-8 pt-4 space-y-4">
            {/* Step dots */}
            <div className="flex justify-center gap-2">
              <div className={`h-2 w-2 rounded-full transition-all ${step === 1 ? 'bg-primary w-6' : 'bg-muted-foreground/30'}`} />
              <div className={`h-2 w-2 rounded-full transition-all ${step === 2 ? 'bg-primary w-6' : 'bg-muted-foreground/30'}`} />
              <div className={`h-2 w-2 rounded-full transition-all ${step === 3 ? 'bg-primary w-6' : 'bg-muted-foreground/30'}`} />
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
              {step < 3 ? (
                <>
                  Next
                  <ChevronRight className="w-5 h-5" />
                </>
              ) : (
                "Let's Get Started"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;
