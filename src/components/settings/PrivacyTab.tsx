import { useState, useEffect } from "react";
import { Shield, Eye, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export const PrivacyTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadPrivacySettings = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('show_on_leaderboard')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setShowOnLeaderboard(data.show_on_leaderboard ?? false);
      }
    };

    loadPrivacySettings();
  }, [user]);

  const handleToggleLeaderboard = async (checked: boolean) => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ show_on_leaderboard: checked })
        .eq('user_id', user.id);

      if (error) throw error;

      setShowOnLeaderboard(checked);
      toast({
        title: checked ? "You're now visible on leaderboards" : "You're now hidden from leaderboards",
        description: checked 
          ? "Other gym members can now see your stats on public leaderboards."
          : "Your stats are now only visible to you and your friends.",
      });
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update privacy settings. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Privacy Settings
        </CardTitle>
        <CardDescription>
          Control who can see your workout stats and activity.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-start gap-3">
            <Eye className="w-5 h-5 mt-0.5 text-muted-foreground" />
            <div className="space-y-1">
              <Label htmlFor="leaderboard-toggle" className="text-base font-medium cursor-pointer">
                Show on Public Leaderboards
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow all gym members to see your stats on leaderboards. When off, only your friends can see your stats.
              </p>
            </div>
          </div>
          <Switch
            id="leaderboard-toggle"
            checked={showOnLeaderboard}
            onCheckedChange={handleToggleLeaderboard}
            disabled={loading}
          />
        </div>

        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 mt-0.5 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Who can see your stats?</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>You</strong> can always see your own stats</li>
                <li>• <strong>Friends</strong> can always see your stats</li>
                <li>• <strong>All gym members</strong> can see your stats {showOnLeaderboard ? '✓' : '(opt-in required)'}</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
