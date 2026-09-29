import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Play } from 'lucide-react';
import { loadFrontVideo } from '@/lib/front/load-video';
import { FrontMark } from '../FrontMark';
import { FrontWhen } from '../FrontWhen';
import { MetaLine } from '../MetaLine';
import type { FrontClip } from '@/lib/front/types';
import shell from '../front-shell.module.css';
import styles from '../press-suite.module.css';

function ClipMeta({ clip }: { clip: FrontClip }) {
  return <MetaLine parts={[clip.channelTitle, <FrontWhen key={clip.id} value={clip.publishedAt} />]} />;
}

export async function VideoChapter() {
  const locale = await getLocale();
  const t = await getTranslations('front');
  const { videos } = await loadFrontVideo(locale);
  if (videos.length === 0) return null;

  const [lead, ...queue] = videos;

  return (
    <section className={`${shell.band} ${styles.suite}`}>
      <div className={shell.inner}>
        <FrontMark num="04" title={t('ch07_videos')} note={t('ch07_note')} href="/videos" cta={t('ch07_cta')} />
        {lead ? (
          <div className={styles.cinema}>
            <Link href={`/videos?v=${lead.youtubeId}`} className={styles.screen}>
              {lead.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={lead.thumbnailUrl} alt="" className={styles.shot} />
              ) : (
                <span className={styles.shot} />
              )}
              <span className={styles.shade} aria-hidden />
              <span className={styles.play} aria-hidden>
                <Play size={16} fill="currentColor" />
              </span>
              <span className={styles.copy}>
                <em className={styles.stamp}>{t('ch07_videos')}</em>
                <b>{lead.title}</b>
                <small>
                  <ClipMeta clip={lead} />
                </small>
              </span>
            </Link>
            {queue.length > 0 ? (
              <div className={styles.queue}>
                {queue.slice(0, 6).map((clip) => (
                  <Link key={clip.id} href={`/videos?v=${clip.youtubeId}`} className={styles.queueItem}>
                    {clip.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={clip.thumbnailUrl} alt="" className={styles.thumb} />
                    ) : (
                      <span className={styles.blank} aria-hidden />
                    )}
                    <span>
                      <b>{clip.title}</b>
                      <small>
                        <ClipMeta clip={clip} />
                      </small>
                    </span>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
