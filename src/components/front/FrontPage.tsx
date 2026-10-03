import { Suspense } from 'react';
import { getLocale, getTranslations } from 'next-intl/server';
import { FrontSkeleton } from './FrontMark';
import { FrontStage } from './FrontStage';
import { HomeDesk } from './HomeDesk';
import { HomeWhistle } from './HomeWhistle';
import { HomeFacts } from './HomeFacts';
import { HomeTape } from './HomeTape';
import { HomePitch } from './HomePitch';
import { HomeGuide } from './HomeGuide';
import { StoriesChapter } from './chapters/StoriesChapter';
import { StoriesLatest } from './chapters/StoriesLatest';
import { ReelsChapter } from './chapters/ReelsChapter';
import { PhotosChapter } from './chapters/PhotosChapter';
import { VideoChapter } from './chapters/VideoChapter';
import { TransfersChapter } from './chapters/TransfersChapter';
import { ScorersChapter } from './chapters/ScorersChapter';
import { PersonalBand } from './chapters/PersonalBand';
import { SquadsChapter } from './chapters/SquadsChapter';
import { HomeBrief } from './HomeBrief';
import { SalonStage } from '@/components/salon/SalonStage';
import { pick } from '@/i18n/pick';
import { SiteAd } from '@/components/ads/SiteAd';
import styles from './home-salon.module.css';

export async function FrontPage() {
  const locale = await getLocale();
  const t = await getTranslations('front');

  return (
    <SalonStage
      tone="booth"
      wide
      kicker={t('kicker')}
      title={pick(locale, 'اليوم', 'Today')}
      lead={t('standfirst')}
      aside={t('source_seal')}
    >
      <div className={styles.salon}>
        <Suspense fallback={<FrontSkeleton kind="hero" />}>
          <FrontStage />
        </Suspense>
        <SiteAd placement="home-mid" locale={locale} />
        <Suspense fallback={<FrontSkeleton kind="chapter" />}>
          <HomeDesk />
        </Suspense>
        <Suspense fallback={<FrontSkeleton kind="chapter" />}>
          <StoriesChapter />
        </Suspense>
        <Suspense fallback={<FrontSkeleton kind="chapter" />}>
          <StoriesLatest />
        </Suspense>
        <Suspense fallback={<FrontSkeleton kind="chapter" />}>
          <HomeWhistle />
        </Suspense>
        <div className={styles.folio}>
          <Suspense fallback={<FrontSkeleton kind="chapter" />}>
            <HomePitch />
          </Suspense>
          <Suspense fallback={<FrontSkeleton kind="chapter" />}>
            <TransfersChapter />
          </Suspense>
          <Suspense fallback={<FrontSkeleton kind="chapter" />}>
            <ScorersChapter />
          </Suspense>
          <Suspense fallback={<FrontSkeleton kind="chapter" />}>
            <HomeFacts />
          </Suspense>
          <Suspense fallback={<FrontSkeleton kind="chapter" />}>
            <HomeTape />
          </Suspense>
          <Suspense fallback={<FrontSkeleton kind="chapter" />}>
            <PersonalBand />
          </Suspense>
          <Suspense fallback={<FrontSkeleton kind="chapter" />}>
            <HomeGuide />
          </Suspense>
          <Suspense fallback={<FrontSkeleton kind="chapter" />}>
            <VideoChapter />
          </Suspense>
          <Suspense fallback={<FrontSkeleton kind="chapter" />}>
            <ReelsChapter />
          </Suspense>
          <Suspense fallback={<FrontSkeleton kind="chapter" />}>
            <PhotosChapter />
          </Suspense>
          <Suspense fallback={<FrontSkeleton kind="chapter" />}>
            <SquadsChapter />
          </Suspense>
          <HomeBrief locale={locale} />
        </div>
      </div>
    </SalonStage>
  );
}
