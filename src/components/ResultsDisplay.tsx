import { CheckInResults, SavedItem } from '@/types/checkin';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bookmark, BookmarkCheck, ChevronDown, ChevronUp, Play, BookOpen, Share2, Library, ExternalLink, Music, ThumbsUp, ThumbsDown, Maximize2, Minimize2, Star } from 'lucide-react';
import confetti from 'canvas-confetti';
import ErrorBoundary from '@/components/ErrorBoundary';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import GuidedExercise from '@/components/GuidedExercise';
import RatingFeedbackDialog from '@/components/RatingFeedbackDialog';
import ShareModal from '@/components/ShareModal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import StageProgressBar from '@/components/StageProgressBar';
import podcastPlaceholder from '@/assets/podcast-placeholder.png';
import bookPlaceholder from '@/assets/book-placeholder.png';
import exercisePlaceholder from '@/assets/exercise-placeholder.png';
import InsightControls from '@/components/InsightControls';

interface ResultsDisplayProps {
  results: CheckInResults;
  onNewCheckIn: () => void;
  sessionId?: string; // Add sessionId for rating tracking
  sessionTheme?: string; // Add session theme for personalization
  messages?: any[]; // Add messages for regeneration
  userProfile?: any; // Add user profile for tone preference
  onResultsUpdate?: (newResults: CheckInResults) => void; // Add callback for updated results
  onControlsOpenChange?: (isOpen: boolean) => void; // Add callback for controls open state
}

const ResultsDisplay = ({ results, onNewCheckIn, sessionId, sessionTheme, messages = [], userProfile, onResultsUpdate, onControlsOpenChange }: ResultsDisplayProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Debug: Log what ResultsDisplay receives
  console.log('🔍 ResultsDisplay received results:', results);
  console.log('🔍 Podcast URLs received:', results.podcast?.urls);
  console.log('🔍 Book URLs received:', results.book?.urls);
  
  // Helper function to convert markdown bold syntax to HTML
  const renderBoldText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2);
        return <strong key={index} className="font-semibold">{boldText}</strong>;
      }
      return part;
    });
  };
  
  const [whatsHappeningExpanded, setWhatsHappeningExpanded] = useState(true); // Auto-expand first section
  const [reframingExpanded, setReframingExpanded] = useState(false);
  const [storyExpanded, setStoryExpanded] = useState(false);
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());
  const [ratings, setRatings] = useState<Record<string, 'up' | 'down'>>({});
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [feedbackDialog, setFeedbackDialog] = useState<{
    open: boolean;
    type: 'podcast' | 'book' | 'exercise' | 'story' | 'research';
    title: string;
  } | null>(null);
  const [shareModal, setShareModal] = useState<{
    open: boolean;
    content: {
      emoji: string;
      title: string;
      author?: string;
      text: string;
      link: string;
      source: string;
    };
  } | null>(null);
  
  const [finalFeedbackOpen, setFinalFeedbackOpen] = useState(false);
  const [overallRating, setOverallRating] = useState<number | null>(null);
  
  // Generate a session ID if not provided (for testing)
  const currentSessionId = sessionId || `session-${Date.now()}`;

  // Expand/collapse all functionality
  const allExpanded = whatsHappeningExpanded && reframingExpanded && storyExpanded;
  
  const handleExpandAll = () => {
    const shouldExpand = !allExpanded;
    setWhatsHappeningExpanded(shouldExpand);
    setReframingExpanded(shouldExpand);
    setStoryExpanded(shouldExpand);
  };

  // Confetti effect for high ratings
  const triggerConfetti = () => {
    const count = 50;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 999,
    };

    function fire(particleRatio: number, opts: any) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });

    fire(0.2, {
      spread: 60,
    });

    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  };

  // Handle regenerated recommendations
  const handleRegenerated = (newRecommendations: any) => {
    console.log('Received regenerated data:', newRecommendations);
    
    const updatedResults: CheckInResults = {
      ...results,
      whatsHappening: {
        ...results.whatsHappening,
        byline: newRecommendations.whatsHappeningByline || results.whatsHappening.byline,
        fullExplanation: newRecommendations.whatsHappening || results.whatsHappening.fullExplanation,
      },
      theTheory: results.theTheory ? {
        ...results.theTheory,
        byline: newRecommendations.theTheoryByline || results.theTheory.byline,
        content: newRecommendations.theTheory || results.theTheory.content
      } : undefined,
      reframing: {
        content: newRecommendations.reframing || results.reframing?.content || ''
      },
      story: results.story ? {
        ...results.story,
        whyThisMatters: newRecommendations.storyWhyMatters || results.story.whyThisMatters
      } : undefined,
      podcast: newRecommendations.podcast || results.podcast,
      book: newRecommendations.book || results.book,
      cbt: results.cbt,
      reflection: results.reflection,
      patterns: results.patterns,
      quotes: results.quotes
    };
    
    console.log('Updated results:', updatedResults);
    
    if (onResultsUpdate) {
      onResultsUpdate(updatedResults);
    }
  };

  // Fetch saved items from database
  useEffect(() => {
    const fetchSavedItems = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('saved_items')
        .select('id, item_type, title')
        .eq('user_id', user.id);
      
      if (!error && data) {
        setSavedItems(new Set(data.map(item => `${item.item_type}-${item.title}`)));
      }
    };

    fetchSavedItems();
  }, [user]);

  // Fetch ratings from database
  useEffect(() => {
    const fetchRatings = async () => {
      if (!user || !currentSessionId) return;
      
      const { data, error } = await supabase
        .from('recommendation_ratings')
        .select('recommendation_type, recommendation_title, rating')
        .eq('user_id', user.id)
        .eq('session_id', currentSessionId);
      
      if (!error && data) {
        const ratingsMap: Record<string, 'up' | 'down'> = {};
        data.forEach(item => {
          // Use title-based keys for What's Happening and Different Lens
          if (item.recommendation_title === "What's Happening") {
            ratingsMap['whats-happening'] = item.rating as 'up' | 'down';
          } else if (item.recommendation_title === "A Different Lens") {
            ratingsMap['reframing'] = item.rating as 'up' | 'down';
          } else {
            ratingsMap[item.recommendation_type] = item.rating as 'up' | 'down';
          }
        });
        setRatings(ratingsMap);
      }
    };

    fetchRatings();
  }, [user, currentSessionId]);

  const isSaved = (id: string) => savedItems.has(id);

  // Rating functionality
  const handleRating = async (
    type: 'podcast' | 'book' | 'exercise' | 'story' | 'research',
    title: string,
    rating: 'up' | 'down'
  ) => {
    if (!user) {
      toast.error('Please sign in to rate recommendations');
      navigate('/auth');
      return;
    }

    const currentRating = ratings[type];
    const newRating = currentRating === rating ? null : rating;
    
    // If downvoting (and not un-downvoting), show feedback dialog
    if (newRating === 'down') {
      setFeedbackDialog({ open: true, type, title });
      return;
    }

    // For upvotes or removing ratings, proceed directly
    await submitRating(type, title, newRating, '', undefined);
  };

  const submitRating = async (
    type: 'podcast' | 'book' | 'exercise' | 'story' | 'research',
    title: string,
    rating: 'up' | 'down' | null,
    feedbackReason?: string,
    quickReason?: string
  ) => {
    if (!user) return;

    // Determine the rating key for local state
    let ratingKey: string = type;
    if (title === "What's Happening") {
      ratingKey = 'whats-happening';
    } else if (title === "A Different Lens") {
      ratingKey = 'reframing';
    }

    // Optimistic update
    const currentRating = ratings[ratingKey];
    
    setRatings(prev => {
      const updated = { ...prev };
      if (rating) {
        updated[ratingKey] = rating;
      } else {
        delete updated[ratingKey];
      }
      return updated;
    });

    try {
      if (rating === null) {
        // Delete rating
        await supabase
          .from('recommendation_ratings')
          .delete()
          .eq('user_id', user.id)
          .eq('session_id', currentSessionId)
          .eq('recommendation_type', type)
          .eq('recommendation_title', title);
        toast.success('Rating removed');
      } else {
        // Fetch user profile for ML context
        const { data: profileData } = await supabase
          .from('profiles')
          .select('age, location, life_stage')
          .eq('id', user.id)
          .single();

        // Upsert rating with rich context
        await supabase
          .from('recommendation_ratings')
          .upsert({
            user_id: user.id,
            session_id: currentSessionId,
            recommendation_type: type,
            recommendation_title: title,
            rating: rating,
            feedback_reason: feedbackReason || null,
            session_theme: sessionTheme || null,
            user_profile_context: profileData ? {
              age: profileData.age,
              location: profileData.location,
              life_stage: profileData.life_stage,
              quick_reason: quickReason || null,
              timestamp: new Date().toISOString()
            } : null,
          }, {
            onConflict: 'user_id,session_id,recommendation_type'
          });
        
        if (rating === 'up') {
          toast.success('👍 Thanks for your feedback!');
        } else {
          toast.success('👎 Thanks for helping us improve!');
        }
      }
    } catch (error) {
      // Revert optimistic update
      setRatings(prev => {
        const reverted = { ...prev };
        if (currentRating) {
          reverted[ratingKey] = currentRating;
        } else {
          delete reverted[ratingKey];
        }
        return reverted;
      });
      toast.error('Failed to save rating');
      console.error('Rating error:', error);
    }
  };

  const handleFeedbackSubmit = (feedbackReason: string, quickReason?: string) => {
    if (!feedbackDialog) return;
    submitRating(
      feedbackDialog.type, 
      feedbackDialog.title, 
      'down', 
      feedbackReason, 
      quickReason
    );
    setFeedbackDialog(null);
  };

  const generatePreview = (type: 'podcast' | 'book' | 'exercise' | 'story' | 'research', title: string, content: any): string => {
    if (type === 'podcast' && results.podcast) {
      const desc = results.podcast.description.slice(0, 120);
      const why = results.podcast.whyThisHelps.slice(0, 120);
      return `${desc}${desc.length === 120 ? '...' : ''} ${why}${why.length === 120 ? '...' : ''}`;
    } else if (type === 'book' && results.book) {
      const desc = results.book.description.slice(0, 120);
      const why = results.book.whyThisHelps.slice(0, 120);
      return `${desc}${desc.length === 120 ? '...' : ''} ${why}${why.length === 120 ? '...' : ''}`;
    } else if (type === 'exercise' && results.exercise) {
      const desc = results.exercise.description;
      const stepsPreview = results.exercise.steps.length > 0 
        ? ` It includes ${results.exercise.steps.length} guided steps.` 
        : '';
      return desc + stepsPreview;
    } else if (type === 'story') {
      if (title === "What's Happening" && results.whatsHappening) {
        return results.whatsHappening.summary.slice(0, 200) + (results.whatsHappening.summary.length > 200 ? '...' : '');
      } else if (title === "A Different Lens" && results.reframing) {
        return results.reframing.content.slice(0, 200) + (results.reframing.content.length > 200 ? '...' : '');
      } else if (results.story) {
        const why = results.story.whyThisMatters || '';
        return why.slice(0, 200) + (why.length > 200 ? '...' : '');
      }
    }
    return '';
  };

  const toggleSave = async (id: string, type: 'podcast' | 'book' | 'exercise' | 'story' | 'research', title: string, subtitle: string | undefined, content: any) => {
    if (!user) {
      toast.error('Please sign in to save items');
      navigate('/auth');
      return;
    }

    if (isSaved(id)) {
      // Remove from database
      const { error } = await supabase
        .from('saved_items')
        .delete()
        .eq('user_id', user.id)
        .eq('item_type', type)
        .eq('title', title);
      
      if (!error) {
        setSavedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
        toast.success('Removed from library');
      } else {
        toast.error('Failed to remove item');
      }
    } else {
      // Add to database
      const itemData: any = {
        user_id: user.id,
        item_type: type,
        title,
        description: subtitle || '',
        preview: generatePreview(type, title, content),
      };

      // Add type-specific fields
      if (type === 'podcast' && results.podcast) {
        itemData.podcast_host = results.podcast.host;
        itemData.podcast_episode = results.podcast.episode;
        itemData.podcast_duration = results.podcast.duration;
        itemData.podcast_why_helps = results.podcast.whyThisHelps;
        itemData.podcast_thumbnail = results.podcast.thumbnail;
        itemData.podcast_urls = results.podcast.urls;
      } else if (type === 'book' && results.book) {
        itemData.book_author = results.book.author;
        itemData.book_byline = results.book.byline;
        itemData.book_length = results.book.length;
        itemData.book_why_helps = results.book.whyThisHelps;
        itemData.book_cover_image = results.book.coverImage;
        itemData.book_sample_url = results.book.sampleUrl;
        itemData.book_purchase_url = results.book.purchaseUrl;
      } else if (type === 'exercise' && results.exercise) {
        itemData.exercise_duration = results.exercise.duration;
        itemData.exercise_steps = results.exercise.steps;
      } else if (type === 'story') {
        itemData.story_content = typeof content === 'string' ? content : JSON.stringify(content);
        itemData.story_why_matters = results.story?.whyThisMatters || '';
      }

      const { error } = await supabase
        .from('saved_items')
        .insert([itemData]);
      
      if (!error) {
        setSavedItems(prev => new Set(prev).add(id));
        toast.success('Saved to library');
      } else {
        console.error('Save error:', error);
        toast.error('Failed to save item');
      }
    }
  };

  const addUTMParams = (url: string, source: string = 'johari', medium: string = 'recs') => {
    // Do not append UTM params to Spotify or Apple Podcasts links to avoid redirect quirks
    if (/open\.spotify\.com|podcasts\.apple\.com/.test(url)) {
      return url;
    }
    const utmParams = `utm_source=${source}&utm_medium=${medium}&utm_campaign=${currentSessionId}`;
    return url.includes('?') ? `${url}&${utmParams}` : `${url}?${utmParams}`;
  };


  // URL validation helper
  const isValidExternalUrl = (url?: string): boolean => {
    if (!url) return false;
    const raw = String(url).trim().toLowerCase();
    // Guard against AI placeholders and common placeholder patterns
    const placeholderPatterns = [
      'url', 'link', '...', 'example', 'placeholder', 'test',
      '/episode/example', '/dp/example', 'your-', 'insert-'
    ];
    if (placeholderPatterns.some(pattern => raw.includes(pattern))) return false;
    
    try {
      const u = new URL(url);
      const isHttp = u.protocol === 'http:' || u.protocol === 'https:';
      if (!isHttp) return false;
      // Treat obvious path placeholders as invalid
      const path = u.pathname || '';
      if (path.includes('/...') || path.endsWith('...') || path.includes('/example')) return false;
      // Check if hostname is just "example.com" or similar
      if (u.hostname.includes('example.')) return false;
      return true;
    } catch {
      return false;
    }
  };
  const buildPodcastSearchUrl = (platform: 'spotify' | 'apple') => {
    const q = encodeURIComponent(`${results.podcast?.title || ''} ${results.podcast?.host || ''} ${results.podcast?.episode || ''}`.trim());
    return platform === 'apple'
      ? `https://podcasts.apple.com/us/search?term=${q}`
      : `https://open.spotify.com/search/${q}`;
  };

  const buildBookSearchUrl = (store: 'bookshop' | 'amazon') => {
    const q = encodeURIComponent(`${results.book?.title || ''} ${results.book?.author || ''}`.trim());
    return store === 'amazon'
      ? `https://www.amazon.com/s?k=${q}`
      : `https://bookshop.org/search?keywords=${q}`;
  };

  // Get validated image source with fallback to placeholder
  const getValidatedImageSrc = (aiUrl: string | undefined, placeholder: string): string => {
    if (isValidExternalUrl(aiUrl)) {
      return aiUrl!;
    }
    return placeholder;
  };

  // Helper function to open external links with fallback
  const openLinkWithFallback = async (primaryUrl: string, fallbackUrl: string, linkName: string) => {
    if (isValidExternalUrl(primaryUrl)) {
      const url = addUTMParams(primaryUrl);
      window.open(url, '_blank', 'noopener noreferrer');
      return;
    }

    if (isValidExternalUrl(fallbackUrl) && fallbackUrl !== primaryUrl) {
      const url = addUTMParams(fallbackUrl);
      window.open(url, '_blank', 'noopener noreferrer');
      return;
    }

    console.warn(`Invalid ${linkName}. primary="${primaryUrl}" fallback="${fallbackUrl}"`);
    toast.error(`${linkName} isn't available yet. We'll fix the link soon.`);
  };

  const handlePodcastPlay = async (platform: 'spotify' | 'apple' | 'universal' = 'spotify') => {
    if (!results.podcast) return;
    
    console.log('🎧 Opening podcast:', platform);
    console.log('🎧 Full podcast object:', results.podcast);
    console.log('🎧 Podcast urls object:', results.podcast.urls);
    console.log('🎧 Spotify URL:', results.podcast.urls?.spotify);
    console.log('🎧 Apple URL:', results.podcast.urls?.applePodcasts);
    
    let primaryUrl: string = '';
    let fallbackUrl: string = '';
    let linkName = '';
    
    if (platform === 'spotify') {
      primaryUrl = results.podcast.urls?.spotify || '';
      const directUrl = results.podcast.urls?.direct || '';
      fallbackUrl = isValidExternalUrl(directUrl) ? directUrl : buildPodcastSearchUrl('spotify');
      linkName = 'Spotify link';
    } else if (platform === 'apple') {
      primaryUrl = results.podcast.urls?.applePodcasts || '';
      const spotifyUrl = results.podcast.urls?.spotify || '';
      const directUrl = results.podcast.urls?.direct || '';
      fallbackUrl = isValidExternalUrl(spotifyUrl) ? spotifyUrl : (isValidExternalUrl(directUrl) ? directUrl : buildPodcastSearchUrl('apple'));
      linkName = 'Apple Podcasts link';
    } else {
      primaryUrl = results.podcast.urls?.direct || results.podcast.urls?.spotify || '';
      const spotifyUrl = results.podcast.urls?.spotify || '';
      fallbackUrl = isValidExternalUrl(spotifyUrl) ? spotifyUrl : buildPodcastSearchUrl('spotify');
      linkName = 'Podcast link';
    }
    
    console.log('🎧 Using URL:', primaryUrl, 'fallback:', fallbackUrl);
    await openLinkWithFallback(primaryUrl, fallbackUrl, linkName);
  };

  const handleBookRead = () => {
    const url = results.book?.sampleUrl;
    if (isValidExternalUrl(url)) {
      window.open(addUTMParams(url!), '_blank', 'noopener noreferrer');
    } else {
      toast.error('Sample link is not available yet.');
    }
  };

  const handleBookPurchase = async (store: 'bookshop' | 'bn' | 'amazon' = 'bookshop') => {
    if (!results.book) return;
    
    console.log('📚 Opening book:', store, results.book.urls);
    
    let primaryUrl: string = '';
    let fallbackUrl: string = '';
    let storeName = '';
    
    // Use the specific store URL from urls object if available
    if (store === 'bookshop') {
      primaryUrl = results.book.urls?.bookshop || results.book.purchaseUrl || '';
      fallbackUrl = buildBookSearchUrl('bookshop');
      storeName = 'Bookshop.org';
    } else if (store === 'bn') {
      primaryUrl = results.book.urls?.barnesNoble || results.book.purchaseUrl || '';
      const bookshopUrl = results.book.urls?.bookshop || '';
      fallbackUrl = isValidExternalUrl(bookshopUrl) ? bookshopUrl : buildBookSearchUrl('bookshop');
      storeName = 'Barnes & Noble';
    } else if (store === 'amazon') {
      primaryUrl = results.book.urls?.amazon || results.book.purchaseUrl || '';
      fallbackUrl = buildBookSearchUrl('amazon');
      storeName = 'Amazon';
    }
    
    console.log('📚 Using URL:', primaryUrl, 'fallback:', fallbackUrl);
    await openLinkWithFallback(primaryUrl, fallbackUrl, `${storeName} link`);
  };

  const getSpotifyEmbedUrl = (spotifyUrl: string | undefined): string | null => {
    if (!spotifyUrl) return null;
    
    // Convert Spotify URL to embed format
    // Example: https://open.spotify.com/episode/EXAMPLE -> https://open.spotify.com/embed/episode/EXAMPLE
    try {
      const url = new URL(spotifyUrl);
      if (url.hostname === 'open.spotify.com') {
        return `https://open.spotify.com/embed${url.pathname}`;
      }
    } catch {
      return null;
    }
    return null;
  };

  const getGoogleBooksEmbedUrl = (isbn: string | undefined): string | null => {
    if (!isbn) return null;
    return `https://books.google.com/books?isbn=${isbn}&printsec=frontcover&output=embed`;
  };

  const handleShare = (
    type: 'podcast' | 'book' | 'exercise',
    title: string,
    content: {
      author?: string;
      text: string;
      link: string;
    }
  ) => {
    const emojiMap = {
      podcast: '🎙️',
      book: '📚',
      exercise: '✨',
    };

    const sourceMap = {
      podcast: 'Listen section',
      book: 'Read section',
      exercise: 'Practice section',
    };

    setShareModal({
      open: true,
      content: {
        emoji: emojiMap[type],
        title,
        author: content.author,
        text: content.text,
        link: content.link,
        source: sourceMap[type],
      },
    });
  };

  return (
    <div className="relative min-h-screen pb-32 overflow-hidden">
      {/* Flowing gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-500 -z-10"></div>
      
      {/* Wave overlays */}
      <div className="fixed inset-0 bg-gradient-to-tl from-transparent via-violet-400/30 to-purple-300/40 opacity-60 -z-10" style={{ clipPath: 'ellipse(80% 60% at 20% 40%)' }}></div>
      <div className="fixed inset-0 bg-gradient-to-br from-pink-300/30 via-transparent to-indigo-400/30 opacity-50 -z-10" style={{ clipPath: 'ellipse(70% 80% at 80% 60%)' }}></div>
      
      {/* Soft blur orbs */}
      <div className="fixed top-0 right-0 w-96 h-96 rounded-full bg-violet-400 blur-3xl opacity-20 -z-10"></div>
      <div className="fixed bottom-0 left-0 w-80 h-80 rounded-full bg-pink-400 blur-3xl opacity-15 -z-10"></div>
      
      {/* Header */}
      <header className="border-b border-white/10 bg-white/10 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
        </div>
      </header>

      <div className={`max-w-4xl mx-auto p-4 md:p-6 py-8 space-y-6 transition-all duration-500`}>
        
        {/* Controls Row */}
        <div className="flex justify-between items-center mb-2 gap-3">
          {/* Insight Controls Button (Left) */}
          {user && messages.length > 0 && (
            <InsightControls
              value={(userProfile?.insight_tone as any) || 'clinical'}
              onRegenerating={setIsRegenerating}
              onRegenerated={handleRegenerated}
              messages={messages}
              onOpenChange={onControlsOpenChange}
            />
          )}
          
          {/* Expand/Collapse All Button (Right) */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExpandAll}
            className="gap-2 group relative overflow-hidden bg-gradient-to-r from-primary/20 to-accent/20 hover:from-primary/30 hover:to-accent/30 border border-primary/30 text-white font-medium transition-all duration-300 hover:scale-105"
          >
            <div className={`transition-transform duration-300 ${allExpanded ? 'rotate-180' : ''}`}>
              {allExpanded ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </div>
            <span className="relative z-10">
              {allExpanded ? 'Collapse All' : 'Expand All'}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Button>
        </div>

        {/* Loading overlay for regeneration */}
        {isRegenerating && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-card p-8 rounded-lg shadow-lg text-center space-y-4">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
              <p className="text-lg font-medium">Regenerating insights...</p>
            </div>
          </div>
        )}
        
        {/* What's Happening Section */}
        <ErrorBoundary>
        <Card className="p-8 md:p-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl">
          <div className="flex items-center justify-between gap-4 mb-6">
            <button
              onClick={() => setWhatsHappeningExpanded(!whatsHappeningExpanded)}
              className="flex items-center gap-4 text-left"
            >
              <span className="text-3xl">🔍</span>
              <h2 className="text-2xl md:text-3xl font-medium text-foreground">What's Happening</h2>
              {whatsHappeningExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleSave('whats-happening', 'story', "What's Happening", undefined, results.whatsHappening)}
            >
              {isSaved('whats-happening') ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </Button>
          </div>

          <div className="mt-6 space-y-4">
            <p className="text-lg md:text-xl text-foreground/90 leading-relaxed max-w-3xl">
              {renderBoldText(results.whatsHappening.byline || results.whatsHappening.summary)}
            </p>
            
            {/* Theme badges */}
            {results.whatsHappening.themes && results.whatsHappening.themes.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {results.whatsHappening.themes.map((theme, idx) => (
                  <span 
                    key={idx}
                    className="px-3 py-1.5 bg-primary/10 text-primary text-sm rounded-full border border-primary/20 capitalize"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            )}
          </div>

          {!whatsHappeningExpanded && (
            <button
              onClick={() => setWhatsHappeningExpanded(true)}
              className="text-primary font-medium hover:underline mt-4 text-sm"
            >
              Read the full explanation →
            </button>
          )}

          {whatsHappeningExpanded && (
            <div className="mt-6 pt-6 border-t border-border space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="text-base text-foreground/80 leading-relaxed space-y-4">
                {(() => {
                  const byline = results.whatsHappening.byline || results.whatsHappening.summary;
                  const fullText = results.whatsHappening.fullExplanation;
                  
                  // Remove byline from start of fullExplanation if it's there
                  let contentToShow = fullText;
                  if (byline && fullText.trim().startsWith(byline.trim())) {
                    contentToShow = fullText.slice(byline.length).trim();
                  }
                  
                  return contentToShow
                    .split(/\n{2,}/)
                    .map((para, idx) => (
                      <p key={idx} className="leading-relaxed">
                        {renderBoldText(para.trim())}
                      </p>
                    ));
                })()}
              </div>

              {/* Research subsection - integrated within What's Happening */}
              {results.theTheory && (
                <div className="mt-8 pt-6 border-t border-border/50 space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">🧠</span>
                    <h3 className="text-xl font-medium text-foreground/90">What the Research Says</h3>
                  </div>
                  
                  <p className="text-base text-foreground/80 leading-relaxed">
                    {renderBoldText(results.theTheory.byline || results.theTheory.content.split('.').slice(0, 2).join('.') + '.')}
                  </p>
                  
                  {/* Theory tags - specific psychological concepts */}
                  {results.theTheory.tags && results.theTheory.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {results.theTheory.tags.map((tag, idx) => (
                        <span 
                          key={idx}
                          className="px-3 py-1.5 bg-primary/10 text-primary text-xs rounded-full border border-primary/20 capitalize"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="text-base text-foreground/75 leading-relaxed space-y-3 pl-4 border-l-2 border-primary/30">
                    {results.theTheory.content.split(/\n{2,}/).map((para, idx) => (
                      <p key={idx} className="leading-relaxed">
                        {renderBoldText(para.trim())}
                      </p>
                    ))}
                  </div>

                  {results.whatsHappening.citations && results.whatsHappening.citations.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <p className="text-sm font-semibold text-foreground/90 mb-2">📚 Related Research:</p>
                      <ul className="space-y-1">
                        {results.whatsHappening.citations.map((citation, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground">
                            • {citation.author} ({citation.year}). {citation.title}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border">
                <Button
                  variant={ratings['whats-happening'] === 'up' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleRating('story', "What's Happening", 'up')}
                  className="gap-1"
                >
                  <ThumbsUp className="w-4 h-4" />
                </Button>
                <Button
                  variant={ratings['whats-happening'] === 'down' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleRating('story', "What's Happening", 'down')}
                  className="gap-1"
                >
                  <ThumbsDown className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
        </ErrorBoundary>

        {/* Quotes Section */}
        {results.quotes && results.quotes.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white px-2 mb-8 drop-shadow-lg">In Your Own Words</h2>
            <div className="grid gap-8">
              {results.quotes.map((quote, idx) => (
                <Card 
                  key={idx}
                  className="relative p-10 md:p-12 overflow-hidden border-none shadow-2xl"
                >
                  {/* Astropunk blue gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-900"></div>
                  
                  {/* Cosmic overlay layers */}
                  <div className="absolute inset-0 bg-gradient-to-tl from-transparent via-cyan-500/20 to-blue-400/30 opacity-60" style={{ clipPath: 'ellipse(75% 55% at 25% 45%)' }}></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-transparent to-cyan-400/20 opacity-50" style={{ clipPath: 'ellipse(65% 75% at 75% 55%)' }}></div>
                  
                  {/* Glowing orbs */}
                  <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-cyan-400 blur-3xl opacity-20"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-indigo-500 blur-3xl opacity-25"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-blue-400 blur-2xl opacity-15"></div>
                  
                  {/* Large decorative quote mark */}
                  <div className="absolute top-6 left-6 text-8xl opacity-10 font-serif text-cyan-300">
                    "
                  </div>
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <p className="text-xl md:text-3xl leading-relaxed text-white font-serif italic drop-shadow-lg">
                      "{quote.text}"
                    </p>
                  </div>
                  
                  {/* Bottom accent glow */}
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/30 to-transparent"></div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Reframing Section */}
        {results.reframing && (
          <ErrorBoundary>
          <Card className="p-8 md:p-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl">
            <div className="flex items-center justify-between gap-4 mb-6">
              <button
                onClick={() => setReframingExpanded(!reframingExpanded)}
                className="flex items-center gap-4 text-left"
              >
                <span className="text-3xl">🔄</span>
                <h2 className="text-2xl md:text-3xl font-medium text-foreground">A Different Lens</h2>
                {reframingExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleSave('reframing', 'story', "A Different Lens", undefined, results.reframing)}
              >
                {isSaved('reframing') ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              </Button>
            </div>

            {!reframingExpanded && (
              <div className="mt-6 space-y-4">
                <p className="text-lg md:text-xl text-foreground/90 leading-relaxed">
                  {renderBoldText(results.reframing.content.split('\n\n')[0])}
                </p>
              </div>
            )}

            {!reframingExpanded && (
              <button
                onClick={() => setReframingExpanded(true)}
                className="text-primary font-medium hover:underline mt-4 text-sm"
              >
                Read the full reframe →
              </button>
            )}

            {reframingExpanded && (
              <div className="mt-6 pt-6 border-t border-border space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="text-base text-foreground/80 leading-relaxed space-y-4">
                  {(() => {
                    const content = results.reframing.content;
                    const questionsMatch = content.match(/\*\*Questions to consider:\*\*\s*([\s\S]*?)$/);
                    
                    if (questionsMatch) {
                      const mainContent = content.substring(0, questionsMatch.index).trim();
                      const paragraphs = mainContent.split(/\n{2,}/);
                      const questions = questionsMatch[1]
                        .split('\n')
                        .filter(q => q.trim().startsWith('•'))
                        .map(q => q.replace(/^•\s*/, '').trim());
                      
                      return (
                        <>
                          {paragraphs.map((para, idx) => (
                            <p key={idx} className="leading-relaxed">
                              {renderBoldText(para.trim())}
                            </p>
                          ))}
                          
                          {questions.length > 0 && (
                            <div className="mt-8 pt-6 border-t border-border/50">
                              <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
                                <span className="text-primary">💭</span>
                                Questions to Consider
                              </h3>
                              <ul className="space-y-3">
                                {questions.map((question, idx) => (
                                  <li key={idx} className="flex items-start gap-3">
                                    <span className="text-primary font-semibold mt-0.5">•</span>
                                    <span className="text-foreground/90 leading-relaxed">{question}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </>
                      );
                    }
                    
                    return (
                      <>
                        {content.split(/\n{2,}/).map((para, idx) => (
                          <p key={idx} className="leading-relaxed">
                            {renderBoldText(para.trim())}
                          </p>
                        ))}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border">
              <Button
                variant={ratings['reframing'] === 'up' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleRating('story', "A Different Lens", 'up')}
                className="gap-1"
              >
                <ThumbsUp className="w-4 h-4" />
              </Button>
              <Button
                variant={ratings['reframing'] === 'down' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleRating('story', "A Different Lens", 'down')}
                className="gap-1"
              >
                <ThumbsDown className="w-4 h-4" />
              </Button>
            </div>
          </Card>
          </ErrorBoundary>
        )}

        {/* Story Card */}
        {results.story && (
          <ErrorBoundary>
          <Card className="relative overflow-hidden p-8 md:p-10 bg-gradient-to-br from-accent/5 via-secondary/5 to-primary/5 backdrop-blur-md border-2 border-accent/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            {/* Decorative gradient overlay */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-accent/10 to-transparent rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-3 mb-6">
                <button
                  onClick={() => setStoryExpanded(!storyExpanded)}
                  className="flex items-center gap-3 text-left flex-1 group"
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 group-hover:bg-accent/20 transition-colors">
                    <span className="text-3xl">📖</span>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-foreground mb-1">A Story for You</h2>
                    <p className="text-sm text-muted-foreground italic">{results.story.title} • {results.story.culturalOrigin}</p>
                  </div>
                  {storyExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSave('story-' + results.story!.title, 'story', results.story!.title, undefined, results.story)}
                >
                  {isSaved('story-' + results.story.title) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                </Button>
              </div>

              {!storyExpanded && (
                <div className="space-y-4">
                  <div className="p-6 bg-white/50 dark:bg-gray-800/50 rounded-lg border-l-4 border-accent">
                    <p className="text-base text-foreground/80 leading-relaxed line-clamp-4 font-serif">
                      {results.story.content.slice(0, 300)}...
                    </p>
                  </div>
                  
                  {/* Why it's relevant subsection */}
                  <div className="p-4 bg-accent/5 rounded-lg border border-accent/20">
                    <p className="text-sm font-semibold text-accent mb-2 flex items-center gap-2">
                      <span>💭</span> Why this matters
                    </p>
                    <p className="text-sm text-foreground/70 leading-relaxed line-clamp-2">
                      {results.story.whyThisMatters.slice(0, 150)}...
                    </p>
                  </div>
                  
                  <button
                    onClick={() => setStoryExpanded(true)}
                    className="flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all text-base"
                  >
                    Read the full story
                    <span className="text-lg">→</span>
                  </button>
                </div>
              )}

              {storyExpanded && (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="bg-card/50 p-6 rounded-lg border border-border">
                    <p className="text-base leading-relaxed text-foreground/90 whitespace-pre-line font-serif">
                      {renderBoldText(results.story.content)}
                    </p>
                  </div>

                  <div className="p-6 bg-primary/5 rounded-lg border-l-4 border-primary">
                    <p className="text-sm font-semibold text-foreground/90 mb-3 flex items-center gap-2">
                      <span>💭</span> Why this speaks to {sessionTheme ? sessionTheme : 'your experience'}:
                    </p>
                    <p className="text-base text-foreground/80 leading-relaxed">
                      {renderBoldText(results.story.whyThisMatters)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border">
              <Button
                variant={ratings['story'] === 'up' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleRating('story', results.story!.title, 'up')}
                className="gap-1"
              >
                <ThumbsUp className="w-4 h-4" />
              </Button>
              <Button
                variant={ratings['story'] === 'down' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleRating('story', results.story!.title, 'down')}
                className="gap-1"
              >
                <ThumbsDown className="w-4 h-4" />
              </Button>
            </div>
          </Card>
          </ErrorBoundary>
        )}

        {/* Resources Header */}
        <div className="pt-8">
          <h2 className="text-2xl font-semibold text-white px-2 mb-6 drop-shadow-lg">Resources for You</h2>
        </div>

        {/* Podcast Recommendation */}
        {results.podcast && (
          <ErrorBoundary>
          <Card className="p-6 md:p-8 bg-card border border-border rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl">
            <div className="flex items-center justify-between pb-2 mb-4 border-b-2 border-border">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎧</span>
                <h2 className="text-xl font-semibold text-foreground">Listen</h2>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSave('podcast-' + results.podcast!.episode, 'podcast', results.podcast!.title, results.podcast!.episode, results.podcast)}
                >
                  {isSaved('podcast-' + results.podcast.episode) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleShare(
                  'podcast',
                  results.podcast!.title,
                  {
                    author: results.podcast!.host,
                    text: results.podcast!.description,
                    link: results.podcast!.urls?.spotify || results.podcast!.urls?.direct || window.location.href,
                  }
                )}>
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
              {/* Podcast artwork */}
              <div className="flex-shrink-0">
                <img
                  src={getValidatedImageSrc(results.podcast.thumbnail, podcastPlaceholder)}
                  alt={`${results.podcast.title} artwork`}
                  className="w-full sm:w-[200px] h-[300px] object-cover rounded-md shadow-lg border border-gray-200 dark:border-border"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    e.currentTarget.src = podcastPlaceholder;
                  }}
                />
              </div>

              {/* Right column: Details */}
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{results.podcast.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic">Hosted by {results.podcast.host}</p>
                  <p className="text-base font-medium text-gray-800 dark:text-gray-200 mt-2">{results.podcast.episode}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">⏱ {results.podcast.duration}</p>
                </div>

                <p className="text-base text-gray-700 dark:text-gray-300 leading-7">
                  {results.podcast.description}
                </p>

                <div className="pt-3 border-t border-border">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <span>💬</span> Why this might help {sessionTheme ? `for ${sessionTheme}` : ''}:
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                    {results.podcast.whyThisHelps}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={() => handlePodcastPlay('spotify')} className="gap-2">
                      <Music className="w-4 h-4" />
                      Open in Spotify
                    </Button>
                    
                    <Button onClick={() => handlePodcastPlay('apple')} variant="outline" className="gap-2">
                      <ExternalLink className="w-4 h-4" />
                      Open in Apple Podcasts
                    </Button>
                  </div>

                  {/* Rating buttons */}
                  <div className="flex gap-2 ml-auto">
                    <Button
                      variant={ratings.podcast === 'up' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleRating('podcast', results.podcast!.title, 'up')}
                      className="gap-1"
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={ratings.podcast === 'down' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleRating('podcast', results.podcast!.title, 'down')}
                      className="gap-1"
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          </ErrorBoundary>
        )}

        {/* Book Recommendation */}
        {results.book && (
          <ErrorBoundary>
          <Card className="p-6 md:p-8 bg-card border border-border rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl">
            <div className="flex items-center justify-between pb-2 mb-4 border-b-2 border-border">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📚</span>
                <h2 className="text-xl font-semibold text-foreground">Read</h2>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSave('book-' + results.book!.title, 'book', results.book!.title, `By ${results.book!.author}`, results.book)}
                >
                  {isSaved('book-' + results.book.title) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleShare(
                  'book',
                  results.book!.title,
                  {
                    author: results.book!.author,
                    text: results.book!.description,
                    link: results.book!.purchaseUrl || window.location.href,
                  }
                )}>
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
              {/* Book cover or Google Books preview */}
              <div className="flex-shrink-0">
                <img
                  src={getValidatedImageSrc(results.book.coverImage, bookPlaceholder)}
                  alt={`${results.book.title} cover`}
                  className="w-full sm:w-[200px] h-[300px] object-cover rounded-md shadow-lg border border-gray-200 dark:border-border"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    e.currentTarget.src = bookPlaceholder;
                  }}
                />
              </div>

              {/* Book details */}
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{results.book.title}</h3>
                  <p className="text-base text-muted-foreground">By {results.book.author}</p>
                  <p className="text-sm text-foreground/80 leading-6 mt-2">{results.book.byline}</p>
                  <p className="text-sm text-muted-foreground mt-1">📏 {results.book.length}</p>
                </div>

                <p className="text-base text-foreground/90 leading-7">
                  {results.book.description}
                </p>

                <div className="pt-3 border-t border-border">
                  <p className="text-sm font-semibold text-foreground/90 mb-2 flex items-center gap-2">
                    <span>💬</span> Why this might help {sessionTheme ? `for ${sessionTheme}` : ''}:
                  </p>
                  <p className="text-sm text-muted-foreground italic">
                    {results.book.whyThisHelps}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 pt-4 border-t border-border mt-4">
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      onClick={() => handleBookPurchase('bookshop')} 
                      className="gap-2"
                    >
                      <BookOpen className="w-4 h-4" />
                      Bookshop.org
                    </Button>
                    
                    <Button 
                      onClick={() => handleBookPurchase('amazon')} 
                      variant="outline" 
                      className="gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Amazon
                    </Button>
                  </div>

                  {/* Rating buttons */}
                  <div className="flex gap-2 ml-auto">
                    <Button
                      variant={ratings.book === 'up' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleRating('book', results.book!.title, 'up')}
                      className="gap-1"
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={ratings.book === 'down' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleRating('book', results.book!.title, 'down')}
                      className="gap-1"
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          </ErrorBoundary>
        )}

        {/* Exercise Card */}
        {results.exercise && (
          <ErrorBoundary>
          <Card className="p-6 md:p-8 bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20 shadow-lg">
            <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-border">
              <div className="flex items-center gap-2">
                <span className="text-2xl">✨</span>
                <h2 className="text-xl font-semibold text-foreground">Practice</h2>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSave('exercise-' + results.exercise!.title, 'exercise', results.exercise!.title, results.exercise!.description, results.exercise)}
                >
                  {isSaved('exercise-' + results.exercise.title) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleShare(
                  'exercise',
                  results.exercise!.title,
                  {
                    text: results.exercise!.description,
                    link: window.location.href,
                  }
                )}>
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <img
                src={exercisePlaceholder}
                alt={`${results.exercise.title} illustration`}
                className="w-full sm:w-[200px] h-[200px] object-cover rounded-lg shadow-md flex-shrink-0"
              />

              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="text-lg font-medium text-foreground">{results.exercise.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">⏱ {results.exercise.duration}</p>
                  <p className="text-base text-foreground/80 leading-relaxed mt-2">{results.exercise.description}</p>
                </div>

                {results.exercise.whyHelps && (
                  <div className="pt-3 border-t border-border">
                    <p className="text-sm font-semibold text-foreground/90 mb-2 flex items-center gap-2">
                      <span>💬</span> Why this might help {sessionTheme ? `for ${sessionTheme}` : ''}:
                    </p>
                    <p className="text-sm text-muted-foreground italic">
                      {results.exercise.whyHelps}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 pt-4 border-t border-border mt-4">
                  <Button onClick={() => setExerciseModalOpen(true)} className="gap-2">
                    Start Guided Exercise →
                  </Button>

                  {/* Rating buttons */}
                  <div className="flex gap-2 ml-auto">
                    <Button
                      variant={ratings.exercise === 'up' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleRating('exercise', results.exercise!.title, 'up')}
                      className="gap-1"
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={ratings.exercise === 'down' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleRating('exercise', results.exercise!.title, 'down')}
                      className="gap-1"
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          </ErrorBoundary>
        )}


        {/* Footer */}
        <div className="text-center pt-8 pb-4 space-y-4">
          <p className="text-white text-sm drop-shadow">
            I'll be here tomorrow evening
          </p>
          <Button onClick={onNewCheckIn} size="lg" className="px-8">
            End Session
          </Button>
        </div>
      </div>

      {/* Guided Exercise Modal */}
      {results.exercise && (
        <GuidedExercise
          open={exerciseModalOpen}
          onClose={() => setExerciseModalOpen(false)}
          title={results.exercise.title}
          steps={results.exercise.steps}
        />
      )}

      {/* Rating Feedback Dialog */}
      {feedbackDialog && (
        <RatingFeedbackDialog
          open={feedbackDialog.open}
          onClose={() => setFeedbackDialog(null)}
          onSubmit={handleFeedbackSubmit}
          recommendationType={feedbackDialog.type}
          recommendationTitle={feedbackDialog.title}
        />
      )}

      {/* Share Modal */}
      {shareModal && (
        <ShareModal
          open={shareModal.open}
          onClose={() => setShareModal(null)}
          content={shareModal.content}
        />
      )}
      
      {/* Stage Progress Bar */}
      <StageProgressBar currentStage="recommendations" />
    </div>
  );
};

export default ResultsDisplay;
