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

type AppState = 'landing' | 'chat' | 'validation' | 'profile' | 'results';

const Index = () => {
  const [state, setState] = useState<AppState>('landing');
  const [messages, setMessages] = useState<Message[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [results, setResults] = useState<CheckInResults | null>(null);
  const [validationData, setValidationData] = useState<ValidationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Check if user has completed profile before
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }
  }, []);

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

  const handleLandingSubmit = async (message: string) => {
    const userMessage: Message = { role: 'user', content: message };
    setMessages([userMessage]);
    setState('chat');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { messages: [userMessage], type: 'conversation' }
      });

      if (error) throw error;

      const content = typeof data?.content === 'string' ? data.content.trim() : '';
      if (!content) {
        throw new Error('Empty AI response');
      }

      const aiResponse: Message = {
        role: 'assistant',
        content,
      };
      setMessages([userMessage, aiResponse]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      // Fallback to mock AI response
      const mockContent = getMockAIResponse([userMessage]);
      const aiResponse: Message = {
        role: 'assistant',
        content: mockContent
      };
      setMessages([userMessage, aiResponse]);
      toast({
        title: "Using offline mode",
        description: "Connected to local responses.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (message: string, pathSelection?: string) => {
    const userMessage: Message = { role: 'user', content: message };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { 
          messages: updatedMessages, 
          type: 'conversation',
          conversationPath: pathSelection 
        }
      });

      if (error) throw error;

      const content = typeof data?.content === 'string' ? data.content.trim() : '';
      if (!content) {
        throw new Error('Empty AI response');
      }

      const aiResponse: Message = {
        role: 'assistant',
        content,
      };
      setMessages([...updatedMessages, aiResponse]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      // Fallback to mock AI response
      const mockContent = getMockAIResponse(updatedMessages);
      const aiResponse: Message = {
        role: 'assistant',
        content: mockContent
      };
      setMessages([...updatedMessages, aiResponse]);
      toast({
        title: "Using offline mode",
        description: "Connected to local responses.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatComplete = async () => {
    setIsLoading(true);
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
      setValidationData(extracted);
      setState('validation');
    } catch (error) {
      console.error('Error extracting validation data:', error);
      // Fallback to keyword extraction
      const extracted = extractValidationData(messages);
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
    toast({
      title: "Make your adjustments",
      description: "Update any fields that don't feel right.",
    });
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
        isLoading={isLoading}
      />
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
