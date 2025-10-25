import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface BreathingExerciseModalProps {
  onClose: () => void;
}

const BreathingExerciseModal = ({ onClose }: BreathingExerciseModalProps) => {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [cycleCount, setcycleCount] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(4);
  const totalCycles = 4;

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev === 1) {
          // Move to next phase
          if (phase === 'inhale') {
            setPhase('hold');
            return 4;
          } else if (phase === 'hold') {
            setPhase('exhale');
            return 4;
          } else {
            // Exhale complete, start new cycle
            setcycleCount(prev => prev + 1);
            setPhase('inhale');
            return 4;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  // Auto-close after completing cycles
  useEffect(() => {
    if (cycleCount >= totalCycles) {
      setTimeout(() => onClose(), 1000);
    }
  }, [cycleCount, onClose]);

  const getCircleScale = () => {
    if (phase === 'inhale') return 1.0 + ((4 - secondsRemaining) * 0.25); // 1.0 to 2.0
    if (phase === 'hold') return 2.0; // Stay at max
    return 2.0 - ((4 - secondsRemaining) * 0.25); // 2.0 to 1.0
  };

  const getInstructions = () => {
    if (phase === 'inhale') return 'Breathe in...';
    if (phase === 'hold') return 'Hold...';
    return 'Breathe out...';
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative bg-gradient-to-br from-purple-900/95 to-pink-900/95 backdrop-blur-xl rounded-3xl p-12 max-w-md w-full mx-4 shadow-2xl border border-white/20">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white"
          aria-label="Close breathing exercise"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center space-y-8">
          <h2 className="text-2xl font-semibold text-white text-center">Let's Breathe Together</h2>
          
          {/* Breathing Circle */}
          <div className="relative w-64 h-64 flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-full bg-white/20 backdrop-blur-md"
              style={{
                transform: `scale(${getCircleScale()})`,
                transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
            <div
              className="absolute inset-0 rounded-full border-4 border-white/40"
              style={{
                transform: `scale(${getCircleScale()})`,
                transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
            <div className="relative z-10 text-center">
              <p className="text-3xl font-bold text-white mb-2">{getInstructions()}</p>
              <p className="text-6xl font-light text-white/90">{secondsRemaining}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2">
            {[...Array(totalCycles)].map((_, i) => (
              <div
                key={i}
                className={`h-2 w-8 rounded-full transition-all duration-300 ${
                  i < cycleCount
                    ? 'bg-white'
                    : i === cycleCount
                    ? 'bg-white/60'
                    : 'bg-white/20'
                }`}
              />
            ))}
          </div>

          <p className="text-sm text-white/70 text-center">
            Cycle {Math.min(cycleCount + 1, totalCycles)} of {totalCycles}
          </p>

          <button
            onClick={onClose}
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            Continue when ready →
          </button>
        </div>
      </div>
    </div>
  );
};

export default BreathingExerciseModal;
