import { Sparkles } from 'lucide-react';

const RecommendationsLoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-gradient-to-br from-purple-900/95 via-pink-900/95 to-purple-900/95 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="text-center space-y-8 px-4">
        {/* Animated Icon */}
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-12 h-12 text-white animate-pulse" />
          </div>
          <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-spin" style={{ animationDuration: '3s' }} />
        </div>

        {/* Text */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-white animate-in fade-in duration-700">
            Creating your recommendations...
          </h2>
          <p className="text-white/70 text-sm animate-in fade-in duration-700 delay-500">
            Personalizing insights based on what you shared
          </p>
        </div>
      </div>
    </div>
  );
};

export default RecommendationsLoadingScreen;
