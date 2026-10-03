import { pick } from '@/i18n/pick';
import { arabicCountLabel } from '@/lib/i18n/arabic-count';
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
      dt: pick(locale, 'قنوات يوتيوب المعتمدة', 'Approved YouTube sources'),
      dd: String(stats.channels),
      icon: Tv,
      hint: pick(locale, 'مصدر فيديو معتمد', 'Approved video source'),
    },
    {
      dt: pick(locale, 'فيديو', 'Videos'),
      dd: String(stats.videos),
      icon: Video,
      hint: pick(locale, 'ملخصات وتحليلات', 'Highlights & analysis'),
    },
    {
      dt: locale === 'ar' ? arabicCountLabel(stats.reels, 'reel') : 'Reels',
      dd: String(stats.reels),
      icon: Flame,
      hint: pick(locale, 'كليبات سريعة', 'Fast clips'),
    },
    ...(stats.arabic > 0 && stats.arabic !== stats.videos
      ? [
        {
          dt: pick(locale, 'قنوات عربية', 'Arabic channels'),
          dd: String(stats.arabic),
          icon: Globe2,
          hint: pick(locale, 'قنوات ناطقة بالعربية', 'Arabic-language channels'),
        },
      ]
      : []),
    {
      dt: pick(locale, 'فيديو في الأرشيف', 'Videos in archive'),
      dd: String(stats.archived),
      icon: Archive,
      hint: pick(locale, 'خارج الرف الحالي', 'Off the current shelf'),
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
            <span>{pick(locale, 'آخر مزامنة للمحتوى:', 'Last content sync:')}</span>
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
              'محتوى فيديو مضمّن من قنوات يوتيوب المعتمدة عبر المشغّل الرسمي. يلا سبورت لا تعيد رفع المقاطع ولا تختلق مدتها.',
              'Embedded video from approved YouTube channels via the official player. Yalla Sport does not re-upload clips or invent durations.',
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
