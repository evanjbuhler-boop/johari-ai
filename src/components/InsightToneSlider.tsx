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
    <div className="w-full mb-6 p-6 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-1">
          How should insights be delivered?
        </h3>
      </div>

      {/* Desktop/Tablet View */}
      <div className="hidden sm:block">
        <div className="relative">
          {/* Grid container for icons and slider alignment */}
          <div className="grid grid-cols-5 gap-2 mb-2">
            {TONE_OPTIONS.map((option, index) => (
              <button
                key={option.value}
                onClick={() => handleToneChange(index)}
                disabled={isChanging}
                className={`flex flex-col items-center gap-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary rounded-lg p-2 ${
                  selectedTone === option.value 
                    ? 'scale-110' 
                    : 'opacity-50 hover:opacity-100 hover:scale-105'
                }`}
                aria-label={`${option.label}: ${option.subtitle}`}
              >
                <span className="text-2xl">{option.icon}</span>
                <span className="text-xs font-medium text-foreground whitespace-nowrap">
                  {option.label}
                </span>
              </button>
            ))}
          </div>

          {/* Slider track with matching grid */}
          <div className="relative py-4 px-[10%]">
            <Slider
              value={[toneToIndex(selectedTone)]}
              onValueChange={([newValue]) => handleToneChange(newValue)}
              min={0}
              max={4}
              step={1}
              disabled={isChanging}
              className="w-full"
              aria-label="Insight tone selector"
            />
          </div>
        </div>

        {/* Selected subtitle */}
        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground">{currentOption.subtitle}</p>
        </div>
      </div>

      {/* Mobile View */}
      <div className="block sm:hidden">
        <div className="flex justify-between items-start mb-4">
          {TONE_OPTIONS.map((option, index) => (
            <button
              key={option.value}
              onClick={() => handleToneChange(index)}
              disabled={isChanging}
              className={`flex flex-col items-center gap-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary rounded-lg p-2 min-h-[44px] min-w-[44px] ${
                selectedTone === option.value 
                  ? 'scale-110' 
                  : 'opacity-50'
              }`}
              aria-label={`${option.label}: ${option.subtitle}`}
            >
              <span className="text-xl">{option.icon}</span>
            </button>
          ))}
        </div>

        {/* Selected label and subtitle for mobile */}
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">{currentOption.label}</p>
          <p className="text-xs text-muted-foreground mt-1">{currentOption.subtitle}</p>
        </div>
      </div>
    </div>
  );
};

export default InsightToneSlider;
