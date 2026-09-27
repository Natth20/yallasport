import { getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { deskLabel } from '@/lib/news/desks';
import { loadFrontStories } from '@/lib/front/load-stories';
import styles from './front-hall.module.css';

export async function FrontMoment() {
  const locale = await getLocale();
  const { lead } = await loadFrontStories(locale);
  if (!lead?.image) return null;

  return (
    <Link href={`/news/${lead.slug}`} className={styles.moment}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={lead.image} alt="" referrerPolicy="no-referrer" />
      <span className={styles.momentVeil}>
        <em>{deskLabel(lead.category, locale)}</em>
        <strong>{lead.title}</strong>
        {lead.sourceName ? <b>{lead.sourceName}</b> : null}
      </span>
    </Link>
  );
}
