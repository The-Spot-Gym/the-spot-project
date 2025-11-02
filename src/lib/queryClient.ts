import { QueryClient } from '@tanstack/react-query';

/**
 * React Query client configuration
 * Handles caching, refetching, and error handling for server state
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

/**
 * Query keys for consistent cache management
 */
export const queryKeys = {
  profile: (userId?: string) => ['profile', userId] as const,
  profiles: ['profiles'] as const,
  
  gyms: {
    all: ['gyms'] as const,
    detail: (gymId: string) => ['gyms', gymId] as const,
    members: (gymId: string) => ['gyms', gymId, 'members'] as const,
    reviews: (gymId: string) => ['gyms', gymId, 'reviews'] as const,
    membership: (gymId: string) => ['gyms', gymId, 'membership'] as const,
    userGyms: ['gyms', 'user'] as const,
  },
  
  workouts: {
    all: ['workouts'] as const,
    stats: ['workouts', 'stats'] as const,
    recent: (limit: number) => ['workouts', 'recent', limit] as const,
    session: (sessionId: string) => ['workouts', 'session', sessionId] as const,
  },
  
  friends: {
    all: ['friends'] as const,
    pending: ['friends', 'pending'] as const,
    sent: ['friends', 'sent'] as const,
    recommendations: ['friends', 'recommendations'] as const,
  },
  
  conversations: {
    all: ['conversations'] as const,
    detail: (conversationId: string) => ['conversations', conversationId] as const,
    messages: (conversationId: string) => ['conversations', conversationId, 'messages'] as const,
    participants: (conversationId: string) => ['conversations', conversationId, 'participants'] as const,
  },
  
  leaderboard: (gymName?: string) => ['leaderboard', gymName] as const,
};
