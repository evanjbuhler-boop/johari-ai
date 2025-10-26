import { useState } from 'react';
import { Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useNeurodiveritySettings, NeurodiveritySettings } from '@/hooks/useNeurodiveritySettings';

interface NeurodiveritySettingsDialogProps {
  variant?: 'icon' | 'text';
}

const NeurodiveritySettingsDialog = ({ variant = 'icon' }: NeurodiveritySettingsDialogProps) => {
  const { settings, updateSetting } = useNeurodiveritySettings();
  const [open, setOpen] = useState(false);
  const [tempSettings, setTempSettings] = useState<NeurodiveritySettings>(settings);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      // Reset temp state to current settings when opening
      setTempSettings(settings);
    }
  };

  const handleTempUpdate = (key: keyof NeurodiveritySettings, value: boolean) => {
    setTempSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // Save all settings at once
    Object.entries(tempSettings).forEach(([key, value]) => {
      updateSetting(key as keyof NeurodiveritySettings, value);
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {variant === 'icon' ? (
          <Button
            variant="ghost"
            size="icon"
            className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/30 shadow-sm"
            title="Neurodiversity Toggles"
          >
            <Brain className="h-5 w-5" />
          </Button>
        ) : (
          <Button variant="outline" className="gap-2">
            <Brain className="h-4 w-4" />
            Neurodiversity Toggles
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Neurodiversity Toggles
          </DialogTitle>
          <DialogDescription>
            Customize how the AI communicates with you. These settings help make conversations clearer and more comfortable.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Primary toggle - moved to top */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="explain-questions"
              checked={tempSettings.explainQuestions}
              onCheckedChange={(checked) => 
                handleTempUpdate('explainQuestions', checked as boolean)
              }
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="explain-questions"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Explain why I'm asking questions
              </Label>
              <p className="text-xs text-muted-foreground">
                Understand the purpose behind each question
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="content-warnings"
              checked={tempSettings.includeContentWarnings}
              onCheckedChange={(checked) => 
                handleTempUpdate('includeContentWarnings', checked as boolean)
              }
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="content-warnings"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Include content warnings before heavy topics
              </Label>
              <p className="text-xs text-muted-foreground">
                Get a heads-up before discussing difficult subjects
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="plain-language"
              checked={tempSettings.usePlainLanguage}
              onCheckedChange={(checked) => 
                handleTempUpdate('usePlainLanguage', checked as boolean)
              }
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="plain-language"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Use plain language (avoid metaphors)
              </Label>
              <p className="text-xs text-muted-foreground">
                Responses will be more literal and direct
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="visual-cues"
              checked={tempSettings.offerVisualCues}
              onCheckedChange={(checked) => 
                handleTempUpdate('offerVisualCues', checked as boolean)
              }
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="visual-cues"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Offer visual cues or summaries
              </Label>
              <p className="text-xs text-muted-foreground">
                Include simple icons, illustrations or bullet points to highlight key points
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="genius-mode"
              checked={tempSettings.geniusMode}
              onCheckedChange={(checked) => 
                handleTempUpdate('geniusMode', checked as boolean)
              }
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="genius-mode"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Genius Mode
              </Label>
              <p className="text-xs text-muted-foreground">
                Increase complexity, use advanced vocabulary and challenge yourself with deeper philosophical or analytical prompts
              </p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} className="w-full">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NeurodiveritySettingsDialog;
