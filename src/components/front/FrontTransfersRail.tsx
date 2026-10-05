import { getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { loadFrontTransfers } from '@/lib/front/load-transfers';
import { RefreshCw, ArrowLeft, ArrowRight, ArrowUpRight, Sparkles, CheckCircle2, Flame, Clock } from 'lucide-react';
import styles from './front-design.module.css';

function transferTone(kind: string | null, locale: string) {
  const value = (kind || '').toLowerCase();
  if (value.includes('loan') || value.includes('إعار')) {
    return { cls: styles.badgeLoan, label: locale === 'ar' ? 'إعارة مؤكدة' : 'Confirmed Loan' };
  }
  if (value.includes('rumour') || value.includes('rumor') || value.includes('unconfirm')) {
    return { cls: styles.badgeMaybe, label: locale === 'ar' ? 'شائعة قوية' : 'Hot Rumour' };
  }
  if (value.includes('free') || value.includes('transfer')) {
    return { cls: styles.badgeMove, label: locale === 'ar' ? 'انتقال حر' : 'Free Agent' };
  }
  return { cls: styles.badgeOfficial, label: locale === 'ar' ? 'صفقة رسمية' : 'Official Deal' };
}

export async function FrontTransfersRail() {
  const locale = await getLocale();
  const ar = locale === 'ar';
  const rows = (await loadFrontTransfers(locale)).slice(0, 6);
  if (rows.length === 0) return null;

  return (
    <section className={styles.transfersRailSection} aria-label={ar ? 'أحدث صفقات الميركاتو' : 'Latest Transfer Market Deals'}>
      <div className={styles.sectionHeaderRow}>
        <div className={styles.ledgerHeaderTitleGroup}>
          <span className={styles.ledgerIconBadge} style={{ background: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.35)' }}>
            <RefreshCw className="w-4 h-4 text-emerald-500" />
          </span>
          <div>
            <h3 className={styles.sectionTitle}>
              {ar ? 'أحدث صفقات وانتقالات الميركاتو' : 'Latest Transfer Market Deals'}
            </h3>
            <p className={styles.ledgerSubtitle}>
              {ar ? 'رصد صفقات الميركاتو الصيفي والشتوي، الإعارات، وبنود العقود الرسمية.' : 'Summer & winter window deals, loans, and official contracts.'}
            </p>
          </div>
        </div>
        <Link href="/transfers" className={styles.arenaFooterLink}>
          <span>{ar ? 'مركز الانتقالات بالكامل ←' : 'All Transfers Hub →'}</span>
        </Link>
      </div>

      <div className={styles.transferGrid}>
        {rows.map((row) => {
          const badge = transferTone(row.kind, locale);
          return (
            <Link key={row.id} href={`/player/${row.playerSlug}`} className={styles.transferCard}>
              <div className={styles.transferCardTop}>
                <div className={styles.personFaceWrap}>
                  {row.playerPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={row.playerPhoto} alt={row.playerName} className={styles.personFace} />
                  ) : (
                    <span className={styles.personFallback}>{row.playerName.charAt(0)}</span>
                  )}
                </div>
                <div className={styles.transferPlayerMeta}>
                  <strong className={styles.transferPlayerName}>{row.playerName}</strong>
                  <span className={`${styles.transferBadge} ${badge.cls}`}>
                    <CheckCircle2 className="w-3 h-3 inline-block me-1" />
                    {badge.label}
                  </span>
                </div>
              </div>

              <div className={styles.transferRouteBox}>
                <div className={styles.transferClubCol}>
                  <span className={styles.transferClubRole}>{ar ? 'من' : 'From'}</span>
                  <strong className={styles.transferTeamName}>{row.fromTeam || (ar ? 'غير محدد' : 'N/A')}</strong>
                </div>

                <div className={styles.transferArrowBox}>
                  <span className={styles.transferArrow}>{ar ? '←' : '→'}</span>
                </div>

                <div className={styles.transferClubCol}>
                  <span className={styles.transferClubRole}>{ar ? 'إلى' : 'To'}</span>
                  <strong className={`${styles.transferTeamName} ${styles.transferTeamDest}`}>{row.toTeam || (ar ? 'غير محدد' : 'N/A')}</strong>
                </div>
              </div>

              <div className={styles.transferCardFooter}>
                <span className={styles.transferFeeText}>
                  {row.fee ? (
                    <>💰 {row.fee}</>
                  ) : (
                    <span className="text-emerald-500 font-bold">{ar ? 'قيمة غير معلنة' : 'Undisclosed'}</span>
                  )}
                </span>
                <span className={styles.transferViewLink}>
                  {ar ? 'تفاصيل اللاعب' : 'Profile'}
                  <ArrowUpRight className="w-3.5 h-3.5 inline-block ms-1" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
