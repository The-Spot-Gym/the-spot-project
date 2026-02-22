import { useNavigate } from "react-router-dom";
import { Dumbbell, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ROUTES } from "@/constants/routes";
import { useUserGymsQuery } from "@/hooks/queries/useGymQueries";

const MyGyms = () => {
  const navigate = useNavigate();
  const { data: myGyms = [], isLoading: loading } = useUserGymsQuery();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="My Gyms" showBackButton />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="My Gyms" showBackButton onBack={() => navigate(ROUTES.HOME)} />

      <div className="max-w-6xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>My Gyms</CardTitle>
            <CardDescription>Gyms you're a member of</CardDescription>
          </CardHeader>
          <CardContent>
            {myGyms.length === 0 ? (
              <div>
                <EmptyState
                  icon={Dumbbell}
                  title="No gym memberships yet"
                />
                <div className="text-center mt-4">
                  <Button variant="fitness" onClick={() => navigate(ROUTES.GYMS_NEAR_YOU)}>
                    <MapPin className="w-4 h-4 mr-2" />
                    Find Gyms
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {myGyms.map((gym) => (
                  <div 
                    key={gym.id} 
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(ROUTES.GYM_DETAILS(gym.id))}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {gym.photo_url && (
                        <img 
                          src={gym.photo_url} 
                          alt={gym.name}
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{gym.name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{gym.address}</span>
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
