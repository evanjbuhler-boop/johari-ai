import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { X, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { ValidationData } from '@/types/checkin';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ValidationScreenProps {
  initialData: ValidationData;
  onConfirm: (data: ValidationData) => void;
  onAdjust: () => void;
}

const EMOTION_OPTIONS = [
  'Anxious', 'Frustrated', 'Sad', 'Angry', 'Numb', 'Confused',
  'Hopeful', 'Calm', 'Overwhelmed', 'Exhausted', 'Restless',
  'Content', 'Worried', 'Defeated', 'Energized'
];

const STRESSOR_OPTIONS = [
  'Work', 'Relationships', 'Sleep', 'Health', 'Money',
  'Identity', 'Family', 'Future uncertainty', 'Loneliness',
  'Performance pressure', 'Time management', 'Social media'
];

const ValidationScreen = ({ initialData, onConfirm, onAdjust }: ValidationScreenProps) => {
  const [data, setData] = useState<ValidationData>(initialData);
  const [showDetails, setShowDetails] = useState(false);
  const [newEmotion, setNewEmotion] = useState('');
  const [newStressor, setNewStressor] = useState('');

  const removeEmotion = (emotion: string) => {
    setData(prev => ({
      ...prev,
      emotions: prev.emotions.filter(e => e !== emotion)
    }));
  };

  const addEmotion = (emotion: string) => {
    if (emotion && !data.emotions.includes(emotion)) {
      setData(prev => ({
        ...prev,
        emotions: [...prev.emotions, emotion]
      }));
      setNewEmotion('');
    }
  };

  const removeStressor = (stressor: string) => {
    setData(prev => ({
      ...prev,
      mainStressors: prev.mainStressors.filter(s => s !== stressor)
    }));
  };

  const addStressor = (stressor: string) => {
    if (stressor && !data.mainStressors.includes(stressor)) {
      setData(prev => ({
        ...prev,
        mainStressors: [...prev.mainStressors, stressor]
      }));
      setNewStressor('');
    }
  };

  const getStressColor = (level: number) => {
    if (level <= 3) return 'from-green-500/20 to-green-600/20';
    if (level <= 6) return 'from-yellow-500/20 to-yellow-600/20';
    return 'from-red-500/20 to-red-600/20';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6 py-8">
        
        {/* Header */}
        <div className="text-center mb-8 animate-in fade-in duration-700">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Here's what I'm picking up from our conversation...
          </h1>
          <p className="text-muted-foreground text-lg">
            Let's make sure I got it right
          </p>
        </div>

        {/* Emotional State */}
        <Card className="p-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            It sounds like you're feeling:
          </h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {data.emotions.map((emotion) => (
              <Badge 
                key={emotion}
                variant="secondary"
                className="px-4 py-2 text-sm flex items-center gap-2 hover:bg-secondary/80 transition-colors"
              >
                {emotion}
                <button
                  onClick={() => removeEmotion(emotion)}
                  className="hover:text-destructive transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Select value={newEmotion} onValueChange={addEmotion}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="+ Add another feeling" />
              </SelectTrigger>
              <SelectContent>
                {EMOTION_OPTIONS.filter(e => !data.emotions.includes(e)).map((emotion) => (
                  <SelectItem key={emotion} value={emotion}>
                    {emotion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Stress Level */}
        <Card className={`p-6 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-100 bg-gradient-to-br ${getStressColor(data.stressLevel)}`}>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Your stress level feels around:
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Low</span>
              <span className="text-xl font-bold text-foreground">{data.stressLevel}</span>
              <span>High</span>
            </div>
            <Slider
              value={[data.stressLevel]}
              onValueChange={([value]) => setData(prev => ({ ...prev, stressLevel: value }))}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
          </div>
        </Card>

        {/* Main Stressors */}
        <Card className="p-6 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-200">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            These seem to be weighing on you:
          </h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {data.mainStressors.map((stressor) => (
              <Badge 
                key={stressor}
                variant="outline"
                className="px-4 py-2 text-sm flex items-center gap-2 hover:bg-accent/10 transition-colors"
              >
                {stressor}
                <button
                  onClick={() => removeStressor(stressor)}
                  className="hover:text-destructive transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Select value={newStressor} onValueChange={addStressor}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="+ Add stressor" />
              </SelectTrigger>
              <SelectContent>
                {STRESSOR_OPTIONS.filter(s => !data.mainStressors.includes(s)).map((stressor) => (
                  <SelectItem key={stressor} value={stressor}>
                    {stressor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Quick Data Points - Collapsible */}
        <Card className="p-6 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between"
          >
            <h2 className="text-xl font-semibold text-foreground">
              A few other things I noticed
            </h2>
            {showDetails ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          
          {showDetails && (
            <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between">
                <span className="text-foreground/80">Sleep:</span>
                <Input
                  value={data.sleepHours ? `${data.sleepHours} hours, ${data.sleepQuality}` : 'Not mentioned'}
                  onChange={(e) => {
                    const match = e.target.value.match(/(\d+)/);
                    if (match) {
                      setData(prev => ({ ...prev, sleepHours: parseInt(match[1]) }));
                    }
                  }}
                  className="w-48 text-right"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground/80">Exercise:</span>
                <Input
                  value={data.exercise || 'Not mentioned'}
                  onChange={(e) => setData(prev => ({ ...prev, exercise: e.target.value }))}
                  className="w-48 text-right"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground/80">Caffeine:</span>
                <Input
                  value={data.caffeineIntake || 'Not mentioned'}
                  onChange={(e) => setData(prev => ({ ...prev, caffeineIntake: e.target.value }))}
                  className="w-48 text-right"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground/80">Conflicts:</span>
                <Input
                  value={data.conflicts || 'Not mentioned'}
                  onChange={(e) => setData(prev => ({ ...prev, conflicts: e.target.value }))}
                  className="w-48 text-right"
                />
              </div>
            </div>
          )}
        </Card>

        {/* Confidence Check */}
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-400">
          <h2 className="text-xl font-semibold text-foreground mb-6 text-center">
            Does this feel accurate?
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => onConfirm(data)}
              size="lg"
              className="px-8"
            >
              Yes, that's right
            </Button>
            <Button
              onClick={onAdjust}
              variant="outline"
              size="lg"
              className="px-8"
            >
              Not quite - let me adjust
            </Button>
          </div>
        </Card>

        {/* Continue Button */}
        <div className="text-center pt-4">
          <Button
            onClick={() => onConfirm(data)}
            size="lg"
            className="px-12"
          >
            Get my recommendations
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ValidationScreen;
