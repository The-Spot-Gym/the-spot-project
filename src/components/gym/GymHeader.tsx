import { ArrowLeft, Star, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { GymDetailsResponse } from "@/types/api";

interface GymHeaderProps {
  gymData: GymDetailsResponse['gym'];
  hasJoined: boolean;
  onBack: () => void;
  onJoin: () => void;
  onLeave: () => void;
}

export const GymHeader = ({ gymData, hasJoined, onBack, onJoin, onLeave }: GymHeaderProps) => {
  return (
    <header className="bg-white shadow-card p-4 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-2 mb-3 sm:mb-0">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onBack}
            className="flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {gymData.photo_url && (
              <img 
                src={gymData.photo_url} 
                alt={gymData.name}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <h1 className="font-bold text-lg sm:text-xl truncate">{gymData.name}</h1>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                {gymData.rating && (
                  <>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-warning text-warning flex-shrink-0" />
                      <span>{gymData.rating}</span>
                    </div>
                    <span>•</span>
                  </>
                )}
                {gymData.user_ratings_total && (
                  <span className="truncate">{gymData.user_ratings_total} reviews</span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 sm:absolute sm:right-4 sm:top-4">
          {!hasJoined ? (
            <Button variant="fitness" onClick={onJoin} size="sm" className="flex-1 sm:flex-initial">
              <UserPlus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Join Gym</span>
            </Button>
          ) : (
            <>
              <Badge variant="success" className="flex-1 sm:flex-initial justify-center">
                <Users className="w-4 h-4 mr-1" />
                Member
              </Badge>
              <Button variant="outline" size="sm" onClick={onLeave} className="flex-1 sm:flex-initial">
                Leave
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
