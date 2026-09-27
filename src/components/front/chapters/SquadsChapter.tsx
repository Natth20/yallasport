import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { loadFrontSquads } from '@/lib/front/load-squads';
import { FrontMark } from '../FrontMark';
import shell from '../front-shell.module.css';
import styles from '../squads.module.css';

export async function SquadsChapter() {
  const locale = await getLocale();
  const t = await getTranslations('front');
  const { leagues, clubs, players } = await loadFrontSquads(locale);
  if (leagues.length === 0 && clubs.length === 0 && players.length === 0) return null;
  return (
    <section className={`${shell.band} ${styles.tone}`}>
      <div className={shell.inner}>
        <FrontMark num={t('ch05')} title={t('ch05_title')} note={t('ch05_note')} />
        {leagues.length > 0 ? (
          <ul className={styles.crests}>
            {leagues.map((league) => (
              <li key={league.id}>
                <Link href={`/league/${league.slug}`}>
                  <LeagueCrest name={league.name} logoUrl={league.logoUrl} className="h-10 w-10" />
                  <span>{league.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
        {clubs.length > 0 ? (
          <div>
            <h3 className={styles.h3}>{t('ch05_clubs')}</h3>
            <ul className={styles.grid}>
              {clubs.map((club) => (
                <li key={club.id}>
                  <Link href={`/team/${club.slug}`}>
                    <LeagueCrest name={club.name} logoUrl={club.logoUrl} className="h-8 w-8" />
                    <span>{club.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {players.length > 0 ? (
          <div>
            <h3 className={styles.h3}>{t('ch05_players')}</h3>
            <ul className={styles.people}>
              {players.map((player) => (
                <li key={player.id}>
                  <Link href={`/player/${player.slug}`}>
                    {player.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={player.photoUrl} alt="" />
                    ) : (
                      <span>{player.name.charAt(0)}</span>
                    )}
                    <strong>{player.name}</strong>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className={styles.actions}>
          <Link href="/compare">{t('ch05_compare')}</Link>
          <Link href="/compare-players">{t('ch05_compare_players')}</Link>
        </div>
      </div>
    </section>
  );
}
