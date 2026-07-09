import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getDictionary } from '@/lib/i18n/server';
import VideoCard from '@/components/VideoCard';
import type { Video } from '@/lib/types';

export default async function VideosPage({
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
    .from('videos')
    .select('*, profiles(*)')
    .order('created_at', { ascending: false })
    .limit(50);

  if (q) {
    query = query.ilike('title', `%${q}%`);
  }

  const { data: videos } = await query;

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 pb-32">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-6">
        <div>
          <h1 className="text-3xl font-extrabold neon-text mb-1">{t.videosPage.title}</h1>
          <p className="text-white/50 text-sm">{t.videosPage.subtitle}</p>
        </div>
        <Link href="/videos/upload" className="btn-neon text-sm px-4 py-2 rounded-full whitespace-nowrap">
          + {t.videosPage.uploadVideo}
        </Link>
      </div>
      <form className="mb-6" action="/videos">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder={t.videosPage.searchPlaceholder}
          className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-2 outline-none focus:border-fuchsia-400 transition"
        />
      </form>
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
              currentUserId={user?.id ?? null}
            />
          );
        })}
        {(!videos || videos.length === 0) && (
          <p className="text-white/50 text-center py-12 sm:col-span-2">{t.videosPage.empty}</p>
        )}
      </div>
    </main>
  );
}
