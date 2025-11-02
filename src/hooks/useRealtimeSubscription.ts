import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface SubscriptionConfig {
  channelName: string;
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  callback: (payload: any) => void;
}

/**
 * Reusable hook for managing Supabase realtime subscriptions
 * Handles cleanup automatically on unmount
 */
export const useRealtimeSubscription = (config: SubscriptionConfig | null) => {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!config) return;

    const { channelName, table, event = '*', filter, callback } = config;

    // Create subscription - cast to any to avoid type issues
    const channel = (supabase.channel(channelName) as any)
      .on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table,
          ...(filter && { filter }),
        },
        callback
      )
      .subscribe() as RealtimeChannel;
    
    channelRef.current = channel;

    // Cleanup on unmount or config change
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [config?.channelName, config?.table, config?.event, config?.filter]);

  return channelRef.current;
};
