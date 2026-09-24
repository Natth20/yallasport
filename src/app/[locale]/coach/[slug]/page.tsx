import { swallow } from '@/lib/ops/caught';
import React, { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { slugifyCoachName } from '@/lib/coaches/slug';
import { JsonLd } from '@/components/seo/JsonLd';
import { getLocale } from 'next-intl/server';
import { pick } from '@/i18n/pick';
import { Link } from '@/i18n/navigation';
import { localizePlainName } from '@/lib/i18n/sports-lexicon';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { FrontSkeleton } from '@/components/front/FrontMark';
import { EntityBody, EntityBrand, EntityFrame, EntityHero } from '@/components/entity/EntityFrame';

type CareerStint = {
  club: string;
  role?: string;
  from?: string;
  to?: string;
  matches?: number;
  winRate?: number;
};

function parseCareer(raw: unknown): CareerStint[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const club = typeof row.club === 'string' ? row.club : typeof row.team === 'string' ? row.team : null;
      if (!club) return null;
      return {
        club,
        role: typeof row.role === 'string' ? row.role : undefined,
        from: typeof row.from === 'string' ? row.from : undefined,
        to: typeof row.to === 'string' ? row.to : undefined,
        matches: typeof row.matches === 'number' ? row.matches : undefined,
        winRate: typeof row.winRate === 'number' ? row.winRate : undefined,
      };
    })
    .filter(Boolean) as CareerStint[];
}

function Head({ title, note }: { title: string; note?: string }) {
  return (
    <header className="psheet-head">
      <h2>{title}</h2>
      {note ? <p>{note}</p> : null}
    </header>
  );
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
  const include = {
    currentTeam: true,
    trophies: { orderBy: { createdAt: 'desc' as const } },
  };
  let coach = await prisma.coach.findUnique({
    where: { id: slug },
    include,
  });
  if (!coach) {
    const rows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "Coach" WHERE "slug" = ${slug} LIMIT 1
    `.catch(swallow("src/app/[locale]/coach/[slug]/page.tsx:32", []));
    if (rows[0]?.id) {
      coach = await prisma.coach.findUnique({ where: { id: rows[0].id }, include });
    }
  }
  if (!coach) {
    const tail = slug.slice(-8);
    if (/^[a-z0-9]{8}$/i.test(tail)) {
      const rows = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM "Coach" WHERE right(id, 8) = ${tail} LIMIT 1
      `.catch(swallow("src/app/[locale]/coach/[slug]/page.tsx:42", []));
      if (rows[0]?.id) {
        coach = await prisma.coach.findUnique({ where: { id: rows[0].id }, include });
      }
    }
  }

  if (!coach) notFound();

  const pretty = slugifyCoachName(coach.name, coach.id);
  if (coach.slug !== pretty) {
    await prisma.coach
      .update({ where: { id: coach.id }, data: { slug: pretty } })
      .catch(swallow("src/app/[locale]/coach/[slug]/page.tsx:52", null));
    redirect(`/${locale}/coach/${pretty}`);
  }

  const recentMatches = coach.currentTeam
    ? await prisma.match.findMany({
        where: {
          OR: [{ homeTeamId: coach.currentTeam.id }, { awayTeamId: coach.currentTeam.id }],
        },
        orderBy: { kickoffAt: 'desc' },
        take: 8,
        select: {
          id: true,
          status: true,
          homeScore: true,
          awayScore: true,
          kickoffAt: true,
          homeTeam: { select: { name: true, logoUrl: true } },
          awayTeam: { select: { name: true, logoUrl: true } },
          league: { select: { name: true } },
        },
      })
    : [];

  const career = parseCareer(coach.careerHistory);
  const name = localizePlainName(locale, coach.name);
  const nationality = coach.nationality ? localizePlainName(locale, coach.nationality) : null;
  const teamName = coach.currentTeam ? localizePlainName(locale, coach.currentTeam.name) : null;
  const birthLabel = coach.birthDate
    ? new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(coach.birthDate))
    : null;
  const age =
    coach.birthDate != null
      ? Math.max(
        0,
        Math.floor((Date.now() - new Date(coach.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
      )
      : null;

  const matchTotal = career.reduce((sum, stint) => sum + (typeof stint.matches === 'number' ? stint.matches : 0), 0);
  const rated = career.filter((stint) => typeof stint.winRate === 'number');
  const weighted = rated.filter((stint) => typeof stint.matches === 'number' && stint.matches > 0);
  const winRate =
    rated.length === 0
      ? null
      : weighted.length > 0
        ? Math.round(
          weighted.reduce((sum, stint) => sum + (stint.winRate as number) * (stint.matches as number), 0) /
          weighted.reduce((sum, stint) => sum + (stint.matches as number), 0),
        )
        : Math.round(rated.reduce((sum, stint) => sum + (stint.winRate as number), 0) / rated.length);

  const identity = [
    nationality ? { label: pick(locale, 'الجنسية', 'Nationality'), value: nationality } : null,
    birthLabel ? { label: pick(locale, 'الميلاد', 'Born'), value: birthLabel } : null,
    age != null ? { label: pick(locale, 'العمر', 'Age'), value: String(age) } : null,
    teamName ? { label: pick(locale, 'النادي', 'Club'), value: teamName } : null,
    career.length > 0 ? { label: pick(locale, 'محطات', 'Stints'), value: String(career.length) } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  const kpis = [
    matchTotal > 0 ? { label: pick(locale, 'مباريات المسيرة', 'Career matches'), value: matchTotal } : null,
    winRate != null ? { label: pick(locale, 'نسبة الفوز', 'Win rate'), value: `${winRate}%` } : null,
    coach.trophies.length > 0 ? { label: pick(locale, 'الألقاب', 'Honours'), value: coach.trophies.length } : null,
    career.length > 0 ? { label: pick(locale, 'الأندية', 'Clubs'), value: career.length } : null,
  ].filter(Boolean) as Array<{ label: string; value: string | number }>;

  const coachSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: coach.name,
    description: coach.bio,
    image: coach.photoUrl,
    nationality: coach.nationality,
    memberOf: coach.currentTeam
      ? {
        '@type': 'SportsTeam',
        name: coach.currentTeam.name,
      }
      : undefined,
  };

  return (
    <EntityFrame tone="coach">
    <div className="psheet">
      <JsonLd data={coachSchema} />
      <div className="psheet-inner">
        <EntityHero>
        <section className="psheet-hero">
          <div className="psheet-photo">
            {coach.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coach.photoUrl} alt="" />
            ) : (
              <span>{name.charAt(0)}</span>
            )}
          </div>
          <div className="psheet-intro">
            <EntityBrand kicker={pick(locale, 'دكة المدرب', 'The bench')} />
            <p className="psheet-kicker">{pick(locale, 'ملف المدرب', 'Coach')}</p>
            <h1>{name}</h1>
            <div className="psheet-chips">
              {coach.currentTeam ? (
                <Link href={`/team/${coach.currentTeam.slug}`} className="psheet-chip">
                  <LeagueCrest name={coach.currentTeam.name} logoUrl={coach.currentTeam.logoUrl} className="h-5 w-5" />
                  {teamName}
                </Link>
              ) : null}
              {nationality ? <span className="psheet-chip">{nationality}</span> : null}
            </div>
          </div>
          {identity.length > 0 ? (
            <dl className="psheet-facts psheet-hero-facts">
              {identity.map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </section>
        </EntityHero>

        <EntityBody>
        {kpis.length > 0 ? (
          <ul className="psheet-kpis" aria-label={pick(locale, 'أرقام المسيرة من المصدر', 'Career figures from the source')}>
            {kpis.map((row) => (
              <li key={row.label}>
                <strong>{row.value}</strong>
                <span>{row.label}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className={coach.trophies.length > 0 ? 'psheet-layout' : undefined}>
          <div className="psheet-main">
            {coach.bio ? (
              <section>
                <Head title={pick(locale, 'السيرة', 'Biography')} />
                <p className="tsheet-bio">{coach.bio}</p>
              </section>
            ) : null}

            {career.length > 0 ? (
              <section>
                <Head title={pick(locale, 'المسيرة التدريبية', 'Coaching career')} />
                <ul className="psheet-list">
                  {career.map((stint, index) => (
                    <li key={`${stint.club}-${stint.from || ''}-${index}`}>
                      <strong>{localizePlainName(locale, stint.club)}</strong>
                      <em>
                        {[
                          stint.role ? localizePlainName(locale, stint.role) : null,
                          stint.from,
                          stint.to || pick(locale, 'الآن', 'Present'),
                          typeof stint.matches === 'number' ? `${stint.matches} ${pick(locale, 'مباراة', 'apps')}` : null,
                          typeof stint.winRate === 'number' ? `${stint.winRate}%` : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </em>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {recentMatches.length > 0 ? (
              <section>
                <Head title={pick(locale, 'مع النادي الحالي', 'With the current club')} />
                <div className="bench-wire">
                  {recentMatches.map((match) => {
                    const scored = match.homeScore != null && match.awayScore != null;
                    return (
                      <Link key={match.id} href={`/match/${match.id}`}>
                        <span>
                          <strong>
                            {localizePlainName(locale, match.homeTeam.name)} × {localizePlainName(locale, match.awayTeam.name)}
                          </strong>
                          <em>{localizePlainName(locale, match.league.name)}</em>
                        </span>
                        <b>
                          {scored
                            ? `${match.homeScore}–${match.awayScore}`
                            : match.status === 'LIVE'
                              ? 'LIVE'
                              : pick(locale, 'موعد', 'Fixture')}
                        </b>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </div>

          {coach.trophies.length > 0 ? (
            <aside className="psheet-rail">
              <section>
                <Head title={pick(locale, 'الألقاب', 'Honours')} />
                <ul className="psheet-honours">
                  {coach.trophies.map((trophy) => (
                    <li key={trophy.id}>
                      <strong>{localizePlainName(locale, trophy.title)}</strong>
                      <em>
                        {[trophy.season, trophy.teamName ? localizePlainName(locale, trophy.teamName) : null]
                          .filter(Boolean)
                          .join(' · ')}
                      </em>
                    </li>
                  ))}
                </ul>
              </section>
            </aside>
          ) : null}
        </div>
        </EntityBody>
      </div>
    </div>
    </EntityFrame>
  );
}
