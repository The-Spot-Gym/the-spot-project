import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { supabase } from "@/integrations/supabase/client";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ROUTES } from "@/constants/routes";
import Index from "./pages/Index";
import GymDetails from "./pages/GymDetails";
import GymsNearYou from "./pages/GymsNearYou";
import MyGyms from "./pages/MyGyms";
import ProfileSetup from "./pages/ProfileSetup";
import Auth from "./pages/Auth";
import Welcome from "./pages/Welcome";
import Settings from "./pages/Settings";
import Messages from "./pages/Messages";
import Chat from "./pages/Chat";
import FriendRequests from "./pages/FriendRequests";
import FriendRecommendations from "./pages/FriendRecommendations";
import MyFriends from "./pages/MyFriends";
import WorkoutPlans from "./pages/WorkoutPlans";
import Privacy from "./pages/Privacy";
import EmailConfirmed from "./pages/EmailConfirmed";
import NotFound from "./pages/NotFound";
import AdminPanel from "./pages/AdminPanel";
import AdminGymManage from "./pages/AdminGymManage";
import PartneredGymPage from "./pages/PartneredGymPage";

const AppContent = () => {
  usePushNotifications();

  // Handle OAuth deep link callback on native platforms
  useEffect(() => {
    const platform = Capacitor.getPlatform();
    const isNativePlatform = Capacitor.isNativePlatform();
    const isCapacitorScheme =
      typeof window !== 'undefined' && window.location?.protocol === 'capacitor:';

    if (!(platform === 'ios' || platform === 'android' || isNativePlatform || isCapacitorScheme)) {
      return;
    }

    const handleDeepLink = async (url: string) => {
      console.log('Deep link received:', url);
      
      // Check if this is an auth callback
      if (url.includes('auth/callback')) {
        try {
          // Extract the URL and let Supabase handle the session
          const { data, error } = await supabase.auth.exchangeCodeForSession(url);
          if (error) {
            console.error('OAuth callback error:', error);
          } else {
            console.log('OAuth session established:', data);
          }

          // Close the in-app browser (Google OAuth, etc.) after we return to the app
          try {
            await Browser.close();
          } catch {
            // no-op
          }
        } catch (err) {
          console.error('Deep link auth error:', err);
        }
      }
    };

    // Listen for app URL open events
    CapacitorApp.addListener('appUrlOpen', ({ url }) => {
      handleDeepLink(url);
    });

    return () => {
      CapacitorApp.removeAllListeners();
    };
  }, []);
  
  return (
    <>
      <Toaster />
      <Sonner />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/gym/:gymId" element={<GymDetails />} />
        <Route path="/gyms-near-you" element={<GymsNearYou />} />
        <Route path="/my-gyms" element={<MyGyms />} />
        <Route path="/profile-setup" element={<ProfileSetup />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/chat/:conversationId" element={<Chat />} />
        <Route path="/friend-requests" element={<FriendRequests />} />
        <Route path="/friend-recommendations" element={<FriendRecommendations />} />
        <Route path="/my-friends" element={<MyFriends />} />
        <Route path="/workout-plans" element={<WorkoutPlans />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/admin/partnered-gym/:gymId" element={<AdminGymManage />} />
        <Route path="/partnered-gym/:gymId" element={<PartneredGymPage />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <TooltipProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </TooltipProvider>
  </ThemeProvider>
);

export default App;
