'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePlayer } from '@/lib/player/PlayerContext';
import { useI18n } from '@/lib/i18n/I18nProvider';
import Visualizer from './Visualizer';

function SkipIcon({ direction }: { direction: 'prev' | 'next' }) {
  const flip = direction === 'prev' ? 'scale-x-[-1]' : '';
  return (
    <svg viewBox="0 0 24 24" className={`w-6 h-6 ${flip}`} fill="currentColor">
      <path d="M6 5h2v14H6z" />
      <path d="M9.5 12 19 5v14z" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
    </svg>
  );
}

function formatTime(seconds: number) {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Full-screen "Now Playing" view, Spotify/Apple-Music style — opened by
// tapping the mini-player. Big cover, title/artist, a draggable progress
// bar, and larger transport controls. Closes via the chevron, which just
// hides this overlay — playback itself lives in PlayerContext and keeps
// running underneath regardless of whether this view is open.
export default function FullscreenPlayer() {
  const {
    current,
    isPlaying,
    progress,
    duration,
    toggle,
    seek,
    next,
    previous,
    hasNext,
    hasPrevious,
    analyser,
    fullscreenOpen,
    closeFullscreen,
  } = usePlayer();
  const { t } = useI18n();

  if (!fullscreenOpen || !current) return null;

  const elapsed = duration * progress;

  return (
    <div className="fixed inset-0 z-[60] bg-gradient-to-b from-[#1a0b2e] via-[#12071f] to-black flex flex-col animate-slide-up">
      <div className="flex items-center justify-between px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-2 shrink-0">
        <button
          type="button"
          onClick={closeFullscreen}
          aria-label={t.player.close}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition"
        >
          <ChevronDownIcon />
        </button>
        <p className="text-xs uppercase tracking-wider text-white/40">{t.player.nowPlaying}</p>
        <div className="w-10 h-10" />
      </div>

      <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-8 gap-8">
        <div className="w-full max-w-xs aspect-square rounded-2xl overflow-hidden shadow-2xl shadow-fuchsia-900/40 shrink-0">
          {current.coverUrl ? (
            <Image
              src={current.coverUrl}
              alt=""
              width={400}
              height={400}
              sizes="(max-width: 640px) 80vw, 320px"
              className="w-full h-full object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-fuchsia-600 to-violet-600" />
          )}
        </div>

        <div className="hidden sm:block w-full max-w-xs h-10">
          <Visualizer analyser={analyser} playing={isPlaying} />
        </div>

        <div className="w-full max-w-xs text-center">
          <Link
            href={`/track/${current.id}`}
            onClick={closeFullscreen}
            className="block text-xl font-bold truncate hover:text-fuchsia-300 transition"
          >
            {current.title}
          </Link>
          <Link
            href={`/artist/${current.artistId}`}
            onClick={closeFullscreen}
            className="block text-sm text-white/50 truncate hover:text-fuchsia-300 transition mt-1"
          >
            {current.artist}
          </Link>
        </div>

        <div className="w-full max-w-xs">
          <div
            className="relative h-1.5 w-full bg-white/10 rounded-full cursor-pointer group"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              seek((e.clientX - rect.left) / rect.width);
            }}
          >
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-fuchsia-500 to-violet-500 rounded-full group-hover:brightness-110"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-white/40 mt-1.5">
            <span>{formatTime(elapsed)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={previous}
            disabled={!hasPrevious}
            className="w-11 h-11 rounded-full flex items-center justify-center text-white/70 hover:text-white disabled:opacity-30 disabled:hover:text-white/70 transition"
            aria-label={t.nav.tracks}
          >
            <SkipIcon direction="prev" />
          </button>
          <button
            onClick={toggle}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-500 flex items-center justify-center hover:scale-105 transition shadow-neon text-white text-xl"
            aria-label={isPlaying ? t.player.pause : t.player.play}
          >
            {isPlaying ? '❚❚' : '▶'}
          </button>
          <button
            onClick={next}
            disabled={!hasNext}
            className="w-11 h-11 rounded-full flex items-center justify-center text-white/70 hover:text-white disabled:opacity-30 disabled:hover:text-white/70 transition"
            aria-label={t.nav.tracks}
          >
            <SkipIcon direction="next" />
          </button>
        </div>
      </div>

      <div className="h-8 shrink-0" />
    </div>
  );
}
