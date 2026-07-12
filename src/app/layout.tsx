import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PlayerBar from '@/components/PlayerBar';
import PlayerBarSpacer from '@/components/PlayerBarSpacer';
import AmbientVisualizer from '@/components/AmbientVisualizer';
import CreatorBadge from '@/components/CreatorBadge';
import { PlayerProvider } from '@/lib/player/PlayerContext';
import { I18nProvider } from '@/lib/i18n/I18nProvider';
import { getLocale } from '@/lib/i18n/server';
import { dictionaries } from '@/lib/i18n/dictionaries';
import { isRtl } from '@/lib/i18n/config';

export const metadata: Metadata = {
  title: 'Music World — бесплатная музыка от независимых артистов',
  description: 'Загружай, слушай и скачивай музыку бесплатно. Поддержи артистов донатом.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Music World',
  },
};

export const viewport: Viewport = {
  themeColor: '#7c3aed',
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
            <CreatorBadge />
            <Header />
            {children}
            <Footer />
            <PlayerBarSpacer />
            <PlayerBar />
          </PlayerProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
