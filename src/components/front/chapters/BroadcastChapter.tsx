import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { loadFrontBroadcast } from '@/lib/front/load-broadcast';
import { FrontMark } from '../FrontMark';
import { ClientTime } from '@/components/datetime/ClientTime';
import { MetaLine } from '../MetaLine';
import shell from '../front-shell.module.css';
import styles from '../broadcast.module.css';

export async function BroadcastChapter() {
  const locale = await getLocale();
  const t = await getTranslations('front');
  const rows = await loadFrontBroadcast(locale);
  if (rows.length === 0) return null;
  return (
    <section className={`${shell.band} ${styles.tone}`}>
      <div className={shell.inner}>
        <FrontMark num={t('ch09')} title={t('ch09_title')} note={t('ch09_note')} href="/live" cta={t('cta_live')} />
        <ul className={styles.list}>
          {rows.slice(0, 5).map((row) => (
            <li key={row.id}>
              <Link href={`/match/${row.matchId}`}>
                {row.channelLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={row.channelLogo} alt="" />
                ) : (
                  <span className={styles.fallback}>{row.channelName.charAt(0)}</span>
                )}
                <strong>
                  {row.homeName} — {row.awayName}
                </strong>
                <MetaLine
                  className={`${shell.meta} ${styles.detail}`}
                  parts={[
                    row.channelName,
                    row.leagueName,
                    <ClientTime key={row.id} value={row.kickoffAt} options={{ hour: '2-digit', minute: '2-digit' }} />,
                  ]}
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
