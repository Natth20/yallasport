import { getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { loadFrontPulse } from '@/lib/front/load-pulse';
import { BarChart3, Radio, Trophy, Award, AlertCircle, ArrowUpRight, Activity } from 'lucide-react';
import styles from './front-design.module.css';

export async function FrontStatsCards() {
  const locale = await getLocale();
  const ar = locale === 'ar';
  const pulse = await loadFrontPulse();

  const cards = [
    {
      value: pulse.live,
      label: ar ? 'مباراة مباشرة الآن' : 'Live Matches Now',
      sublabel: ar ? 'تغطية لحظية لكافة أحداث الملعب' : 'Real-time pitch tracking',
      icon: Radio,
      accent: styles.statAccentLive,
      color: '#ef4444',
      badge: ar ? 'مباشر 🔴' : 'LIVE',
    },
    {
      value: pulse.goals,
      label: ar ? 'هدفاً مسجلاً في الجولة' : 'Goals Scored This Round',
      sublabel: ar ? 'معدل تهديفي مشتعل في القمم' : 'High scoring intensity',
      icon: Trophy,
      accent: styles.statAccentGoals,
      color: '#f59e0b',
      badge: ar ? 'حصيلة الأهداف ⚽' : 'Goals',
    },
    {
      value: pulse.yellow,
      label: ar ? 'بطاقة صفراء محتسبة' : 'Yellow Cards Issued',
      sublabel: ar ? 'مؤشر الاندفاع والتدخلات التكتيكية' : 'Tactical discipline index',
      icon: Award,
      accent: styles.statAccentYellow,
      color: '#eab308',
      badge: ar ? 'إنذارات 🟨' : 'Yellows',
    },
    {
      value: pulse.red,
      label: ar ? 'بطاقات حمراء وطرد' : 'Red Cards & Expulsions',
      sublabel: ar ? 'قرارات تحكيمية حاسمة وغيابات' : 'Game-changing ejections',
      icon: AlertCircle,
      accent: styles.statAccentRed,
      color: '#f43f5e',
      badge: ar ? 'حالات طرد 🟥' : 'Reds',
    },
  ];

  return (
    <section className={styles.bigStatsSection} aria-label={ar ? 'أرقام وإحصائيات اليوم' : "Today's Core Matchday Figures"}>
      <div className={styles.sectionHeaderRow}>
        <div className={styles.ledgerHeaderTitleGroup}>
          <span className={styles.ledgerIconBadge} style={{ background: 'rgba(234, 179, 8, 0.12)', borderColor: 'rgba(234, 179, 8, 0.35)' }}>
            <Activity className="w-4 h-4 text-amber-500" />
          </span>
          <div>
            <h3 className={styles.sectionTitle}>
              {ar ? 'أرقام وإحصائيات اليوم الكبرى' : "Today's Core Matchday Figures"}
            </h3>
            <p className={styles.ledgerSubtitle}>
              {ar ? 'مؤشرات رقمية حية ترصد إيقاع المباريات، حصيلة الأهداف، والبطاقات التحكيمية.' : 'Live numerical indicators tracking match tempo, goals, and referee actions.'}
            </p>
          </div>
        </div>
        <Link href="/stats" className={styles.arenaFooterLink}>
          <span>{ar ? 'مركز الإحصائيات الشامل ←' : 'Full Stats Hub →'}</span>
        </Link>
      </div>

      <div className={styles.bigStatsGrid}>
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href="/stats" className={`${styles.bigStatCard} ${card.accent}`}>
              <div className={styles.bigStatCardHeader}>
                <span className={styles.bigStatBadgeTag}>{card.badge}</span>
                <div className={styles.bigStatIconWrap}>
                  <Icon className="w-5 h-5" style={{ color: card.color }} />
                </div>
              </div>

              <div className={styles.bigStatValueRow}>
                <span className={styles.bigStatValue}>{card.value}</span>
              </div>

              <div className={styles.bigStatBody}>
                <strong className={styles.bigStatLabel}>{card.label}</strong>
                <p className={styles.bigStatSubtext}>{card.sublabel}</p>
              </div>

              <div className={styles.bigStatFooter}>
                <span className={styles.bigStatActionLink}>
                  {ar ? 'عرض التفاصيل' : 'View Breakdown'}
                  <ArrowUpRight className="w-3 h-3 inline-block ms-1" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
