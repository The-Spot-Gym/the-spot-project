// Component-specific types

import type { Conversation, Profile, Message } from './index';

export interface ConversationWithData extends Conversation {
  lastMessage?: Message & { sender_id: string; content: string; created_at: string };
  participants: Profile[];
}

export interface FriendRecommendation {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  shared_gyms_count: number;
  common_gym_names: string[];
}

export interface Exercise {
  exercise: string;
  weight: string;
  reps: string;
  sets: string;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar?: string;
  weight: number;
  improvement: number;
  isCurrentUser?: boolean;
  user_id?: string;
}
