import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getDictionary } from '@/lib/i18n/server';
import TrackCard from '@/components/TrackCard';
import VideoCard from '@/components/VideoCard';
import type { Profile, Track, Video } from '@/lib/types';

export default async function ArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const t = await getDictionary();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', id).single();
  if (!profile) notFound();

  const [{ data: tracks }, { data: videos }, { data: myLikes }] = await Promise.all([
    supabase.from('tracks').select('*, profiles(*)').eq('artist_id', id).order('created_at', { ascending: false }),
    supabase.from('videos').select('*, profiles(*)').eq('artist_id', id).order('created_at', { ascending: false }),
    user ? supabase.from('track_likes').select('track_id').eq('user_id', user.id) : Promise.resolve({ data: null }),
  ]);

  const likedTrackIds = new Set((myLikes ?? []).map((l) => l.track_id as string));

  const currentUserId = user?.id ?? null;

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 pb-32">
      <div className="mb-8 glass-card rounded-2xl p-5">
        <h1 className="text-2xl font-extrabold neon-text">
          {(profile as Profile).display_name || (profile as Profile).username}
        </h1>
        {(profile as Profile).bio && <p className="text-white/60 mt-1">{(profile as Profile).bio}</p>}
      </div>

      <h2 className="text-lg font-semibold mb-3 text-white/80">{t.artist.tracksHeading}</h2>
      <div className="space-y-3 mb-10">
        {(tracks as Track[] | null)?.map((track) => {
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
              currentUserId={currentUserId}
              sharePath={`/track/${track.id}`}
              likedByMe={likedTrackIds.has(track.id)}
            />
          );
        })}
        {(!tracks || tracks.length === 0) && <p className="text-white/50">{t.artist.noTracks}</p>}
      </div>

      <h2 className="text-lg font-semibold mb-3 text-white/80">{t.artist.videosHeading}</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {(videos as Video[] | null)?.map((video) => {
          const videoUrl = supabase.storage.from('videos').getPublicUrl(video.file_path).data.publicUrl;
          const downloadUrl = `${videoUrl}?download=${encodeURIComponent(video.title)}`;
          const coverUrl = video.cover_path
            ? supabase.storage.from('covers').getPublicUrl(video.cover_path).data.publicUrl
            : null;
          return (
            <VideoCard
              key={video.id}
              video={video}
              videoUrl={videoUrl}
              downloadUrl={downloadUrl}
              coverUrl={coverUrl}
              currentUserId={currentUserId}
            />
          );
        })}
        {(!videos || videos.length === 0) && <p className="text-white/50 sm:col-span-2">{t.artist.noVideos}</p>}
      </div>
    </main>
  );
}
