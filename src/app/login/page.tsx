'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n/I18nProvider';

export default function LoginPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      return;
    }
    router.push('/');
    router.refresh();
  };

  return (
    <main className="max-w-sm mx-auto px-4 py-16">
      <h1 className="text-xl font-bold mb-6 neon-text">{t.auth.loginTitle}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          required
          placeholder={t.auth.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-fuchsia-400 transition"
        />
        <input
          type="password"
          required
          placeholder={t.auth.passwordPlaceholder}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-fuchsia-400 transition"
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" className="w-full btn-neon rounded-lg py-2 font-medium">
          {t.auth.loginSubmit}
        </button>
      </form>
    </main>
  );
}
