import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import VideoCard from '@/components/VideoCard';
import type { Video } from '@/lib/types';

export default async function VideoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: video } = await supabase.from('videos').select('*, profiles(*)').eq('id', id).single();
  if (!video) notFound();

  const v = video as Video;
  const videoUrl = supabase.storage.from('videos').getPublicUrl(v.file_path).data.publicUrl;
  const downloadUrl = `${videoUrl}?download=${encodeURIComponent(v.title)}`;
  const coverUrl = v.cover_path ? supabase.storage.from('covers').getPublicUrl(v.cover_path).data.publicUrl : null;

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 pb-32">
      <VideoCard
        video={v}
        videoUrl={videoUrl}
        downloadUrl={downloadUrl}
        coverUrl={coverUrl}
        currentUserId={user?.id ?? null}
        showShare
      />
      {v.description && <p className="mt-4 text-white/70 whitespace-pre-wrap">{v.description}</p>}
    </main>
  );
}
