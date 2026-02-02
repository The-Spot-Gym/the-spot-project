import { useState } from "react";
import { Dumbbell, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/date";
import { workoutService } from "@/services/workoutService";
import type { WorkoutSession, WorkoutExercise } from "@/types";

interface RecentWorkoutsProps {
  workouts: WorkoutSession[];
}

interface WorkoutItemProps {
  workout: WorkoutSession;
}

const WorkoutItem = ({ workout }: WorkoutItemProps) => {
  const [expanded, setExpanded] = useState(false);
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);

  const toggleExpanded = async () => {
    if (!expanded && exercises.length === 0) {
      setLoadingExercises(true);
      const data = await workoutService.getSessionExercises(workout.id);
      setExercises(data);
      setLoadingExercises(false);
    }
    setExpanded(!expanded);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={toggleExpanded}
        className="w-full p-4 flex justify-between items-center hover:bg-muted/50 transition-colors text-left"
      >
        <div className="space-y-1">
          <p className="font-medium">{formatDate(workout.session_date)}</p>
          {workout.notes && (
            <p className="text-sm text-muted-foreground">{workout.notes}</p>
          )}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t bg-muted/30 p-4 space-y-3">
          {loadingExercises ? (
            <p className="text-sm text-muted-foreground">Loading exercises...</p>
          ) : exercises.length === 0 ? (
            <p className="text-sm text-muted-foreground">No exercises recorded</p>
          ) : (
            <div className="space-y-2">
              {exercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 p-2 bg-background rounded-md"
                >
                  <span className="font-medium text-sm">{exercise.exercise_name}</span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{exercise.sets} sets</span>
                    <span>×</span>
                    <span>{exercise.reps} reps</span>
                    <span>@</span>
                    <span className="font-medium text-foreground">{exercise.weight} lbs</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const RecentWorkouts = ({ workouts }: RecentWorkoutsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Workouts</CardTitle>
        <CardDescription>Tap a workout to see exercises</CardDescription>
      </CardHeader>
      <CardContent>
        {workouts.length === 0 ? (
          <EmptyState
            icon={Dumbbell}
            title="No workouts logged yet"
            description="Start logging to track your progress!"
          />
        ) : (
          <div className="space-y-3">
            {workouts.map((workout) => (
              <WorkoutItem key={workout.id} workout={workout} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
