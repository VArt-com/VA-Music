import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import TrackCard from '@/components/TrackCard';
import type { Profile, Track } from '@/lib/types';

export default async function ArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', id).single();
  if (!profile) notFound();

  const { data: tracks } = await supabase
    .from('tracks')
    .select('*, profiles(*)')
    .eq('artist_id', id)
    .order('created_at', { ascending: false });

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{(profile as Profile).display_name || (profile as Profile).username}</h1>
        {(profile as Profile).bio && <p className="text-white/60 mt-1">{(profile as Profile).bio}</p>}
      </div>
      <div className="space-y-4">
        {(tracks as Track[] | null)?.map((track) => {
          const audioUrl = supabase.storage.from('tracks').getPublicUrl(track.file_path).data.publicUrl;
          const downloadUrl = `${audioUrl}?download=${encodeURIComponent(track.title)}`;
          return <TrackCard key={track.id} track={track} audioUrl={audioUrl} downloadUrl={downloadUrl} />;
        })}
        {(!tracks || tracks.length === 0) && <p className="text-white/50">Пока нет треков.</p>}
      </div>
    </main>
  );
}
