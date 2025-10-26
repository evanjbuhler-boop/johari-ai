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
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-purple-500/10 backdrop-blur-xl h-[680px] flex flex-col">
          
          {/* Step 1: How It Works */}
          {step === 1 && (
            <>
              {/* Header */}
              <div className="p-8 text-center border-b border-border/50 flex-shrink-0">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-semibold mb-2">Welcome to Johari AI</h2>
                <p className="text-xl text-foreground mb-2">Your Mental Wellness Companion</p>
                <p className="text-muted-foreground">Here's how it works</p>
              </div>

              {/* Steps */}
              <div className="p-8 space-y-6 flex-1 overflow-y-auto">
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
              </div>
            </>
          )}

          {/* Step 2: Privacy & Trust */}
          {step === 2 && (
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
                    <Trash2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Your conversations disappear</h3>
                    <p className="text-sm text-muted-foreground">The moment your session ends, your conversations are permanently deleted from our servers. We cannot see, retrieve or access anything you share during your check-in.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Lock className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">We only track patterns</h3>
                    <p className="text-sm text-muted-foreground">The only data we retain is lightweight session metadata: timestamp, duration, therapy modality used and completion status.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Save className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">You control what stays</h3>
                    <p className="text-sm text-muted-foreground">We save resources you explicitly bookmark, but your library is entirely under your control - you can add or remove items at anytime.</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Step 3: Quick Start Tips */}
          {step === 3 && (
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
                    <Compass className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Pick your therapy modality first</h3>
                    <p className="text-sm text-muted-foreground">Before sending your first message, choose your therapeutic approach (CBT, ACT, Stoicism, IFS, or Blended) using the compass icon in the top right. You can adjust neurodiversity settings anytime during chat.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <Pause className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Go at your own pace</h3>
                    <p className="text-sm text-muted-foreground">You can pause and resume your conversation anytime. There is no rush - take breaks whenever you need them and pick up right where you left off.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <Library className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Save what resonates</h3>
                    <p className="text-sm text-muted-foreground">Found a helpful podcast, book, or exercise? Click the bookmark icon on any recommendation to save it to your Library for easy access later.</p>
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
