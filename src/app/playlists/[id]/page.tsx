import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getDictionary } from '@/lib/i18n/server';
import TrackCard from '@/components/TrackCard';
import type { Playlist, Track } from '@/lib/types';

export default async function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const t = await getDictionary();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: playlist } = await supabase.from('playlists').select('*, profiles(*)').eq('id', id).single();
  if (!playlist) notFound();

  const isOwner = Boolean(user && user.id === (playlist as Playlist).owner_id);

  const { data: items } = await supabase
    .from('playlist_tracks')
    .select('position, tracks(*, profiles(*))')
    .eq('playlist_id', id)
    .order('position', { ascending: true });

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 pb-32">
      <h1 className="text-2xl font-bold mb-1 neon-text">{(playlist as Playlist).name}</h1>
      <p className="text-white/60 mb-6">
        {(playlist as Playlist).profiles?.display_name || (playlist as Playlist).profiles?.username}
      </p>
      <div className="space-y-3">
        {items?.map((item: any) => {
          const track = item.tracks as Track;
          const audioUrl = supabase.storage.from('tracks').getPublicUrl(track.file_path).data.publicUrl;
          const downloadUrl = `${audioUrl}?download=${encodeURIComponent(track.title)}`;
          const coverUrl = track.cover_path
            ? supabase.storage.from('covers').getPublicUrl(track.cover_path).data.publicUrl
            : null;
          return (
            <TrackCard
              key={track.id}
              track={track}
              audioUrl={audioUrl}
              downloadUrl={downloadUrl}
              coverUrl={coverUrl}
              currentUserId={user?.id ?? null}
              sharePath={`/track/${track.id}`}
              playlistId={id}
              canRemoveFromPlaylist={isOwner}
            />
          );
        })}
        {(!items || items.length === 0) && <p className="text-white/50">{t.playlists.emptyTracks}</p>}
      </div>
    </main>
  );
}
