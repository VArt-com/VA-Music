import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getDictionary } from '@/lib/i18n/server';
import UploadForm from '@/components/UploadForm';

export default async function UploadPage() {
  const supabase = await createClient();
  const t = await getDictionary();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <main className="max-w-lg mx-auto px-4 py-12 pb-32">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-bold neon-text">{t.uploadPage.title}</h1>
        <Link href="/videos/upload" className="text-xs text-white/60 hover:text-fuchsia-300 whitespace-nowrap">
          {t.uploadPage.wantVideo} →
        </Link>
      </div>
      <UploadForm userId={user.id} />
    </main>
  );
}
