import { useState, useEffect } from 'react';
import { X, Brain, MessageSquare, Target, Heart, Baby } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface ProfileSheetProps {
  children: React.ReactNode;
}

const ProfileSheet = ({ children }: ProfileSheetProps) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [insightTone, setInsightTone] = useState('clinical');
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    if (user && open) {
      fetchProfile();
    }
  }, [user, open]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('name, insight_tone')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }

    if (data) {
      setName(data.name || '');
      setInsightTone(data.insight_tone || 'clinical');
    }
  };

  const handleNameChange = async (newName: string) => {
    setName(newName);
    
    if (!user || isUpdatingName) return;

    setIsUpdatingName(true);

    const { error } = await supabase
      .from('profiles')
      .update({ name: newName })
      .eq('id', user.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update name',
        variant: 'destructive',
      });
    }

    setIsUpdatingName(false);
  };

  const handleInsightToneChange = async (newTone: string) => {
    setInsightTone(newTone);
    
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ insight_tone: newTone })
      .eq('id', user.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update insight tone',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Saved',
        description: 'Default insight tone updated',
      });
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast({
        title: 'Error',
        description: 'Please enter your current password',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'New password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      // Verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email!,
        password: currentPassword,
      });

      if (signInError) {
        toast({
          title: 'Error',
          description: 'Current password is incorrect',
          variant: 'destructive',
        });
        setIsChangingPassword(false);
        return;
      }

      // Update to new password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Password changed successfully',
        });
        setPasswordDialogOpen(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }

    setIsChangingPassword(false);
  };

  const handleLogout = async () => {
    await signOut();
    setOpen(false);
    navigate('/');
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out',
    });
  };

  const handleDeleteAccount = async () => {
    if (!user || !deletePassword) {
      toast({
        title: 'Error',
        description: 'Please enter your password',
        variant: 'destructive',
      });
      return;
    }

    setIsDeletingAccount(true);

    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: 'Error',
          description: 'Session expired. Please log in again.',
          variant: 'destructive',
        });
        setIsDeletingAccount(false);
        return;
      }

      // Call the edge function to delete the account
      const { data, error } = await supabase.functions.invoke('delete-account', {
        body: { password: deletePassword },
      });

      if (error) {
        console.error('Error deleting account:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete account',
          variant: 'destructive',
        });
        setIsDeletingAccount(false);
        return;
      }

      if (data?.error) {
        toast({
          title: 'Error',
          description: data.error,
          variant: 'destructive',
        });
        setIsDeletingAccount(false);
        return;
      }

      // Sign out and redirect
      await signOut();
      setOpen(false);
      navigate('/auth');
      toast({
        title: 'Account Deleted',
        description: 'Your account has been permanently deleted',
      });
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }

    setIsDeletingAccount(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent side="left" className="w-80 bg-background/95 backdrop-blur-md border-r border-border/50 overflow-y-auto">
        <SheetHeader className="pb-3">
          <SheetTitle className="text-xl font-semibold">Profile</SheetTitle>
        </SheetHeader>

        <div className="space-y-3 pb-4">
          {/* Name field */}
          <div className="space-y-1">
            <Label htmlFor="name" className="text-xs">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Your name"
              className="bg-background/50 h-9"
            />
          </div>

          {/* Email display */}
          <div className="space-y-1">
            <Label htmlFor="email" className="text-xs">Email</Label>
            <Input
              id="email"
              value={user?.email || ''}
              disabled
              className="bg-muted/50 text-muted-foreground cursor-not-allowed h-9"
            />
          </div>

          {/* Default Insight Tone */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Default Insight Tone</Label>
            <RadioGroup value={insightTone} onValueChange={handleInsightToneChange} className="space-y-1">
              <div className="flex items-center space-x-2 rounded border border-border/50 p-1.5 hover:bg-accent/50 transition-colors cursor-pointer">
                <RadioGroupItem value="clinical" id="tone-clinical" />
                <label htmlFor="tone-clinical" className="flex-1 cursor-pointer flex items-center gap-1.5">
                  <Brain className="h-3 w-3 text-primary shrink-0" />
                  <div className="min-w-0">
                    <span className="font-medium text-xs">Clinical</span>
                    <span className="text-[10px] text-muted-foreground ml-1">Research-based</span>
                  </div>
                </label>
              </div>

              <div className="flex items-center space-x-2 rounded border border-border/50 p-1.5 hover:bg-accent/50 transition-colors cursor-pointer">
                <RadioGroupItem value="direct" id="tone-direct" />
                <label htmlFor="tone-direct" className="flex-1 cursor-pointer flex items-center gap-1.5">
                  <MessageSquare className="h-3 w-3 text-primary shrink-0" />
                  <div className="min-w-0">
                    <span className="font-medium text-xs">Direct</span>
                    <span className="text-[10px] text-muted-foreground ml-1">Straightforward</span>
                  </div>
                </label>
              </div>

              <div className="flex items-center space-x-2 rounded border border-border/50 p-1.5 hover:bg-accent/50 transition-colors cursor-pointer">
                <RadioGroupItem value="coaching" id="tone-coaching" />
                <label htmlFor="tone-coaching" className="flex-1 cursor-pointer flex items-center gap-1.5">
                  <Target className="h-3 w-3 text-primary shrink-0" />
                  <div className="min-w-0">
                    <span className="font-medium text-xs">Coaching</span>
                    <span className="text-[10px] text-muted-foreground ml-1">Action-oriented</span>
                  </div>
                </label>
              </div>

              <div className="flex items-center space-x-2 rounded border border-border/50 p-1.5 hover:bg-accent/50 transition-colors cursor-pointer">
                <RadioGroupItem value="compassionate" id="tone-compassionate" />
                <label htmlFor="tone-compassionate" className="flex-1 cursor-pointer flex items-center gap-1.5">
                  <Heart className="h-3 w-3 text-primary shrink-0" />
                  <div className="min-w-0">
                    <span className="font-medium text-xs">Compassionate</span>
                    <span className="text-[10px] text-muted-foreground ml-1">Empathetic</span>
                  </div>
                </label>
              </div>

              <div className="flex items-center space-x-2 rounded border border-border/50 p-1.5 hover:bg-accent/50 transition-colors cursor-pointer">
                <RadioGroupItem value="children" id="tone-children" />
                <label htmlFor="tone-children" className="flex-1 cursor-pointer flex items-center gap-1.5">
                  <Baby className="h-3 w-3 text-primary shrink-0" />
                  <div className="min-w-0">
                    <span className="font-medium text-xs">For Children</span>
                    <span className="text-[10px] text-muted-foreground ml-1">Age-appropriate</span>
                  </div>
                </label>
              </div>
            </RadioGroup>
          </div>

          {/* Change Password button */}
          <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full h-9" size="sm">
                Change Password
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-background/95 backdrop-blur-md">
              <DialogHeader>
                <DialogTitle>Change Password</DialogTitle>
                <DialogDescription>
                  Enter your current password and choose a new one
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
                <Button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                  className="w-full"
                >
                  {isChangingPassword ? 'Changing...' : 'Change Password'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Logout button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full h-9" size="sm">
                Log Out
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-background/95 backdrop-blur-md">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  You will be logged out of your account.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout}>
                  Log Out
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Delete Account Section */}
          <div className="pt-2 border-t border-border/50">
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full h-9 border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  Delete Account
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-background/95 backdrop-blur-md">
                <DialogHeader>
                  <DialogTitle className="text-destructive">Delete Account</DialogTitle>
                  <DialogDescription className="space-y-2 pt-2">
                    <p className="font-semibold">This action cannot be undone.</p>
                    <p>This will permanently delete your account and remove all your data from our servers.</p>
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="delete-password">Confirm your password</Label>
                    <Input
                      id="delete-password"
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="Enter your password"
                      className="bg-background"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDeleteDialogOpen(false);
                        setDeletePassword('');
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={isDeletingAccount || !deletePassword}
                      className="flex-1"
                    >
                      {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProfileSheet;
