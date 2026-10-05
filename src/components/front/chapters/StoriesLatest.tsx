import { getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { loadFrontStories } from '@/lib/front/load-stories';
import { FrontMark } from '../FrontMark';
import { FrontWhen } from '../FrontWhen';
import { pick } from '@/i18n/pick';
import shell from '../front-shell.module.css';
import styles from '../press-suite.module.css';

export async function StoriesLatest() {
  const locale = await getLocale();
  const { latest } = await loadFrontStories(locale);
  if (latest.length === 0) return null;

  return (
    <section className={`${shell.band} ${styles.suite}`}>
      <div className={shell.inner}>
        <FrontMark
          num="05"
          title={pick(locale, 'آخر الأخبار', 'Latest news')}
          note={pick(locale, 'تسلسل زمني كما وصل من المصادر، بلا ترتيب تحريري.', 'A time stack from the sources, not an editorial pick.')}
          href="/news"
          cta={pick(locale, 'كل الأخبار', 'All news')}
        />
        <div className={styles.stack}>
          {latest.slice(0, 8).map((story) => (
            <Link key={story.id} href={`/news/${story.slug}`} className={styles.row}>
              {story.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={story.image} alt="" className={styles.thumb} referrerPolicy="no-referrer" />
              ) : (
                <span className={styles.blank} aria-hidden />
              )}
              <span>
                <small><FrontWhen value={story.publishedAt} /></small>
                <b>{story.title}</b>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
