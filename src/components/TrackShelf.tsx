'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { usePlayer, type NowPlaying } from '@/lib/player/PlayerContext';

const CARD_WIDTH = 128 + 16; // w-32 (128px) + gap-4 (16px)
const SCROLL_STEP = CARD_WIDTH * 3;

// Spotify-style horizontal "shelf" of big square cover art — sits above the
// regular track list on the home page. Shows every track on the platform
// (not just the newest few), with looping ‹ › arrows so people can flip
// through the whole thing without ever hitting a dead end.
export default function TrackShelf({ tracks, queue }: { tracks: NowPlaying[]; queue: NowPlaying[] }) {
  const { current, isPlaying, playQueue, toggle } = usePlayer();
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  if (tracks.length === 0) return null;

  const scrollByLooping = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) return;

    if (direction === 1 && el.scrollLeft >= maxScroll - 4) {
      el.scrollTo({ left: 0, behavior: 'smooth' });
      return;
    }
    if (direction === -1 && el.scrollLeft <= 4) {
      el.scrollTo({ left: maxScroll, behavior: 'smooth' });
      return;
    }
    el.scrollBy({ left: SCROLL_STEP * direction, behavior: 'smooth' });
  };

  return (
    <div className="relative mb-8 -mx-4 px-4">
      <div ref={scrollerRef} className="flex gap-4 overflow-x-auto pb-1 scroll-smooth">
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

      {tracks.length > 3 && (
        <>
          <button
            type="button"
            onClick={() => scrollByLooping(-1)}
            aria-label="Назад"
            className="flex absolute left-0 top-16 -translate-y-1/2 w-8 h-8 rounded-full bg-black/70 border border-white/10 items-center justify-center text-white/80 hover:text-fuchsia-300 hover:border-fuchsia-400/40 transition shadow-neon-sm"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => scrollByLooping(1)}
            aria-label="Вперёд"
            className="flex absolute right-0 top-16 -translate-y-1/2 w-8 h-8 rounded-full bg-black/70 border border-white/10 items-center justify-center text-white/80 hover:text-fuchsia-300 hover:border-fuchsia-400/40 transition shadow-neon-sm"
          >
            ›
          </button>
        </>
      )}
    </div>
  );
}
