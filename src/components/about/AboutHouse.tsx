import { cookies } from 'next/headers';
import { BrandMark } from '@/components/brand/BrandMark';
import { TicketBarcode, WaxSeal } from '@/components/decor/CraftMarks';
import { DeskRule, EditionPlate, PhotoCorners } from '@/components/news/NewsOrnaments';
import { Link } from '@/i18n/navigation';
import { prisma } from '@/lib/prisma';
import { newsVisibleWhere } from '@/lib/i18n/localized-content';
import { dateKeyInTimezone, dayBoundsInTimezone, normalizeTimezone } from '@/lib/datetime/format';
import { CONTACT_EMAIL } from '@/lib/seo/site';
import { getLocale, getTranslations } from 'next-intl/server';
import { AboutHeroMotion, AboutItem, AboutReveal, AboutStagger } from './AboutMotion';

export async function AboutHouse() {
  const t = await getTranslations('about');
  const locale = await getLocale();
  const timezone = normalizeTimezone((await cookies()).get('yalla-tz')?.value);
  const todayKey = dateKeyInTimezone(new Date(), timezone);
  const { start, end } = dayBoundsInTimezone(todayKey, timezone);
  const year = new Date().getFullYear();

  const [leagues, stories, fixtures, channels, assets, teams, players, live, liveRows] = await Promise.all([
    prisma.league.count(),
    prisma.news.count({ where: newsVisibleWhere(locale) }),
    prisma.match.count({ where: { kickoffAt: { gte: start, lte: end } } }),
    prisma.channel.count(),
    prisma.streamAsset.count(),
    prisma.team.count(),
    prisma.player.count(),
    prisma.match.count({ where: { status: 'LIVE' } }),
    prisma.match.findMany({
      where: { status: 'LIVE' },
      take: 4,
      orderBy: { kickoffAt: 'asc' },
      select: {
        id: true,
        minute: true,
        homeScore: true,
        awayScore: true,
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
        league: { select: { name: true } },
      },
    }),
  ]);

  const rules = [
    { no: '01', title: t('rule_1_title'), body: t('rule_1_body') },
    { no: '02', title: t('rule_2_title'), body: t('rule_2_body') },
    { no: '03', title: t('rule_3_title'), body: t('rule_3_body') },
    { no: '04', title: t('rule_4_title'), body: t('rule_4_body') },
  ];

  const flow = [
    { no: 'I', title: t('flow_1_title'), body: t('flow_1_body') },
    { no: 'II', title: t('flow_2_title'), body: t('flow_2_body') },
    { no: 'III', title: t('flow_3_title'), body: t('flow_3_body') },
  ];

  const tally = [
    { value: live, label: t('tally_live'), href: '/live' as const, accent: true },
    { value: fixtures, label: t('tally_today'), href: '/matches' as const },
    { value: leagues, label: t('tally_leagues'), href: '/leagues' as const },
    { value: teams, label: t('tally_teams'), href: '/search' as const },
    { value: players, label: t('tally_players'), href: '/search' as const },
    { value: stories, label: t('tally_news'), href: '/news' as const },
    { value: channels, label: t('tally_channels'), href: '/tv-guide' as const },
    { value: assets, label: t('tally_assets'), href: '/watch' as const },
  ];

  const principles = [
    { no: '01', title: t('coverage'), body: t('coverage_desc') },
    { no: '02', title: t('accuracy'), body: t('accuracy_desc') },
    { no: '03', title: t('community'), body: t('community_desc') },
    { no: '04', title: t('quality'), body: t('quality_desc') },
  ];

  const wings = [
    { no: '01', title: t('wing_1_title'), body: t('wing_1_body') },
    { no: '02', title: t('wing_2_title'), body: t('wing_2_body') },
    { no: '03', title: t('wing_3_title'), body: t('wing_3_body') },
    { no: '04', title: t('wing_4_title'), body: t('wing_4_body') },
  ];

  const rooms = [
    { href: '/matches' as const, title: t('door_matches'), hint: t('door_matches_hint') },
    { href: '/leagues' as const, title: t('door_leagues'), hint: t('door_leagues_hint') },
    { href: '/news' as const, title: t('door_news'), hint: t('door_news_hint') },
    { href: '/live' as const, title: t('door_live'), hint: t('door_live_hint') },
    { href: '/watch' as const, title: t('door_watch'), hint: t('door_watch_hint') },
    { href: '/tv-guide' as const, title: t('door_guide'), hint: t('door_guide_hint') },
    { href: '/leaderboard' as const, title: t('door_board'), hint: t('door_board_hint') },
    { href: '/search' as const, title: t('door_search'), hint: t('door_search_hint') },
    { href: '/compare' as const, title: t('door_compare'), hint: t('door_compare_hint') },
    { href: '/contact' as const, title: t('door_contact'), hint: t('door_contact_hint') },
  ];

  const legal = [
    { href: '/privacy' as const, title: t('legal_privacy') },
    { href: '/terms' as const, title: t('legal_terms') },
    { href: '/copyright' as const, title: t('legal_copy') },
    { href: '/report' as const, title: t('legal_report') },
  ];

  const absence = [t('absence_1'), t('absence_2'), t('absence_3'), t('absence_4'), t('absence_5')];

  return (
    <div className="about-stage about-maison watch-booth relative min-h-screen pb-20">
      <span className="watch-drape" />
      <span className="watch-foil" aria-hidden />
      <span className="watch-ambient" aria-hidden />
      <span className="watch-corner is-tl" aria-hidden />
      <span className="watch-corner is-tr" aria-hidden />
      <span className="watch-corner is-bl" aria-hidden />
      <span className="watch-corner is-br" aria-hidden />
      <span className="about-maison-beam" aria-hidden />
      <span className="about-maison-beam is-late" aria-hidden />

      <header className="about-maison-hero relative z-10" data-ys-motion-manual="1">
        <AboutHeroMotion>
          <div className="about-maison-frame">
            <PhotoCorners className="about-hero-corners" />
            <div className="about-maison-filament" aria-hidden />

            <div className="about-maison-top">
              <div className="about-maison-brand">
                <BrandMark size={56} priority />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="about-maison-kicker">{t('kicker')}</p>
                    <EditionPlate year={year} label={t('folio')} className="watch-edition" />
                  </div>
                  <p className="about-maison-house">
                    {t('house')} · {t('since')}
                  </p>
                </div>
              </div>

              <div className="about-maison-seal-stack">
                <WaxSeal label={t('seal')} className="about-seal" />
                <TicketBarcode className="text-[#e8b48a]/45" />
              </div>
            </div>

            <div className="about-maison-title-block">
              <p className="about-maison-eyebrow">Yalla Sport</p>
              <h1 className="about-maison-wordmark">{t('title')}</h1>
              <p className="about-maison-headline">{t('headline')}</p>
              <p className="about-maison-lead">{t('standfirst')}</p>
              <DeskRule className="mt-6 max-w-xs opacity-40" />
              <div className="about-maison-cta">
                <Link href="/contact" className="watch-chip-link is-solid">
                  {t('letter_cta')}
                </Link>
                <a className="watch-chip-link is-ghost" href={`mailto:${CONTACT_EMAIL}`}>
                  {CONTACT_EMAIL}
                </a>
              </div>
            </div>

            <aside className="about-maison-pull">
              <span className="about-maison-pull-mark" aria-hidden>
                ”
              </span>
              <blockquote>
                <p>{t('quote')}</p>
              </blockquote>
              <p className="about-maison-date">{todayKey}</p>
            </aside>
          </div>
        </AboutHeroMotion>
      </header>

      <AboutReveal className="about-maison-band relative z-10">
        <article className="about-maison-vision is-vision">
          <em>01</em>
          <div>
            <p className="about-plate-kicker">{t('vision')}</p>
            <h2>{t('vision')}</h2>
            <p>{t('vision_text')}</p>
          </div>
        </article>
        <article className="about-maison-vision is-mission">
          <em>02</em>
          <div>
            <p className="about-plate-kicker">{t('mission')}</p>
            <h2>{t('mission')}</h2>
            <p>{t('mission_text')}</p>
          </div>
        </article>
      </AboutReveal>

      <AboutReveal className="about-maison-panel relative z-10" id="desk">
        <div className="about-maison-panel-head">
          <span>01</span>
          <div>
            <h2>{t('desk_title')}</h2>
            <p>{t('desk_note')}</p>
          </div>
          <span className="about-live-chip">
            <i />
            {live} {t('tally_live')}
          </span>
        </div>

        <AboutStagger className="about-maison-metrics" delay={0.04}>
          {tally.map((item) => (
            <AboutItem key={item.href + item.label}>
              <Link href={item.href} className={`about-maison-metric${item.accent ? ' is-live' : ''}`}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </Link>
            </AboutItem>
          ))}
        </AboutStagger>

        <div className="about-maison-wire">
          <p>{t('desk_kicker')}</p>
          {liveRows.length > 0 ? (
            <ul>
              {liveRows.map((row) => {
                const scored = row.homeScore != null && row.awayScore != null;
                return (
                  <li key={row.id}>
                    <em>{row.league.name}</em>
                    <Link href={`/match/${row.id}`}>
                      {row.homeTeam.name}{' '}
                      <b>{scored ? `${row.homeScore}–${row.awayScore}` : '—'}</b>{' '}
                      {row.awayTeam.name}
                    </Link>
                    <span>{row.minute != null ? `${row.minute}′` : ''}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="about-empty">{t('desk_empty')}</p>
          )}
        </div>
      </AboutReveal>

      <AboutReveal className="about-maison-panel relative z-10">
        <div className="about-maison-panel-head">
          <span>02</span>
          <div>
            <h2>{t('pillars_title')}</h2>
            <p>{t('pillars_note')}</p>
          </div>
        </div>
        <AboutStagger className="about-maison-pillars">
          {principles.map((item) => (
            <AboutItem key={item.no}>
              <article className="about-maison-pillar">
                <b>{item.no}</b>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            </AboutItem>
          ))}
        </AboutStagger>
      </AboutReveal>

      <div className="about-maison-duo relative z-10">
        <AboutReveal className="about-maison-panel" id="charter">
          <div className="about-maison-panel-head">
            <span>03</span>
            <div>
              <h2>{t('rules_title')}</h2>
              <p>{t('rules_kicker')}</p>
            </div>
          </div>
          <AboutStagger className="about-maison-rules">
            {rules.map((rule) => (
              <AboutItem key={rule.no}>
                <article>
                  <span>{rule.no}</span>
                  <h3>{rule.title}</h3>
                  <p>{rule.body}</p>
                </article>
              </AboutItem>
            ))}
          </AboutStagger>
        </AboutReveal>

        <AboutReveal className="about-maison-panel" id="flow">
          <div className="about-maison-panel-head">
            <span>04</span>
            <div>
              <h2>{t('flow_title')}</h2>
              <p>{t('flow_kicker')}</p>
            </div>
          </div>
          <AboutStagger className="about-maison-flow">
            {flow.map((step) => (
              <AboutItem key={step.no}>
                <article>
                  <em>{step.no}</em>
                  <strong>{step.title}</strong>
                  <p>{step.body}</p>
                </article>
              </AboutItem>
            ))}
          </AboutStagger>
        </AboutReveal>
      </div>

      <AboutReveal className="about-maison-panel relative z-10" id="wings">
        <div className="about-maison-panel-head">
          <span>05</span>
          <div>
            <h2>{t('wings_title')}</h2>
            <p>{t('wings_kicker')}</p>
          </div>
        </div>
        <AboutStagger className="about-maison-wings">
          {wings.map((wing) => (
            <AboutItem key={wing.no}>
              <article>
                <span>{wing.no}</span>
                <h3>{wing.title}</h3>
                <p>{wing.body}</p>
              </article>
            </AboutItem>
          ))}
        </AboutStagger>
        <div className="about-maison-langs">
          <p className="about-plate-kicker">{t('langs_kicker')}</p>
          <h3>{t('langs_title')}</h3>
          <p>{t('langs_body')}</p>
        </div>
      </AboutReveal>

      <AboutReveal className="about-maison-panel relative z-10" id="rooms">
        <div className="about-maison-panel-head">
          <span>06</span>
          <div>
            <h2>{t('rooms_title')}</h2>
            <p>{t('rooms_kicker')}</p>
          </div>
        </div>
        <AboutStagger className="about-maison-rooms">
          {rooms.map((door, index) => (
            <AboutItem key={door.href}>
              <Link href={door.href} className="about-maison-room">
                <em>{String(index + 1).padStart(2, '0')}</em>
                <strong>{door.title}</strong>
                <span>{door.hint}</span>
              </Link>
            </AboutItem>
          ))}
        </AboutStagger>
      </AboutReveal>

      <AboutReveal className="about-maison-finale relative z-10">
        <article className="about-maison-panel">
          <p className="about-plate-kicker">{t('absence_kicker')}</p>
          <h2>{t('absence_title')}</h2>
          <ul className="about-absent">
            {absence.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="about-maison-panel" id="letter">
          <p className="about-plate-kicker">{t('letter_kicker')}</p>
          <h2>{t('letter_title')}</h2>
          <p>{t('letter_body')}</p>
          <a className="about-mail" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          <Link href="/contact" className="watch-chip-link is-solid mt-4 inline-flex">
            {t('letter_cta')}
          </Link>
          <p className="about-plate-kicker mt-8">{t('legal_kicker')}</p>
          <h3 className="about-legal-title">{t('legal_title')}</h3>
          <div className="about-legal">
            {legal.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.title}
              </Link>
            ))}
          </div>
        </article>
      </AboutReveal>

      <p className="about-colo relative z-10">
        {t('colo_print')} · {locale.toUpperCase()} · {timezone}
      </p>
    </div>
  );
}
