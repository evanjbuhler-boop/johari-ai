import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import FloatingParticles from '@/components/FloatingParticles';
import BreathingCircle from '@/components/BreathingCircle';

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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden animated-gradient">
      {/* Floating particles background */}
      <FloatingParticles />
      
      {/* Texture overlay */}
      <div className="fixed inset-0 texture-overlay pointer-events-none" />
      
      {/* Vignette effect */}
      <div className="fixed inset-0 vignette pointer-events-none" />
      
      {/* Breathing circle */}
      <BreathingCircle />

      <div className="w-full max-w-2xl relative z-10">
        <div className="text-center mb-12 animate-in fade-in duration-1000">
          <h1 
            className="text-5xl md:text-7xl font-bold text-white mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000"
            style={{
              textShadow: '0 4px 20px rgba(0, 0, 0, 0.3), 0 0 40px rgba(255, 255, 255, 0.1)'
            }}
          >
            How was your day?
          </h1>
          <p className="text-xl md:text-2xl text-white/90 animate-in fade-in duration-1000 delay-500">
            Take a breath. Let's talk about it.
          </p>
        </div>

        <form 
          onSubmit={handleSubmit} 
          className="animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-700"
        >
          <div 
            className="bg-white/95 dark:bg-card/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl relative overflow-hidden"
            style={{
              boxShadow: '0 20px 60px -15px rgba(0, 0, 0, 0.3), 0 0 60px rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Inner glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none rounded-3xl" />
            
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What's weighing on you tonight?"
              className="min-h-[160px] text-lg resize-none border-muted/30 focus:border-accent/50 transition-all duration-300 bg-transparent focus:breathe-border rounded-2xl"
              style={{
                boxShadow: 'none'
              }}
            />
            <Button
              type="submit"
              size="lg"
              className="w-full mt-6 text-lg h-14 rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, hsl(340, 75%, 70%), hsl(260, 60%, 65%))',
                boxShadow: '0 4px 20px rgba(255, 138, 180, 0.4)'
              }}
              disabled={!message.trim()}
            >
              I'm ready
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LandingPrompt;
