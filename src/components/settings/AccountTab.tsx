import { Mail, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

export const AccountTab = () => {
  const { user } = useAuth();
  const { profile } = useProfile();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Settings</CardTitle>
        <CardDescription>Manage your account details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              value={user?.email || ''}
              disabled
              className="pl-9"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Email cannot be changed at this time
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="userId">User ID</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="userId"
              value={user?.id || ''}
              disabled
              className="pl-9 font-mono text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Account Created</Label>
          <Input
            value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : ''}
            disabled
          />
        </div>
      </CardContent>
    </Card>
  );
};
