import { useRef, useState, useEffect } from "react";
import { Camera, Save, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AvatarCropper } from "@/components/AvatarCropper";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export const ProfileTab = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { profile, updateProfile } = useProfile();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [formData, setFormData] = useState({
    username: profile?.username || "",
    display_name: profile?.display_name || "",
    bio: profile?.bio || "",
  });

  // Debounced username availability check
  useEffect(() => {
    const username = formData.username.trim();
    if (!username || username.length < 3 || username === profile?.username) {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .neq('user_id', user?.id || '')
        .maybeSingle();
      
      setUsernameAvailable(!data);
      setCheckingUsername(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, [formData.username, profile?.username, user?.id]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
    setUploading(true);
    setCropImageUrl(null);
    
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', croppedBlob, 'avatar.png');

      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('upload-avatar', {
        body: formDataUpload,
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      await updateProfile({ avatar_url: data.avatar_url });
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
    if (usernameAvailable === false) {
      toast({
        variant: "destructive",
        title: "Username taken",
        description: "Please choose a different username.",
      });
      return;
    }
    setLoading(true);
    await updateProfile(formData);
    setLoading(false);
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const usernameChanged = formData.username.trim() !== profile.username;

  return (
    <>
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

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your public profile information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-secondary text-secondary-foreground text-2xl">
                {profile.display_name?.charAt(0)?.toUpperCase() || profile.username?.charAt(0)?.toUpperCase() || 'U'}
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
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Enter username"
                  className={usernameChanged && usernameAvailable === false ? 'border-destructive pr-10' : usernameChanged && usernameAvailable === true ? 'border-green-500 pr-10' : ''}
                />
                {usernameChanged && (
                  <div className="absolute right-3 top-3">
                    {checkingUsername ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : usernameAvailable === true ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : usernameAvailable === false ? (
                      <XCircle className="h-4 w-4 text-destructive" />
                    ) : null}
                  </div>
                )}
              </div>
              {usernameChanged && usernameAvailable === false && (
                <p className="text-sm text-destructive">This username is already taken</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="Enter display name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about yourself"
                rows={4}
              />
            </div>

            <Button onClick={handleSaveProfile} disabled={loading || (usernameChanged && usernameAvailable === false)}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
};
