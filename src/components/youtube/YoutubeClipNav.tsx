import { Link } from '@/i18n/navigation';
import { pick } from '@/i18n/pick';
import './youtube.css';

export function YoutubeClipNav({
  locale,
  current,
}: {
  locale: string;
  current: 'videos' | 'reels' | 'archive';
}) {
  const items = [
    { href: '/videos' as const, id: 'videos' as const, label: pick(locale, 'قاعة الفيديو', 'Cinema') },
    { href: '/videos/reels' as const, id: 'reels' as const, label: pick(locale, 'ريلز', 'Reels') },
    { href: '/videos/archive' as const, id: 'archive' as const, label: pick(locale, 'الأرشيف', 'Archive') },
  ];

  return (
    <nav className="yt-tabs" aria-label={pick(locale, 'فيديو', 'Video')}>
      {items.map((item) => (
        <Link key={item.id} href={item.href} className={`yt-tab${current === item.id ? ' is-on' : ''}`}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
