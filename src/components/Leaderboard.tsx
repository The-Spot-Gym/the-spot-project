import { useEffect, useState } from "react";
import { Trophy, Medal, Award, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { LeaderboardEntry } from "@/types/components";

interface LeaderboardProps {
  gymName: string;
}

const Leaderboard = ({ gymName }: LeaderboardProps) => {
  const { user } = useAuth();
  const [benchData, setBenchData] = useState<LeaderboardEntry[]>([]);
  const [squatData, setSquatData] = useState<LeaderboardEntry[]>([]);
  const [deadliftData, setDeadliftData] = useState<LeaderboardEntry[]>([]);

  const fetchLeaderboardData = async () => {
    const { data, error } = await supabase
      .from('leaderboard_stats')
      .select(`
        user_id,
        personal_records,
        profiles!inner(
          display_name,
          username,
          avatar_url
        )
      `);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return;
    }

    if (!data) return;

    // Process data for each exercise
    const processExerciseData = (exerciseKey: string) => {
      return data
        .map(entry => {
          const records = entry.personal_records as any;
          const weight = records?.[exerciseKey] || 0;
          const profile = entry.profiles as any;
          
          return {
            user_id: entry.user_id,
            name: profile?.display_name || profile?.username || 'Anonymous',
            avatar: profile?.avatar_url,
            weight,
            improvement: 0, // Could calculate from historical data
          };
        })
        .filter(entry => entry.weight > 0)
        .sort((a, b) => b.weight - a.weight)
        .map((entry, index) => ({
          rank: index + 1,
          name: entry.name,
          avatar: entry.avatar,
          weight: entry.weight,
          improvement: entry.improvement,
          isCurrentUser: entry.user_id === user?.id,
        }));
    };

    setBenchData(processExerciseData('bench_press'));
    setSquatData(processExerciseData('squat'));
    setDeadliftData(processExerciseData('deadlift'));
  };

  useEffect(() => {
    fetchLeaderboardData();

    // Set up realtime subscription
    const channel = supabase
      .channel('leaderboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leaderboard_stats'
        },
        () => {
          fetchLeaderboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-warning" />;
      case 2:
        return <Medal className="w-5 h-5 text-muted-foreground" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const renderLeaderboard = (data: LeaderboardEntry[], exercise: string) => {
    if (data.length === 0) {
      return (
        <div className="text-center py-8">
          <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">No Records Yet</h3>
          <p className="text-muted-foreground">
            Be the first to set a record in this exercise!
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {data.map((entry) => (
          <Card key={`${exercise}-${entry.rank}`} className={`transition-all duration-200 hover:shadow-md ${entry.isCurrentUser ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8">
                  {getRankIcon(entry.rank)}
                </div>
                
                <Avatar className="w-10 h-10">
                  <AvatarImage src={entry.avatar} />
                  <AvatarFallback className="bg-gradient-primary text-white text-sm">
                    {entry.name[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${entry.isCurrentUser ? 'text-primary' : ''}`}>
                      {entry.name}
                    </span>
                    {entry.isCurrentUser && (
                      <Badge variant="secondary" className="text-xs">You</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-bold text-foreground">{entry.weight} lbs</span>
                    {entry.improvement > 0 && (
                      <div className="flex items-center gap-1 text-success">
                        <TrendingUp className="w-3 h-3" />
                        <span>+{entry.improvement}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-warning" />
          {gymName} Leaderboards
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="bench" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="bench" className="flex items-center gap-2">
              <span>🏋️</span>
              Bench Press
            </TabsTrigger>
            <TabsTrigger value="squat" className="flex items-center gap-2">
              <span>🔥</span>
              Squat
            </TabsTrigger>
            <TabsTrigger value="deadlift" className="flex items-center gap-2">
              <span>💪</span>
              Deadlift
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="bench" className="mt-6">
            {renderLeaderboard(benchData, "bench")}
          </TabsContent>
          
          <TabsContent value="squat" className="mt-6">
            {renderLeaderboard(squatData, "squat")}
          </TabsContent>
          
          <TabsContent value="deadlift" className="mt-6">
            {renderLeaderboard(deadliftData, "deadlift")}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default Leaderboard;