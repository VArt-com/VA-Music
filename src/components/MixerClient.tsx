'use client';

import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/lib/i18n/I18nProvider';
import type { Dictionary } from '@/lib/i18n/dictionaries';

export type MixerTrackOption = {
  id: string;
  title: string;
  artist: string;
  url: string;
};

export default function MixerClient({ tracks }: { tracks: MixerTrackOption[] }) {
  const { t } = useI18n();
  const [trackAId, setTrackAId] = useState('');
  const [trackBId, setTrackBId] = useState('');
  const [crossfade, setCrossfade] = useState(50); // 0 = deck A, 100 = deck B
  const [playingA, setPlayingA] = useState(false);
  const [playingB, setPlayingB] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mixUrl, setMixUrl] = useState<string | null>(null);
  const [audioReady, setAudioReady] = useState(false);

  const audioARef = useRef<HTMLAudioElement | null>(null);
  const audioBRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainARef = useRef<GainNode | null>(null);
  const gainBRef = useRef<GainNode | null>(null);
  const destRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const initedRef = useRef(false);

  const trackA = tracks.find((tr) => tr.id === trackAId);
  const trackB = tracks.find((tr) => tr.id === trackBId);

  const applyCrossfade = (value: number, gA?: GainNode | null, gB?: GainNode | null) => {
    const gainA = gA ?? gainARef.current;
    const gainB = gB ?? gainBRef.current;
    const pos = value / 100;
    const angle = pos * (Math.PI / 2);
    if (gainA) gainA.gain.value = Math.cos(angle);
    if (gainB) gainB.gain.value = Math.sin(angle);
  };

  const ensureGraph = () => {
    if (initedRef.current) return;
    if (!audioARef.current || !audioBRef.current) return;
    try {
      const AudioContextCtor: typeof AudioContext =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextCtor();
      const sourceA = ctx.createMediaElementSource(audioARef.current);
      const sourceB = ctx.createMediaElementSource(audioBRef.current);
      const gainA = ctx.createGain();
      const gainB = ctx.createGain();
      const dest = ctx.createMediaStreamDestination();

      sourceA.connect(gainA);
      sourceB.connect(gainB);
      gainA.connect(ctx.destination);
      gainB.connect(ctx.destination);
      gainA.connect(dest);
      gainB.connect(dest);

      audioCtxRef.current = ctx;
      gainARef.current = gainA;
      gainBRef.current = gainB;
      destRef.current = dest;
      initedRef.current = true;
      setAudioReady(true);
      applyCrossfade(crossfade, gainA, gainB);
    } catch {
      // Web Audio unsupported — decks will still play natively but mixing/recording is disabled
    }
  };

  useEffect(() => {
    applyCrossfade(crossfade);
  }, [crossfade]);

  useEffect(() => {
    const a = audioARef.current;
    const b = audioBRef.current;
    const onPlayA = () => setPlayingA(true);
    const onPauseA = () => setPlayingA(false);
    const onPlayB = () => setPlayingB(true);
    const onPauseB = () => setPlayingB(false);
    a?.addEventListener('play', onPlayA);
    a?.addEventListener('pause', onPauseA);
    a?.addEventListener('ended', onPauseA);
    b?.addEventListener('play', onPlayB);
    b?.addEventListener('pause', onPauseB);
    b?.addEventListener('ended', onPauseB);
    return () => {
      a?.removeEventListener('play', onPlayA);
      a?.removeEventListener('pause', onPauseA);
      a?.removeEventListener('ended', onPauseA);
      b?.removeEventListener('play', onPlayB);
      b?.removeEventListener('pause', onPauseB);
      b?.removeEventListener('ended', onPauseB);
    };
  }, []);

  const togglePlay = (deck: 'A' | 'B') => {
    ensureGraph();
    if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
    const audio = deck === 'A' ? audioARef.current : audioBRef.current;
    if (!audio) return;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  };

  const startRecording = () => {
    ensureGraph();
    if (!destRef.current) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(destRef.current.stream);
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      setMixUrl(URL.createObjectURL(blob));
    };
    recorder.start();
    recorderRef.current = recorder;
    setRecording(true);
    setMixUrl(null);
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <Deck
          label={t.mixer.deckA}
          t={t}
          tracks={tracks}
          value={trackAId}
          onChange={setTrackAId}
          playing={playingA}
          onToggle={() => togglePlay('A')}
        />
        <Deck
          label={t.mixer.deckB}
          t={t}
          tracks={tracks}
          value={trackBId}
          onChange={setTrackBId}
          playing={playingB}
          onToggle={() => togglePlay('B')}
        />
      </div>

      <div className="glass-card rounded-2xl p-4">
        <label className="block text-sm text-white/60 mb-2">{t.mixer.crossfader}</label>
        <input
          type="range"
          min={0}
          max={100}
          value={crossfade}
          onChange={(e) => setCrossfade(parseInt(e.target.value, 10))}
          className="w-full accent-fuchsia-500"
        />
        <div className="flex justify-between text-xs text-white/40 mt-1">
          <span>{t.mixer.deckA}</span>
          <span>{t.mixer.deckB}</span>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-4 flex flex-wrap items-center gap-4">
        {!recording ? (
          <button
            type="button"
            onClick={startRecording}
            disabled={!trackA || !trackB}
            className="btn-neon px-4 py-2 rounded-full text-sm disabled:opacity-40"
          >
            ● {t.mixer.recordMix}
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="bg-red-500 hover:bg-red-400 transition px-4 py-2 rounded-full text-sm text-white"
          >
            ■ {t.mixer.stopRecording}
          </button>
        )}
        {mixUrl && (
          <a
            href={mixUrl}
            download="my-mix.webm"
            className="text-sm bg-white/10 hover:bg-fuchsia-500/20 border border-white/10 hover:border-fuchsia-400/40 rounded-full px-4 py-2 transition"
          >
            ⬇ {t.mixer.downloadMix}
          </a>
        )}
        <p className="text-xs text-white/40 w-full">
          {t.mixer.recordingNotice}
          {!audioReady && t.mixer.webAudioUnsupported}
        </p>
      </div>

      <audio ref={audioARef} src={trackA?.url} crossOrigin="anonymous" preload="metadata" className="hidden" />
      <audio ref={audioBRef} src={trackB?.url} crossOrigin="anonymous" preload="metadata" className="hidden" />
    </div>
  );
}

function Deck({
  label,
  t,
  tracks,
  value,
  onChange,
  playing,
  onToggle,
}: {
  label: string;
  t: Dictionary;
  tracks: MixerTrackOption[];
  value: string;
  onChange: (id: string) => void;
  playing: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="text-sm text-white/60 mb-2">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 mb-3 outline-none focus:border-fuchsia-400 transition"
      >
        <option value="">{t.mixer.selectTrack}</option>
        {tracks.map((tr) => (
          <option key={tr.id} value={tr.id}>
            {tr.title} — {tr.artist}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={onToggle}
        disabled={!value}
        className="w-full bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:brightness-110 transition disabled:opacity-40 rounded-lg py-2 font-medium text-white"
      >
        {playing ? `❚❚ ${t.mixer.pause}` : `▶ ${t.mixer.play}`}
      </button>
    </div>
  );
}
