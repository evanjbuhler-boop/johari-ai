import { useEffect, useState } from 'react';

const BreathingCircle = () => {
  const [phase, setPhase] = useState<'inhale' | 'exhale'>('inhale');

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase(prev => prev === 'inhale' ? 'exhale' : 'inhale');
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-8 right-8 flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-opacity z-10">
      <div className="relative">
        <div 
          className={`w-12 h-12 rounded-full border-2 border-white/40 transition-all duration-[4000ms] ease-in-out ${
            phase === 'inhale' ? 'scale-150' : 'scale-100'
          }`}
          style={{
            boxShadow: '0 0 20px rgba(255, 255, 255, 0.3)'
          }}
        />
      </div>
      <p className="text-white/60 text-xs font-medium">
        {phase === 'inhale' ? 'Breathe in' : 'Breathe out'}
      </p>
    </div>
  );
};

export default BreathingCircle;
