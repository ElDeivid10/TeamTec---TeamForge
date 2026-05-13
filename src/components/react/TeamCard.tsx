import type { Team } from '../../lib/types';

interface TeamCardProps {
  team: Team;
  onClick?: () => void;
}

export function TeamCard({ team, onClick }: TeamCardProps) {
  return (
    <div
      onClick={onClick}
      className="glass-card p-6 cursor-pointer group hover:scale-[1.02] transition-all duration-300"
    >
      {/* Color Bar */}
      <div
        className="h-1.5 rounded-full mb-4 opacity-60 group-hover:opacity-100 transition-opacity"
        style={{ background: team.color || '#3B82F6' }}
      />

      {/* Team Icon */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl"
          style={{ 
            background: `${team.color || '#3B82F6'}20`,
            border: `1px solid ${team.color || '#3B82F6'}40`
          }}
        >
          <svg
            className="h-6 w-6"
            style={{ color: team.color || '#3B82F6' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white truncate group-hover:text-blue-300 transition-colors">
            {team.name}
          </h3>
          <p className="text-sm text-slate-500">
            {team.member_count || 0} miembros
          </p>
        </div>
      </div>

      {/* Description */}
      {team.description && (
        <p className="text-sm text-slate-400 mb-4 line-clamp-2">
          {team.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs text-slate-500">
            {new Date(team.created_at).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>

        <div className="flex items-center gap-1 text-blue-400 group-hover:text-blue-300 transition-colors">
          <span className="text-xs font-medium">Ver equipo</span>
          <svg className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
