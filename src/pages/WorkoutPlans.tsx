import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { WorkoutPlanForm } from '@/components/workout/WorkoutPlanForm';
import { useWorkoutPlansQuery, useCreateWorkoutPlanMutation, useUpdateWorkoutPlanMutation, useDeleteWorkoutPlanMutation } from '@/hooks/queries/useWorkoutPlanQueries';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { Plus, Edit, Trash2, Dumbbell } from 'lucide-react';
import type { WorkoutPlanWithExercises } from '@/types/workoutPlan';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function WorkoutPlans() {
  const { handleError, handleSuccess } = useErrorHandler();
  const { data: plans, isLoading, error } = useWorkoutPlansQuery();
  const createMutation = useCreateWorkoutPlanMutation();
  const updateMutation = useUpdateWorkoutPlanMutation();
  const deleteMutation = useDeleteWorkoutPlanMutation();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<WorkoutPlanWithExercises | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);

  const handleCreate = async (data: any) => {
    const result = await createMutation.mutateAsync(data);
    if (result.success) {
      handleSuccess('Workout plan created successfully');
      setIsCreateDialogOpen(false);
    } else {
      handleError(null, result.error);
    }
  };

  const handleUpdate = async (data: any) => {
    if (!editingPlan) return;
    const result = await updateMutation.mutateAsync({ id: editingPlan.id, input: data });
    if (result.success) {
      handleSuccess('Workout plan updated successfully');
      setEditingPlan(null);
    } else {
      handleError(null, result.error);
    }
  };

  const handleDelete = async () => {
    if (!deletingPlanId) return;
    const result = await deleteMutation.mutateAsync(deletingPlanId);
    if (result.success) {
      handleSuccess('Workout plan deleted successfully');
      setDeletingPlanId(null);
    } else {
      handleError(null, result.error);
    }
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message="Failed to load workout plans" />;

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Workout Plans</h1>
          <p className="text-muted-foreground mt-1">Create and manage your workout templates</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Plan
        </Button>
      </div>

      {!plans || plans.length === 0 ? (
        <div className="text-center py-12">
          <Dumbbell className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No workout plans yet</h3>
          <p className="text-muted-foreground mb-6">Create your first workout plan to get started</p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Plan
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {plans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{plan.name}</CardTitle>
                    {plan.description && (
                      <CardDescription className="mt-1">{plan.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingPlan(plan)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingPlanId(plan.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {plan.exercises.length} exercise{plan.exercises.length !== 1 ? 's' : ''}
                  </p>
                  {plan.exercises.slice(0, 3).map((exercise) => (
                    <div key={exercise.id} className="text-sm">
                      <span className="font-medium">{exercise.exercise_name}</span>
                      <span className="text-muted-foreground ml-2">
                        {exercise.sets} × {exercise.reps} @ {exercise.weight} lbs
                      </span>
                    </div>
                  ))}
                  {plan.exercises.length > 3 && (
                    <p className="text-sm text-muted-foreground">
                      +{plan.exercises.length - 3} more exercise{plan.exercises.length - 3 !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Workout Plan</DialogTitle>
          </DialogHeader>
          <WorkoutPlanForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreateDialogOpen(false)}
            isLoading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingPlan} onOpenChange={(open) => !open && setEditingPlan(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Workout Plan</DialogTitle>
          </DialogHeader>
          {editingPlan && (
            <WorkoutPlanForm
              initialData={{
                name: editingPlan.name,
                description: editingPlan.description,
                exercises: editingPlan.exercises,
              }}
              onSubmit={handleUpdate}
              onCancel={() => setEditingPlan(null)}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingPlanId} onOpenChange={(open) => !open && setDeletingPlanId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workout Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this workout plan? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
