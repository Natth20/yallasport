import { Suspense } from 'react';
import { FrontStage } from './FrontStage';
import { FrontSkeleton } from './FrontMark';
import { BoardChapter } from './chapters/BoardChapter';
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
import './front-hall.css';

export function FrontPage() {
  return (
    <div className="fp">
      <Suspense fallback={<FrontSkeleton kind="hero" />}>
        <FrontStage />
      </Suspense>
      <div className="fp-inner">
        <Suspense fallback={<FrontSkeleton kind="chapter" />}>
          <BoardChapter />
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
    </div>
  );
}
