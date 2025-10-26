import { CheckInResults, SavedItem } from '@/types/checkin';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bookmark, BookmarkCheck, ChevronDown, ChevronUp, Play, BookOpen, Share2, Library } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import GuidedExercise from '@/components/GuidedExercise';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import StageProgressBar from '@/components/StageProgressBar';
import podcastPlaceholder from '@/assets/podcast-placeholder.png';
import bookPlaceholder from '@/assets/book-placeholder.png';

interface ResultsDisplayProps {
  results: CheckInResults;
  onNewCheckIn: () => void;
}

const ResultsDisplay = ({ results, onNewCheckIn }: ResultsDisplayProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [whatsHappeningExpanded, setWhatsHappeningExpanded] = useState(false);
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

  const handlePodcastPlay = () => {
    if (!results.podcast) return;
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const url = isIOS ? results.podcast.urls.applePodcasts : results.podcast.urls.spotify;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleBookRead = () => {
    if (results.book?.sampleUrl) {
      window.open(results.book.sampleUrl, '_blank', 'noopener noreferrer');
    }
  };

  const handleBookPurchase = () => {
    if (results.book?.purchaseUrl) {
      window.open(results.book.purchaseUrl, '_blank', 'noopener noreferrer');
    }
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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background pb-32">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-end">
          <Button 
            variant="outline" 
            onClick={() => navigate('/library')}
            className="gap-2"
          >
            <Library className="w-4 h-4" />
            <span className="hidden sm:inline">Library</span>
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 md:p-6 py-8 space-y-6">
        
        {/* What's Happening Section */}
        <Card className="p-8 md:p-10 bg-gradient-to-br from-background via-muted/10 to-background border-l-4 border-primary rounded-xl shadow-lg">
          <button
            onClick={() => setWhatsHappeningExpanded(!whatsHappeningExpanded)}
            className="w-full flex items-center justify-between gap-4 text-left"
          >
            <h2 className="text-2xl md:text-3xl font-medium text-foreground">What's Happening</h2>
            {whatsHappeningExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

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

              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleSave('whats-happening', 'story', "What's Happening", undefined, results.whatsHappening)}
                className="mt-4"
              >
                {isSaved('whats-happening') ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              </Button>
            </div>
          )}
        </Card>

        {/* Quotes Section */}
        {results.quotes && results.quotes.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground px-2">Your Words</h2>
            <div className="grid gap-4">
              {results.quotes.map((quote, idx) => (
                <Card 
                  key={idx}
                  className={`p-6 md:p-8 ${
                    quote.sentiment === 'positive' ? 'bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 border-l-4 border-green-400' :
                    quote.sentiment === 'negative' ? 'bg-gradient-to-br from-rose-50/50 to-red-50/50 dark:from-rose-950/20 dark:to-red-950/20 border-l-4 border-rose-400' :
                    'bg-card/50 border-l-4 border-muted'
                  }`}
                >
                  <p className="text-lg md:text-2xl leading-relaxed text-foreground italic font-serif">
                    "{quote.text}"
                  </p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Reframing Section */}
        {results.reframing && (
          <Card className="p-8 md:p-10 bg-gradient-to-br from-accent/5 via-secondary/5 to-primary/5 border-none shadow-lg">
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
          <Card className="p-8 md:p-10 bg-gradient-to-br from-secondary/5 to-muted/30 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">📖</span>
              <h2 className="text-2xl font-semibold text-foreground">A Story for You</h2>
            </div>

            <div className="space-y-6">
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

              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleSave('story-' + results.story!.title, 'story', results.story!.title, undefined, results.story)}
              >
                {isSaved('story-' + results.story.title) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              </Button>
            </div>
          </Card>
        )}

        {/* Resources Header */}
        <div className="pt-8">
          <h2 className="text-2xl font-semibold text-foreground px-2 mb-6">Resources for You</h2>
        </div>

        {/* Podcast Recommendation */}
        {results.podcast && (
          <Card className="p-6 md:p-8 bg-card border border-border rounded-xl shadow-lg">
            <div className="flex items-center gap-2 pb-2 mb-4 border-b-2 border-border">
              <span className="text-2xl">🎧</span>
              <h2 className="text-xl font-semibold text-foreground">Listen to This</h2>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <img
                src={results.podcast.thumbnail || podcastPlaceholder}
                alt={`${results.podcast.title} artwork`}
                className="w-full sm:w-[200px] h-[200px] object-cover rounded-lg shadow-md flex-shrink-0"
              />

              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{results.podcast.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic">Hosted by {results.podcast.host}</p>
                  <p className="text-base font-medium text-gray-800 dark:text-gray-200 mt-2">{results.podcast.episode}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">⏱ {results.podcast.duration}</p>
                </div>

                <p className="text-base text-gray-700 dark:text-gray-300 leading-7">
                  {results.podcast.description}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-border">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <span>💬</span> Why this might help:
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                {results.podcast.whyThisHelps}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 mt-4">
              <Button onClick={handlePodcastPlay} className="flex-1 sm:flex-none gap-2">
                <Play className="w-4 h-4" />
                Play Episode
              </Button>
              <Button
                variant="outline"
                onClick={() => toggleSave('podcast-' + results.podcast!.episode, 'podcast', results.podcast!.title, results.podcast!.episode, results.podcast)}
              >
                {isSaved('podcast-' + results.podcast.episode) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              </Button>
              <Button variant="outline" onClick={() => handleShare(results.podcast!.title)}>
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* Book Recommendation */}
        {results.book && (
          <Card className="p-6 md:p-8 bg-card border border-border rounded-xl shadow-lg">
            <div className="flex items-center gap-2 pb-2 mb-4 border-b-2 border-border">
              <span className="text-2xl">📚</span>
              <h2 className="text-xl font-semibold text-foreground">Books</h2>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <img
                src={results.book.coverImage || bookPlaceholder}
                alt={`${results.book.title} cover`}
                className="w-full sm:w-[150px] h-[225px] object-cover rounded-md shadow-lg border border-gray-200 dark:border-border flex-shrink-0"
              />

              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{results.book.title}</h3>
                  <p className="text-base text-muted-foreground">By {results.book.author}</p>
                  <p className="text-sm text-foreground/80 leading-6 mt-2">{results.book.byline}</p>
                  <p className="text-sm text-muted-foreground mt-1">📏 {results.book.length}</p>
                </div>

                <p className="text-base text-foreground/90 leading-7">
                  {results.book.description}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm font-semibold text-foreground/90 mb-2 flex items-center gap-2">
                <span>💬</span> Why this might help:
              </p>
              <p className="text-xs text-muted-foreground italic">
                {results.book.whyThisHelps}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 mt-4">
              {results.book.sampleUrl && (
                <Button onClick={handleBookRead} className="flex-1 sm:flex-none gap-2">
                  <BookOpen className="w-4 h-4" />
                  Read Sample
                </Button>
              )}
              {results.book.purchaseUrl && (
                <Button 
                  onClick={handleBookPurchase} 
                  variant={results.book.sampleUrl ? "outline" : "default"} 
                  className="flex-1 sm:flex-none"
                >
                  🛒 Get Book
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => toggleSave('book-' + results.book!.title, 'book', results.book!.title, `By ${results.book!.author}`, results.book)}
              >
                {isSaved('book-' + results.book.title) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              </Button>
              <Button variant="outline" onClick={() => handleShare(results.book!.title)}>
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* Exercise Card */}
        {results.exercise && (
          <Card className="p-6 md:p-8 bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20 shadow-lg">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-border">
              <span className="text-2xl">✨</span>
              <h2 className="text-xl font-semibold text-foreground">Hands on Exercises</h2>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-medium text-foreground">{results.exercise.title}</h3>
              <p className="text-base text-foreground/80 leading-relaxed">{results.exercise.description}</p>
            </div>

            <div className="flex flex-wrap gap-3 mt-4">
              <Button onClick={() => setExerciseModalOpen(true)} className="flex-1 sm:flex-none">
                Start Guided Exercise →
              </Button>
              <Button
                variant="outline"
                onClick={() => toggleSave('exercise-' + results.exercise!.title, 'exercise', results.exercise!.title, results.exercise!.description, results.exercise)}
              >
                {isSaved('exercise-' + results.exercise.title) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              </Button>
            </div>
          </Card>
        )}


        {/* Footer */}
        <div className="text-center pt-8 pb-4 space-y-4">
          <p className="text-muted-foreground text-sm">
            I'll be here tomorrow evening
          </p>
          <Button onClick={onNewCheckIn} size="lg" className="px-8">
            Start New Check-in
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
