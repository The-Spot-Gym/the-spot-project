import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.c139716001b54f8bac70ff059738767c',
  appName: 'the-spot-project',
  webDir: 'dist',
  // Temporarily disabled remote URL to test with bundled build
  // server: {
  //   url: 'https://c1397160-01b5-4f8b-ac70-ff059738767c.lovableproject.com?forceHideBadge=true',
  //   cleartext: true
  // },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
};

export default config;
