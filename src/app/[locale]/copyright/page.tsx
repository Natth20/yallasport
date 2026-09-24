import { Suspense } from 'react';
import { getLocale } from 'next-intl/server';
import { FrontSkeleton } from '@/components/front/FrontMark';
import { pick } from '@/i18n/pick';
import { CopyrightMark } from '@/components/legal/CopyrightMark';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo/site';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return pageMetadata({
    locale,
    title: pick(locale, 'حقوق النشر', 'Copyright'),
    description: pick(
      locale,
      'ما تملكه يلا سبورت، وما يبقى للأندية ومزود البيانات وصاحب البث، وكيف تبلّغ عن انتهاك دون نموذج وهمي.',
      'What Yalla Sport owns, what remains with clubs, the data provider and the rights holder, and how to notice infringement without a dummy form.'
    ),
    path: '/copyright',
  });
}

export default function CopyrightPage() {
  return (
    <Suspense fallback={<FrontSkeleton kind="hero" />}>
      <CopyrightPageBody />
    </Suspense>
  );
}

async function CopyrightPageBody() {
  const locale = await getLocale();
  return <CopyrightMark locale={locale} />;
}
