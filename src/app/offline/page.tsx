'use client';

import { useCallback, useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { usePlayer, type NowPlaying } from '@/lib/player/PlayerContext';
import {
  getAllOfflineTracks,
  getOfflineAudioUrl,
  getOfflineCoverUrl,
  removeOfflineTrack,
  type OfflineTrackMeta,
} from '@/lib/offline/db';

type Row = OfflineTrackMeta & { resolvedCoverUrl: string | null };

export default function OfflinePage() {
  const { t } = useI18n();
  const { current, isPlaying, playQueue, toggle } = usePlayer();
  const [rows, setRows] = useState<Row[] | null>(null);

  const load = useCallback(async () => {
    const metas = await getAllOfflineTracks();
    const withCovers = await Promise.all(
      metas.map(async (meta) => ({
        ...meta,
        resolvedCoverUrl: await getOfflineCoverUrl(meta.id),
      }))
    );
    setRows(withCovers);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const buildQueue = useCallback(async (list: Row[]): Promise<NowPlaying[]> => {
    const resolved = await Promise.all(
      list.map(async (row) => ({
        id: row.id,
        title: row.title,
        artist: row.artist,
        artistId: row.artistId,
        audioUrl: (await getOfflineAudioUrl(row.id)) || '',
        coverUrl: row.resolvedCoverUrl,
      }))
    );
    return resolved;
  }, []);

  const handlePlay = async (row: Row, index: number) => {
    if (current?.id === row.id) {
      toggle();
      return;
    }
    if (!rows) return;
    const queue = await buildQueue(rows);
    playQueue(queue, index);
  };

  const handleRemove = async (id: string) => {
    await removeOfflineTrack(id);
    load();
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 pb-32">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold neon-text mb-1">{t.offlinePage.title}</h1>
        <p className="text-white/50 text-sm">{t.offlinePage.subtitle}</p>
      </div>

      {rows === null && <p className="text-white/50 text-center py-12">…</p>}

      {rows !== null && rows.length === 0 && (
        <p className="text-white/50 text-center py-12">{t.offlinePage.empty}</p>
      )}

      <div className="space-y-3">
        {rows?.map((row, index) => {
          const isCurrent = current?.id === row.id;
          return (
            <div
              key={row.id}
              className="group glass-card rounded-2xl p-4 flex items-center gap-4 hover:shadow-neon transition"
            >
              <button
                type="button"
                onClick={() => handlePlay(row, index)}
                className="relative shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-br from-fuchsia-600 to-violet-600 flex items-center justify-center"
                aria-label={isCurrent && isPlaying ? t.player.pause : t.player.play}
              >
                {row.resolvedCoverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={row.resolvedCoverUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                )}
                <span className="relative z-10 text-white text-lg drop-shadow">
                  {isCurrent && isPlaying ? '❚❚' : '▶'}
                </span>
              </button>

              <div className="min-w-0 flex-1">
                <div className="font-semibold truncate">{row.title}</div>
                <div className="text-sm text-white/60 truncate">{row.artist}</div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleRemove(row.id)}
                  className="text-xs bg-white/10 hover:bg-red-500/20 border border-white/10 hover:border-red-400/40 rounded-full px-3 py-1.5 whitespace-nowrap transition"
                >
                  {t.common.removeOffline}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
