import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EXERCISES } from "@/constants/exercises";
import type { Exercise } from "@/types/components";

interface WorkoutFormProps {
  currentExercise: Exercise;
  exercisesInSession: Exercise[];
  saving: boolean;
  onExerciseChange: (exercise: Exercise) => void;
  onAddExercise: () => void;
  onRemoveExercise: (index: number) => void;
  onCompleteWorkout: () => void;
}

export const WorkoutForm = ({
  currentExercise,
  exercisesInSession,
  saving,
  onExerciseChange,
  onAddExercise,
  onRemoveExercise,
  onCompleteWorkout,
}: WorkoutFormProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Today's Workout</CardTitle>
        <CardDescription>Add multiple exercises to create a complete workout</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="exercise">Exercise</Label>
          <Select 
            value={currentExercise.exercise} 
            onValueChange={(value) => onExerciseChange({ ...currentExercise, exercise: value })}
          >
            <SelectTrigger id="exercise">
              <SelectValue placeholder="Select exercise" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {EXERCISES.map(exercise => (
                <SelectItem key={exercise} value={exercise}>{exercise}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="weight">Weight (lbs)</Label>
            <Input
              id="weight"
              type="number"
              placeholder="135"
              value={currentExercise.weight}
              onChange={(e) => onExerciseChange({ ...currentExercise, weight: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reps">Reps</Label>
            <Input
              id="reps"
              type="number"
              placeholder="10"
              value={currentExercise.reps}
              onChange={(e) => onExerciseChange({ ...currentExercise, reps: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sets">Sets</Label>
            <Input
              id="sets"
              type="number"
              placeholder="3"
              value={currentExercise.sets}
              onChange={(e) => onExerciseChange({ ...currentExercise, sets: e.target.value })}
            />
          </div>
        </div>

        <Button 
          onClick={onAddExercise}
          className="w-full"
          variant="outline"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Exercise
        </Button>

        {exercisesInSession.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <Label>Exercises in this workout ({exercisesInSession.length})</Label>
            <div className="space-y-2">
              {exercisesInSession.map((ex, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{ex.exercise}</p>
                    <p className="text-xs text-muted-foreground">
                      {ex.sets} sets × {ex.reps} reps @ {ex.weight} lbs
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => onRemoveExercise(index)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button 
          onClick={onCompleteWorkout} 
          disabled={saving || exercisesInSession.length === 0}
          className="w-full"
          variant="fitness"
        >
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Complete Workout {exercisesInSession.length > 0 && `(${exercisesInSession.length} exercises)`}
        </Button>
      </CardContent>
    </Card>
  );
};
