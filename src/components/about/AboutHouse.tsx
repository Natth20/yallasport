import { cookies } from 'next/headers';
import { BrandMark } from '@/components/brand/BrandMark';
import { Link } from '@/i18n/navigation';
import { prisma } from '@/lib/prisma';
import { newsVisibleWhere } from '@/lib/i18n/localized-content';
import { dateKeyInTimezone, dayBoundsInTimezone, normalizeTimezone } from '@/lib/datetime/format';
import { CONTACT_EMAIL } from '@/lib/seo/site';
import { getLocale, getTranslations } from 'next-intl/server';
import { ClientTime } from '@/components/datetime/ClientTime';
import { AboutHeroMotion, AboutItem, AboutReveal, AboutStagger } from './AboutMotion';
import {
  CalendarDays,
  Newspaper,
  Play,
  Radio,
  Shield,
  Trophy,
  Tv,
  Users,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Mail,
  CheckCircle2,
  Activity,
  Globe2,
  Compass,
  Cpu,
} from 'lucide-react';
import styles from './about-house.module.css';

const TALLY_ICONS = {
  live: Radio,
  calendar: CalendarDays,
  trophy: Trophy,
  shield: Shield,
  users: Users,
  news: Newspaper,
  tv: Tv,
  play: Play,
} as const;

export async function AboutHouse() {
  const t = await getTranslations('about');
  const locale = await getLocale();
  const isAr = locale === 'ar';
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
    { value: channels, label: t('tally_channels'), href: '/live' as const, icon: 'tv' },
    { value: assets, label: t('tally_assets'), href: '/live' as const, icon: 'play' },
  ];

  const principles = [
    { no: '01', title: t('coverage'), body: t('coverage_desc'), icon: Globe2 },
    { no: '02', title: t('accuracy'), body: t('accuracy_desc'), icon: Cpu },
    { no: '03', title: t('community'), body: t('community_desc'), icon: Users },
    { no: '04', title: t('quality'), body: t('quality_desc'), icon: Trophy },
  ];

  const wings = [
    { no: '01', title: t('wing_1_title'), body: t('wing_1_body') },
    { no: '02', title: t('wing_2_title'), body: t('wing_2_body') },
    { no: '03', title: t('wing_3_title'), body: t('wing_3_body') },
    { no: '04', title: t('wing_4_title'), body: t('wing_4_body') },
  ];

  const rooms = [
    { href: '/matches' as const, title: t('door_matches'), hint: t('door_matches_hint'), icon: CalendarDays },
    { href: '/leagues' as const, title: t('door_leagues'), hint: t('door_leagues_hint'), icon: Trophy },
    { href: '/news' as const, title: t('door_news'), hint: t('door_news_hint'), icon: Newspaper },
    { href: '/live' as const, title: t('door_live'), hint: t('door_live_hint'), icon: Radio },
    { href: '/leaderboard' as const, title: t('door_board'), hint: t('door_board_hint'), icon: Sparkles },
    { href: '/search' as const, title: t('door_search'), hint: t('door_search_hint'), icon: Compass },
    { href: '/compare' as const, title: t('door_compare'), hint: t('door_compare_hint'), icon: Activity },
    { href: '/contact' as const, title: t('door_contact'), hint: t('door_contact_hint'), icon: Mail },
  ];

  const legal = [
    { href: '/privacy' as const, title: t('legal_privacy') },
    { href: '/cookies' as const, title: isAr ? 'ملفات الارتباط' : 'Cookies' },
    { href: '/terms' as const, title: t('legal_terms') },
    { href: '/copyright' as const, title: t('legal_copy') },
    { href: '/report' as const, title: t('legal_report') },
  ];

  const absence = [t('absence_1'), t('absence_2'), t('absence_3'), t('absence_4'), t('absence_5')];

  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  return (
    <div className={`${styles.aboutHouse} relative min-h-screen overflow-hidden pb-16`}>
      {/* Minimal ambient glow instead of multiple strong gradients */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-primary/5 blur-[100px] opacity-50" />

      {/* Main Container */}
      <div className="mx-auto max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8">
        {/* ——— Hero Masthead ——— */}
        <header className="pt-12">
          <AboutHeroMotion>
            <div className={`${styles.aboutMaisonHero} rounded-3xl p-8 md:p-12`}>
              <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
                {/* Brand & Main Title */}
                <div className="space-y-8 lg:col-span-8">
                  <div className="flex flex-wrap items-center gap-4">
                    <BrandMark size={56} priority />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold tracking-widest text-primary uppercase">
                          {t('kicker')}
                        </span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs font-semibold text-muted-foreground font-mono">
                          {t('since')} {year}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('house')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-7xl leading-[1.1]">
                      {t('title')}
                    </h1>
                    <p className="text-xl font-bold text-foreground/80 sm:text-2xl">
                      {t('headline')}
                    </p>
                    <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl font-medium">
                      {t('standfirst')}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 pt-4">
                    <Link
                      href="/contact"
                      className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-bold text-background transition-transform hover:-translate-y-0.5"
                    >
                      <Mail className="w-4 h-4" />
                      <span>{t('letter_cta')}</span>
                    </Link>
                    <a
                      href={`mailto:${CONTACT_EMAIL}`}
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-6 py-3 text-sm font-semibold text-foreground transition-transform hover:-translate-y-0.5"
                    >
                      <span className="text-muted-foreground font-mono">{CONTACT_EMAIL}</span>
                    </a>
                  </div>
                </div>

                {/* Right Hero Quote Card */}
                <div className="lg:col-span-4">
                  <div className="relative rounded-3xl border border-border bg-card/50 p-8">
                    <div className="text-primary font-serif text-5xl leading-none opacity-20 absolute top-6 right-6">
                      “
                    </div>
                    <blockquote className="relative z-10 mt-4 text-base text-foreground/80 italic leading-relaxed font-medium">
                      {t('quote')}
                    </blockquote>
                    <div className="mt-8 flex items-center justify-between border-t border-border/50 pt-4 text-xs text-muted-foreground font-mono">
                      <span>{t('house')}</span>
                      <span><ClientTime value={new Date()} /></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AboutHeroMotion>
        </header>

        {/* ——— Vision & Mission Duo ——— */}
        <AboutReveal className="grid gap-6 sm:grid-cols-2">
          <div className={`${styles.aboutPillarCard} group`}>
            <div className="flex items-center justify-between mb-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary font-mono text-sm font-bold transition-transform group-hover:scale-110">
                01
              </span>
              <span className="text-xs font-mono tracking-widest text-muted-foreground uppercase font-bold">
                {t('vision')}
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-foreground mb-4">{t('vision')}</h2>
            <p className="text-base text-muted-foreground leading-relaxed font-medium">{t('vision_text')}</p>
          </div>

          <div className={`${styles.aboutPillarCard} group`}>
            <div className="flex items-center justify-between mb-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground/5 text-foreground font-mono text-sm font-bold transition-transform group-hover:scale-110">
                02
              </span>
              <span className="text-xs font-mono tracking-widest text-muted-foreground uppercase font-bold">
                {t('mission')}
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-foreground mb-4">{t('mission')}</h2>
            <p className="text-base text-muted-foreground leading-relaxed font-medium">{t('mission_text')}</p>
          </div>
        </AboutReveal>

        {/* ——— Real-Time Sports Metrics & Operations Bento ——— */}
        <AboutReveal className="rounded-3xl border border-border bg-card/40 p-6 sm:p-8 backdrop-blur-xl shadow-2xl" id="desk">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6 mb-8">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-primary">01</span>
                <h2 className="text-xl sm:text-2xl font-black text-foreground">{t('desk_title')}</h2>
              </div>
              <p className="text-xs text-muted-foreground">{t('desk_note')}</p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span>{live} {t('tally_live')}</span>
            </div>
          </div>

          {/* Metrics 8-Card Grid */}
          <AboutStagger className="grid grid-cols-2 gap-3 sm:grid-cols-4" delay={0.03}>
            {tally
              .filter((item) => item.value > 0 || item.accent)
              .map((item) => {
                const Icon = TALLY_ICONS[item.icon as keyof typeof TALLY_ICONS];
                return (
                  <AboutItem key={item.href + item.label}>
                    <Link
                      href={item.href}
                      className={`${styles.aboutStatCard} group flex flex-col justify-between ${
                        item.accent
                          ? 'border-primary/30 bg-primary/5 text-foreground shadow-lg shadow-primary/10'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        {Icon ? <Icon className="h-5 w-5 text-primary opacity-80" aria-hidden /> : null}
                        <ArrowIcon className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
                      </div>
                      <span className="font-mono text-3xl font-black tracking-tight text-foreground group-hover:text-primary transition-colors">
                        {item.value}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground mt-2 truncate">
                        {item.label}
                      </span>
                    </Link>
                  </AboutItem>
                );
              })}
          </AboutStagger>

          {/* Live Wire Ticker */}
          <div className="mt-8 rounded-2xl border border-border bg-card/40 p-5 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
              <span>{t('desk_kicker')}</span>
            </div>

            {liveRows.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {liveRows.map((row) => {
                  const scored = row.homeScore != null && row.awayScore != null;
                  return (
                    <Link
                      key={row.id}
                      href={`/match/${row.id}`}
                      className="flex items-center justify-between rounded-xl border border-border/50 bg-card p-4 transition hover:border-primary/40 hover:bg-card/80 shadow-sm hover:shadow-md"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-muted-foreground truncate font-medium">{row.league.name}</p>
                        <p className="text-sm font-bold text-foreground truncate mt-1">
                          {row.homeTeam.name} vs {row.awayTeam.name}
                        </p>
                      </div>
                      <div className="text-end ps-3">
                        <span className="font-mono text-sm font-bold text-primary">
                          {scored ? `${row.homeScore}–${row.awayScore}` : 'LIVE'}
                        </span>
                        {row.minute != null && (
                          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{row.minute}′</p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">{t('desk_empty')}</p>
            )}
          </div>
        </AboutReveal>

        {/* ——— Four Pillars of Excellence ——— */}
        <AboutReveal className="space-y-6">
          <div className="flex items-center gap-2 border-b border-border pb-4">
            <span className="font-mono text-xs font-bold text-primary">02</span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground">{t('pillars_title')}</h2>
              <p className="text-xs text-muted-foreground">{t('pillars_note')}</p>
            </div>
          </div>

          <AboutStagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {principles.map((item) => {
              const Icon = item.icon;
              return (
                <AboutItem key={item.no}>
                  <article className={`${styles.aboutPillarCard} flex flex-col justify-between`}>
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-mono text-sm font-bold text-primary opacity-60">{item.no}</span>
                        <div className="p-2.5 rounded-xl bg-foreground/5 text-foreground">
                          <Icon className="w-5 h-5" />
                        </div>
                      </div>
                      <h3 className="text-base font-bold text-foreground mb-2">{item.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed font-medium">{item.body}</p>
                    </div>
                  </article>
                </AboutItem>
              );
            })}
          </AboutStagger>
        </AboutReveal>

        {/* ——— Rules & Flow Duo ——— */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Rules / Charter */}
          <AboutReveal className="rounded-3xl border border-border bg-card/40 p-6 sm:p-10 backdrop-blur-xl" id="charter">
            <div className="flex items-center gap-2 border-b border-border pb-4 mb-6">
              <span className="font-mono text-xs font-bold text-primary">03</span>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-foreground">{t('rules_title')}</h2>
                <p className="text-xs text-muted-foreground">{t('rules_kicker')}</p>
              </div>
            </div>

            <AboutStagger className="space-y-4">
              {rules.map((rule) => (
                <AboutItem key={rule.no}>
                  <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 transition hover:border-primary/30 shadow-sm hover:shadow-md group">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground/5 text-foreground font-mono text-xs font-bold transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                      {rule.no}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-foreground mb-1">{rule.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed font-medium">{rule.body}</p>
                    </div>
                  </div>
                </AboutItem>
              ))}
            </AboutStagger>
          </AboutReveal>

          {/* Flow */}
          <AboutReveal className="rounded-3xl border border-border bg-card/40 p-6 sm:p-8 backdrop-blur-xl" id="flow">
            <div className="flex items-center gap-2 border-b border-border pb-4 mb-6">
              <span className="font-mono text-xs font-bold text-primary">04</span>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-foreground">{t('flow_title')}</h2>
                <p className="text-xs text-muted-foreground">{t('flow_kicker')}</p>
              </div>
            </div>

            <AboutStagger className="space-y-4">
              {flow.map((step) => (
                <AboutItem key={step.no}>
                  <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/30">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold">
                      {step.no}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-foreground mb-1">{step.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{step.body}</p>
                    </div>
                  </div>
                </AboutItem>
              ))}
            </AboutStagger>
          </AboutReveal>
        </div>

        {/* ——— Explore All Platform Sections (Rooms) ——— */}
        <AboutReveal className="rounded-3xl border border-border bg-card/40 p-6 sm:p-8 backdrop-blur-xl" id="rooms">
          <div className="flex items-center gap-2 border-b border-border pb-4 mb-6">
            <span className="font-mono text-xs font-bold text-primary">05</span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground">{t('rooms_title')}</h2>
              <p className="text-xs text-muted-foreground">{t('rooms_kicker')}</p>
            </div>
          </div>

          <AboutStagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {rooms.map((door, index) => {
              const Icon = door.icon;
              return (
                <AboutItem key={door.href}>
                  <Link
                    href={door.href}
                    className={`${styles.aboutDoorCard} group`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-mono text-xs font-bold text-muted-foreground group-hover:text-primary transition-colors">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                        {door.title}
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-1 truncate">{door.hint}</p>
                    </div>
                  </Link>
                </AboutItem>
              );
            })}
          </AboutStagger>
        </AboutReveal>

        {/* ——— Integrity Absence Checklist & Official Communication ——— */}
        <AboutReveal className="grid gap-6 lg:grid-cols-12">
          {/* Absence / Integrity */}
          <div className="rounded-3xl border border-border bg-card/40 p-6 sm:p-8 backdrop-blur-xl lg:col-span-6">
            <p className="text-xs font-bold tracking-widest text-emerald-400 uppercase mb-2">
              {t('absence_kicker')}
            </p>
            <h2 className="text-xl font-extrabold text-foreground mb-4">{t('absence_title')}</h2>
            <ul className="space-y-3">
              {absence.map((item) => (
                <li key={item} className="flex items-start gap-3 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Direct Line & Legal Hub Links */}
          <div className="rounded-3xl border border-border bg-card/40 p-6 sm:p-8 backdrop-blur-xl lg:col-span-6 flex flex-col justify-between" id="letter">
            <div>
              <p className="text-xs font-bold tracking-widest text-primary uppercase mb-2">
                {t('letter_kicker')}
              </p>
              <h2 className="text-xl font-extrabold text-foreground mb-2">{t('letter_title')}</h2>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">{t('letter_body')}</p>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition hover:bg-primary/90"
                >
                  <Mail className="w-4 h-4" />
                  <span>{t('letter_cta')}</span>
                </Link>
                <a
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-mono text-foreground transition hover:border-primary/40"
                  href={`mailto:${CONTACT_EMAIL}`}
                >
                  {CONTACT_EMAIL}
                </a>
              </div>
            </div>

            <div className="border-t border-border pt-6 mt-6">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                {t('legal_title')}
              </p>
              <div className="flex flex-wrap gap-2">
                {legal.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-lg border border-border bg-card px-3 py-1 text-xs text-foreground transition hover:border-primary/40"
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
