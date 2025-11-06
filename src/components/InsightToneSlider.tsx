import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface DimensionalTone {
  directness: number;      // 0-100: Exploratory → Direct
  warmth: number;          // 0-100: Analytical → Compassionate
  orientation: number;     // 0-100: Reflective → Coaching
  language: number;        // 0-100: Accessible → Technical
  citations: boolean;
  ageAppropriate: boolean;
}

// Preset mappings for backward compatibility
const PRESETS: Record<string, DimensionalTone> = {
  clinical: {
    directness: 75,
    warmth: 25,
    orientation: 50,
    language: 90,
    citations: true,
    ageAppropriate: false,
  },
  direct: {
    directness: 90,
    warmth: 40,
    orientation: 60,
    language: 30,
    citations: false,
    ageAppropriate: false,
  },
  coaching: {
    directness: 70,
    warmth: 65,
    orientation: 85,
    language: 25,
    citations: false,
    ageAppropriate: false,
  },
  compassionate: {
    directness: 35,
    warmth: 90,
    orientation: 40,
    language: 20,
    citations: false,
    ageAppropriate: false,
  },
  children: {
    directness: 50,
    warmth: 80,
    orientation: 60,
    language: 10,
    citations: false,
    ageAppropriate: true,
  },
};

const DEFAULT_TONE: DimensionalTone = {
  directness: 60,
  warmth: 55,
  orientation: 50,
  language: 35,
  citations: false,
  ageAppropriate: false,
};

interface InsightToneSliderProps {
  value: any; // Legacy tone or dimensional tone
  onRegenerating: (isRegenerating: boolean) => void;
  onRegenerated: (newRecommendations: any) => void;
  messages: any[];
}

const InsightToneSlider = ({ value, onRegenerating, onRegenerated, messages }: InsightToneSliderProps) => {
  const { user } = useAuth();
  
  // Parse incoming value - handle both legacy and dimensional formats
  const parseDimensionalTone = (val: any): DimensionalTone => {
    if (typeof val === 'string' && PRESETS[val]) {
      return PRESETS[val];
    }
    if (typeof val === 'object' && val.directness !== undefined) {
      return val as DimensionalTone;
    }
    return DEFAULT_TONE;
  };

  const [tone, setTone] = useState<DimensionalTone>(parseDimensionalTone(value));
  const [isChanging, setIsChanging] = useState(false);

  const handleDimensionChange = (dimension: keyof DimensionalTone, newValue: number | boolean) => {
    const updatedTone = { ...tone, [dimension]: newValue };
    setTone(updatedTone);
  };

  const handleApplyChanges = async () => {
    if (!user) {
      toast.error('Please sign in to change insight tone');
      return;
    }

    if (isChanging) return;

    try {
      setIsChanging(true);
      onRegenerating(true);

      // Save to database - store as JSON
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ insight_tone: JSON.stringify(tone) })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast.loading('Regenerating insights with new settings...', {
        id: 'tone-regeneration',
        duration: Infinity
      });

      // Regenerate recommendations
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          action: 'regenerate',
          messages,
          insightTone: tone
        }
      });

      toast.dismiss('tone-regeneration');

      if (error) throw error;

      // Update parent component with new recommendations
      onRegenerated(data);
      onRegenerating(false);
      
      toast.success('Insights updated');
    } catch (error) {
      console.error('Error regenerating with new tone:', error);
      toast.dismiss('tone-regeneration');
      toast.error('Failed to regenerate insights. Please try again.');
      
      setTone(parseDimensionalTone(value));
      onRegenerating(false);
    } finally {
      setIsChanging(false);
    }
  };

  const loadPreset = (presetName: string) => {
    if (PRESETS[presetName]) {
      setTone(PRESETS[presetName]);
    }
  };

  // Check if current tone matches a preset
  const getMatchingPreset = (): string | null => {
    for (const [presetName, presetValues] of Object.entries(PRESETS)) {
      const matches = 
        Math.abs(tone.directness - presetValues.directness) <= 5 &&
        Math.abs(tone.warmth - presetValues.warmth) <= 5 &&
        Math.abs(tone.orientation - presetValues.orientation) <= 5 &&
        Math.abs(tone.language - presetValues.language) <= 5 &&
        tone.citations === presetValues.citations &&
        tone.ageAppropriate === presetValues.ageAppropriate;
      
      if (matches) return presetName;
    }
    return null;
  };

  const activePreset = getMatchingPreset();

  return (
    <div className="w-full space-y-6">
      <div className="mb-4 text-center">
        <h3 className="text-base font-semibold text-white mb-2">
          Insight Sliders
        </h3>
        {activePreset && (
          <p className="text-xs text-primary/90 animate-fade-in">
            Preset: <span className="font-medium">{activePreset.charAt(0).toUpperCase() + activePreset.slice(1)}</span>
          </p>
        )}
      </div>

      {/* Dimensional Sliders */}
      <div className="space-y-5">
        {/* Directness */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-white/70">
            <span>Exploratory</span>
            <span>Direct</span>
          </div>
          <Slider
            value={[tone.directness]}
            onValueChange={([val]) => handleDimensionChange('directness', val)}
            min={0}
            max={100}
            step={1}
            disabled={isChanging}
            className="w-full"
          />
          <p className="text-xs text-white/60 text-center">Directness</p>
        </div>

        {/* Warmth */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-white/70">
            <span>Analytical</span>
            <span>Compassionate</span>
          </div>
          <Slider
            value={[tone.warmth]}
            onValueChange={([val]) => handleDimensionChange('warmth', val)}
            min={0}
            max={100}
            step={1}
            disabled={isChanging}
            className="w-full"
          />
          <p className="text-xs text-white/60 text-center">Warmth</p>
        </div>

        {/* Orientation */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-white/70">
            <span>Reflective</span>
            <span>Coaching</span>
          </div>
          <Slider
            value={[tone.orientation]}
            onValueChange={([val]) => handleDimensionChange('orientation', val)}
            min={0}
            max={100}
            step={1}
            disabled={isChanging}
            className="w-full"
          />
          <p className="text-xs text-white/60 text-center">Orientation</p>
        </div>

        {/* Language */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-white/70">
            <span>Accessible</span>
            <span>Technical</span>
          </div>
          <Slider
            value={[tone.language]}
            onValueChange={([val]) => handleDimensionChange('language', val)}
            min={0}
            max={100}
            step={1}
            disabled={isChanging}
            className="w-full"
          />
          <p className="text-xs text-white/60 text-center">Language</p>
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-3 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <Label htmlFor="citations" className="text-sm text-white cursor-pointer">
            Include research citations
          </Label>
          <Switch
            id="citations"
            checked={tone.citations}
            onCheckedChange={(checked) => handleDimensionChange('citations', checked)}
            disabled={isChanging}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="ageAppropriate" className="text-sm text-white cursor-pointer">
            Age-appropriate (8-12)
          </Label>
          <Switch
            id="ageAppropriate"
            checked={tone.ageAppropriate}
            onCheckedChange={(checked) => handleDimensionChange('ageAppropriate', checked)}
            disabled={isChanging}
          />
        </div>
      </div>

      {/* Quick Presets */}
      <div className="pt-4 border-t border-white/10">
        <p className="text-xs text-white/70 mb-2 text-center">Quick presets:</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {Object.keys(PRESETS).map((presetName) => {
            const isActive = activePreset === presetName;
            return (
              <Button
                key={presetName}
                onClick={() => loadPreset(presetName)}
                disabled={isChanging}
                variant="outline"
                size="sm"
                className={`text-xs transition-all duration-300 ${
                  isActive
                    ? 'bg-primary/20 hover:bg-primary/30 border-primary/50 text-white font-semibold animate-scale-in'
                    : 'bg-white/5 hover:bg-white/10 border-white/20 text-white hover:scale-105'
                }`}
                style={isActive ? {
                  boxShadow: '0 0 20px hsl(var(--primary) / 0.6), 0 0 40px hsl(var(--primary) / 0.3)'
                } : undefined}
              >
                {presetName.charAt(0).toUpperCase() + presetName.slice(1)}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Apply Button */}
      <Button
        onClick={handleApplyChanges}
        disabled={isChanging}
        className="w-full bg-white/10 hover:bg-white/20 text-white"
      >
        {isChanging ? 'Applying...' : 'Apply Changes'}
      </Button>
    </div>
  );
};

export default InsightToneSlider;
