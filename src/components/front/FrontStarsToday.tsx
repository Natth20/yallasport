import { getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { loadFrontScorers } from '@/lib/front/load-scorers';
import { Star, Sparkles, Award, ArrowUpRight } from 'lucide-react';
import styles from './front-design.module.css';

export async function FrontStarsToday() {
  const locale = await getLocale();
  const ar = locale === 'ar';
  const { goals, assists } = await loadFrontScorers(locale);
  const stars = goals.slice(0, 4);
  if (stars.length === 0) return null;

  return (
    <section className={styles.starsTodaySection} aria-label={ar ? 'نجوم وتألق اليوم' : 'Stars of the Day'}>
      <div className={styles.sectionHeaderRow}>
        <div className={styles.ledgerHeaderTitleGroup}>
          <span className={styles.ledgerIconBadge} style={{ background: 'rgba(245, 158, 11, 0.12)', borderColor: 'rgba(245, 158, 11, 0.35)' }}>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </span>
          <div>
            <h3 className={styles.sectionTitle}>
              {ar ? 'نجوم وتألق اليوم' : 'Stars of the Day'}
            </h3>
            <p className={styles.ledgerSubtitle}>
              {ar ? 'أبرز الهدافين وصناع اللعب أداءً وتأثيراً في المواجهات الأخيرة.' : 'Top goalscorers and playmakers from recent match fixtures.'}
            </p>
          </div>
        </div>
        <Link href="/stats" className={styles.arenaFooterLink}>
          <span>{ar ? 'جدول الهدافين والإحصائيات ←' : 'Top Scorers & Stats →'}</span>
        </Link>
      </div>

      <div className={styles.starsGrid}>
        {stars.map((star, idx) => {
          const assist = assists.find((row) => row.slug === star.slug || row.name === star.name);
          const medal =
            idx === 0
              ? { label: ar ? '👑 هداف القمة' : 'Top Scorer', cls: styles.starRankGold }
              : idx === 1
                ? { label: ar ? '🥈 وصيف الهدافين' : '#2 Ranked', cls: styles.starRankSilver }
                : idx === 2
                  ? { label: ar ? '🥉 المركز الثالث' : '#3 Ranked', cls: styles.starRankBronze }
                  : { label: ar ? '⭐ متألق الجولة' : '#4 Ranked', cls: styles.starRankGeneral };

          return (
            <Link
              key={star.slug || star.name}
              href={star.slug ? `/player/${star.slug}` : '/stats'}
              className={`${styles.starCard} ${idx === 0 ? styles.starCardLead : ''}`}
            >
              <div className={styles.starCardBadgeRow}>
                <span className={`${styles.starRankBadge} ${medal.cls}`}>
                  {medal.label}
                </span>
                <span className={styles.starIndexNumber}>#{idx + 1}</span>
              </div>

              <div className={styles.starAvatarContainer}>
                <div className={styles.starAvatarWrap}>
                  {star.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={star.photoUrl} alt={star.name} className={styles.starAvatar} />
                  ) : (
                    <span className={styles.starAvatarFallback}>{star.name.charAt(0)}</span>
                  )}
                </div>
              </div>

              <div className={styles.starCardBody}>
                <strong className={styles.starPlayerTitle}>{star.name}</strong>
                <div className={styles.starStatsPills}>
                  <span className={styles.starGoalPill}>
                    ⚽ {star.value} {ar ? 'أهداف' : 'goals'}
                  </span>
                  {assist ? (
                    <span className={styles.starAssistPill}>
                      🎯 {assist.value} {ar ? 'صناعة' : 'assists'}
                    </span>
                  ) : (
                    <span className={styles.starAssistPill}>
                      ⚡ {ar ? 'تألق مميز' : 'High Form'}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
