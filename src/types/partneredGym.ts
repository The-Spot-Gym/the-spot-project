export interface PartneredGym {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  social_links: Record<string, string>;
  mma_enabled: boolean;
  mma_webpage_url: string | null;
  mma_description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PartneredGymManager {
  id: string;
  gym_id: string;
  user_id: string;
  created_at: string;
}

export interface PartneredGymClass {
  id: string;
  gym_id: string;
  name: string;
  description: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  instructor: string | null;
  is_mma: boolean;
  registration_url: string | null;
  max_capacity: number | null;
  created_at: string;
  updated_at: string;
}

export interface PartneredGymAnnouncement {
  id: string;
  gym_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PartneredGymImage {
  id: string;
  gym_id: string;
  image_url: string;
  caption: string | null;
  display_order: number;
  created_at: string;
}

export interface PartneredGymLocation {
  id: string;
  gym_id: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  hours: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface PartneredGymMembership {
  id: string;
  gym_id: string;
  user_id: string;
  is_active: boolean;
  joined_at: string;
  created_at: string;
  updated_at: string;
}

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
