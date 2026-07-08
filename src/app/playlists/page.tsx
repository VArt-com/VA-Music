import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { Playlist } from '@/lib/types';

export default async function PlaylistsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: playlists } = await supabase
    .from('playlists')
    .select('*, profiles(*)')
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Плейлисты</h1>
        {user && (
          <Link href="/playlists/new" className="text-sm bg-pink-500 hover:bg-pink-400 rounded-full px-3 py-1">
            + Новый плейлист
          </Link>
        )}
      </div>
      <div className="space-y-3">
        {(playlists as Playlist[] | null)?.map((p) => (
          <Link
            key={p.id}
            href={`/playlists/${p.id}`}
            className="block border border-white/10 rounded-xl p-4 bg-white/5 hover:bg-white/10"
          >
            <div className="font-semibold">{p.name}</div>
            <div className="text-sm text-white/60">{p.profiles?.display_name || p.profiles?.username}</div>
          </Link>
        ))}
        {(!playlists || playlists.length === 0) && <p className="text-white/50">Пока нет плейлистов.</p>}
      </div>
    </main>
  );
}
