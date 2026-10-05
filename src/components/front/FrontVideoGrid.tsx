import { getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { loadFrontVideo } from '@/lib/front/load-video';
import { Play, Film, Video, ArrowUpRight, Sparkles, Tv } from 'lucide-react';
import styles from './front-design.module.css';
import { FrontWhen } from './FrontWhen';

export async function FrontVideoGrid() {
  const locale = await getLocale();
  const ar = locale === 'ar';
  const { videos } = await loadFrontVideo(locale);
  const clips = videos.slice(0, 4);
  if (clips.length === 0) return null;

  return (
    <section className={styles.videoSection} aria-label={ar ? 'أحدث الفيديوهات وملخصات المباريات' : 'Latest Videos & Match Highlights'}>
      <div className={styles.sectionHeaderRow}>
        <div className={styles.ledgerHeaderTitleGroup}>
          <span className={styles.ledgerIconBadge} style={{ background: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.35)' }}>
            <Film className="w-4 h-4 text-red-500" />
          </span>
          <div>
            <h3 className={styles.sectionTitle}>
              {ar ? 'أحدث الفيديوهات وملخصات المباريات' : 'Latest Videos & Match Highlights'}
            </h3>
            <p className={styles.ledgerSubtitle}>
              {ar ? 'أهداف القمم، ملخصات المباريات الحصرية، وتصريحات المؤتمرات الصحفية بجودة فائقة.' : 'Match highlights, post-game reactions, and HD goal clips.'}
            </p>
          </div>
        </div>
        <Link href="/videos" className={styles.arenaFooterLink}>
          <span>{ar ? 'مكتبة الفيديو الكاملة ←' : 'Full Video Hub →'}</span>
        </Link>
      </div>

      <div className={styles.videoGrid}>
        {clips.map((clip) => (
          <Link key={clip.id} href={`/videos?v=${clip.youtubeId}`} className={styles.videoCard}>
            <div className={styles.videoThumbnailWrap}>
              {clip.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={clip.thumbnailUrl} alt={clip.title} className={styles.videoThumbnail} />
              ) : (
                <div className={styles.videoThumbnailFallback} />
              )}
              <div className={styles.videoPlayOverlay}>
                <span className={styles.videoPlayBtn}>
                  <Play className="w-5 h-5 fill-white text-white translate-x-[1px]" />
                </span>
              </div>
              <span className={styles.videoDurationTag}>
                <Video className="w-3 h-3 text-red-500 inline-block me-1" />
                HD 1080p
              </span>
            </div>

            <div className={styles.videoCardBody}>
              <div className={styles.videoCardChannelRow}>
                <span className={styles.videoChannelBadge}>
                  <Tv className="w-3.5 h-3.5 text-red-500 inline-block me-1" />
                  {clip.channelTitle || 'يلا سبورت HD'}
                </span>
                <span className={styles.videoTimeBadge}>
                  <FrontWhen value={clip.publishedAt} />
                </span>
              </div>

              <strong className={styles.videoCardTitle}>{clip.title}</strong>

              <div className={styles.videoCardFooter}>
                <span className={styles.videoWatchPrompt}>
                  {ar ? 'شاهد الملخص الآن' : 'Watch Highlight'}
                  <ArrowUpRight className="w-3 h-3 inline-block ms-1" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
