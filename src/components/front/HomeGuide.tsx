import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { loadFrontBroadcast } from '@/lib/front/load-broadcast';
import { ClientTime } from '@/components/datetime/ClientTime';
import { rotateTake } from '@/lib/front/rotate-shelf';
import { FrontMark } from './FrontMark';
import shell from './front-shell.module.css';
import styles from './home-salon.module.css';

export async function HomeGuide() {
  const locale = await getLocale();
  const t = await getTranslations('front');
  const rows = await loadFrontBroadcast(locale);
  if (rows.length === 0) return null;

  return (
    <section className={`${shell.band} ${styles.guideBand}`}>
      <div className={shell.inner}>
        <FrontMark num="—" title={t('ch09_title')} note={t('ch09_note')} href="/live" cta={t('cta_live')} />
        <ul className={styles.guide}>
          {rotateTake(rows, 8, 13).map((row) => (
            <li key={row.id}>
              <Link href={`/match/${row.matchId}`}>
                {row.channelLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={row.channelLogo} alt="" />
                ) : (
                  <span aria-hidden>{row.channelName.charAt(0)}</span>
                )}
                <strong>
                  {row.homeName} — {row.awayName}
                </strong>
                <small>
                  {row.channelName}
                  {' · '}
                  {row.leagueName}
                  {' · '}
                  <ClientTime value={row.kickoffAt} locale={locale} variant="clock" />
                </small>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
