import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Message } from '@/types/checkin';
import { MessageSquare, CheckCircle, Sparkles } from 'lucide-react';
import EducationalSidebar from '@/components/EducationalSidebar';
import { useNeurodiveritySettings } from '@/hooks/useNeurodiveritySettings';
import { useFocusMode } from '@/hooks/useFocusMode';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import StageProgressBar from '@/components/StageProgressBar';
import ChatInputBar from '@/components/ChatInputBar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChatInterfaceProps {
  initialMessage: string;
  onComplete: () => void;
  messages: Message[];
  onSendMessage: (message: string, pathSelection?: string) => void;
  onBack: () => void;
  isLoading: boolean;
  onVentingModeSelected?: () => void;
  setMessages?: React.Dispatch<React.SetStateAction<Message[]>>;
}

type SidebarPhase = 'highlight' | 'worry' | 'lifestyle' | 'uncertainty' | 'sleep' | 'conflict' | 'guilt' | 'rumination' | 'avoidance';

const ChatInterface = ({ initialMessage, onComplete, messages, onSendMessage, onBack, isLoading, onVentingModeSelected, setMessages }: ChatInterfaceProps) => {
  const [input, setInput] = useState('');
  const [showEarlyExit, setShowEarlyExit] = useState(false);
  const [conversationPath, setConversationPath] = useState<'nightly_routine' | 'venting_session' | null>(null);
  const [tipsDisabled, setTipsDisabled] = useState(false);
  const [showSummaryOffer, setShowSummaryOffer] = useState(false);
  const [summaryRequested, setSummaryRequested] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
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
  const { settings } = useNeurodiveritySettings();
  const { isEnabled: focusModeEnabled } = useFocusMode();
  const { toast } = useToast();
  const exchangeCount = Math.floor(messages.filter(m => m.role === 'user').length);
  
  // Calculate progress percentage based on emotional depth (min 3 exchanges, natural max ~7)
  const progressPercentage = Math.min(100, Math.floor((exchangeCount / 7) * 100));
  
  // Calculate time estimate (assuming ~1 min per exchange, max 7 exchanges)
  const remainingExchanges = Math.max(0, 7 - exchangeCount);
  const estimatedMinutes = Math.max(1, Math.ceil(remainingExchanges * 0.8)); // Slightly optimistic

  // Persist tips disabled preference
  useEffect(() => {
    const persisted = localStorage.getItem('tipsDisabled');
    if (persisted === 'true') setTipsDisabled(true);
  }, []);

  // Detect if we should show path selection (but don't use this for message suppression anymore)
  const hasPathPrompt = useMemo(() =>
    messages.some(m => m.role === 'assistant' && /would you like to:/i.test(m.content || ''))
  , [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Show early exit option after 3 questions in nightly routine
    if (conversationPath === 'nightly_routine' && exchangeCount >= 3) {
      setShowEarlyExit(true);
    }

    // Show summary offer after 10+ user messages (only once) - only for venting
    if (conversationPath === 'venting_session' && exchangeCount >= 10 && !showSummaryOffer && !summaryRequested) {
      setShowSummaryOffer(true);
    }

    // Contextual tips based on conversation content (disabled in focus mode)
    if (!isLoading && !tipsDisabled && !focusModeEnabled) {
      const userMessages = messages.filter(m => m.role === 'user');
      const recentUserMessages = userMessages.slice(-5); // Last 5 user messages
      const conversationText = recentUserMessages.map(m => m.content.toLowerCase()).join(' ');
      
      // Check for uncertainty pattern ("I don't know" repeated)
      const uncertaintyCount = (conversationText.match(/i don'?t know|not sure|no idea|unsure/gi) || []).length;
      if (uncertaintyCount >= 3 && !sidebar.dismissedPhases.has('uncertainty')) {
        const timer = setTimeout(() => {
          setSidebar(prev => ({ ...prev, visible: true, phase: 'uncertainty' }));
        }, 2000);
        return () => clearTimeout(timer);
      }
      
      // Check for sleep/fatigue mentions
      if ((conversationText.includes('sleep') || conversationText.includes('tired') || conversationText.includes('exhaust') || conversationText.includes('rest')) && !sidebar.dismissedPhases.has('sleep')) {
        const timer = setTimeout(() => {
          setSidebar(prev => ({ ...prev, visible: true, phase: 'sleep' }));
        }, 2000);
        return () => clearTimeout(timer);
      }
      
      // Check for conflict mentions
      if ((conversationText.includes('conflict') || conversationText.includes('argument') || conversationText.includes('fight') || conversationText.includes('disagree')) && !sidebar.dismissedPhases.has('conflict')) {
        const timer = setTimeout(() => {
          setSidebar(prev => ({ ...prev, visible: true, phase: 'conflict' }));
        }, 2000);
        return () => clearTimeout(timer);
      }
      
      // Check for guilt expressions
      if ((conversationText.includes('guilt') || conversationText.includes('should have') || conversationText.includes('my fault') || conversationText.includes('blame myself')) && !sidebar.dismissedPhases.has('guilt')) {
        const timer = setTimeout(() => {
          setSidebar(prev => ({ ...prev, visible: true, phase: 'guilt' }));
        }, 2000);
        return () => clearTimeout(timer);
      }
      
      // Check for rumination patterns (keeps/keep thinking about, can't stop thinking)
      if ((conversationText.includes('keep thinking') || conversationText.includes('keeps coming back') || conversationText.includes("can't stop thinking")) && !sidebar.dismissedPhases.has('rumination')) {
        const timer = setTimeout(() => {
          setSidebar(prev => ({ ...prev, visible: true, phase: 'rumination' }));
        }, 2000);
        return () => clearTimeout(timer);
      }
      
      // Check for avoidance patterns
      if ((conversationText.includes('avoid') || conversationText.includes('putting off') || conversationText.includes('procrastinat') || conversationText.includes("don't want to deal")) && !sidebar.dismissedPhases.has('avoidance')) {
        const timer = setTimeout(() => {
          setSidebar(prev => ({ ...prev, visible: true, phase: 'avoidance' }));
        }, 2000);
        return () => clearTimeout(timer);
      }
    }

    // Educational sidebar triggers (only for nightly_routine path and if tips not disabled and focus mode off)
    if (conversationPath === 'nightly_routine' && !isLoading && !tipsDisabled && !focusModeEnabled) {
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
  }, [messages, exchangeCount, conversationPath, isLoading, sidebar.dismissedPhases, tipsDisabled, focusModeEnabled]);

  const handlePathSelection = (path: 'nightly_routine' | 'venting_session') => {
    setConversationPath(path);
    
    // Mark buttons as used in the message
    setMessages(prev => prev.map(msg => 
      msg.showPathButtons ? { ...msg, pathButtonsUsed: true } : msg
    ));
    
    // For venting mode, switch to VentingMode component
    if (path === 'venting_session' && onVentingModeSelected) {
      onVentingModeSelected();
      return;
    }
    
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

  const handleDisableAllTips = () => {
    setTipsDisabled(true);
    localStorage.setItem('tipsDisabled', 'true');
  };

  const handleSummaryRequest = async (accepted: boolean) => {
    setShowSummaryOffer(false);
    
    if (!accepted) {
      setSummaryRequested(true); // Don't ask again
      return;
    }

    setSummaryRequested(true);
    setSummaryLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { 
          messages, 
          type: 'summarize',
          conversationPath 
        }
      });

      if (error) throw error;

      const summaryText = typeof data?.summary === 'string' ? data.summary : '';
      setSummary(summaryText);
    } catch (error) {
      console.error('Error generating summary:', error);
      toast({
        title: "Could not generate summary",
        description: "Please continue with the conversation.",
        variant: "destructive"
      });
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleSummaryAdjust = () => {
    setSummary(null);
    // User can provide feedback in the next message
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
      
      // Auto-complete logic based on conversation path
      if (conversationPath === 'nightly_routine' && exchangeCount >= 5) {
        // After 5 Q&A exchanges for nightly routine, proceed to validation
        setTimeout(() => onComplete(), 2000);
      } else if (conversationPath === 'venting_session' && exchangeCount >= 8) {
        // For venting, longer conversation (8+ exchanges)
        setTimeout(() => onComplete(), 2000);
      }
    }
  };

  const handleVoiceTranscript = (text: string) => {
    // Set the transcribed text in the input for user to edit before sending
    setInput(text);
  };

  // Calculate overall progress through the chat stage (0-100%)
  const calculateChatProgress = () => {
    const maxExchanges = conversationPath === 'nightly_routine' ? 5 : 8;
    return Math.min((exchangeCount / maxExchanges) * 100, 100);
  };
  
  return (
    <div className="min-h-screen flex flex-col relative animate-in fade-in duration-700">
      {/* Educational Sidebar - hidden in focus mode */}
      {sidebar.visible && sidebar.phase && !focusModeEnabled && (
        <EducationalSidebar 
          phase={sidebar.phase}
          onDismiss={handleSidebarDismiss}
          onDisableAllTips={handleDisableAllTips}
        />
      )}

      {/* Main chat area - scrollable, with space for input + progress bar */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto w-full p-4 md:p-8 pt-20 pb-44">
          <div className="space-y-6">
          <TooltipProvider>
          {messages.map((msg, idx) => {
            // Ensure we have valid content
            const messageContent = msg?.content || '';

            // Suppress ALL path prompt messages from AI - we show custom buttons instead
            const isPathPrompt = msg.role === 'assistant' && /would you like to:/i.test(messageContent);
            if (isPathPrompt) {
              return null; // Hide AI's path prompt entirely
            }
            
            return (
              <div key={`${msg.role}-${idx}-${msg.timestamp}`}>
                <div
                  className={`animate-in fade-in slide-in-from-bottom-2 duration-500 ${
                    msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'
                  }`}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={`max-w-[85%] rounded-2xl px-6 py-4 cursor-default shadow-lg ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                            : 'bg-white/95 backdrop-blur-md text-gray-900 border border-white/50'
                        }`}
                      >
                        <p className="text-base leading-relaxed whitespace-pre-wrap">{messageContent}</p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      {new Date(msg.timestamp).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </TooltipContent>
                  </Tooltip>
                </div>
                
                {/* Inline Path Selection Buttons - attached to message with showPathButtons flag */}
                {msg.showPathButtons && !conversationPath && !msg.pathButtonsUsed && !isLoading && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 flex justify-start mt-4">
                    <div className="max-w-[85%] space-y-4">
                      <p className="text-sm text-white/80 mb-3">Would you like to:</p>
                      <button
                        onClick={() => handlePathSelection('nightly_routine')}
                        className="w-full text-left p-6 rounded-2xl border-2 border-white/30 hover:border-white/60 transition-all duration-200 bg-white/95 backdrop-blur-md hover:bg-white shadow-lg group"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors">
                            <CheckCircle className="h-5 w-5 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-base mb-1 text-gray-900">Do your nightly routine</h3>
                            <p className="text-sm text-gray-600">Structured check-in to help you process and wind down</p>
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => handlePathSelection('venting_session')}
                        className="w-full text-left p-6 rounded-2xl border-2 border-white/30 hover:border-white/60 transition-all duration-200 bg-white/95 backdrop-blur-md hover:bg-white shadow-lg group"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors">
                            <MessageSquare className="h-5 w-5 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-base mb-1 text-gray-900">Just vent right now</h3>
                            <p className="text-sm text-gray-600">Talk freely—I'm here to listen</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          </TooltipProvider>
          
          {/* Summary Offer */}
          {showSummaryOffer && !isLoading && !summaryLoading && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 flex justify-start">
              <div className="max-w-[85%] bg-white/95 backdrop-blur-md text-gray-900 border border-white/50 rounded-2xl p-6 shadow-lg">
                <p className="text-base mb-4">Would it help if I summarized what I'm hearing so far?</p>
                <div className="flex gap-3">
                  <Button
                    variant="default"
                    onClick={() => handleSummaryRequest(true)}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  >
                    Yes, summarize
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSummaryRequest(false)}
                    className="flex-1 bg-white border-2 border-gray-200"
                  >
                    No, keep going
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Summary Display */}
          {summary && !summaryLoading && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 flex justify-start">
              <div className="max-w-[85%] bg-white/95 backdrop-blur-md text-gray-900 border-2 border-purple-300 rounded-2xl p-6 shadow-lg">
                <h3 className="font-semibold text-lg mb-4">Here's what I'm understanding:</h3>
                <div className="whitespace-pre-wrap text-base leading-relaxed mb-4">{summary}</div>
                <p className="text-sm text-gray-600 mb-3">Did I get that right, or should I adjust anything?</p>
                <div className="flex gap-3">
                  <Button
                    variant="default"
                    onClick={() => setSummary(null)}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  >
                    That's right
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSummaryAdjust}
                    className="flex-1"
                  >
                    Let me clarify
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {summaryLoading && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 flex justify-start">
              <div className="max-w-[85%] rounded-2xl px-6 py-4 bg-white/95 backdrop-blur-md text-gray-900 border border-white/50 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">Generating summary...</span>
                </div>
              </div>
            </div>
          )}
          
          {isLoading && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 flex justify-start">
              <div className="max-w-[85%] rounded-2xl px-6 py-4 bg-white/95 backdrop-blur-md text-gray-900 border border-white/50 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Chat Input Bar - Fixed above progress bar */}
      <ChatInputBar
        input={input}
        setInput={setInput}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
      
      {/* 3-Stage Progress Bar - Fixed at bottom */}
      <StageProgressBar
        currentStage="chat" 
        chatProgress={calculateChatProgress()}
        estimatedMinutes={estimatedMinutes}
      />
    </div>
  );
};

export default ChatInterface;
