'use client';

import { useEffect, useRef, useState } from 'react';
import { usePlayer } from '@/lib/player/PlayerContext';

const BAR_COUNT = 24;
const BAR_ANGLES = Array.from({ length: BAR_COUNT }, (_, i) => (360 / BAR_COUNT) * i);
const SPARKLE_COUNT = 8;
const SPARKLES = Array.from({ length: SPARKLE_COUNT }, (_, i) => ({
  top: `${8 + ((i * 37) % 84)}%`,
  left: `${8 + ((i * 53) % 84)}%`,
  size: 2 + (i % 3),
  delay: `${(i * 0.35).toFixed(2)}s`,
  hue: (i * 47) % 360,
}));

type OrbHandles = {
  wrapRef: (el: HTMLDivElement | null) => void;
  barRef: (i: number, el: HTMLDivElement | null) => void;
  coreRef: (el: HTMLDivElement | null) => void;
  haloRef: (el: HTMLDivElement | null) => void;
  isPlaying: boolean;
};

/** One colourful "prism orb": radiating rainbow bars + rotating rainbow core
 * + soft multi-colour halo + twinkling sparkles. Rendered identically on
 * both sides (the right one is horizontally mirrored) so they always look
 * the same, per design. */
function PrismOrb({ wrapRef, barRef, coreRef, haloRef, isPlaying }: OrbHandles) {
  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      <div ref={haloRef} className="absolute w-48 h-48 rounded-full blur-2xl opacity-50" style={{
        background:
          'radial-gradient(circle, rgba(244,114,182,0.55), rgba(96,165,250,0.4) 45%, rgba(45,212,191,0.3) 70%, transparent 85%)',
      }} />

      <div ref={wrapRef} className="relative w-40 h-40">
        {BAR_ANGLES.map((angle, i) => (
          <div key={i} className="absolute left-1/2 top-1/2" style={{ transform: `rotate(${angle}deg)` }}>
            <div
              ref={(el) => barRef(i, el)}
              className={`w-[3px] h-7 rounded-full origin-bottom ${isPlaying ? '' : 'animate-orb-idle'}`}
              style={{
                marginTop: '-72px',
                animationDelay: `${(i % 8) * 0.12}s`,
                background: `linear-gradient(to top, hsl(${angle}, 90%, 62%), hsla(${angle}, 90%, 75%, 0))`,
                boxShadow: `0 0 6px hsla(${angle}, 90%, 60%, 0.75)`,
              }}
            />
          </div>
        ))}
      </div>

      <div
        ref={coreRef}
        className={`absolute w-11 h-11 rounded-full animate-spin-slow ${isPlaying ? '' : 'animate-core-idle'}`}
        style={{
          background: 'conic-gradient(from 0deg, #f472b6, #facc15, #4ade80, #38bdf8, #a78bfa, #f472b6)',
          filter: 'blur(0.5px)',
        }}
      />
      <div
        className="absolute w-5 h-5 rounded-full bg-white/90"
        style={{ filter: 'blur(1.5px)', boxShadow: '0 0 12px rgba(255,255,255,0.9)' }}
      />

      {SPARKLES.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-twinkle"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            backgroundColor: `hsl(${s.hue}, 95%, 75%)`,
            boxShadow: `0 0 4px hsl(${s.hue}, 95%, 70%)`,
            animationDelay: s.delay,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Decorative side ambient visuals: an identical colourful "prism orb" on
 * both the far left and far right (the right one is a pure horizontal
 * mirror of the left, same size/colours/structure). Purely decorative
 * (pointer-events: none) and only shown on wide screens (xl+, 1280px+)
 * where there's empty margin next to the centered page content — the orbs
 * sit well inside that margin so nothing is ever covered or blocked.
 *
 * When a track is actually playing, every bar/core is driven frame-by-frame
 * from the real Web Audio AnalyserNode (same data source as the PlayerBar
 * visualizer/equalizer) rather than a canned CSS loop. When idle, everything
 * falls back to a gentle CSS breathing animation.
 */
export default function AmbientVisualizer() {
  const { analyser, isPlaying } = usePlayer();

  // The orbs render with `hidden xl:block` below, so on anything narrower
  // than 1280px (i.e. basically every phone and most tablets) they were
  // never visible at all — but the requestAnimationFrame loop used to run
  // regardless, forever, on every single page, just to update transforms on
  // elements nobody could see. That's exactly the kind of constant
  // background main-thread work that makes buttons feel slow to respond and
  // pages feel sluggish, especially on phones. This flag gates the loop so
  // it only ever runs when the orbs can actually be seen.
  const [wideEnough, setWideEnough] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1280px)');
    setWideEnough(mql.matches);
    const onChange = () => setWideEnough(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const leftBarRefs = useRef<(HTMLDivElement | null)[]>([]);
  const leftCoreRef = useRef<HTMLDivElement | null>(null);
  const leftWrapRef = useRef<HTMLDivElement | null>(null);
  const leftHaloRef = useRef<HTMLDivElement | null>(null);

  const rightBarRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rightCoreRef = useRef<HTMLDivElement | null>(null);
  const rightWrapRef = useRef<HTMLDivElement | null>(null);
  const rightHaloRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!wideEnough) return;

    let raf = 0;
    const data = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;
    let rotationLeft = 0;
    let rotationRight = 0;

    const draw = () => {
      raf = requestAnimationFrame(draw);

      if (analyser && data && isPlaying) {
        analyser.getByteFrequencyData(data);
        let bassSum = 0;
        for (let i = 0; i < BAR_COUNT; i++) {
          const idx = Math.floor((i / BAR_COUNT) * data.length);
          const magnitude = data[idx] / 255;
          if (i < 6) bassSum += magnitude;

          const scale = `scaleY(${0.35 + magnitude * 1.2})`;
          const leftBar = leftBarRefs.current[i];
          if (leftBar) leftBar.style.transform = scale;
          const rightBar = rightBarRefs.current[i];
          if (rightBar) rightBar.style.transform = scale;
        }
        const bassEnergy = bassSum / 6;
        const coreScale = `scale(${0.9 + bassEnergy * 0.6})`;
        const coreOpacity = String(0.58 + bassEnergy * 0.42);
        if (leftCoreRef.current) {
          leftCoreRef.current.style.transform = coreScale;
          leftCoreRef.current.style.opacity = coreOpacity;
        }
        if (rightCoreRef.current) {
          rightCoreRef.current.style.transform = coreScale;
          rightCoreRef.current.style.opacity = coreOpacity;
        }
        const haloScale = `scale(${1 + bassEnergy * 0.5})`;
        const haloOpacity = String(0.4 + bassEnergy * 0.5);
        if (leftHaloRef.current) {
          leftHaloRef.current.style.transform = haloScale;
          leftHaloRef.current.style.opacity = haloOpacity;
        }
        if (rightHaloRef.current) {
          rightHaloRef.current.style.transform = haloScale;
          rightHaloRef.current.style.opacity = haloOpacity;
        }

        rotationLeft += 0.4 + bassEnergy * 1.3;
        rotationRight += 0.4 + bassEnergy * 1.3;
      } else {
        rotationLeft += 0.08;
        rotationRight += 0.08;
      }
      if (leftWrapRef.current) leftWrapRef.current.style.transform = `rotate(${rotationLeft}deg)`;
      if (rightWrapRef.current) rightWrapRef.current.style.transform = `rotate(${rotationRight}deg)`;
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, [analyser, isPlaying, wideEnough]);

  return (
    <>
      {/* Left margin */}
      <div
        className="hidden xl:block fixed left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10"
        aria-hidden="true"
      >
        <PrismOrb
          wrapRef={(el) => (leftWrapRef.current = el)}
          barRef={(i, el) => (leftBarRefs.current[i] = el)}
          coreRef={(el) => (leftCoreRef.current = el)}
          haloRef={(el) => (leftHaloRef.current = el)}
          isPlaying={isPlaying}
        />
      </div>

      {/* Right margin — exact mirror of the left one */}
      <div
        className="hidden xl:block fixed right-4 top-1/2 -translate-y-1/2 pointer-events-none z-10 scale-x-[-1]"
        aria-hidden="true"
      >
        <PrismOrb
          wrapRef={(el) => (rightWrapRef.current = el)}
          barRef={(i, el) => (rightBarRefs.current[i] = el)}
          coreRef={(el) => (rightCoreRef.current = el)}
          haloRef={(el) => (rightHaloRef.current = el)}
          isPlaying={isPlaying}
        />
      </div>
    </>
  );
}
