import { Suspense } from 'react';
import { FrontStage } from './FrontStage';
import { FrontSkeleton } from './FrontMark';
import { FrontArena } from './FrontArena';
import { StoriesChapter } from './chapters/StoriesChapter';
import { TablesChapter } from './chapters/TablesChapter';
import { ScorersChapter } from './chapters/ScorersChapter';
import { SquadsChapter } from './chapters/SquadsChapter';
import { TransfersChapter } from './chapters/TransfersChapter';
import { VideoChapter } from './chapters/VideoChapter';
import { PhotosChapter } from './chapters/PhotosChapter';
import { BroadcastChapter } from './chapters/BroadcastChapter';
import { PredictChapter } from './chapters/PredictChapter';
import { PersonalBand } from './chapters/PersonalBand';
import { DoorsChapter } from './chapters/DoorsChapter';
import { FrontFoyer } from './FrontFoyer';
import styles from './front-page.module.css';

export function FrontPage() {
  return (
    <div className={styles.root}>
      <Suspense fallback={<FrontSkeleton kind="hero" />}>
        <FrontStage />
      </Suspense>
      <Suspense fallback={<FrontSkeleton kind="pulse" />}>
        <FrontFoyer />
      </Suspense>
      <Suspense fallback={<FrontSkeleton kind="chapter" />}>
        <FrontArena />
      </Suspense>
      <Suspense fallback={<FrontSkeleton kind="chapter" />}>
        <StoriesChapter />
      </Suspense>
      <Suspense fallback={<FrontSkeleton kind="chapter" />}>
        <TablesChapter />
      </Suspense>
      <Suspense fallback={<FrontSkeleton kind="chapter" />}>
        <ScorersChapter />
      </Suspense>
      <Suspense fallback={<FrontSkeleton kind="chapter" />}>
        <SquadsChapter />
      </Suspense>
      <Suspense fallback={<FrontSkeleton kind="chapter" />}>
        <TransfersChapter />
      </Suspense>
      <Suspense fallback={<FrontSkeleton kind="chapter" />}>
        <VideoChapter />
      </Suspense>
      <Suspense fallback={<FrontSkeleton kind="chapter" />}>
        <PhotosChapter />
      </Suspense>
      <Suspense fallback={<FrontSkeleton kind="chapter" />}>
        <BroadcastChapter />
      </Suspense>
      <Suspense fallback={<FrontSkeleton kind="chapter" />}>
        <PredictChapter />
      </Suspense>
      <Suspense fallback={<FrontSkeleton kind="chapter" />}>
        <PersonalBand />
      </Suspense>
      <Suspense fallback={<FrontSkeleton kind="chapter" />}>
        <DoorsChapter />
      </Suspense>
    </div>
  );
}
