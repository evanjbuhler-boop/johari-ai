import { useState, useEffect } from 'react';
import LandingPrompt from '@/components/LandingPrompt';
import ChatInterface from '@/components/ChatInterface';
import ProfileForm from '@/components/ProfileForm';
import ResultsDisplay from '@/components/ResultsDisplay';
import { Message, UserProfile, CheckInResults } from '@/types/checkin';
import { supabase } from '@/integrations/supabase/client';
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

  const handleLandingSubmit = async (message: string) => {
    const userMessage: Message = { role: 'user', content: message };
    setMessages([userMessage]);
    setState('chat');

    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { messages: [userMessage], type: 'conversation' }
      });

      if (error) throw error;

      const aiResponse: Message = {
        role: 'assistant',
        content: data.content
      };
      setMessages([userMessage, aiResponse]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSendMessage = async (message: string) => {
    const userMessage: Message = { role: 'user', content: message };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { messages: updatedMessages, type: 'conversation' }
      });

      if (error) throw error;

      const aiResponse: Message = {
        role: 'assistant',
        content: data.content
      };
      setMessages([...updatedMessages, aiResponse]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleChatComplete = async () => {
    // If user hasn't filled profile before, show profile form
    if (!profile) {
      setState('profile');
    } else {
      // Otherwise, generate results with Claude
      try {
        const { data, error } = await supabase.functions.invoke('chat', {
          body: { messages, type: 'results' }
        });

        if (error) throw error;

        setResults(data);
        setState('results');
        
        // Save to localStorage
        const checkInData = {
          messages,
          results: data,
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
        toast({
          title: "Error",
          description: "Failed to generate results. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleProfileSubmit = async (userProfile: UserProfile) => {
    setProfile(userProfile);
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    
    // Generate results with Claude
    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { messages, type: 'results' }
      });

      if (error) throw error;

      setResults(data);
      setState('results');
      
      // Save to localStorage
      const checkInData = {
        messages,
        results: data,
        profile: userProfile,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem('lastCheckIn', JSON.stringify(checkInData));
      
      toast({
        title: "Profile saved",
        description: "Your profile has been created successfully.",
      });
    } catch (error) {
      console.error('Error generating results:', error);
      toast({
        title: "Error",
        description: "Failed to generate results. Please try again.",
        variant: "destructive"
      });
    }
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
        onBack={handleNewCheckIn}
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
