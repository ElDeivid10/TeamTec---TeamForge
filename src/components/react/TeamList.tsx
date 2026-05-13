import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Team } from '../../lib/types';
import { TeamCard } from './TeamCard';
import { CreateTeamModal } from './CreateTeamModal';

export function TeamList() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTeams = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get teams where user is a member
      const { data: memberTeams, error: memberError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', session.user.id);

      if (memberError) {
        console.error('Error fetching teams:', memberError);
        setLoading(false);
        return;
      }

      if (!memberTeams || memberTeams.length === 0) {
        setTeams([]);
        setLoading(false);
        return;
      }

      const teamIds = memberTeams.map(m => m.team_id);

      // Get team details with member count
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .in('id', teamIds)
        .order('created_at', { ascending: false });

      if (teamsError) {
        console.error('Error fetching team details:', teamsError);
        setLoading(false);
        return;
      }

      // Get member counts for each team
      const teamsWithCounts = await Promise.all(
        (teamsData || []).map(async (team) => {
          const { count } = await supabase
            .from('team_members')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', team.id);

          return {
            ...team,
            member_count: count || 0,
          };
        })
      );

      setTeams(teamsWithCounts);
      setLoading(false);

    } catch (err) {
      console.error('Error:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();

    // Subscribe to team_members changes
    const channel = supabase
      .channel('team-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_members',
        },
        () => {
          fetchTeams();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleTeamCreated = () => {
    fetchTeams();
  };

  const handleTeamClick = (teamId: string) => {
    window.location.href = `/teams/${teamId}`;
  };

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Mis equipos</h2>
          <div className="h-10 w-32 bg-slate-700 rounded-xl animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-6 animate-pulse">
              <div className="h-1.5 bg-slate-700 rounded-full mb-4"></div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-slate-700 rounded-xl"></div>
                <div>
                  <div className="h-5 bg-slate-700 rounded w-32 mb-2"></div>
                  <div className="h-4 bg-slate-700 rounded w-20"></div>
                </div>
              </div>
              <div className="h-4 bg-slate-700 rounded w-full mb-2"></div>
              <div className="h-4 bg-slate-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">
          Mis equipos
          {teams.length > 0 && (
            <span className="ml-3 text-sm font-normal text-blue-400">
              {teams.length} {teams.length === 1 ? 'equipo' : 'equipos'}
            </span>
          )}
        </h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="glow-button flex items-center gap-2"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo equipo
        </button>
      </div>

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <svg className="h-10 w-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No tienes equipos aún
          </h3>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Crea tu primer equipo para comenzar a colaborar con otros usuarios.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="glow-button inline-flex items-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Crear mi primer equipo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              onClick={() => handleTeamClick(team.id)}
            />
          ))}
        </div>
      )}

      {/* Create Team Modal */}
      <CreateTeamModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTeamCreated={handleTeamCreated}
      />
    </div>
  );
}
