import { useState, useEffect } from 'react';
import LandingPrompt from '@/components/LandingPrompt';
import ChatInterface from '@/components/ChatInterface';
import ProfileForm from '@/components/ProfileForm';
import ResultsDisplay from '@/components/ResultsDisplay';
import ValidationScreen from '@/components/ValidationScreen';
import { Message, UserProfile, CheckInResults, ValidationData } from '@/types/checkin';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getMockAIResponse, generateMockResults } from '@/utils/mockAI';
import { useAuth } from '@/hooks/useAuth';
import { useNeurodiveritySettings } from '@/hooks/useNeurodiveritySettings';

type AppState = 'landing' | 'chat' | 'processing' | 'validation' | 'profile' | 'results';

const Index = () => {
  const [state, setState] = useState<AppState>('landing');
  const [messages, setMessages] = useState<Message[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [results, setResults] = useState<CheckInResults | null>(null);
  const [validationData, setValidationData] = useState<ValidationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { settings } = useNeurodiveritySettings();

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
    setState('chat');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { messages: [userMessage], type: 'conversation', neurodiveritySettings: settings }
      });

      if (error) throw error;

      const content = typeof data?.content === 'string' ? data.content.trim() : '';
      if (!content) {
        throw new Error('Empty AI response');
      }

      // Break response into chunks
      const chunks = breakIntoChunks(content);
      
      setIsLoading(false);
      
      // Send chunks sequentially with delays
      for (let i = 0; i < chunks.length; i++) {
        // Show typing indicator before each chunk
        setIsTyping(true);
        
        // Calculate typing delay based on chunk length
        const typingDelay = Math.min(1000 + (chunks[i].length * 50), 4000);
        await new Promise(resolve => setTimeout(resolve, typingDelay));
        
        setIsTyping(false);
        
        // Add the chunk as a new message
        const aiResponse: Message = {
          role: 'assistant',
          content: chunks[i],
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, aiResponse]);
        
        // Wait 1 second between chunks (except after the last one)
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      setIsLoading(false);
      
      // Fallback to mock AI response
      const mockContent = getMockAIResponse([userMessage]);
      const chunks = breakIntoChunks(mockContent);
      
      // Send chunks sequentially with delays
      for (let i = 0; i < chunks.length; i++) {
        setIsTyping(true);
        const typingDelay = Math.min(1000 + (chunks[i].length * 50), 4000);
        await new Promise(resolve => setTimeout(resolve, typingDelay));
        
        setIsTyping(false);
        const aiResponse: Message = {
          role: 'assistant',
          content: chunks[i],
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, aiResponse]);
        
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
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

    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { 
          messages: updatedMessages, 
          type: 'conversation',
          conversationPath: pathSelection,
          neurodiveritySettings: settings
        }
      });

      if (error) throw error;

      const content = typeof data?.content === 'string' ? data.content.trim() : '';
      if (!content) {
        throw new Error('Empty AI response');
      }

      // Break response into chunks
      const chunks = breakIntoChunks(content);
      
      setIsLoading(false);
      
      // Send chunks sequentially with delays
      for (let i = 0; i < chunks.length; i++) {
        setIsTyping(true);
        const typingDelay = Math.min(1000 + (chunks[i].length * 50), 4000);
        await new Promise(resolve => setTimeout(resolve, typingDelay));
        
        setIsTyping(false);
        const aiResponse: Message = {
          role: 'assistant',
          content: chunks[i],
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, aiResponse]);
        
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      setIsLoading(false);
      
      // Fallback to mock AI response
      const mockContent = getMockAIResponse(updatedMessages);
      const chunks = breakIntoChunks(mockContent);
      
      // Send chunks sequentially with delays
      for (let i = 0; i < chunks.length; i++) {
        setIsTyping(true);
        const typingDelay = Math.min(1000 + (chunks[i].length * 50), 4000);
        await new Promise(resolve => setTimeout(resolve, typingDelay));
        
        setIsTyping(false);
        const aiResponse: Message = {
          role: 'assistant',
          content: chunks[i],
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, aiResponse]);
        
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      toast({
        title: "Using offline mode",
        description: "Connected to local responses.",
      });
    }
  };

  const handleChatComplete = async () => {
    // Show processing state immediately
    setState('processing');
    setIsLoading(true);
    
    // Add minimum delay for better UX (show processing screen for at least 2 seconds)
    const minDelay = new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      // Ask AI to extract structured validation data from conversation
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { 
          messages, 
          type: 'extract_validation',
          conversationPath: 'validation'
        }
      });

      if (error) throw error;

      // AI should return structured ValidationData
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
    
    // If user hasn't filled profile before, show profile form
    if (!profile) {
      setState('profile');
    } else {
      // Generate results
      await generateResults(data);
    }
  };

  const handleValidationAdjust = () => {
    // Go back to chat to make adjustments
    setState('chat');
  };

  const generateResults = async (data: ValidationData) => {
    try {
      const { data: resultsData, error } = await supabase.functions.invoke('chat', {
        body: { messages, validationData: data, type: 'results' }
      });

      if (error) throw error;

      setResults(resultsData);
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

  if (state === 'landing') {
    return <LandingPrompt onSubmit={handleLandingSubmit} />;
  }

  if (state === 'chat') {
    return (
      <ChatInterface
        initialMessage={messages[0]?.content || ''}
        onComplete={handleChatComplete}
        messages={messages}
        onSendMessage={handleSendMessage}
        onBack={handleNewCheckIn}
        isLoading={isLoading || isTyping}
      />
    );
  }

  if (state === 'processing') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">Analyzing your conversation...</h2>
            <p className="text-muted-foreground">We're identifying patterns and preparing your personalized insights.</p>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'validation' && validationData) {
    return (
      <ValidationScreen
        initialData={validationData}
        onConfirm={handleValidationConfirm}
        onAdjust={handleValidationAdjust}
      />
    );
  }

  if (state === 'profile') {
    return <ProfileForm onSubmit={handleProfileSubmit} />;
  }

  if (state === 'results' && results) {
    return <ResultsDisplay results={results} onNewCheckIn={handleNewCheckIn} />;
  }

  return null;
};

export default Index;
