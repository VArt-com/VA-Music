'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getOfflineAudioUrl } from '@/lib/offline/db';

// iOS Safari (in a plain tab or as a home-screen app) does not reliably keep
// the fg/bg audio-element handoff alive across a real screen lock — the
// handoff itself depends on a visibilitychange handler running at exactly
// the right moment, and iOS can suspend JS before that finishes. The only
// pattern that's actually proven reliable on iOS is: never route playback
// through the Web Audio graph at all, just play a single plain <audio>
// element from the start and lean on Media Session — the same thing Apple's
// own examples do. So on iOS we skip the graph/handoff entirely and always
// play straight out of audioRef. The tradeoff: the EQ has no audible effect
// on iPhone/iPad. Android and desktop keep the full EQ + fg/bg handoff.
function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

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
  playerBarHeight: number;
  setPlayerBarHeight: (height: number) => void;
  // Full-screen "Now Playing" view — opened by tapping the mini-player bar,
  // closed via its own close button. Kept in context (rather than local
  // component state) so any component can trigger it, e.g. a future
  // notification tap or deep link.
  fullscreenOpen: boolean;
  openFullscreen: () => void;
  closeFullscreen: () => void;
};

const PlayerContext = createContext<PlayerContextType | null>(null);

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used inside <PlayerProvider>');
  return ctx;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  // Foreground element: routed through the Web Audio graph for the EQ/visualizer.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Background element: plain, never touched by Web Audio — iOS keeps this
  // one playing through a lock screen the same way it would a native app,
  // because it isn't going through the graph iOS suspends on lock.
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const bgPrimedRef = useRef(false);

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
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

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

  // Warm the browser's HTTP cache for the neighbouring tracks in the queue.
  // Switching tracks always has to reset the <audio> element's src, which
  // briefly drops it out of "ready" state — that's what makes a lock-screen
  // widget (Android in particular) flicker off and back on around a track
  // change. If the next/previous file is already sitting in cache, the swap
  // resolves near-instantly instead of waiting on the network, which shrinks
  // that gap a lot even if it can't be removed completely from a website.
  const prefetchedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const neighbours = [queue[queueIndex + 1], queue[queueIndex - 1]].filter(
      (t): t is NowPlaying => Boolean(t)
    );
    neighbours.forEach((t) => {
      if (prefetchedRef.current.has(t.audioUrl)) return;
      prefetchedRef.current.add(t.audioUrl);
      fetch(t.audioUrl, { cache: 'force-cache' }).catch(() => {});
    });
  }, [queue, queueIndex]);

  // Retries a play() call a few times with a short delay instead of
  // silently giving up on the first rejection. This matters most while the
  // screen is locked: a play() call can fail transiently because the
  // network fetch for the new src hasn't resolved yet (mobile OS network
  // throttling while locked), not because playback is actually blocked —
  // one retry a moment later usually succeeds once the data has arrived.
  const attemptPlay = useCallback((audio: HTMLAudioElement, retriesLeft = 4) => {
    audio.play().catch(() => {
      if (retriesLeft > 0) {
        setTimeout(() => attemptPlay(audio, retriesLeft - 1), 500);
      }
    });
  }, []);

  const ensureGraph = useCallback(() => {
    if (isIOS() || audioCtxRef.current || !audioRef.current) return;
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

      audioCtx.addEventListener('statechange', () => {
        if (audioCtx.state === 'suspended' && audioRef.current && !audioRef.current.paused) {
          audioCtx.resume().catch(() => {});
        }
      });

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

  const advanceOnEnded = useCallback(() => {
    const q = queueRef.current;
    const i = queueIndexRef.current;
    if (i + 1 < q.length) {
      const idx = i + 1;
      setQueueIndex(idx);
      playTrack(q[idx]);
    } else {
      setIsPlaying(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Low-level: actually load + play a given track, without touching the
  // queue. Picks whichever <audio> element matches the current visibility —
  // the EQ'd one while the app is visible, the plain one while hidden/locked
  // — so this one function correctly handles both normal playback and
  // lock-screen next/previous/auto-advance.
  const playTrack = useCallback(
    async (track: NowPlaying) => {
      // If this track was downloaded for offline listening, play the local
      // copy stored in IndexedDB instead of hitting the network — this is
      // what makes playback actually work with no internet connection.
      let src = track.audioUrl;
      try {
        const offlineUrl = await getOfflineAudioUrl(track.id);
        if (offlineUrl) src = offlineUrl;
      } catch {
        // IndexedDB unavailable or lookup failed — fall back to the network URL.
      }

      if (isIOS()) {
        // No graph, no fg/bg swap — just the plain element, always. This is
        // the one thing that reliably survives a real iOS lock screen.
        const audio = audioRef.current;
        if (!audio) return;
        if (currentIdRef.current !== track.id || audio.src !== src) {
          audio.src = src;
          currentIdRef.current = track.id;
        }
        setCurrent(track);
        attemptPlay(audio);
        return;
      }

      const hidden = typeof document !== 'undefined' && document.hidden;
      const audio = hidden ? bgAudioRef.current : audioRef.current;
      const other = hidden ? audioRef.current : bgAudioRef.current;
      if (!audio) return;

      if (!hidden) {
        audio.crossOrigin = 'anonymous';
        ensureGraph();
        // "Prime" the background element once, inside this same user-gesture
        // call, so iOS allows it to autoplay later without a fresh gesture
        // when we hand off to it on screen lock.
        if (!bgPrimedRef.current && bgAudioRef.current) {
          const bg = bgAudioRef.current;
          bgPrimedRef.current = true;
          bg.muted = true;
          bg.play()
            .then(() => bg.pause())
            .catch(() => {})
            .finally(() => {
              bg.muted = false;
            });
        }
        if (audioCtxRef.current?.state === 'suspended') {
          try {
            await audioCtxRef.current.resume();
          } catch {
            // ignore — play() below still attempts native playback
          }
        }
      }

      if (currentIdRef.current !== track.id || audio.src !== src) {
        audio.src = src;
        currentIdRef.current = track.id;
      }
      setCurrent(track);
      attemptPlay(audio);
      if (other && !other.paused) other.pause();
    },
    [ensureGraph, attemptPlay]
  );

  const play = useCallback(
    (track: NowPlaying) => {
      setQueue([track]);
      setQueueIndex(0);
      playTrack(track);
    },
    [playTrack]
  );

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

  const getActiveAudio = useCallback(() => {
    if (isIOS()) return audioRef.current;
    return typeof document !== 'undefined' && document.hidden ? bgAudioRef.current : audioRef.current;
  }, []);

  const toggle = useCallback(async () => {
    const audio = getActiveAudio();
    if (!audio) return;
    if (audioCtxRef.current?.state === 'suspended') {
      try {
        await audioCtxRef.current.resume();
      } catch {
        // ignore
      }
    }
    if (audio.paused) attemptPlay(audio);
    else audio.pause();
  }, [getActiveAudio, attemptPlay]);

  const seek = useCallback((ratio: number) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    audio.currentTime = Math.min(Math.max(ratio, 0), 1) * audio.duration;
  }, []);

  const setVolume = useCallback((value: number) => {
    setVolumeState(value);
    if (audioRef.current) audioRef.current.volume = value;
    if (bgAudioRef.current) bgAudioRef.current.volume = value;
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

  const openFullscreen = useCallback(() => setFullscreenOpen(true), []);
  const closeFullscreen = useCallback(() => setFullscreenOpen(false), []);

  // Tells the OS-level Now Playing / Control Center widget where we are in
  // the current track (duration, position, playback rate), separate from
  // the metadata (title/artist/artwork) set below. Without this call, iOS
  // in particular sometimes falls back to a bare scrubber + generic ±10s
  // skip buttons instead of a proper track-aware widget with prev/next —
  // setPositionState is what tells it "this is a real, seekable track".
  const updatePositionState = useCallback((audio: HTMLAudioElement) => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    if (typeof navigator.mediaSession.setPositionState !== 'function') return;
    if (!audio.duration || !isFinite(audio.duration)) return;
    try {
      navigator.mediaSession.setPositionState({
        duration: audio.duration,
        playbackRate: audio.playbackRate || 1,
        position: Math.min(audio.currentTime, audio.duration),
      });
    } catch {
      // Can throw if called with a stale position right as the track swaps —
      // safe to ignore, the next timeupdate tick will correct it.
    }
  }, []);

  // Foreground element: drives all visible UI state (progress bar, play/pause
  // icon, duration) plus auto-advance when a track ends.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTime = () => {
      setProgress(audio.duration ? audio.currentTime / audio.duration : 0);
      updatePositionState(audio);
      // Belt-and-suspenders fix for "track is progressing but silent": the
      // <audio> element itself keeps decoding/advancing currentTime even
      // when the Web Audio graph it's routed through has its AudioContext
      // suspended — in that state you get a moving progress bar with zero
      // audible output, because all sound has to pass through the graph.
      // The context's own 'statechange' listener only fires when the state
      // actually flips, so if a resume() attempt around a lock/unlock ever
      // silently fails to stick, nothing else would ever retry it. Checking
      // here, on every timeupdate tick while audio is audibly progressing,
      // catches and self-heals that case within a second or so.
      const ctx = audioCtxRef.current;
      if (ctx && ctx.state === 'suspended' && !audio.paused) {
        ctx.resume().catch(() => {});
      }
    };
    const onLoaded = () => {
      setDuration(audio.duration || 0);
      updatePositionState(audio);
    };
    const onEnded = () => advanceOnEnded();
    // If the network stalls mid-load (common right as a phone comes back
    // from a lock/sleep state), the element can get stuck instead of ever
    // firing 'ended' or continuing — nudge it with a reload + retry rather
    // than leaving playback silently dead until the user notices.
    const onError = () => {
      if (!audio.src) return;
      const src = audio.src;
      audio.load();
      audio.src = src;
      attemptPlay(audio);
    };
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [advanceOnEnded, updatePositionState, attemptPlay]);

  // Background element: only needs to auto-advance to the next track when
  // one finishes while the screen is locked — nothing in the UI is visible
  // to update anyway. Also gets the same stall-recovery as the foreground
  // element, since this is the one actually carrying playback through a
  // real lock — a stalled fetch here is exactly what produces "stops by
  // itself" or "doesn't move to the next track" while the phone is locked.
  useEffect(() => {
    const bg = bgAudioRef.current;
    if (!bg) return;
    const onEnded = () => advanceOnEnded();
    const onError = () => {
      if (!bg.src) return;
      const src = bg.src;
      bg.load();
      bg.src = src;
      attemptPlay(bg);
    };
    bg.addEventListener('ended', onEnded);
    bg.addEventListener('error', onError);
    return () => {
      bg.removeEventListener('ended', onEnded);
      bg.removeEventListener('error', onError);
    };
  }, [advanceOnEnded, attemptPlay]);

  // The actual lock-screen fix: hand playback off between the two elements
  // as the page hides/shows, instead of trying to keep the Web Audio graph
  // alive through a lock (which iOS won't allow).
  useEffect(() => {
    if (typeof document === 'undefined' || isIOS()) return;

    const goBackground = () => {
      const fg = audioRef.current;
      const bg = bgAudioRef.current;
      if (!fg || !bg || fg.paused || !currentIdRef.current) return;
      bg.src = fg.src;
      bg.currentTime = fg.currentTime;
      bg.volume = fg.volume;
      fg.pause();
      attemptPlay(bg);
    };

    const goForeground = () => {
      const fg = audioRef.current;
      const bg = bgAudioRef.current;
      if (!fg || !bg || bg.paused) return;
      if (fg.src !== bg.src) {
        fg.src = bg.src;
      }
      fg.currentTime = bg.currentTime;
      bg.pause();
      audioCtxRef.current?.resume().catch(() => {});
      attemptPlay(fg);
    };

    const onVisibility = () => {
      if (document.hidden) goBackground();
      else goForeground();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pageshow', goForeground);
    window.addEventListener('focus', goForeground);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pageshow', goForeground);
      window.removeEventListener('focus', goForeground);
    };
  }, [attemptPlay]);

  // Media Session: metadata (title/artist/artwork) AND all action handlers
  // (play/pause/stop/seek/prev/next) are now set together, inside the same
  // effect, every time the track changes — not metadata in one effect and
  // handlers registered once at mount in another. iOS's Now Playing widget
  // has been unreliable about picking up prev/next buttons in this app
  // (tried across several previous rounds); re-registering everything in
  // lockstep with the track, right as playback starts, is a known mitigation
  // for that — some WebKit versions only build the full button set from a
  // action-handler snapshot taken close to when metadata last changed.
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    navigator.mediaSession.setActionHandler('play', () => {
      audioCtxRef.current?.resume().catch(() => {});
      const audio = getActiveAudio();
      if (audio) attemptPlay(audio);
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      getActiveAudio()?.pause();
    });
    navigator.mediaSession.setActionHandler('stop', () => {
      const audio = getActiveAudio();
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      const audio = getActiveAudio();
      if (audio && details.seekTime != null) {
        audio.currentTime = details.seekTime;
        updatePositionState(audio);
      }
    });
    // On iOS, registering seekbackward/seekforward alongside nexttrack/previoustrack
    // can cause the lock-screen Control Center to show the +/-10s seek buttons
    // instead of the track-skip buttons. Skip them on iOS so prev/next reliably show.
    if (!isIOS()) {
      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        const audio = getActiveAudio();
        if (audio) audio.currentTime = Math.max(0, audio.currentTime - (details.seekOffset ?? 10));
      });
      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        const audio = getActiveAudio();
        if (audio) audio.currentTime = Math.min(audio.duration || Infinity, audio.currentTime + (details.seekOffset ?? 10));
      });
    } else {
      navigator.mediaSession.setActionHandler('seekbackward', null);
      navigator.mediaSession.setActionHandler('seekforward', null);
    }
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      next();
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      previous();
    });

    if (current) {
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
      // Refresh the position state right away on every track change too —
      // not just on timeupdate/loadedmetadata — so the lock-screen widget
      // doesn't briefly show stale duration/position from the previous track.
      const audio = getActiveAudio();
      if (audio) updatePositionState(audio);
    }

    return () => {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('stop', null);
      navigator.mediaSession.setActionHandler('seekto', null);
      navigator.mediaSession.setActionHandler('seekbackward', null);
      navigator.mediaSession.setActionHandler('seekforward', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
    };
  }, [current, next, previous, getActiveAudio, updatePositionState, attemptPlay]);

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
        fullscreenOpen,
        openFullscreen,
        closeFullscreen,
      }}
    >
      {children}
      <audio ref={audioRef} preload="metadata" />
      <audio ref={bgAudioRef} preload="none" />
    </PlayerContext.Provider>
  );
}
