import { CheckInResults } from '@/types/checkin';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, BookOpen, Lightbulb, Sparkles, Headphones, BookMarked, ChevronDown, ChevronUp, Bookmark } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface ResultsDisplayProps {
  results: CheckInResults;
  onNewCheckIn: () => void;
}

const ResultsDisplay = ({ results, onNewCheckIn }: ResultsDisplayProps) => {
  const [frameworkExpanded, setFrameworkExpanded] = useState(false);
  const [techniqueExpanded, setTechniqueExpanded] = useState(false);
  const [storyExpanded, setStoryExpanded] = useState(false);

  const handleSave = (type: string, content: string) => {
    const saved = JSON.parse(localStorage.getItem('savedResources') || '[]');
    saved.push({ type, content, timestamp: new Date().toISOString() });
    localStorage.setItem('savedResources', JSON.stringify(saved));
    toast.success(`Saved to your library`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="max-w-4xl mx-auto p-4 md:p-6 py-8 space-y-6">
        
        {/* Reflection Section - Warm gradient background */}
        <Card className="p-8 md:p-10 border-none bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 shadow-lg">
          <p className="text-xl md:text-2xl leading-relaxed text-foreground font-medium">
            {results.reflection}
          </p>
        </Card>

        {/* Framework Section - What's Happening */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <button 
            onClick={() => setFrameworkExpanded(!frameworkExpanded)}
            className="w-full flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl">💡</div>
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">What's Happening</h2>
            </div>
            {frameworkExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
          </button>
          {frameworkExpanded && (
            <div className="mt-4 pt-4 border-t border-border animate-in fade-in slide-in-from-top-2 duration-300">
              <p className="text-base leading-relaxed text-foreground/80">
                {results.framework}
              </p>
            </div>
          )}
        </Card>

        {/* Recommendation Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          
          {/* Podcast Card */}
          {results.recommendations.podcast && (
            <Card className="p-6 hover:shadow-lg transition-all group">
              <div className="flex items-start gap-3 mb-3">
                <div className="text-2xl">🎧</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Listen to This</h3>
                  <p className="text-sm text-foreground/80 leading-relaxed">{results.recommendations.podcast}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" className="flex-1">Play</Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleSave('podcast', results.recommendations.podcast!)}
                >
                  <Bookmark className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          )}

          {/* Article Card */}
          {results.recommendations.article && (
            <Card className="p-6 hover:shadow-lg transition-all group">
              <div className="flex items-start gap-3 mb-3">
                <div className="text-2xl">📖</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Quick Read</h3>
                  <p className="text-sm text-foreground/80 leading-relaxed">{results.recommendations.article}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" className="flex-1">Read</Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleSave('article', results.recommendations.article!)}
                >
                  <Bookmark className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Technique Card - Full width with glow */}
        {results.recommendations.technique && (
          <Card className="p-6 bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-start gap-3 mb-3">
              <div className="text-2xl">✨</div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-foreground mb-2">Try This Tonight</h3>
                <button 
                  onClick={() => setTechniqueExpanded(!techniqueExpanded)}
                  className="text-left w-full"
                >
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {techniqueExpanded ? results.recommendations.technique : results.recommendations.technique.split('.')[0] + '...'}
                  </p>
                </button>
              </div>
              <button onClick={() => setTechniqueExpanded(!techniqueExpanded)}>
                {techniqueExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
              </button>
            </div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" className="flex-1">Start Guided Exercise</Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleSave('technique', results.recommendations.technique!)}
              >
                <Bookmark className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* Story Card - Softest emphasis */}
        {results.story && (
          <Card className="p-6 bg-gradient-to-br from-secondary/5 to-muted/30 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3 mb-3">
              <div className="text-2xl">📚</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">A Different Perspective</h3>
                <p className="text-sm text-foreground/70 leading-relaxed italic">
                  {storyExpanded ? results.story : results.story.split('.').slice(0, 2).join('.') + '...'}
                </p>
              </div>
            </div>
            {!storyExpanded && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="mt-2"
                onClick={() => setStoryExpanded(true)}
              >
                Read more
              </Button>
            )}
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
    </div>
  );
};

export default ResultsDisplay;
