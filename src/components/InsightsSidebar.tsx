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
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleToggle = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    onCollapsedChange?.(collapsed);
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-20 h-[calc(100vh-5rem)] overflow-hidden bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/25 backdrop-blur-2xl border-r border-primary/20 transition-all duration-500 z-20 shadow-2xl ${
          isCollapsed ? 'w-0 -translate-x-full opacity-0' : 'w-80 opacity-100'
        }`}
      >
        {/* Animated streaming gradient background */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            background: 'linear-gradient(45deg, hsl(var(--primary) / 0.3), hsl(var(--secondary) / 0.2), hsl(var(--accent) / 0.25), hsl(var(--primary) / 0.3))',
            backgroundSize: '400% 400%',
            animation: 'gradient-flow 12s ease infinite',
          }}
        />
        
        {/* Scattered flowing light streaks */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Top diagonal streak */}
          <div
            className="absolute w-24 h-40 opacity-15 -rotate-12"
            style={{
              top: '-20%',
              left: '10%',
              background: 'linear-gradient(180deg, transparent, hsl(var(--primary) / 0.3), transparent)',
              animation: 'flow-diagonal-1 8s ease-in-out infinite',
            }}
          />
          {/* Middle scattered streak */}
          <div
            className="absolute w-32 h-28 opacity-12 rotate-45"
            style={{
              top: '20%',
              right: '5%',
              background: 'linear-gradient(135deg, transparent, hsl(var(--accent) / 0.25), transparent)',
              animation: 'flow-diagonal-2 10s ease-in-out infinite 3s',
            }}
          />
          {/* Bottom left streak */}
          <div
            className="absolute w-20 h-36 opacity-10 -rotate-6"
            style={{
              bottom: '10%',
              left: '15%',
              background: 'linear-gradient(180deg, transparent, hsl(var(--secondary) / 0.2), transparent)',
              animation: 'flow-diagonal-3 7s ease-in-out infinite 1.5s',
            }}
          />
          {/* Thin vertical accent */}
          <div
            className="absolute w-16 h-32 opacity-8"
            style={{
              top: '30%',
              left: '60%',
              background: 'linear-gradient(180deg, transparent, hsl(var(--primary) / 0.15), transparent)',
              animation: 'flow-diagonal-1 9s ease-in-out infinite 2s',
            }}
          />
        </div>

        {/* Subtle pulsing orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full opacity-8 blur-3xl"
            style={{
              background: 'radial-gradient(circle, hsl(var(--primary) / 0.3), transparent)',
              animation: 'pulse-glow 6s ease-in-out infinite',
            }}
          />
          <div
            className="absolute bottom-1/3 right-1/4 w-24 h-24 rounded-full opacity-6 blur-2xl"
            style={{
              background: 'radial-gradient(circle, hsl(var(--accent) / 0.35), transparent)',
              animation: 'pulse-glow 5s ease-in-out infinite 2s',
            }}
          />
        </div>

        {/* Very subtle grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--primary) / 0.2) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--primary) / 0.2) 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px',
            animation: 'grid-shift 25s linear infinite',
          }}
        />
        {/* Toggle button inside sidebar */}
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
        <div className="relative h-full flex flex-col px-6 py-6 pt-12 overflow-y-auto sidebar-scroll">
          <div className="flex-1 flex flex-col justify-start text-center">
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
          className="fixed left-4 top-[5.5rem] z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      )}
    </>
  );
}
