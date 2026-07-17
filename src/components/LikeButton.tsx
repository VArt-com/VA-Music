'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Lets any logged-in user like/unlike a track. The count is shown right on
// the button so it doubles as social proof in the list — if a track has a
// lot of hearts, other listeners are more likely to tap play. Not logged in
// yet? Tapping it sends you to the login page instead of failing silently.
export default function LikeButton({
  trackId,
  isLoggedIn,
  initialLiked,
  initialCount,
}: {
  trackId: string;
  isLoggedIn: boolean;
  initialLiked: boolean;
  initialCount: number;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  const handleClick = async () => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    if (pending) return;

    const nextLiked = !liked;
    setPending(true);
    setLiked(nextLiked);
    setCount((c) => Math.max(0, c + (nextLiked ? 1 : -1)));

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('toggle_track_like', { p_track_id: trackId });
      if (error) throw error;
      // Reconcile with whatever the server actually ended up with, in case
      // of a race (e.g. the same track liked from two tabs).
      if (typeof data === 'boolean' && data !== nextLiked) {
        setLiked(data);
        setCount((c) => Math.max(0, c + (data ? 1 : -1) - (nextLiked ? 1 : -1)));
      }
    } catch {
      setLiked(!nextLiked);
      setCount((c) => Math.max(0, c + (nextLiked ? -1 : 1)));
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={liked}
      aria-label={liked ? 'Unlike' : 'Like'}
      className={`flex items-center gap-1.5 text-xs rounded-full px-3 py-1.5 border transition whitespace-nowrap ${
        liked
          ? 'border-fuchsia-400/60 text-fuchsia-300 bg-fuchsia-500/10'
          : 'border-white/10 text-white/60 hover:text-fuchsia-300 hover:border-fuchsia-400/40'
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className="w-3.5 h-3.5"
        fill={liked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        />
      </svg>
      <span>{count}</span>
    </button>
  );
}
