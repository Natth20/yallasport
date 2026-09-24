import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { loadFrontBroadcast } from '@/lib/front/load-broadcast';
import { FrontMark } from '../FrontMark';
import { ClientTime } from '@/components/datetime/ClientTime';

export async function BroadcastChapter() {
  const locale = await getLocale();
  const t = await getTranslations('front');
  const rows = await loadFrontBroadcast(locale);
  if (rows.length === 0) return null;
  return (
    <section className="fp-chapter">
      <FrontMark num={t('ch09')} title={t('ch09_title')} note={t('ch09_note')} href="/live" cta={t('cta_live')} />
      <ul className="fp-list">
        {rows.map((row) => (
          <li key={row.id}>
            <Link href={`/match/${row.matchId}`}>
              {row.channelLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={row.channelLogo} alt="" />
              ) : (
                <span>{row.channelName.charAt(0)}</span>
              )}
              <strong>
                {row.homeName} — {row.awayName}
              </strong>
              <em>
                {row.channelName} · {row.leagueName} ·{' '}
                <ClientTime value={row.kickoffAt} options={{ hour: '2-digit', minute: '2-digit' }} />
              </em>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
