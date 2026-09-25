import { Suspense } from 'react';
import { FrontSkeleton } from '@/components/front/FrontMark';
import { VersusHouse } from '@/components/versus/VersusHouse';
import { pick } from '@/i18n/pick';
import { prisma } from '@/lib/prisma';
import { pageMetadata } from '@/lib/seo/site';
import { getLocale } from 'next-intl/server';
import type { Metadata } from 'next';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ team1?: string; team2?: string }>;
}): Promise<Metadata> {
  const locale = await getLocale();
  const fallback = pageMetadata({
    locale,
    title: pick(locale, 'مقارنة الفرق', 'Team comparison'),
    description: pick(
      locale,
      'ميزان مكتبي: فريقان من الدفتر، مواجهات منتهية كما سُجّلت، بلا رادار مخترع.',
      'A desk scale: two teams from the ledger, finished meetings as stored, no invented radar.',
    ),
    path: '/compare',
  });
  try {
    const { team1, team2 } = await searchParams;
    const [a, b] = await Promise.all([
      team1 ? prisma.team.findUnique({ where: { slug: team1 }, select: { name: true } }) : null,
      team2 ? prisma.team.findUnique({ where: { slug: team2 }, select: { name: true } }) : null,
    ]);
    const title =
      a && b
        ? `${a.name} × ${b.name}`
        : a
          ? pick(locale, `ميزان ${a.name}`, `Scale: ${a.name}`)
          : pick(locale, 'مقارنة الفرق', 'Team comparison');
    return pageMetadata({
      locale,
      title,
      description: fallback.description as string,
      path: '/compare',
    });
  } catch {
    return fallback;
  }
}

export default function ComparePage(props: {
  searchParams: Promise<{ team1?: string; team2?: string }>;
}) {
  return (
    <Suspense fallback={<FrontSkeleton kind="hero" />}>
      <ComparePageBody searchParams={props.searchParams} />
    </Suspense>
  );
}

async function ComparePageBody({
  searchParams,
}: {
  searchParams: Promise<{ team1?: string; team2?: string }>;
}) {
  const { team1, team2 } = await searchParams;
  return <VersusHouse team1={team1} team2={team2} />;
}
