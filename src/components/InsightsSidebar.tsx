import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InsightToneSlider from '@/components/InsightToneSlider';

type ToneValue = 'clinical' | 'direct' | 'coaching' | 'compassionate' | 'children';

interface InsightsSidebarProps {
  insightTone: ToneValue;
  onRegenerating: (isRegenerating: boolean) => void;
  onRegenerated: (newResults: any) => void;
  messages: any[];
}

export default function InsightsSidebar({
  insightTone,
  onRegenerating,
  onRegenerated,
  messages,
}: InsightsSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-gradient-to-br from-purple-600/20 via-pink-500/20 to-indigo-600/20 backdrop-blur-xl border-r border-white/10 transition-all duration-300 z-20 ${
          isCollapsed ? 'w-0 -translate-x-full' : 'w-80'
        }`}
      >
        {/* Geometric decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Triangle 1 */}
          <div
            className="absolute top-20 -left-10 w-40 h-40 bg-gradient-to-br from-purple-500/10 to-transparent"
            style={{
              clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
              transform: 'rotate(15deg)',
            }}
          />
          {/* Triangle 2 */}
          <div
            className="absolute bottom-40 -right-10 w-32 h-32 bg-gradient-to-tl from-pink-500/10 to-transparent"
            style={{
              clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
              transform: 'rotate(-25deg)',
            }}
          />
          {/* Diamond */}
          <div
            className="absolute top-1/2 left-10 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-transparent"
            style={{
              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
              transform: 'rotate(45deg)',
            }}
          />
          {/* Pentagon */}
          <div
            className="absolute bottom-20 left-1/2 w-28 h-28 bg-gradient-to-br from-violet-500/10 to-transparent"
            style={{
              clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
              transform: 'rotate(10deg)',
            }}
          />
        </div>

        {/* Sidebar content */}
        <div className="relative h-full flex flex-col p-6 pt-20">
          <div className="flex-1 overflow-y-auto">
            <InsightToneSlider
              value={insightTone}
              onRegenerating={onRegenerating}
              onRegenerated={onRegenerated}
              messages={messages}
            />
          </div>
        </div>
      </aside>

      {/* Toggle button */}
      <Button
        onClick={() => setIsCollapsed(!isCollapsed)}
        variant="ghost"
        size="icon"
        className={`fixed top-4 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 ${
          isCollapsed ? 'left-4' : 'left-[21rem]'
        }`}
      >
        {isCollapsed ? (
          <ChevronRight className="w-5 h-5" />
        ) : (
          <ChevronLeft className="w-5 h-5" />
        )}
      </Button>
    </>
  );
}
