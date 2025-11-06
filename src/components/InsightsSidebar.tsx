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
        className={`fixed left-0 top-20 h-[calc(100vh-5rem)] overflow-hidden bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/25 backdrop-blur-2xl border-r border-primary/20 transition-all duration-500 z-20 shadow-2xl ${
          isCollapsed ? 'w-0 -translate-x-full opacity-0' : 'w-64 opacity-100'
        }`}
        style={{
          background: 'linear-gradient(135deg, hsl(var(--primary) / 0.25), hsl(var(--secondary) / 0.15), hsl(var(--accent) / 0.2))',
        }}
      >
        {/* Animated background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-background/20 pointer-events-none" />
        
        {/* Geometric decorations - More prominent and animated */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Large Triangle - Top */}
          <div
            className="absolute -top-20 -left-20 w-80 h-80 opacity-30 animate-pulse"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary) / 0.4), transparent)',
              clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
              transform: 'rotate(15deg)',
              animation: 'pulse 4s ease-in-out infinite',
            }}
          />
          
          {/* Medium Triangle - Middle overlapping */}
          <div
            className="absolute top-1/3 -right-16 w-64 h-64 opacity-25"
            style={{
              background: 'linear-gradient(225deg, hsl(var(--accent) / 0.5), transparent)',
              clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
              transform: 'rotate(-35deg)',
              animation: 'float 6s ease-in-out infinite',
            }}
          />

          {/* Diamond - Large and prominent */}
          <div
            className="absolute top-1/2 left-1/4 w-40 h-40 opacity-20"
            style={{
              background: 'linear-gradient(45deg, hsl(var(--primary) / 0.4), hsl(var(--accent) / 0.3))',
              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
              transform: 'rotate(45deg)',
              animation: 'spin 20s linear infinite',
            }}
          />

          {/* Hexagon - Bottom */}
          <div
            className="absolute bottom-32 left-12 w-36 h-36 opacity-25"
            style={{
              background: 'linear-gradient(90deg, hsl(var(--secondary) / 0.4), transparent)',
              clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
              transform: 'rotate(20deg)',
              animation: 'float 8s ease-in-out infinite reverse',
            }}
          />

          {/* Pentagon overlapping */}
          <div
            className="absolute bottom-1/4 right-8 w-32 h-32 opacity-30"
            style={{
              background: 'linear-gradient(180deg, hsl(var(--accent) / 0.5), transparent)',
              clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
              transform: 'rotate(-10deg)',
              animation: 'pulse 5s ease-in-out infinite',
            }}
          />

          {/* Small accent triangles */}
          <div
            className="absolute top-1/4 left-1/3 w-20 h-20 opacity-20"
            style={{
              background: 'hsl(var(--primary) / 0.6)',
              clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
              transform: 'rotate(60deg)',
            }}
          />
          <div
            className="absolute bottom-1/3 right-1/4 w-16 h-16 opacity-15"
            style={{
              background: 'hsl(var(--accent) / 0.7)',
              clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
              transform: 'rotate(-45deg)',
            }}
          />
        </div>

        {/* Glow effects */}
        <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-accent/10 to-transparent pointer-events-none" />

        {/* Sidebar content */}
        <div className="relative h-full flex flex-col justify-center px-8 py-6">
          <div className="flex-shrink-0">
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
        className={`fixed top-[5.5rem] z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 ${
          isCollapsed ? 'left-4' : 'left-64'
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
