import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CreatePlaylistForm from '@/components/CreatePlaylistForm';

export default async function NewPlaylistPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <main className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-xl font-bold mb-6">Новый плейлист</h1>
      <CreatePlaylistForm userId={user.id} />
    </main>
  );
}
