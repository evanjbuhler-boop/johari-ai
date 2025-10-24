import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit2, ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
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

type SectionType = 'today' | 'tomorrow' | 'worries' | 'body';

interface SectionData {
  today?: {
    content: string;
    emotions: string[];
  };
  tomorrow?: {
    content: string;
    emotions: string[];
  };
  worries?: string[];
  body: {
    sleepHours: number;
    sleepQuality: string;
    energyLevel: number;
    eating: string;
    physicalNotes: string;
  };
  optionalNotes: string;
}

const SLEEP_QUALITY_OPTIONS = [
  'Great sleep',
  'Slept okay', 
  'Restless',
  'Barely slept',
  'Didn\'t sleep'
];

const EATING_OPTIONS = [
  'Skipped meals',
  'Ate less than usual',
  'Ate normally',
  'Ate more than usual'
];

const ValidationScreen = ({ initialData, onConfirm, onAdjust }: ValidationScreenProps) => {
  const [editingSection, setEditingSection] = useState<SectionType | null>(null);
  const [showOptionalNotes, setShowOptionalNotes] = useState(false);
  const [data, setData] = useState<SectionData>({
    today: initialData.aiGeneratedPattern ? {
      content: initialData.aiGeneratedPattern.split('.')[0] + '.' || 'Today felt challenging',
      emotions: initialData.emotions.slice(0, 2)
    } : undefined,
    tomorrow: undefined,
    worries: initialData.mainStressors.length > 0 ? initialData.mainStressors : undefined,
    body: {
      sleepHours: initialData.sleepHours || 7,
      sleepQuality: initialData.sleepQuality || 'Slept okay',
      energyLevel: 5,
      eating: 'Ate normally',
      physicalNotes: ''
    },
    optionalNotes: ''
  });

  const [tempData, setTempData] = useState<any>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
  }, []);

  const handleEdit = (section: SectionType) => {
    setEditingSection(section);
    setTempData(JSON.parse(JSON.stringify(data[section])));
  };

  const handleSave = (section: SectionType) => {
    setData(prev => ({ ...prev, [section]: tempData }));
    setEditingSection(null);
    setTempData(null);
  };

  const handleCancel = () => {
    setEditingSection(null);
    setTempData(null);
  };

  const handleContinue = () => {
    const validationData: ValidationData = {
      emotions: data.today?.emotions || initialData.emotions,
      stressLevel: initialData.stressLevel,
      mainStressors: data.worries || initialData.mainStressors,
      sleepHours: data.body.sleepHours,
      sleepQuality: data.body.sleepQuality,
      contributingFactors: initialData.contributingFactors,
      patternAccuracy: 'yes',
      desiredSupport: initialData.desiredSupport,
      aiGeneratedPattern: initialData.aiGeneratedPattern
    };
    onConfirm(validationData);
  };

  const renderSection = (
    section: SectionType,
    icon: string,
    title: string,
    bgColor: string,
    borderColor: string
  ) => {
    const isEmpty = !data[section as keyof SectionData] || 
      (Array.isArray(data[section as keyof SectionData]) && (data[section as keyof SectionData] as any[]).length === 0);
    const isEditing = editingSection === section;

    return (
      <div className="relative">
        {/* Timeline dot */}
        <div className={`absolute left-1/2 -translate-x-1/2 -top-6 w-3 h-3 rounded-full border-2 border-background ${borderColor} ${isAnimating ? 'animate-in fade-in zoom-in duration-300' : ''}`} 
          style={{ animationDelay: `${['today', 'tomorrow', 'worries', 'body'].indexOf(section) * 100}ms` }}
        />
        
        {/* Section card */}
        <div 
          className={`max-w-2xl mx-auto transition-all duration-200 ${
            isEditing 
              ? 'bg-background shadow-xl border-2 border-primary p-8' 
              : `${bgColor} shadow-lg p-6`
          } rounded-xl border-l-4 ${borderColor} ${
            isAnimating ? 'animate-in fade-in slide-in-from-bottom-2 duration-500' : ''
          }`}
          style={{ animationDelay: `${['today', 'tomorrow', 'worries', 'body'].indexOf(section) * 100 + 100}ms` }}
        >
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <span className="text-2xl">{icon}</span>
              {title}
            </h2>
            {!isEditing && (
              <button
                onClick={() => handleEdit(section)}
                className="text-sm text-primary font-medium hover:text-primary/80 flex items-center gap-1 transition-colors"
              >
                {isEmpty ? 'Add' : 'Edit'}
                <Edit2 className="h-4 w-4" />
              </button>
            )}
          </div>

          {isEmpty && !isEditing ? (
            <div className="border-2 border-dashed border-border bg-muted/30 rounded-lg p-4">
              <p className="text-muted-foreground italic text-sm">
                We didn't get to this tonight.
              </p>
            </div>
          ) : isEditing ? (
            renderEditMode(section)
          ) : (
            renderViewMode(section)
          )}

          {isEditing && (
            <div className="flex items-center justify-end gap-2 mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="gap-1"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleSave(section)}
                className="gap-1"
              >
                <Check className="h-4 w-4" />
                Save
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderViewMode = (section: SectionType) => {
    if (section === 'today' && data.today) {
      return (
        <div className="space-y-2">
          <p className="text-base text-foreground leading-relaxed">
            "{data.today.content}"
          </p>
          {data.today.emotions.length > 0 && (
            <p className="text-sm text-muted-foreground">
              🎭 {data.today.emotions.join(', ')}
            </p>
          )}
        </div>
      );
    }

    if (section === 'tomorrow' && data.tomorrow) {
      return (
        <div className="space-y-2">
          <p className="text-base text-foreground leading-relaxed">
            "{data.tomorrow.content}"
          </p>
          {data.tomorrow.emotions.length > 0 && (
            <p className="text-sm text-muted-foreground">
              😰 {data.tomorrow.emotions.join(', ')}
            </p>
          )}
        </div>
      );
    }

    if (section === 'worries' && data.worries) {
      return (
        <ul className="space-y-2">
          {data.worries.map((worry, idx) => (
            <li key={idx} className="text-base text-foreground flex items-start gap-2">
              <span className="text-muted-foreground">•</span>
              <span>{worry}</span>
            </li>
          ))}
        </ul>
      );
    }

    if (section === 'body') {
      return (
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-foreground font-medium">Sleep:</span>
            <span className="text-muted-foreground">
              {data.body.sleepHours} hours ({data.body.sleepQuality.toLowerCase()})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-foreground font-medium">Energy level:</span>
            <span className="text-muted-foreground">
              {data.body.energyLevel}/10
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-foreground font-medium">Eating today:</span>
            <span className="text-muted-foreground">{data.body.eating}</span>
          </div>
          {data.body.physicalNotes && (
            <div className="flex items-start gap-2">
              <span className="text-foreground font-medium">Physical notes:</span>
              <span className="text-muted-foreground">{data.body.physicalNotes}</span>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  const renderEditMode = (section: SectionType) => {
    if (section === 'today' || section === 'tomorrow') {
      return (
        <div className="space-y-4">
          <Textarea
            value={tempData?.content || ''}
            onChange={(e) => setTempData({ ...tempData, content: e.target.value })}
            placeholder={section === 'today' ? "What stood out today?" : "What's on your mind about tomorrow?"}
            className="min-h-[100px]"
          />
          <div className="text-sm text-muted-foreground">
            We'll update your emotional tags after you save
          </div>
        </div>
      );
    }

    if (section === 'worries') {
      return (
        <Textarea
          value={tempData?.join('\n') || ''}
          onChange={(e) => setTempData(e.target.value.split('\n').filter(Boolean))}
          placeholder="What's weighing on you? (One worry per line)"
          className="min-h-[120px]"
        />
      );
    }

    if (section === 'body') {
      return (
        <div className="space-y-6">
          {/* Sleep */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sleep-hours" className="text-sm font-medium">💤 Hours slept</Label>
              <Input
                id="sleep-hours"
                type="number"
                min="0"
                max="12"
                value={tempData?.sleepHours || 0}
                onChange={(e) => setTempData({ ...tempData, sleepHours: parseInt(e.target.value) || 0 })}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sleep-quality" className="text-sm font-medium">How was it?</Label>
              <Select
                value={tempData?.sleepQuality || 'Slept okay'}
                onValueChange={(value) => setTempData({ ...tempData, sleepQuality: value })}
              >
                <SelectTrigger id="sleep-quality">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SLEEP_QUALITY_OPTIONS.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Energy Level */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">⚡ Energy level: {tempData?.energyLevel || 5}/10</Label>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground">Low</span>
              <Slider
                value={[tempData?.energyLevel || 5]}
                onValueChange={([value]) => setTempData({ ...tempData, energyLevel: value })}
                min={1}
                max={10}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground">High</span>
            </div>
          </div>

          {/* Eating */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">🍽️ Eating today</Label>
            <div className="space-y-2">
              {EATING_OPTIONS.map(option => (
                <label key={option} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="eating"
                    value={option}
                    checked={tempData?.eating === option}
                    onChange={(e) => setTempData({ ...tempData, eating: e.target.value })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Physical Notes */}
          <div className="space-y-2">
            <Label htmlFor="physical-notes" className="text-sm font-medium">
              📝 Physical notes
              <span className="text-xs text-muted-foreground ml-2">
                {tempData?.physicalNotes?.length || 0}/200
              </span>
            </Label>
            <Textarea
              id="physical-notes"
              value={tempData?.physicalNotes || ''}
              onChange={(e) => setTempData({ ...tempData, physicalNotes: e.target.value.slice(0, 200) })}
              placeholder="Tension headache, feeling wired..."
              className="min-h-[80px]"
              maxLength={200}
            />
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-12 space-y-3 animate-in fade-in duration-500">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Let's Make Sure I Got This Right
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            You shared a lot tonight. Before I put together your recommendations, 
            take a moment to review and refine what you told me. Your words shape what comes next.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative space-y-12">
          {/* Timeline line */}
          <div 
            className={`absolute left-1/2 -translate-x-1/2 top-0 w-0.5 bg-border ${
              isAnimating ? 'animate-in fade-in slide-in-from-top duration-500' : ''
            }`}
            style={{ height: 'calc(100% - 48px)' }}
          />

          {renderSection('today', '🌅', "TODAY'S MOMENT", 'bg-emerald-50/50', 'border-l-emerald-400')}
          {renderSection('tomorrow', '🔮', "TOMORROW'S CHALLENGE", 'bg-blue-50/50', 'border-l-blue-400')}
          {renderSection('worries', '💭', "WHAT'S WEIGHING ON YOU", 'bg-rose-50/50', 'border-l-rose-400')}
          {renderSection('body', '⚡', "HOW YOUR BODY'S DOING", 'bg-teal-50/50', 'border-l-teal-400')}
        </div>

        {/* Optional Notes */}
        <div className="mt-12 max-w-2xl mx-auto">
          {!showOptionalNotes ? (
            <button
              onClick={() => setShowOptionalNotes(true)}
              className="w-full p-4 border-2 border-dashed border-border bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors text-center"
            >
              <p className="text-sm text-muted-foreground">
                Anything else I should know before I put together your recommendations?
              </p>
              <p className="text-xs text-muted-foreground mt-1">Click to add notes...</p>
            </button>
          ) : (
            <div className="space-y-2 animate-in fade-in slide-in-from-bottom duration-300">
              <Label htmlFor="optional-notes" className="text-sm font-medium">
                Additional notes
                <span className="text-xs text-muted-foreground ml-2">
                  {data.optionalNotes.length}/500
                </span>
              </Label>
              <Textarea
                id="optional-notes"
                value={data.optionalNotes}
                onChange={(e) => setData(prev => ({ ...prev, optionalNotes: e.target.value.slice(0, 500) }))}
                placeholder="Add any context that might help..."
                className="min-h-[120px]"
                maxLength={500}
              />
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center space-y-6 animate-in fade-in duration-500 delay-300">
          <p className="text-sm text-muted-foreground">
            Once you click 'This Looks Good', I'll generate your personalized recommendations.<br />
            This usually takes about 10 seconds.
          </p>
          
          <div className="flex flex-col-reverse md:flex-row items-center justify-center gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={onAdjust}
              className="gap-2 rounded-full px-8"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Chat
            </Button>
            <Button
              size="lg"
              onClick={handleContinue}
              className="gap-2 rounded-full px-8"
            >
              This Looks Good
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidationScreen;
