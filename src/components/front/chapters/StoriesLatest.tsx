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
        <ol className={styles.stack}>
          {latest.map((story) => (
            <li key={story.id}>
              <Link href={`/news/${story.slug}`} className={styles.row}>
                <span>
                  <small><FrontWhen value={story.publishedAt} /></small>
                  <b>{story.title}</b>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
