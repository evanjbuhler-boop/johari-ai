import { useState } from 'react';
import { X, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface DimensionalTone {
  directness: number;
  warmth: number;
  orientation: number;
  language: number;
  citations: boolean;
  ageAppropriate: boolean;
  contentStructure: string;
  responseLength: string;
}

const PRESETS: Record<string, DimensionalTone> = {
  clinical: { directness: 75, warmth: 25, orientation: 50, language: 90, citations: true, ageAppropriate: false, contentStructure: 'structured', responseLength: 'detailed' },
  direct: { directness: 90, warmth: 40, orientation: 60, language: 30, citations: false, ageAppropriate: false, contentStructure: 'structured', responseLength: 'concise' },
  coaching: { directness: 70, warmth: 65, orientation: 85, language: 25, citations: false, ageAppropriate: false, contentStructure: 'actionable', responseLength: 'balanced' },
  compassionate: { directness: 35, warmth: 90, orientation: 40, language: 20, citations: false, ageAppropriate: false, contentStructure: 'narrative', responseLength: 'detailed' },
  children: { directness: 50, warmth: 80, orientation: 60, language: 10, citations: false, ageAppropriate: true, contentStructure: 'simple', responseLength: 'concise' },
};

const DEFAULT_TONE: DimensionalTone = {
  directness: 60,
  warmth: 55,
  orientation: 50,
  language: 35,
  citations: false,
  ageAppropriate: false,
  contentStructure: 'structured',
  responseLength: 'balanced',
};

interface InsightControlsProps {
  value: any;
  onRegenerating: (isRegenerating: boolean) => void;
  onRegenerated: (newResults: any) => void;
  messages: any[];
  onOpenChange?: (isOpen: boolean) => void;
}

export default function InsightControls({
  value,
  onRegenerating,
  onRegenerated,
  messages,
  onOpenChange,
}: InsightControlsProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
  };
  
  const parseDimensionalTone = (val: any): DimensionalTone => {
    if (typeof val === 'string' && PRESETS[val]) return PRESETS[val];
    if (typeof val === 'object' && val.directness !== undefined) return val as DimensionalTone;
    return DEFAULT_TONE;
  };

  const [tone, setTone] = useState<DimensionalTone>(parseDimensionalTone(value));
  const [isChanging, setIsChanging] = useState(false);

  const handleDimensionChange = (dimension: keyof DimensionalTone, newValue: number | boolean | string) => {
    setTone({ ...tone, [dimension]: newValue });
  };

  const handleSaveSettings = async () => {
    if (!user) {
      toast.error('Please sign in to save settings');
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ insight_tone: JSON.stringify(tone) })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast.success('Settings saved for future sessions');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    }
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

      console.log('Starting insight regeneration with tone:', tone);
      console.log('Messages count:', messages?.length);
      console.log('User ID:', user.id);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ insight_tone: JSON.stringify(tone) })
        .eq('id', user.id);

      if (updateError) {
        console.error('Failed to update profile:', updateError);
        throw updateError;
      }

      toast.loading('Regenerating insights with new settings...', {
        id: 'tone-regeneration',
        duration: Infinity
      });

      console.log('Calling edge function with body:', {
        action: 'regenerate',
        messagesCount: messages?.length,
        insightTone: tone
      });

      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          action: 'regenerate',
          messages,
          insightTone: tone
        }
      });

      toast.dismiss('tone-regeneration');

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (!data) {
        console.error('No data returned from regeneration');
        throw new Error('No data returned');
      }

      console.log('Regeneration successful, updating UI with:', data);
      onRegenerated(data);
      onRegenerating(false);
      
      toast.success('Insights updated');
      setIsOpen(false);
      handleOpenChange(false);
    } catch (error: any) {
      console.error('Error regenerating with new tone:', error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        response: error?.response
      });
      toast.dismiss('tone-regeneration');
      toast.error(`Failed to regenerate insights: ${error?.message || 'Please try again'}`);
      
      setTone(parseDimensionalTone(value));
      onRegenerating(false);
    } finally {
      setIsChanging(false);
    }
  };

  const loadPreset = (presetName: string) => {
    if (PRESETS[presetName]) setTone(PRESETS[presetName]);
  };

  const getMatchingPreset = (): string | null => {
    for (const [presetName, presetValues] of Object.entries(PRESETS)) {
      const matches = 
        Math.abs(tone.directness - presetValues.directness) <= 5 &&
        Math.abs(tone.warmth - presetValues.warmth) <= 5 &&
        Math.abs(tone.orientation - presetValues.orientation) <= 5 &&
        Math.abs(tone.language - presetValues.language) <= 5 &&
        tone.citations === presetValues.citations &&
        tone.ageAppropriate === presetValues.ageAppropriate &&
        tone.contentStructure === presetValues.contentStructure &&
        tone.responseLength === presetValues.responseLength;
      
      if (matches) return presetName;
    }
    return null;
  };

  const activePreset = getMatchingPreset();

  return (
    <>
      {/* Trigger Button */}
      <Button
        onClick={() => handleOpenChange(!isOpen)}
        variant="ghost"
        size="sm"
        className="gap-2 group relative overflow-hidden bg-gradient-to-r from-primary/20 to-accent/20 hover:from-primary/30 hover:to-accent/30 border border-primary/30 text-white font-medium transition-all duration-300 hover:scale-105"
      >
        <Sliders className="w-4 h-4" />
        <span className="relative z-10">Insight Controls</span>
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </Button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in duration-300"
          onClick={() => handleOpenChange(false)}
        />
      )}

      {/* Left Panel - Sliders */}
      <aside
        className={`fixed left-0 top-0 h-full w-80 bg-gradient-to-br from-primary/20 via-secondary/15 to-accent/15 backdrop-blur-xl border-r border-primary/10 z-50 shadow-2xl transition-transform duration-500 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background/30 via-transparent to-background/10 pointer-events-none" />
        
        <div className="relative h-full flex flex-col p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Tone Sliders</h3>
            <Button
              onClick={() => handleOpenChange(false)}
              variant="ghost"
              size="icon"
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Preset Indicator */}
          <p className="text-xs text-gray-400 mb-4 text-center">
            Preset: <span className="font-medium">{activePreset ? activePreset.charAt(0).toUpperCase() + activePreset.slice(1) : 'Custom'}</span>
          </p>

          {/* Sliders */}
          <div className="space-y-5 mb-6">
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
              />
              <p className="text-xs text-white/60 text-center">Directness</p>
            </div>

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
              />
              <p className="text-xs text-white/60 text-center">Warmth</p>
            </div>

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
              />
              <p className="text-xs text-white/60 text-center">Orientation</p>
            </div>

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
              />
              <p className="text-xs text-white/60 text-center">Language</p>
            </div>
          </div>

          {/* Presets */}
          <div className="pt-4 border-t border-white/10 mb-6">
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
                    className={`text-xs transition-all duration-200 ${
                      isActive
                        ? 'bg-primary/15 hover:bg-primary/25 border-primary/40 text-white font-medium'
                        : 'bg-white/5 hover:bg-white/10 border-white/20 text-white'
                    }`}
                  >
                    {presetName.charAt(0).toUpperCase() + presetName.slice(1)}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4 pt-6">
            <Button
              onClick={handleSaveSettings}
              disabled={isChanging}
              variant="ghost"
              className="w-full text-white/80 hover:text-white hover:bg-white/5 border border-white/10 font-normal text-sm h-9"
            >
              Save for Future Sessions
            </Button>
            <Button
              onClick={handleApplyChanges}
              disabled={isChanging}
              className="w-full bg-primary/70 hover:bg-primary/80 text-white font-medium text-sm h-10 shadow-sm"
            >
              {isChanging ? 'Applying...' : 'Apply Changes'}
            </Button>
          </div>
        </div>
      </aside>

      {/* Right Panel - Toggles */}
      <aside
        className={`fixed right-0 top-0 h-full w-80 bg-gradient-to-bl from-primary/20 via-secondary/15 to-accent/15 backdrop-blur-xl border-l border-primary/10 z-50 shadow-2xl transition-transform duration-500 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background/30 via-transparent to-background/10 pointer-events-none" />
        
        <div className="relative h-full flex flex-col p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Options</h3>

          <div className="space-y-6">
            {/* Citations Toggle */}
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
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

            {/* Age Appropriate Toggle */}
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
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

            {/* Content Structure */}
            <div className="space-y-2 p-4 bg-white/5 rounded-lg border border-white/10">
              <Label className="text-sm text-white">Content Structure</Label>
              <div className="flex flex-col gap-2">
                {['structured', 'narrative', 'actionable', 'simple'].map((structure) => (
                  <button
                    key={structure}
                    onClick={() => handleDimensionChange('contentStructure', structure)}
                    disabled={isChanging}
                    className={`px-3 py-2 text-xs rounded transition-colors ${
                      tone.contentStructure === structure
                        ? 'bg-primary/40 text-white border border-primary/60'
                        : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    {structure.charAt(0).toUpperCase() + structure.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Response Length */}
            <div className="space-y-2 p-4 bg-white/5 rounded-lg border border-white/10">
              <Label className="text-sm text-white">Response Length</Label>
              <div className="flex flex-col gap-2">
                {['concise', 'balanced', 'detailed'].map((length) => (
                  <button
                    key={length}
                    onClick={() => handleDimensionChange('responseLength', length)}
                    disabled={isChanging}
                    className={`px-3 py-2 text-xs rounded transition-colors ${
                      tone.responseLength === length
                        ? 'bg-primary/40 text-white border border-primary/60'
                        : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    {length.charAt(0).toUpperCase() + length.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
