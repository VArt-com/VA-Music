'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePlayer } from '@/lib/player/PlayerContext';
import { useI18n } from '@/lib/i18n/I18nProvider';
import Visualizer from './Visualizer';
import Equalizer from './Equalizer';

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}

export default function PlayerBar() {
  const { current, isPlaying, progress, duration, toggle, seek, analyser, volume, setVolume, setPlayerBarHeight } =
    usePlayer();
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
      className="fixed bottom-0 inset-x-0 z-50 border-t border-fuchsia-500/20 bg-black/80 backdrop-blur-xl animate-slide-up"
    >
      {showEq && (
        <div className="max-w-3xl mx-auto px-4 pt-3">
          <Equalizer />
        </div>
      )}
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3 sm:gap-4">
        {current.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.coverUrl}
            alt=""
            className="w-12 h-12 rounded-lg object-cover shadow-neon-sm shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-fuchsia-600 to-violet-600 shrink-0" />
        )}
        <button
          onClick={toggle}
          className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-500 flex items-center justify-center hover:scale-105 transition shadow-neon-sm text-white"
          aria-label={isPlaying ? t.player.pause : t.player.play}
        >
          {isPlaying ? '❚❚' : '▶'}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 text-sm">
            <div className="truncate">
              <Link href={`/track/${current.id}`} className="font-medium hover:text-fuchsia-300">
                {current.title}
              </Link>
              <span className="text-white/40"> · </span>
              <Link href={`/artist/${current.artistId}`} className="text-white/60 hover:text-fuchsia-300">
                {current.artist}
              </Link>
            </div>
            <button
              onClick={() => setShowEq((s) => !s)}
              className={`text-xs shrink-0 px-2 py-1 rounded-full border transition ${
                showEq
                  ? 'border-fuchsia-400/60 text-fuchsia-300 bg-fuchsia-500/10'
                  : 'border-white/10 text-white/60 hover:text-fuchsia-300 hover:border-fuchsia-400/40'
              }`}
            >
              {t.player.eq}
            </button>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="hidden xs:inline text-[10px] text-white/40 w-8 text-right">
              {formatTime(progress * duration)}
            </span>
            <div
              className="relative h-1.5 flex-1 rounded-full bg-white/10 cursor-pointer overflow-hidden"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                seek((e.clientX - rect.left) / rect.width);
              }}
            >
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-fuchsia-500 to-violet-500"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <span className="hidden xs:inline text-[10px] text-white/40 w-8">{formatTime(duration)}</span>
          </div>
        </div>
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
