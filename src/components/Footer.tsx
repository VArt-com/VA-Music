export default function Footer() {
  const kofi = process.env.NEXT_PUBLIC_KOFI_URL || 'https://ko-fi.com/varthur';

  return (
    <footer className="border-t border-white/10 mt-16 py-8 text-center text-sm text-white/60">
      <p>Вся музыка на платформе — бесплатно для прослушивания и скачивания.</p>
      <p className="mt-2">
        Нравится проект?{' '}
        <a
          href={kofi}
          target="_blank"
          rel="noopener noreferrer"
          className="text-pink-400 hover:text-pink-300 font-medium"
        >
          Поддержи на Ko-fi ☕
        </a>
      </p>
    </footer>
  );
}
