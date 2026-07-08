import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import TrackCard from '@/components/TrackCard';
import type { Track } from '@/lib/types';

export default async function TrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: track } = await supabase.from('tracks').select('*, profiles(*)').eq('id', id).single();

  if (!track) notFound();

  const audioUrl = supabase.storage.from('tracks').getPublicUrl((track as Track).file_path).data.publicUrl;
  const downloadUrl = `${audioUrl}?download=${encodeURIComponent((track as Track).title)}`;

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <TrackCard track={track as Track} audioUrl={audioUrl} downloadUrl={downloadUrl} />
      {(track as Track).description && (
        <p className="mt-4 text-white/70 whitespace-pre-wrap">{(track as Track).description}</p>
      )}
    </main>
  );
}
