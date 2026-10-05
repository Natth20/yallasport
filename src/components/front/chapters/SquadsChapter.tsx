import { getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { loadFrontSquads } from '@/lib/front/load-squads';
import { Trophy, Shield, Users, ArrowUpRight, GitCompare, UserCheck, Sparkles, ChevronLeft } from 'lucide-react';
import styles from '../front-design.module.css';

export async function SquadsChapter() {
  const locale = await getLocale();
  const ar = locale === 'ar';
  const { leagues, clubs, players } = await loadFrontSquads(locale);
  if (leagues.length === 0 && clubs.length === 0 && players.length === 0) return null;

  return (
    <section className={styles.squadsSection} aria-label={ar ? 'البطولات والأندية واللاعبون' : 'Competitions, Clubs & Players'}>
      {/* Section Header */}
      <div className={styles.sectionHeaderRow}>
        <div className={styles.ledgerHeaderTitleGroup}>
          <span className={styles.ledgerIconBadge} style={{ background: 'rgba(59, 130, 246, 0.12)', borderColor: 'rgba(59, 130, 246, 0.35)' }}>
            <Trophy className="w-4 h-4 text-sky-500" />
          </span>
          <div>
            <h3 className={styles.sectionTitle}>
              {ar ? 'البطولات والأندية واللاعبون' : 'Competitions, Clubs & Players'}
            </h3>
            <p className={styles.ledgerSubtitle}>
              {ar
                ? 'استكشف موسوعة الدوريات الكبرى، سجلات الأندية، ومقارنات أداء نجوم الساحرة المستديرة.'
                : 'Explore major leagues, club dossiers, and compare star player statistics.'}
            </p>
          </div>
        </div>
        <div className={styles.squadsActionBtns}>
          <Link href="/compare" className={styles.squadCompareBtn}>
            <GitCompare className="w-3.5 h-3.5" />
            <span>{ar ? 'مقارنة الأندية' : 'Compare Clubs'}</span>
          </Link>
          <Link href="/compare-players" className={styles.squadCompareBtn}>
            <UserCheck className="w-3.5 h-3.5" />
            <span>{ar ? 'مقارنة اللاعبين' : 'Compare Players'}</span>
          </Link>
        </div>
      </div>

      {/* 🏆 Top Leagues */}
      {leagues.length > 0 ? (
        <div className={styles.squadsSubBlock}>
          <div className={styles.squadsSubHeader}>
            <span className={styles.squadSubIconWrap}>
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
            </span>
            <strong className={styles.squadSubTitle}>{ar ? 'أبرز البطولات والدوريات الرسمية' : 'Major Official Competitions'}</strong>
            <Link href="/leagues" className={styles.squadSubLink}>
              {ar ? 'عرض كل الدوريات ←' : 'All Leagues →'}
            </Link>
          </div>
          <div className={styles.squadsLeaguesGrid}>
            {leagues.slice(0, 8).map((league) => (
              <Link key={league.id} href={`/league/${league.slug}`} className={styles.squadLeagueCard}>
                <div className={styles.squadLeagueLogoWrap}>
                  <LeagueCrest name={league.name} logoUrl={league.logoUrl} className="h-10 w-10 object-contain" />
                </div>
                <div className={styles.squadLeagueInfo}>
                  <span className={styles.squadLeagueName}>{league.name}</span>
                  <span className={styles.squadLeagueCategory}>{ar ? 'دوري معتمد' : 'Verified'}</span>
                </div>
                <ArrowUpRight className={styles.squadCardArrow} />
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {/* 🛡️ Top Clubs */}
      {clubs.length > 0 ? (
        <div className={styles.squadsSubBlock}>
          <div className={styles.squadsSubHeader}>
            <span className={styles.squadSubIconWrap}>
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
            </span>
            <strong className={styles.squadSubTitle}>{ar ? 'أبرز الأندية والفرق المتنافسة' : 'Featured Clubs'}</strong>
            <Link href="/matches" className={styles.squadSubLink}>
              {ar ? 'مباريات الفرق ←' : 'Club Matches →'}
            </Link>
          </div>
          <div className={styles.squadsClubsGrid}>
            {clubs.slice(0, 8).map((club) => (
              <Link key={club.id} href={`/team/${club.slug}`} className={styles.squadClubCard}>
                <div className={styles.squadClubCrestWrap}>
                  <LeagueCrest name={club.name} logoUrl={club.logoUrl} className="h-8 w-8 object-contain" />
                </div>
                <span className={styles.squadClubName}>{club.name}</span>
                <ArrowUpRight className={styles.squadCardArrow} />
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {/* 👤 Star Players */}
      {players.length > 0 ? (
        <div className={styles.squadsSubBlock}>
          <div className={styles.squadsSubHeader}>
            <span className={styles.squadSubIconWrap}>
              <Users className="w-3.5 h-3.5 text-purple-500" />
            </span>
            <strong className={styles.squadSubTitle}>{ar ? 'نجوم ولاعبو الموسم' : 'Featured Season Stars'}</strong>
            <Link href="/compare-players" className={styles.squadSubLink}>
              {ar ? 'دليل اللاعبين ←' : 'Player Directory →'}
            </Link>
          </div>
          <div className={styles.squadsPlayersGrid}>
            {players.slice(0, 8).map((player) => (
              <Link key={player.id} href={`/player/${player.slug}`} className={styles.squadPlayerCard}>
                <div className={styles.squadPlayerAvatarWrap}>
                  {player.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={player.photoUrl} alt={player.name} className={styles.squadPlayerAvatar} />
                  ) : (
                    <span className={styles.squadPlayerFallback}>{player.name.charAt(0)}</span>
                  )}
                </div>
                <strong className={styles.squadPlayerName}>{player.name}</strong>
                <span className={styles.squadPlayerRole}>{ar ? 'ملف اللاعب' : 'View Bio'}</span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
