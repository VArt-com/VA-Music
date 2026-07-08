import { createClient } from '@/lib/supabase/server';
import TrackCard from '@/components/TrackCard';
import type { Track } from '@/lib/types';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from('tracks')
    .select('*, profiles(*)')
    .order('created_at', { ascending: false })
    .limit(50);

  if (q) {
    query = query.ilike('title', `%${q}%`);
  }

  const { data: tracks } = await query;

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <form className="mb-6" action="/">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Поиск треков..."
          className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-2 outline-none focus:border-pink-400"
        />
      </form>
      <div className="space-y-4">
        {(tracks as Track[] | null)?.map((track) => {
          const audioUrl = supabase.storage.from('tracks').getPublicUrl(track.file_path).data.publicUrl;
          const downloadUrl = `${audioUrl}?download=${encodeURIComponent(track.title)}`;
          return <TrackCard key={track.id} track={track} audioUrl={audioUrl} downloadUrl={downloadUrl} />;
        })}
        {(!tracks || tracks.length === 0) && (
          <p className="text-white/50 text-center py-12">
            Пока нет треков. Будь первым — загрузи свою музыку!
          </p>
        )}
      </div>
    </main>
  );
}
