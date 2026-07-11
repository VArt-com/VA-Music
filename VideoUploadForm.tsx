'use client';

import { usePlayer } from '@/lib/player/PlayerContext';
import { useI18n } from '@/lib/i18n/I18nProvider';

const PRESET_KEYS = ['flat', 'rock', 'pop', 'electronic', 'vocal', 'bassBoost'] as const;
const BAND_KEYS = ['bass', 'mid', 'treble'] as const;

export default function Equalizer() {
  const { eq, setEq, applyPreset } = usePlayer();
  const { t } = useI18n();

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 mb-2">
      <div className="flex flex-wrap gap-2 mb-4">
        {PRESET_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => applyPreset(key)}
            className="text-xs px-3 py-1 rounded-full bg-white/5 hover:bg-fuchsia-500/20 border border-white/10 hover:border-fuchsia-400/40 transition"
          >
            {t.equalizer.presets[key]}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {BAND_KEYS.map((band) => (
          <div key={band} className="flex flex-col items-center gap-1">
            <input
              type="range"
              min={-12}
              max={12}
              step={1}
              value={eq[band]}
              onChange={(e) => setEq({ [band]: parseFloat(e.target.value) })}
              className="h-24 accent-fuchsia-500"
              style={{ writingMode: 'vertical-lr' as React.CSSProperties['writingMode'], direction: 'rtl' }}
            />
            <span className="text-xs text-white/60">{t.equalizer.bands[band]}</span>
            <span className="text-[11px] text-white/40">
              {eq[band] > 0 ? `+${eq[band]}` : eq[band]} dB
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
