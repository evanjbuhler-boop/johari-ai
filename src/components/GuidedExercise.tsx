import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, X, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface Step {
  stepNumber: number;
  title: string;
  content: string;
  inputRequired: boolean;
  inputType?: 'text' | 'textarea';
}

interface GuidedExerciseProps {
  open: boolean;
  onClose: () => void;
  title: string;
  steps: Step[];
}

const GuidedExercise = ({ open, onClose, title, steps }: GuidedExerciseProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<number, string>>({});

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleEmailToMe = () => {
    const body = Object.entries(responses)
      .map(([stepNum, response]) => {
        const s = steps[parseInt(stepNum)];
        return `${s.title}\n\n${response}\n\n---\n\n`;
      })
      .join('');
    
    const subject = encodeURIComponent(`Your reflection from ${new Date().toLocaleDateString()}`);
    const emailBody = encodeURIComponent(`${title}\n\n${body}`);
    window.open(`mailto:?subject=${subject}&body=${emailBody}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-border pb-4 mb-6">
          <h2 className="text-2xl font-semibold text-foreground mb-4">{title}</h2>
          
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-medium text-foreground mb-4">
              {step.title}
            </h3>
            <p className="text-base text-foreground/80 leading-relaxed whitespace-pre-line">
              {step.content}
            </p>
          </div>

          {/* Input Field */}
          {step.inputRequired && (
            <div className="space-y-2">
              {step.inputType === 'textarea' ? (
                <Textarea
                  value={responses[currentStep] || ''}
                  onChange={(e) => setResponses({ ...responses, [currentStep]: e.target.value })}
                  placeholder="Write your thoughts here..."
                  className="min-h-[150px]"
                />
              ) : (
                <Input
                  value={responses[currentStep] || ''}
                  onChange={(e) => setResponses({ ...responses, [currentStep]: e.target.value })}
                  placeholder="Your response..."
                />
              )}
              <p className="text-xs text-muted-foreground">
                There's no right or wrong answer. Just write what comes to mind.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        {isLastStep ? (
          <div className="border-t border-border pt-6 mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Would you like to email these reflections to yourself?
            </p>
            <Button onClick={handleEmailToMe} className="w-full gap-2">
              <Mail className="w-4 h-4" />
              Email to Me
            </Button>
            <Button onClick={onClose} variant="ghost" className="w-full">
              Close
            </Button>
          </div>
        ) : (
          <div className="flex justify-between border-t border-border pt-6 mt-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isFirstStep}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button onClick={handleNext} className="gap-2">
              Next Step
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GuidedExercise;
