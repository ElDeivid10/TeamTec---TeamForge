import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Profile, TeamMember } from '../../lib/types';

interface MemberListProps {
  teamId: string;
  isOwnerOrAdmin: boolean;
  onMemberUpdate: () => void;
}

export function MemberList({ teamId, isOwnerOrAdmin, onMemberUpdate }: MemberListProps) {
  const [members, setMembers] = useState<(TeamMember & { profile: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingMember, setAddingMember] = useState<string | null>(null);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId);

      if (error) {
        console.error('Error fetching members:', error);
        setLoading(false);
        return;
      }

      // Fetch profiles for each member
      const membersWithProfiles = await Promise.all(
        (data || []).map(async (member) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', member.user_id)
            .single();

          return {
            ...member,
            profile: profile || {
              id: member.user_id,
              full_name: 'Usuario',
              avatar_url: null,
              status: 'offline',
              last_seen: new Date().toISOString(),
              created_at: new Date().toISOString(),
            },
          };
        })
      );

      setMembers(membersWithProfiles);
      setLoading(false);

    } catch (err) {
      console.error('Error:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();

    // Subscribe to member changes
    const channel = supabase
      .channel(`team-members-${teamId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_members',
          filter: `team_id=eq.${teamId}`,
        },
        () => {
          fetchMembers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId]);

  const handleSearch = async (query: string) => {
    setSearchEmail(query);
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`full_name.ilike.%${query}%,id.ilike.%${query}%`)
        .limit(5);

      if (error) {
        console.error('Search error:', error);
        setSearching(false);
        return;
      }

      // Filter out existing members
      const existingMemberIds = members.map(m => m.user_id);
      const filtered = (data || []).filter(
        profile => !existingMemberIds.includes(profile.id)
      );

      setSearchResults(filtered);
      setSearching(false);

    } catch (err) {
      console.error('Search error:', err);
      setSearching(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    setAddingMember(userId);
    try {
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: userId,
          role: 'member',
        });

      if (error) {
        console.error('Error adding member:', error);
        setAddingMember(null);
        return;
      }

      setSearchEmail('');
      setSearchResults([]);
      setAddingMember(null);
      fetchMembers();
      onMemberUpdate();

    } catch (err) {
      console.error('Error:', err);
      setAddingMember(null);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar a este miembro?')) return;

    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error removing member:', error);
        return;
      }

      fetchMembers();
      onMemberUpdate();

    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ role: newRole })
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error changing role:', error);
        return;
      }

      fetchMembers();
      onMemberUpdate();

    } catch (err) {
      console.error('Error:', err);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
            Owner
          </span>
        );
      case 'admin':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
            Admin
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-500/20 text-slate-400 border border-slate-500/30">
            Miembro
          </span>
        );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'status-online';
      case 'away': return 'status-away';
      case 'busy': return 'status-busy';
      default: return 'status-offline';
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Miembros del equipo</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-10 h-10 bg-slate-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-slate-700 rounded w-32 mb-2"></div>
                <div className="h-3 bg-slate-700 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Miembros
          <span className="ml-2 text-sm font-normal text-blue-400">
            {members.length}
          </span>
        </h3>
      </div>

      {/* Add Member Search */}
      {isOwnerOrAdmin && (
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchEmail}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Buscar usuario para agregar..."
              className="input-field pl-10"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-2 p-2 rounded-xl bg-slate-800 border border-slate-700">
              {searchResults.map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-semibold">
                        {profile.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${getStatusColor(profile.status)}`}></div>
                    </div>
                    <div>
                      <p className="text-sm text-white">{profile.full_name || 'Usuario'}</p>
                      <p className="text-xs text-slate-500">{profile.id.substring(0, 8)}...</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddMember(profile.id)}
                    disabled={addingMember === profile.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                  >
                    {addingMember === profile.id ? 'Agregando...' : 'Agregar'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {searching && (
            <p className="mt-2 text-xs text-slate-500">Buscando...</p>
          )}
        </div>
      )}

      {/* Members List */}
      <div className="space-y-3">
        {members.map((member) => (
          <div
            key={member.user_id}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-blue-500/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold">
                  {member.profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 ${getStatusColor(member.profile?.status || 'offline')}`}></div>
              </div>

              {/* User Info */}
              <div>
                <p className="text-sm font-medium text-white">
                  {member.profile?.full_name || 'Usuario'}
                </p>
                <p className="text-xs text-slate-500">
                  {member.profile?.status === 'online' ? 'En línea' : 
                   member.profile?.status === 'away' ? 'Ausente' :
                   member.profile?.status === 'busy' ? 'Ocupado' : 'Desconectado'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Role Badge */}
              {getRoleBadge(member.role)}

              {/* Actions */}
              {isOwnerOrAdmin && member.role !== 'owner' && (
                <div className="flex items-center gap-2">
                  <select
                    value={member.role}
                    onChange={(e) => handleChangeRole(member.user_id, e.target.value)}
                    className="px-2 py-1 rounded-lg text-xs bg-slate-800 border border-slate-700 text-slate-300 focus:outline-none focus:border-blue-500"
                  >
                    <option value="member">Miembro</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    onClick={() => handleRemoveMember(member.user_id)}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Eliminar miembro"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
