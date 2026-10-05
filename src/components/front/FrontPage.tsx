import { Suspense } from 'react';
import { getLocale } from 'next-intl/server';
import { loadFrontSources } from '@/lib/front/load-sources';
import { SiteAd } from '@/components/ads/SiteAd';
import { FrontSkeleton } from './FrontMark';
import { FrontLiveTicker } from './FrontLiveTicker';
import { FrontTopHero } from './FrontTopHero';
import { FrontDualArena } from './FrontDualArena';
import { FrontResultsStrip } from './FrontResultsStrip';
import { HomeFacts } from './HomeFacts';
import { FrontWatchNowBanner } from './FrontWatchNowBanner';
import { FrontTopNewsGrid } from './FrontTopNewsGrid';
import { FrontUniversalSearchBar } from './FrontUniversalSearchBar';
import { FrontLatestNewsGrid } from './FrontLatestNewsGrid';
import { FrontMajorLeagues } from './FrontMajorLeagues';
import { FrontTransfersRail } from './FrontTransfersRail';
import { FrontStarsToday } from './FrontStarsToday';
import { FrontStatsCards } from './FrontStatsCards';
import { FrontGoalsTape } from './FrontGoalsTape';
import { FrontFollowTeam } from './FrontFollowTeam';
import { FrontSportNewsBlock } from './FrontSportNewsBlock';
import { FrontVideoGrid } from './FrontVideoGrid';
import { FrontMediaStrip } from './FrontMediaStrip';
import { SquadsChapter } from './chapters/SquadsChapter';
import look from './front-design.module.css';

export const dynamic = 'force-dynamic';

export async function FrontPage() {
  const locale = await getLocale();
  const sources = await loadFrontSources();

  return (
    <div className={look.luxuryPage}>
      <div className={look.luxuryGlow} aria-hidden />
      <div className={look.luxuryInner}>

        {/* 🏆 الفصل الأول: التغطية المباشرة والبث الحي (Hero & Live Arena) */}
        <section className="space-y-6">
          <Suspense fallback={<FrontSkeleton kind="pulse" />}>
            <FrontLiveTicker />
          </Suspense>

          <Suspense fallback={<FrontSkeleton kind="hero" />}>
            <FrontTopHero />
          </Suspense>

          <Suspense fallback={<FrontSkeleton kind="chapter" />}>
            <FrontDualArena />
          </Suspense>
        </section>

        {/* 📰 الفصل الثاني: التغطية التحريرية والأخبار الرئيسية (Editorial & Main Stories) */}
        <section className="space-y-8 pt-4">
          <Suspense fallback={<FrontSkeleton kind="chapter" />}>
            <FrontTopNewsGrid />
          </Suspense>

          <FrontUniversalSearchBar locale={locale} sources={sources} />

          <Suspense fallback={<FrontSkeleton kind="chapter" />}>
            <FrontLatestNewsGrid />
          </Suspense>

          <Suspense fallback={<FrontSkeleton kind="chapter" />}>
            <FrontSportNewsBlock />
          </Suspense>
        </section>

        {/* 📢 إعلان الراعي الرسمي المعتمد */}
        <SiteAd placement="home-mid" locale={locale} />

        {/* ⚽ الفصل الثالث: البث الحي والدوريات الكبرى (Matchday Hub & Major Leagues) */}
        <section className="space-y-8 pt-4">
          <FrontWatchNowBanner />

          <Suspense fallback={<FrontSkeleton kind="pulse" />}>
            <FrontResultsStrip />
          </Suspense>

          <Suspense fallback={<FrontSkeleton kind="chapter" />}>
            <FrontMajorLeagues />
          </Suspense>
        </section>

        {/* 📊 الفصل الرابع: الانتقالات، نجوم اليوم والإحصائيات (Transfers, Stars & Stats) */}
        <section className="space-y-8 pt-4">
          <Suspense fallback={<FrontSkeleton kind="chapter" />}>
            <FrontTransfersRail />
          </Suspense>

          <Suspense fallback={<FrontSkeleton kind="chapter" />}>
            <FrontStarsToday />
          </Suspense>

          <Suspense fallback={<FrontSkeleton kind="pulse" />}>
            <FrontGoalsTape />
          </Suspense>

          <Suspense fallback={<FrontSkeleton kind="chapter" />}>
            <HomeFacts />
          </Suspense>

          <Suspense fallback={<FrontSkeleton kind="pulse" />}>
            <FrontStatsCards />
          </Suspense>
        </section>

        {/* 🎥 الفصل الخامس: الميديا، الفيديو والأندية المفضلة (Media & Fan Zone) */}
        <section className="space-y-8 pt-4 pb-8">
          <Suspense fallback={<FrontSkeleton kind="chapter" />}>
            <FrontVideoGrid />
          </Suspense>

          <Suspense fallback={<FrontSkeleton kind="chapter" />}>
            <FrontMediaStrip />
          </Suspense>

          <FrontFollowTeam />

          <Suspense fallback={<FrontSkeleton kind="chapter" />}>
            <SquadsChapter />
          </Suspense>
        </section>

      </div>
    </div>
  );
}

