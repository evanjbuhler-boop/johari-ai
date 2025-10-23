import { useState, useEffect } from 'react';
import LandingPrompt from '@/components/LandingPrompt';
import ChatInterface from '@/components/ChatInterface';
import ProfileForm from '@/components/ProfileForm';
import ResultsDisplay from '@/components/ResultsDisplay';
import { Message, UserProfile, CheckInResults } from '@/types/checkin';
import { getMockAIResponse, generateMockResults } from '@/utils/mockAI';
import { useToast } from '@/hooks/use-toast';

type AppState = 'landing' | 'chat' | 'profile' | 'results';

const Index = () => {
  const [state, setState] = useState<AppState>('landing');
  const [messages, setMessages] = useState<Message[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [results, setResults] = useState<CheckInResults | null>(null);
  const { toast } = useToast();

  // Check if user has completed profile before
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }
  }, []);

  const handleLandingSubmit = (message: string) => {
    const userMessage: Message = { role: 'user', content: message };
    const aiResponse: Message = { 
      role: 'assistant', 
      content: getMockAIResponse([userMessage]) 
    };
    
    setMessages([userMessage, aiResponse]);
    setState('chat');
  };

  const handleSendMessage = (message: string) => {
    const userMessage: Message = { role: 'user', content: message };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    // Simulate AI thinking
    setTimeout(() => {
      const aiResponse: Message = { 
        role: 'assistant', 
        content: getMockAIResponse(updatedMessages) 
      };
      setMessages([...updatedMessages, aiResponse]);
    }, 1000);
  };

  const handleChatComplete = () => {
    // If user hasn't filled profile before, show profile form
    if (!profile) {
      setState('profile');
    } else {
      // Otherwise, go straight to results
      const mockResults = generateMockResults(messages);
      setResults(mockResults);
      setState('results');
      
      // Save to localStorage (replace with actual API call)
      const checkInData = {
        messages,
        results: mockResults,
        profile,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem('lastCheckIn', JSON.stringify(checkInData));
      
      toast({
        title: "Check-in saved",
        description: "Your emotional check-in has been recorded.",
      });
    }
  };

  const handleProfileSubmit = (userProfile: UserProfile) => {
    setProfile(userProfile);
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    
    const mockResults = generateMockResults(messages);
    setResults(mockResults);
    setState('results');
    
    // Save to localStorage (replace with actual API call)
    const checkInData = {
      messages,
      results: mockResults,
      profile: userProfile,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('lastCheckIn', JSON.stringify(checkInData));
    
    toast({
      title: "Profile saved",
      description: "Your profile has been created successfully.",
    });
  };

  const handleNewCheckIn = () => {
    setMessages([]);
    setResults(null);
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
