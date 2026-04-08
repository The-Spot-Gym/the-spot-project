import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Save, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingState } from "@/components/LoadingState";
import { useAdminRole } from "@/hooks/useAdminRole";
import { usePartneredGymDetail } from "@/hooks/usePartneredGym";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DAY_NAMES, type PartneredGymClass } from "@/types/partneredGym";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const fromTable = (table: string) => supabase.from(table as any);

const AdminGymManage = () => {
  const { gymId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: roleLoading } = useAdminRole();
  const { gym, classes, announcements, images, locations, loading, isManager, refetch } = usePartneredGymDetail(gymId || null);

  // Class form
  const [classForm, setClassForm] = useState({ name: '', description: '', day_of_week: '1', start_time: '09:00', end_time: '10:00', instructor: '', is_mma: false, registration_url: '', max_capacity: '' });
  // Announcement form
  const [annForm, setAnnForm] = useState({ title: '', content: '', is_pinned: false });
  // Image form
  const [imgForm, setImgForm] = useState({ image_url: '', caption: '' });
  // Location form
  const [locForm, setLocForm] = useState({ name: '', address: '', phone: '' });
  // Edit class
  const [editingClass, setEditingClass] = useState<PartneredGymClass | null>(null);
  const [editClassForm, setEditClassForm] = useState({ name: '', description: '', day_of_week: '1', start_time: '09:00', end_time: '10:00', instructor: '', is_mma: false, registration_url: '', max_capacity: '' });

  if (roleLoading || loading) return <LoadingState message="Loading..." fullScreen />;
  if (!isManager) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">You don't have access to manage this gym.</p>
        <Button onClick={() => navigate('/')} className="mt-4">Go Home</Button>
      </Card>
    </div>
  );

  const handleAddClass = async () => {
    const { error } = await fromTable('partnered_gym_classes').insert({
      gym_id: gymId,
      name: classForm.name,
      description: classForm.description || null,
      day_of_week: parseInt(classForm.day_of_week),
      start_time: classForm.start_time,
      end_time: classForm.end_time,
      instructor: classForm.instructor || null,
      is_mma: classForm.is_mma,
      registration_url: classForm.registration_url || null,
      max_capacity: classForm.max_capacity ? parseInt(classForm.max_capacity) : null,
    } as any);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Class Added" });
    setClassForm({ name: '', description: '', day_of_week: '1', start_time: '09:00', end_time: '10:00', instructor: '', is_mma: false, registration_url: '', max_capacity: '' });
    refetch();
  };

  const handleDeleteClass = async (id: string) => {
    await fromTable('partnered_gym_classes').delete().eq('id', id);
    toast({ title: "Class Deleted" });
    refetch();
  };

  const openEditClass = (c: PartneredGymClass) => {
    setEditingClass(c);
    setEditClassForm({
      name: c.name,
      description: c.description || '',
      day_of_week: String(c.day_of_week),
      start_time: c.start_time,
      end_time: c.end_time,
      instructor: c.instructor || '',
      is_mma: c.is_mma,
      registration_url: c.registration_url || '',
      max_capacity: c.max_capacity ? String(c.max_capacity) : '',
    });
  };

  const handleUpdateClass = async () => {
    if (!editingClass) return;
    const { error } = await fromTable('partnered_gym_classes').update({
      name: editClassForm.name,
      description: editClassForm.description || null,
      day_of_week: parseInt(editClassForm.day_of_week),
      start_time: editClassForm.start_time,
      end_time: editClassForm.end_time,
      instructor: editClassForm.instructor || null,
      is_mma: editClassForm.is_mma,
      registration_url: editClassForm.registration_url || null,
      max_capacity: editClassForm.max_capacity ? parseInt(editClassForm.max_capacity) : null,
    } as any).eq('id', editingClass.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Class Updated" });
    setEditingClass(null);
    refetch();
  };

  const handleAddAnnouncement = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await fromTable('partnered_gym_announcements').insert({
      gym_id: gymId, title: annForm.title, content: annForm.content, is_pinned: annForm.is_pinned, created_by: user?.id,
    } as any);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Announcement Added" });
    setAnnForm({ title: '', content: '', is_pinned: false });
    refetch();
  };

  const handleDeleteAnnouncement = async (id: string) => {
    await fromTable('partnered_gym_announcements').delete().eq('id', id);
    toast({ title: "Announcement Deleted" });
    refetch();
  };

  const handleAddImage = async () => {
    const { error } = await fromTable('partnered_gym_images').insert({
      gym_id: gymId, image_url: imgForm.image_url, caption: imgForm.caption || null, display_order: images.length,
    } as any);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Image Added" });
    setImgForm({ image_url: '', caption: '' });
    refetch();
  };

  const handleDeleteImage = async (id: string) => {
    await fromTable('partnered_gym_images').delete().eq('id', id);
    toast({ title: "Image Deleted" });
    refetch();
  };

  const handleAddLocation = async () => {
    const { error } = await fromTable('partnered_gym_locations').insert({
      gym_id: gymId, name: locForm.name, address: locForm.address, phone: locForm.phone || null,
    } as any);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Location Added" });
    setLocForm({ name: '', address: '', phone: '' });
    refetch();
  };

  const handleDeleteLocation = async (id: string) => {
    await fromTable('partnered_gym_locations').delete().eq('id', id);
    toast({ title: "Location Deleted" });
    refetch();
  };

  const formatTime = (t: string) => {
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${hour % 12 || 12}:${m} ${ampm}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center gap-4 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-bold text-lg">Manage: {gym?.name}</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4">
        <Tabs defaultValue="classes">
          <TabsList className="w-full flex overflow-x-auto">
            <TabsTrigger value="classes">Classes</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="locations">Locations</TabsTrigger>
          </TabsList>

          {/* Classes */}
          <TabsContent value="classes" className="mt-6 space-y-4">
            <Card>
              <CardHeader><CardTitle>Add Class</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Name *</Label><Input value={classForm.name} onChange={e => setClassForm(p => ({...p, name: e.target.value}))} /></div>
                  <div><Label>Instructor</Label><Input value={classForm.instructor} onChange={e => setClassForm(p => ({...p, instructor: e.target.value}))} /></div>
                </div>
                <div><Label>Description</Label><Textarea value={classForm.description} onChange={e => setClassForm(p => ({...p, description: e.target.value}))} /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Day</Label>
                    <Select value={classForm.day_of_week} onValueChange={v => setClassForm(p => ({...p, day_of_week: v}))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DAY_NAMES.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Start</Label><Input type="time" value={classForm.start_time} onChange={e => setClassForm(p => ({...p, start_time: e.target.value}))} /></div>
                  <div><Label>End</Label><Input type="time" value={classForm.end_time} onChange={e => setClassForm(p => ({...p, end_time: e.target.value}))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Registration URL</Label><Input value={classForm.registration_url} onChange={e => setClassForm(p => ({...p, registration_url: e.target.value}))} /></div>
                  <div><Label>Max Capacity</Label><Input type="number" value={classForm.max_capacity} onChange={e => setClassForm(p => ({...p, max_capacity: e.target.value}))} /></div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={classForm.is_mma} onCheckedChange={v => setClassForm(p => ({...p, is_mma: v}))} />
                  <Label>MMA Class</Label>
                </div>
                <Button onClick={handleAddClass} disabled={!classForm.name}><Plus className="w-4 h-4 mr-1" /> Add Class</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Existing Classes ({classes.length})</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {classes.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{c.name} {c.is_mma && '🥊'}</p>
                      <p className="text-sm text-muted-foreground">{DAY_NAMES[c.day_of_week]} {formatTime(c.start_time)} - {formatTime(c.end_time)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditClass(c)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteClass(c.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
                {classes.length === 0 && <p className="text-muted-foreground">No classes added yet.</p>}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Announcements */}
          <TabsContent value="announcements" className="mt-6 space-y-4">
            <Card>
              <CardHeader><CardTitle>Add Announcement</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div><Label>Title *</Label><Input value={annForm.title} onChange={e => setAnnForm(p => ({...p, title: e.target.value}))} /></div>
                <div><Label>Content *</Label><Textarea value={annForm.content} onChange={e => setAnnForm(p => ({...p, content: e.target.value}))} /></div>
                <div className="flex items-center gap-3">
                  <Switch checked={annForm.is_pinned} onCheckedChange={v => setAnnForm(p => ({...p, is_pinned: v}))} />
                  <Label>Pin this announcement</Label>
                </div>
                <Button onClick={handleAddAnnouncement} disabled={!annForm.title || !annForm.content}><Plus className="w-4 h-4 mr-1" /> Add</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Existing Announcements ({announcements.length})</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {announcements.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{a.is_pinned && '📌 '}{a.title}</p>
                      <p className="text-sm text-muted-foreground">{a.content.substring(0, 80)}...</p>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteAnnouncement(a.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                ))}
                {announcements.length === 0 && <p className="text-muted-foreground">No announcements yet.</p>}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Images */}
          <TabsContent value="images" className="mt-6 space-y-4">
            <Card>
              <CardHeader><CardTitle>Add Image</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div><Label>Image URL *</Label><Input value={imgForm.image_url} onChange={e => setImgForm(p => ({...p, image_url: e.target.value}))} placeholder="https://..." /></div>
                <div><Label>Caption</Label><Input value={imgForm.caption} onChange={e => setImgForm(p => ({...p, caption: e.target.value}))} /></div>
                <Button onClick={handleAddImage} disabled={!imgForm.image_url}><Plus className="w-4 h-4 mr-1" /> Add Image</Button>
              </CardContent>
            </Card>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {images.map(img => (
                <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden group">
                  <img src={img.image_url} alt={img.caption || ''} className="w-full h-full object-cover" />
                  <Button variant="destructive" size="sm" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteImage(img.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Locations */}
          <TabsContent value="locations" className="mt-6 space-y-4">
            <Card>
              <CardHeader><CardTitle>Add Location</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div><Label>Location Name *</Label><Input value={locForm.name} onChange={e => setLocForm(p => ({...p, name: e.target.value}))} /></div>
                <div><Label>Address *</Label><Input value={locForm.address} onChange={e => setLocForm(p => ({...p, address: e.target.value}))} /></div>
                <div><Label>Phone</Label><Input value={locForm.phone} onChange={e => setLocForm(p => ({...p, phone: e.target.value}))} /></div>
                <Button onClick={handleAddLocation} disabled={!locForm.name || !locForm.address}><Plus className="w-4 h-4 mr-1" /> Add Location</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Existing Locations ({locations.length})</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {locations.map(l => (
                  <div key={l.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{l.name}</p>
                      <p className="text-sm text-muted-foreground">{l.address}</p>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteLocation(l.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                ))}
                {locations.length === 0 && <p className="text-muted-foreground">No locations added yet.</p>}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Class Dialog */}
      <Dialog open={!!editingClass} onOpenChange={open => !open && setEditingClass(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Class</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Name *</Label><Input value={editClassForm.name} onChange={e => setEditClassForm(p => ({...p, name: e.target.value}))} /></div>
              <div><Label>Instructor</Label><Input value={editClassForm.instructor} onChange={e => setEditClassForm(p => ({...p, instructor: e.target.value}))} /></div>
            </div>
            <div><Label>Description</Label><Textarea value={editClassForm.description} onChange={e => setEditClassForm(p => ({...p, description: e.target.value}))} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Day</Label>
                <Select value={editClassForm.day_of_week} onValueChange={v => setEditClassForm(p => ({...p, day_of_week: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAY_NAMES.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Start</Label><Input type="time" value={editClassForm.start_time} onChange={e => setEditClassForm(p => ({...p, start_time: e.target.value}))} /></div>
              <div><Label>End</Label><Input type="time" value={editClassForm.end_time} onChange={e => setEditClassForm(p => ({...p, end_time: e.target.value}))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Registration URL</Label><Input value={editClassForm.registration_url} onChange={e => setEditClassForm(p => ({...p, registration_url: e.target.value}))} /></div>
              <div><Label>Max Capacity</Label><Input type="number" value={editClassForm.max_capacity} onChange={e => setEditClassForm(p => ({...p, max_capacity: e.target.value}))} /></div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={editClassForm.is_mma} onCheckedChange={v => setEditClassForm(p => ({...p, is_mma: v}))} />
              <Label>MMA Class</Label>
            </div>
            <Button onClick={handleUpdateClass} disabled={!editClassForm.name} className="w-full"><Save className="w-4 h-4 mr-1" /> Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminGymManage;
