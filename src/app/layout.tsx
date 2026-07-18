import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PlayerBar from '@/components/PlayerBar';
import PlayerBarSpacer from '@/components/PlayerBarSpacer';
import FullscreenPlayer from '@/components/FullscreenPlayer';
import BottomNav from '@/components/BottomNav';
import AmbientVisualizer from '@/components/AmbientVisualizer';
import { PlayerProvider } from '@/lib/player/PlayerContext';
import { I18nProvider } from '@/lib/i18n/I18nProvider';
import { getLocale } from '@/lib/i18n/server';
import { dictionaries } from '@/lib/i18n/dictionaries';
import { isRtl } from '@/lib/i18n/config';

export const metadata: Metadata = {
  title: 'Music World — бесплатная музыка от независимых артистов',
  description: 'Загружай, слушай и скачивай музыку бесплатно. Поддержи артистов донатом.',
  // Without this, the browser never links public/manifest.json into the
  // page at all (Next's Metadata API doesn't do it automatically) — Android
  // Chrome then has no manifest to read icons/name/display-mode from, so
  // "Add to Home Screen" falls back to a generic bookmark icon instead of
  // the app icon, and never treats the site as an installable PWA.
  manifest: '/manifest.json',
  // This is what actually makes iOS launch the home-screen icon as a
  // standalone full-screen app (no Safari/Chrome address bar or browser
  // chrome) instead of just opening a normal browser tab at the saved URL.
  // Without `capable: true` here, the site can look right and even show an
  // icon, but iOS still treats it as a bookmark — which is also why OS-level
  // features tied to "this is a real installed app" (Media Session lock
  // screen integration, notification tap routing back to this exact app
  // rather than "whichever tab Chrome last had open") are unreliable.
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Music World',
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

// Locks the layout to the phone's own screen instead of behaving like a
// regular pannable/zoomable webpage: no pinch-zoom, no double-tap zoom, and
// (via viewportFit: 'cover' + the safe-area-inset padding already used
// elsewhere) it fills right out to the edges on notched phones instead of
// leaving letterboxed bars. This is what turns "a website that happens to
// scroll" into something that feels fixed/native on the device it's
// installed on.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#7c3aed',
};

// Spotify/Apple Music/YouTube Music all lean on a clean, bold grotesque
// sans-serif rather than the browser's default system font — Inter is the
// closest well-supported equivalent. Self-hosted by Next.js at build time
// (no runtime request to Google Fonts), exposed as a CSS variable so
// globals.css can apply it site-wide with a sensible fallback stack for
// Hebrew/Arabic locales, which Inter doesn't cover.
const inter = Inter({ subsets: ['latin', 'cyrillic'], display: 'swap', variable: '--font-inter' });

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const dict = dictionaries[locale];
  const dir = isRtl(locale) ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} className={inter.variable}>
      <body>
        <I18nProvider locale={locale} dict={dict} dictionaries={dictionaries}>
          <PlayerProvider>
            <AmbientVisualizer />
            <Header />
            {children}
            <Footer />
            <PlayerBarSpacer />
            <PlayerBar />
            <FullscreenPlayer />
            <BottomNav />
          </PlayerProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
