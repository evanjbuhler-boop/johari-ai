const ValidationLoadingScreen = () => {

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-gradient-to-br from-purple-900/95 via-pink-900/95 to-purple-900/95 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="text-center space-y-8 px-4">
        {/* Pulsing Orb */}
        <div className="relative w-32 h-32 mx-auto">
          <div
            className="absolute inset-0 rounded-full bg-white/20 backdrop-blur-md animate-pulse"
            style={{ animationDuration: '2s' }}
          />
          <div
            className="absolute inset-2 rounded-full bg-white/30 backdrop-blur-md animate-pulse"
            style={{ animationDuration: '2s', animationDelay: '0.5s' }}
          />
          <div
            className="absolute inset-4 rounded-full bg-white/40 backdrop-blur-md animate-pulse"
            style={{ animationDuration: '2s', animationDelay: '1s' }}
          />
          <div className="absolute inset-8 rounded-full bg-white/50 backdrop-blur-md" />
        </div>

        {/* Text */}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-white animate-in fade-in duration-700">
            Reflecting on our conversation...
          </h2>
          <p className="text-white/70 text-sm animate-in fade-in duration-700 delay-500">
            Taking a moment to understand what you shared
          </p>
        </div>
      </div>
    </div>
  );
};

export default ValidationLoadingScreen;
