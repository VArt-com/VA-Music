import { createClient } from '@/lib/supabase/server';
import { getDictionary } from '@/lib/i18n/server';
import TrackCard from '@/components/TrackCard';
import type { Track } from '@/lib/types';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();
  const t = await getDictionary();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
    <main className="max-w-3xl mx-auto px-4 py-8 pb-32">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold neon-text mb-1">{t.home.title}</h1>
        <p className="text-white/50 text-sm">{t.home.subtitle}</p>
      </div>
      <form className="mb-6" action="/">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder={t.home.searchPlaceholder}
          className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-2 outline-none focus:border-fuchsia-400 transition"
        />
      </form>
      <div className="space-y-3">
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
              currentUserId={user?.id ?? null}
              sharePath={`/track/${track.id}`}
            />
          );
        })}
        {(!tracks || tracks.length === 0) && <p className="text-white/50 text-center py-12">{t.home.empty}</p>}
      </div>
    </main>
  );
}
