const links: { name: string; icon: string; href: string }[] = [
    { name: 'Telegram', icon: '✈️', href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}` },
    { name: 'WhatsApp', icon: '💬', href: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}` },
    { name: 'VK', icon: '🔵', href: `https://vk.com/share.php?url=${encodedUrl}&title=${encodedTitle}` },
    { name: 'X / Twitter', icon: '✕', href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}` },
    { name: 'Facebook', icon: 'f', href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
];
