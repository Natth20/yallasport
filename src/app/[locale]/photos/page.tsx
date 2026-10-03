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
    title: pick(locale, 'الصور', 'Photos'),
    description: pick(
      locale,
      'صور من التقارير المنشورة فقط. افتح الصورة ثم التقرير من المصدر.',
      'Photos from published reports only. Open the image, then the story from the source.',
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
      kicker={pick(locale, 'الصور', 'Photos')}
      title={pick(locale, 'الصور', 'Photos')}
      lead={pick(
        locale,
        'صور من التقارير المعتمدة. اضغط الصورة للعرض، وافتح التقرير من المصدر.',
        'Photos from approved reports. Tap to view, then open the story from the source.',
      )}
      aside={pick(locale, `${frames.length} صورة`, `${frames.length} photos`)}
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
        emptyTitle={pick(locale, 'لا صور من التقارير بعد', 'No report photos yet')}
        emptyLead={pick(locale, 'عندما يصل تقرير منشور بصورة من المصدر تظهر هنا.', 'When a published report includes a source image, it appears here.')}
      />
    </SalonStage>
  );
}
