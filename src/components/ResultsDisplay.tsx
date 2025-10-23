import { CheckInResults } from '@/types/checkin';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, BookOpen, Lightbulb, Sparkles } from 'lucide-react';

interface ResultsDisplayProps {
  results: CheckInResults;
  onNewCheckIn: () => void;
}

const ResultsDisplay = ({ results, onNewCheckIn }: ResultsDisplayProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="max-w-4xl mx-auto p-4 md:p-8 py-12">
        <div className="text-center mb-12 animate-in fade-in duration-700">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Your Check-in Summary</h1>
          <p className="text-muted-foreground">Here's what we learned about your day</p>
        </div>

        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          {/* Reflection */}
          <Card className="p-8 border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5">
            <div className="flex items-start gap-3 mb-3">
              <Heart className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
              <h2 className="text-2xl font-semibold text-foreground">Reflection</h2>
            </div>
            <p className="text-lg leading-relaxed text-foreground/90 ml-9">{results.reflection}</p>
          </Card>

          {/* Framework */}
          <Card className="p-8">
            <div className="flex items-start gap-3 mb-3">
              <BookOpen className="w-6 h-6 text-secondary mt-1 flex-shrink-0" />
              <h2 className="text-2xl font-semibold text-foreground">Understanding the Pattern</h2>
            </div>
            <p className="text-base leading-relaxed text-foreground/80 ml-9">{results.framework}</p>
          </Card>

          {/* Recommendations */}
          <Card className="p-8">
            <div className="flex items-start gap-3 mb-4">
              <Lightbulb className="w-6 h-6 text-accent mt-1 flex-shrink-0" />
              <h2 className="text-2xl font-semibold text-foreground">Recommendations</h2>
            </div>
            <div className="space-y-4 ml-9">
              {results.recommendations.podcast && (
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Podcast</h3>
                  <p className="text-foreground/80">{results.recommendations.podcast}</p>
                </div>
              )}
              {results.recommendations.article && (
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Article</h3>
                  <p className="text-foreground/80">{results.recommendations.article}</p>
                </div>
              )}
              {results.recommendations.technique && (
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Technique</h3>
                  <p className="text-foreground/80">{results.recommendations.technique}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Story/Parable */}
          <Card className="p-8 bg-gradient-to-br from-secondary/5 to-accent/5">
            <div className="flex items-start gap-3 mb-3">
              <Sparkles className="w-6 h-6 text-secondary mt-1 flex-shrink-0" />
              <h2 className="text-2xl font-semibold text-foreground">A Story for You</h2>
            </div>
            <p className="text-base leading-relaxed text-foreground/80 ml-9 italic">{results.story}</p>
          </Card>

          <div className="flex justify-center pt-8">
            <Button onClick={onNewCheckIn} size="lg" className="px-8">
              Start New Check-in
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsDisplay;
