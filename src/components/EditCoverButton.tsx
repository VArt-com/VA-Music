'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { randomId } from '@/lib/id';

// Lets the track owner swap the cover art in place — without touching the
// audio file or re-uploading the track. Uploads the new image first, then
// points the track row at it, then best-effort deletes the old cover file
// so storage doesn't accumulate orphaned images.
export default function EditCoverButton({
  trackId,
  userId,
  oldCoverPath,
}: {
  trackId: string;
  userId: string;
  oldCoverPath: string | null;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const handlePick = () => inputRef.current?.click();

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(false);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop();
      const newPath = `${userId}/${randomId()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from('covers').upload(newPath, file);
      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('tracks')
        .update({ cover_path: newPath })
        .eq('id', trackId);
      if (updateError) throw updateError;

      if (oldCoverPath) {
        // Best-effort cleanup — if this fails the old file just becomes an
        // orphan in storage, it doesn't affect the track showing correctly.
        supabase.storage
          .from('covers')
          .remove([oldCoverPath])
          .catch(() => {});
      }

      router.refresh();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <button
        type="button"
        onClick={handlePick}
        disabled={busy}
        className="text-xs bg-white/10 hover:bg-fuchsia-500/20 border border-white/10 hover:border-fuchsia-400/40 rounded-full px-3 py-1.5 whitespace-nowrap transition disabled:opacity-50"
      >
        {busy ? t.common.savingCover : error ? t.common.editCoverFailed : t.common.editCover}
      </button>
    </>
  );
}
