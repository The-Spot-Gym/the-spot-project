import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/PageHeader";
import { ProfileTab } from "@/components/settings/ProfileTab";
import { AccountTab } from "@/components/settings/AccountTab";
import { LiftingStatsTab } from "@/components/settings/LiftingStatsTab";
import { FriendsTab } from "@/components/settings/FriendsTab";
import { AppearanceTab } from "@/components/settings/AppearanceTab";
import { PrivacyTab } from "@/components/settings/PrivacyTab";
import { ROUTES } from "@/constants/routes";

const Settings = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Settings" showBackButton onBack={() => navigate(ROUTES.HOME)} />

      <div className="max-w-6xl mx-auto p-6">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="inline-flex w-full justify-start overflow-x-auto">
            <TabsTrigger value="profile" className="flex-shrink-0">Profile</TabsTrigger>
            <TabsTrigger value="account" className="flex-shrink-0">Account</TabsTrigger>
            <TabsTrigger value="privacy" className="flex-shrink-0">Privacy</TabsTrigger>
            <TabsTrigger value="stats" className="flex-shrink-0">Lifting Stats</TabsTrigger>
            <TabsTrigger value="friends" className="flex-shrink-0">Friends</TabsTrigger>
            <TabsTrigger value="appearance" className="flex-shrink-0">Appearance</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileTab />
          </TabsContent>

          <TabsContent value="account">
            <AccountTab />
          </TabsContent>

          <TabsContent value="privacy">
            <PrivacyTab />
          </TabsContent>

          <TabsContent value="stats">
            <LiftingStatsTab />
          </TabsContent>

          <TabsContent value="friends">
            <FriendsTab />
          </TabsContent>

          <TabsContent value="appearance">
            <AppearanceTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
