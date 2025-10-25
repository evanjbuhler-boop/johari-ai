import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import VoiceRecorder from '@/components/VoiceRecorder';

interface ChatInputBarProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

const ChatInputBar = ({ input, setInput, onSubmit, isLoading }: ChatInputBarProps) => {
  const handleVoiceTranscript = (text: string) => {
    setInput(text);
  };

  const handleVoiceSubmit = (text: string) => {
    setInput(text);
    setTimeout(() => {
      onSubmit(new Event('submit') as any);
    }, 100);
  };

  return (
    <div className="fixed bottom-24 left-0 right-0 z-[100] bg-white/95 backdrop-blur-md shadow-xl border-t border-white/30 mb-4">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={onSubmit} className="p-4">
          <div className="flex gap-2 relative">
            <div className="flex-1 relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your response..."
                className="h-12 text-base pr-14 bg-white border-2 border-gray-200 rounded-2xl"
                disabled={isLoading}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <VoiceRecorder 
                  onTranscript={handleVoiceTranscript}
                  onSubmit={handleVoiceSubmit}
                />
              </div>
            </div>
            <Button 
              type="submit" 
              size="lg" 
              disabled={!input.trim() || isLoading}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl px-6"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInputBar;
