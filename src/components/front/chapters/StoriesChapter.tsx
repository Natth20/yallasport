import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { deskLabel } from '@/lib/news/desks';
import { loadFrontStories } from '@/lib/front/load-stories';
import { FrontMark } from '../FrontMark';
import { FrontWhen } from '../FrontWhen';
import { MetaLine } from '../MetaLine';
import shell from '../front-shell.module.css';
import styles from '../press-suite.module.css';

export async function StoriesChapter() {
  const locale = await getLocale();
  const t = await getTranslations('front');
  const { lead, rest } = await loadFrontStories(locale);
  const stack = rest.slice(0, 5);
  if (!lead && stack.length === 0) return null;

  return (
    <section className={`${shell.band} ${styles.suite}`}>
      <div className={shell.inner}>
        <FrontMark num="04" title={t('ch02_title')} note={t('ch02_note')} href="/news" cta={t('ch02_cta')} />
        <div className={styles.press}>
          {lead ? (
            <Link href={`/news/${lead.slug}`} className={styles.feature}>
              {lead.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={lead.image} alt="" className={styles.shot} referrerPolicy="no-referrer" />
              ) : (
                <span className={styles.shot} />
              )}
              <span className={styles.shade} aria-hidden />
              <span className={styles.copy}>
                <em className={styles.stamp}>{deskLabel(lead.category, locale)}</em>
                <b>{lead.title}</b>
                {lead.excerpt ? <p>{lead.excerpt}</p> : null}
                <small>
                  <MetaLine parts={[lead.sourceName, <FrontWhen key={lead.id} value={lead.publishedAt} />]} />
                </small>
              </span>
            </Link>
          ) : null}
          {stack.length > 0 ? (
            <div className={styles.stack}>
              {stack.map((story) => (
                <Link key={story.id} href={`/news/${story.slug}`} className={styles.row}>
                  {story.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={story.image} alt="" className={styles.thumb} referrerPolicy="no-referrer" />
                  ) : (
                    <span className={styles.blank} aria-hidden />
                  )}
                  <span>
                    <em className={styles.kicker}>{deskLabel(story.category, locale)}</em>
                    <b>{story.title}</b>
                    <small>
                      <MetaLine parts={[story.sourceName, <FrontWhen key={story.id} value={story.publishedAt} />]} />
                    </small>
                  </span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
