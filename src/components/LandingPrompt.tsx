import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface LandingPromptProps {
  onSubmit: (message: string) => void;
}

const LandingPrompt = ({ onSubmit }: LandingPromptProps) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSubmit(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary via-primary/80 to-secondary">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12 animate-in fade-in duration-700">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            How was your day?
          </h1>
          <p className="text-xl text-white/90">
            Take a moment to reflect and share how you're feeling
          </p>
        </div>

        <form onSubmit={handleSubmit} className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <div className="bg-card rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share what's on your mind..."
              className="min-h-[150px] text-lg resize-none border-2 focus:border-primary transition-colors"
            />
            <Button
              type="submit"
              size="lg"
              className="w-full mt-6 text-lg h-14 bg-primary hover:bg-primary/90 transition-all duration-300"
              disabled={!message.trim()}
            >
              Start Check-in
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LandingPrompt;
