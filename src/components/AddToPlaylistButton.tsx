'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n/I18nProvider';

type PlaylistOption = { id: string; name: string };
type Status = 'idle' | 'adding' | 'added' | 'error';

export default function AddToPlaylistButton({
  trackId,
  userId,
}: {
  trackId: string;
  userId: string | null;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [playlists, setPlaylists] = useState<PlaylistOption[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !userId || playlists) return;
    setLoading(true);
    const supabase = createClient();
    supabase
      .from('playlists')
      .select('id, name')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setPlaylists((data as PlaylistOption[] | null) ?? []);
        setLoading(false);
      });
  }, [open, userId, playlists]);

  const reposition = () => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    const menuWidth = 224; // w-56
    setPos({
      top: rect.bottom + 8,
      left: Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8)),
    });
  };

  useEffect(() => {
    if (!open) return;
    reposition();
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!userId) return null;

  const handleAdd = async (playlistId: string) => {
    setStatus((s) => ({ ...s, [playlistId]: 'adding' }));
    const supabase = createClient();
    const { count } = await supabase
      .from('playlist_tracks')
      .select('*', { count: 'exact', head: true })
      .eq('playlist_id', playlistId);
    const { error } = await supabase
      .from('playlist_tracks')
      .insert({ playlist_id: playlistId, track_id: trackId, position: (count ?? 0) + 1 });
    setStatus((s) => ({ ...s, [playlistId]: error ? 'error' : 'added' }));
  };

  return (
    <div className="relative inline-block">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-xs bg-white/10 hover:bg-fuchsia-500/20 border border-white/10 hover:border-fuchsia-400/40 rounded-full px-3 py-1.5 whitespace-nowrap transition"
        aria-label={t.common.addToPlaylist}
        title={t.common.addToPlaylist}
      >
        ➕
      </button>
      {open &&
        mounted &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)} />
            <div
              className="fixed z-[101] w-56 rounded-xl border border-white/10 bg-black/90 backdrop-blur-xl p-2 shadow-neon space-y-0.5 max-h-72 overflow-y-auto"
              style={{ top: pos.top, left: pos.left }}
            >
              <div className="px-3 py-1.5 text-xs text-white/40 uppercase tracking-wide">
                {t.common.addToPlaylist}
              </div>
              {loading && <div className="px-3 py-2 text-sm text-white/50">…</div>}
              {!loading && playlists?.length === 0 && (
                <Link
                  href="/playlists/new"
                  className="block px-3 py-2 rounded-lg text-sm hover:bg-white/10 transition text-fuchsia-300"
                  onClick={() => setOpen(false)}
                >
                  + {t.playlists.newPlaylist}
                </Link>
              )}
              {playlists?.map((p) => {
                const st = status[p.id] ?? 'idle';
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleAdd(p.id)}
                    disabled={st === 'adding' || st === 'added'}
                    className="w-full text-left flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm hover:bg-white/10 transition disabled:opacity-60"
                  >
                    <span className="truncate">{p.name}</span>
                    <span className="shrink-0 text-xs text-white/40">
                      {st === 'adding' && '…'}
                      {st === 'added' && '✓'}
                      {st === 'error' && '!'}
                    </span>
                  </button>
                );
              })}
            </div>
          </>,
          document.body
        )}
    </div>
  );
}
