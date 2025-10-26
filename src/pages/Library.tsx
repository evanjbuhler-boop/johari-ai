import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Play, BookOpen, Sparkles, BookMarked, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/AppLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

interface DbSavedItem {
  id: string;
  user_id: string;
  item_type: 'podcast' | 'book' | 'exercise' | 'story';
  title: string;
  description: string | null;
  preview: string | null;
  podcast_host?: string | null;
  podcast_episode?: string | null;
  podcast_duration?: string | null;
  podcast_thumbnail?: string | null;
  podcast_urls?: any;
  book_author?: string | null;
  book_cover_image?: string | null;
  book_sample_url?: string | null;
  book_purchase_url?: string | null;
  exercise_steps?: any;
  story_content?: string | null;
  created_at: string;
}

const Library = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [savedItems, setSavedItems] = useState<DbSavedItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'podcast' | 'book' | 'exercise' | 'story'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState<DbSavedItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<DbSavedItem | null>(null);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/auth');
      return;
    }

    fetchSavedItems();
  }, [user, authLoading, navigate]);

  const fetchSavedItems = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('saved_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setSavedItems(data as DbSavedItem[]);
      } else if (error) {
        toast.error('Failed to load library');
      }
    } finally {
      setLoading(false);
    }
  };

  const generatePreviewFromItem = (item: DbSavedItem): string => {
    // Return existing preview if available
    if (item.preview) return item.preview;
    
    // Generate preview from saved data
    if (item.item_type === 'podcast') {
      const episode = item.podcast_episode ? `Episode: ${item.podcast_episode}. ` : '';
      const desc = item.description || 'A podcast episode to support your wellbeing.';
      return episode + desc;
    } else if (item.item_type === 'book') {
      const author = item.book_author ? `By ${item.book_author}. ` : '';
      const desc = item.description || 'A book recommendation for you.';
      return author + desc;
    } else if (item.item_type === 'exercise') {
      let stepsInfo = '';
      if (item.exercise_steps) {
        try {
          // Handle both object and string formats
          const steps = typeof item.exercise_steps === 'string' 
            ? JSON.parse(item.exercise_steps)
            : item.exercise_steps;
          if (Array.isArray(steps) && steps.length > 0) {
            stepsInfo = ` It includes ${steps.length} guided steps.`;
          }
        } catch (e) {
          // If parsing fails, just skip the steps info
          console.debug('Could not parse exercise steps:', e);
        }
      }
      const desc = item.description || 'A simple exercise to help you process your feelings and articulate them.';
      return desc + stepsInfo;
    } else if (item.item_type === 'story') {
      if (item.title === "What's Happening") {
        try {
          const content = typeof item.story_content === 'string' 
            ? JSON.parse(item.story_content) 
            : item.story_content;
          if (content?.summary) {
            return content.summary.slice(0, 200) + (content.summary.length > 200 ? '...' : '');
          }
        } catch (e) {
          // Fall through to default
          console.debug('Could not parse story content:', e);
        }
        return 'A summary of your check-in session and key insights.';
      }
      return item.description || 'A perspective to help you reflect on your experience.';
    }
    return '';
  };

  const filteredItems = filter === 'all' 
    ? savedItems 
    : savedItems.filter(item => item.item_type === filter);

  const confirmDelete = async () => {
    if (!user || !itemToDelete) return;

    const { error } = await supabase
      .from('saved_items')
      .delete()
      .eq('id', itemToDelete.id)
      .eq('user_id', user.id);

    if (!error) {
      setSavedItems(savedItems.filter(item => item.id !== itemToDelete.id));
      toast.success('Removed from library');
    } else {
      toast.error('Failed to remove item');
    }
    
    setItemToDelete(null);
  };

  const handleAction = (item: DbSavedItem) => {
    if (item.item_type === 'podcast' && item.podcast_urls) {
      const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
      const url = isIOS ? item.podcast_urls.applePodcasts : item.podcast_urls.spotify;
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    } else if (item.item_type === 'book' && item.book_sample_url) {
      window.open(item.book_sample_url, '_blank', 'noopener,noreferrer');
    } else if (item.item_type === 'exercise') {
      toast.info('Exercise flow will open here');
    } else if (item.item_type === 'story') {
      setSelectedStory(item);
    }
  };

  const getActionLabel = (type: string) => {
    switch (type) {
      case 'podcast': return 'Play';
      case 'book': return 'Read';
      case 'exercise': return 'Start';
      case 'story': return 'Read';
      default: return 'View';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'podcast': return <Play className="w-4 h-4" />;
      case 'book': return <BookOpen className="w-4 h-4" />;
      case 'exercise': return <Sparkles className="w-4 h-4" />;
      case 'story': return <BookMarked className="w-4 h-4" />;
      default: return null;
    }
  };

  const getTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Show content immediately with skeleton loading for better UX
  const showingSkeleton = authLoading || loading;

  return (
    <AppLayout showBackground={true}>
      <div className="min-h-screen animate-in fade-in duration-500">
        {/* Centered Header */}
        <div className="text-center pt-20 pb-12 px-4">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            Your Library
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '100ms' }}>
            Everything you've bookmarked is here.
          </p>
        </div>

        <div className="max-w-4xl mx-auto px-4 pb-16">
          {/* Filter Tabs - Pill Style */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-2.5 rounded-full font-medium transition-all ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('podcast')}
              className={`px-6 py-2.5 rounded-full font-medium transition-all ${
                filter === 'podcast'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
              }`}
            >
              Podcasts
            </button>
            <button
              onClick={() => setFilter('book')}
              className={`px-6 py-2.5 rounded-full font-medium transition-all ${
                filter === 'book'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
              }`}
            >
              Books
            </button>
            <button
              onClick={() => setFilter('exercise')}
              className={`px-6 py-2.5 rounded-full font-medium transition-all ${
                filter === 'exercise'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
              }`}
            >
              Exercises
            </button>
            <button
              onClick={() => setFilter('story')}
              className={`px-6 py-2.5 rounded-full font-medium transition-all ${
                filter === 'story'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
              }`}
            >
              Perspectives
            </button>
          </div>

          {/* Content */}
          {showingSkeleton ? (
            // Skeleton Loading State
            <div className="space-y-4 animate-in fade-in duration-300">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-lg">
                  <div className="flex items-start gap-5">
                    <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 animate-pulse" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 w-20 bg-purple-100 rounded animate-pulse" />
                      <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                      <div className="flex gap-3 mt-4">
                        <div className="h-10 w-24 bg-gradient-to-r from-purple-200 to-pink-200 rounded-full animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-16 text-center shadow-xl">
              <div className="text-6xl mb-6">📚</div>
              <h3 className="text-2xl font-semibold text-foreground mb-3">
                {filter === 'all' ? 'Your library is empty' : `No ${filter}s saved yet`}
              </h3>
              <p className="text-muted-foreground text-lg max-w-md mx-auto">
                As you log more sessions, you'll generate more recommendations for you to save.
              </p>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-500">
              {filteredItems.map((item, idx) => (
                <div 
                  key={item.id} 
                  className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all group animate-in fade-in slide-in-from-bottom-2 duration-500"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-start gap-5">
                    {/* Type Icon */}
                    <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-3xl">
                      {item.item_type === 'podcast' && '🎧'}
                      {item.item_type === 'book' && '📖'}
                      {item.item_type === 'exercise' && '✨'}
                      {item.item_type === 'story' && '📚'}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2">
                            {item.title === "What's Happening" ? 'SUMMARY' : item.item_type === 'story' ? 'PERSPECTIVE' : getTypeLabel(item.item_type)}
                          </p>
                          <h3 className="text-xl font-bold text-foreground mb-2 leading-tight">
                            {item.title}
                          </h3>
                          <p className="text-muted-foreground leading-relaxed text-sm">
                            {generatePreviewFromItem(item)}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-muted-foreground font-medium">
                            {new Date(item.created_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 mt-4">
                        <Button 
                          onClick={() => handleAction(item)}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full px-6 shadow-md gap-2"
                        >
                          {getIcon(item.item_type)}
                          {getActionLabel(item.item_type)}
                        </Button>
                        <Button 
                          variant="ghost"
                          onClick={() => setItemToDelete(item)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive rounded-full"
                          size="icon"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "{itemToDelete?.title}" from your library. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Story Viewer Dialog */}
      <Dialog open={!!selectedStory} onOpenChange={() => setSelectedStory(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedStory?.title}</DialogTitle>
          </DialogHeader>
          {selectedStory && (() => {
            try {
              const content = typeof selectedStory.story_content === 'string' 
                ? JSON.parse(selectedStory.story_content) 
                : selectedStory.story_content;
              
              // Handle regular story format (content + whyThisMatters)
              if (content?.content) {
                return (
                  <div className="space-y-6 py-4">
                    <div>
                      <p className="text-base leading-relaxed text-muted-foreground whitespace-pre-line">
                        {content.content}
                      </p>
                    </div>
                    
                    {content?.whyThisMatters && (
                      <div className="border-t pt-4">
                        <h3 className="text-lg font-semibold mb-3">Why This Matters</h3>
                        <p className="text-base leading-relaxed text-muted-foreground">
                          {content.whyThisMatters}
                        </p>
                      </div>
                    )}
                  </div>
                );
              }
              
              // Handle "What's Happening" format (summary + fullExplanation + citations)
              return (
                <div className="space-y-6 py-4">
                  {content?.summary && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Summary</h3>
                      <p className="text-base leading-relaxed text-muted-foreground">
                        {content.summary}
                      </p>
                    </div>
                  )}
                  
                  {content?.themes && content.themes.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Key Themes</h3>
                      <div className="flex flex-wrap gap-2">
                        {content.themes.map((theme: string, idx: number) => (
                          <span 
                            key={idx}
                            className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                          >
                            {theme}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {content?.fullExplanation && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Full Explanation</h3>
                      <p className="text-base leading-relaxed text-muted-foreground whitespace-pre-line">
                        {content.fullExplanation}
                      </p>
                    </div>
                  )}
                  
                  {content?.citations && content.citations.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">References</h3>
                      <ul className="space-y-2">
                        {content.citations.map((citation: any, idx: number) => (
                          <li key={idx} className="text-sm text-muted-foreground">
                            {citation.author} ({citation.year}). <em>{citation.title}</em>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            } catch (e) {
              // Fallback for non-JSON content
              return (
                <div className="space-y-6 py-4">
                  <div className="prose prose-lg max-w-none">
                    <p className="text-base leading-relaxed whitespace-pre-line">
                      {selectedStory.story_content}
                    </p>
                  </div>
                </div>
              );
            }
          })()}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Library;
