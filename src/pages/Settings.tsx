import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Moon, Sun, Monitor, User, Mail, Lock, Dumbbell, Users, MapPin, Camera, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AvatarCropper } from "@/components/AvatarCropper";

const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
  
  // Profile state
  const [profile, setProfile] = useState({
    username: "",
    display_name: "",
    bio: "",
    avatar_url: ""
  });

  // Lifting stats state
  const [liftingStats, setLiftingStats] = useState({
    bench_press: "",
    squat: "",
    deadlift: ""
  });

  // Friends state
  const [friends, setFriends] = useState<any[]>([]);
  
  // My gyms state
  const [myGyms, setMyGyms] = useState<any[]>([]);

  // Load user data
  useEffect(() => {
    if (!user) return;

    const loadUserData = async () => {
      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileData) {
        setProfile({
          username: profileData.username || "",
          display_name: profileData.display_name || "",
          bio: profileData.bio || "",
          avatar_url: profileData.avatar_url || ""
        });
      }

      // Load lifting stats
      const { data: statsData } = await supabase
        .from('leaderboard_stats')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (statsData?.personal_records) {
        const records = statsData.personal_records as any;
        setLiftingStats({
          bench_press: records.bench_press?.toString() || "",
          squat: records.squat?.toString() || "",
          deadlift: records.deadlift?.toString() || ""
        });
      }

      // Load friends
      const { data: friendsData } = await supabase
        .from('friendships')
        .select(`
          *,
          friend_profile:profiles!friendships_friend_id_fkey(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      if (friendsData) {
        setFriends(friendsData);
      }
    };

    loadUserData();
  }, [user]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, or WebP image.",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
      });
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setCropImageUrl(imageUrl);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!user) return;

    setUploading(true);
    setCropImageUrl(null);
    
    try {
      const formData = new FormData();
      formData.append('file', croppedBlob, 'avatar.png');

      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('upload-avatar', {
        body: formData,
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      setProfile(prev => ({ ...prev, avatar_url: data.avatar_url }));
      
      toast({
        title: "Avatar uploaded!",
        description: "Your avatar has been updated successfully.",
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

  const handleSaveProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          username: profile.username,
          display_name: profile.display_name,
          bio: profile.bio,
          avatar_url: profile.avatar_url
        }, { onConflict: 'user_id' });

      if (error) throw error;

      toast({
        title: "Profile updated!",
        description: "Your profile has been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save profile. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLiftingStats = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const personalRecords: any = {};
      if (liftingStats.bench_press) personalRecords.bench_press = parseInt(liftingStats.bench_press);
      if (liftingStats.squat) personalRecords.squat = parseInt(liftingStats.squat);
      if (liftingStats.deadlift) personalRecords.deadlift = parseInt(liftingStats.deadlift);

      const { error } = await supabase
        .from('leaderboard_stats')
        .upsert({
          user_id: user.id,
          personal_records: personalRecords
        }, { onConflict: 'user_id' });

      if (error) throw error;

      toast({
        title: "Stats updated!",
        description: "Your lifting stats have been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving stats:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save stats. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {cropImageUrl && (
        <AvatarCropper
          imageUrl={cropImageUrl}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setCropImageUrl(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }}
        />
      )}

      <header className="bg-card shadow-sm p-4 sticky top-0 z-10 border-b">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-bold text-xl">Settings</h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="stats">Lifting Stats</TabsTrigger>
            <TabsTrigger value="friends">Friends</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your public profile information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className="bg-gradient-secondary text-secondary-foreground text-2xl">
                      {profile.display_name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      {uploading ? 'Uploading...' : 'Change Avatar'}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={profile.username}
                      onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="your_username"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="display_name">Display Name</Label>
                    <Input
                      id="display_name"
                      value={profile.display_name}
                      onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
                      placeholder="Your Name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profile.bio}
                      onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell others about your fitness journey..."
                      rows={4}
                    />
                  </div>

                  <Button onClick={handleSaveProfile} disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account and security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ""}
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">Contact support to change your email</p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Button variant="outline" onClick={() => {
                      toast({
                        title: "Coming soon!",
                        description: "Password change feature will be available soon."
                      });
                    }}>
                      <Lock className="w-4 h-4 mr-2" />
                      Change Password
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lifting Stats Tab */}
          <TabsContent value="stats" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lifting Stats</CardTitle>
                <CardDescription>Update your personal records</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bench_press">Bench Press (lbs)</Label>
                    <Input
                      id="bench_press"
                      type="number"
                      value={liftingStats.bench_press}
                      onChange={(e) => setLiftingStats(prev => ({ ...prev, bench_press: e.target.value }))}
                      placeholder="e.g., 225"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="squat">Squat (lbs)</Label>
                    <Input
                      id="squat"
                      type="number"
                      value={liftingStats.squat}
                      onChange={(e) => setLiftingStats(prev => ({ ...prev, squat: e.target.value }))}
                      placeholder="e.g., 315"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deadlift">Deadlift (lbs)</Label>
                    <Input
                      id="deadlift"
                      type="number"
                      value={liftingStats.deadlift}
                      onChange={(e) => setLiftingStats(prev => ({ ...prev, deadlift: e.target.value }))}
                      placeholder="e.g., 405"
                    />
                  </div>

                  <Button onClick={handleSaveLiftingStats} disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Stats
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Friends Tab */}
          <TabsContent value="friends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Friends</CardTitle>
                <CardDescription>Manage your fitness friends</CardDescription>
              </CardHeader>
              <CardContent>
                {friends.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No friends yet</p>
                    <Button variant="outline" className="mt-4" onClick={() => navigate('/friend-requests')}>
                      <Users className="w-4 h-4 mr-2" />
                      Find Friends
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {friends.map((friendship) => (
                      <div key={friendship.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={friendship.friend_profile?.avatar_url} />
                            <AvatarFallback>
                              {friendship.friend_profile?.display_name?.charAt(0)?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{friendship.friend_profile?.display_name}</p>
                            <p className="text-sm text-muted-foreground">@{friendship.friend_profile?.username}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => navigate('/messages')}>
                          Message
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize how The Spot looks on your device</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Label>Theme</Label>
                  <RadioGroup value={theme} onValueChange={setTheme} className="grid gap-4">
                    <div className="flex items-center space-x-3 space-y-0">
                      <RadioGroupItem value="light" id="light" />
                      <Label htmlFor="light" className="flex items-center gap-2 cursor-pointer font-normal">
                        <Sun className="w-4 h-4" />
                        Light
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 space-y-0">
                      <RadioGroupItem value="dark" id="dark" />
                      <Label htmlFor="dark" className="flex items-center gap-2 cursor-pointer font-normal">
                        <Moon className="w-4 h-4" />
                        Dark
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 space-y-0">
                      <RadioGroupItem value="system" id="system" />
                      <Label htmlFor="system" className="flex items-center gap-2 cursor-pointer font-normal">
                        <Monitor className="w-4 h-4" />
                        System
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
