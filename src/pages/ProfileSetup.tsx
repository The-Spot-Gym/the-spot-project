import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, User, Dumbbell, Target, ArrowRight, ArrowLeft, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

// Import avatar images
import avatar1 from "@/assets/avatars/avatar-1.png";
import avatar2 from "@/assets/avatars/avatar-2.png";
import avatar3 from "@/assets/avatars/avatar-3.png";
import avatar4 from "@/assets/avatars/avatar-4.png";
import avatar5 from "@/assets/avatars/avatar-5.png";
import avatar6 from "@/assets/avatars/avatar-6.png";
import avatar7 from "@/assets/avatars/avatar-7.png";
import avatar8 from "@/assets/avatars/avatar-8.png";
import avatar9 from "@/assets/avatars/avatar-9.png";
import avatar10 from "@/assets/avatars/avatar-10.png";

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [profileData, setProfileData] = useState({
    profilePicture: "",
    displayName: "",
    bio: "",
    fitnessGoals: [] as string[],
    benchPress: "",
    squat: "",
    deadlift: "",
    experience: ""
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showAvatarSelection, setShowAvatarSelection] = useState(false);

  // Fetch existing profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setProfileData({
          profilePicture: data.avatar_url || "",
          displayName: data.display_name || "",
          bio: data.bio || "",
          fitnessGoals: [],
          benchPress: "",
          squat: "",
          deadlift: "",
          experience: ""
        });
      }
    };

    fetchProfile();
  }, [user]);

  const avatarOptions = [
    { id: 1, src: avatar1, name: "Weightlifter" },
    { id: 2, src: avatar2, name: "Powerlifter" },
    { id: 3, src: avatar3, name: "Bodybuilder" },
    { id: 4, src: avatar4, name: "Crossfitter" },
    { id: 5, src: avatar5, name: "Strongman" },
    { id: 6, src: avatar6, name: "Trainer" },
    { id: 7, src: avatar7, name: "Bencher" },
    { id: 8, src: avatar8, name: "Squatter" },
    { id: 9, src: avatar9, name: "Olympian" },
    { id: 10, src: avatar10, name: "Gym Enthusiast" },
  ];

  const fitnessGoalOptions = [
    "Build Muscle", "Lose Weight", "Gain Strength", "Improve Endurance",
    "General Fitness", "Bodybuilding", "Powerlifting", "Athletic Performance"
  ];

  const experienceOptions = [
    { value: "beginner", label: "Beginner (0-1 years)", description: "New to weightlifting" },
    { value: "intermediate", label: "Intermediate (1-3 years)", description: "Some lifting experience" },
    { value: "advanced", label: "Advanced (3+ years)", description: "Experienced lifter" },
    { value: "expert", label: "Expert/Competitor", description: "Competitive level" }
  ];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, or WebP image.",
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('upload-avatar', {
        body: formData,
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      setProfileData(prev => ({ ...prev, profilePicture: data.avatar_url }));
      setShowAvatarSelection(false);
      
      toast({
        title: "Avatar uploaded!",
        description: "Your custom avatar has been uploaded successfully.",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Failed to upload avatar. Please try again.",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleGoalToggle = (goal: string) => {
    setProfileData(prev => ({
      ...prev,
      fitnessGoals: prev.fitnessGoals.includes(goal)
        ? prev.fitnessGoals.filter(g => g !== goal)
        : [...prev.fitnessGoals, goal]
    }));
  };

  const handleNext = async () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete profile setup - save to database
      await saveProfile();
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          avatar_url: profileData.profilePicture,
          display_name: profileData.displayName,
          bio: profileData.bio,
          username: user.user_metadata?.username || profileData.displayName.toLowerCase().replace(/\s+/g, '_'),
        });

      if (error) throw error;

      // Update leaderboard_stats with PR data if provided
      if (profileData.benchPress || profileData.squat || profileData.deadlift) {
        const personalRecords: any = {};
        if (profileData.benchPress) personalRecords.bench_press = parseInt(profileData.benchPress);
        if (profileData.squat) personalRecords.squat = parseInt(profileData.squat);
        if (profileData.deadlift) personalRecords.deadlift = parseInt(profileData.deadlift);

        await supabase
          .from('leaderboard_stats')
          .upsert({
            user_id: user.id,
            personal_records: personalRecords,
            favorite_exercise: profileData.fitnessGoals[0] || null,
          });
      }

      toast({
        title: "Profile saved!",
        description: "Your profile has been successfully updated.",
      });

      navigate('/');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        variant: "destructive",
        title: "Error saving profile",
        description: "Failed to save your profile. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/');
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return profileData.displayName.trim().length > 0;
      case 2:
        return profileData.fitnessGoals.length > 0;
      case 3:
        return profileData.experience.length > 0;
      case 4:
        return true; // Personal records are optional
      default:
        return false;
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step <= currentStep 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted text-muted-foreground'
          }`}>
            {step}
          </div>
          {step < 4 && (
            <div className={`w-12 h-1 mx-2 ${
              step < currentStep ? 'bg-primary' : 'bg-muted'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
          <User className="w-8 h-8 text-white" />
        </div>
        <CardTitle>Set Up Your Profile</CardTitle>
        <CardDescription>Let's start with the basics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profileData.profilePicture} />
              <AvatarFallback className="bg-gradient-secondary text-secondary-foreground text-2xl">
                {profileData.displayName.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <Button 
              size="icon" 
              variant="secondary" 
              className="absolute -bottom-2 -right-2 rounded-full w-8 h-8"
              onClick={() => setShowAvatarSelection(!showAvatarSelection)}
            >
              <Camera className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Add a profile picture or choose an avatar</p>
        </div>

        {showAvatarSelection && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-center">Choose an Avatar</h4>
            
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Custom Avatar'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={handleFileUpload}
            />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or choose a preset</span>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {avatarOptions.map((avatar) => (
                <div
                  key={avatar.id}
                  className={`cursor-pointer rounded-full p-1 transition-all hover:scale-110 ${
                    profileData.profilePicture === avatar.src ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => {
                    setProfileData(prev => ({...prev, profilePicture: avatar.src}));
                    setShowAvatarSelection(false);
                  }}
                >
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={avatar.src} alt={avatar.name} />
                  </Avatar>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Display Name *</label>
            <Input
              placeholder="Enter your name"
              value={profileData.displayName}
              onChange={(e) => setProfileData(prev => ({...prev, displayName: e.target.value}))}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Bio (Optional)</label>
            <Textarea
              placeholder="Tell others about your fitness journey..."
              value={profileData.bio}
              onChange={(e) => setProfileData(prev => ({...prev, bio: e.target.value}))}
              rows={3}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-gradient-secondary rounded-full flex items-center justify-center mb-4">
          <Target className="w-8 h-8 text-secondary-foreground" />
        </div>
        <CardTitle>Your Fitness Goals</CardTitle>
        <CardDescription>What are you looking to achieve? (Select all that apply)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {fitnessGoalOptions.map((goal) => (
            <Badge
              key={goal}
              variant={profileData.fitnessGoals.includes(goal) ? "default" : "outline"}
              className="cursor-pointer p-3 text-center justify-center hover:scale-105 transition-transform"
              onClick={() => handleGoalToggle(goal)}
            >
              {goal}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-gradient-accent rounded-full flex items-center justify-center mb-4">
          <Dumbbell className="w-8 h-8 text-accent-foreground" />
        </div>
        <CardTitle>Experience Level</CardTitle>
        <CardDescription>How long have you been lifting?</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {experienceOptions.map((option) => (
          <Card
            key={option.value}
            className={`cursor-pointer transition-all hover:shadow-md ${
              profileData.experience === option.value ? 'ring-2 ring-primary bg-primary/5' : ''
            }`}
            onClick={() => setProfileData(prev => ({...prev, experience: option.value}))}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{option.label}</h3>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 ${
                  profileData.experience === option.value 
                    ? 'bg-primary border-primary' 
                    : 'border-muted-foreground'
                }`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );

  const renderStep4 = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
          <Dumbbell className="w-8 h-8 text-white" />
        </div>
        <CardTitle>Personal Records</CardTitle>
        <CardDescription>Share your current PRs (Optional - you can add these later)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block flex items-center gap-2">
            🏋️ Bench Press (lbs)
          </label>
          <Input
            type="number"
            placeholder="e.g., 225"
            value={profileData.benchPress}
            onChange={(e) => setProfileData(prev => ({...prev, benchPress: e.target.value}))}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block flex items-center gap-2">
            🔥 Squat (lbs)
          </label>
          <Input
            type="number"
            placeholder="e.g., 315"
            value={profileData.squat}
            onChange={(e) => setProfileData(prev => ({...prev, squat: e.target.value}))}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block flex items-center gap-2">
            💪 Deadlift (lbs)
          </label>
          <Input
            type="number"
            placeholder="e.g., 405"
            value={profileData.deadlift}
            onChange={(e) => setProfileData(prev => ({...prev, deadlift: e.target.value}))}
          />
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Don't worry if you don't have all your PRs - you can add them anytime from your profile!
        </p>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {renderStepIndicator()}
          
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}

          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </Button>
            
            <Button 
              variant="hero" 
              onClick={handleNext}
              disabled={!isStepValid() || saving}
              className="bg-white text-primary hover:bg-white/90"
            >
              {saving ? 'Saving...' : (currentStep === 4 ? 'Complete Setup' : 'Next')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;