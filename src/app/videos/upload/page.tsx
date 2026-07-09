import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getDictionary } from '@/lib/i18n/server';
import VideoUploadForm from '@/components/VideoUploadForm';

export default async function VideoUploadPage() {
  const supabase = await createClient();
  const t = await getDictionary();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <main className="max-w-lg mx-auto px-4 py-12 pb-32">
      <h1 className="text-xl font-bold mb-6 neon-text">{t.videoUploadPage.title}</h1>
      <VideoUploadForm userId={user.id} />
    </main>
  );
}
