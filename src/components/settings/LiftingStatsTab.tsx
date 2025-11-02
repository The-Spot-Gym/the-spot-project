import { useState, useEffect } from "react";
import { Dumbbell, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export const LiftingStatsTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [liftingStats, setLiftingStats] = useState({
    bench_press: "",
    squat: "",
    deadlift: ""
  });

  useEffect(() => {
    if (!user) return;

    const loadStats = async () => {
      const { data: statsData } = await supabase
        .from('leaderboard_stats')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (statsData?.personal_records) {
        const records = statsData.personal_records as any;
        setLiftingStats({
          bench_press: records.bench_press?.toString() || "",
          squat: records.squat?.toString() || "",
          deadlift: records.deadlift?.toString() || ""
        });
      }
    };

    loadStats();
  }, [user]);

  const handleSaveLiftingStats = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const personalRecords: any = {};
      if (liftingStats.bench_press) personalRecords.bench_press = parseInt(liftingStats.bench_press);
      if (liftingStats.squat) personalRecords.squat = parseInt(liftingStats.squat);
      if (liftingStats.deadlift) personalRecords.deadlift = parseInt(liftingStats.deadlift);

      const { error } = await supabase
        .from('leaderboard_stats')
        .upsert({
          user_id: user.id,
          personal_records: personalRecords
        }, { onConflict: 'user_id' });

      if (error) throw error;

      toast({
        title: "Stats updated!",
        description: "Your lifting stats have been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving stats:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save stats. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Dumbbell className="w-5 h-5" />
          Personal Records
        </CardTitle>
        <CardDescription>
          Your best lifts are automatically tracked from your workouts. Update them here if needed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
          💡 Tip: These stats sync automatically when you log workouts! Manual updates are optional.
        </div>

        <div className="space-y-2">
          <Label htmlFor="benchPress">Bench Press (lbs)</Label>
          <Input
            id="benchPress"
            type="number"
            value={liftingStats.bench_press}
            onChange={(e) => setLiftingStats({ ...liftingStats, bench_press: e.target.value })}
            placeholder="225"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="squat">Squat (lbs)</Label>
          <Input
            id="squat"
            type="number"
            value={liftingStats.squat}
            onChange={(e) => setLiftingStats({ ...liftingStats, squat: e.target.value })}
            placeholder="315"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="deadlift">Deadlift (lbs)</Label>
          <Input
            id="deadlift"
            type="number"
            value={liftingStats.deadlift}
            onChange={(e) => setLiftingStats({ ...liftingStats, deadlift: e.target.value })}
            placeholder="405"
          />
        </div>

        <Button onClick={handleSaveLiftingStats} disabled={loading}>
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Saving...' : 'Manually Update Stats'}
        </Button>
      </CardContent>
    </Card>
  );
};
