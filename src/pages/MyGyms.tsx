import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dumbbell, MapPin, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const MyGyms = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [myGyms, setMyGyms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadMyGyms();
    }
  }, [user]);

  const loadMyGyms = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: gymsData } = await supabase
        .from('gym_memberships')
        .select(`
          *,
          gym:gyms(*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (gymsData) {
        setMyGyms(gymsData);
      }
    } catch (error) {
      console.error('Error loading gyms:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm p-4 sticky top-0 z-10 border-b">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-bold text-xl">My Gyms</h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>My Gyms</CardTitle>
            <CardDescription>Gyms you're a member of</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : myGyms.length === 0 ? (
              <div className="text-center py-8">
                <Dumbbell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No gym memberships yet</p>
                <Button variant="fitness" onClick={() => navigate('/gyms-near-you')}>
                  <MapPin className="w-4 h-4 mr-2" />
                  Find Gyms
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {myGyms.map((membership: any) => (
                  <div 
                    key={membership.id} 
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/gym/${membership.gym_id}`)}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {membership.gym?.photo_url && (
                        <img 
                          src={membership.gym.photo_url} 
                          alt={membership.gym.name}
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{membership.gym?.name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{membership.gym?.address}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Joined {new Date(membership.joined_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto flex-shrink-0">
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MyGyms;
