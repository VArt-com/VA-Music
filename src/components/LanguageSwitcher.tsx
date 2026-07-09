'use client';

import { LOCALES, LOCALE_LABELS } from '@/lib/i18n/config';
import { useI18n } from '@/lib/i18n/I18nProvider';

const SHORT_LABELS: Record<string, string> = { ru: 'RU', en: 'EN', he: 'HE', ar: 'AR' };

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex items-center gap-1 text-xs">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          title={LOCALE_LABELS[l]}
          aria-current={l === locale}
          className={`px-2 py-1 rounded-full border transition ${
            l === locale
              ? 'border-fuchsia-400/60 text-fuchsia-300 bg-fuchsia-500/10'
              : 'border-white/10 text-white/50 hover:text-fuchsia-300 hover:border-fuchsia-400/40'
          }`}
        >
          {SHORT_LABELS[l]}
        </button>
      ))}
    </div>
  );
}
