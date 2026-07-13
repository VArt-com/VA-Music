'use client';

import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Track } from '@/lib/types';
import { usePlayer, type NowPlaying } from '@/lib/player/PlayerContext';
import { useI18n } from '@/lib/i18n/I18nProvider';
import DeleteButton from './DeleteButton';
import ShareButtons from './ShareButtons';
import AddToPlaylistButton from './AddToPlaylistButton';

export default function TrackCard({
  track,
  audioUrl,
  downloadUrl,
  coverUrl = null,
  currentUserId = null,
  sharePath,
  queue,
  queueIndex,
}: {
  track: Track;
  audioUrl: string;
  downloadUrl: string;
  coverUrl?: string | null;
  currentUserId?: string | null;
  sharePath?: string;
  queue?: NowPlaying[];
  queueIndex?: number;
}) {
  const { current, isPlaying, play, playQueue, toggle } = usePlayer();
  const { t } = useI18n();
  const isCurrent = current?.id === track.id;
  const isOwner = Boolean(currentUserId && currentUserId === track.artist_id);

  const handlePlay = () => {
    if (isCurrent) {
      toggle();
      return;
    }
    const supabase = createClient();
    supabase.rpc('increment_play_count', { track_id: track.id }).then(() => {});
    if (queue && queueIndex !== undefined) {
      playQueue(queue, queueIndex);
    } else {
      play({
        id: track.id,
        title: track.title,
        artist: track.profiles?.display_name || track.profiles?.username || t.common.unknownArtist,
        artistId: track.artist_id,
        audioUrl,
        coverUrl,
      });
    }
  };

  const handleDownload = async () => {
    const supabase = createClient();
    await supabase.rpc('increment_download_count', { track_id: track.id });
  };

  const handleDelete = async () => {
    const supabase = createClient();
    await supabase.storage.from('tracks').remove([track.file_path]);
    if (track.cover_path) {
      await supabase.storage.from('covers').remove([track.cover_path]);
    }
    const { error } = await supabase.from('tracks').delete().eq('id', track.id);
    if (error) throw error;
  };

  return (
    <div className="group glass-card rounded-2xl p-4 flex items-center gap-4 hover:shadow-neon transition">
      <button
        type="button"
        onClick={handlePlay}
        className="relative shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-br from-fuchsia-600 to-violet-600 flex items-center justify-center"
        aria-label={isCurrent && isPlaying ? t.player.pause : t.player.play}
      >
        {coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <span className="relative z-10 text-white text-lg drop-shadow">
          {isCurrent && isPlaying ? '❚❚' : '▶'}
        </span>
      </button>

      <div className="min-w-0 flex-1">
        <Link href={`/track/${track.id}`} className="font-semibold hover:text-fuchsia-300 truncate block">
          {track.title}
        </Link>
        <div className="text-sm text-white/60 truncate">
          {track.profiles && (
            <Link href={`/artist/${track.artist_id}`} className="hover:text-fuchsia-300">
              {track.profiles.display_name || track.profiles.username}
            </Link>
          )}
          {track.genre && <span> · {track.genre}</span>}
        </div>
        <div className="flex flex-wrap gap-3 mt-1 text-xs text-white/40">
          <span>▶ {track.play_count}</span>
          <span>⬇ {track.download_count}</span>
          {track.tags?.length > 0 && <span>#{track.tags.join(' #')}</span>}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <AddToPlaylistButton trackId={track.id} userId={currentUserId} />
        {sharePath && <ShareButtons path={sharePath} title={track.title} compact />}
        
          <a href={downloadUrl} onClick={handleDownload} className="text-xs bg-white/10 hover:bg-fuchsia-500/20 border border-white/10 hover:border-fuchsia-400/40 rounded-full px-3 py-1.5 whitespace-nowrap transition">
          {t.common.download}
        </a>
        {isOwner && <DeleteButton onDelete={handleDelete} />}
      </div>
    </div>
  );
}
