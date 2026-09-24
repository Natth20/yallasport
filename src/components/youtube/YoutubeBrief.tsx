import { pick } from '@/i18n/pick';
import { ClientTime } from '@/components/datetime/ClientTime';
import { FOOTBALL_YOUTUBE_CHANNELS } from '@/lib/youtube/channels';
import type { YoutubeDeskStats } from '@/lib/youtube/ingest';
import './youtube.css';

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
    {
      dt: pick(locale, 'على الرف', 'On the shelf'),
      dd: `${stats.videos} · ${stats.reels}`,
    },
    { dt: pick(locale, 'عربي', 'Arabic'), dd: String(stats.arabic) },
    { dt: pick(locale, 'الأرشيف', 'Archive'), dd: String(stats.archived) },
  ];

  return (
    <aside className="yt-brief">
      <dl>
        {cells.map((cell) => (
          <div key={cell.dt}>
            <dt>{cell.dt}</dt>
            <dd>{cell.dd}</dd>
          </div>
        ))}
        <div className="is-wide">
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
          'كل قناة تُبقي أحدث كليباتها على الرف. حلقة جديدة تطرد القديمة إلى الأرشيف. المشغّل يوتيوب رسمي داخل الصفحة — هذا ليس يلا سبورت مباشر.',
          'Each channel keeps only its newest clips on the shelf. A new upload archives the older one. Playback is the official YouTube player on this page — this is not Yalla Sport Live.',
        )}
      </p>
      <p className="yt-roster">
        {pick(locale, 'دفتر القنوات العربية:', 'Arabic channels on the roster:')} {arNames}
      </p>
    </aside>
  );
}
