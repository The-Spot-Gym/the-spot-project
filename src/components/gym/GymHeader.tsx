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
    <>
      {/* Safe area spacer for iOS notch */}
      <div className="h-safe-top bg-background" />
      <header className="bg-background border-b sticky top-0 z-10 pt-safe">
        <div className="max-w-6xl mx-auto p-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onBack}
              className="flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {gymData.photo_url && (
                <img 
                  src={gymData.photo_url} 
                  alt={gymData.name}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <h1 className="font-bold text-base sm:text-lg truncate">{gymData.name}</h1>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {gymData.rating && (
                    <>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-warning text-warning flex-shrink-0" />
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
            {/* Action buttons on same row */}
            <div className="flex gap-2 flex-shrink-0">
              {!hasJoined ? (
                <Button variant="fitness" onClick={onJoin} size="sm">
                  <UserPlus className="w-4 h-4" />
                </Button>
              ) : (
                <>
                  <Badge variant="success" className="h-8 px-2">
                    <Users className="w-4 h-4" />
                  </Badge>
                  <Button variant="outline" size="sm" onClick={onLeave}>
                    Leave
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};
