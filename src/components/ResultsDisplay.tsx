import { CheckInResults, SavedItem } from '@/types/checkin';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bookmark, BookmarkCheck, ChevronDown, ChevronUp, Play, BookOpen, Share2, Library, ExternalLink, Music } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import StageProgressBar from '@/components/StageProgressBar';
import podcastPlaceholder from '@/assets/podcast-placeholder.png';
import bookPlaceholder from '@/assets/book-placeholder.png';
import exercisePlaceholder from '@/assets/exercise-placeholder.png';

interface ResultsDisplayProps {
  results: CheckInResults;
  onNewCheckIn: () => void;
}

const ResultsDisplay = ({ results, onNewCheckIn }: ResultsDisplayProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [whatsHappeningExpanded, setWhatsHappeningExpanded] = useState(false);
  const [storyExpanded, setStoryExpanded] = useState(false);
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());

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

  const isSaved = (id: string) => savedItems.has(id);

  const generatePreview = (type: 'podcast' | 'book' | 'exercise' | 'story', title: string, content: any): string => {
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
      } else if (results.story) {
        const why = results.story.whyThisMatters || '';
        return why.slice(0, 200) + (why.length > 200 ? '...' : '');
      }
    }
    return '';
  };

  const toggleSave = async (id: string, type: 'podcast' | 'book' | 'exercise' | 'story', title: string, subtitle: string | undefined, content: any) => {
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

  const addUTMParams = (url: string) => {
    const utmParams = 'utm_source=johari&utm_medium=web';
    return url.includes('?') ? `${url}&${utmParams}` : `${url}?${utmParams}`;
  };

  const handlePodcastPlay = (platform: 'spotify' | 'apple' | 'direct' = 'spotify') => {
    if (!results.podcast) return;
    
    let url = '';
    if (platform === 'spotify' && results.podcast.urls.spotify) {
      url = results.podcast.urls.spotify;
    } else if (platform === 'apple' && results.podcast.urls.applePodcasts) {
      url = results.podcast.urls.applePodcasts;
    } else if (platform === 'direct' && results.podcast.urls.direct) {
      url = results.podcast.urls.direct;
    }
    
    if (url) {
      window.open(addUTMParams(url), '_blank', 'noopener,noreferrer');
    } else {
      toast.error('Link unavailable, please try another platform');
    }
  };

  const handleBookRead = () => {
    if (results.book?.sampleUrl) {
      window.open(addUTMParams(results.book.sampleUrl), '_blank', 'noopener noreferrer');
    }
  };

  const handleBookPurchase = (store: 'bookshop' | 'bn' | 'amazon' = 'bookshop') => {
    if (!results.book) return;
    
    // For now, use purchaseUrl as primary - in production, you'd want different URLs per store
    if (results.book.purchaseUrl) {
      window.open(addUTMParams(results.book.purchaseUrl), '_blank', 'noopener noreferrer');
    } else {
      toast.error('Purchase link unavailable');
    }
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

  const handleShare = async (title: string) => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: `Check out: ${title}` });
      } catch (err) {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied!');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied!');
    }
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

      <div className="max-w-4xl mx-auto p-4 md:p-6 py-8 space-y-6">
        
        {/* What's Happening Section */}
        <Card className="p-8 md:p-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-xl shadow-lg">
          <div className="flex items-center justify-between gap-4 mb-6">
            <button
              onClick={() => setWhatsHappeningExpanded(!whatsHappeningExpanded)}
              className="flex items-center gap-4 text-left"
            >
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
              {results.whatsHappening.summary}
            </p>
            
            {/* Theme badges */}
            {results.whatsHappening.themes && results.whatsHappening.themes.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {results.whatsHappening.themes.map((theme, idx) => (
                  <span 
                    key={idx}
                    className="px-3 py-1.5 bg-primary/10 text-primary text-sm rounded-full border border-primary/20"
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
            <div className="mt-6 pt-6 border-t border-border space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <p className="text-base text-foreground/80 leading-relaxed whitespace-pre-line">
                {results.whatsHappening.fullExplanation}
              </p>

              {results.whatsHappening.citations && results.whatsHappening.citations.length > 0 && (
                <div className="mt-6 pt-4 border-t border-border">
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
        </Card>

        {/* Quotes Section */}
        {results.quotes && results.quotes.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white px-2 mb-8 drop-shadow-lg">Your Words</h2>
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
          <Card className="p-8 md:p-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-none shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">🔄</span>
              <h2 className="text-2xl font-semibold text-foreground">A Different Lens</h2>
            </div>
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="text-base md:text-lg text-foreground/90 leading-relaxed whitespace-pre-line">
                {results.reframing.content}
              </p>
            </div>
          </Card>
        )}

        {/* Story Card */}
        {results.story && (
          <Card className="p-8 md:p-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg">
            <div className="flex items-center justify-between gap-3 mb-6">
              <button
                onClick={() => setStoryExpanded(!storyExpanded)}
                className="flex items-center gap-3 text-left"
              >
                <span className="text-3xl">📖</span>
                <h2 className="text-2xl font-semibold text-foreground">A Story for You</h2>
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
              <button
                onClick={() => setStoryExpanded(true)}
                className="text-primary font-medium hover:underline text-sm"
              >
                Read the story →
              </button>
            )}

            {storyExpanded && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="bg-card/50 p-6 rounded-lg border border-border">
                  <h3 className="text-xl font-medium text-foreground mb-2">{results.story.title}</h3>
                  <p className="text-sm text-muted-foreground italic mb-4">{results.story.culturalOrigin}</p>
                  <p className="text-base leading-relaxed text-foreground/90 whitespace-pre-line font-serif">
                    {results.story.content}
                  </p>
                </div>

                <div className="pt-4">
                  <p className="text-sm font-semibold text-foreground/90 mb-3 flex items-center gap-2">
                    <span>💭</span> Why this speaks to your experience:
                  </p>
                  <p className="text-base text-foreground/80 leading-relaxed">
                    {results.story.whyThisMatters}
                  </p>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Resources Header */}
        <div className="pt-8">
          <h2 className="text-2xl font-semibold text-white px-2 mb-6 drop-shadow-lg">Resources for You</h2>
        </div>

        {/* Podcast Recommendation */}
        {results.podcast && (
          <Card className="p-6 md:p-8 bg-card border border-border rounded-xl shadow-lg">
            <div className="flex items-center justify-between pb-2 mb-4 border-b-2 border-border">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎧</span>
                <h2 className="text-xl font-semibold text-foreground">Listen to This</h2>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSave('podcast-' + results.podcast!.episode, 'podcast', results.podcast!.title, results.podcast!.episode, results.podcast)}
                >
                  {isSaved('podcast-' + results.podcast.episode) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleShare(results.podcast!.title)}>
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-[300px_1fr] gap-6">
              {/* Left column: Embed player */}
              <div className="space-y-4">
                {getSpotifyEmbedUrl(results.podcast.urls.spotify) ? (
                  <div className="w-full">
                    <iframe
                      src={getSpotifyEmbedUrl(results.podcast.urls.spotify)!}
                      width="100%"
                      height="232"
                      frameBorder="0"
                      allow="encrypted-media"
                      title={`${results.podcast.title} - Spotify Player`}
                      className="rounded-lg"
                    />
                  </div>
                ) : (
                  <img
                    src={podcastPlaceholder}
                    alt={`${results.podcast.title} artwork`}
                    className="w-full h-[232px] object-cover rounded-lg shadow-md"
                  />
                )}
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
                    <span>💬</span> Why this might help:
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                    {results.podcast.whyThisHelps}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button onClick={() => handlePodcastPlay('spotify')} className="gap-2">
                    <Music className="w-4 h-4" />
                    Play on Spotify
                  </Button>
                  
                  {results.podcast.urls.applePodcasts && (
                    <Button onClick={() => handlePodcastPlay('apple')} variant="outline" className="gap-2">
                      <ExternalLink className="w-4 h-4" />
                      Apple Podcasts
                    </Button>
                  )}
                  
                  {results.podcast.urls.direct && (
                    <Button onClick={() => handlePodcastPlay('direct')} variant="outline" className="gap-2">
                      <ExternalLink className="w-4 h-4" />
                      Open in Browser
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Book Recommendation */}
        {results.book && (
          <Card className="p-6 md:p-8 bg-card border border-border rounded-xl shadow-lg">
            <div className="flex items-center justify-between pb-2 mb-4 border-b-2 border-border">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📚</span>
                <h2 className="text-xl font-semibold text-foreground">Books</h2>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSave('book-' + results.book!.title, 'book', results.book!.title, `By ${results.book!.author}`, results.book)}
                >
                  {isSaved('book-' + results.book.title) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleShare(results.book!.title)}>
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
              {/* Book cover or Google Books preview */}
              <div className="flex-shrink-0">
                <img
                  src={bookPlaceholder}
                  alt={`${results.book.title} cover`}
                  className="w-full sm:w-[200px] h-[300px] object-cover rounded-md shadow-lg border border-gray-200 dark:border-border"
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
                    <span>💬</span> Why this might help:
                  </p>
                  <p className="text-sm text-muted-foreground italic">
                    {results.book.whyThisHelps}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  {results.book.sampleUrl && (
                    <Button onClick={handleBookRead} variant="outline" className="gap-2">
                      <BookOpen className="w-4 h-4" />
                      Read Sample
                    </Button>
                  )}
                  
                  {results.book.purchaseUrl && (
                    <>
                      <Button 
                        onClick={() => handleBookPurchase('bookshop')} 
                        className="gap-2"
                      >
                        🛒 Get Book
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="gap-2">
                            Alternatives
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleBookPurchase('bookshop')}>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Bookshop.org
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleBookPurchase('bn')}>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Barnes & Noble
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleBookPurchase('amazon')}>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Amazon
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Exercise Card */}
        {results.exercise && (
          <Card className="p-6 md:p-8 bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20 shadow-lg">
            <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-border">
              <div className="flex items-center gap-2">
                <span className="text-2xl">✨</span>
                <h2 className="text-xl font-semibold text-foreground">Practical Exercises</h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleSave('exercise-' + results.exercise!.title, 'exercise', results.exercise!.title, results.exercise!.description, results.exercise)}
              >
                {isSaved('exercise-' + results.exercise.title) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              </Button>
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
                  <p className="text-base text-foreground/80 leading-relaxed mt-2">{results.exercise.description}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-4">
              <Button onClick={() => setExerciseModalOpen(true)} className="flex-1 sm:flex-none">
                Start Guided Exercise →
              </Button>
            </div>
          </Card>
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
      
      {/* Stage Progress Bar */}
      <StageProgressBar currentStage="recommendations" />
    </div>
  );
};

export default ResultsDisplay;
