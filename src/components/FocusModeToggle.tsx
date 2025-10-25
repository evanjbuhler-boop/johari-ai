import { Focus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFocusMode } from '@/hooks/useFocusMode';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FocusModeToggleProps {
  className?: string;
}

const FocusModeToggle = ({ className }: FocusModeToggleProps) => {
  const { isEnabled, toggle } = useFocusMode();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className={`bg-white hover:bg-gray-100 text-gray-900 border-2 border-gray-200 shadow-sm transition-all ${
              isEnabled ? 'ring-2 ring-primary/40' : ''
            } ${className}`}
            title="Focus Mode"
          >
            <Focus className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">
            {isEnabled ? 'Focus Mode: On' : 'Focus Mode: Off'}
          </p>
          <p className="text-xs text-muted-foreground">
            {isEnabled ? 'Calm colors, no distractions' : 'Click to enable'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default FocusModeToggle;
