import { getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { loadFrontStories } from '@/lib/front/load-stories';
import { loadFrontBoard } from '@/lib/front/load-board';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { ClientTime } from '@/components/datetime/ClientTime';
import { isLiveStatus } from '@/lib/sports-data/match-window';
import { deskLabel } from '@/lib/news/desks';
import { Flame, Radio, Sparkles, Trophy, ChevronLeft, ArrowUpRight, Zap, ShieldCheck } from 'lucide-react';
import styles from './front-hero-live.module.css';

export async function FrontTopHero() {
  const locale = await getLocale();
  const ar = locale === 'ar';
  const [{ lead }, board] = await Promise.all([
    loadFrontStories(locale),
    loadFrontBoard(locale),
  ]);

  if (!lead) return null;
  const heroStory = lead;
  const miniMatches = board.slice(0, 3);
  const liveCount = board.filter((m) => isLiveStatus(m.status)).length;

  return (
    <section className={styles.topHeroContainer} aria-label={ar ? 'واجهة البطولة والقمة' : 'Hero headline & Match center'}>
      <div className={styles.heroMasterGrid}>
        
        {/* 🎬 1. البوابة السينمائية لخبر القمة (Cinematic Story Portal) */}
        <Link href={`/news/${heroStory.slug}`} className={styles.cinematicStoryPortal}>
          <div className={styles.cinematicImageLayer}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroStory.image || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80'}
              alt={heroStory.title}
              className={styles.cinematicHeroImg}
              referrerPolicy="no-referrer"
            />
            <div className={styles.cinematicGradientVeil} />
          </div>

          <div className={styles.cinematicStoryContent}>
            <div className={styles.cyberBadgeCluster}>
              <span className={styles.cyberBadgeCategory}>
                <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                {deskLabel(heroStory.category, locale) || (ar ? 'خبر القمة' : 'Top Headline')}
              </span>
              <span className={styles.cyberBadgeSource}>
                <span className={styles.verifiedDot} />
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 inline-block me-1" />
                {heroStory.sourceName}
              </span>
            </div>

            <h1 className={styles.cinematicTitle}>{heroStory.title}</h1>
            {heroStory.excerpt ? <p className={styles.cinematicExcerpt}>{heroStory.excerpt}</p> : null}

            <div className={styles.cinematicActionRow}>
              <span className={styles.cinematicTimeText}>
                <ClientTime value={heroStory.publishedAt} locale={locale} />
              </span>
              <span className={styles.cinematicReadBtn}>
                <span>{ar ? 'تغطية التقرير الشامل' : 'Full Coverage'}</span>
                <ChevronLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
              </span>
            </div>
          </div>
        </Link>

        {/* 👑 2. مقصورة يلا سبورت VIP وغرفة العمليات (VIP Coverage Desk) */}
        <div className={styles.vipSpotlightCard}>
          <div className={styles.vipBackgroundAura} />
          
          <div className={styles.vipHeaderRow}>
            <span className={styles.vipBadge}>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              {ar ? 'يلا سبورت VIP' : 'Yalla Sport VIP'}
            </span>
            <span className={styles.vipLiveStatusPill}>
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              {liveCount > 0 ? (ar ? `${liveCount} مباشر الآن` : `${liveCount} Live Matches`) : (ar ? 'تغطية 24/7' : '24/7 Coverage')}
            </span>
          </div>

          <div className={styles.vipCenterHero}>
            <div className={styles.vipIconOrb}>
              <Trophy className="w-7 h-7 text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]" />
            </div>
            <h3 className={styles.vipCenterTitle}>
              {ar ? 'مركز البث وغرفة العمليات' : 'Live Operations Hub'}
            </h3>
            <p className={styles.vipCenterSubtitle}>
              {ar ? 'أسرع تحديث حي للأهداف، التشكيلات الرسمية، وجداول الترتيب لحظة بلحظة.' : 'Fastest live updates, confirmed lineups, and instant table rankings.'}
            </p>
          </div>

          <div className={styles.vipQuickActionList}>
            <Link href="/live" className={styles.vipActionLink}>
              <span className="inline-flex items-center gap-2">
                <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                <span>{ar ? 'جدول البث الحي والمباريات' : 'Live Match Stream'}</span>
              </span>
              <ArrowUpRight className="w-4 h-4 text-amber-400 opacity-80" />
            </Link>

            <Link href="/matches" className={styles.vipActionLink}>
              <span className="inline-flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>{ar ? 'جدول مباريات اليوم والنتائج' : "Today's Matches"}</span>
              </span>
              <ArrowUpRight className="w-4 h-4 text-amber-400 opacity-80" />
            </Link>
          </div>
        </div>
      </div>

      {/* ⚽ 3. شريط كبسولات مباريات الجولة الثلاثية (3 Mini Match Capsules) */}
      {miniMatches.length > 0 ? (
        <div className={styles.miniMatchesGrid}>
          {miniMatches.map((m) => {
            const live = isLiveStatus(m.status);
            const finished = m.status === 'FINISHED';
            return (
              <Link
                key={m.id}
                href={`/match/${m.id}`}
                className={`${styles.miniMatchCapsule} ${live ? styles.miniMatchCapsuleLive : ''}`}
              >
                <div className={styles.miniTeamWrap}>
                  <LeagueCrest name={m.homeTeam.name} logoUrl={m.homeTeam.logoUrl} className="h-6 w-6 shrink-0" />
                  <span className={styles.miniTeamTitle}>{m.homeTeam.name}</span>
                </div>

                <div className={styles.miniCenterScoreBlock}>
                  <span className={`${styles.miniScoreDigit} ${live ? styles.miniScoreDigitLive : ''}`}>
                    {live || finished ? `${m.homeScore ?? 0} : ${m.awayScore ?? 0}` : 'VS'}
                  </span>
                  <span className={`${styles.miniStatusSubTag} ${live ? styles.miniStatusSubTagLive : ''}`}>
                    {live ? (
                      <>
                        <span className={styles.pulsingRadarDot} style={{ width: '0.35rem', height: '0.35rem' }} />
                        {m.minute != null ? `${m.minute}′` : ar ? 'مباشر' : 'LIVE'}
                      </>
                    ) : finished ? (
                      ar ? 'انتهت' : 'FT'
                    ) : (
                      <ClientTime value={m.kickoffAt} options={{ hour: '2-digit', minute: '2-digit' }} />
                    )}
                  </span>
                </div>

                <div className={`${styles.miniTeamWrap} ${styles.miniTeamAway}`}>
                  <span className={styles.miniTeamTitle}>{m.awayTeam.name}</span>
                  <LeagueCrest name={m.awayTeam.name} logoUrl={m.awayTeam.logoUrl} className="h-6 w-6 shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
