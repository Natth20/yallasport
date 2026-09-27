import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { loadFrontVideo } from '@/lib/front/load-video';
import { FrontMark } from '../FrontMark';
import type { FrontClip } from '@/lib/front/types';
import styles from '../front-hall.module.css';

function Rail({ rows, hrefBase }: { rows: FrontClip[]; hrefBase: string }) {
  return (
    <div className={styles.videoRail}>
      {rows.map((clip) => (
        <Link key={clip.id} href={`${hrefBase}?v=${clip.youtubeId}`} className={styles.video}>
          {clip.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={clip.thumbnailUrl} alt="" />
          ) : null}
          <span>
            <strong>{clip.title}</strong>
            <em>{clip.channelTitle}</em>
          </span>
        </Link>
      ))}
    </div>
  );
}

export async function VideoChapter() {
  const locale = await getLocale();
  const t = await getTranslations('front');
  const { videos, reels } = await loadFrontVideo(locale);
  if (videos.length === 0 && reels.length === 0) return null;
  return (
    <section className={styles.chapter}>
      <FrontMark num={t('ch07')} title={t('ch07_title')} note={t('ch07_note')} href="/videos" cta={t('ch07_cta')} />
      {videos.length > 0 ? (
        <div>
          <h3 className={styles.chapterH3}>{t('ch07_videos')}</h3>
          <Rail rows={videos} hrefBase="/videos" />
        </div>
      ) : null}
      {reels.length > 0 ? (
        <div>
          <h3 className={styles.chapterH3}>{t('ch07_reels')}</h3>
          <Rail rows={reels} hrefBase="/videos/reels" />
        </div>
      ) : null}
    </section>
  );
}

