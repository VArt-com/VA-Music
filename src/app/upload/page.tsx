import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import UploadForm from '@/components/UploadForm';

export default async function UploadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <main className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-xl font-bold mb-6">Загрузить трек</h1>
      <UploadForm userId={user.id} />
    </main>
  );
}
