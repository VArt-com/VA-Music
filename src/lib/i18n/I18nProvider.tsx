'use client';

import { createContext, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LOCALE_COOKIE, isRtl, type Locale } from './config';
import type { Dictionary } from './dictionaries';

type I18nContextType = {
  locale: Locale;
  t: Dictionary;
  dir: 'ltr' | 'rtl';
  setLocale: (locale: Locale) => void;
};

const I18nContext = createContext<I18nContextType | null>(null);

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}

export function I18nProvider({
  locale: initialLocale,
  dict,
  dictionaries,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  dictionaries: Record<Locale, Dictionary>;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState(initialLocale);
  const [t, setT] = useState(dict);
  const router = useRouter();

  const setLocale = (next: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`;
    setLocaleState(next);
    setT(dictionaries[next]);
    router.refresh();
  };

  return (
    <I18nContext.Provider value={{ locale, t, dir: isRtl(locale) ? 'rtl' : 'ltr', setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}
