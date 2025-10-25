import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import VoiceRecorder from '@/components/VoiceRecorder';

interface LandingPromptProps {
  onSubmit: (message: string) => void;
}

const LandingPrompt = ({ onSubmit }: LandingPromptProps) => {
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'type' | 'speak'>('type');

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === 't' || e.key === 'T') {
        setActiveTab('type');
      } else if (e.key === 's' || e.key === 'S') {
        setActiveTab('speak');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSubmit(message);
    }
  };

  const handleVoiceTranscript = (text: string) => {
    setMessage(text);
    setActiveTab('type'); // Switch to type tab to show the transcript
  };

  const handleVoiceSubmit = (text: string) => {
    onSubmit(text);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden animate-in fade-in duration-700">
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

        <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-500">
          <div 
            className="bg-white/95 dark:bg-card/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl relative overflow-hidden"
            style={{
              boxShadow: '0 20px 60px -15px rgba(0, 0, 0, 0.3), 0 0 60px rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Inner glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none rounded-3xl" />
            
            <div className="relative">
              {/* Tabs */}
              <div className="flex gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => setActiveTab('type')}
                  className={`flex-1 py-3 px-6 rounded-xl text-sm font-medium transition-all duration-300 ${
                    activeTab === 'type'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  Type
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('speak')}
                  className={`flex-1 py-3 px-6 rounded-xl text-sm font-medium transition-all duration-300 ${
                    activeTab === 'speak'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  Speak
                </button>
              </div>

              {/* Tab Content */}
              <div className="min-h-[280px]">
                {activeTab === 'type' ? (
                <form onSubmit={handleSubmit}>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Share what's on your mind..."
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
                </form>
              ) : (
                <VoiceRecorder 
                  onTranscript={handleVoiceTranscript}
                  onSubmit={handleVoiceSubmit}
                  variant="landing"
                />
                )}
              </div>

              {/* Keyboard hint */}
              <div className="mt-4 text-center text-xs text-muted-foreground">
                Press <kbd className="px-2 py-1 bg-muted rounded text-foreground">T</kbd> to type, 
                <kbd className="ml-1 px-2 py-1 bg-muted rounded text-foreground">S</kbd> to speak
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPrompt;
