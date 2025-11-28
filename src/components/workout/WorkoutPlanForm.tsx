import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { X, Plus } from 'lucide-react';
import { EXERCISES } from '@/constants/exercises';
import type { CreateWorkoutPlanInput, UpdateWorkoutPlanInput } from '@/types/workoutPlan';

interface WorkoutPlanFormProps {
  initialData?: {
    name: string;
    description?: string;
    exercises: {
      id?: string;
      exercise_name: string;
      sets: number;
      reps: number;
      weight: number;
      order_index: number;
    }[];
  };
  onSubmit: (data: CreateWorkoutPlanInput | UpdateWorkoutPlanInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const WorkoutPlanForm = ({ initialData, onSubmit, onCancel, isLoading }: WorkoutPlanFormProps) => {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [exercises, setExercises] = useState(initialData?.exercises || []);
  const [currentExercise, setCurrentExercise] = useState({
    exercise_name: '',
    sets: '',
    reps: '',
    weight: '',
  });

  const addExercise = () => {
    if (!currentExercise.exercise_name || !currentExercise.sets || !currentExercise.reps || !currentExercise.weight) {
      return;
    }

    setExercises([
      ...exercises,
      {
        exercise_name: currentExercise.exercise_name,
        sets: Number(currentExercise.sets),
        reps: Number(currentExercise.reps),
        weight: Number(currentExercise.weight),
        order_index: exercises.length,
      },
    ]);

    setCurrentExercise({ exercise_name: '', sets: '', reps: '', weight: '' });
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index).map((ex, i) => ({ ...ex, order_index: i })));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, description, exercises });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Plan Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Plan Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Push Day, Pull Day"
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes about this workout plan"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add Exercises</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Exercise</Label>
              <Select
                value={currentExercise.exercise_name}
                onValueChange={(value) => setCurrentExercise({ ...currentExercise, exercise_name: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select exercise" />
                </SelectTrigger>
                <SelectContent>
                  {EXERCISES.map((exercise) => (
                    <SelectItem key={exercise} value={exercise}>
                      {exercise}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Weight (lbs)</Label>
              <Input
                type="number"
                value={currentExercise.weight}
                onChange={(e) => setCurrentExercise({ ...currentExercise, weight: e.target.value })}
                placeholder="135"
              />
            </div>
            <div>
              <Label>Reps</Label>
              <Input
                type="number"
                value={currentExercise.reps}
                onChange={(e) => setCurrentExercise({ ...currentExercise, reps: e.target.value })}
                placeholder="10"
              />
            </div>
            <div>
              <Label>Sets</Label>
              <Input
                type="number"
                value={currentExercise.sets}
                onChange={(e) => setCurrentExercise({ ...currentExercise, sets: e.target.value })}
                placeholder="3"
              />
            </div>
          </div>
          <Button type="button" onClick={addExercise} variant="secondary" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Exercise
          </Button>

          {exercises.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Exercises in this plan</h3>
              {exercises.map((exercise, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{exercise.exercise_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {exercise.sets} sets × {exercise.reps} reps @ {exercise.weight} lbs
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeExercise(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={isLoading || !name || exercises.length === 0}>
          {isLoading ? 'Saving...' : initialData ? 'Update Plan' : 'Create Plan'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};
