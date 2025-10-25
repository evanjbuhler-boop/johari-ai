import { X } from 'lucide-react';

interface SupportivePromptOverlayProps {
  message: string;
  onDismiss: () => void;
}

const SupportivePromptOverlay = ({ message, onDismiss }: SupportivePromptOverlayProps) => {
  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/20 animate-in fade-in duration-500"
      onClick={onDismiss}
    >
      <div
        className="relative bg-white/95 backdrop-blur-xl rounded-2xl p-6 max-w-sm mx-4 shadow-2xl border border-white/50 animate-in slide-in-from-bottom-4 duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onDismiss}
          className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
          aria-label="Dismiss message"
        >
          <X className="h-4 w-4" />
        </button>
        
        <p className="text-gray-800 text-center text-base font-medium pr-6">
          {message}
        </p>
      </div>
    </div>
  );
};

export default SupportivePromptOverlay;
