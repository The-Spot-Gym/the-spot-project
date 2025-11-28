import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
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
import WorkoutPlans from "./pages/WorkoutPlans";
import NotFound from "./pages/NotFound";

const AppContent = () => {
  usePushNotifications();
  
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
        <Route path="/workout-plans" element={<WorkoutPlans />} />
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
