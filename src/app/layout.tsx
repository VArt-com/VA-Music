import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PlayerBar from '@/components/PlayerBar';
import AmbientVisualizer from '@/components/AmbientVisualizer';
import { PlayerProvider } from '@/lib/player/PlayerContext';
import { I18nProvider } from '@/lib/i18n/I18nProvider';
import { getLocale } from '@/lib/i18n/server';
import { dictionaries } from '@/lib/i18n/dictionaries';
import { isRtl } from '@/lib/i18n/config';

export const metadata: Metadata = {
  title: 'Music World — бесплатная музыка от независимых артистов',
  description: 'Загружай, слушай и скачивай музыку бесплатно. Поддержи артистов донатом.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const dict = dictionaries[locale];
  const dir = isRtl(locale) ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir}>
      <body>
        <I18nProvider locale={locale} dict={dict} dictionaries={dictionaries}>
          <PlayerProvider>
            <AmbientVisualizer />
            <Header />
            {children}
            <Footer />
            <PlayerBar />
          </PlayerProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
