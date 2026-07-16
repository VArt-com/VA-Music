'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePlayer } from '@/lib/player/PlayerContext';
import { useI18n } from '@/lib/i18n/I18nProvider';
import Visualizer from './Visualizer';
import Equalizer from './Equalizer';

function SkipIcon({ direction }: { direction: 'prev' | 'next' }) {
  const flip = direction === 'prev' ? 'scale-x-[-1]' : '';
  return (
    <svg viewBox="0 0 24 24" className={`w-4 h-4 ${flip}`} fill="currentColor">
      <path d="M6 5h2v14H6z" />
      <path d="M9.5 12 19 5v14z" />
    </svg>
  );
}

export default function PlayerBar() {
  const {
    current,
    isPlaying,
    progress,
    duration,
    toggle,
    seek,
    analyser,
    volume,
    setVolume,
    setPlayerBarHeight,
    next,
    previous,
    hasNext,
    hasPrevious,
  } = usePlayer();
  const { t } = useI18n();
  const [showEq, setShowEq] = useState(false);
  const barRef = useRef<HTMLDivElement | null>(null);

  // Report the bar's real rendered height so PlayerBarSpacer can reserve the
  // exact amount of space — including when the equalizer panel is open and
  // the bar grows taller. Height resets to 0 as soon as playback stops.
  useEffect(() => {
    if (!current) {
      setPlayerBarHeight(0);
      return;
    }
    const el = barRef.current;
    if (!el) return;
    const update = () => setPlayerBarHeight(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [current, showEq, setPlayerBarHeight]);

  if (!current) return null;

  return (
    <div
      ref={barRef}
      className="fixed inset-x-0 z-50 border-t border-fuchsia-500/20 bg-black/85 backdrop-blur-xl animate-slide-up bottom-[calc(4rem+env(safe-area-inset-bottom))] sm:bottom-0"
    >
      {/* Full-width thin progress strip, Spotify-mini-player style — tap
          anywhere along it to seek. Replaces the old inline bar + time
          labels row, so the whole thing sits lower and more compact. */}
      <div
        className="relative h-[3px] w-full bg-white/10 cursor-pointer group"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          seek((e.clientX - rect.left) / rect.width);
        }}
      >
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-fuchsia-500 to-violet-500 group-hover:brightness-110"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {showEq && (
        <div className="max-w-3xl mx-auto px-4 pt-3">
          <Equalizer />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-3 py-2.5 sm:px-4 sm:py-3 flex items-center gap-2.5 sm:gap-4">
        {current.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.coverUrl}
            alt=""
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg object-cover shadow-neon-sm shrink-0"
          />
        ) : (
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-fuchsia-600 to-violet-600 shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <Link href={`/track/${current.id}`} className="block text-sm font-medium truncate hover:text-fuchsia-300">
            {current.title}
          </Link>
          <Link
            href={`/artist/${current.artistId}`}
            className="block text-xs text-white/50 truncate hover:text-fuchsia-300"
          >
            {current.artist}
          </Link>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={previous}
            disabled={!hasPrevious}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white disabled:opacity-30 disabled:hover:text-white/70 transition"
            aria-label={t.nav.tracks}
          >
            <SkipIcon direction="prev" />
          </button>
          <button
            onClick={toggle}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-500 flex items-center justify-center hover:scale-105 transition shadow-neon-sm text-white"
            aria-label={isPlaying ? t.player.pause : t.player.play}
          >
            {isPlaying ? '❚❚' : '▶'}
          </button>
          <button
            onClick={next}
            disabled={!hasNext}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white disabled:opacity-30 disabled:hover:text-white/70 transition"
            aria-label={t.nav.tracks}
          >
            <SkipIcon direction="next" />
          </button>
        </div>

        <button
          onClick={() => setShowEq((s) => !s)}
          className={`hidden sm:inline-flex text-xs shrink-0 px-2 py-1 rounded-full border transition ${
            showEq
              ? 'border-fuchsia-400/60 text-fuchsia-300 bg-fuchsia-500/10'
              : 'border-white/10 text-white/60 hover:text-fuchsia-300 hover:border-fuchsia-400/40'
          }`}
        >
          {t.player.eq}
        </button>

        <div className="hidden sm:block w-24 shrink-0">
          <Visualizer analyser={analyser} playing={isPlaying} />
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="hidden md:block w-16 accent-fuchsia-500 shrink-0"
          aria-label={t.player.volume}
        />
      </div>
    </div>
  );
}
