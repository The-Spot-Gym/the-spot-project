import { Trophy, Medal, Award, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar?: string;
  weight: number;
  improvement: number;
  isCurrentUser?: boolean;
}

interface LeaderboardProps {
  gymName: string;
}

const Leaderboard = ({ gymName }: LeaderboardProps) => {
  const benchData: LeaderboardEntry[] = [
    { rank: 1, name: "Mike Chen", weight: 405, improvement: 15, avatar: "MC" },
    { rank: 2, name: "Sarah Johnson", weight: 315, improvement: 25, avatar: "SJ" },
    { rank: 3, name: "Alex Rivera", weight: 295, improvement: 10, avatar: "AR" },
    { rank: 4, name: "David Kim", weight: 275, improvement: 20, avatar: "DK" },
    { rank: 5, name: "Emma Wilson", weight: 255, improvement: 30, avatar: "EW", isCurrentUser: true },
  ];

  const squatData: LeaderboardEntry[] = [
    { rank: 1, name: "Alex Rivera", weight: 485, improvement: 20, avatar: "AR" },
    { rank: 2, name: "Mike Chen", weight: 455, improvement: 10, avatar: "MC" },
    { rank: 3, name: "David Kim", weight: 425, improvement: 35, avatar: "DK" },
    { rank: 4, name: "Sarah Johnson", weight: 385, improvement: 15, avatar: "SJ" },
    { rank: 5, name: "Emma Wilson", weight: 315, improvement: 25, avatar: "EW", isCurrentUser: true },
  ];

  const deadliftData: LeaderboardEntry[] = [
    { rank: 1, name: "David Kim", weight: 545, improvement: 25, avatar: "DK" },
    { rank: 2, name: "Mike Chen", weight: 515, improvement: 20, avatar: "MC" },
    { rank: 3, name: "Alex Rivera", weight: 495, improvement: 15, avatar: "AR" },
    { rank: 4, name: "Sarah Johnson", weight: 425, improvement: 30, avatar: "SJ" },
    { rank: 5, name: "Emma Wilson", weight: 365, improvement: 40, avatar: "EW", isCurrentUser: true },
  ];

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

  const renderLeaderboard = (data: LeaderboardEntry[], exercise: string) => (
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
                  {entry.avatar}
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
                  <div className="flex items-center gap-1 text-success">
                    <TrendingUp className="w-3 h-3" />
                    <span>+{entry.improvement}%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

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