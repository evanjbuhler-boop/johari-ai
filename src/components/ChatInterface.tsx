import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Message } from '@/types/checkin';
import { Send, ArrowLeft } from 'lucide-react';

interface ChatInterfaceProps {
  initialMessage: string;
  onComplete: () => void;
  messages: Message[];
  onSendMessage: (message: string) => void;
  onBack: () => void;
}

const ChatInterface = ({ initialMessage, onComplete, messages, onSendMessage, onBack }: ChatInterfaceProps) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const exchangeCount = Math.floor(messages.filter(m => m.role === 'user').length);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
      
      // Complete after 5 user messages
      if (exchangeCount >= 4) {
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
          <div className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            {exchangeCount}/5 exchanges
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
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="sticky bottom-0 bg-background border-t border-border">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your response..."
              className="flex-1 h-12 text-base"
            />
            <Button type="submit" size="lg" disabled={!input.trim()}>
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
