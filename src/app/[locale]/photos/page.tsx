import { Suspense } from 'react';
import type { Metadata } from 'next';
import { FrontSkeleton } from '@/components/front/FrontMark';
import { getLocale } from 'next-intl/server';
import { pick } from '@/i18n/pick';
import { pageMetadata } from '@/lib/seo/site';
import { SalonStage } from '@/components/salon/SalonStage';
import { YoutubeFoyer } from '@/components/youtube/YoutubeFoyer';
import { PhotoHall } from '@/components/photos/PhotoHall';
import { PhotoNav } from '@/components/photos/PhotoNav';
import { PhotoBrief } from '@/components/photos/PhotoBrief';
import { loadPhotoFrames } from '@/lib/photos/load-frames';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return pageMetadata({
    locale,
    title: pick(locale, 'قاعة الصور', 'Photo salon'),
    description: pick(
      locale,
      'قاعة صور من التقارير المنشورة فقط. الإطار يصعد إلى الصالة، والتقرير يفتح من المصدر.',
      'A football photo salon from published reports only. Raise a frame, then open the story from the source.',
    ),
    path: '/photos',
  });
}

export default function PhotosPage() {
  return (
    <Suspense fallback={<FrontSkeleton kind="hero" />}>
      <PhotosPageBody />
    </Suspense>
  );
}

async function PhotosPageBody() {
  const locale = await getLocale();
  const frames = await loadPhotoFrames(locale);
  const sources = new Set(frames.map((frame) => frame.sourceName).filter(Boolean)).size;

  return (
    <SalonStage
      tone="frame"
      wide
      compact
      kicker={pick(locale, 'قاعة الصور', 'Photo salon')}
      title={pick(locale, 'الصور', 'Photos')}
      lead={pick(
        locale,
        'إطارات من التقارير المعتمدة. اضغط الصورة فتُعرض على الصالة، وافتح التقرير من المصدر.',
        'Prints from approved reports. Tap a frame onto the easel, then open the story from the source.',
      )}
      aside={pick(locale, `${frames.length} إطار`, `${frames.length} frames`)}
      tools={
        <YoutubeFoyer>
          <PhotoNav locale={locale} />
          <PhotoBrief locale={locale} frames={frames.length} sources={sources} />
        </YoutubeFoyer>
      }
    >
      <PhotoHall
        locale={locale}
        frames={frames}
        emptyTitle={pick(locale, 'القاعة مظلمة الآن', 'The hall is dark for now')}
        emptyLead={pick(locale, 'ما في صور من تقارير منشورة حالياً.', 'No photos from published reports yet.')}
      />
    </SalonStage>
  );
}
