'use client';

import { useEffect, useRef } from 'react';

export default function Visualizer({
  analyser,
  playing,
  className,
}: {
  analyser: AnalyserNode | null;
  playing: boolean;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const barCount = 28;
    const data = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;

    const draw = () => {
      raf = requestAnimationFrame(draw);
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      const barWidth = width / barCount;

      if (analyser && data) {
        analyser.getByteFrequencyData(data);
      }

      for (let i = 0; i < barCount; i++) {
        let magnitude: number;
        if (analyser && data && playing) {
          const idx = Math.floor((i / barCount) * data.length);
          magnitude = data[idx] / 255;
        } else {
          // idle shimmer so the bar still feels alive before playback starts
          magnitude = 0.08 + Math.sin(Date.now() / 400 + i) * 0.03;
        }
        const barHeight = Math.max(2, magnitude * height);
        const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
        gradient.addColorStop(0, '#d946ef');
        gradient.addColorStop(1, '#818cf8');
        ctx.fillStyle = gradient;
        const x = i * barWidth;
        ctx.fillRect(x + 1, height - barHeight, Math.max(1, barWidth - 2), barHeight);
      }
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, [analyser, playing]);

  return <canvas ref={canvasRef} width={220} height={40} className={className ?? 'w-full h-10'} />;
}
