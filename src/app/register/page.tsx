'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n/I18nProvider';

export default function RegisterPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <main className="max-w-sm mx-auto px-4 py-16 text-center">
        <p>{t.auth.checkEmail.replace('{email}', email)}</p>
      </main>
    );
  }

  return (
    <main className="max-w-sm mx-auto px-4 py-16">
      <h1 className="text-xl font-bold mb-6 neon-text">{t.auth.registerTitle}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          required
          placeholder={t.auth.usernamePlaceholder}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-fuchsia-400 transition"
        />
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
          minLength={6}
          placeholder={t.auth.passwordMinPlaceholder}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-fuchsia-400 transition"
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" className="w-full btn-neon rounded-lg py-2 font-medium">
          {t.auth.registerSubmit}
        </button>
      </form>
    </main>
  );
}
