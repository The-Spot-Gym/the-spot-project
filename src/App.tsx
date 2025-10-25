import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { usePushNotifications } from "@/hooks/usePushNotifications";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  usePushNotifications();
  
  return (
    <>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <AppContent />
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
