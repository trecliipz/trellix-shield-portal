import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export const useOnlinePresence = () => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    const initializePresence = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        return;
      }

      userIdRef.current = session.user.id;

      // Join presence channel
      const channel = supabase.channel('online_users', {
        config: {
          presence: {
            key: session.user.id,
          },
        },
      });

      // Track user presence
      channel.on('presence', { event: 'sync' }, () => {
        // Presence sync completed
      });

      channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // User joined
      });

      channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        // User left
      });

      // Subscribe and track presence
      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: session.user.id,
            email: session.user.email,
            online_at: new Date().toISOString(),
          });
        }
      });

      channelRef.current = channel;

      // Set up heartbeat to update database profile
      const updateHeartbeat = async () => {
        try {
          await supabase
            .from('profiles')
            .update({
              is_online: true,
              last_seen: new Date().toISOString(),
            })
            .eq('id', session.user.id);
        } catch (error) {
          console.error('Heartbeat update failed:', error);
        }
      };

      // Initial heartbeat
      updateHeartbeat();

      // Set up periodic heartbeat every 45 seconds
      heartbeatRef.current = setInterval(updateHeartbeat, 45000);

      // Handle page unload - best effort to mark offline
      const handleUnload = async () => {
        try {
          await supabase
            .from('profiles')
            .update({
              is_online: false,
              last_seen: new Date().toISOString(),
            })
            .eq('id', session.user.id);
        } catch (error) {
          // Ignore errors on unload
        }
      };

      window.addEventListener('beforeunload', handleUnload);

      return () => {
        window.removeEventListener('beforeunload', handleUnload);
      };
    };

    initializePresence();

    return () => {
      // Cleanup
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }

      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }

      // Mark offline on cleanup
      if (userIdRef.current) {
        const markOffline = async () => {
          try {
            await supabase
              .from('profiles')
              .update({
                is_online: false,
                last_seen: new Date().toISOString(),
              })
              .eq('id', userIdRef.current!);
          } catch (error) {
            // Ignore errors on cleanup
          }
        };
        markOffline();
      }
    };
  }, []);
};