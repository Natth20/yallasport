import { pick } from '@/i18n/pick';
import { ClientTime } from '@/components/datetime/ClientTime';
import { FOOTBALL_YOUTUBE_CHANNELS } from '@/lib/youtube/channels';
import type { YoutubeDeskStats } from '@/lib/youtube/ingest';
import styles from './youtube.module.css';

export function YoutubeBrief({
  locale,
  stats,
}: {
  locale: string;
  stats: YoutubeDeskStats;
}) {
  const arNames = FOOTBALL_YOUTUBE_CHANNELS.filter((channel) => channel.lang === 'ar')
    .map((channel) => (locale === 'en' ? channel.name : channel.nameAr))
    .join(' · ');

  const cells = [
    { dt: pick(locale, 'القنوات', 'Channels'), dd: String(stats.channels) },
    { dt: pick(locale, 'فيديو', 'Videos'), dd: String(stats.videos) },
    { dt: pick(locale, 'ريلز', 'Reels'), dd: String(stats.reels) },
    { dt: pick(locale, 'عربي', 'Arabic'), dd: String(stats.arabic) },
    { dt: pick(locale, 'الأرشيف', 'Archive'), dd: String(stats.archived) },
  ];

  return (
    <aside className={styles['yt-brief']}>
      <dl>
        {cells.map((cell) => (
          <div key={cell.dt}>
            <dt>{cell.dt}</dt>
            <dd>{cell.dd}</dd>
          </div>
        ))}
        <div className={styles['is-wide']}>
          <dt>{pick(locale, 'آخر سحب', 'Last pull')}</dt>
          <dd>
            {stats.fetchedAt ? (
              <ClientTime
                locale={locale}
                value={stats.fetchedAt}
                options={{ day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }}
              />
            ) : (
              '—'
            )}
          </dd>
        </div>
      </dl>
      <p>
        {pick(
          locale,
          'قاعة العرض واجهة الموقع: رف من قنوات يوتيوب الرسمية، يُحفظ تلقائياً ويُعرض هنا. هذا ليس يلا سبورت مباشر.',
          'This hall is the front of the site: official YouTube shelves, stored automatically and shown here. This is not Yalla Sport Live.',
        )}
      </p>
      <p className={styles['yt-roster']}>
        {pick(locale, 'دفتر القنوات العربية:', 'Arabic channels on the roster:')} {arNames}
      </p>
    </aside>
  );
}
