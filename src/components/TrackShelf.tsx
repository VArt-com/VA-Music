'use client';

import Image from 'next/image';
import { usePlayer, type NowPlaying } from '@/lib/player/PlayerContext';

// Spotify-style horizontal "shelf" of big square cover art — sits above the
// regular track list on the home page. `queue` is the full track list (so
// next/previous keep working normally once one of these starts playback);
// `tracks` is just the subset shown here (e.g. the newest few).
export default function TrackShelf({ tracks, queue }: { tracks: NowPlaying[]; queue: NowPlaying[] }) {
  const { current, isPlaying, playQueue, toggle } = usePlayer();

  if (tracks.length === 0) return null;

  return (
    <div className="mb-8 -mx-4 px-4 flex gap-4 overflow-x-auto pb-1">
      {tracks.map((track) => {
        const isCurrent = current?.id === track.id;
        return (
          <button
            key={track.id}
            type="button"
            onClick={() => {
              if (isCurrent) {
                toggle();
                return;
              }
              const index = queue.findIndex((q) => q.id === track.id);
              playQueue(queue, index >= 0 ? index : 0);
            }}
            className="group shrink-0 w-32 text-left"
          >
            <div className="relative w-32 h-32 rounded-xl overflow-hidden bg-gradient-to-br from-fuchsia-600 to-violet-600 shadow-neon-sm">
              {track.coverUrl && (
                <Image src={track.coverUrl} alt="" fill sizes="128px" className="object-cover" />
              )}
              <div
                className={`absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity ${
                  isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
              >
                <span className="w-9 h-9 rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-500 flex items-center justify-center text-white text-sm shadow-neon-sm">
                  {isCurrent && isPlaying ? '❚❚' : '▶'}
                </span>
              </div>
            </div>
            <div className="mt-2 text-sm font-medium truncate w-32">{track.title}</div>
            <div className="text-xs text-white/50 truncate w-32">{track.artist}</div>
          </button>
        );
      })}
    </div>
  );
}
