'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { randomId } from '@/lib/id';

export default function UploadForm({ userId }: { userId: string }) {
  const { t } = useI18n();
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [tags, setTags] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError(t.uploadForm.errorNoFile);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();

      const ext = file.name.split('.').pop();
      const filePath = `${userId}/${randomId()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from('tracks').upload(filePath, file);
      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      let coverPath: string | null = null;
      if (cover) {
        const coverExt = cover.name.split('.').pop();
        coverPath = `${userId}/${randomId()}.${coverExt}`;
        await supabase.storage.from('covers').upload(coverPath, cover);
      }

      const { data: track, error: insertError } = await supabase
        .from('tracks')
        .insert({
          artist_id: userId,
          title,
          description,
          genre: genre || null,
          tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
          file_path: filePath,
          cover_path: coverPath,
        })
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
        return;
      }
      router.push(`/track/${track.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.uploadForm.genericError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        required
        placeholder={t.uploadForm.titlePlaceholder}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-fuchsia-400 transition"
      />
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
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm"
        />
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
