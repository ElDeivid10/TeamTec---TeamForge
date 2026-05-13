import { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeamCreated: () => void;
}

const TEAM_COLORS = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#F97316', // Orange
];

export function CreateTeamModal({ isOpen, onClose, onTeamCreated }: CreateTeamModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(TEAM_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Debes iniciar sesión para crear un equipo.');
        setLoading(false);
        return;
      }

      // Create team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name,
          description: description || null,
          color: selectedColor,
          created_by: session.user.id,
        })
        .select()
        .single();

      if (teamError) {
        setError(teamError.message);
        setLoading(false);
        return;
      }

      // Add creator as owner
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: session.user.id,
          role: 'owner',
        });

      if (memberError) {
        setError(memberError.message);
        setLoading(false);
        return;
      }

      // Success
      setName('');
      setDescription('');
      setSelectedColor(TEAM_COLORS[0]);
      onTeamCreated();
      onClose();

    } catch (err) {
      setError('Error inesperado. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md glass-card p-8 animate-fadeIn">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Crear nuevo equipo</h2>
          <p className="text-slate-400 text-sm">
            Crea un equipo para colaborar con otros usuarios.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Team Name */}
          <div>
            <label htmlFor="team-name" className="block text-sm font-medium text-slate-300 mb-2">
              Nombre del equipo
            </label>
            <input
              id="team-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="input-field"
              placeholder="Mi equipo increíble"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="team-description" className="block text-sm font-medium text-slate-300 mb-2">
              Descripción <span className="text-slate-500">(opcional)</span>
            </label>
            <textarea
              id="team-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field min-h-[100px] resize-none"
              placeholder="Describe el propósito de tu equipo..."
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Color del equipo
            </label>
            <div className="flex flex-wrap gap-3">
              {TEAM_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-10 h-10 rounded-lg transition-all duration-200 ${
                    selectedColor === color
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ background: color }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
            <p className="text-xs text-slate-500 mb-2">Vista previa</p>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ 
                  background: `${selectedColor}20`,
                  border: `1px solid ${selectedColor}40`
                }}
              >
                <svg
                  className="h-5 w-5"
                  style={{ color: selectedColor }}
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
              <div>
                <p className="text-white font-medium">
                  {name || 'Nombre del equipo'}
                </p>
                <p className="text-xs text-slate-500">0 miembros</p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 glow-button flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creando...
                </>
              ) : (
                'Crear equipo'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
