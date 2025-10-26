import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageCircle, CheckSquare, Sparkles, Library, Settings, Brain } from 'lucide-react';

interface WelcomeModalProps {
  onClose: () => void;
}

const WelcomeModal = ({ onClose }: WelcomeModalProps) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setOpen(true);
    } else {
      onClose();
    }
  }, [onClose]);

  const handleClose = () => {
    localStorage.setItem('hasSeenWelcome', 'true');
    setOpen(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl p-0 gap-0 border-0">
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-purple-500/10 backdrop-blur-xl">
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
                <Settings className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
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

          {/* Footer */}
          <div className="p-8 pt-4">
            <Button 
              onClick={handleClose}
              size="lg"
              className="w-full text-lg h-14 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, hsl(340, 75%, 70%), hsl(260, 60%, 65%))',
                boxShadow: '0 4px 20px rgba(255, 138, 180, 0.4)'
              }}
            >
              Let's Get Started
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;
