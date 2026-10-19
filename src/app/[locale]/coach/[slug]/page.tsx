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

  const coachName = localizePlainName(locale, dossier.coach.name);

  const coachSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: coachName,
    alternateName: dossier.coach.name !== coachName ? dossier.coach.name : undefined,
    jobTitle: 'Football Manager',
    description: dossier.coach.bio || undefined,
    image: dossier.coach.photoUrl,
    nationality: dossier.coach.nationality,
    ...(dossier.coach.birthDate ? { birthDate: new Date(dossier.coach.birthDate).toISOString().slice(0, 10) } : {}),
    ...(dossier.coach.birthPlace ? { birthPlace: { '@type': 'Place', name: dossier.coach.birthPlace } } : {}),
    ...(dossier.club
      ? {
        memberOf: {
          '@type': 'SportsTeam',
          name: dossier.club.name,
          ...(dossier.club.slug ? { url: `https://yallasport.com/${locale}/team/${dossier.club.slug}` } : {}),
        },
      }
      : undefined),
    ...(dossier.trophies?.length
      ? { award: dossier.trophies.slice(0, 10).map((t) => `${t.title} (${t.season})`) }
      : {}),
  };

  const breadcrumbsSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: pick(locale, 'الرئيسية', 'Home'),
        item: `https://yallasport.com/${locale}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: pick(locale, 'المدربون', 'Coaches'),
        item: `https://yallasport.com/${locale}/coaches`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: coachName,
        item: `https://yallasport.com/${locale}/coach/${slug}`,
      },
    ],
  };

  const serializedDossier = JSON.parse(JSON.stringify(dossier));

  return (
    <>
      <JsonLd data={coachSchema} />
      <JsonLd data={breadcrumbsSchema} />
      <CoachDossier locale={locale} dossier={serializedDossier} />
    </>
  );
}
