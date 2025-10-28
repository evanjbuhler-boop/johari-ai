import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { useChatSession } from '@/hooks/useChatSession';

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
  const [hasSavedConversation, setHasSavedConversation] = useState(false);
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [conversationStartTime, setConversationStartTime] = useState<number | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useNeurodiveritySettings();
  const { settings: therapySettings } = useTherapyApproach();
  const { currentSessionId, startSession, endSession } = useChatSession();

  // Check for preview mode in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    console.log('Checking for preview mode, URL params:', window.location.search);
    if (urlParams.get('preview') === 'results') {
      console.log('Preview mode detected, loading mock results');
      const mockResults: CheckInResults = {
        byline: "Navigating work pressure while managing perfectionism and self-doubt",
        whatsHappening: {
          summary: "You're caught in a cycle where the drive to perform perfectly is creating intense anxiety about making mistakes, which then makes it harder to focus and deliver the quality work you're capable of.",
          themes: ["Perfectionism", "Work Anxiety", "Self-Worth"],
          fullExplanation: "This pattern reflects high-functioning anxiety, where the mechanisms that once drove achievement have become sources of significant distress. The drive for perfection has shifted from being a useful tool to a psychological trap, where each task carries existential weight—as if a single mistake could fundamentally define one's worth. This creates an exhausting internal dynamic where self-value becomes contingent on flawless performance.\n\nNeurologically, the brain's threat detection system has learned to interpret imperfection as danger. When facing challenging work situations, the nervous system activates a fight-or-flight response typically reserved for physical threats. This floods the prefrontal cortex with stress hormones, impairing the very cognitive functions needed for complex work—narrowing thinking, reducing creativity, and creating rigidity. The result is a self-fulfilling prophecy where anxiety about performance actively undermines the ability to perform well.\n\nPerfectionism often develops as an adaptive strategy rooted in early experiences where worth became tied to achievement. Approval may have followed exceptional performance, while mistakes led to criticism or withdrawal of affection. Over time, these dynamics become internalized—creating an internal relationship where one simultaneously embodies both the demanding authority and the striving subordinate. This exhausting pattern makes rest feel dangerous rather than restorative, as it threatens the carefully maintained system of proving one's value through achievement.",
          citations: [
            { author: "Nolen-Hoeksema, S.", year: 2001, title: "Gender differences in depression" },
            { author: "Teasdale, J.D. et al.", year: 2002, title: "Metacognitive awareness and prevention of relapse in depression" }
          ]
        },
        quotes: [
          { text: "I feel like I'm always one mistake away from being found out", sentiment: "negative" },
          { text: "Even when I do well, I can't shake the feeling it wasn't good enough", sentiment: "negative" }
        ],
        reframing: {
          content: "Perfectionism may feel protective, but it creates a distorted feedback loop. Each time an achievement is dismissed as \"not good enough\" or attributed to luck, the brain is trained to overlook evidence of capability. This selective attention—focusing exclusively on flaws while filtering out successes—means decisions are being made based on incomplete information. The pattern strengthens neural pathways that detect threats while weakening those that recognize competence and safety.\n\nThe irony is that perfectionism, despite feeling like a high standard, may actually limit performance. Fear-based self-criticism activates threat states that narrow thinking, reduce creativity, and create rigidity. This contrasts sharply with curiosity-based approaches, which activate brain regions associated with exploration, flexible problem-solving, and resilience. Being kinder to oneself isn't about lowering standards—it's about creating the psychological conditions where those standards become achievable.\n\nThe internal voice that constantly anticipates failure isn't neutral—it actively shapes both perception and capability. Consider how this same anxiety would be addressed if it belonged to a respected colleague. The likely response wouldn't involve confirming their fears of inadequacy, but rather helping them contextualize setbacks within a larger pattern of competence. Self-compassion isn't self-indulgence; it's the practical foundation for sustainable performance.\n\n**Questions to consider:**\n• How would you respond to a colleague experiencing the same anxiety—and what would it mean to extend that same understanding to yourself?\n• What evidence of your capability are you filtering out by focusing exclusively on what's imperfect?\n• If treating yourself with more grace could improve your actual performance, what makes that feel threatening rather than practical?"
        },
        podcast: {
          title: "Unlocking Us with Brené Brown",
          host: "Brené Brown",
          episode: "The Gifts of Imperfection",
          duration: "40 min",
          description: "In this episode, Brené discusses the importance of embracing our imperfections and how they can lead to a more authentic life.",
          whyThisHelps: "This episode can help you understand that it's okay to feel imperfect and that embracing these feelings can lead to a more fulfilling life.",
          thumbnail: "https://via.placeholder.com/300x300?text=Podcast",
          urls: {
            spotify: "https://open.spotify.com/show/4P86ZzHf7EOlRG7do9LkKZ",
            applePodcasts: "https://podcasts.apple.com/us/podcast/unlocking-us-with-bren%C3%A9-brown/id1494350511"
          }
        },
        book: {
          title: "The Gifts of Imperfection",
          author: "Brené Brown",
          byline: "Let go of who you think you're supposed to be and embrace who you are",
          description: "In this deeply personal book, researcher and thought leader Brené Brown explores the psychology of releasing our definitions of an imperfect life and embracing our authentic selves. Through stories and research, she shows how courage, compassion, and connection can transform the way we live.",
          length: "137 pages / 3-hour read",
          whyThisHelps: "This book directly addresses the perfectionism and self-doubt you're experiencing, offering practical strategies to release these feelings of pressure and self-doubt.",
          coverImage: "https://via.placeholder.com/300x450?text=Book+Cover",
          purchaseUrl: "https://bookshop.org/books/the-gifts-of-imperfection"
        },
        exercise: {
          title: "Thought Record",
          description: "Identify and challenge negative automatic thoughts using structured CBT techniques.",
          duration: "10-15 minutes",
          whyHelps: "Structured reflection helps you examine thoughts objectively rather than accepting them at face value, reducing emotional intensity and creating space for more balanced perspectives.",
          steps: [
            {
              stepNumber: 1,
              title: "Identify the situation",
              content: "Describe what happened that triggered your thoughts. Be specific about time, place, and circumstances.",
              inputRequired: true,
              inputType: "textarea"
            },
            {
              stepNumber: 2,
              title: "Notice your emotions",
              content: "What emotions did you feel? Rate their intensity from 0-10.",
              inputRequired: true,
              inputType: "textarea"
            },
            {
              stepNumber: 3,
              title: "Catch your automatic thought",
              content: "What thought went through your mind? Write it exactly as you thought it.",
              inputRequired: true,
              inputType: "textarea"
            },
            {
              stepNumber: 4,
              title: "Find the evidence",
              content: "What evidence supports this thought? What evidence contradicts it?",
              inputRequired: true,
              inputType: "textarea"
            },
            {
              stepNumber: 5,
              title: "Generate an alternative",
              content: "What's a more balanced way to view this situation?",
              inputRequired: true,
              inputType: "textarea"
            }
          ]
        },
        story: {
          title: "The Starving Tigress",
          culturalOrigin: "Jataka Tales",
          content: "A prince was walking through a forest when he came upon a tigress, weak from hunger and desperate. She was so starved that she was about to eat her own newborn cubs to survive. The prince was overcome with compassion for both the mother and her young.\n\nAfter contemplating deeply, he made an extraordinary decision. He offered his own body to the tigress so she could eat and regain strength to care for her cubs. He climbed to a cliff above where she lay and threw himself down, sacrificing his life so that she and her cubs might live. This act of ultimate selflessness and compassion became one of the most powerful teachings in Buddhist tradition about the depths of love and sacrifice possible in the human heart.",
          whyThisMatters: "True compassion sometimes requires personal sacrifice, helping us see beyond our own immediate needs. In your situation, you're sacrificing your peace of mind to meet impossible standards—but what if the sacrifice should be of the perfectionism itself, rather than your wellbeing? This story reminds us that we're all struggling, and the greatest act of compassion can be toward ourselves."
        },
        patterns: [
          "Perfectionism driving anxiety",
          "Self-worth tied to performance",
          "Difficulty accepting mistakes"
        ]
      };
      console.log('Setting results and state to results');
      setResults(mockResults);
      setState('results');
      console.log('Preview mode setup complete');
    }
  }, []);

  // Load user profile from database if authenticated, otherwise check localStorage
  useEffect(() => {
    // Check for saved conversation
    const savedConversation = localStorage.getItem('savedConversation');
    setHasSavedConversation(!!savedConversation);
    
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
        
        // Check if there's a pending conversation to restore (from sign-in flow)
        const pendingConversation = localStorage.getItem('pendingConversation');
        if (pendingConversation) {
          const { messages: savedMessages, timestamp } = JSON.parse(pendingConversation);
          // Only restore if less than 30 minutes old
          if (Date.now() - timestamp < 30 * 60 * 1000) {
            setMessages(savedMessages);
            setState('chat');
            toast({
              title: "Welcome back!",
              description: "Continuing your conversation...",
            });
          }
          // Clear the pending conversation
          localStorage.removeItem('pendingConversation');
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
  }, [user, toast]);

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
    // Check if there's a saved conversation
    if (hasSavedConversation) {
      setPendingMessage(message);
      setShowOverwriteDialog(true);
      return;
    }
    
    // Proceed with normal submission
    startNewConversation(message);
  };
  
  const startNewConversation = async (message: string) => {
    const userMessage: Message = { role: 'user', content: message, timestamp: new Date().toISOString() };
    setMessages([userMessage]);
    setIsLoading(true);
    
    // Initialize conversation start time
    setConversationStartTime(Date.now());
    
    // Start tracking session if user is logged in
    if (user) {
      await startSession(therapySettings.approach, settings);
    }
    
    // Gentle fade transition to chat interface
    await new Promise(resolve => setTimeout(resolve, 400));
    setState('chat');

    try {
      console.log('🌐 API call initiated - handleLandingSubmit');
      console.log('🧩 Neurodiversity settings sent (landing):', settings);
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
      
      // Collect all messages for potential storage
      const allMessages: Message[] = [userMessage];
      
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
        allMessages.push(aiResponse);
        setMessages(prev => [...prev, aiResponse]);
        
        // Wait 1 second between chunks (except after the last one)
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Turn off loading indicator after ALL chunks are sent
      setIsLoading(false);

      // Prompt user to sign in after first message
      if (!user) {
        // Store conversation state before redirecting
        localStorage.setItem('pendingConversation', JSON.stringify({
          messages: allMessages,
          timestamp: Date.now()
        }));
        
        await new Promise(resolve => setTimeout(resolve, 800));
        toast({
          title: "Sign in to continue",
          description: "Create an account to save your progress and access your library",
        });
        await new Promise(resolve => setTimeout(resolve, 1500));
        navigate('/auth');
      }
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
      console.log('🧩 Neurodiversity settings sent (chat):', settings);
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
    // Clear any saved conversation since we're completing it
    localStorage.removeItem('savedConversation');
    setHasSavedConversation(false);
    
    // Show processing state immediately with enhanced loading screen
    setProcessingType('validation');
    setState('processing');
    setIsLoading(true);
    
    // Add minimum delay for better UX (show processing screen for at least 2.5 seconds)
    const minDelay = new Promise(resolve => setTimeout(resolve, 2500));
    
    try {
      // Ask AI to extract structured validation data from conversation
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { 
          messages, 
          type: 'extract_validation',
          conversationPath,
          therapyApproach: therapySettings.approach
        }
      });

      if (error) throw error;

      // AI should return structured ValidationData with enhanced fields
      const extracted: ValidationData = data || extractValidationData(messages);
      
      // Wait for minimum delay, then add smooth fade transition
      await minDelay;
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setValidationData(extracted);
      setState('validation');
    } catch (error) {
      console.error('Error extracting validation data:', error);
      // Fallback to keyword extraction
      const extracted = extractValidationData(messages);
      
      // Wait for minimum delay, then add smooth fade transition
      await minDelay;
      await new Promise(resolve => setTimeout(resolve, 300));
      
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
        body: { 
          messages, 
          validationData: data, 
          type: 'results',
          userId: user?.id  // Pass user ID for exercise selection
        }
      });

      if (error) throw error;

      console.log('✅ Results data received:', JSON.stringify(resultsData, null, 2));
      console.log('📚 Has podcast?', !!resultsData?.podcast);
      console.log('📖 Has book?', !!resultsData?.book);
      console.log('🧘 Has exercise?', !!resultsData?.exercise);
      
      setResults(resultsData);
      setIsLoading(false);
      setState('results');
      
      // Mark session as completed with message count
      if (currentSessionId) {
        await endSession(currentSessionId, true, messages.length);
      }
      
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
      
      // Mark session as completed (even in offline mode) with message count
      if (currentSessionId) {
        await endSession(currentSessionId, true, messages.length);
      }
      
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
    // Clear any saved conversation
    localStorage.removeItem('savedConversation');
    setHasSavedConversation(false);
  };

  const handlePause = () => {
    // Mark session as incomplete (paused) with current message count
    if (currentSessionId) {
      endSession(currentSessionId, false, messages.length);
    }
    
    // Save current conversation state
    localStorage.setItem('savedConversation', JSON.stringify({
      messages,
      conversationPath,
      timestamp: Date.now()
    }));
    setHasSavedConversation(true);
    setState('landing');
    toast({
      title: "Conversation saved",
      description: "You can resume this conversation anytime",
    });
  };

  const handleResume = () => {
    const savedConversation = localStorage.getItem('savedConversation');
    if (savedConversation) {
      const { messages: savedMessages, conversationPath: savedPath } = JSON.parse(savedConversation);
      setMessages(savedMessages);
      setConversationPath(savedPath);
      setState('chat');
      toast({
        title: "Conversation resumed",
        description: "Welcome back! Pick up where you left off",
      });
    }
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
        
        {/* Overwrite conversation confirmation dialog */}
        <AlertDialog open={showOverwriteDialog} onOpenChange={setShowOverwriteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Start new conversation?</AlertDialogTitle>
              <AlertDialogDescription>
                You have a saved conversation that will be permanently deleted if you start a new one. 
                Would you like to continue or resume your previous conversation instead?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPendingMessage(null)}>
                Cancel
              </AlertDialogCancel>
              <Button
                variant="outline"
                onClick={() => {
                  setShowOverwriteDialog(false);
                  setPendingMessage(null);
                  handleResume();
                }}
              >
                Resume Previous
              </Button>
              <AlertDialogAction
                onClick={() => {
                  setShowOverwriteDialog(false);
                  if (pendingMessage) {
                    // Clear saved conversation and start new one
                    localStorage.removeItem('savedConversation');
                    setHasSavedConversation(false);
                    startNewConversation(pendingMessage);
                    setPendingMessage(null);
                  }
                }}
              >
                Start New
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        {/* Info button in bottom left */}
        <Button
          onClick={() => setWelcomeModalOpen(true)}
          size="icon"
          variant="ghost"
          className="fixed bottom-6 left-6 h-10 w-10 rounded-xl hover:bg-white/20 text-white backdrop-blur-md border border-white/30 shadow-sm transition-all hover:scale-105 active:scale-95 z-50"
        >
          <Info className="h-4 w-4" />
        </Button>
        
        <LandingPrompt 
          onSubmit={handleLandingSubmit}
          onResume={handleResume}
          hasSavedConversation={hasSavedConversation}
        />
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
          onPause={handlePause}
          isLoading={isLoading}
          onVentingModeSelected={handleVentingModeSelected}
          conversationStartTime={conversationStartTime || Date.now()}
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
    // Extract session theme from validation data themes or first main stressor
    const sessionTheme = validationData?.mainStressors?.[0] 
      || results.whatsHappening?.themes?.[0] 
      || 'your reflections';
    
    return (
      <AppLayout showBackground={false} hideSettingsIcons>
        <ResultsDisplay 
          results={results} 
          onNewCheckIn={handleNewCheckIn} 
          sessionId={currentSessionId || undefined}
          sessionTheme={sessionTheme}
        />
      </AppLayout>
    );
  }

  return null;
};

export default Index;
