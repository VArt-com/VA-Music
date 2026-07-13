'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { saveOfflineTrack, removeOfflineTrack, isTrackOffline } from '@/lib/offline/db';

type Status = 'checking' | 'idle' | 'downloading' | 'saved' | 'removing';

export default function OfflineDownloadButton({
  trackId,
  title,
  artist,
  artistId,
  coverUrl,
  audioUrl,
}: {
  trackId: string;
  title: string;
  artist: string;
  artistId: string;
  coverUrl: string | null;
  audioUrl: string;
}) {
  const { t } = useI18n();
  const [status, setStatus] = useState<Status>('checking');

  useEffect(() => {
    let cancelled = false;
    isTrackOffline(trackId).then((offline) => {
      if (!cancelled) setStatus(offline ? 'saved' : 'idle');
    });
    return () => {
      cancelled = true;
    };
  }, [trackId]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (status === 'saved') {
      setStatus('removing');
      try {
        await removeOfflineTrack(trackId);
        setStatus('idle');
      } catch {
        setStatus('saved');
      }
      return;
    }

    if (status !== 'idle') return;
    setStatus('downloading');
    try {
      await saveOfflineTrack({ id: trackId, title, artist, artistId, coverUrl, audioUrl });
      setStatus('saved');
    } catch {
      setStatus('idle');
    }
  };

  if (status === 'checking') return null;

  const label =
    status === 'saved'
      ? t.common.removeOffline
      : status === 'downloading'
        ? t.common.downloadingOffline
        : status === 'removing'
          ? t.common.deleting
          : t.common.downloadOffline;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={status === 'downloading' || status === 'removing'}
      title={label}
      aria-label={label}
      className={`shrink-0 text-xs rounded-full px-2.5 py-1.5 border whitespace-nowrap transition ${
        status === 'saved'
          ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
          : 'bg-white/10 border-white/10 hover:bg-fuchsia-500/20 hover:border-fuchsia-400/40'
      } ${status === 'downloading' || status === 'removing' ? 'opacity-60' : ''}`}
    >
      {status === 'downloading' || status === 'removing' ? '⏳' : status === 'saved' ? '✓ 📴' : '📴'}
    </button>
  );
}
