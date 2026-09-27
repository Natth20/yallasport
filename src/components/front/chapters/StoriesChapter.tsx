import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { deskLabel } from '@/lib/news/desks';
import { loadFrontStories } from '@/lib/front/load-stories';
import { FrontMark } from '../FrontMark';
import { FrontWhen } from '../FrontWhen';
import { MetaLine } from '../MetaLine';
import shell from '../front-shell.module.css';
import styles from '../stories.module.css';

export async function StoriesChapter() {
  const locale = await getLocale();
  const t = await getTranslations('front');
  const { rest } = await loadFrontStories(locale);
  if (rest.length === 0) return null;
  return (
    <section className={`${shell.band} ${styles.tone}`}>
      <div className={shell.inner}>
        <FrontMark num={t('ch02')} title={t('ch02_title')} note={t('ch02_note')} href="/news" cta={t('ch02_cta')} />
        <ul className={styles.list}>
          {rest.map((story) => (
            <li key={story.id}>
              <Link href={`/news/${story.slug}`}>
                {story.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={story.image} alt="" referrerPolicy="no-referrer" />
                ) : null}
                <span className={styles.copy}>
                  <em className={styles.kicker}>{deskLabel(story.category, locale)}</em>
                  <strong>{story.title}</strong>
                  {story.excerpt ? <p className={`${shell.meta} ${shell.clamp}`}>{story.excerpt}</p> : null}
                  <MetaLine className={shell.meta} parts={[story.sourceName, <FrontWhen key={story.id} value={story.publishedAt} />]} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
