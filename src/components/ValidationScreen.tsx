import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { X, Plus } from 'lucide-react';
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

const CONTRIBUTING_FACTORS = [
  { id: 'work', label: 'Work pressure or upcoming difficult conversations' },
  { id: 'sleep', label: 'Sleep issues (poor quality or insufficient hours)' },
  { id: 'caffeine', label: 'High caffeine, alcohol, or substance changes' },
  { id: 'relationships', label: 'Relationship conflicts or tensions' },
  { id: 'physical', label: 'Physical symptoms (pain, tension, fatigue)' },
  { id: 'life-changes', label: 'Recent life changes or transitions' },
  { id: 'financial', label: 'Financial stress' },
  { id: 'isolation', label: 'Feeling isolated or lacking support' }
];

const SUPPORT_OPTIONS = [
  { id: 'immediate-tools', label: 'Immediate tools to manage anxiety or stress' },
  { id: 'sleep-strategies', label: 'Better sleep strategies' },
  { id: 'communication', label: 'Communication techniques for difficult conversations' },
  { id: 'physical', label: 'Exercise or physical wellness guidance' },
  { id: 'long-term', label: 'Long-term stress management' },
  { id: 'talk', label: 'I just needed to talk this through' }
];

const ValidationScreen = ({ initialData, onConfirm, onAdjust }: ValidationScreenProps) => {
  const [data, setData] = useState<ValidationData>(initialData);
  const [newEmotion, setNewEmotion] = useState('');
  const [showCustomFactor, setShowCustomFactor] = useState(false);

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

  const toggleContributingFactor = (factorId: string) => {
    setData(prev => ({
      ...prev,
      contributingFactors: prev.contributingFactors.includes(factorId)
        ? prev.contributingFactors.filter(f => f !== factorId)
        : [...prev.contributingFactors, factorId]
    }));
  };

  const toggleSupportOption = (optionId: string) => {
    setData(prev => ({
      ...prev,
      desiredSupport: prev.desiredSupport.includes(optionId)
        ? prev.desiredSupport.filter(s => s !== optionId)
        : [...prev.desiredSupport, optionId]
    }));
  };

  const getStressColor = (level: number) => {
    if (level <= 3) return 'from-green-500/20 to-green-600/20';
    if (level <= 6) return 'from-yellow-500/20 to-yellow-600/20';
    return 'from-red-500/20 to-red-600/20';
  };

  const isComplete = data.emotions.length > 0 && 
                     data.patternAccuracy !== null &&
                     (data.patternAccuracy === 'yes' || (data.patternFeedback && data.patternFeedback.trim().length > 0));

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

        {/* SECTION 1: EMOTIONS & STRESS */}
        <Card className="p-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            It sounds like you're feeling:
          </h2>
          
          {/* Emotion Pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {data.emotions.map(emotion => (
              <Badge 
                key={emotion}
                variant="secondary"
                className="px-3 py-2 text-sm flex items-center gap-2 hover:bg-secondary/80 transition-colors"
              >
                {emotion}
                <button
                  onClick={() => removeEmotion(emotion)}
                  className="hover:bg-background/50 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>

          {/* Add Emotion */}
          <div className="mb-6">
            <Select value={newEmotion} onValueChange={addEmotion}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="+ Add another feeling" />
              </SelectTrigger>
              <SelectContent>
                {EMOTION_OPTIONS.filter(e => !data.emotions.includes(e)).map(emotion => (
                  <SelectItem key={emotion} value={emotion}>
                    {emotion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stress Slider */}
          <div className="space-y-4">
            <p className="text-base text-foreground/80">Your stress level feels around:</p>
            <div className={`bg-gradient-to-r ${getStressColor(data.stressLevel)} rounded-lg p-6 space-y-4`}>
              <Slider
                value={[data.stressLevel]}
                onValueChange={([value]) => setData(prev => ({ ...prev, stressLevel: value }))}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm font-medium">
                <span className="text-muted-foreground">Low (1)</span>
                <span className="text-2xl font-bold text-foreground">{data.stressLevel}</span>
                <span className="text-muted-foreground">High (10)</span>
              </div>
            </div>
          </div>
        </Card>

        {/* SECTION 2: CONTRIBUTING FACTORS */}
        <Card className="p-6 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-100">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Here's what seems to be contributing:
          </h2>
          
          <div className="space-y-3 mb-4">
            {CONTRIBUTING_FACTORS.map(factor => (
              <div key={factor.id} className="flex items-start gap-3">
                <Checkbox
                  id={factor.id}
                  checked={data.contributingFactors.includes(factor.id)}
                  onCheckedChange={() => toggleContributingFactor(factor.id)}
                  className="mt-1"
                />
                <Label 
                  htmlFor={factor.id}
                  className="text-base leading-relaxed cursor-pointer flex-1"
                >
                  {factor.label}
                </Label>
              </div>
            ))}
          </div>

          {/* Add Custom Factor */}
          {!showCustomFactor ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCustomFactor(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add another factor
            </Button>
          ) : (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <Textarea
                placeholder="What else is contributing?"
                value={data.customFactor || ''}
                onChange={(e) => setData(prev => ({ ...prev, customFactor: e.target.value }))}
                className="min-h-[80px]"
              />
            </div>
          )}
        </Card>

        {/* SECTION 3: PATTERN CHECK */}
        <Card className="p-6 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-200">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Here's the pattern I'm seeing:
          </h2>
          
          {/* AI Pattern Summary */}
          <div className="bg-primary/5 rounded-lg p-5 mb-6 border border-primary/10">
            <p className="text-lg leading-relaxed text-foreground">
              {data.aiGeneratedPattern || "You're juggling multiple demands while running on insufficient rest. The stress isn't just about one thing—it's the cumulative load of everything happening at once while your body is signaling it needs recovery."}
            </p>
          </div>

          {/* Accuracy Check */}
          <p className="text-base text-foreground/80 mb-3">Does this feel accurate?</p>
          <RadioGroup
            value={data.patternAccuracy || ''}
            onValueChange={(value) => setData(prev => ({ 
              ...prev, 
              patternAccuracy: value as 'yes' | 'partial' | 'no'
            }))}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="yes" id="yes" />
              <Label htmlFor="yes" className="text-base cursor-pointer">
                Yes, that's it
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="partial" id="partial" />
              <Label htmlFor="partial" className="text-base cursor-pointer">
                Partially—something's missing
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="no" id="no" />
              <Label htmlFor="no" className="text-base cursor-pointer">
                Not quite right
              </Label>
            </div>
          </RadioGroup>

          {/* Conditional Feedback */}
          {(data.patternAccuracy === 'partial' || data.patternAccuracy === 'no') && (
            <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <Textarea
                placeholder="What should I know?"
                value={data.patternFeedback || ''}
                onChange={(e) => setData(prev => ({ ...prev, patternFeedback: e.target.value }))}
                className="min-h-[100px]"
              />
            </div>
          )}
        </Card>

        {/* SECTION 4: WHAT WOULD HELP */}
        <Card className="p-6 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            What kind of support would be most helpful right now?
          </h2>
          
          <div className="space-y-3">
            {SUPPORT_OPTIONS.map(option => (
              <div key={option.id} className="flex items-start gap-3">
                <Checkbox
                  id={option.id}
                  checked={data.desiredSupport.includes(option.id)}
                  onCheckedChange={() => toggleSupportOption(option.id)}
                  className="mt-1"
                />
                <Label 
                  htmlFor={option.id}
                  className="text-base leading-relaxed cursor-pointer flex-1"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </Card>

        {/* Continue Button */}
        <div className="flex justify-center pt-4">
          <Button
            size="lg"
            onClick={() => onConfirm(data)}
            disabled={!isComplete}
            className="px-12 py-6 text-lg"
          >
            Continue →
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ValidationScreen;
