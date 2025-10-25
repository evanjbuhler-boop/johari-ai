import { Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useNeurodiveritySettings } from '@/hooks/useNeurodiveritySettings';

interface NeurodiveritySettingsDialogProps {
  variant?: 'icon' | 'text';
}

const NeurodiveritySettingsDialog = ({ variant = 'icon' }: NeurodiveritySettingsDialogProps) => {
  const { settings, updateSetting } = useNeurodiveritySettings();

  return (
    <Dialog>
      <DialogTrigger asChild>
        {variant === 'icon' ? (
          <Button
            variant="ghost"
            size="icon"
            className="bg-white/40 hover:bg-white/50 text-white backdrop-blur-md border-2 border-white/50 shadow-lg"
            title="Conversation Preferences"
          >
            <Brain className="h-5 w-5" />
          </Button>
        ) : (
          <Button variant="outline" className="gap-2">
            <Brain className="h-4 w-4" />
            Conversation Preferences
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Conversation Preferences
          </DialogTitle>
          <DialogDescription>
            Customize how the AI communicates with you. These settings help make conversations clearer and more comfortable.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="plain-language"
              checked={settings.usePlainLanguage}
              onCheckedChange={(checked) => 
                updateSetting('usePlainLanguage', checked as boolean)
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
              id="content-warnings"
              checked={settings.includeContentWarnings}
              onCheckedChange={(checked) => 
                updateSetting('includeContentWarnings', checked as boolean)
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
              id="one-question"
              checked={settings.oneQuestionPerMessage}
              onCheckedChange={(checked) => 
                updateSetting('oneQuestionPerMessage', checked as boolean)
              }
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="one-question"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Limit questions to one per message
              </Label>
              <p className="text-xs text-muted-foreground">
                Easier to process and respond to
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="visual-progress"
              checked={settings.showVisualProgress}
              onCheckedChange={(checked) => 
                updateSetting('showVisualProgress', checked as boolean)
              }
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="visual-progress"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Show visual progress bar
              </Label>
              <p className="text-xs text-muted-foreground">
                See where you are in the conversation
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="explain-questions"
              checked={settings.explainQuestions}
              onCheckedChange={(checked) => 
                updateSetting('explainQuestions', checked as boolean)
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NeurodiveritySettingsDialog;
