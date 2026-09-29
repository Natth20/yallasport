import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { deskLabel } from '@/lib/news/desks';
import { loadFrontStories } from '@/lib/front/load-stories';
import { FrontMark } from '../FrontMark';
import { FrontWhen } from '../FrontWhen';
import shell from '../front-shell.module.css';
import styles from '../press-suite.module.css';

export async function PhotosChapter() {
  const locale = await getLocale();
  const t = await getTranslations('front');
  const { photos } = await loadFrontStories(locale);
  if (photos.length === 0) return null;
  const shown = photos.slice(0, 11);

  return (
    <section className={`${shell.band} ${styles.suite}`}>
      <div className={shell.inner}>
        <FrontMark num="03" title={t('ch08_title')} note={t('ch08_note')} href="/photos" cta={t('ch08_cta')} />
        <div className={styles.gallery}>
          {shown.map((story, index) => (
            <Link
              key={story.id}
              href={`/news/${story.slug}`}
              className={`${styles.plate}${index === 0 ? ` ${styles.heroPlate}` : ''}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={story.image!} alt="" className={styles.shot} referrerPolicy="no-referrer" />
              <span className={styles.shade} aria-hidden />
              <span className={styles.copy}>
                <em className={styles.stamp}>{deskLabel(story.category, locale)}</em>
                <b>{story.title}</b>
                <small>
                  {story.sourceName ? `${story.sourceName} · ` : ''}
                  <FrontWhen value={story.publishedAt} />
                </small>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
