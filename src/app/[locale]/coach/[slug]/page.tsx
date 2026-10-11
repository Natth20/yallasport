import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { JsonLd } from '@/components/seo/JsonLd';
import { CoachDossier } from '@/components/coaches/CoachDossier';
import { loadCoachDossier } from '@/lib/coaches/load-dossier';
import { pick } from '@/i18n/pick';
import { localizePlainName } from '@/lib/i18n/sports-lexicon';
import { pageMetadata } from '@/lib/seo/site';
import { FrontSkeleton } from '@/components/front/FrontMark';
import { HallFoyer } from '@/components/salon/HallFoyer';
import { SalonStage } from '@/components/salon/SalonStage';
import { CalendarDays, Radio, Shield, Trophy } from 'lucide-react';

export const revalidate = 180;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const locale = await getLocale();
  const { slug } = await params;
  const dossier = await loadCoachDossier(slug);
  if (!dossier) {
    return pageMetadata({
      locale,
      title: pick(locale, 'المدرب', 'Coach'),
      description: pick(locale, 'ملف المدرب غير متاح.', 'This coach profile is unavailable.'),
      path: `/coach/${slug}`,
      noIndex: true,
    });
  }
  const name = localizePlainName(locale, dossier.coach.name);
  return pageMetadata({
    locale,
    title: name,
    description:
      dossier.coach.bio?.slice(0, 160) ||
      pick(
        locale,
        `ملف ${name} في يلا سبورت: المسيرة، الألقاب، ومواعيد النادي من المصدر الحقيقي.`,
        `${name} on Yalla Sport: career, honours, and club fixtures from the real source.`
      ),
    path: `/coach/${slug}`,
    images: [dossier.coach.photoUrl],
  });
}

export default function CoachPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<FrontSkeleton kind="hero" />}>
      <CoachPageBody params={params} />
    </Suspense>
  );
}

async function CoachPageBody({ params }: { params: Promise<{ slug: string }> }) {
  const locale = await getLocale();
  const { slug } = await params;
  const dossier = await loadCoachDossier(slug);
  if (!dossier) notFound();

  const coachSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: dossier.coach.name,
    description: dossier.coach.bio,
    image: dossier.coach.photoUrl,
    nationality: dossier.coach.nationality,
    memberOf: dossier.club
      ? {
        '@type': 'SportsTeam',
        name: dossier.club.name,
      }
      : undefined,
  };

  const serializedDossier = JSON.parse(JSON.stringify(dossier));

  return (
    <>
      <JsonLd data={coachSchema} />
      <CoachDossier locale={locale} dossier={serializedDossier} />
    </>
  );
}
