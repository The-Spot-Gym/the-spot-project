import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { GymReview } from "@/types/api";

interface GymReviewsListProps {
  reviews: GymReview[];
}

export const GymReviewsList = ({ reviews }: GymReviewsListProps) => {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  const filteredReviews = reviews.filter(
    (review) => selectedRating === null || review.rating === selectedRating
  );

  return (
    <>
      {reviews.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          <Button
            variant={selectedRating === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedRating(null)}
          >
            All Reviews
          </Button>
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = reviews.filter((r) => r.rating === rating).length;
            return (
              <Button
                key={rating}
                variant={selectedRating === rating ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedRating(rating)}
                disabled={count === 0}
              >
                <Star className="w-4 h-4 mr-1 fill-warning text-warning" />
                {rating} ({count})
              </Button>
            );
          })}
        </div>
      )}
      
      <div className="grid gap-4">
        {reviews.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-2 font-semibold">Reviews coming soon</p>
            <p className="text-sm text-muted-foreground">
              We're working on integrating gym reviews from Google Places
            </p>
          </Card>
        ) : filteredReviews.length > 0 ? (
          filteredReviews.map((review, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar>
                    <AvatarImage src={review.profile_photo_url} />
                    <AvatarFallback>{review.author_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{review.author_name}</h4>
                      <span className="text-sm text-muted-foreground">
                        {review.relative_time_description}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`w-4 h-4 ${star <= review.rating ? 'fill-warning text-warning' : 'text-muted'}`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">{review.text}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              {selectedRating ? `No ${selectedRating}-star reviews found` : 'No reviews yet'}
            </p>
          </Card>
        )}
      </div>
    </>
  );
};
