import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getDictionary } from '@/lib/i18n/server';
import LanguageSwitcher from './LanguageSwitcher';
import WhatsAppIcon from './WhatsAppIcon';
import InstallAppButton from './InstallAppButton';

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const kofi = process.env.NEXT_PUBLIC_KOFI_URL || 'https://ko-fi.com/varthur';
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const t = await getDictionary();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/60 backdrop-blur-xl">
      <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-4">
        <Link href="/" className="font-extrabold text-lg tracking-tight neon-text">
          🎵 {t.brand.name}
        </Link>
        <nav className="flex items-center gap-4 text-sm flex-wrap">
          <Link href="/" className="text-white/80 hover:text-fuchsia-300 transition">
            {t.nav.tracks}
          </Link>
          <Link href="/videos" className="text-white/80 hover:text-fuchsia-300 transition">
            {t.nav.videos}
          </Link>
          <Link href="/playlists" className="text-white/80 hover:text-fuchsia-300 transition">
            {t.nav.playlists}
          </Link>
          <Link href="/mixer" className="text-white/80 hover:text-fuchsia-300 transition">
            {t.nav.mixer}
          </Link>
          {user ? (
            <>
              <Link href="/upload" className="text-white/80 hover:text-fuchsia-300 transition">
                {t.nav.upload}
              </Link>
              <Link href={`/artist/${user.id}`} className="text-white/80 hover:text-fuchsia-300 transition">
                {t.nav.myProfile}
              </Link>
              <form action="/auth/signout" method="post">
                <button className="text-white/80 hover:text-fuchsia-300 transition">{t.nav.logout}</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-white/80 hover:text-fuchsia-300 transition">
                {t.nav.login}
              </Link>
              <Link href="/register" className="text-white/80 hover:text-fuchsia-300 transition">
                {t.nav.register}
              </Link>
            </>
          )}
          {whatsappNumber && (
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 hover:text-emerald-400 transition"
              title={t.nav.whatsapp}
            >
              <WhatsAppIcon className="w-5 h-5" />
            </a>
          )}
          <a
            href={kofi}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-neon rounded-full px-3 py-1.5 text-xs sm:text-sm"
          >
            ☕ {t.nav.donate}
          </a>
          <InstallAppButton label={t.nav.installApp} iosTip={t.nav.installIosTip} />
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  );
}
