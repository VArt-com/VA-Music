import { createClient } from '@/lib/supabase/server';
import { getDictionary } from '@/lib/i18n/server';
import MixerClient, { type MixerTrackOption } from '@/components/MixerClient';

export default async function MixerPage() {
  const supabase = await createClient();
  const t = await getDictionary();
  const { data: tracks } = await supabase
    .from('tracks')
    .select('id, title, file_path, profiles(username, display_name)')
    .order('created_at', { ascending: false })
    .limit(100);

  type TrackRow = {
    id: string;
    title: string;
    file_path: string;
    profiles: { username: string; display_name: string | null } | { username: string; display_name: string | null }[] | null;
  };

  const options: MixerTrackOption[] = ((tracks as TrackRow[] | null) ?? []).map((tr) => {
    const profile = Array.isArray(tr.profiles) ? tr.profiles[0] : tr.profiles;
    return {
      id: tr.id,
      title: tr.title,
      artist: profile?.display_name || profile?.username || t.common.unknownArtist,
      url: supabase.storage.from('tracks').getPublicUrl(tr.file_path).data.publicUrl,
    };
  });

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 pb-32">
      <h1 className="text-3xl font-extrabold neon-text mb-1">{t.mixerPage.title}</h1>
      <p className="text-white/60 text-sm mb-6">{t.mixerPage.subtitle}</p>
      {options.length === 0 ? (
        <p className="text-white/50">{t.mixerPage.empty}</p>
      ) : (
        <MixerClient tracks={options} />
      )}
    </main>
  );
}
