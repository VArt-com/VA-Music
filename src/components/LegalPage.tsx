import { getLocale } from '@/lib/i18n/server';
import { getLegalDoc, type LegalKind } from '@/lib/legal-content';

export default async function LegalPage({ kind }: { kind: LegalKind }) {
  const locale = await getLocale();
  const doc = getLegalDoc(kind, locale);
  const wa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const rtlText = locale === 'he' || locale === 'ar';

  return (
    <main className="max-w-2xl mx-auto px-4 py-10 text-white/80" dir={rtlText ? 'rtl' : 'ltr'}>
      <h1 className="text-2xl font-bold mb-1 neon-text">{doc.title}</h1>
      <p className="text-xs text-white/50 mb-8">{doc.updated}</p>

      {doc.blocks.map((b) => (
        <section key={b.h} className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-2">{b.h}</h2>
          {b.p?.map((t, i) => (
            <p key={i} className="text-sm leading-relaxed mb-2">{t}</p>
          ))}
          {b.ul && (
            <ul className="list-disc ps-5 space-y-1 text-sm leading-relaxed">
              {b.ul.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          )}
        </section>
      ))}

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-white mb-2">{doc.contactLabel}</h2>
        <p className="text-sm leading-relaxed mb-2">{doc.contactIntro}</p>
        <ul className="list-disc ps-5 space-y-1 text-sm">
          <li><a className="text-fuchsia-400 underline" href="https://org-va.com/contact.html" target="_blank" rel="noopener noreferrer">org-va.com/contact</a></li>
          {wa && <li><a className="text-fuchsia-400 underline" href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">WhatsApp</a></li>}
        </ul>
      </section>

      <nav className="text-xs text-white/50 flex flex-wrap gap-x-4 gap-y-1" aria-label="Legal">
        <a className="underline" href="/privacy">Privacy</a>
        <a className="underline" href="/terms">Terms</a>
        <a className="underline" href="/accessibility">Accessibility</a>
      </nav>
    </main>
  );
}
