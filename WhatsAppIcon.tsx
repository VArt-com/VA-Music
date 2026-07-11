'use client';

import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Video } from '@/lib/types';
import { useI18n } from '@/lib/i18n/I18nProvider';
import DeleteButton from './DeleteButton';
import ShareButtons from './ShareButtons';

export default function VideoCard({
  video,
  videoUrl,
  downloadUrl,
  coverUrl = null,
  currentUserId = null,
  showShare = false,
}: {
  video: Video;
  videoUrl: string;
  downloadUrl: string;
  coverUrl?: string | null;
  currentUserId?: string | null;
  showShare?: boolean;
}) {
  const { t } = useI18n();
  const isOwner = Boolean(currentUserId && currentUserId === video.artist_id);
  const sharePath = `/videos/${video.id}`;

  const handlePlay = async () => {
    const supabase = createClient();
    await supabase.rpc('increment_video_view_count', { video_id: video.id });
  };

  const handleDownload = async () => {
    const supabase = createClient();
    await supabase.rpc('increment_video_download_count', { video_id: video.id });
  };

  const handleDelete = async () => {
    const supabase = createClient();
    await supabase.storage.from('videos').remove([video.file_path]);
    if (video.cover_path) {
      await supabase.storage.from('covers').remove([video.cover_path]);
    }
    const { error } = await supabase.from('videos').delete().eq('id', video.id);
    if (error) throw error;
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden hover:shadow-neon transition">
      <video
        controls
        preload="metadata"
        poster={coverUrl ?? undefined}
        className="w-full aspect-video bg-black"
        onPlay={handlePlay}
        src={videoUrl}
      >
        {t.video.noSupport}
      </video>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link href={`/videos/${video.id}`} className="font-semibold hover:text-fuchsia-300 truncate block">
              {video.title}
            </Link>
            <div className="text-sm text-white/60 truncate">
              {video.profiles && (
                <Link href={`/artist/${video.artist_id}`} className="hover:text-fuchsia-300">
                  {video.profiles.display_name || video.profiles.username}
                </Link>
              )}
            </div>
          </div>
          <a
            href={downloadUrl}
            onClick={handleDownload}
            className="shrink-0 text-xs bg-white/10 hover:bg-fuchsia-500/20 border border-white/10 hover:border-fuchsia-400/40 rounded-full px-3 py-1.5 transition"
          >
            {t.common.download}
          </a>
        </div>
        <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
          <div className="flex gap-3 text-xs text-white/40">
            <span>👁 {video.view_count}</span>
            <span>⬇ {video.download_count}</span>
            {video.tags?.length > 0 && <span>#{video.tags.join(' #')}</span>}
          </div>
          <div className="flex items-center gap-2">
            {showShare && <ShareButtons path={sharePath} title={video.title} compact />}
            {isOwner && <DeleteButton onDelete={handleDelete} />}
          </div>
        </div>
      </div>
    </div>
  );
}
