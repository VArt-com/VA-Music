export const LOCALES = ['ru', 'en', 'he', 'ar'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'ru';

export const RTL_LOCALES: Locale[] = ['he', 'ar'];

export function isRtl(locale: Locale) {
  return RTL_LOCALES.includes(locale);
}

export const LOCALE_LABELS: Record<Locale, string> = {
  ru: 'Русский',
  en: 'English',
  he: 'עברית',
  ar: 'العربية',
};

export const LOCALE_COOKIE = 'mw_locale';

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}
