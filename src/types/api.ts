// API response types for better type safety

export interface GymDetailsResponse {
  gym: {
    id: string;
    name: string;
    address?: string;
    rating?: number;
    user_ratings_total?: number;
    phone_number?: string;
    website?: string;
    photo_url?: string;
    photos?: string[];
    reviews?: GymReview[];
    opening_hours?: OpeningHours;
    latitude: number;
    longitude: number;
  };
}

export interface GymReview {
  author_name: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
}

export interface OpeningHours {
  open_now?: boolean;
  weekday_text?: string[];
}

export interface GymMemberData {
  user_id: string;
  joined_at: string;
  profiles: {
    id: string;
    user_id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    created_at: string;
    updated_at: string;
  };
}

export interface MessageWithProfile {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  delivered_at: string | null;
  read_at: string | null;
  profiles?: {
    user_id: string;
    display_name: string | null;
    username: string;
    avatar_url: string | null;
  };
}

export interface ConversationParticipantWithProfile {
  user_id: string;
  profiles?: {
    user_id: string;
    display_name: string | null;
    username: string;
    avatar_url: string | null;
  };
}
