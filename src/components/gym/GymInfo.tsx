import { MapPin, Phone, Globe, Clock, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GymDetailsResponse } from "@/types/api";

interface GymInfoProps {
  gymData: GymDetailsResponse['gym'];
}

export const GymInfo = ({ gymData }: GymInfoProps) => {
  return (
    <>
      {/* Photos */}
      {gymData.photos && gymData.photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {gymData.photos.map((photo: string, index: number) => (
                <img 
                  key={index}
                  src={photo}
                  alt={`${gymData.name} photo ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {gymData.address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{gymData.address}</span>
                </div>
              )}
              
              {gymData.phone_number && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <a href={`tel:${gymData.phone_number}`} className="hover:underline">
                    {gymData.phone_number}
                  </a>
                </div>
              )}
              
              {gymData.website && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="w-4 h-4 flex-shrink-0" />
                  <a 
                    href={gymData.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:underline truncate"
                  >
                    Visit Website
                  </a>
                </div>
              )}
            </div>

            {gymData.opening_hours && (
              <div className="space-y-2 pt-4 border-t">
                <h4 className="font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Hours
                </h4>
                {gymData.opening_hours.weekday_text ? (
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {gymData.opening_hours.weekday_text.map((day: string, index: number) => (
                      <div key={index}>{day}</div>
                    ))}
                  </div>
                ) : gymData.opening_hours.open_now !== undefined && (
                  <Badge variant={gymData.opening_hours.open_now ? "success" : "secondary"}>
                    {gymData.opening_hours.open_now ? "Open Now" : "Closed"}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ratings & Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {gymData.rating && (
              <div className="text-center p-6 bg-gradient-primary rounded-lg text-white">
                <div className="text-4xl font-bold">{gymData.rating}</div>
                <div className="text-sm opacity-90 mt-1">Overall Rating</div>
                <div className="flex justify-center mt-2">
                  {[1,2,3,4,5].map(star => (
                    <Star 
                      key={star} 
                      className={`w-5 h-5 ${star <= Math.round(gymData.rating!) ? 'fill-current' : ''}`}
                    />
                  ))}
                </div>
                {gymData.user_ratings_total && (
                  <div className="text-sm opacity-90 mt-2">
                    Based on {gymData.user_ratings_total} reviews
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};
