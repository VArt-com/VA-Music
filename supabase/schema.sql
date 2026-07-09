-- Music World schema for Supabase
-- Run this in Supabase Dashboard -> SQL Editor -> New query -> Run

-- ============ PROFILES ============
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  bio text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)) || '_' || substr(new.id::text, 1, 4),
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============ TRACKS ============
create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  genre text,
  tags text[] default '{}',
  file_path text not null,
  cover_path text,
  duration_seconds integer,
  play_count integer default 0,
  download_count integer default 0,
  created_at timestamptz default now()
);

alter table public.tracks enable row level security;

drop policy if exists "Tracks are viewable by everyone" on public.tracks;
create policy "Tracks are viewable by everyone"
  on public.tracks for select using (true);

drop policy if exists "Users can insert own tracks" on public.tracks;
create policy "Users can insert own tracks"
  on public.tracks for insert with check (auth.uid() = artist_id);

drop policy if exists "Users can update own tracks" on public.tracks;
create policy "Users can update own tracks"
  on public.tracks for update using (auth.uid() = artist_id);

drop policy if exists "Users can delete own tracks" on public.tracks;
create policy "Users can delete own tracks"
  on public.tracks for delete using (auth.uid() = artist_id);

-- ============ PLAYLISTS ============
create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  is_public boolean default true,
  created_at timestamptz default now()
);

alter table public.playlists enable row level security;

drop policy if exists "Public playlists are viewable by everyone" on public.playlists;
create policy "Public playlists are viewable by everyone"
  on public.playlists for select using (is_public = true or owner_id = auth.uid());

drop policy if exists "Users can insert own playlists" on public.playlists;
create policy "Users can insert own playlists"
  on public.playlists for insert with check (auth.uid() = owner_id);

drop policy if exists "Users can update own playlists" on public.playlists;
create policy "Users can update own playlists"
  on public.playlists for update using (auth.uid() = owner_id);

drop policy if exists "Users can delete own playlists" on public.playlists;
create policy "Users can delete own playlists"
  on public.playlists for delete using (auth.uid() = owner_id);

-- ============ PLAYLIST_TRACKS ============
create table if not exists public.playlist_tracks (
  playlist_id uuid references public.playlists(id) on delete cascade,
  track_id uuid references public.tracks(id) on delete cascade,
  position integer default 0,
  added_at timestamptz default now(),
  primary key (playlist_id, track_id)
);

alter table public.playlist_tracks enable row level security;

drop policy if exists "Playlist tracks viewable if playlist viewable" on public.playlist_tracks;
create policy "Playlist tracks viewable if playlist viewable"
  on public.playlist_tracks for select using (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id and (p.is_public = true or p.owner_id = auth.uid())
    )
  );

drop policy if exists "Owner can manage playlist tracks" on public.playlist_tracks;
create policy "Owner can manage playlist tracks"
  on public.playlist_tracks for all using (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id and p.owner_id = auth.uid()
    )
  );

-- ============ STORAGE BUCKETS ============
insert into storage.buckets (id, name, public) values ('tracks', 'tracks', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('covers', 'covers', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;

-- Storage policies: each user uploads into a folder named after their own uid,
-- e.g. tracks/<user-id>/<file>.mp3 — everyone can read (stream/download), only the
-- owner can upload/delete their own files.

drop policy if exists "Public read tracks" on storage.objects;
create policy "Public read tracks"
  on storage.objects for select using (bucket_id = 'tracks');

drop policy if exists "Users upload own tracks" on storage.objects;
create policy "Users upload own tracks"
  on storage.objects for insert with check (
    bucket_id = 'tracks' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users delete own tracks" on storage.objects;
create policy "Users delete own tracks"
  on storage.objects for delete using (
    bucket_id = 'tracks' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Public read covers" on storage.objects;
create policy "Public read covers"
  on storage.objects for select using (bucket_id = 'covers');

drop policy if exists "Users upload own covers" on storage.objects;
create policy "Users upload own covers"
  on storage.objects for insert with check (
    bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Public read avatars" on storage.objects;
create policy "Public read avatars"
  on storage.objects for select using (bucket_id = 'avatars');

drop policy if exists "Users upload own avatar" on storage.objects;
create policy "Users upload own avatar"
  on storage.objects for insert with check (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users update own avatar" on storage.objects;
create policy "Users update own avatar"
  on storage.objects for update using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Covers had no delete policy originally — needed so users can clean up a
-- track/video cover image when they delete the track/video itself.
drop policy if exists "Users delete own covers" on storage.objects;
create policy "Users delete own covers"
  on storage.objects for delete using (
    bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============ PLAY / DOWNLOAD COUNTERS ============
create or replace function public.increment_play_count(track_id uuid)
returns void as $$
begin
  update public.tracks set play_count = play_count + 1 where id = track_id;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.increment_download_count(track_id uuid)
returns void as $$
begin
  update public.tracks set download_count = download_count + 1 where id = track_id;
end;
$$ language plpgsql security definer set search_path = public;

-- ============ VIDEOS ============
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  tags text[] default '{}',
  file_path text not null,
  cover_path text,
  duration_seconds integer,
  view_count integer default 0,
  download_count integer default 0,
  created_at timestamptz default now()
);

alter table public.videos enable row level security;

drop policy if exists "Videos are viewable by everyone" on public.videos;
create policy "Videos are viewable by everyone"
  on public.videos for select using (true);

drop policy if exists "Users can insert own videos" on public.videos;
create policy "Users can insert own videos"
  on public.videos for insert with check (auth.uid() = artist_id);

drop policy if exists "Users can update own videos" on public.videos;
create policy "Users can update own videos"
  on public.videos for update using (auth.uid() = artist_id);

drop policy if exists "Users can delete own videos" on public.videos;
create policy "Users can delete own videos"
  on public.videos for delete using (auth.uid() = artist_id);

insert into storage.buckets (id, name, public) values ('videos', 'videos', true) on conflict (id) do nothing;

drop policy if exists "Public read videos" on storage.objects;
create policy "Public read videos"
  on storage.objects for select using (bucket_id = 'videos');

drop policy if exists "Users upload own videos" on storage.objects;
create policy "Users upload own videos"
  on storage.objects for insert with check (
    bucket_id = 'videos' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users delete own videos" on storage.objects;
create policy "Users delete own videos"
  on storage.objects for delete using (
    bucket_id = 'videos' and (storage.foldername(name))[1] = auth.uid()::text
  );

create or replace function public.increment_video_view_count(video_id uuid)
returns void as $$
begin
  update public.videos set view_count = view_count + 1 where id = video_id;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.increment_video_download_count(video_id uuid)
returns void as $$
begin
  update public.videos set download_count = download_count + 1 where id = video_id;
end;
$$ language plpgsql security definer set search_path = public;
