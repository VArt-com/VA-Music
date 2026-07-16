import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getDictionary } from '@/lib/i18n/server';
import TrackCard from '@/components/TrackCard';
import TrackShelf from '@/components/TrackShelf';
import type { Track } from '@/lib/types';
import type { NowPlaying } from '@/lib/player/PlayerContext';

const PAGE_SIZE = 50;
const SHELF_SIZE = 10;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageParam } = await searchParams;
  const supabase = await createClient();
  const t = await getDictionary();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('tracks')
    .select('*, profiles(*)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (q) {
    query = query.ilike('title', `%${q}%`);
  }

  const [{ data: tracks, count: matchCount }, { count: totalTracks }, { count: totalVideos }] = await Promise.all([
    query,
    supabase.from('tracks').select('*', { count: 'exact', head: true }),
    supabase.from('videos').select('*', { count: 'exact', head: true }),
  ]);

  const totalPages = Math.max(1, Math.ceil((matchCount ?? 0) / PAGE_SIZE));

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (p > 1) params.set('page', String(p));
    const qs = params.toString();
    return qs ? `/?${qs}` : '/';
  };

  const nowPlayingList: NowPlaying[] =
    (tracks as Track[] | null)?.map((track) => {
      const audioUrl = supabase.storage.from('tracks').getPublicUrl(track.file_path).data.publicUrl;
      const coverUrl = track.cover_path
        ? supabase.storage.from('covers').getPublicUrl(track.cover_path).data.publicUrl
        : null;
      return {
        id: track.id,
        title: track.title,
        artist: track.profiles?.display_name || track.profiles?.username || t.common.unknownArtist,
        artistId: track.artist_id,
        audioUrl,
        coverUrl,
      };
    }) ?? [];

  // Only show the big-cover shelf on the unfiltered first page — once
  // someone is searching or paging through results it stops being "what's
  // fresh" and should just be the plain list.
  const showShelf = !q && page === 1;

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 pb-32">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold neon-text mb-1">{t.home.title}</h1>
        <p className="text-white/50 text-sm">{t.home.subtitle}</p>
        <p className="text-white/40 text-xs mt-2">
          {t.home.statsLine
            .replace('{tracks}', String(totalTracks ?? 0))
            .replace('{videos}', String(totalVideos ?? 0))}
        </p>
      </div>

      {showShelf && <TrackShelf tracks={nowPlayingList.slice(0, SHELF_SIZE)} queue={nowPlayingList} />}

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
        {(tracks as Track[] | null)?.map((track, index) => {
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
              queue={nowPlayingList}
              queueIndex={index}
            />
          );
        })}
        {(!tracks || tracks.length === 0) && <p className="text-white/50 text-center py-12">{t.home.empty}</p>}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8 text-sm">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="text-fuchsia-300 hover:text-fuchsia-200 transition">
              {t.home.prevPage}
            </Link>
          ) : (
            <span />
          )}
          <span className="text-white/40">
            {t.home.pageInfo.replace('{page}', String(page)).replace('{total}', String(totalPages))}
          </span>
          {page < totalPages ? (
            <Link href={pageHref(page + 1)} className="text-fuchsia-300 hover:text-fuchsia-200 transition">
              {t.home.nextPage}
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </main>
  );
}
