import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SavedItem } from '@/types/checkin';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, Trash2, Play, BookOpen, Sparkles, BookMarked } from 'lucide-react';
import { toast } from 'sonner';

const Library = () => {
  const navigate = useNavigate();
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'podcast' | 'book' | 'exercise' | 'story'>('all');

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('savedItems') || '[]');
    setSavedItems(saved);
  }, []);

  const filteredItems = filter === 'all' 
    ? savedItems 
    : savedItems.filter(item => item.type === filter);

  const handleRemove = (id: string) => {
    const updated = savedItems.filter(item => item.id !== id);
    setSavedItems(updated);
    localStorage.setItem('savedItems', JSON.stringify(updated));
    toast.success('Removed from library');
  };

  const handleAction = (item: SavedItem) => {
    if (item.type === 'podcast' && item.content?.urls) {
      const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
      const url = isIOS ? item.content.urls.applePodcasts : item.content.urls.spotify;
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    } else if (item.type === 'book' && item.content?.sampleUrl) {
      window.open(item.content.sampleUrl, '_blank', 'noopener,noreferrer');
    } else if (item.type === 'exercise') {
      // Navigate to exercise flow
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">📚</span>
            <h1 className="text-2xl font-semibold text-foreground">Your Library</h1>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Description */}
        <p className="text-muted-foreground mb-6">
          Everything you've bookmarked is here.
        </p>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="mb-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="podcast">Podcasts</TabsTrigger>
            <TabsTrigger value="book">Books</TabsTrigger>
            <TabsTrigger value="exercise">Exercises</TabsTrigger>
            <TabsTrigger value="story">Perspectives</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Content */}
        {filteredItems.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {filter === 'all' ? 'Your library is empty' : `No ${filter}s saved yet`}
            </h3>
            <p className="text-muted-foreground mb-6">
              As you explore recommendations, save content here for easy access later.
            </p>
            <Button onClick={() => navigate('/')} className="gap-2">
              Explore Recommendations →
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <Card key={item.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  {/* Type Icon */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-2xl">
                    {item.type === 'podcast' && '🎧'}
                    {item.type === 'book' && '📖'}
                    {item.type === 'exercise' && '✨'}
                    {item.type === 'story' && '📚'}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          {getTypeLabel(item.type)}
                        </p>
                        <h3 className="text-lg font-semibold text-foreground mb-1">
                          {item.title}
                        </h3>
                        {item.subtitle && (
                          <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.savedDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    <Button 
                      size="sm" 
                      onClick={() => handleAction(item)}
                      className="gap-2"
                    >
                      {getIcon(item.type)}
                      <span className="hidden sm:inline">{getActionLabel(item.type)}</span>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleRemove(item.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Library;
