'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Track } from '@/lib/types';

export default function TrackCard({
  track,
  audioUrl,
  downloadUrl,
}: {
  track: Track;
  audioUrl: string;
  downloadUrl: string;
}) {
  const [played, setPlayed] = useState(false);

  const handlePlay = async () => {
    if (played) return;
    setPlayed(true);
    const supabase = createClient();
    await supabase.rpc('increment_play_count', { track_id: track.id });
  };

  const handleDownload = async () => {
    const supabase = createClient();
    await supabase.rpc('increment_download_count', { track_id: track.id });
  };

  return (
    <div className="border border-white/10 rounded-xl p-4 bg-white/5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href={`/track/${track.id}`} className="font-semibold hover:text-pink-400">
            {track.title}
          </Link>
          <div className="text-sm text-white/60">
            {track.profiles && (
              <Link href={`/artist/${track.artist_id}`} className="hover:text-pink-400">
                {track.profiles.display_name || track.profiles.username}
              </Link>
            )}
            {track.genre && <span> · {track.genre}</span>}
          </div>
        </div>
        <a
          href={downloadUrl}
          onClick={handleDownload}
          className="text-xs bg-white/10 hover:bg-white/20 rounded-full px-3 py-1 whitespace-nowrap"
        >
          Скачать
        </a>
      </div>
      <audio controls preload="none" className="w-full mt-3" onPlay={handlePlay} src={audioUrl}>
        Ваш браузер не поддерживает воспроизведение аудио.
      </audio>
      <div className="flex gap-3 mt-2 text-xs text-white/50">
        <span>▶ {track.play_count}</span>
        <span>⬇ {track.download_count}</span>
        {track.tags?.length > 0 && <span>#{track.tags.join(' #')}</span>}
      </div>
    </div>
  );
}
