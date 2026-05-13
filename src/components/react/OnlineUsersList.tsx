import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../lib/types';

interface OnlineUser {
  user_id: string;
  status: string;
  online_at: string;
  profile?: Profile;
}

export function OnlineUsersList() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let channel: any;

    const setupPresence = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get current user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      // Subscribe to presence channel
      channel = supabase.channel('online-users', {
        config: {
          presence: {
            key: session.user.id,
          },
        },
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const users: OnlineUser[] = [];
          
          Object.keys(state).forEach((key) => {
            const presences = state[key];
            if (presences && presences.length > 0) {
              users.push({
                user_id: key,
                status: presences[0].status || 'online',
                online_at: presences[0].online_at || new Date().toISOString(),
                profile: presences[0].profile,
              });
            }
          });

          setOnlineUsers(users);
          setLoading(false);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }: any) => {
          console.log('User joined:', key);
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }: any) => {
          console.log('User left:', key);
        })
        .subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED') {
            // Track current user presence
            await channel.track({
              user_id: session.user.id,
              status: 'online',
              online_at: new Date().toISOString(),
              profile: profile,
            });

            // Update profile status in database
            await supabase
              .from('profiles')
              .update({ 
                status: 'online', 
                last_seen: new Date().toISOString() 
              })
              .eq('id', session.user.id);
          }
        });
    };

    setupPresence();

    // Update status on visibility change
    const handleVisibilityChange = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const newStatus = document.hidden ? 'away' : 'online';
      
      await supabase
        .from('profiles')
        .update({ 
          status: newStatus, 
          last_seen: new Date().toISOString() 
        })
        .eq('id', session.user.id);

      if (channel) {
        await channel.track({
          user_id: session.user.id,
          status: newStatus,
          online_at: new Date().toISOString(),
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'status-online';
      case 'away': return 'status-away';
      case 'busy': return 'status-busy';
      default: return 'status-offline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'En línea';
      case 'away': return 'Ausente';
      case 'busy': return 'Ocupado';
      default: return 'Desconectado';
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <div className="status-online"></div>
          Usuarios en línea
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-10 h-10 bg-slate-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-slate-700 rounded w-24 mb-1"></div>
                <div className="h-3 bg-slate-700 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <div className="status-online"></div>
        Usuarios en línea
        <span className="ml-auto text-sm font-normal text-blue-400">
          {onlineUsers.length}
        </span>
      </h3>

      {onlineUsers.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-4">
          No hay usuarios conectados
        </p>
      ) : (
        <div className="space-y-3">
          {onlineUsers.map((user) => (
            <div
              key={user.user_id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-500/5 transition-colors"
            >
              {/* Avatar */}
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold">
                  {user.profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 ${getStatusColor(user.status)}`}></div>
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.profile?.full_name || 'Usuario'}
                </p>
                <p className="text-xs text-slate-500">
                  {getStatusText(user.status)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
