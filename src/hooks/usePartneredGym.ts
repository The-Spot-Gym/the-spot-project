import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { 
  PartneredGym, PartneredGymClass, PartneredGymAnnouncement, 
  PartneredGymImage, PartneredGymLocation, PartneredGymMembership 
} from '@/types/partneredGym';

const fromTable = (table: string) => supabase.from(table as any);

export const usePartneredGyms = () => {
  const [gyms, setGyms] = useState<PartneredGym[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await fromTable('partnered_gyms').select('*').eq('is_active', true).order('name');
      setGyms((data as any as PartneredGym[]) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  return { gyms, loading };
};

export const usePartneredGymDetail = (gymId: string | null) => {
  const { user } = useAuth();
  const [gym, setGym] = useState<PartneredGym | null>(null);
  const [classes, setClasses] = useState<PartneredGymClass[]>([]);
  const [announcements, setAnnouncements] = useState<PartneredGymAnnouncement[]>([]);
  const [images, setImages] = useState<PartneredGymImage[]>([]);
  const [locations, setLocations] = useState<PartneredGymLocation[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isManager, setIsManager] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!gymId) return;
    setLoading(true);

    const [gymRes, classRes, annRes, imgRes, locRes, memRes] = await Promise.all([
      fromTable('partnered_gyms').select('*').eq('id', gymId).single(),
      fromTable('partnered_gym_classes').select('*').eq('gym_id', gymId).order('day_of_week').order('start_time'),
      fromTable('partnered_gym_announcements').select('*').eq('gym_id', gymId).order('is_pinned', { ascending: false }).order('created_at', { ascending: false }),
      fromTable('partnered_gym_images').select('*').eq('gym_id', gymId).order('display_order'),
      fromTable('partnered_gym_locations').select('*').eq('gym_id', gymId).order('name'),
      fromTable('partnered_gym_memberships').select('*').eq('gym_id', gymId).eq('is_active', true),
    ]);

    setGym((gymRes.data as any as PartneredGym) || null);
    setClasses((classRes.data as any as PartneredGymClass[]) || []);
    setAnnouncements((annRes.data as any as PartneredGymAnnouncement[]) || []);
    setImages((imgRes.data as any as PartneredGymImage[]) || []);
    setLocations((locRes.data as any as PartneredGymLocation[]) || []);
    
    const members = (memRes.data as any[]) || [];
    setMemberCount(members.length);
    if (user) {
      setIsMember(members.some((m: any) => m.user_id === user.id));
    }

    // Check if current user is a manager
    if (user) {
      const { data: mgrData } = await fromTable('partnered_gym_managers').select('id').eq('gym_id', gymId).eq('user_id', user.id);
      const { data: roleData } = await fromTable('user_roles').select('role').eq('user_id', user.id);
      const roles = ((roleData as any[]) || []).map((r: any) => r.role);
      setIsManager(roles.includes('admin') || ((mgrData as any[]) || []).length > 0);
    }

    setLoading(false);
  }, [gymId, user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const joinGym = async () => {
    if (!user || !gymId) return;
    await fromTable('partnered_gym_memberships').upsert(
      { user_id: user.id, gym_id: gymId, is_active: true } as any,
      { onConflict: 'gym_id,user_id' }
    );
    fetchAll();
  };

  const leaveGym = async () => {
    if (!user || !gymId) return;
    await fromTable('partnered_gym_memberships').update({ is_active: false } as any).eq('user_id', user.id).eq('gym_id', gymId);
    fetchAll();
  };

  return { gym, classes, announcements, images, locations, isMember, memberCount, loading, isManager, joinGym, leaveGym, refetch: fetchAll };
};
