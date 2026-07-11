'use client';

import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export default function InstallAppButton({ label, iosTip }: { label: string; iosTip: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIosTip, setShowIosTip] = useState(false);

  // Register the service worker. Chrome/Edge will not consider this site
  // "installable" (and will never fire beforeinstallprompt below) without
  // one registered — this was missing before and is why the button never
  // appeared.
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    const ua = window.navigator.userAgent;
    setIsIos(/iPad|iPhone|iPod/.test(ua));

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  // Already installed, or neither a native prompt nor iOS manual instructions apply.
  if (isStandalone) return null;
  if (!deferredPrompt && !isIos) return null;

  const handleClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return;
    }
    if (isIos) {
      setShowIosTip((v) => !v);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        className="btn-neon rounded-full px-3 py-1.5 text-xs sm:text-sm whitespace-nowrap"
      >
        📲 {label}
      </button>
      {showIosTip && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-white/10 bg-black/90 backdrop-blur-xl p-3 text-xs text-white/80 z-50 shadow-lg">
          {iosTip}
        </div>
      )}
    </div>
  );
}
