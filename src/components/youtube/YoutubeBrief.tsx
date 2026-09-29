import { pick } from '@/i18n/pick';
import { ClientTime } from '@/components/datetime/ClientTime';
import { FOOTBALL_YOUTUBE_CHANNELS } from '@/lib/youtube/channels';
import type { YoutubeDeskStats } from '@/lib/youtube/ingest';
import { Tv, Video, Flame, Globe2, Archive, Clock3, Radio, ShieldCheck } from 'lucide-react';
import styles from './youtube.module.css';

export function YoutubeBrief({
  locale,
  stats,
}: {
  locale: string;
  stats: YoutubeDeskStats;
}) {
  const arChannels = FOOTBALL_YOUTUBE_CHANNELS.filter((channel) => channel.lang === 'ar');

  const cells = [
    {
      dt: pick(locale, 'القنوات المعتمدة', 'Roster Channels'),
      dd: String(stats.channels),
      icon: Tv,
      hint: pick(locale, 'قناة رسمية', 'Official channels'),
    },
    {
      dt: pick(locale, 'عروض الفيديو', 'Video Titles'),
      dd: String(stats.videos),
      icon: Video,
      hint: pick(locale, 'ملخصات وتحليلات', 'Highlights & analysis'),
    },
    {
      dt: pick(locale, 'ريلز وشورتس', 'Shorts & Reels'),
      dd: String(stats.reels),
      icon: Flame,
      hint: pick(locale, 'كليبات سريعة', 'Fast clips'),
    },
    {
      dt: pick(locale, 'المحتوى العربي', 'Arabic Content'),
      dd: String(stats.arabic),
      icon: Globe2,
      hint: pick(locale, 'أحدث الإصدارات', 'Latest editions'),
    },
    {
      dt: pick(locale, 'خزينة الأرشيف', 'Archive Vault'),
      dd: String(stats.archived),
      icon: Archive,
      hint: pick(locale, 'محفوظات دائمة', 'Permanent storage'),
    },
  ];

  return (
    <aside className={styles['yt-brief']} aria-label={pick(locale, 'ملخص شبكة الفيديو', 'Video network brief')}>
      <div className={styles['yt-brief-header']}>
        <div className={styles['yt-brief-sync']}>
          <span className={styles['yt-sync-dot']} aria-hidden />
          <Radio size={14} className={styles['yt-sync-icon']} aria-hidden />
          <span className={styles['yt-sync-label']}>
            {pick(locale, 'مزامنة تلقائية مع قنوات يوتيوب المعتمدة', 'Live sync with verified YouTube roster')}
          </span>
        </div>

        {stats.fetchedAt ? (
          <div className={styles['yt-brief-clock']}>
            <Clock3 size={13} aria-hidden />
            <span>{pick(locale, 'آخر تحديث للرف:', 'Last shelf refresh:')}</span>
            <ClientTime
              locale={locale}
              value={stats.fetchedAt}
              options={{ day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }}
            />
          </div>
        ) : null}
      </div>

      <div className={styles['yt-brief-grid']}>
        {cells.map((cell) => {
          const Icon = cell.icon;
          return (
            <div key={cell.dt} className={styles['yt-brief-card']}>
              <div className={styles['yt-card-top']}>
                <span className={styles['yt-card-icon-wrap']}>
                  <Icon size={16} aria-hidden />
                </span>
                <span className={styles['yt-card-hint']}>{cell.hint}</span>
              </div>
              <strong className={styles['yt-card-value']}>{cell.dd}</strong>
              <span className={styles['yt-card-label']}>{cell.dt}</span>
            </div>
          );
        })}
      </div>

      <div className={styles['yt-brief-footer']}>
        <div className={styles['yt-brief-notice']}>
          <ShieldCheck size={15} className={styles['yt-notice-icon']} aria-hidden />
          <p>
            {pick(
              locale,
              'تغطية فيديو رسمية منتقاة بعناية من قنوات الأندية والاتحادات والشبكات الرياضية المرخصة. تُعرض المقاطع عبر مشغل يوتيوب الرسمي مع حفظ كامل حقوق أصحاب البث.',
              'Curated official video coverage directly from verified club, federation, and broadcaster channels. Played via the official YouTube player respecting all rights holders.',
            )}
          </p>
        </div>

        <div className={styles['yt-roster-box']}>
          <span className={styles['yt-roster-tag']}>
            {pick(locale, 'قنوات عربية:', 'Arabic channels:')}
          </span>
          <div className={styles['yt-roster-tags']}>
            {arChannels.map((channel) => (
              <span key={channel.id} className={styles['yt-roster-pill']}>
                {locale === 'en' ? channel.name : channel.nameAr}
              </span>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
