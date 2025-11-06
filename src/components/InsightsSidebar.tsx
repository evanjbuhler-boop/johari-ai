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
  onCollapsedChange?: (isCollapsed: boolean) => void;
}

export default function InsightsSidebar({
  insightTone,
  onRegenerating,
  onRegenerated,
  messages,
  onCollapsedChange,
}: InsightsSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const handleToggle = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    onCollapsedChange?.(collapsed);
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-28 h-[calc(100vh-7rem)] overflow-hidden bg-gradient-to-br from-primary/20 via-secondary/15 to-accent/15 backdrop-blur-xl border-r border-primary/10 transition-all duration-500 z-10 shadow-xl ${
          isCollapsed ? 'w-0 -translate-x-full opacity-0' : 'w-80 opacity-100'
        }`}
      >
        {/* Subtle background */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/30 via-transparent to-background/10 pointer-events-none" />
        
        {/* Toggle button inside sidebar */}
        {!isCollapsed && (
          <Button
            onClick={() => handleToggle(true)}
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white/60 hover:text-white hover:bg-white/10 transition-all duration-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}

        {/* Sidebar content */}
        <div className="relative h-full flex flex-col px-6 py-6 pt-12 overflow-y-auto sidebar-scroll">
          <div className="w-full">
            <InsightToneSlider
              value={insightTone}
              onRegenerating={onRegenerating}
              onRegenerated={onRegenerated}
              messages={messages}
            />
          </div>
        </div>
      </aside>

      {/* Toggle button - only visible when collapsed */}
      {isCollapsed && (
        <Button
          onClick={() => handleToggle(false)}
          variant="ghost"
          size="icon"
          className="fixed left-6 top-20 z-30 bg-white/20 dark:bg-gray-900/20 backdrop-blur-sm hover:bg-white/30 dark:hover:bg-gray-900/30 shadow-md hover:shadow-lg transition-all duration-300"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      )}
    </>
  );
}
