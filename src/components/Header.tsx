import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const kofi = process.env.NEXT_PUBLIC_KOFI_URL || 'https://ko-fi.com/varthur';

  return (
    <header className="border-b border-white/10">
      <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-4">
        <Link href="/" className="font-bold text-lg tracking-tight">
          🎵 MusicHub
        </Link>
        <nav className="flex items-center gap-4 text-sm flex-wrap">
          <Link href="/" className="hover:text-pink-400">
            Треки
          </Link>
          <Link href="/playlists" className="hover:text-pink-400">
            Плейлисты
          </Link>
          {user ? (
            <>
              <Link href="/upload" className="hover:text-pink-400">
                Загрузить
              </Link>
              <Link href={`/artist/${user.id}`} className="hover:text-pink-400">
                Мой профиль
              </Link>
              <form action="/auth/signout" method="post">
                <button className="hover:text-pink-400">Выйти</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-pink-400">
                Войти
              </Link>
              <Link href="/register" className="hover:text-pink-400">
                Регистрация
              </Link>
            </>
          )}
          <a
            href={kofi}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-pink-500 hover:bg-pink-400 text-white rounded-full px-3 py-1 font-medium"
          >
            Донат
          </a>
        </nav>
      </div>
    </header>
  );
}
