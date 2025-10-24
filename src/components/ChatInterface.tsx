import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Message } from '@/types/checkin';
import { Send, ArrowLeft, MessageSquare, CheckCircle, Sparkles } from 'lucide-react';
import EducationalSidebar from '@/components/EducationalSidebar';
import VoiceRecorder from '@/components/VoiceRecorder';

interface ChatInterfaceProps {
  initialMessage: string;
  onComplete: () => void;
  messages: Message[];
  onSendMessage: (message: string, pathSelection?: string) => void;
  onBack: () => void;
  isLoading: boolean;
}

type SidebarPhase = 'highlight' | 'worry' | 'lifestyle';

const ChatInterface = ({ initialMessage, onComplete, messages, onSendMessage, onBack, isLoading }: ChatInterfaceProps) => {
  const [input, setInput] = useState('');
  const [showEarlyExit, setShowEarlyExit] = useState(false);
  const [conversationPath, setConversationPath] = useState<'nightly_routine' | 'venting_session' | null>(null);
  const [showPathSelection, setShowPathSelection] = useState(false);
  const [sidebar, setSidebar] = useState<{
    visible: boolean;
    phase: SidebarPhase | null;
    dismissedPhases: Set<SidebarPhase>;
  }>({
    visible: false,
    phase: null,
    dismissedPhases: new Set()
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const exchangeCount = Math.floor(messages.filter(m => m.role === 'user').length);
  
  // Calculate progress percentage based on emotional depth (min 3 exchanges, natural max ~7)
  const progressPercentage = Math.min(100, Math.floor((exchangeCount / 7) * 100));
  
  // Calculate time estimate (assuming ~1 min per exchange, max 7 exchanges)
  const remainingExchanges = Math.max(0, 7 - exchangeCount);
  const estimatedMinutes = Math.max(1, Math.ceil(remainingExchanges * 0.8)); // Slightly optimistic

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Show path selection after first AI response (when there are 2 messages total)
    if (messages.length === 2 && !conversationPath && !showPathSelection) {
      setShowPathSelection(true);
    }
    
    // Show early exit option after path selected and 3+ exchanges
    if (conversationPath && exchangeCount >= 3) {
      setShowEarlyExit(true);
    }

    // Educational sidebar triggers (only for nightly_routine path)
    if (conversationPath === 'nightly_routine' && !isLoading) {
      const lastMessage = messages[messages.length - 1];
      const isAIMessage = lastMessage?.role === 'assistant';
      
      // Phase 2: After AI asks about daily highlight (exchange 2)
      if (exchangeCount === 2 && isAIMessage && !sidebar.dismissedPhases.has('highlight')) {
        const timer = setTimeout(() => {
          setSidebar(prev => ({ ...prev, visible: true, phase: 'highlight' }));
        }, 1500);
        return () => clearTimeout(timer);
      }
      
      // Phase 3: After user responds with worry (exchange 5 - user has answered worry question)
      if (exchangeCount === 5 && !isAIMessage && !sidebar.dismissedPhases.has('worry')) {
        const timer = setTimeout(() => {
          setSidebar(prev => ({ ...prev, visible: true, phase: 'worry' }));
        }, 1500);
        return () => clearTimeout(timer);
      }
      
      // Phase 4: After AI asks about lifestyle (exchange 6)
      if (exchangeCount === 6 && isAIMessage && !sidebar.dismissedPhases.has('lifestyle')) {
        const timer = setTimeout(() => {
          setSidebar(prev => ({ ...prev, visible: true, phase: 'lifestyle' }));
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [messages, exchangeCount, conversationPath, showPathSelection, isLoading, sidebar.dismissedPhases]);

  const handlePathSelection = (path: 'nightly_routine' | 'venting_session') => {
    setConversationPath(path);
    setShowPathSelection(false);
    onSendMessage(path === 'nightly_routine' ? 'Do my nightly routine' : 'I just need to vent', path);
  };

  const handleSidebarDismiss = () => {
    if (sidebar.phase) {
      setSidebar(prev => ({
        ...prev,
        visible: false,
        dismissedPhases: new Set([...prev.dismissedPhases, prev.phase!])
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      // Auto-dismiss sidebar when user sends a message (phase change)
      if (sidebar.visible) {
        handleSidebarDismiss();
      }
      
      onSendMessage(input, conversationPath || undefined);
      setInput('');
      
      // Auto-complete after 7 user messages (soft limit) only if path is selected
      if (conversationPath && exchangeCount >= 6) {
        setTimeout(() => onComplete(), 10000);
      }
    }
  };

  const handleVoiceTranscript = (text: string) => {
    // Set the transcribed text in the input for user to edit before sending
    setInput(text);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Educational Sidebar */}
      {sidebar.visible && sidebar.phase && (
        <EducationalSidebar 
          phase={sidebar.phase}
          onDismiss={handleSidebarDismiss}
        />
      )}

      <div className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-8">
        <div className="mb-6 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-4">
            {showEarlyExit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onComplete}
                className="text-sm"
              >
                I'm ready to see my reflection
              </Button>
            )}
            <div className="relative w-16 h-16">
              <svg className="transform -rotate-90 w-16 h-16">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  className="text-muted"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  strokeDashoffset={`${2 * Math.PI * 28 * (1 - progressPercentage / 100)}`}
                  className="text-primary transition-all duration-500"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-medium">{progressPercentage}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 mb-24">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`animate-in fade-in slide-in-from-bottom-2 duration-500 ${
                msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-6 py-4 ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-card-foreground border border-border'
                }`}
              >
                <p className="text-base leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          
          {/* Path Selection */}
          {showPathSelection && !conversationPath && !isLoading && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 flex justify-start">
              <div className="max-w-[85%] space-y-4">
                <p className="text-sm text-muted-foreground mb-3">Would you like to:</p>
                <button
                  onClick={() => handlePathSelection('nightly_routine')}
                  className="w-full text-left p-6 rounded-2xl border-2 border-border hover:border-primary transition-all duration-200 bg-card hover:bg-accent group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                      <CheckCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-base mb-1">Do your nightly routine</h3>
                      <p className="text-sm text-muted-foreground">Structured check-in to help you process and wind down</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => handlePathSelection('venting_session')}
                  className="w-full text-left p-6 rounded-2xl border-2 border-border hover:border-primary transition-all duration-200 bg-card hover:bg-accent group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-base mb-1">Just vent right now</h3>
                      <p className="text-sm text-muted-foreground">Talk freely—I'm here to listen</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}
          
          {isLoading && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 flex justify-start">
              <div className="max-w-[85%] rounded-2xl px-6 py-4 bg-card text-card-foreground border border-border">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-sm text-muted-foreground">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="sticky bottom-0 bg-background border-t border-border">
        <div className="max-w-4xl mx-auto">
          {/* Progress bar section */}
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center justify-between mb-2 text-xs">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-primary" />
                  <span className="font-medium text-primary">Chat</span>
                </div>
                <span className="text-muted-foreground">→</span>
                <div className="flex items-center gap-1.5 opacity-50">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>Validate</span>
                </div>
                <span className="text-muted-foreground opacity-50">→</span>
                <div className="flex items-center gap-1.5 opacity-50">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Recommendations</span>
                </div>
              </div>
              <span className="text-muted-foreground font-medium">
                ~{estimatedMinutes} min remaining
              </span>
            </div>
            <Progress value={progressPercentage} className="h-1.5" />
          </div>
          
          {/* Input form */}
          <form onSubmit={handleSubmit} className="p-4 pt-2">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your response..."
                className="flex-1 h-12 text-base"
                disabled={isLoading}
              />
              <VoiceRecorder onTranscript={handleVoiceTranscript} />
              <Button type="submit" size="lg" disabled={!input.trim() || isLoading}>
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
