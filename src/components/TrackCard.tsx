'use client';

import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import type { Track } from '@/lib/types';
import { usePlayer, type NowPlaying } from '@/lib/player/PlayerContext';
import { useI18n } from '@/lib/i18n/I18nProvider';
import DeleteButton from './DeleteButton';
import ShareButtons from './ShareButtons';
import AddToPlaylistButton from './AddToPlaylistButton';
import OfflineDownloadButton from './OfflineDownloadButton';

export default function TrackCard({
  track,
  audioUrl,
  downloadUrl,
  coverUrl = null,
  currentUserId = null,
  sharePath,
  queue,
  queueIndex,
  playlistId,
  canRemoveFromPlaylist = false,
}: {
  track: Track;
  audioUrl: string;
  downloadUrl: string;
  coverUrl?: string | null;
  currentUserId?: string | null;
  sharePath?: string;
  queue?: NowPlaying[];
  queueIndex?: number;
  /** When set, shows a "remove from playlist" button (does not delete the track itself). */
  playlistId?: string;
  canRemoveFromPlaylist?: boolean;
}) {
  const { current, isPlaying, play, playQueue, toggle } = usePlayer();
  const { t } = useI18n();
  const isCurrent = current?.id === track.id;
  const isOwner = Boolean(currentUserId && currentUserId === track.artist_id);
  const artistName = track.profiles?.display_name || track.profiles?.username || t.common.unknownArtist;

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
        artist: artistName,
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

  const handleRemoveFromPlaylist = async () => {
    if (!playlistId) return;
    const supabase = createClient();
    const { error } = await supabase
      .from('playlist_tracks')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('track_id', track.id);
    if (error) throw error;
  };

  return (
    // Spotify-style flat list row instead of a boxed card: tighter padding,
    // a thin divider instead of a full glass border, and a hover tint. The
    // actions cluster gets its own scroll container with a percentage cap
    // so on narrow phones it scrolls horizontally instead of wrapping onto
    // a second line and colliding with the title/tags below it.
    <div className="group flex items-center gap-3 py-2.5 px-2 rounded-lg border-b border-white/5 last:border-b-0 hover:bg-white/[0.04] transition">
      <button
        type="button"
        onClick={handlePlay}
        className="relative shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-gradient-to-br from-fuchsia-600 to-violet-600 flex items-center justify-center"
        aria-label={isCurrent && isPlaying ? t.player.pause : t.player.play}
      >
        {coverUrl && (
          // Resized/lazy-loaded by Next instead of downloading the
          // full-size upload for a 44px thumbnail on every row.
          <Image src={coverUrl} alt="" fill sizes="48px" className="object-cover" />
        )}
        <span
          className={`relative z-10 text-white text-sm drop-shadow transition-opacity ${
            isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          {isCurrent && isPlaying ? '❚❚' : '▶'}
        </span>
      </button>

      <div className="min-w-0 flex-1">
        <Link
          href={`/track/${track.id}`}
          className={`font-medium truncate block ${isCurrent ? 'text-fuchsia-300' : 'hover:text-fuchsia-300'}`}
        >
          {track.title}
        </Link>
        <div className="text-xs sm:text-sm text-white/50 truncate">
          {track.profiles && (
            <Link href={`/artist/${track.artist_id}`} className="hover:text-fuchsia-300">
              {track.profiles.display_name || track.profiles.username}
            </Link>
          )}
          {track.genre && <span> · {track.genre}</span>}
        </div>
        {/* Play/download counts and tags add clutter on a narrow phone row —
            keep them for tablet/desktop only. */}
        <div className="hidden sm:flex flex-wrap gap-3 mt-1 text-xs text-white/40">
          <span>▶ {track.play_count}</span>
          <span>⬇ {track.download_count}</span>
          {track.tags?.length > 0 && <span>#{track.tags.join(' #')}</span>}
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 max-w-[46%] sm:max-w-none overflow-x-auto">
        <AddToPlaylistButton trackId={track.id} userId={currentUserId} />
        <OfflineDownloadButton
          trackId={track.id}
          title={track.title}
          artist={artistName}
          artistId={track.artist_id}
          coverUrl={coverUrl}
          audioUrl={audioUrl}
        />
        {sharePath && <ShareButtons path={sharePath} title={track.title} compact />}
        <a
          href={downloadUrl}
          onClick={handleDownload}
          className="text-xs bg-white/10 hover:bg-fuchsia-500/20 border border-white/10 hover:border-fuchsia-400/40 rounded-full px-3 py-1.5 whitespace-nowrap transition"
        >
          {t.common.download}
        </a>
        {playlistId && canRemoveFromPlaylist && (
          <DeleteButton onDelete={handleRemoveFromPlaylist} label={t.playlists.removeFromPlaylist} />
        )}
        {isOwner && <DeleteButton onDelete={handleDelete} />}
      </div>
    </div>
  );
}
