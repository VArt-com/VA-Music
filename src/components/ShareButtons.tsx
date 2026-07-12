'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n/I18nProvider';

export default function ShareButtons({
  path,
  title,
  compact = false,
}: {
  path: string;
  title: string;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState(path);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUrl(window.location.origin + path);
      setCanNativeShare(typeof navigator.share === 'function');
    }
  }, [path]);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links: { name: string; icon: string; href: string }[] = [
    { name: 'Telegram', icon: '✈️', href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}` },
    { name: 'WhatsApp', icon: '💬', href: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}` },
    { name: 'VK', icon: '🔵', href: `https://vk.com/share.php?url=${encodedUrl}&title=${encodedTitle}` },
    { name: 'X / Twitter', icon: '✕', href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}` },
    { name: 'Facebook', icon: 'f', href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { name: 'Email', icon: '✉️', href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}` },
  ];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API unavailable — ignore, user can still use the platform links
    }
  };

  const handleShareClick = async () => {
    if (canNativeShare) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user cancelled the native share sheet, or it isn't actually supported
      }
    }
    setOpen((o) => !o);
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={handleShareClick}
        className={`text-xs ${compact ? 'px-3 py-1.5' : 'px-4 py-2'} bg-white/10 hover:bg-fuchsia-500/20 border border-white/10 hover:border-fuchsia-400/40 rounded-full transition whitespace-nowrap`}
      >
        🔗 {t.common.share}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 z-20 w-52 rounded-xl border border-white/10 bg-black/90 backdrop-blur-xl p-2 shadow-neon space-y-0.5">
            {links.map((l) => (
              
                key={l.name}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-white/10 transition"
              >
                <span className="w-4 text-center">{l.icon}</span> {l.name}
              </a>
            ))}
            <button
              type="button"
              onClick={copyLink}
              className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-white/10 transition"
            >
              <span className="w-4 text-center">📋</span> {copied ? t.common.copied : t.common.copyLink}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
