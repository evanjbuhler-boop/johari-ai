import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Message, EmotionState } from '@/types/checkin';
import { MessageSquare, CheckCircle, Sparkles } from 'lucide-react';
import EducationalSidebar from '@/components/EducationalSidebar';
import { useNeurodiveritySettings } from '@/hooks/useNeurodiveritySettings';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import StageProgressBar from '@/components/StageProgressBar';
import ChatInputBar from '@/components/ChatInputBar';
import BreathingExerciseModal from '@/components/BreathingExerciseModal';
import FinishChatButton from '@/components/FinishChatButton';
import {
  detectEmotionFromMessage,
  getEmotionGradient,
  shouldTriggerBreathing
} from '@/components/EmotionDetector';
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
  onPause?: () => void;
  isLoading: boolean;
  onVentingModeSelected?: () => void;
  setMessages?: React.Dispatch<React.SetStateAction<Message[]>>;
}

type SidebarPhase = 'highlight' | 'worry' | 'lifestyle' | 'uncertainty' | 'sleep' | 'conflict' | 'guilt' | 'rumination' | 'avoidance';

const ChatInterface = ({ initialMessage, onComplete, messages, onSendMessage, onBack, onPause, isLoading, onVentingModeSelected, setMessages }: ChatInterfaceProps) => {
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
  
  // NEW: Emotion detection & adaptive UI
  const [detectedEmotion, setDetectedEmotion] = useState<EmotionState>('neutral');
  const [showBreathingExercise, setShowBreathingExercise] = useState(false);
  const [showFinishButton, setShowFinishButton] = useState(false);
  const [conversationStartTime] = useState<number>(Date.now());
  const [conversationDuration, setConversationDuration] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastEmotionUpdateRef = useRef<number>(0);
  const { settings } = useNeurodiveritySettings();
  const { toast } = useToast();
  const exchangeCount = Math.floor(messages.filter(m => m.role === 'user').length);
  
  // Calculate progress percentage based on when finish button will appear (8 mins OR 34 exchanges)
  const TIME_THRESHOLD_SECONDS = 480; // 8 minutes
  const MESSAGE_THRESHOLD = 34;
  
  // Progress from both time and message count
  const timeProgress = (conversationDuration / TIME_THRESHOLD_SECONDS) * 100;
  const messageProgress = (exchangeCount / MESSAGE_THRESHOLD) * 100;
  const progressPercentage = Math.min(100, Math.floor(Math.max(timeProgress, messageProgress)));
  
  // Calculate time estimate based on actual thresholds
  const timeRemaining = Math.max(0, TIME_THRESHOLD_SECONDS - conversationDuration);
  const messagesRemaining = Math.max(0, MESSAGE_THRESHOLD - exchangeCount);
  
  // Show whichever will happen first
  const estimatedMinutes = Math.max(1, Math.ceil(Math.min(timeRemaining / 60, messagesRemaining * 0.8)));
  
  // Track conversation duration
  useEffect(() => {
    const interval = setInterval(() => {
      setConversationDuration(Math.floor((Date.now() - conversationStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [conversationStartTime]);

  // Persist tips disabled preference
  useEffect(() => {
    const persisted = localStorage.getItem('tipsDisabled');
    if (persisted === 'true') setTipsDisabled(true);
  }, []);

  // Detect if we should show path selection (but don't use this for message suppression anymore)
  const hasPathPrompt = useMemo(() =>
    messages.some(m => m.role === 'assistant' && /would you like to:/i.test(m.content || ''))
  , [messages]);

  // Separate effect for scrolling and basic UI updates
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
  }, [messages, exchangeCount, conversationPath, showSummaryOffer, summaryRequested]);
  
  // Separate effect for finish button based on time/messages
  useEffect(() => {
    const TIME_THRESHOLD_SECONDS = 480; // 8 minutes
    const MESSAGE_THRESHOLD = 34;
    const timeThreshold = conversationDuration >= TIME_THRESHOLD_SECONDS;
    const messageThreshold = exchangeCount >= MESSAGE_THRESHOLD;
    if ((timeThreshold || messageThreshold) && !showFinishButton) {
      setShowFinishButton(true);
    }
  }, [conversationDuration, exchangeCount, conversationPath, showFinishButton]);
  
  // Detect finish-intent keywords in user messages OR AI closing statements
  useEffect(() => {
    if (isLoading || showFinishButton) return;
    
    const recentMessages = messages.slice(-3);
    if (recentMessages.length === 0) return;
    
    // Check last user message for finish intent
    const recentUserMessages = messages.filter(m => m.role === 'user').slice(-2);
    if (recentUserMessages.length > 0) {
      const lastUserMessage = recentUserMessages[recentUserMessages.length - 1].content.toLowerCase();
      
      // Finish intent keywords
      const finishKeywords = [
        'show me recommendations',
        'see my recommendations',
        'want to see recommendations',
        'ready for recommendations',
        'give me recommendations',
        'show recommendations',
        'finish chat',
        'finish this',
        'i\'m done',
        'i am done',
        'done chatting',
        'ready to finish',
        'move on',
        'next step',
        'ready to move on',
        'over this chat',
        'done with this',
        'wrap up',
        'wrap this up',
        'let\'s do it',
        'ok',
        'yes'
      ];
      
      const hasFinishIntent = finishKeywords.some(keyword => lastUserMessage.includes(keyword));
      
      if (hasFinishIntent && exchangeCount >= 3) {
        // Ensure we have at least 3 exchanges for meaningful conversation
        setShowFinishButton(true);
      }
    }
    
    // Also check if AI is giving closing statements
    const lastAIMessages = messages.filter(m => m.role === 'assistant').slice(-2);
    if (lastAIMessages.length > 0) {
      const recentAIText = lastAIMessages.map(m => m.content.toLowerCase()).join(' ');
      
      // AI closing statement patterns
      const closingPhrases = [
        'thank you for the conversation',
        'thank you for sharing today',
        'it\'s been great to explore',
        'if you feel ready, we can wrap up',
        'when we finish this conversation',
        'personalized insights for you to consider',
        'ready to reflect',
        'wrap up',
        'ready to move forward'
      ];
      
      const hasClosingStatement = closingPhrases.some(phrase => recentAIText.includes(phrase));
      
      if (hasClosingStatement && exchangeCount >= 3) {
        setShowFinishButton(true);
      }
    }
  }, [messages, isLoading, showFinishButton, exchangeCount]);
  
  // Separate effect for emotion detection - only runs when messages change
  useEffect(() => {
    if (isLoading) return; // Don't process while loading
    
    const recentUserMessages = messages.filter(m => m.role === 'user').slice(-3);
    if (recentUserMessages.length === 0) return;
    
    const lastUserMessage = recentUserMessages[recentUserMessages.length - 1];
    const emotion = detectEmotionFromMessage(lastUserMessage.content);
    if (emotion !== 'neutral') {
      setDetectedEmotion(emotion);
    }
    
    // Check if breathing exercise should trigger
    if (shouldTriggerBreathing(emotion, lastUserMessage.content) && !showBreathingExercise) {
      const timer = setTimeout(() => setShowBreathingExercise(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [messages, isLoading, showBreathingExercise]);

  // Separate effect for contextual educational tips
  useEffect(() => {
    // Contextual tips based on conversation content
    if (!isLoading && !tipsDisabled) {
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

    // Educational sidebar triggers (only for nightly_routine path and if tips not disabled)
    if (conversationPath === 'nightly_routine' && !isLoading && !tipsDisabled) {
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
  }, [messages, exchangeCount, conversationPath, isLoading, sidebar.dismissedPhases, tipsDisabled]);

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
      // Note: exchangeCount will be +1 after this message is processed
      if (conversationPath === 'nightly_routine' && exchangeCount >= 4) {
        // After 5 Q&A exchanges for nightly routine, proceed to validation
        setTimeout(() => onComplete(), 2000);
      } else if (conversationPath === 'venting_session' && exchangeCount >= 7) {
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
      {/* NEW: Breathing Exercise Modal */}
      {showBreathingExercise && (
        <BreathingExerciseModal 
          onClose={() => setShowBreathingExercise(false)}
        />
      )}
      
      {/* Educational Sidebar */}
      {sidebar.visible && sidebar.phase && (
        <EducationalSidebar 
          phase={sidebar.phase}
          onDismiss={handleSidebarDismiss}
          onDisableAllTips={handleDisableAllTips}
        />
      )}

      {/* Main chat area - scrollable, with space for input + progress bar */}
      <div className="flex-1 overflow-y-auto scroll-smooth">
        <div className="max-w-4xl mx-auto w-full p-4 md:p-8 pt-20" style={{ paddingBottom: 'calc(var(--chat-input-height, 80px) + var(--stage-bar-height, 96px) + env(safe-area-inset-bottom) + 16px)' }}>
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
            
            const isLastAIMessage = msg.role === 'assistant' && idx === messages.length - 1;
            
            return (
              <div key={`${msg.role}-${idx}-${msg.timestamp}`}>
                <div
                  className={`animate-in fade-in slide-in-from-bottom-2 duration-500 ${
                    msg.role === 'user' ? 'flex justify-end' : 'flex justify-start items-end gap-3'
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
                  
                  {/* Your Turn Indicator - to the right of last AI message */}
                  {isLastAIMessage && !isLoading && (
                    <div className="animate-in fade-in duration-500 mb-1">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-white/50 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                        <span className="text-xs text-gray-600 font-medium">Your turn</span>
                      </div>
                    </div>
                  )}
                </div>
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
          
          {/* Finish and Pause buttons */}
          {(showFinishButton || exchangeCount >= 2) && (
            <div className="max-w-4xl mx-auto w-full px-4 space-y-3">
              {showFinishButton && <FinishChatButton onClick={onComplete} />}
              {onPause && exchangeCount >= 2 && (
                <Button
                  onClick={onPause}
                  variant="outline"
                  className="w-full py-6 text-base"
                >
                  Pause & Save for Later
                </Button>
              )}
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
