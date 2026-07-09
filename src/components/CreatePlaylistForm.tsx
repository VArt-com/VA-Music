'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n/I18nProvider';

export default function CreatePlaylistForm({ userId }: { userId: string }) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('playlists')
      .insert({ owner_id: userId, name, description, is_public: true })
      .select()
      .single();
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(`/playlists/${data.id}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        required
        placeholder={t.createPlaylistForm.namePlaceholder}
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-fuchsia-400 transition"
      />
      <textarea
        placeholder={t.createPlaylistForm.descriptionPlaceholder}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-fuchsia-400 transition"
      />
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full btn-neon disabled:opacity-50 rounded-lg py-2 font-medium"
      >
        {busy ? t.createPlaylistForm.creating : t.createPlaylistForm.create}
      </button>
    </form>
  );
}
