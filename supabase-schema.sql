-- =====================================================
-- TeamForge Database Schema for Supabase
-- =====================================================
-- Ejecuta este SQL en el SQL Editor de tu proyecto Supabase
-- https://supabase.com/dashboard/project/_/sql

-- =====================================================
-- 1. TABLA DE PERFILES DE USUARIO
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para crear perfil automáticamente al registrar usuario
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- 2. TABLA DE EQUIPOS
-- =====================================================
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. TABLA DE MIEMBROS DE EQUIPO
-- =====================================================
CREATE TABLE IF NOT EXISTS team_members (
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);

-- =====================================================
-- 4. POLÍTICAS DE SEGURIDAD (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Los perfiles son visibles para todos los usuarios autenticados"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Los usuarios pueden actualizar su propio perfil"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Políticas para teams
CREATE POLICY "Los equipos son visibles para todos los usuarios autenticados"
  ON teams FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Los usuarios autenticados pueden crear equipos"
  ON teams FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Los creadores y admins pueden actualizar equipos"
  ON teams FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_id = teams.id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Los owners pueden eliminar equipos"
  ON teams FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_id = teams.id
      AND user_id = auth.uid()
      AND role = 'owner'
    )
  );

-- Políticas para team_members
CREATE POLICY "Los miembros son visibles para usuarios autenticados"
  ON team_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Los usuarios pueden unirse a equipos"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los owners y admins pueden gestionar miembros"
  ON team_members FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE team_id = team_members.team_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- 5. HABILITAR REALTIME
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE team_members;

-- =====================================================
-- 6. ÍNDICES PARA RENDIMIENTO
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_teams_created_by ON teams(created_by);
