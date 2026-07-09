import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import TrackCard from '@/components/TrackCard';
import ShareButtons from '@/components/ShareButtons';
import type { Track } from '@/lib/types';

export default async function TrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: track } = await supabase.from('tracks').select('*, profiles(*)').eq('id', id).single();

  if (!track) notFound();

  const t = track as Track;
  const audioUrl = supabase.storage.from('tracks').getPublicUrl(t.file_path).data.publicUrl;
  const downloadUrl = `${audioUrl}?download=${encodeURIComponent(t.title)}`;
  const coverUrl = t.cover_path ? supabase.storage.from('covers').getPublicUrl(t.cover_path).data.publicUrl : null;
  const sharePath = `/track/${t.id}`;

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 pb-32">
      {coverUrl && (
        <div
          className="h-40 sm:h-56 rounded-2xl mb-[-3rem] opacity-40 blur-2xl bg-cover bg-center -z-10"
          style={{ backgroundImage: `url(${coverUrl})` }}
        />
      )}
      <TrackCard
        track={t}
        audioUrl={audioUrl}
        downloadUrl={downloadUrl}
        coverUrl={coverUrl}
        currentUserId={user?.id ?? null}
        sharePath={sharePath}
      />
      <div className="mt-4 flex justify-end">
        <ShareButtons path={sharePath} title={t.title} />
      </div>
      {t.description && <p className="mt-4 text-white/70 whitespace-pre-wrap">{t.description}</p>}
    </main>
  );
}
