import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Message } from '@/types/checkin';
import { Send, ArrowLeft, MessageSquare, CheckCircle, Sparkles } from 'lucide-react';

interface ChatInterfaceProps {
  initialMessage: string;
  onComplete: () => void;
  messages: Message[];
  onSendMessage: (message: string) => void;
  onBack: () => void;
  isLoading: boolean;
}

const ChatInterface = ({ initialMessage, onComplete, messages, onSendMessage, onBack, isLoading }: ChatInterfaceProps) => {
  const [input, setInput] = useState('');
  const [showEarlyExit, setShowEarlyExit] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const exchangeCount = Math.floor(messages.filter(m => m.role === 'user').length);
  
  // Calculate progress percentage based on emotional depth (min 3 exchanges, natural max ~7)
  const progressPercentage = Math.min(100, Math.floor((exchangeCount / 7) * 100));
  
  // Calculate time estimate (assuming ~1 min per exchange, max 7 exchanges)
  const remainingExchanges = Math.max(0, 7 - exchangeCount);
  const estimatedMinutes = Math.max(1, Math.ceil(remainingExchanges * 0.8)); // Slightly optimistic

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // Show early exit option after 3 exchanges
    if (exchangeCount >= 3) {
      setShowEarlyExit(true);
    }
  }, [messages, exchangeCount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
      
      // Auto-complete after 7 user messages (soft limit)
      if (exchangeCount >= 6) {
        setTimeout(() => onComplete(), 2000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
