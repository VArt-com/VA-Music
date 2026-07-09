export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type Track = {
  id: string;
  artist_id: string;
  title: string;
  description: string | null;
  genre: string | null;
  tags: string[];
  file_path: string;
  cover_path: string | null;
  duration_seconds: number | null;
  play_count: number;
  download_count: number;
  created_at: string;
  profiles?: Profile;
};

export type Video = {
  id: string;
  artist_id: string;
  title: string;
  description: string | null;
  tags: string[];
  file_path: string;
  cover_path: string | null;
  duration_seconds: number | null;
  view_count: number;
  download_count: number;
  created_at: string;
  profiles?: Profile;
};

export type Playlist = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  profiles?: Profile;
};
