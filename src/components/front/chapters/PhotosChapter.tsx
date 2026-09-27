import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { deskLabel } from '@/lib/news/desks';
import { loadFrontStories } from '@/lib/front/load-stories';
import { FrontMark } from '../FrontMark';
import { FrontWhen } from '../FrontWhen';
import shell from '../front-shell.module.css';
import styles from '../photos.module.css';

export async function PhotosChapter() {
  const locale = await getLocale();
  const t = await getTranslations('front');
  const { photos } = await loadFrontStories(locale);
  if (photos.length === 0) return null;
  return (
    <section className={`${shell.band} ${styles.tone}`}>
      <div className={shell.inner}>
        <FrontMark num={t('ch08')} title={t('ch08_title')} note={t('ch08_note')} href="/photos" cta={t('ch08_cta')} />
        <div className={styles.grid}>
          {photos.map((story) => (
            <Link key={story.id} href={`/news/${story.slug}`} className={styles.card}>
              <span className={styles.frame}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={story.image!} alt="" referrerPolicy="no-referrer" />
                <em className={styles.cat}>{deskLabel(story.category, locale)}</em>
                {story.sourceName ? <b className={styles.src}>{story.sourceName}</b> : null}
              </span>
              <strong>{story.title}</strong>
              {story.excerpt ? <p className={`${shell.meta} ${shell.clamp}`}>{story.excerpt}</p> : null}
              <span className={shell.meta}>
                <FrontWhen value={story.publishedAt} />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
