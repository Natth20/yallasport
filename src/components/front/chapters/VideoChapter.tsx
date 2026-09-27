import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { loadFrontVideo } from '@/lib/front/load-video';
import { FrontMark } from '../FrontMark';
import { FrontWhen } from '../FrontWhen';
import { MetaLine } from '../MetaLine';
import type { FrontClip } from '@/lib/front/types';
import shell from '../front-shell.module.css';
import styles from '../video.module.css';

function Rail({ rows, hrefBase }: { rows: FrontClip[]; hrefBase: string }) {
  return (
    <div className={styles.rail}>
      {rows.map((clip) => (
        <Link key={clip.id} href={`${hrefBase}?v=${clip.youtubeId}`} className={styles.clip}>
          {clip.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={clip.thumbnailUrl} alt="" />
          ) : null}
          <strong>{clip.title}</strong>
          <MetaLine className={shell.meta} parts={[clip.channelTitle, <FrontWhen key={clip.id} value={clip.publishedAt} />]} />
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
    <section className={`${shell.band} ${styles.tone}`}>
      <div className={shell.inner}>
        <FrontMark num={t('ch07')} title={t('ch07_title')} note={t('ch07_note')} href="/videos" cta={t('ch07_cta')} />
        {videos.length > 0 ? (
          <div>
            <h3 className={styles.h3}>{t('ch07_videos')}</h3>
            <Rail rows={videos} hrefBase="/videos" />
          </div>
        ) : null}
        {reels.length > 0 ? (
          <div>
            <h3 className={styles.h3}>{t('ch07_reels')}</h3>
            <Rail rows={reels} hrefBase="/videos/reels" />
          </div>
        ) : null}
      </div>
    </section>
  );
}
