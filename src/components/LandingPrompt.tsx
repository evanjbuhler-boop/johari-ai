import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import FloatingParticles from '@/components/FloatingParticles';
import VoiceRecorder from '@/components/VoiceRecorder';
import NeurodiveritySettingsDialog from '@/components/NeurodiveritySettingsDialog';
import FocusModeToggle from '@/components/FocusModeToggle';
import { Link } from 'react-router-dom';
import { User, Library, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface LandingPromptProps {
  onSubmit: (message: string) => void;
}

const LandingPrompt = ({ onSubmit }: LandingPromptProps) => {
  const [message, setMessage] = useState('');
  const { user } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSubmit(message);
    }
  };

  const handleVoiceTranscript = (text: string) => {
    // Set the transcribed text in the textarea for user to edit before sending
    setMessage(text);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden animated-gradient">
      {/* Navigation buttons */}
      <div className="fixed top-6 left-6 z-20 flex gap-3">
        {user ? (
          <>
            <Link to="/library">
              <Button
                variant="ghost"
                size="icon"
                className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20"
              >
                <Library className="h-5 w-5" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20"
            >
              <User className="h-5 w-5" />
            </Button>
          </>
        ) : (
          <Link to="/auth">
            <Button
              variant="ghost"
              className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20 gap-2"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </Button>
          </Link>
        )}
      </div>

      {/* Focus Mode and Neurodiversity settings */}
      <div className="fixed top-6 right-6 z-20 flex gap-3">
        <FocusModeToggle />
        <NeurodiveritySettingsDialog variant="icon" />
      </div>

      {/* Floating particles background */}
      <FloatingParticles />
      
      {/* Texture overlay */}
      <div className="fixed inset-0 texture-overlay pointer-events-none" />
      
      {/* Vignette effect */}
      <div className="fixed inset-0 vignette pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10">
        <div className="text-center mb-12 animate-in fade-in duration-1000">
          {/* Label */}
          <p className="text-sm md:text-base font-normal text-white/70 mb-3 animate-in fade-in duration-1000 uppercase tracking-wider">
            Evening check-in
          </p>
          
          {/* Main heading */}
          <h1 
            className="text-4xl md:text-5xl lg:text-6xl font-medium text-white mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200"
            style={{
              textShadow: '0 4px 20px rgba(0, 0, 0, 0.3), 0 0 40px rgba(255, 255, 255, 0.1)'
            }}
          >
            How was your day?
          </h1>
        </div>

        <form 
          onSubmit={handleSubmit} 
          className="animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-500"
        >
          <div 
            className="bg-white/95 dark:bg-card/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl relative overflow-hidden"
            style={{
              boxShadow: '0 20px 60px -15px rgba(0, 0, 0, 0.3), 0 0 60px rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Inner glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none rounded-3xl" />
            
            <div className="relative flex items-center justify-center">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share what's on your mind..."
                className="min-h-[160px] text-lg resize-none border-muted/30 focus:border-accent/50 transition-all duration-300 bg-transparent focus:breathe-border rounded-2xl"
                style={{
                  boxShadow: 'none'
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="pointer-events-auto">
                  <VoiceRecorder onTranscript={handleVoiceTranscript} />
                </div>
              </div>
            </div>
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
