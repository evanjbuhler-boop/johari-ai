import { useState } from 'react';
import { Compass } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useTherapyApproach, THERAPY_APPROACHES, TherapyApproach } from '@/hooks/useTherapyApproach';

interface TherapyApproachDialogProps {
  variant?: 'icon' | 'text';
}

const TherapyApproachDialog = ({ variant = 'icon' }: TherapyApproachDialogProps) => {
  const { settings, setApproach } = useTherapyApproach();
  const [open, setOpen] = useState(false);
  const [tempApproach, setTempApproach] = useState(settings.approach);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      // Reset temp state to current settings when opening
      setTempApproach(settings.approach);
    }
  };

  const handleSave = () => {
    setApproach(tempApproach);
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
            title="Therapy Approach"
          >
            <Compass className="h-5 w-5" />
          </Button>
        ) : (
          <Button variant="outline" className="gap-2">
            <Compass className="h-4 w-4" />
            Therapy Approach
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-primary" />
            Therapy Approach
          </DialogTitle>
          <DialogDescription>
            Choose which therapeutic framework guides your conversation. Blended combines all approaches.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <RadioGroup
            value={tempApproach}
            onValueChange={(value) => setTempApproach(value as TherapyApproach)}
          >
            {THERAPY_APPROACHES.map((approach) => (
              <div key={approach.value} className="flex items-start gap-3">
                <RadioGroupItem
                  value={approach.value}
                  id={approach.value}
                  className="mt-1"
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor={approach.value}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {approach.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {approach.description}
                  </p>
                </div>
              </div>
            ))}
          </RadioGroup>
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

export default TherapyApproachDialog;
