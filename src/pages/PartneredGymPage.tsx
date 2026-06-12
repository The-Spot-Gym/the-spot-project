import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Phone, Mail, Globe, Users, Star, ExternalLink, Clock, Megaphone, Image, Swords, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LoadingState } from "@/components/LoadingState";
import Leaderboard from "@/components/Leaderboard";
import { usePartneredGymDetail } from "@/hooks/usePartneredGym";
import { DAY_NAMES } from "@/types/partneredGym";
import type { PartneredGymClass } from "@/types/partneredGym";

const PartneredGymPage = () => {
  const { gymId } = useParams();
  const navigate = useNavigate();
  const { gym, classes, announcements, images, locations, isMember, memberCount, loading, isManager, joinGym, leaveGym } = usePartneredGymDetail(gymId || null);

  if (loading) return <LoadingState message="Loading gym..." fullScreen />;
  if (!gym) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Gym not found</p>
        <Button onClick={() => navigate('/')} className="mt-4">Go Back</Button>
      </Card>
    </div>
  );

  const mmaClasses = classes.filter(c => c.is_mma);
  const regularClasses = classes.filter(c => !c.is_mma);
  const socialLinks = (gym.social_links || {}) as Record<string, string>;

  // Group classes by day
  const groupByDay = (cls: PartneredGymClass[]) => {
    const grouped: Record<number, PartneredGymClass[]> = {};
    cls.forEach(c => {
      if (!grouped[c.day_of_week]) grouped[c.day_of_week] = [];
      grouped[c.day_of_week].push(c);
    });
    return grouped;
  };

  const formatTime = (t: string) => {
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  };

  const pinnedAnnouncements = announcements.filter(a => a.is_pinned);
  const otherAnnouncements = announcements.filter(a => !a.is_pinned);

  const tabCount = 4 + (gym.mma_enabled ? 1 : 0) + (locations.length > 0 ? 1 : 0) + (images.length > 0 ? 1 : 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="relative">
        {gym.image_url ? (
          <div className="h-48 md:h-64 w-full bg-cover bg-center" style={{ backgroundImage: `url(${gym.image_url})` }}>
            <div className="absolute inset-0 bg-black/50" />
          </div>
        ) : (
          <div className="h-48 md:h-64 w-full bg-gradient-to-br from-primary/80 to-primary/40" />
        )}
        <div className="absolute left-4 z-20" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 0.5rem)' }}>
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="bg-background/80 backdrop-blur h-11 w-11 !text-gray-900">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 pl-6 text-white z-10 pointer-events-none">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary" className="bg-primary text-primary-foreground">
              <Star className="w-3 h-3 mr-1" /> Partner Gym
            </Badge>
            {gym.mma_enabled && <Badge variant="outline" className="text-white border-white"><Swords className="w-3 h-3 mr-1" /> MMA</Badge>}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">{gym.name}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm">
            <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {memberCount} members</span>
          </div>
        </div>
      </div>

      {/* Join / Leave + Management */}
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
        {isMember ? (
          <Button variant="outline" onClick={leaveGym}>Leave Gym</Button>
        ) : (
          <Button variant="fitness" onClick={joinGym}>Join This Gym</Button>
        )}
        {isManager && (
          <Button variant="secondary" onClick={() => navigate(`/admin/partnered-gym/${gymId}`)}>
            Manage Gym
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full flex overflow-x-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="schedule">Classes</TabsTrigger>
            {gym.mma_enabled && <TabsTrigger value="mma">MMA</TabsTrigger>}
            <TabsTrigger value="announcements">News</TabsTrigger>
            {images.length > 0 && <TabsTrigger value="gallery">Gallery</TabsTrigger>}
            {locations.length > 0 && <TabsTrigger value="locations">Locations</TabsTrigger>}
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            {gym.description && (
              <Card>
                <CardHeader><CardTitle>About</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground whitespace-pre-wrap">{gym.description}</p></CardContent>
              </Card>
            )}
            {pinnedAnnouncements.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Megaphone className="w-5 h-5" /> Pinned Announcements</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {pinnedAnnouncements.map(a => (
                    <div key={a.id} className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold">{a.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{a.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">{new Date(a.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            {gym.website && (
              <Card>
                <CardContent className="pt-6">
                  <a href={gym.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                    <Globe className="w-4 h-4" /> Visit Website <ExternalLink className="w-3 h-3" />
                  </a>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Class Schedule */}
          <TabsContent value="schedule" className="mt-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5" /> Class Schedule</CardTitle></CardHeader>
              <CardContent>
                {regularClasses.length === 0 ? (
                  <p className="text-muted-foreground">No classes scheduled yet.</p>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(groupByDay(regularClasses)).sort(([a],[b]) => Number(a)-Number(b)).map(([day, cls]) => (
                      <div key={day}>
                        <h3 className="font-semibold text-lg mb-3">{DAY_NAMES[Number(day)]}</h3>
                        <div className="space-y-2">
                          {cls.map(c => (
                            <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border">
                              <div>
                                <p className="font-medium">{c.name}</p>
                                {c.instructor && <p className="text-sm text-muted-foreground">with {c.instructor}</p>}
                                {c.description && <p className="text-sm text-muted-foreground mt-1">{c.description}</p>}
                              </div>
                              <div className="text-right text-sm">
                                <p>{formatTime(c.start_time)} - {formatTime(c.end_time)}</p>
                                {c.max_capacity && <p className="text-muted-foreground">{c.max_capacity} spots</p>}
                                {c.registration_url && (
                                  <a href={c.registration_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs">Register →</a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* MMA */}
          {gym.mma_enabled && (
            <TabsContent value="mma" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Swords className="w-5 h-5" /> MMA Classes</CardTitle>
                  {gym.mma_description && <CardDescription>{gym.mma_description}</CardDescription>}
                </CardHeader>
                <CardContent>
                  {gym.mma_webpage_url && (
                    <a href={gym.mma_webpage_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                      View Full MMA Details <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  {mmaClasses.length === 0 ? (
                    <p className="text-muted-foreground">No MMA classes scheduled yet.</p>
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(groupByDay(mmaClasses)).sort(([a],[b]) => Number(a)-Number(b)).map(([day, cls]) => (
                        <div key={day}>
                          <h3 className="font-semibold text-lg mb-3">{DAY_NAMES[Number(day)]}</h3>
                          <div className="space-y-2">
                            {cls.map(c => (
                              <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-primary/5">
                                <div>
                                  <p className="font-medium">{c.name}</p>
                                  {c.instructor && <p className="text-sm text-muted-foreground">with {c.instructor}</p>}
                                  {c.description && <p className="text-sm text-muted-foreground mt-1">{c.description}</p>}
                                </div>
                                <div className="text-right text-sm">
                                  <p>{formatTime(c.start_time)} - {formatTime(c.end_time)}</p>
                                  {c.registration_url && (
                                    <a href={c.registration_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs">Register →</a>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Announcements */}
          <TabsContent value="announcements" className="mt-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Megaphone className="w-5 h-5" /> Announcements</CardTitle></CardHeader>
              <CardContent>
                {announcements.length === 0 ? (
                  <p className="text-muted-foreground">No announcements yet.</p>
                ) : (
                  <div className="space-y-4">
                    {announcements.map(a => (
                      <div key={a.id} className={`p-4 rounded-lg border ${a.is_pinned ? 'border-primary bg-primary/5' : ''}`}>
                        <div className="flex items-center gap-2 mb-1">
                          {a.is_pinned && <Badge variant="secondary">📌 Pinned</Badge>}
                          <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
                        </div>
                        <h4 className="font-semibold">{a.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{a.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gallery */}
          {images.length > 0 && (
            <TabsContent value="gallery" className="mt-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {images.map(img => (
                  <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden group">
                    <img src={img.image_url} alt={img.caption || 'Gym photo'} className="w-full h-full object-cover" />
                    {img.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        {img.caption}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>
          )}

          {/* Locations */}
          {locations.length > 0 && (
            <TabsContent value="locations" className="mt-6">
              <div className="grid gap-4 md:grid-cols-2">
                {locations.map(loc => (
                  <Card key={loc.id}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2"><MapPin className="w-4 h-4" /> {loc.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p className="text-muted-foreground">{loc.address}</p>
                      {loc.phone && <p className="flex items-center gap-2"><Phone className="w-3 h-3" /> {loc.phone}</p>}
                      {Object.keys(loc.hours || {}).length > 0 && (
                        <div className="mt-2">
                          <p className="font-medium mb-1">Hours:</p>
                          {Object.entries(loc.hours).map(([day, hrs]) => (
                            <p key={day} className="text-muted-foreground">{day}: {hrs}</p>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          )}

          {/* Leaderboard */}
          <TabsContent value="leaderboard" className="mt-6">
            <Leaderboard
              gymId={gym.id}
              gymName={gym.name}
              hasJoined={isMember}
              onJoinGym={joinGym}
              partnered
            />
          </TabsContent>

          {/* Contact */}
          <TabsContent value="contact" className="mt-6 space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><MessageCircle className="w-5 h-5" /> Contact Us</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {gym.contact_email && (
                  <a href={`mailto:${gym.contact_email}`} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <Mail className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{gym.contact_email}</p>
                    </div>
                  </a>
                )}
                {gym.contact_phone && (
                  <a href={`tel:${gym.contact_phone}`} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <Phone className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">{gym.contact_phone}</p>
                    </div>
                  </a>
                )}
                {gym.website && (
                  <a href={gym.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <Globe className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">Website</p>
                      <p className="text-sm text-muted-foreground">{gym.website}</p>
                    </div>
                  </a>
                )}
              </CardContent>
            </Card>

            {Object.keys(socialLinks).length > 0 && (
              <Card>
                <CardHeader><CardTitle>Follow Us</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  {Object.entries(socialLinks).map(([platform, url]) => (
                    <a key={platform} href={url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="capitalize">
                        {platform} <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    </a>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PartneredGymPage;
