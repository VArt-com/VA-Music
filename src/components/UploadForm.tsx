'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { randomId } from '@/lib/id';

type FileStatus = 'pending' | 'uploading' | 'done' | 'error';

// Supabase free-tier hard limit per file. Checked client-side so oversized
// files fail fast with a clear status instead of a confusing network error.
const MAX_FILE_BYTES = 50 * 1024 * 1024;

function titleFromFilename(name: string) {
  const withoutExt = name.replace(/\.[^/.]+$/, '');
  const cleaned = withoutExt.replace(/[_-]+/g, ' ').trim();
  return cleaned || name;
}

export default function UploadForm({ userId }: { userId: string }) {
  const { t } = useI18n();
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [tags, setTags] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [cover, setCover] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, FileStatus>>({});
  const router = useRouter();

  const isBatch = files.length > 1;

  const handleFilesChange = (fileList: FileList | null) => {
    const next = Array.from(fileList ?? []);
    setFiles(next);
    const initial: Record<string, FileStatus> = {};
    next.forEach((f) => (initial[f.name] = 'pending'));
    setStatuses(initial);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      setError(t.uploadForm.errorNoFile);
      return;
    }
    setBusy(true);
    setError(null);

    const supabase = createClient();

    let coverPath: string | null = null;
    if (cover) {
      const coverExt = cover.name.split('.').pop();
      coverPath = `${userId}/${randomId()}.${coverExt}`;
      await supabase.storage.from('covers').upload(coverPath, cover);
    }

    let firstTrackId: string | null = null;
    let failCount = 0;

    for (const file of files) {
      if (file.size > MAX_FILE_BYTES) {
        setStatuses((prev) => ({ ...prev, [file.name]: 'error' }));
        failCount += 1;
        continue;
      }

      setStatuses((prev) => ({ ...prev, [file.name]: 'uploading' }));
      try {
        const ext = file.name.split('.').pop();
        const filePath = `${userId}/${randomId()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('tracks').upload(filePath, file);
        if (uploadError) throw uploadError;

        const trackTitle = isBatch ? titleFromFilename(file.name) : title;

        const { data: track, error: insertError } = await supabase
          .from('tracks')
          .insert({
            artist_id: userId,
            title: trackTitle,
            description,
            genre: genre || null,
            tags: tags ? tags.split(',').map((tg) => tg.trim()).filter(Boolean) : [],
            file_path: filePath,
            cover_path: coverPath,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        if (!firstTrackId) firstTrackId = track.id;
        setStatuses((prev) => ({ ...prev, [file.name]: 'done' }));
      } catch {
        failCount += 1;
        setStatuses((prev) => ({ ...prev, [file.name]: 'error' }));
      }
    }

    setBusy(false);

    if (failCount === files.length) {
      setError(t.uploadForm.genericError);
      return;
    }

    if (!isBatch && firstTrackId) {
      router.push(`/track/${firstTrackId}`);
      return;
    }

    router.push('/');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isBatch && (
        <input
          type="text"
          required
          placeholder={t.uploadForm.titlePlaceholder}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-fuchsia-400 transition"
        />
      )}
      <input
        type="text"
        placeholder={t.uploadForm.genrePlaceholder}
        value={genre}
        onChange={(e) => setGenre(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-fuchsia-400 transition"
      />
      <input
        type="text"
        placeholder={t.uploadForm.tagsPlaceholder}
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-fuchsia-400 transition"
      />
      <textarea
        placeholder={t.uploadForm.descriptionPlaceholder}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-fuchsia-400 transition"
      />

      <div>
        <label className="block text-sm text-white/60 mb-1">{t.uploadForm.audioFileLabel}</label>
        <input
          type="file"
          accept="audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg,.wma"
          required
          multiple
          onChange={(e) => handleFilesChange(e.target.files)}
          className="w-full text-sm"
        />
        <p className="text-xs text-white/40 mt-1">{t.uploadForm.multipleFilesNotice}</p>
      </div>

      <div>
        <label className="block text-sm text-white/60 mb-1">{t.uploadForm.coverLabel}</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setCover(e.target.files?.[0] ?? null)}
          className="w-full text-sm"
        />
      </div>

      {files.length > 0 && (
        <ul className="space-y-1 text-sm rounded-lg border border-white/10 p-3">
          {files.map((f) => (
            <li key={f.name} className="flex items-center justify-between gap-2 text-white/70">
              <span className="truncate">{f.name}</span>
              <span className="shrink-0">
                {statuses[f.name] === 'uploading' && '⏳'}
                {statuses[f.name] === 'done' && '✅'}
                {statuses[f.name] === 'error' && '❌'}
              </span>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full btn-neon disabled:opacity-50 rounded-lg py-2 font-medium"
      >
        {busy ? t.uploadForm.uploading : t.uploadForm.publish}
      </button>
      <p className="text-xs text-white/40">{t.uploadForm.rightsNotice}</p>
    </form>
  );
}
