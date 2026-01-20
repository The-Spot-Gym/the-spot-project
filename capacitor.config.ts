import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.c139716001b54f8bac70ff059738767c',
  appName: 'the-spot-project',
  webDir: 'dist',
  // Note: Remove server.url for production builds to use bundled app
  // The server.url was causing Capacitor to detect platform as 'web' instead of 'ios'
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
};

export default config;
