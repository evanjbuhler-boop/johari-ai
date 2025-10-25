import { MessageSquare, Check, Lightbulb } from 'lucide-react';

interface StageProgressBarProps {
  currentStage: 'chat' | 'validate' | 'recommendations';
  chatProgress?: number; // 0-100 for chat stage progress
  estimatedMinutes?: number;
}

const StageProgressBar = ({ currentStage, chatProgress = 0, estimatedMinutes }: StageProgressBarProps) => {
  // Calculate overall progress across all 3 stages
  const getOverallProgress = () => {
    if (currentStage === 'chat') {
      // Chat stage: 0-33%
      return (chatProgress / 100) * 33;
    } else if (currentStage === 'validate') {
      // Validation stage: 33-66%
      return 33 + ((100 / 100) * 33); // Assuming validation is instant/complete
    } else {
      // Recommendations stage: 66-100%
      return 100;
    }
  };

  const isStageActive = (stage: 'chat' | 'validate' | 'recommendations') => {
    return currentStage === stage;
  };

  const isStageComplete = (stage: 'chat' | 'validate' | 'recommendations') => {
    const stageOrder = ['chat', 'validate', 'recommendations'];
    const currentIndex = stageOrder.indexOf(currentStage);
    const stageIndex = stageOrder.indexOf(stage);
    return stageIndex < currentIndex;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[99]">
      {/* Stage Progress Indicator */}
      <div className="bg-gradient-to-r from-purple-900/95 to-pink-900/95 backdrop-blur-xl border-t border-white/20 shadow-2xl animate-in slide-in-from-bottom duration-500 pt-6">
        <div className="max-w-4xl mx-auto px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {/* Stage Icons and Labels */}
          <div className="flex items-center justify-between mb-3">
            {/* Stage 1: Chat */}
            <div className="flex items-center gap-2 flex-1">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-500 ${
                isStageActive('chat') || isStageComplete('chat')
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/50' 
                  : 'bg-white/20'
              }`}>
                <MessageSquare className={`h-4 w-4 ${
                  isStageActive('chat') || isStageComplete('chat') ? 'text-white' : 'text-white/50'
                }`} />
              </div>
              <span className={`text-sm font-medium hidden sm:inline transition-all duration-300 ${
                isStageActive('chat') || isStageComplete('chat') ? 'text-white' : 'text-white/50'
              }`}>
                Chat
              </span>
            </div>
            
            <div className="flex-1 flex items-center justify-center">
              <div className={`h-px w-full mx-2 transition-all duration-500 ${
                isStageComplete('chat') ? 'bg-gradient-to-r from-purple-400 to-pink-400' : 'bg-white/20'
              }`} />
            </div>
            
            {/* Stage 2: Validate */}
            <div className="flex items-center gap-2 flex-1 justify-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-500 ${
                isStageActive('validate') || isStageComplete('validate')
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/50' 
                  : 'bg-white/20'
              }`}>
                <Check className={`h-4 w-4 ${
                  isStageActive('validate') || isStageComplete('validate') ? 'text-white' : 'text-white/50'
                }`} />
              </div>
              <span className={`text-sm font-medium hidden sm:inline transition-all duration-300 ${
                isStageActive('validate') || isStageComplete('validate') ? 'text-white' : 'text-white/50'
              }`}>
                Validate
              </span>
            </div>
            
            <div className="flex-1 flex items-center justify-center">
              <div className={`h-px w-full mx-2 transition-all duration-500 ${
                isStageComplete('validate') ? 'bg-gradient-to-r from-purple-400 to-pink-400' : 'bg-white/20'
              }`} />
            </div>
            
            {/* Stage 3: Recommendations */}
            <div className="flex items-center gap-2 flex-1 justify-end">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-500 ${
                isStageActive('recommendations')
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/50' 
                  : 'bg-white/20'
              }`}>
                <Lightbulb className={`h-4 w-4 ${
                  isStageActive('recommendations') ? 'text-white' : 'text-white/50'
                }`} />
              </div>
              <span className={`text-sm font-medium hidden sm:inline transition-all duration-300 ${
                isStageActive('recommendations') ? 'text-white' : 'text-white/50'
              }`}>
                Recommendations
              </span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="relative h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-1000 shadow-lg shadow-purple-400/50"
              style={{ width: `${getOverallProgress()}%` }}
            />
          </div>
          
          {/* Time Estimate - only show during chat stage */}
          {currentStage === 'chat' && estimatedMinutes !== undefined && (
            <div className="flex justify-end mt-2 animate-in fade-in duration-300">
              <span className="text-xs text-white/70">
                ~{estimatedMinutes} min remaining
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StageProgressBar;
