import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { deskLabel } from '@/lib/news/desks';
import { isLiveStatus } from '@/lib/sports-data/match-window';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { loadFrontBoard } from '@/lib/front/load-board';
import { loadFrontStories } from '@/lib/front/load-stories';
import { loadFrontSquads } from '@/lib/front/load-squads';
import { FrontMark } from './FrontMark';
import { FrontScoreCard } from './FrontScoreCard';
import { ClientTime } from '@/components/datetime/ClientTime';
import styles from './front-hall.module.css';

export async function FrontArena() {
  const locale = await getLocale();
  const t = await getTranslations('front');
  const [matches, { rest }, { leagues }] = await Promise.all([
    loadFrontBoard(locale),
    loadFrontStories(locale),
    loadFrontSquads(locale),
  ]);

  const live = matches.filter((match) => isLiveStatus(match.status));
  const soon = matches.filter((match) => !isLiveStatus(match.status) && match.status !== 'FINISHED');
  const done = matches.filter((match) => match.status === 'FINISHED');
  const headline = rest.slice(0, 6);
  const liveOrRecent = live.length > 0 ? live.slice(0, 8) : done.slice(0, 4);

  if (matches.length === 0 && headline.length === 0 && leagues.length === 0) return null;

  return (
    <div className={styles.arena}>
      {liveOrRecent.length > 0 ? (
        <section className={styles.arenaBlock}>
          <FrontMark
            num={live.length > 0 ? t('stat_live') : t('ch01_done')}
            title={live.length > 0 ? t('ch01_live') : t('ch01_title')}
            href="/matches"
            cta={t('ch01_cta')}
          />
          <div className={styles.scoreGrid}>
            {liveOrRecent.map((match) => (
              <FrontScoreCard
                key={match.id}
                match={match}
                liveLabel={t('live_badge')}
                ftLabel={t('ft_badge')}
                openLabel={t('match_preview')}
              />
            ))}
          </div>
        </section>
      ) : null}

      <div className={styles.arenaSplit}>
        {soon.length > 0 ? (
          <section className={styles.arenaBlock}>
            <FrontMark num={t('ch01')} title={t('ch01_soon')} href="/matches" cta={t('ch01_cta')} />
            <div className={styles.kickGrid}>
              {soon.slice(0, 8).map((match) => (
                <Link key={match.id} href={`/match/${match.id}`} className={styles.kick}>
                  <span className={styles.kickComp}>
                    <LeagueCrest name={match.league.name} logoUrl={match.league.logoUrl} className="h-4 w-4" />
                    {match.league.name}
                  </span>
                  <span className={styles.kickDuel}>
                    <LeagueCrest name={match.homeTeam.name} logoUrl={match.homeTeam.logoUrl} className="h-8 w-8" />
                    <b>
                      <ClientTime value={match.kickoffAt} options={{ hour: '2-digit', minute: '2-digit' }} />
                    </b>
                    <LeagueCrest name={match.awayTeam.name} logoUrl={match.awayTeam.logoUrl} className="h-8 w-8" />
                  </span>
                  <em>
                    {match.homeTeam.name} × {match.awayTeam.name}
                  </em>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {headline.length > 0 ? (
          <section className={styles.arenaBlock}>
            <FrontMark num={t('ch02')} title={t('rail_title')} href="/news" cta={t('ch02_cta')} />
            <ul className={styles.newsRail}>
              {headline.map((story) => (
                <li key={story.id}>
                  <Link href={`/news/${story.slug}`}>
                    {story.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={story.image} alt="" referrerPolicy="no-referrer" />
                    ) : (
                      <span className={styles.newsFallback}>{story.title.charAt(0)}</span>
                    )}
                    <span>
                      <em>{deskLabel(story.category, locale)}</em>
                      <strong>{story.title}</strong>
                      {story.sourceName ? <b>{story.sourceName}</b> : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      {leagues.length > 0 ? (
        <section className={styles.arenaBlock}>
          <FrontMark num={t('ch03')} title={t('door_leagues')} href="/leagues" cta={t('ch03_cta')} />
          <div className={styles.leagueStrip}>
            {leagues.map((league) => (
              <Link key={league.id} href={`/league/${league.slug}`} className={styles.leagueChip}>
                <LeagueCrest name={league.name} logoUrl={league.logoUrl} className="h-10 w-10" />
                <span>{league.name}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
