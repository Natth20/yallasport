import { Suspense } from 'react';
import { getLocale, getTranslations } from 'next-intl/server';
import { FrontSkeleton } from './FrontMark';
import { HomeScreen } from './HomeScreen';
import { HomeExhibit } from './HomeExhibit';
import { HomeRibbon } from './HomeRibbon';
import { HomeDesk } from './HomeDesk';
import { HomeWhistle } from './HomeWhistle';
import { HomeFacts } from './HomeFacts';
import { HomeTape } from './HomeTape';
import { HomePitch } from './HomePitch';
import { HomeGuide } from './HomeGuide';
import { StoriesChapter } from './chapters/StoriesChapter';
import { ReelsChapter } from './chapters/ReelsChapter';
import { PhotosChapter } from './chapters/PhotosChapter';
import { VideoChapter } from './chapters/VideoChapter';
import { SalonStage } from '@/components/salon/SalonStage';
import { pick } from '@/i18n/pick';
import styles from './home-salon.module.css';

export async function FrontPage() {
  const locale = await getLocale();
  const t = await getTranslations('front');

  return (
    <SalonStage
      tone="booth"
      wide
      kicker={t('kicker')}
      title={pick(locale, 'صالة اليوم', "Today's salon")}
      lead={t('standfirst')}
      aside={t('source_seal')}
    >
      <div className={styles.salon}>
        <Suspense fallback={<FrontSkeleton kind="hero" />}>
          <HomeScreen />
        </Suspense>
        <Suspense fallback={<FrontSkeleton kind="chapter" />}>
          <HomeExhibit />
        </Suspense>
        <Suspense fallback={<FrontSkeleton kind="pulse" />}>
          <HomeRibbon />
        </Suspense>
        <Suspense fallback={<FrontSkeleton kind="chapter" />}>
          <HomeDesk />
        </Suspense>
        <Suspense fallback={<FrontSkeleton kind="chapter" />}>
          <HomeWhistle />
        </Suspense>
        <div className={styles.folio}>
          <Suspense fallback={<FrontSkeleton kind="chapter" />}>
            <HomeFacts />
          </Suspense>
          <Suspense fallback={<FrontSkeleton kind="chapter" />}>
            <HomeTape />
          </Suspense>
          <Suspense fallback={<FrontSkeleton kind="chapter" />}>
            <StoriesChapter />
          </Suspense>
          <Suspense fallback={<FrontSkeleton kind="chapter" />}>
            <HomePitch />
          </Suspense>
          <Suspense fallback={<FrontSkeleton kind="chapter" />}>
            <HomeGuide />
          </Suspense>
          <Suspense fallback={<FrontSkeleton kind="chapter" />}>
            <ReelsChapter />
          </Suspense>
          <Suspense fallback={<FrontSkeleton kind="chapter" />}>
            <PhotosChapter />
          </Suspense>
          <Suspense fallback={<FrontSkeleton kind="chapter" />}>
            <VideoChapter />
          </Suspense>
        </div>
      </div>
    </SalonStage>
  );
}
