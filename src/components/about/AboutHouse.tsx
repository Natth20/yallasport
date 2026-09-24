import { cookies } from 'next/headers';
import { BrandMark } from '@/components/brand/BrandMark';
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
    { value: live, label: t('tally_live'), href: '/live' as const, accent: true, icon: 'live' },
    { value: fixtures, label: t('tally_today'), href: '/matches' as const, icon: 'calendar' },
    { value: leagues, label: t('tally_leagues'), href: '/leagues' as const, icon: 'trophy' },
    { value: teams, label: t('tally_teams'), href: '/search' as const, icon: 'shield' },
    { value: players, label: t('tally_players'), href: '/search' as const, icon: 'users' },
    { value: stories, label: t('tally_news'), href: '/news' as const, icon: 'news' },
    { value: channels, label: t('tally_channels'), href: '/tv-guide' as const, icon: 'tv' },
    { value: assets, label: t('tally_assets'), href: '/watch' as const, icon: 'play' },
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
    <div className="relative min-h-screen pb-24 overflow-hidden">
      {/* Dynamic Background Lighting */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-full max-w-7xl rounded-full bg-gradient-to-b from-primary/20 via-emerald-500/10 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-40 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* ——— Hero Masthead ——— */}
        <header className="pt-8">
          <AboutHeroMotion>
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-card/90 via-card/60 to-card/30 p-6 md:p-10 backdrop-blur-2xl shadow-2xl">
              <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
                {/* Brand & Main Title */}
                <div className="space-y-6 lg:col-span-8">
                  <div className="flex flex-wrap items-center gap-3">
                    <BrandMark size={52} priority />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-0.5 text-xs font-bold tracking-wider text-primary uppercase border border-primary/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                          {t('kicker')}
                        </span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs font-semibold text-emerald-400 font-mono">
                          {t('since')} {year}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t('house')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl leading-tight">
                      {t('title')}
                    </h1>
                    <p className="text-lg font-semibold text-primary sm:text-xl">
                      {t('headline')}
                    </p>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
                      {t('standfirst')}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <Link
                      href="/contact"
                      className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-105 active:scale-95"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      {t('letter_cta')}
                    </Link>
                    <a
                      href={`mailto:${CONTACT_EMAIL}`}
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white/90 backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/10"
                    >
                      <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                      {CONTACT_EMAIL}
                    </a>
                  </div>
                </div>

                {/* Right Hero Quote Card */}
                <div className="lg:col-span-4">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-md shadow-inner relative">
                    <div className="flex items-center gap-2 text-primary font-serif text-3xl leading-none opacity-40">
                      “
                    </div>
                    <blockquote className="mt-2 text-sm text-foreground/90 italic leading-relaxed">
                      {t('quote')}
                    </blockquote>
                    <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-[11px] text-muted-foreground font-mono">
                      <span>{t('house')}</span>
                      <span>{todayKey}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AboutHeroMotion>
        </header>

        {/* ——— Vision & Mission Duo ——— */}
        <AboutReveal className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card/50 to-card/20 p-6 sm:p-8 backdrop-blur-xl transition hover:border-primary/40">
            <div className="flex items-center justify-between mb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary font-mono text-sm font-bold border border-primary/30">
                01
              </span>
              <span className="text-[11px] font-mono tracking-widest text-primary uppercase">
                {t('vision')}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white mb-3 sm:text-2xl">{t('vision')}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{t('vision_text')}</p>
          </div>

          <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-card/50 to-card/20 p-6 sm:p-8 backdrop-blur-xl transition hover:border-emerald-500/40">
            <div className="flex items-center justify-between mb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 font-mono text-sm font-bold border border-emerald-500/30">
                02
              </span>
              <span className="text-[11px] font-mono tracking-widest text-emerald-400 uppercase">
                {t('mission')}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white mb-3 sm:text-2xl">{t('mission')}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{t('mission_text')}</p>
          </div>
        </AboutReveal>

        {/* ——— Real-Time Sports Metrics & Operations Bento ——— */}
        <AboutReveal className="rounded-3xl border border-white/10 bg-card/40 p-6 sm:p-8 backdrop-blur-xl shadow-2xl" id="desk">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6 mb-8">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-primary">01</span>
                <h2 className="text-xl sm:text-2xl font-black text-white">{t('desk_title')}</h2>
              </div>
              <p className="text-xs text-muted-foreground">{t('desk_note')}</p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-bold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{live} {t('tally_live')}</span>
            </div>
          </div>

          {/* Metrics 8-Card Grid */}
          <AboutStagger className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8" delay={0.03}>
            {tally.map((item) => (
              <AboutItem key={item.href + item.label}>
                <Link
                  href={item.href}
                  className={`group flex flex-col justify-between rounded-2xl border p-4 transition-all duration-300 hover:scale-105 ${
                    item.accent
                      ? 'border-emerald-500/40 bg-emerald-500/15 text-white shadow-lg shadow-emerald-500/10'
                      : 'border-white/10 bg-white/[0.03] text-foreground/80 hover:border-white/20 hover:bg-white/[0.06]'
                  }`}
                >
                  <span className="font-mono text-2xl font-black tracking-tight text-white group-hover:text-primary transition-colors">
                    {item.value}
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground mt-2 truncate">
                    {item.label}
                  </span>
                </Link>
              </AboutItem>
            ))}
          </AboutStagger>

          {/* Live Wire Ticker */}
          <div className="mt-8 rounded-2xl border border-white/5 bg-black/30 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>{t('desk_kicker')}</span>
            </div>

            {liveRows.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {liveRows.map((row) => {
                  const scored = row.homeScore != null && row.awayScore != null;
                  return (
                    <Link
                      key={row.id}
                      href={`/match/${row.id}`}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-3 transition hover:border-primary/40 hover:bg-white/5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-muted-foreground truncate">{row.league.name}</p>
                        <p className="text-xs font-bold text-white truncate mt-0.5">
                          {row.homeTeam.name} vs {row.awayTeam.name}
                        </p>
                      </div>
                      <div className="text-end ps-2">
                        <span className="font-mono text-xs font-bold text-emerald-400">
                          {scored ? `${row.homeScore}–${row.awayScore}` : 'LIVE'}
                        </span>
                        {row.minute != null && (
                          <p className="text-[10px] text-muted-foreground font-mono">{row.minute}′</p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-2">{t('desk_empty')}</p>
            )}
          </div>
        </AboutReveal>

        {/* ——— Four Pillars of Excellence ——— */}
        <AboutReveal className="space-y-6">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4">
            <span className="font-mono text-xs font-bold text-primary">02</span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">{t('pillars_title')}</h2>
              <p className="text-xs text-muted-foreground">{t('pillars_note')}</p>
            </div>
          </div>

          <AboutStagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {principles.map((item) => (
              <AboutItem key={item.no}>
                <article className="h-full rounded-2xl border border-white/10 bg-card/40 p-6 backdrop-blur-md transition hover:border-primary/40 hover:bg-card/70">
                  <span className="font-mono text-xs font-bold text-primary">{item.no}</span>
                  <h3 className="text-base font-bold text-white mt-3 mb-2">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.body}</p>
                </article>
              </AboutItem>
            ))}
          </AboutStagger>
        </AboutReveal>

        {/* ——— Rules & Flow Duo ——— */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Rules / Charter */}
          <AboutReveal className="rounded-3xl border border-white/10 bg-card/40 p-6 sm:p-8 backdrop-blur-xl" id="charter">
            <div className="flex items-center gap-2 border-b border-white/10 pb-4 mb-6">
              <span className="font-mono text-xs font-bold text-primary">03</span>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white">{t('rules_title')}</h2>
                <p className="text-xs text-muted-foreground">{t('rules_kicker')}</p>
              </div>
            </div>

            <AboutStagger className="space-y-4">
              {rules.map((rule) => (
                <AboutItem key={rule.no}>
                  <div className="flex items-start gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition hover:border-white/15">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary font-mono text-xs font-bold">
                      {rule.no}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-white mb-1">{rule.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{rule.body}</p>
                    </div>
                  </div>
                </AboutItem>
              ))}
            </AboutStagger>
          </AboutReveal>

          {/* Flow */}
          <AboutReveal className="rounded-3xl border border-white/10 bg-card/40 p-6 sm:p-8 backdrop-blur-xl" id="flow">
            <div className="flex items-center gap-2 border-b border-white/10 pb-4 mb-6">
              <span className="font-mono text-xs font-bold text-primary">04</span>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white">{t('flow_title')}</h2>
                <p className="text-xs text-muted-foreground">{t('flow_kicker')}</p>
              </div>
            </div>

            <AboutStagger className="space-y-4">
              {flow.map((step) => (
                <AboutItem key={step.no}>
                  <div className="flex items-start gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition hover:border-white/15">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold">
                      {step.no}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-white mb-1">{step.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{step.body}</p>
                    </div>
                  </div>
                </AboutItem>
              ))}
            </AboutStagger>
          </AboutReveal>
        </div>

        {/* ——— Platform Wings & Multilingual ——— */}
        <AboutReveal className="rounded-3xl border border-white/10 bg-card/40 p-6 sm:p-8 backdrop-blur-xl" id="wings">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4 mb-6">
            <span className="font-mono text-xs font-bold text-primary">05</span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">{t('wings_title')}</h2>
              <p className="text-xs text-muted-foreground">{t('wings_kicker')}</p>
            </div>
          </div>

          <AboutStagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {wings.map((wing) => (
              <AboutItem key={wing.no}>
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 h-full">
                  <span className="font-mono text-xs font-bold text-primary">{wing.no}</span>
                  <h3 className="text-sm font-bold text-white mt-2 mb-1.5">{wing.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{wing.body}</p>
                </div>
              </AboutItem>
            ))}
          </AboutStagger>

          <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/[0.04] p-5">
            <p className="text-[11px] font-bold text-primary uppercase tracking-widest">{t('langs_kicker')}</p>
            <h3 className="text-sm font-bold text-white mt-1 mb-1">{t('langs_title')}</h3>
            <p className="text-xs text-muted-foreground">{t('langs_body')}</p>
          </div>
        </AboutReveal>

        {/* ——— Explore All Platform Sections (Rooms) ——— */}
        <AboutReveal className="rounded-3xl border border-white/10 bg-card/40 p-6 sm:p-8 backdrop-blur-xl" id="rooms">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4 mb-6">
            <span className="font-mono text-xs font-bold text-primary">06</span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">{t('rooms_title')}</h2>
              <p className="text-xs text-muted-foreground">{t('rooms_kicker')}</p>
            </div>
          </div>

          <AboutStagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {rooms.map((door, index) => (
              <AboutItem key={door.href}>
                <Link
                  href={door.href}
                  className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition-all duration-300 hover:border-primary/40 hover:bg-white/[0.06] hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-muted-foreground group-hover:text-primary transition-colors">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-xs text-muted-foreground group-hover:translate-x-0.5 transition-transform">
                      →
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                      {door.title}
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-1 truncate">{door.hint}</p>
                  </div>
                </Link>
              </AboutItem>
            ))}
          </AboutStagger>
        </AboutReveal>

        {/* ——— Integrity Absence Checklist & Official Communication ——— */}
        <AboutReveal className="grid gap-6 lg:grid-cols-12">
          {/* Absence / Integrity */}
          <div className="rounded-3xl border border-white/10 bg-card/40 p-6 sm:p-8 backdrop-blur-xl lg:col-span-6">
            <p className="text-xs font-bold tracking-widest text-emerald-400 uppercase mb-2">
              {t('absence_kicker')}
            </p>
            <h2 className="text-xl font-extrabold text-white mb-4">{t('absence_title')}</h2>
            <ul className="space-y-2.5">
              {absence.map((item) => (
                <li key={item} className="flex items-start gap-3 text-xs text-muted-foreground">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                    ✓
                  </span>
                  <span className="pt-0.5">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Direct Line & Legal Quad Links */}
          <div className="rounded-3xl border border-white/10 bg-card/40 p-6 sm:p-8 backdrop-blur-xl lg:col-span-6 flex flex-col justify-between" id="letter">
            <div>
              <p className="text-xs font-bold tracking-widest text-primary uppercase mb-2">
                {t('letter_kicker')}
              </p>
              <h2 className="text-xl font-extrabold text-white mb-2">{t('letter_title')}</h2>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">{t('letter_body')}</p>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition hover:bg-primary/90"
                >
                  {t('letter_cta')}
                </Link>
                <a
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-mono text-white transition hover:border-primary/40"
                  href={`mailto:${CONTACT_EMAIL}`}
                >
                  {CONTACT_EMAIL}
                </a>
              </div>
            </div>

            <div className="border-t border-white/10 pt-6 mt-6">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                {t('legal_title')}
              </p>
              <div className="flex flex-wrap gap-2">
                {legal.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-foreground/80 transition hover:border-primary/40 hover:text-white"
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </AboutReveal>

        {/* Footer info line */}
        <p className="text-center text-xs text-muted-foreground/60 font-mono pt-4">
          {t('colo_print')} · {locale.toUpperCase()} · {timezone}
        </p>
      </div>
    </div>
  );
}
