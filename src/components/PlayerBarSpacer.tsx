'use client';

import { usePlayer } from '@/lib/player/PlayerContext';

/**
 * PlayerBar is `fixed bottom-0`, so whenever a track is playing it visually
 * covers whatever content is naturally at the bottom of the page (usually
 * the Footer). This spacer reserves the exact measured height of PlayerBar
 * in the document flow, pushing everything else up above the fixed bar so
 * nothing is ever hidden behind it — including when the equalizer panel is
 * open and the bar grows taller.
 */
export default function PlayerBarSpacer() {
  const { playerBarHeight } = usePlayer();
  if (!playerBarHeight) return null;
  return <div aria-hidden style={{ height: playerBarHeight }} />;
}
