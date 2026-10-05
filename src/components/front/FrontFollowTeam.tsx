import { getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { loadFrontPersonal } from '@/lib/front/load-personal';
import { loadFrontBoard } from '@/lib/front/load-board';
import { loadFrontStories } from '@/lib/front/load-stories';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { Star, Bell, ArrowLeft, ArrowRight, Heart, Sparkles, Shield, Trophy } from 'lucide-react';
import styles from './front-design.module.css';

export async function FrontFollowTeam() {
  const locale = await getLocale();
  const ar = locale === 'ar';
  const [{ items }, board, stories] = await Promise.all([
    loadFrontPersonal(locale),
    loadFrontBoard(locale),
    loadFrontStories(locale),
  ]);

  const team = items.find((item) => item.kind === 'TEAM');
  const next = team
    ? board.find(
      (match) =>
        !['FINISHED', 'CANCELLED', 'POSTPONED'].includes(match.status) &&
        (match.homeTeam.slug === team.slug || match.awayTeam.slug === team.slug)
    )
    : null;
  const last = team
    ? board.find(
      (match) =>
        match.status === 'FINISHED' &&
        (match.homeTeam.slug === team.slug || match.awayTeam.slug === team.slug)
    )
    : null;
  const news = team ? [stories.lead, ...stories.rest].find((story) => story?.title.includes(team.name)) : null;

  return (
    <div className={styles.followTeamBand} aria-label={ar ? 'ركن المشجعين وناديك المفضل' : 'Club Fan Zone'}>
      <div className={styles.followTeamAtmosphere} aria-hidden />

      <div className={styles.followTeamLeftContent}>
        <div className={styles.followTeamBadgeRow}>
          <span className={styles.followTeamBadge}>
            <Heart className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
            <span>{team ? (ar ? 'ناديك المفضل' : 'Your Favorite Club') : ar ? 'ركن المشجعين VIP' : 'VIP Fan Lounge'}</span>
          </span>
          <span className={styles.followTeamNotificationPill}>
            <Bell className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            <span>{ar ? 'تنبيهات فورية' : 'Live Alerts'}</span>
          </span>
        </div>

        <h3 style={{ color: 'white' }} className={styles.followTeamTitle}>
          {team ? `⭐ ${team.name}` : ar ? 'تابع ناديك المفضل واحصل على إشعارات مخصصة' : 'Follow Your Club for Custom Live Alerts'}
        </h3>

        <p className={styles.followTeamDesc}>
          {team
            ? [
              next ? `${ar ? 'المباراة القادمة' : 'Next'}: ${next.homeTeam.name} × ${next.awayTeam.name}` : '',
              last ? `${ar ? 'آخر نتيجة' : 'Last'}: ${last.homeScore ?? 0} : ${last.awayScore ?? 0}` : '',
              news?.title || '',
            ]
              .filter(Boolean)
              .join(' · ') || (ar ? 'تغطية حصرية لناديك المفضل لحظة بلحظة من المصادر المعتمدة.' : 'Live alerts, news, and match updates tailored for your club.')
            : ar
              ? 'اختر فريقك المفضل لتخصيص جدول المباريات، التشكيلات الرسمية، ونتائج الأهداف الحية فور حدوثها.'
              : 'Select your favorite team to personalize your matchday wire, starting lineups, and instant goal notifications.'}
        </p>
      </div>

      <div className={styles.followTeamActionCol}>
        <Link href={team ? `/team/${team.slug}` : '/favorites'} className={styles.followTeamBtn}>
          <span className={styles.followTeamBtnOrb}>
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          </span>
          <span>{team ? (ar ? 'صفحة النادي الرسمية' : 'Official Club Hub') : ar ? 'اختر ناديك المفضل الآن' : 'Pick Your Club'}</span>
          {ar ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
        </Link>
      </div>
    </div>
  );
}
