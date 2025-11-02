import { Dumbbell } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import { formatDate } from "@/utils/date";
import type { WorkoutSession } from "@/types";

interface RecentWorkoutsProps {
  workouts: WorkoutSession[];
}

export const RecentWorkouts = ({ workouts }: RecentWorkoutsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Workouts</CardTitle>
        <CardDescription>Your last 5 workout sessions</CardDescription>
      </CardHeader>
      <CardContent>
        {workouts.length === 0 ? (
          <EmptyState
            icon={Dumbbell}
            title="No workouts logged yet"
            description="Start logging to track your progress!"
          />
        ) : (
          <div className="space-y-4">
            {workouts.map((workout) => (
              <div key={workout.id} className="p-4 border rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <p className="font-medium">
                    {formatDate(workout.session_date)}
                  </p>
                </div>
                {workout.notes && (
                  <p className="text-sm text-muted-foreground">{workout.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
