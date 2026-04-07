import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Edit, Users, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingState } from "@/components/LoadingState";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { PartneredGym } from "@/types/partneredGym";

const fromTable = (table: string) => supabase.from(table as any);

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useAdminRole();
  const { toast } = useToast();
  const [gyms, setGyms] = useState<PartneredGym[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateGym, setShowCreateGym] = useState(false);
  const [showCreateManager, setShowCreateManager] = useState(false);
  const [selectedGymId, setSelectedGymId] = useState<string | null>(null);

  // Create gym form
  const [gymForm, setGymForm] = useState({
    name: '', description: '', image_url: '', contact_email: '', contact_phone: '', website: '',
    mma_enabled: false, mma_webpage_url: '', mma_description: '',
    social_instagram: '', social_facebook: '', social_twitter: '', social_youtube: '', social_tiktok: '',
  });

  // Create manager form
  const [managerEmail, setManagerEmail] = useState('');
  const [managerPassword, setManagerPassword] = useState('');
  const [managerGymId, setManagerGymId] = useState('');

  const fetchGyms = async () => {
    const { data } = await fromTable('partnered_gyms').select('*').order('name');
    setGyms((data as any as PartneredGym[]) || []);
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) fetchGyms(); }, [isAdmin]);

  if (roleLoading) return <LoadingState message="Checking permissions..." fullScreen />;
  if (!isAdmin) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">You don't have admin access.</p>
        <Button onClick={() => navigate('/')} className="mt-4">Go Home</Button>
      </Card>
    </div>
  );

  const handleCreateGym = async () => {
    const socialLinks: Record<string, string> = {};
    if (gymForm.social_instagram) socialLinks.instagram = gymForm.social_instagram;
    if (gymForm.social_facebook) socialLinks.facebook = gymForm.social_facebook;
    if (gymForm.social_twitter) socialLinks.twitter = gymForm.social_twitter;
    if (gymForm.social_youtube) socialLinks.youtube = gymForm.social_youtube;
    if (gymForm.social_tiktok) socialLinks.tiktok = gymForm.social_tiktok;

    const { error } = await fromTable('partnered_gyms').insert({
      name: gymForm.name,
      description: gymForm.description || null,
      image_url: gymForm.image_url || null,
      contact_email: gymForm.contact_email || null,
      contact_phone: gymForm.contact_phone || null,
      website: gymForm.website || null,
      mma_enabled: gymForm.mma_enabled,
      mma_webpage_url: gymForm.mma_webpage_url || null,
      mma_description: gymForm.mma_description || null,
      social_links: socialLinks,
    } as any);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Gym Created", description: `${gymForm.name} has been added as a partnered gym.` });
      setShowCreateGym(false);
      setGymForm({ name: '', description: '', image_url: '', contact_email: '', contact_phone: '', website: '', mma_enabled: false, mma_webpage_url: '', mma_description: '', social_instagram: '', social_facebook: '', social_twitter: '', social_youtube: '', social_tiktok: '' });
      fetchGyms();
    }
  };

  const handleCreateManager = async () => {
    if (!managerEmail || !managerPassword || !managerGymId) {
      toast({ title: "Error", description: "All fields are required", variant: "destructive" });
      return;
    }

    // Create the user account via Supabase Auth (sign up)
    // We'll use the admin function to create account + assign role
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: managerEmail,
      password: managerPassword,
    });

    if (signUpError) {
      toast({ title: "Error creating account", description: signUpError.message, variant: "destructive" });
      return;
    }

    if (!signUpData.user) {
      toast({ title: "Error", description: "Failed to create user", variant: "destructive" });
      return;
    }

    // Assign gym_owner role
    const { error: roleError } = await fromTable('user_roles').insert({
      user_id: signUpData.user.id,
      role: 'gym_owner',
    } as any);

    if (roleError) {
      console.error('Role assignment error:', roleError);
    }

    // Assign as gym manager
    const { error: mgrError } = await fromTable('partnered_gym_managers').insert({
      gym_id: managerGymId,
      user_id: signUpData.user.id,
    } as any);

    if (mgrError) {
      console.error('Manager assignment error:', mgrError);
    }

    toast({ title: "Manager Created", description: `Account created for ${managerEmail} and assigned to gym.` });
    setShowCreateManager(false);
    setManagerEmail('');
    setManagerPassword('');
    setManagerGymId('');
  };

  const handleDeleteGym = async (gymId: string, gymName: string) => {
    if (!confirm(`Delete ${gymName}? This cannot be undone.`)) return;
    const { error } = await fromTable('partnered_gyms').delete().eq('id', gymId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: `${gymName} has been removed.` });
      fetchGyms();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center gap-4 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="font-bold text-lg">Admin Panel</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <Tabs defaultValue="gyms">
          <TabsList>
            <TabsTrigger value="gyms">Partnered Gyms</TabsTrigger>
            <TabsTrigger value="managers">Gym Managers</TabsTrigger>
          </TabsList>

          <TabsContent value="gyms" className="mt-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Partnered Gyms ({gyms.length})</h2>
              <Dialog open={showCreateGym} onOpenChange={setShowCreateGym}>
                <DialogTrigger asChild>
                  <Button><Plus className="w-4 h-4 mr-2" /> Add Gym</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>Add Partnered Gym</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div><Label>Gym Name *</Label><Input value={gymForm.name} onChange={e => setGymForm(p => ({...p, name: e.target.value}))} /></div>
                    <div><Label>Description</Label><Textarea value={gymForm.description} onChange={e => setGymForm(p => ({...p, description: e.target.value}))} /></div>
                    <div><Label>Image URL</Label><Input value={gymForm.image_url} onChange={e => setGymForm(p => ({...p, image_url: e.target.value}))} placeholder="https://..." /></div>
                    <div><Label>Contact Email</Label><Input value={gymForm.contact_email} onChange={e => setGymForm(p => ({...p, contact_email: e.target.value}))} /></div>
                    <div><Label>Contact Phone</Label><Input value={gymForm.contact_phone} onChange={e => setGymForm(p => ({...p, contact_phone: e.target.value}))} /></div>
                    <div><Label>Website</Label><Input value={gymForm.website} onChange={e => setGymForm(p => ({...p, website: e.target.value}))} /></div>
                    
                    <div className="flex items-center gap-3">
                      <Switch checked={gymForm.mma_enabled} onCheckedChange={v => setGymForm(p => ({...p, mma_enabled: v}))} />
                      <Label>MMA Classes Available</Label>
                    </div>
                    {gymForm.mma_enabled && (
                      <>
                        <div><Label>MMA Webpage URL</Label><Input value={gymForm.mma_webpage_url} onChange={e => setGymForm(p => ({...p, mma_webpage_url: e.target.value}))} /></div>
                        <div><Label>MMA Description</Label><Textarea value={gymForm.mma_description} onChange={e => setGymForm(p => ({...p, mma_description: e.target.value}))} /></div>
                      </>
                    )}

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Social Media Links</h4>
                      <div className="space-y-2">
                        <div><Label>Instagram</Label><Input value={gymForm.social_instagram} onChange={e => setGymForm(p => ({...p, social_instagram: e.target.value}))} placeholder="https://instagram.com/..." /></div>
                        <div><Label>Facebook</Label><Input value={gymForm.social_facebook} onChange={e => setGymForm(p => ({...p, social_facebook: e.target.value}))} placeholder="https://facebook.com/..." /></div>
                        <div><Label>Twitter/X</Label><Input value={gymForm.social_twitter} onChange={e => setGymForm(p => ({...p, social_twitter: e.target.value}))} placeholder="https://x.com/..." /></div>
                        <div><Label>YouTube</Label><Input value={gymForm.social_youtube} onChange={e => setGymForm(p => ({...p, social_youtube: e.target.value}))} placeholder="https://youtube.com/..." /></div>
                        <div><Label>TikTok</Label><Input value={gymForm.social_tiktok} onChange={e => setGymForm(p => ({...p, social_tiktok: e.target.value}))} placeholder="https://tiktok.com/..." /></div>
                      </div>
                    </div>

                    <Button onClick={handleCreateGym} disabled={!gymForm.name} className="w-full">Create Gym</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {loading ? <LoadingState message="Loading gyms..." /> : gyms.map(gym => (
              <Card key={gym.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {gym.image_url ? (
                        <img src={gym.image_url} alt={gym.name} className="w-16 h-16 rounded-lg object-cover" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-2xl">🏋️</div>
                      )}
                      <div>
                        <h3 className="font-semibold text-lg">{gym.name}</h3>
                        <p className="text-sm text-muted-foreground">{gym.description?.substring(0, 100) || 'No description'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/admin/partnered-gym/${gym.id}`)}>
                        <Edit className="w-4 h-4 mr-1" /> Manage
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/partnered-gym/${gym.id}`)}>
                        View Page
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteGym(gym.id, gym.name)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="managers" className="mt-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Gym Manager Accounts</h2>
              <Dialog open={showCreateManager} onOpenChange={setShowCreateManager}>
                <DialogTrigger asChild>
                  <Button><Plus className="w-4 h-4 mr-2" /> Create Manager</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Create Gym Manager Account</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div><Label>Email *</Label><Input type="email" value={managerEmail} onChange={e => setManagerEmail(e.target.value)} /></div>
                    <div><Label>Password *</Label><Input type="password" value={managerPassword} onChange={e => setManagerPassword(e.target.value)} /></div>
                    <div>
                      <Label>Assign to Gym *</Label>
                      <Select value={managerGymId} onValueChange={setManagerGymId}>
                        <SelectTrigger><SelectValue placeholder="Select a gym" /></SelectTrigger>
                        <SelectContent>
                          {gyms.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleCreateManager} className="w-full">Create Account & Assign</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-sm">Create manager accounts above. Each manager will be able to edit their assigned gym's classes, announcements, images, locations, and contact info.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
