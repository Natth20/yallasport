import { Suspense } from 'react';
import { FrontSkeleton } from '@/components/front/FrontMark';
import { VersusHouse } from '@/components/versus/VersusHouse';
import { pick } from '@/i18n/pick';
import { localizeTeamName } from '@/lib/i18n/sports-lexicon';
import { prisma } from '@/lib/prisma';
import { pageMetadata } from '@/lib/seo/site';
import { getLocale } from 'next-intl/server';
import type { Metadata } from 'next';

export const revalidate = 60;

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
      'قارن ناديين: الأداء، المواجهات المباشرة، وآخر المباريات من المصدر فقط.',
      'Compare two clubs: form, head-to-head and recent matches from the source only.',
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
        ? pick(
          locale,
          `${localizeTeamName(locale, a.name)} ضد ${localizeTeamName(locale, b.name)} | مقارنة وإحصائيات ومواجهات`,
          `${localizeTeamName(locale, a.name)} vs ${localizeTeamName(locale, b.name)} | comparison and head-to-head`,
        )
        : a
          ? pick(locale, `مقارنة ${localizeTeamName(locale, a.name)}`, `Compare ${localizeTeamName(locale, a.name)}`)
          : pick(locale, 'مقارنة الأندية', 'Club comparison');
    return pageMetadata({
      locale,
      title,
      description: fallback.description as string,
      path: team1 && team2 ? `/compare?team1=${team1}&team2=${team2}` : '/compare',
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
