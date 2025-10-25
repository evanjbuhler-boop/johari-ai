import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Play, BookOpen, Sparkles, BookMarked, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/AppLayout';

interface DbSavedItem {
  id: string;
  user_id: string;
  item_type: 'podcast' | 'book' | 'exercise' | 'story';
  title: string;
  description: string | null;
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

    setLoading(true);
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
    setLoading(false);
  };

  const filteredItems = filter === 'all' 
    ? savedItems 
    : savedItems.filter(item => item.item_type === filter);

  const handleRemove = async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('saved_items')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (!error) {
      setSavedItems(savedItems.filter(item => item.id !== id));
      toast.success('Removed from library');
    } else {
      toast.error('Failed to remove item');
    }
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

  if (authLoading || loading) {
    return (
      <AppLayout showBackground={true}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white/80">Loading your library...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showBackground={true}>
      <div className="min-h-screen">
        {/* Centered Header */}
        <div className="text-center pt-20 pb-12 px-4">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Your Library
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
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
          {filteredItems.length === 0 ? (
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-16 text-center shadow-xl">
              <div className="text-6xl mb-6">📚</div>
              <h3 className="text-2xl font-semibold text-foreground mb-3">
                {filter === 'all' ? 'Your library is empty' : `No ${filter}s saved yet`}
              </h3>
              <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
                As you explore recommendations, save content here for easy access later.
              </p>
              <Button 
                onClick={() => navigate('/')} 
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-6 text-lg rounded-full shadow-lg"
              >
                Explore Recommendations →
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all group"
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
                            {getTypeLabel(item.item_type)}
                          </p>
                          <h3 className="text-xl font-bold text-foreground mb-2 leading-tight">
                            {item.title}
                          </h3>
                          {item.description && (
                            <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                          )}
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
                          onClick={() => handleRemove(item.id)}
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
    </AppLayout>
  );
};

export default Library;
