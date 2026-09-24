import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { FrontMark } from '../FrontMark';

export async function DoorsChapter() {
  const t = await getTranslations('front');
  const doors = [
    { href: '/about', label: t('door_about') },
    { href: '/contact', label: t('door_contact') },
    { href: '/search', label: t('door_search') },
    { href: '/settings', label: t('door_settings') },
    { href: '/privacy', label: t('door_privacy') },
    { href: '/terms', label: t('door_terms') },
    { href: '/cookies', label: t('door_cookies') },
    { href: '/copyright', label: t('door_copyright') },
  ];
  return (
    <section className="fp-chapter">
      <FrontMark num={t('ch12')} title={t('ch12_title')} />
      <nav className="fp-doors">
        {doors.map((door) => (
          <Link key={door.href} href={door.href}>
            {door.label}
          </Link>
        ))}
      </nav>
    </section>
  );
}
