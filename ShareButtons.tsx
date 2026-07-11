'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/I18nProvider';

export default function DeleteButton({
  onDelete,
  redirectTo,
  label,
}: {
  onDelete: () => Promise<void>;
  redirectTo?: string;
  label?: string;
}) {
  const { t } = useI18n();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (busy) {
    return <span className="text-xs text-white/40 px-3 py-1.5 inline-block">{t.common.deleting}</span>;
  }

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs">
        {error && <span className="text-red-400">{error}</span>}
        <button
          type="button"
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await onDelete();
              if (redirectTo) router.push(redirectTo);
              else router.refresh();
            } catch (e) {
              setError(e instanceof Error ? e.message : t.common.deleteFailed);
              setBusy(false);
              setConfirming(false);
              return;
            }
            setBusy(false);
          }}
          className="bg-red-500/90 hover:bg-red-500 rounded-full px-3 py-1.5 text-white transition"
        >
          {t.common.confirmDelete}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="bg-white/10 hover:bg-white/20 rounded-full px-3 py-1.5 transition"
        >
          {t.common.cancel}
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="text-xs bg-white/10 hover:bg-red-500/20 border border-white/10 hover:border-red-400/40 rounded-full px-3 py-1.5 text-white/70 hover:text-red-300 transition whitespace-nowrap"
    >
      {label ?? t.common.delete}
    </button>
  );
}
