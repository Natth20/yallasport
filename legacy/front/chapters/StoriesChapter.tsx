import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { deskLabel } from '@/lib/news/desks';
import { loadFrontStories } from '@/lib/front/load-stories';
import { FrontMark } from '../FrontMark';
import styles from '../front-hall.module.css';

export async function StoriesChapter() {
  const locale = await getLocale();
  const t = await getTranslations('front');
  const { rest } = await loadFrontStories(locale);
  if (rest.length === 0) return null;
  return (
    <section className={styles.chapter}>
      <FrontMark num={t('ch02')} title={t('ch02_title')} note={t('ch02_note')} href="/news" cta={t('ch02_cta')} />
      <ul className={styles.stories}>
        {rest.map((story) => (
          <li key={story.id}>
            <Link href={`/news/${story.slug}`}>
              {story.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={story.image} alt="" referrerPolicy="no-referrer" />
              ) : null}
              <span>
                <em>{deskLabel(story.category, locale)}</em>
                <strong>{story.title}</strong>
                {story.excerpt ? <p>{story.excerpt}</p> : null}
                {story.sourceName ? <b>{story.sourceName}</b> : null}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
