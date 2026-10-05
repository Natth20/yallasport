import { getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { loadFrontVideo } from '@/lib/front/load-video';
import { loadFrontStories } from '@/lib/front/load-stories';
import { FrontWhen } from './FrontWhen';
import { Smartphone, Camera, Play, Sparkles, Image as ImageIcon, Flame } from 'lucide-react';
import styles from './front-design.module.css';

export async function FrontMediaStrip() {
  const locale = await getLocale();
  const ar = locale === 'ar';
  const [video, stories] = await Promise.all([loadFrontVideo(locale), loadFrontStories(locale)]);
  const reels = video.reels
    .filter((clip) => !video.videos.some((row) => row.youtubeId === clip.youtubeId))
    .slice(0, 6);
  const photos = stories.photos.slice(0, 6);

  if (reels.length === 0 && photos.length === 0) return null;

  return (  
    <div className={styles.mediaStripSection} aria-label={ar ? 'الميديا واللقطات السريعة' : 'Media & Quick Clips'}>
      
      {/* 📱 1. ريلز ولقطات قصيرة (Vertical Shorts & Reels) */}
      {reels.length > 0 ? (
        <section className={styles.reelsSection}>
          <div className={styles.sectionHeaderRow}>
            <div className={styles.ledgerHeaderTitleGroup}>
              <span className={styles.ledgerIconBadge} style={{ background: 'rgba(236, 72, 153, 0.12)', borderColor: 'rgba(236, 72, 153, 0.35)' }}>
                <Smartphone className="w-4 h-4 text-pink-500" />
              </span>
              <div>
                <h3 className={styles.sectionTitle}>
                  {ar ? 'ريلز ولقطات قصيرة 📱' : 'Shorts & Viral Reels 📱'}
                </h3>
                <p className={styles.ledgerSubtitle}>
                  {ar ? 'أجمل المهارات، الأهداف الخاطفة، ولحظات الملاعب الرائجة.' : 'Viral match moments, skill moves, and fast goal highlights.'}
                </p>
              </div>
            </div>
            <Link href="/videos/reels" className={styles.arenaFooterLink}>
              <span>{ar ? 'تصفح كل الريلز ←' : 'All Reels →'}</span>
            </Link>
          </div>

          <div className={styles.reelsRow}>
            {reels.map((clip) => (
              <Link key={clip.id} href={`/videos/reels?v=${clip.youtubeId}`} className={styles.reelCard}>
                <div className={styles.reelThumbnailWrap}>
                  {clip.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={clip.thumbnailUrl} alt={clip.title} className={styles.reelThumbnail} />
                  ) : (
                    <div className={styles.reelThumbnailFallback} />
                  )}
                  <div className={styles.reelGradientOverlay} />
                  
                  <span className={styles.reelPlayPill}>
                    <Play className="w-3.5 h-3.5 fill-white text-white translate-x-[1px]" />
                  </span>

                  <span className={styles.reelShortBadge}>
                    <Flame className="w-3 h-3 text-pink-400" />
                    <span>Reel</span>
                  </span>

                  <strong className={styles.reelTitle}>{clip.title}</strong>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* 📸 2. معرض صور وأحداث اليوم (Today in Pictures) */}
      {photos.length > 0 ? (
        <section className={styles.photosSection}>
          <div className={styles.sectionHeaderRow}>
            <div className={styles.ledgerHeaderTitleGroup}>
              <span className={styles.ledgerIconBadge} style={{ background: 'rgba(14, 165, 233, 0.12)', borderColor: 'rgba(14, 165, 233, 0.35)' }}>
                <Camera className="w-4 h-4 text-sky-400" />
              </span>
              <div>
                <h3 className={styles.sectionTitle}>
                  {ar ? 'معرض صور وأحداث اليوم 📸' : 'Today in Pictures 📸'}
                </h3>
                <p className={styles.ledgerSubtitle}>
                  {ar ? 'لقطات حصرية، احتفالات النجوم، وعدسات المصورين في الملاعب.' : 'Exclusive matchday lenses, star celebrations, and stadium photo-stories.'}
                </p>
              </div>
            </div>
            <Link href="/photos" className={styles.arenaFooterLink}>
              <span>{ar ? 'ألبوم الصور الكامل ←' : 'Photo Gallery →'}</span>
            </Link>
          </div>

          <div className={styles.photosGrid}>
            {photos.map((photo) => (
              <Link key={photo.id} href={`/news/${photo.slug}`} className={styles.photoCard}>
                <div className={styles.photoImgWrap}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.image!} alt={photo.title} className={styles.photoImg} referrerPolicy="no-referrer" />
                  <div className={styles.photoOverlay} />
                  <span className={styles.photoBadge}>
                    <ImageIcon className="w-3 h-3 text-sky-300" />
                    <span>HD Photo</span>
                  </span>
                </div>
                <div className={styles.photoCardBody}>
                  <strong className={styles.photoTitle}>{photo.title}</strong>
                  <div className={styles.photoMetaRow}>
                    <span className={styles.photoSourceText}>{photo.sourceName || 'عدسة يلا سبورت'}</span>
                    <span>•</span>
                    <FrontWhen value={photo.publishedAt} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

    </div>
  );
}
