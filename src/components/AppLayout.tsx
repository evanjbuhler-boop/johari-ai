import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { User, Library, Home, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import FloatingParticles from '@/components/FloatingParticles';
import NeurodiveritySettingsDialog from '@/components/NeurodiveritySettingsDialog';
import FocusModeToggle from '@/components/FocusModeToggle';
import ProfileSheet from '@/components/ProfileSheet';

interface AppLayoutProps {
  children: ReactNode;
  showBackground?: boolean;
}

const AppLayout = ({ children, showBackground = true }: AppLayoutProps) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isLibraryPage = location.pathname === '/library';

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated gradient background */}
      {showBackground && (
        <div className="fixed inset-0 animated-gradient -z-10" />
      )}

      {/* Floating particles background */}
      {showBackground && <FloatingParticles />}
      
      {/* Texture overlay */}
      {showBackground && (
        <div className="fixed inset-0 texture-overlay pointer-events-none -z-10" />
      )}
      
      {/* Vignette effect */}
      {showBackground && (
        <div className="fixed inset-0 vignette pointer-events-none -z-10" />
      )}

      {/* Navigation buttons - Top Left */}
      <div className="fixed top-6 left-6 z-50 flex gap-3">
        {user ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(isLibraryPage ? '/' : '/library')}
              className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/30 shadow-sm transition-all"
            >
              {isLibraryPage ? (
                <Library className="h-5 w-5" />
              ) : (
                <Home className="h-5 w-5" />
              )}
            </Button>
            <ProfileSheet>
              <Button
                variant="ghost"
                size="icon"
                className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/30 shadow-sm"
              >
                <User className="h-5 w-5" />
              </Button>
            </ProfileSheet>
          </>
        ) : (
          <Link to="/auth">
            <Button
              variant="ghost"
              className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/30 shadow-sm gap-2"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </Button>
          </Link>
        )}
      </div>

      {/* Focus Mode and Neurodiversity settings - Top Right */}
      <div className="fixed top-6 right-6 z-50 flex gap-3">
        <FocusModeToggle />
        <NeurodiveritySettingsDialog variant="icon" />
      </div>

      {/* Main content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default AppLayout;
