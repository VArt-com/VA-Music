'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/lib/i18n/I18nProvider';

type TabName = 'home' | 'videos' | 'playlists' | 'mixer' | 'offline';

function TabIcon({ name, active }: { name: TabName; active: boolean }) {
  const stroke = active ? 2.2 : 1.7;
  switch (name) {
    case 'home':
      return (
        <svg
          viewBox="0 0 24 24"
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 11.5 12 4l8 7.5" />
          <path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" />
        </svg>
      );
    case 'videos':
      return (
        <svg
          viewBox="0 0 24 24"
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="5" width="18" height="14" rx="2.5" />
          <path d="M10 9.3v5.4l5-2.7-5-2.7Z" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'playlists':
      return (
        <svg
          viewBox="0 0 24 24"
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="14" y2="12" />
          <line x1="4" y1="18" x2="10" y2="18" />
        </svg>
      );
    case 'mixer':
      return (
        <svg
          viewBox="0 0 24 24"
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="5" y1="19" x2="5" y2="10" />
          <line x1="12" y1="19" x2="12" y2="5" />
          <line x1="19" y1="19" x2="19" y2="13" />
        </svg>
      );
    case 'offline':
      return (
        <svg
          viewBox="0 0 24 24"
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 4v10" />
          <path d="M8 10l4 4 4-4" />
          <path d="M5 18h14" />
        </svg>
      );
  }
}

// Spotify-style fixed bottom tab bar for mobile. Hidden on sm+ screens,
// where the full Header nav is already visible and a second nav layer
// would be redundant. Sits below PlayerBar (the mini player), so the
// stacking order on a phone matches Spotify: content, then mini player,
// then tab bar, bottom to top.
export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  const items: { href: string; label: string; icon: TabName }[] = [
    { href: '/', label: t.nav.tracks, icon: 'home' },
    { href: '/videos', label: t.nav.videos, icon: 'videos' },
    { href: '/playlists', label: t.nav.playlists, icon: 'playlists' },
    { href: '/mixer', label: t.nav.mixer, icon: 'mixer' },
    { href: '/offline', label: t.nav.offline, icon: 'offline' },
  ];

  return (
    <nav
      className="sm:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/10 bg-black/85 backdrop-blur-xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="h-16 flex items-stretch justify-around">
        {items.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex h-full flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition ${
                  active ? 'text-fuchsia-300' : 'text-white/50 hover:text-white/80'
                }`}
              >
                <TabIcon name={item.icon} active={active} />
                <span className="truncate max-w-[64px]">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
