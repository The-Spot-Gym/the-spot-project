// Domain type definitions for the application

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Gym {
  id: string;
  google_place_id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  rating: number | null;
  user_ratings_total: number | null;
  phone_number: string | null;
  website: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface GymMembership {
  id: string;
  user_id: string;
  gym_id: string;
  joined_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  session_date: string;
  notes: string | null;
  created_at: string;
}

export interface WorkoutExercise {
  id: string;
  session_id: string;
  exercise_name: string;
  weight: number;
  reps: number;
  sets: number;
  created_at: string;
}

export interface LeaderboardStats {
  id: string;
  user_id: string;
  total_workouts: number;
  total_weight_lifted: number;
  current_streak: number;
  longest_streak: number;
  favorite_exercise: string | null;
  personal_records: any; // JSONB from database - flexible type for JSON data
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  created_by: string | null;
  is_group: boolean;
  name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  delivered_at: string | null;
  read_at: string | null;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface GymVisit {
  id: string;
  user_id: string;
  gym_id: string;
  visited_at: string;
  created_at: string;
}

export interface WeightRecord {
  id: string;
  user_id: string;
  weight: number;
  recorded_at: string;
  notes: string | null;
  created_at: string;
}

// Extended types with joined data
export interface ProfileWithUser extends Profile {
  profiles?: Profile;
}

export interface MessageWithSender extends Message {
  sender?: Profile;
}

export interface ConversationWithParticipants extends Conversation {
  participants?: ConversationParticipant[];
}

export interface GymWithMembership extends Gym {
  membership?: GymMembership;
  member_count?: number;
}

export interface WorkoutSessionWithExercises extends WorkoutSession {
  exercises?: WorkoutExercise[];
}

// Re-export from other type files
export type { 
  GymDetailsResponse,
  GymReview,
  OpeningHours,
  GymMemberData,
  MessageWithProfile,
  ConversationParticipantWithProfile
} from './api';

export type {
  ConversationWithData,
  FriendRecommendation,
  Exercise,
  LeaderboardEntry
} from './components';
