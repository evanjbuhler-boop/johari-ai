import { useState, useMemo } from 'react';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

type ToneValue = 'clinical' | 'direct' | 'coaching' | 'compassionate' | 'children';

interface ToneOption {
  value: ToneValue;
  icon: string;
  label: string;
  subtitle: string;
}

const TONE_OPTIONS: ToneOption[] = [
  {
    value: 'clinical',
    icon: '🔬',
    label: 'Clinical',
    subtitle: 'Direct, analytical pattern recognition'
  },
  {
    value: 'direct',
    icon: '⚡',
    label: 'Direct',
    subtitle: 'Clear, no-BS clarity'
  },
  {
    value: 'coaching',
    icon: '🎯',
    label: 'Coaching',
    subtitle: 'Performance-focused, action-oriented'
  },
  {
    value: 'compassionate',
    icon: '💙',
    label: 'Compassionate',
    subtitle: 'Warm, trauma-informed support'
  },
  {
    value: 'children',
    icon: '🧸',
    label: 'Children',
    subtitle: 'Age-appropriate for ages 8-12'
  }
];

interface InsightToneSliderProps {
  value: ToneValue;
  onRegenerating: (isRegenerating: boolean) => void;
  onRegenerated: (newRecommendations: any) => void;
  messages: any[];
}

const InsightToneSlider = ({ value, onRegenerating, onRegenerated, messages }: InsightToneSliderProps) => {
  const { user } = useAuth();
  const [selectedTone, setSelectedTone] = useState<ToneValue>(value);
  const [isChanging, setIsChanging] = useState(false);

  // Convert tone value to slider position (0-4)
  const toneToIndex = (tone: ToneValue): number => {
    return TONE_OPTIONS.findIndex(opt => opt.value === tone);
  };

  // Convert slider position to tone value
  const indexToTone = (index: number): ToneValue => {
    return TONE_OPTIONS[index].value;
  };

  const currentOption = TONE_OPTIONS[toneToIndex(selectedTone)];

  const handleToneChange = async (newIndex: number) => {
    if (!user) {
      toast.error('Please sign in to change insight tone');
      return;
    }

    const newTone = indexToTone(newIndex);
    if (newTone === selectedTone || isChanging) return;

    try {
      setIsChanging(true);
      setSelectedTone(newTone);
      onRegenerating(true);

      // Save to database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ insight_tone: newTone })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Show toast that regeneration is starting
      const toneLabel = TONE_OPTIONS.find(t => t.value === newTone)?.label || newTone;
      toast.loading(`Regenerating insights with ${toneLabel} tone...`, {
        id: 'tone-regeneration',
        duration: Infinity
      });

      // Regenerate recommendations
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          action: 'regenerate',
          messages,
          insightTone: newTone
        }
      });

      toast.dismiss('tone-regeneration');

      if (error) throw error;

      // Update parent component with new recommendations
      onRegenerated(data);
      onRegenerating(false);
      
      toast.success(`Insights updated to ${toneLabel}`);
    } catch (error) {
      console.error('Error regenerating with new tone:', error);
      toast.dismiss('tone-regeneration');
      toast.error('Failed to regenerate insights. Please try again.');
      
      // Revert to previous tone
      setSelectedTone(value);
      onRegenerating(false);
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-white mb-2">
          How should insights be delivered?
        </h3>
      </div>

      {/* Vertical slider layout */}
      <div className="flex gap-6 items-center">
        {/* Vertical slider track */}
        <div className="h-80 py-4">
          <Slider
            value={[toneToIndex(selectedTone)]}
            onValueChange={([newValue]) => handleToneChange(newValue)}
            min={0}
            max={4}
            step={1}
            disabled={isChanging}
            orientation="vertical"
            className="h-full"
            aria-label="Insight tone selector"
          />
        </div>

        {/* Vertical stack of tone options */}
        <div className="flex flex-col gap-3 flex-1">
          {TONE_OPTIONS.map((option, index) => (
            <button
              key={option.value}
              onClick={() => handleToneChange(index)}
              disabled={isChanging}
              className={`flex items-center gap-3 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg p-2 ${
                selectedTone === option.value 
                  ? 'scale-105 bg-white/10' 
                  : 'opacity-60 hover:opacity-100 hover:bg-white/5'
              }`}
              aria-label={`${option.label}: ${option.subtitle}`}
            >
              <span className="text-2xl flex-shrink-0">{option.icon}</span>
              <div className="text-left flex-1">
                <p className="text-sm font-medium text-white leading-tight">
                  {option.label}
                </p>
                <p className="text-xs text-white/70 leading-tight mt-0.5">
                  {option.subtitle}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InsightToneSlider;
