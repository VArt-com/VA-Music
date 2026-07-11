import { getDictionary } from '@/lib/i18n/server';
import WhatsAppIcon from './WhatsAppIcon';

export default async function Footer() {
  const kofi = process.env.NEXT_PUBLIC_KOFI_URL || 'https://ko-fi.com/varthur';
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const t = await getDictionary();

  return (
    <footer className="relative mt-16 py-8 text-center text-sm text-white/50">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fuchsia-500/40 to-transparent" />
      <p>{t.footer.freeNotice}</p>
      <p className="mt-2">
        {t.footer.likeProject}{' '}
        <a
          href={kofi}
          target="_blank"
          rel="noopener noreferrer"
          className="text-fuchsia-400 hover:text-fuchsia-300 font-medium"
        >
          {t.footer.supportKofi} ☕
        </a>
      </p>
      {whatsappNumber && (
        <p className="mt-2">
          <a
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-medium"
          >
            {t.footer.whatsappCta}
            <WhatsAppIcon className="w-4 h-4" />
          </a>
        </p>
      )}
    </footer>
  );
}
