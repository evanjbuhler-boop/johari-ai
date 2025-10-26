import { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LandingPrompt from '@/components/LandingPrompt';
import ChatInterface from '@/components/ChatInterface';
import VentingMode from '@/components/VentingMode';
import ProfileForm from '@/components/ProfileForm';
import ResultsDisplay from '@/components/ResultsDisplay';
import ValidationScreen from '@/components/ValidationScreen';
import ValidationLoadingScreen from '@/components/ValidationLoadingScreen';
import AppLayout from '@/components/AppLayout';
import WelcomeModal from '@/components/WelcomeModal';
import { Message, UserProfile, CheckInResults, ValidationData } from '@/types/checkin';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getMockAIResponse, generateMockResults } from '@/utils/mockAI';
import { useAuth } from '@/hooks/useAuth';
import { useNeurodiveritySettings } from '@/hooks/useNeurodiveritySettings';
import { useTherapyApproach } from '@/hooks/useTherapyApproach';

import RecommendationsLoadingScreen from '@/components/RecommendationsLoadingScreen';

type AppState = 'landing' | 'chat' | 'venting' | 'processing' | 'validation' | 'profile' | 'results';
type ProcessingType = 'validation' | 'recommendations';

const Index = () => {
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(false);
  const [state, setState] = useState<AppState>('landing');
  const [processingType, setProcessingType] = useState<ProcessingType>('validation');
  const [messages, setMessages] = useState<Message[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [results, setResults] = useState<CheckInResults | null>(null);
  const [validationData, setValidationData] = useState<ValidationData | null>(null);
  const [conversationPath, setConversationPath] = useState<'nightly_routine' | 'venting_session' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { settings } = useNeurodiveritySettings();
  const { settings: therapySettings } = useTherapyApproach();

  // Load user profile from database if authenticated, otherwise check localStorage
  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        // Fetch from database for authenticated users
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          const userProfile: UserProfile = {
            name: data.name,
            email: data.email,
            age: data.age,
            location: data.location,
            lifeStage: data.life_stage,
          };
          setProfile(userProfile);
          // Also update localStorage for consistency
          localStorage.setItem('userProfile', JSON.stringify(userProfile));
        }
      } else {
        // Fallback to localStorage for non-authenticated users
        const savedProfile = localStorage.getItem('userProfile');
        if (savedProfile) {
          setProfile(JSON.parse(savedProfile));
        }
      }
    };

    loadProfile();
  }, [user]);

  // Extract validation data from conversation
  const extractValidationData = (messages: Message[]): ValidationData => {
    const conversationText = messages.map(m => m.content).join(' ').toLowerCase();
    
    // Simple keyword-based extraction (in production, this would be done by AI)
    const emotions: string[] = [];
    if (conversationText.includes('stress') || conversationText.includes('anxious')) emotions.push('Anxious');
    if (conversationText.includes('overwhelm')) emotions.push('Overwhelmed');
    if (conversationText.includes('exhaust') || conversationText.includes('tired')) emotions.push('Exhausted');
    if (conversationText.includes('frustrat')) emotions.push('Frustrated');
    if (conversationText.includes('sad') || conversationText.includes('down')) emotions.push('Sad');
    
    const stressors: string[] = [];
    if (conversationText.includes('work')) stressors.push('Work');
    if (conversationText.includes('sleep')) stressors.push('Sleep');
    if (conversationText.includes('wife') || conversationText.includes('relationship')) stressors.push('Relationships');
    
    // Extract contributing factors
    const contributingFactors: string[] = [];
    if (conversationText.includes('work') || conversationText.includes('boss') || conversationText.includes('meeting')) {
      contributingFactors.push('work');
    }
    if (conversationText.includes('sleep') || conversationText.includes('tired') || conversationText.includes('rest')) {
      contributingFactors.push('sleep');
    }
    if (conversationText.includes('coffee') || conversationText.includes('caffeine') || conversationText.includes('alcohol')) {
      contributingFactors.push('caffeine');
    }
    if (conversationText.includes('wife') || conversationText.includes('relationship') || conversationText.includes('partner') || conversationText.includes('conflict')) {
      contributingFactors.push('relationships');
    }
    
    let stressLevel = 5;
    if (conversationText.includes('very stress') || conversationText.includes('extremely')) stressLevel = 8;
    else if (conversationText.includes('a bit') || conversationText.includes('somewhat')) stressLevel = 4;
    
    // Extract sleep if mentioned
    const sleepMatch = conversationText.match(/(\d+)\s*hour/);
    const sleepHours = sleepMatch ? parseInt(sleepMatch[1]) : undefined;
    
    return {
      emotions: emotions.length > 0 ? emotions : ['Stressed'],
      stressLevel,
      mainStressors: stressors.length > 0 ? stressors : ['General stress'],
      sleepHours,
      sleepQuality: sleepHours && sleepHours < 6 ? 'poor quality' : undefined,
      contributingFactors,
      patternAccuracy: null,
      desiredSupport: [],
      aiGeneratedPattern: "You're juggling multiple demands while running on insufficient rest. The stress isn't just about one thing—it's the cumulative load of everything happening at once while your body is signaling it needs recovery."
    };
  };

  // Break long responses into conversational chunks
  const breakIntoChunks = (text: string): string[] => {
    // Split by double newlines (paragraph breaks) or periods followed by space
    const paragraphs = text.split(/\n\n+/);
    
    if (paragraphs.length >= 2) {
      // If we have clear paragraphs, use them
      return paragraphs.filter(p => p.trim().length > 0);
    }
    
    // Otherwise, try to split by sentences into 2-3 chunks
    const sentences = text.split(/(?<=[.!?])\s+/);
    
    if (sentences.length <= 2) {
      return [text]; // Don't split very short responses
    }
    
    // Group sentences into 2-3 chunks
    const chunkSize = Math.ceil(sentences.length / 3);
    const chunks: string[] = [];
    
    for (let i = 0; i < sentences.length; i += chunkSize) {
      const chunk = sentences.slice(i, i + chunkSize).join(' ');
      if (chunk.trim()) chunks.push(chunk.trim());
    }
    
    return chunks.slice(0, 3); // Max 3 chunks
  };

  const handleLandingSubmit = async (message: string) => {
    const userMessage: Message = { role: 'user', content: message, timestamp: new Date().toISOString() };
    setMessages([userMessage]);
    setIsLoading(true);
    
    // Gentle fade transition to chat interface
    await new Promise(resolve => setTimeout(resolve, 400));
    setState('chat');

    try {
      console.log('🌐 API call initiated - handleLandingSubmit');
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { 
          messages: [userMessage], 
          type: 'conversation', 
          neurodiveritySettings: settings,
          therapyApproach: therapySettings.approach
        }
      });

      console.log('📥 API response received:', data);

      if (error) throw error;

      const content = typeof data?.content === 'string' ? data.content.trim() : '';
      console.log('📄 Extracted content:', content);
      
      if (!content) {
        throw new Error('Empty AI response');
      }

      // Break response into chunks
      const chunks = breakIntoChunks(content);
      console.log('📦 Response broken into chunks:', chunks.length, chunks);
      
      // Send chunks sequentially with delays
      for (let i = 0; i < chunks.length; i++) {
        // Calculate typing delay based on chunk length
        const typingDelay = Math.min(1000 + (chunks[i].length * 50), 4000);
        await new Promise(resolve => setTimeout(resolve, typingDelay));
        
        // Add the chunk as a new message
        // On the LAST chunk of the initial response, add path selection buttons
        const isLastChunk = i === chunks.length - 1;
        const aiResponse: Message = {
          role: 'assistant',
          content: chunks[i],
          timestamp: new Date().toISOString(),
          id: `msg-${Date.now()}-${i}`,
        };
        setMessages(prev => [...prev, aiResponse]);
        
        // Wait 1 second between chunks (except after the last one)
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Turn off loading indicator after ALL chunks are sent
      setIsLoading(false);
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Fallback to mock AI response
      const mockContent = getMockAIResponse([userMessage]);
      const chunks = breakIntoChunks(mockContent);
      
      // Send chunks sequentially with delays
      for (let i = 0; i < chunks.length; i++) {
        const typingDelay = Math.min(1000 + (chunks[i].length * 50), 4000);
        await new Promise(resolve => setTimeout(resolve, typingDelay));
        
        const isLastChunk = i === chunks.length - 1;
        const aiResponse: Message = {
          role: 'assistant',
          content: chunks[i],
          timestamp: new Date().toISOString(),
          id: `msg-${Date.now()}-${i}`,
        };
        setMessages(prev => [...prev, aiResponse]);
        
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Turn off loading indicator after ALL chunks are sent
      setIsLoading(false);
      
      toast({
        title: "Using offline mode",
        description: "Connected to local responses.",
      });
    }
  };

  const handleSendMessage = async (message: string, pathSelection?: string) => {
    const userMessage: Message = { role: 'user', content: message, timestamp: new Date().toISOString() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);
    
    // Track conversation path
    if (pathSelection && (pathSelection === 'nightly_routine' || pathSelection === 'venting_session')) {
      setConversationPath(pathSelection as 'nightly_routine' | 'venting_session');
    }

    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { 
          messages: updatedMessages, 
          type: 'conversation',
          conversationPath: pathSelection,
          neurodiveritySettings: settings,
          therapyApproach: therapySettings.approach
        }
      });

      if (error) throw error;

      const content = typeof data?.content === 'string' ? data.content.trim() : '';
      
      if (!content) {
        throw new Error('Empty AI response');
      }

      // Break response into chunks
      const chunks = breakIntoChunks(content);
      
      // Send chunks sequentially with delays
      for (let i = 0; i < chunks.length; i++) {
        // Show typing indicator before each chunk
        const typingDelay = Math.min(1000 + (chunks[i].length * 50), 4000);
        await new Promise(resolve => setTimeout(resolve, typingDelay));
        
        const aiResponse: Message = {
          role: 'assistant',
          content: chunks[i],
          timestamp: new Date().toISOString(),
          id: `msg-${Date.now()}-${i}`,
        };
        setMessages(prev => [...prev, aiResponse]);
        
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Turn off loading indicator after ALL chunks are sent
      setIsLoading(false);
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Fallback to mock AI response
      const mockContent = getMockAIResponse(updatedMessages);
      const chunks = breakIntoChunks(mockContent);
      
      // Send chunks sequentially with delays
      for (let i = 0; i < chunks.length; i++) {
        const typingDelay = Math.min(1000 + (chunks[i].length * 50), 4000);
        await new Promise(resolve => setTimeout(resolve, typingDelay));
        
        const aiResponse: Message = {
          role: 'assistant',
          content: chunks[i],
          timestamp: new Date().toISOString(),
          id: `msg-${Date.now()}-${i}`,
        };
        setMessages(prev => [...prev, aiResponse]);
        
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Turn off loading indicator after ALL chunks are sent
      setIsLoading(false);
      
      toast({
        title: "Using offline mode",
        description: "Connected to local responses.",
      });
    }
  };

  const handleChatComplete = async () => {
    // Show processing state immediately with enhanced loading screen
    setProcessingType('validation');
    setState('processing');
    setIsLoading(true);
    
    // Add minimum delay for better UX (show processing screen for at least 4 seconds to match progress bar)
    const minDelay = new Promise(resolve => setTimeout(resolve, 4000));
    
    try {
      // Ask AI to extract structured validation data from conversation
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { 
          messages, 
          type: 'extract_validation',
          conversationPath
        }
      });

      if (error) throw error;

      // AI should return structured ValidationData with enhanced fields
      const extracted: ValidationData = data || extractValidationData(messages);
      
      // Wait for minimum delay before showing validation
      await minDelay;
      
      setValidationData(extracted);
      setState('validation');
    } catch (error) {
      console.error('Error extracting validation data:', error);
      // Fallback to keyword extraction
      const extracted = extractValidationData(messages);
      
      // Wait for minimum delay before showing validation
      await minDelay;
      
      setValidationData(extracted);
      setState('validation');
      toast({
        title: "Using offline mode",
        description: "Validation data extracted locally.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidationConfirm = async (data: ValidationData) => {
    setValidationData(data);
    
    // Show loading immediately
    setIsLoading(true);
    
    // If user hasn't filled profile before, show profile form
    if (!profile) {
      setIsLoading(false);
      setState('profile');
    } else {
      // Generate results with loading state
      await generateResults(data);
    }
  };

  const handleValidationAdjust = () => {
    // Go back to chat to make adjustments
    setState('chat');
  };

  const generateResults = async (data: ValidationData) => {
    // Show a brief loading screen
    setProcessingType('recommendations');
    setState('processing');
    
    try {
      const { data: resultsData, error } = await supabase.functions.invoke('chat', {
        body: { messages, validationData: data, type: 'results' }
      });

      if (error) throw error;

      setResults(resultsData);
      setIsLoading(false);
      setState('results');
      
      // Save to localStorage
      const checkInData = {
        messages,
        validationData: data,
        results: resultsData,
        profile,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem('lastCheckIn', JSON.stringify(checkInData));
      
      toast({
        title: "Check-in saved",
        description: "Your emotional check-in has been recorded.",
      });
    } catch (error) {
      console.error('Error generating results:', error);
      // Fallback to mock results
      const mockResults = generateMockResults(messages);
      setResults(mockResults);
      setIsLoading(false);
      setState('results');
      
      const checkInData = {
        messages,
        validationData: data,
        results: mockResults,
        profile,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem('lastCheckIn', JSON.stringify(checkInData));
      
      toast({
        title: "Using offline mode",
        description: "Check-in completed with local responses.",
      });
    }
  };

  const handleProfileSubmit = async (userProfile: UserProfile) => {
    setProfile(userProfile);
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    
    // Generate results with validation data
    if (validationData) {
      await generateResults(validationData);
    }
  };

  const handleNewCheckIn = () => {
    setMessages([]);
    setResults(null);
    setValidationData(null);
    setState('landing');
  };

  const handleVentingModeSelected = () => {
    setConversationPath('venting_session');
    setState('venting');
  };

  const handleVentingComplete = (ventText: string) => {
    // Create a message from the venting text
    const ventMessage: Message = {
      role: 'user',
      content: ventText,
      timestamp: new Date().toISOString()
    };
    setMessages([ventMessage]);
    
    // Go to validation/results
    handleChatComplete();
  };

  if (state === 'landing') {
    return (
      <AppLayout>
        {/* Welcome Modal - shows on first visit with delay or when manually opened */}
        <WelcomeModal 
          isOpen={welcomeModalOpen}
          onOpenChange={setWelcomeModalOpen}
        />
        
        {/* Info button in bottom left */}
        <Button
          onClick={() => setWelcomeModalOpen(true)}
          size="icon"
          variant="outline"
          className="fixed bottom-6 left-6 h-10 w-10 rounded-xl hover:scale-105 transition-transform z-50 border-border/50 bg-background/20 backdrop-blur-sm"
        >
          <Info className="h-4 w-4" />
        </Button>
        
        <LandingPrompt onSubmit={handleLandingSubmit} />
      </AppLayout>
    );
  }

  if (state === 'chat') {
    return (
      <AppLayout showBackground={true}>
        <ChatInterface
          initialMessage={messages[0]?.content || ''}
          onComplete={handleChatComplete}
          messages={messages}
          setMessages={setMessages}
          onSendMessage={handleSendMessage}
          onBack={handleNewCheckIn}
          isLoading={isLoading}
          onVentingModeSelected={handleVentingModeSelected}
        />
      </AppLayout>
    );
  }

  if (state === 'venting') {
    return (
      <AppLayout>
        <VentingMode
          onComplete={handleVentingComplete}
          onBack={handleNewCheckIn}
        />
      </AppLayout>
    );
  }

  if (state === 'processing') {
    return (
      <AppLayout>
        {processingType === 'validation' ? (
          <ValidationLoadingScreen />
        ) : (
          <RecommendationsLoadingScreen />
        )}
      </AppLayout>
    );
  }

  if (state === 'validation' && validationData) {
    return (
      <AppLayout showBackground={false}>
        <ValidationScreen
          initialData={validationData}
          conversationPath={conversationPath}
          onConfirm={handleValidationConfirm}
          onAdjust={handleValidationAdjust}
        />
      </AppLayout>
    );
  }

  if (state === 'profile') {
    return (
      <AppLayout>
        <ProfileForm onSubmit={handleProfileSubmit} />
      </AppLayout>
    );
  }

  if (state === 'results' && results) {
    return (
      <AppLayout showBackground={false}>
        <ResultsDisplay results={results} onNewCheckIn={handleNewCheckIn} />
      </AppLayout>
    );
  }

  return null;
};

export default Index;
