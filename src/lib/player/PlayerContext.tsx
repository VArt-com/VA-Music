'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export type NowPlaying = {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  audioUrl: string;
  coverUrl: string | null;
};

export type EQBands = { bass: number; mid: number; treble: number };

export const EQ_PRESETS: Record<string, EQBands> = {
  flat: { bass: 0, mid: 0, treble: 0 },
  rock: { bass: 5, mid: -2, treble: 4 },
  pop: { bass: 2, mid: 1, treble: 3 },
  electronic: { bass: 6, mid: -1, treble: 5 },
  vocal: { bass: -2, mid: 5, treble: 2 },
  bassBoost: { bass: 9, mid: 0, treble: -1 },
};

export const EQ_PRESET_LABELS: Record<string, string> = {
  flat: 'Плоский',
  rock: 'Рок',
  pop: 'Поп',
  electronic: 'Электроника',
  vocal: 'Вокал',
  bassBoost: 'Бас-буст',
};

type PlayerContextType = {
  current: NowPlaying | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  analyser: AnalyserNode | null;
  eq: EQBands;
  setEq: (band: Partial<EQBands>) => void;
  applyPreset: (name: string) => void;
  play: (track: NowPlaying) => void;
  toggle: () => void;
  seek: (ratio: number) => void;
  setVolume: (value: number) => void;
  /** Live-measured height (px) of the fixed PlayerBar, 0 when it isn't shown. */
  playerBarHeight: number;
  setPlayerBarHeight: (height: number) => void;
};

const PlayerContext = createContext<PlayerContextType | null>(null);

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used inside <PlayerProvider>');
  return ctx;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const bassRef = useRef<BiquadFilterNode | null>(null);
  const midRef = useRef<BiquadFilterNode | null>(null);
  const trebleRef = useRef<BiquadFilterNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const currentIdRef = useRef<string | null>(null);

  const [current, setCurrent] = useState<NowPlaying | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [eq, setEqState] = useState<EQBands>(EQ_PRESETS.flat);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const [playerBarHeight, setPlayerBarHeight] = useState(0);

  const ensureGraph = useCallback(() => {
    if (audioCtxRef.current || !audioRef.current) return;
    try {
      const AudioContextCtor: typeof AudioContext =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioContextCtor();
      const source = audioCtx.createMediaElementSource(audioRef.current);
      const bass = audioCtx.createBiquadFilter();
      bass.type = 'lowshelf';
      bass.frequency.value = 200;
      const mid = audioCtx.createBiquadFilter();
      mid.type = 'peaking';
      mid.frequency.value = 1000;
      mid.Q.value = 0.7;
      const treble = audioCtx.createBiquadFilter();
      treble.type = 'highshelf';
      treble.frequency.value = 3200;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.75;

      source.connect(bass).connect(mid).connect(treble).connect(analyser).connect(audioCtx.destination);

      audioCtxRef.current = audioCtx;
      sourceRef.current = source;
      bassRef.current = bass;
      midRef.current = mid;
      trebleRef.current = treble;
      analyserRef.current = analyser;
      setAnalyserNode(analyser);
    } catch {
      // Web Audio graph can only be built once per <audio> element and may
      // fail silently in unsupported environments — playback still works
      // without the visualizer/equalizer in that case.
    }
  }, []);

  const play = useCallback(
    async (track: NowPlaying) => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.crossOrigin = 'anonymous';
      ensureGraph();
      // AudioContext starts (or resumes) suspended in some browsers even
      // inside a click handler. If we call audio.play() before resume()
      // actually finishes, the element visually "plays" but the Web Audio
      // graph it's routed through is still silent — so the first click
      // appears to do nothing and only a second click (after resume() has
      // since settled) is audible. Awaiting it here fixes that.
      if (audioCtxRef.current?.state === 'suspended') {
        try {
          await audioCtxRef.current.resume();
        } catch {
          // ignore — play() below still attempts native playback
        }
      }
      // Assign the source directly here (NOT inside the setCurrent updater
      // below) so it is guaranteed to be set before audio.play() runs.
      // Setting it from inside a React state updater delays the actual
      // assignment until the next render, which meant audio.play() below
      // ran against an empty/stale source on the very first click for a
      // track — failing silently — and only a second click (after the
      // updater had flushed) actually worked.
      if (currentIdRef.current !== track.id) {
        audio.src = track.audioUrl;
        currentIdRef.current = track.id;
      }
      setCurrent(track);
      audio.play().catch(() => {});
    },
    [ensureGraph]
  );

  const toggle = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audioCtxRef.current?.state === 'suspended') {
      try {
        await audioCtxRef.current.resume();
      } catch {
        // ignore
      }
    }
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  }, []);

  const seek = useCallback((ratio: number) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    audio.currentTime = Math.min(Math.max(ratio, 0), 1) * audio.duration;
  }, []);

  const setVolume = useCallback((value: number) => {
    setVolumeState(value);
    if (audioRef.current) audioRef.current.volume = value;
  }, []);

  const setEq = useCallback((band: Partial<EQBands>) => {
    setEqState((prev) => {
      const next = { ...prev, ...band };
      if (bassRef.current) bassRef.current.gain.value = next.bass;
      if (midRef.current) midRef.current.gain.value = next.mid;
      if (trebleRef.current) trebleRef.current.gain.value = next.treble;
      return next;
    });
  }, []);

  const applyPreset = useCallback(
    (name: string) => {
      setEq(EQ_PRESETS[name] ?? EQ_PRESETS.flat);
    },
    [setEq]
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTime = () => setProgress(audio.duration ? audio.currentTime / audio.duration : 0);
    const onLoaded = () => setDuration(audio.duration || 0);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('ended', onPause);
    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('ended', onPause);
    };
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        current,
        isPlaying,
        progress,
        duration,
        volume,
        analyser: analyserNode,
        eq,
        setEq,
        applyPreset,
        play,
        toggle,
        seek,
        setVolume,
        playerBarHeight,
        setPlayerBarHeight,
      }}
    >
      {children}
      {/* Single persistent <audio> element shared by the whole app so playback
          survives navigation between pages. */}
      <audio ref={audioRef} preload="metadata" />
    </PlayerContext.Provider>
  );
}
