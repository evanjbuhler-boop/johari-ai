import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Pause, Check, Mic } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import VoiceRecorder from '@/components/VoiceRecorder';

interface VentingModeProps {
  onComplete: (ventText: string) => void;
  onBack: () => void;
}

type TimingPhase = 'typing' | 'short_pause' | 'medium_pause' | 'long_pause' | 'done';

const VentingMode = ({ onComplete, onBack }: VentingModeProps) => {
  const [ventText, setVentText] = useState('');
  const [acknowledgments, setAcknowledgments] = useState<{ text: string; time: number }[]>([]);
  const [timingPhase, setTimingPhase] = useState<TimingPhase>('typing');
  const [isPaused, setIsPaused] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<{ empathy: string; themes: string[] } | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const { toast } = useToast();
  
  const lastActivityRef = useRef<number>(Date.now());
  const typingTimeRef = useRef<number>(0);
  const lastTextLengthRef = useRef<number>(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Track typing activity
  useEffect(() => {
    if (ventText.length > lastTextLengthRef.current) {
      lastActivityRef.current = Date.now();
      typingTimeRef.current += Date.now() - lastActivityRef.current;
      setTimingPhase('typing');
    }
    lastTextLengthRef.current = ventText.length;
  }, [ventText]);

  // Smart timing system
  useEffect(() => {
    if (isPaused || showSummary) return;

    const checkTiming = setInterval(() => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivityRef.current;

      // Show "✓ Heard" after 30 seconds of continuous typing
      if (typingTimeRef.current > 30000 && acknowledgments.length === 0) {
        setAcknowledgments([{ text: '✓ Heard', time: now }]);
      }

      // After 15 seconds pause
      if (timeSinceActivity > 15000 && timeSinceActivity < 45000 && timingPhase !== 'short_pause') {
        setTimingPhase('short_pause');
      }

      // After 45 seconds pause
      if (timeSinceActivity > 45000 && timeSinceActivity < 120000 && timingPhase !== 'medium_pause') {
        setTimingPhase('medium_pause');
      }

      // After 2 minutes pause
      if (timeSinceActivity > 120000 && timingPhase !== 'long_pause') {
        setTimingPhase('long_pause');
      }
    }, 1000);

    return () => clearInterval(checkTiming);
  }, [isPaused, showSummary, timingPhase, acknowledgments.length]);

  const handlePause = () => {
    setIsPaused(!isPaused);
    toast({
      title: isPaused ? "Resumed" : "Paused",
      description: isPaused ? "Continue when you're ready" : "Take your time",
    });
  };

  const handleDone = async () => {
    if (!ventText.trim()) {
      toast({
        title: "Nothing to save",
        description: "Please share something before finishing",
        variant: "destructive"
      });
      return;
    }

    setIsLoadingSummary(true);
    setShowSummary(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { 
          ventText,
          type: 'venting_summary'
        }
      });

      if (error) throw error;

      setSummary({
        empathy: data?.empathy || "I heard that you're feeling overwhelmed and needed space to process everything.",
        themes: data?.themes || ["Processing emotions", "Seeking clarity", "Need for support"]
      });
    } catch (error) {
      console.error('Error generating summary:', error);
      // Fallback summary
      setSummary({
        empathy: "I heard that you're feeling overwhelmed and needed space to process everything.",
        themes: ["Processing emotions", "Seeking clarity", "Need for support"]
      });
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const handleKeepVenting = () => {
    setShowSummary(false);
    setSummary(null);
    setTimingPhase('typing');
    lastActivityRef.current = Date.now();
    textareaRef.current?.focus();
  };

  const handleVoiceTranscript = (text: string) => {
    setVentText(prev => prev + (prev ? ' ' : '') + text);
    lastActivityRef.current = Date.now();
  };

  const getPromptText = () => {
    switch (timingPhase) {
      case 'short_pause':
        return 'What else is on your mind?';
      case 'medium_pause':
        return "Take your time. I'm here when you're ready.";
      case 'long_pause':
        return null; // Show options instead
      default:
        return null;
    }
  };

  if (showSummary && summary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-secondary/10 flex items-center justify-center p-4">
        <div className="max-w-3xl w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="bg-card/80 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-border/50 shadow-soft">
            {/* Read-only view of their text */}
            <div className="mb-8 p-6 bg-muted/30 rounded-2xl max-h-[300px] overflow-y-auto">
              <p className="text-sm text-muted-foreground mb-2">What you shared:</p>
              <p className="text-base leading-relaxed text-foreground/90 whitespace-pre-wrap">{ventText}</p>
            </div>

            {/* AI empathetic summary */}
            <div className="mb-6 p-6 bg-primary/5 rounded-2xl border border-primary/10">
              <p className="text-base leading-relaxed text-foreground">{summary.empathy}</p>
            </div>

            {/* Key themes */}
            <div className="mb-8">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Key themes I noticed:</h3>
              <div className="space-y-2">
                {summary.themes.map((theme, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-base">{theme}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleKeepVenting}
                variant="outline"
                className="flex-1 h-12"
              >
                Keep venting
              </Button>
              <Button
                onClick={() => onComplete(ventText)}
                className="flex-1 h-12"
              >
                End check-in and save
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-secondary/10 animate-in fade-in duration-1000">
      {/* Header with subtle controls */}
      <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBack}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePause}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <Pause className="h-4 w-4" />
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDone}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <Check className="h-4 w-4" />
            I'm done
          </Button>
        </div>
      </div>

      {/* Main venting area */}
      <div className="max-w-5xl mx-auto px-4 pb-8">
        <div className="relative">
          {/* Gentle prompt */}
          <div className="text-center mb-8 animate-in fade-in duration-700 delay-300">
            <p className="text-lg text-muted-foreground">
              This is your space. No judgment, no questions, just listening.
            </p>
          </div>

          {/* Large text area with margin for acknowledgments */}
          <div className="flex gap-6">
            {/* Acknowledgment margin */}
            <div className="hidden md:block w-24 flex-shrink-0 pt-4">
              <div className="space-y-8">
                {acknowledgments.map((ack, idx) => (
                  <div 
                    key={idx} 
                    className="text-xs text-primary/60 animate-in fade-in duration-500"
                  >
                    {ack.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Main text area */}
            <div className="flex-1 bg-card/50 backdrop-blur-sm rounded-3xl p-8 border border-border/30 shadow-soft">
              <Textarea
                ref={textareaRef}
                value={ventText}
                onChange={(e) => setVentText(e.target.value)}
                placeholder="Start typing or speaking..."
                className="min-h-[400px] text-lg resize-none border-transparent focus:border-transparent bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground leading-relaxed"
                disabled={isPaused}
                autoFocus
              />

              {/* Voice recorder - pass empty onSubmit since we handle it with onTranscript */}
              <div className="mt-6 flex justify-end">
                <VoiceRecorder 
                  onTranscript={handleVoiceTranscript}
                  onSubmit={() => {}} 
                />
              </div>
            </div>
          </div>

          {/* Gentle prompts at bottom */}
          {!isPaused && getPromptText() && (
            <div className="mt-6 text-center animate-in fade-in duration-500">
              <p className="text-base text-muted-foreground italic">
                {getPromptText()}
              </p>
            </div>
          )}

          {/* Long pause options */}
          {!isPaused && timingPhase === 'long_pause' && (
            <div className="mt-6 flex justify-center gap-4 animate-in fade-in duration-500">
              <Button
                variant="outline"
                onClick={() => {
                  lastActivityRef.current = Date.now();
                  setTimingPhase('typing');
                  textareaRef.current?.focus();
                }}
              >
                Keep going
              </Button>
              <Button
                onClick={handleDone}
              >
                I'm done
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Loading overlay */}
      {isLoadingSummary && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Creating your summary...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VentingMode;
