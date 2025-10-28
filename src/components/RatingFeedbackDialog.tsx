import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useState } from 'react';

interface RatingFeedbackDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (feedback: string, quickReason?: string) => void;
  recommendationType: string;
  recommendationTitle: string;
}

const RatingFeedbackDialog = ({ 
  open, 
  onClose, 
  onSubmit, 
  recommendationType, 
  recommendationTitle 
}: RatingFeedbackDialogProps) => {
  const [quickReason, setQuickReason] = useState<string>('');
  const [customFeedback, setCustomFeedback] = useState('');

  const quickReasons: Record<string, string[]> = {
    podcast: [
      "Not interested in this topic",
      "Too long for me",
      "Already listened to this",
      "Prefer different format",
      "Host style doesn't resonate"
    ],
    book: [
      "Not interested in this topic",
      "Too long/academic",
      "Already read this",
      "Looking for different perspective",
      "Not my reading style"
    ],
    exercise: [
      "Too time-consuming",
      "Not relevant to my situation",
      "Already familiar with this",
      "Prefer different approach",
      "Seems too difficult/complex"
    ],
    story: [
      "Doesn't relate to my situation",
      "Cultural context unclear",
      "Message isn't resonating",
      "Looking for different perspective",
      "Story feels too abstract"
    ]
  };

  const handleSubmit = () => {
    const feedback = customFeedback.trim() || quickReason;
    onSubmit(feedback, quickReason || undefined);
    setQuickReason('');
    setCustomFeedback('');
    onClose();
  };

  const handleSkip = () => {
    onSubmit('', undefined);
    setQuickReason('');
    setCustomFeedback('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Help us improve</DialogTitle>
          <DialogDescription>
            Why wasn't "{recommendationTitle}" a good fit? Your feedback helps us recommend better content for you and others.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Quick reasons */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Quick reason (optional)</Label>
            <RadioGroup value={quickReason} onValueChange={setQuickReason}>
              {quickReasons[recommendationType]?.map((reason, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason} id={`reason-${idx}`} />
                  <Label 
                    htmlFor={`reason-${idx}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {reason}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Custom feedback */}
          <div className="space-y-2">
            <Label htmlFor="custom-feedback" className="text-sm font-medium">
              Additional thoughts (optional)
            </Label>
            <Textarea
              id="custom-feedback"
              placeholder="Share any other thoughts that could help us improve..."
              value={customFeedback}
              onChange={(e) => setCustomFeedback(e.target.value)}
              className="min-h-[80px] text-sm"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <Button 
              onClick={handleSubmit} 
              disabled={!quickReason && !customFeedback.trim()}
              className="flex-1"
            >
              Submit Feedback
            </Button>
            <Button 
              onClick={handleSkip} 
              variant="ghost"
              className="flex-1"
            >
              Skip
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RatingFeedbackDialog;
