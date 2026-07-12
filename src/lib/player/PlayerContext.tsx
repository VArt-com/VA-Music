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
  playQueue: (tracks: NowPlaying[], startIndex: number) => void;
  next: () => void;
  previous: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
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

  // Track queue (e.g. the full list of tracks visible on the current page),
  // so we know what "next" and "previous" mean, and so we can auto-advance
  // when a track ends — including while the phone screen is locked.
  const [queue, setQueue] = useState<NowPlaying[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const queueRef = useRef<NowPlaying[]>([]);
  const queueIndexRef = useRef(0);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);
  useEffect(() => {
    queueIndexRef.current = queueIndex;
  }, [queueIndex]);

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

  // Low-level: actually load + play a given track, without touching the queue.
  const playTrack = useCallback(
    async (track: NowPlaying) => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.crossOrigin = 'anonymous';
      ensureGraph();
      if (audioCtxRef.current?.state === 'suspended') {
        try {
          await audioCtxRef.current.resume();
        } catch {
          // ignore — play() below still attempts native playback
        }
      }
      if (currentIdRef.current !== track.id) {
        audio.src = track.audioUrl;
        currentIdRef.current = track.id;
      }
      setCurrent(track);
      audio.play().catch(() => {});
    },
    [ensureGraph]
  );

  // Public: play a single track on its own (resets the queue to just this track).
  const play = useCallback(
    (track: NowPlaying) => {
      setQueue([track]);
      setQueueIndex(0);
      playTrack(track);
    },
    [playTrack]
  );

  // Public: play a track from within a list, remembering the whole list so
  // "next"/"previous" (and auto-advance on end) know what to do.
  const playQueue = useCallback(
    (tracks: NowPlaying[], startIndex: number) => {
      const track = tracks[startIndex];
      if (!track) return;
      setQueue(tracks);
      setQueueIndex(startIndex);
      playTrack(track);
    },
    [playTrack]
  );

  const next = useCallback(() => {
    const q = queueRef.current;
    const i = queueIndexRef.current;
    if (i + 1 < q.length) {
      const idx = i + 1;
      setQueueIndex(idx);
      playTrack(q[idx]);
    }
  }, [playTrack]);

  const previous = useCallback(() => {
    const q = queueRef.current;
    const i = queueIndexRef.current;
    if (i > 0) {
      const idx = i - 1;
      setQueueIndex(idx);
      playTrack(q[idx]);
    }
  }, [playTrack]);

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
    // When a track finishes — including while the screen is locked — move
    // on to the next track in the queue automatically, instead of just
    // stopping and waiting for the user to unlock and tap next.
    const onEnded = () => {
      const q = queueRef.current;
      const i = queueIndexRef.current;
      if (i + 1 < q.length) {
        const idx = i + 1;
        setQueueIndex(idx);
        playTrack(q[idx]);
      } else {
        setIsPlaying(false);
      }
    };
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('ended', onEnded);
    };
  }, [playTrack]);

  // Media Session integration: without this, mobile browsers have no signal
  // that this <audio> element is a "real" media playback session, and will
  // often pause it as soon as the tab is backgrounded / the screen locks.
  // Registering metadata + action handlers is what makes lock-screen
  // controls appear and keeps playback alive while the screen is off.
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator) || !current) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title,
      artist: current.artist,
      artwork: current.coverUrl
        ? [
            { src: current.coverUrl, sizes: '96x96', type: 'image/png' },
            { src: current.coverUrl, sizes: '256x256', type: 'image/png' },
            { src: current.coverUrl, sizes: '512x512', type: 'image/png' },
          ]
        : [],
    });
  }, [current]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
    const audio = audioRef.current;

    navigator.mediaSession.setActionHandler('play', () => {
      audio?.play().catch(() => {});
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      audio?.pause();
    });
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (audio && details.seekTime != null) {
        audio.currentTime = details.seekTime;
      }
    });
    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      if (audio) audio.currentTime = Math.max(0, audio.currentTime - (details.seekOffset ?? 10));
    });
    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      if (audio) audio.currentTime = Math.min(audio.duration || Infinity, audio.currentTime + (details.seekOffset ?? 10));
    });
    // These two are what make ⏭ / ⏮ appear on the lock screen / notification.
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      next();
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      previous();
    });

    return () => {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('seekto', null);
      navigator.mediaSession.setActionHandler('seekbackward', null);
      navigator.mediaSession.setActionHandler('seekforward', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
    };
  }, [next, previous]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

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
        playQueue,
        next,
        previous,
        hasNext: queueIndex + 1 < queue.length,
        hasPrevious: queueIndex > 0,
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
