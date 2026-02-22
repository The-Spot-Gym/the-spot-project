// Route constants for navigation
export const ROUTES = {
  HOME: '/',
  WELCOME: '/welcome',
  AUTH: '/auth',
  PROFILE_SETUP: '/profile-setup',
  SETTINGS: '/settings',
  GYMS_NEAR_YOU: '/gyms-near-you',
  MY_GYMS: '/my-gyms',
  GYM_DETAILS: (gymId: string) => `/gym/${gymId}`,
  MESSAGES: '/messages',
  CHAT: (conversationId: string) => `/chat/${conversationId}`,
  FRIEND_REQUESTS: '/friend-requests',
  FRIEND_RECOMMENDATIONS: '/friend-recommendations',
  WORKOUT_PLANS: '/workout-plans',
  MY_FRIENDS: '/my-friends',
} as const;
