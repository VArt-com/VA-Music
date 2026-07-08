'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function UploadForm({ userId }: { userId: string }) {
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
      setError('Выбери аудиофайл');
      return;
    }
    setBusy(true);
    setError(null);
    const supabase = createClient();

    const ext = file.name.split('.').pop();
    const filePath = `${userId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from('tracks').upload(filePath, file);
    if (uploadError) {
      setError(uploadError.message);
      setBusy(false);
      return;
    }

    let coverPath: string | null = null;
    if (cover) {
      const coverExt = cover.name.split('.').pop();
      coverPath = `${userId}/${crypto.randomUUID()}.${coverExt}`;
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

    setBusy(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    router.push(`/track/${track.id}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        required
        placeholder="Название трека"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"
      />
      <input
        type="text"
        placeholder="Жанр"
        value={genre}
        onChange={(e) => setGenre(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"
      />
      <input
        type="text"
        placeholder="Теги через запятую"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"
      />
      <textarea
        placeholder="Описание"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"
      />
      <div>
        <label className="block text-sm text-white/60 mb-1">Аудиофайл (MP3/WAV)</label>
        <input
          type="file"
          accept="audio/*"
          required
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm"
        />
      </div>
      <div>
        <label className="block text-sm text-white/60 mb-1">Обложка (необязательно)</label>
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
        className="w-full bg-pink-500 hover:bg-pink-400 disabled:opacity-50 rounded-lg py-2 font-medium"
      >
        {busy ? 'Загружаю...' : 'Опубликовать'}
      </button>
      <p className="text-xs text-white/40">
        Загружай только музыку, на которую у тебя есть права (собственные треки или с разрешением
        правообладателя).
      </p>
    </form>
  );
}
