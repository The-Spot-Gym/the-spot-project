import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useAdminRole = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGymOwner, setIsGymOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRoles = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsGymOwner(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_roles' as any)
        .select('role')
        .eq('user_id', user.id);

      if (!error && data) {
        const roles = (data as any[]).map((r: any) => r.role);
        setIsAdmin(roles.includes('admin'));
        setIsGymOwner(roles.includes('gym_owner'));
      }
      setLoading(false);
    };

    checkRoles();
  }, [user]);

  return { isAdmin, isGymOwner, loading };
};
