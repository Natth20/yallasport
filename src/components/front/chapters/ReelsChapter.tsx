import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Play } from 'lucide-react';
import { loadFrontVideo } from '@/lib/front/load-video';
import { FrontMark } from '../FrontMark';
import shell from '../front-shell.module.css';
import styles from '../press-suite.module.css';

export async function ReelsChapter() {
  const locale = await getLocale();
  const t = await getTranslations('front');
  const preferred = await loadFrontVideo(locale);
  const fallback = preferred.reels.length === 0 ? await loadFrontVideo(locale === 'en' ? 'ar' : 'en') : preferred;
  const reels = preferred.reels.length > 0 ? preferred.reels : fallback.reels;
  if (reels.length === 0) return null;
  const reelRows = reels.slice(0, 8);

  return (
    <section className={`${shell.band} ${styles.suite}`}>
      <div className={shell.inner}>
        <FrontMark num="02" title={t('ch07_reels')} note={t('ch07_note')} href="/videos/reels" cta={t('ch07_cta')} />
        <div className={styles.reels}>
          {reelRows.map((clip) => (
            <Link key={clip.id} href={`/videos/reels?v=${clip.youtubeId}`} className={styles.reel}>
              {clip.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={clip.thumbnailUrl} alt="" className={styles.shot} />
              ) : (
                <span className={styles.shot} />
              )}
              <span className={styles.shade} aria-hidden />
              <span className={styles.play} aria-hidden>
                <Play size={14} fill="currentColor" />
              </span>
              <span className={styles.copy}>
                <b>{clip.title}</b>
                <small>{clip.channelTitle}</small>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
