import { useState } from 'react';
import { Brain, MessageSquare, Target, Heart, Baby } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserProfile } from '@/types/checkin';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ProfileFormProps {
  onSubmit: (profile: UserProfile) => void;
}

const ProfileForm = ({ onSubmit }: ProfileFormProps) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: user?.email || '',
    age: '',
    location: '',
    lifeStage: '',
    insightTone: 'clinical',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in first');
      return;
    }

    setLoading(true);

    // Save to database
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        name: profile.name,
        email: profile.email,
        age: profile.age,
        location: profile.location,
        life_stage: profile.lifeStage,
        insight_tone: profile.insightTone || 'clinical',
      });

    if (error) {
      console.error('Profile save error:', error);
      toast.error('Failed to save profile');
      setLoading(false);
      return;
    }

    // Also save to localStorage for backward compatibility
    localStorage.setItem('userProfile', JSON.stringify(profile));
    
    setLoading(false);
    onSubmit(profile);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Tell us about yourself</h2>
          <p className="text-muted-foreground">Help us personalize your experience</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-8 shadow-lg space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              value={profile.age}
              onChange={(e) => setProfile({ ...profile, age: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={profile.location}
              onChange={(e) => setProfile({ ...profile, location: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lifeStage">Life Stage</Label>
            <Select value={profile.lifeStage} onValueChange={(value) => setProfile({ ...profile, lifeStage: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select your life stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="early-career">Early Career</SelectItem>
                <SelectItem value="mid-career">Mid Career</SelectItem>
                <SelectItem value="senior-career">Senior Career</SelectItem>
                <SelectItem value="parent">Parent</SelectItem>
                <SelectItem value="caregiver">Caregiver</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Preferred Insight Tone</Label>
            <RadioGroup 
              value={profile.insightTone || 'clinical'} 
              onValueChange={(value) => setProfile({ ...profile, insightTone: value as 'clinical' | 'direct' | 'coaching' | 'compassionate' | 'children' })}
              className="space-y-1.5"
            >
              <div className="flex items-start space-x-2 rounded-lg border border-border/50 p-2.5 hover:bg-accent/50 transition-colors cursor-pointer">
                <RadioGroupItem value="clinical" id="profile-tone-clinical" className="mt-0.5" />
                <label htmlFor="profile-tone-clinical" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Brain className="h-3.5 w-3.5 text-primary" />
                    <span className="font-medium text-sm">Clinical</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Research-based & objective</p>
                </label>
              </div>

              <div className="flex items-start space-x-2 rounded-lg border border-border/50 p-2.5 hover:bg-accent/50 transition-colors cursor-pointer">
                <RadioGroupItem value="direct" id="profile-tone-direct" className="mt-0.5" />
                <label htmlFor="profile-tone-direct" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <MessageSquare className="h-3.5 w-3.5 text-primary" />
                    <span className="font-medium text-sm">Direct</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Clear & straightforward</p>
                </label>
              </div>

              <div className="flex items-start space-x-2 rounded-lg border border-border/50 p-2.5 hover:bg-accent/50 transition-colors cursor-pointer">
                <RadioGroupItem value="coaching" id="profile-tone-coaching" className="mt-0.5" />
                <label htmlFor="profile-tone-coaching" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Target className="h-3.5 w-3.5 text-primary" />
                    <span className="font-medium text-sm">Coaching</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Action-oriented</p>
                </label>
              </div>

              <div className="flex items-start space-x-2 rounded-lg border border-border/50 p-2.5 hover:bg-accent/50 transition-colors cursor-pointer">
                <RadioGroupItem value="compassionate" id="profile-tone-compassionate" className="mt-0.5" />
                <label htmlFor="profile-tone-compassionate" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Heart className="h-3.5 w-3.5 text-primary" />
                    <span className="font-medium text-sm">Compassionate</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Warm & empathetic</p>
                </label>
              </div>

              <div className="flex items-start space-x-2 rounded-lg border border-border/50 p-2.5 hover:bg-accent/50 transition-colors cursor-pointer">
                <RadioGroupItem value="children" id="profile-tone-children" className="mt-0.5" />
                <label htmlFor="profile-tone-children" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Baby className="h-3.5 w-3.5 text-primary" />
                    <span className="font-medium text-sm">For Children</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Simple & age-appropriate</p>
                </label>
              </div>
            </RadioGroup>
            <p className="text-xs text-muted-foreground mt-1">
              Change this anytime in your profile settings
            </p>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? 'Saving...' : 'Continue'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ProfileForm;
