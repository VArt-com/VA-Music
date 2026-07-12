'use client';

import { useState } from 'react';

// Small circular photo pinned to the top-right corner of the viewport,
// signalling who made the app. Click to enlarge; click again (or click the
// dark backdrop) to close. Expects a photo at /public/creator.jpg.
export default function CreatorBadge() {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setExpanded(true)}
        title="Arthur — создатель Music World"
        className="fixed top-2 right-2 z-[70] w-9 h-9 rounded-full overflow-hidden border-2 border-fuchsia-400/70 shadow-lg shadow-fuchsia-500/30 hover:scale-110 transition-transform"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/creator.jpg" alt="Arthur" className="w-full h-full object-cover" />
      </button>

      {expanded && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-pointer"
          onClick={() => setExpanded(false)}
        >
          <div className="text-center px-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/creator.jpg"
              alt="Arthur"
              className="w-48 h-48 sm:w-56 sm:h-56 rounded-full object-cover border-4 border-fuchsia-400 shadow-2xl mx-auto"
            />
            <p className="mt-4 text-white/80 text-sm">Music World создал Arthur 🎵</p>
          </div>
        </div>
      )}
    </>
  );
}
