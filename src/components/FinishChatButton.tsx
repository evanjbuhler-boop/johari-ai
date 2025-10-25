import { ArrowRight } from 'lucide-react';

interface FinishChatButtonProps {
  onClick: () => void;
}

const FinishChatButton = ({ onClick }: FinishChatButtonProps) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-1000 mb-4">
      <button
        onClick={onClick}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 group"
      >
        <span className="text-lg font-medium">I'm ready to reflect on this</span>
        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
      </button>
      <p className="text-center text-white/60 text-sm mt-3">
        Continue to insights →
      </p>
    </div>
  );
};

export default FinishChatButton;
