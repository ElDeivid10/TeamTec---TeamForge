export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  status: 'online' | 'away' | 'busy' | 'offline';
  last_seen: string;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  color: string;
  created_by: string;
  created_at: string;
  member_count?: number;
  members?: TeamMember[];
}

export interface TeamMember {
  team_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  profile?: Profile;
}

export interface OnlineUser {
  user_id: string;
  status: 'online' | 'away' | 'busy';
  last_seen: string;
  profile?: Profile;
}

export interface PresenceState {
  user_id: string;
  status: string;
  online_at: string;
}
