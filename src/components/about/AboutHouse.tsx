import { cookies } from 'next/headers';
import { Link } from '@/i18n/navigation';
import { ClientTime } from '@/components/datetime/ClientTime';
import { SalonStage } from '@/components/salon/SalonStage';
import { HallFoyer } from '@/components/salon/HallFoyer';
import { Stagger, StaggerItem } from '@/components/motion/PageMotion';
import { loadAboutDesk } from '@/lib/about/load-desk';
import { localizePlainName } from '@/lib/i18n/sports-lexicon';
import { dateKeyInTimezone, normalizeTimezone } from '@/lib/datetime/format';
import { CONTACT_EMAIL } from '@/lib/seo/site';
import { STREAMING_ENABLED } from '@/lib/streaming';
import { getLocale, getTranslations } from 'next-intl/server';
import styles from './about-house.module.css';

export async function AboutHouse() {
  const t = await getTranslations('about');
  const locale = await getLocale();
  const isAr = locale === 'ar';
  const timezone = normalizeTimezone((await cookies()).get('yalla-tz')?.value);
  const todayKey = dateKeyInTimezone(new Date(), timezone);
  const { leagues, stories, fixtures, teams, players, live, liveRows, youtubeClips, channels, assets } =
    await loadAboutDesk(locale, todayKey, timezone);

  const tally = [
    { value: live, label: t('tally_live'), href: '/matches' as const, live: true },
    { value: fixtures, label: t('tally_today'), href: '/matches' as const },
    { value: leagues, label: t('tally_leagues'), href: '/leagues' as const },
    { value: teams, label: t('tally_teams'), href: '/search' as const },
    { value: players, label: t('tally_players'), href: '/search' as const },
    { value: stories, label: t('tally_news'), href: '/news' as const },
    { value: youtubeClips, label: isAr ? 'مقطع يوتيوب منشور' : 'Published YouTube clips', href: '/videos' as const },
    ...(STREAMING_ENABLED
      ? [
        { value: channels, label: t('tally_channels'), href: '/live' as const },
        { value: assets, label: t('tally_assets'), href: '/live' as const },
      ]
      : []),
  ].filter((item) => item.value > 0 || item.live);

  const principles = [
    { no: '01', title: t('coverage'), body: t('coverage_desc') },
    { no: '02', title: t('accuracy'), body: t('accuracy_desc') },
    { no: '03', title: t('community'), body: t('community_desc') },
    { no: '04', title: t('quality'), body: t('quality_desc') },
  ];

  const rules = [
    { no: '01', title: t('rule_1_title'), body: t('rule_1_body') },
    { no: '02', title: t('rule_2_title'), body: t('rule_2_body') },
    { no: '03', title: t('rule_3_title'), body: t('rule_3_body') },
    { no: '04', title: t('rule_4_title'), body: t('rule_4_body') },
  ];

  const flow = [
    { no: '01', title: t('flow_1_title'), body: t('flow_1_body') },
    { no: '02', title: t('flow_2_title'), body: t('flow_2_body') },
    { no: '03', title: t('flow_3_title'), body: t('flow_3_body') },
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
    { href: '/videos' as const, title: isAr ? 'الفيديو' : 'Videos', hint: isAr ? 'ملخصات من قنوات يوتيوب في الدفتر.' : 'Highlights from YouTube channels on the roster.' },
    { href: '/photos' as const, title: isAr ? 'الصور' : 'Photos', hint: isAr ? 'معرض صور من الأخبار المعتمدة.' : 'A gallery from approved news frames.' },
    { href: '/leaderboard' as const, title: t('door_board'), hint: t('door_board_hint') },
    { href: '/compare-players' as const, title: t('door_compare'), hint: t('door_compare_hint') },
    { href: '/search' as const, title: t('door_search'), hint: t('door_search_hint') },
    { href: '/transfers' as const, title: isAr ? 'الانتقالات' : 'Transfers', hint: isAr ? 'صفقات مسجّلة من المصدر.' : 'Deals recorded from the source.' },
    { href: '/stats' as const, title: isAr ? 'الإحصائيات' : 'Stats', hint: isAr ? 'أرقام الدوريات من المصدر.' : 'League figures from the source.' },
    { href: '/contact' as const, title: t('door_contact'), hint: t('door_contact_hint') },
  ];

  const legal = [
    { href: '/privacy' as const, title: t('legal_privacy') },
    { href: '/cookies' as const, title: isAr ? 'ملفات الارتباط' : 'Cookies' },
    { href: '/terms' as const, title: t('legal_terms') },
    { href: '/copyright' as const, title: t('legal_copy') },
    { href: '/report' as const, title: t('legal_report') },
  ];

  const absence = [t('absence_1'), t('absence_2'), t('absence_3'), t('absence_4'), t('absence_5')];

  return (
    <SalonStage
      tone="charter"
      wide
      compact
      kicker={t('kicker')}
      title={t('title')}
      lead={t('standfirst')}
      aside={t('since')}
      tools={
        <HallFoyer
          label={t('toc_kicker')}
          items={[
            { href: '/about', label: isAr ? 'من نحن' : 'About', current: true },
            { href: '/contact', label: isAr ? 'تواصل' : 'Contact' },
            { href: '/report', label: isAr ? 'إبلاغ' : 'Report' },
            { href: '/privacy', label: isAr ? 'الخصوصية' : 'Privacy' },
            { href: '/terms', label: isAr ? 'الشروط' : 'Terms' },
          ]}
        />
      }
    >
      <div className={styles.house}>
        <section className={styles.duo} aria-label={t('house')}>
          <article className={styles.pillar}>
            <span>01 · {t('vision')}</span>
            <h3>{t('vision')}</h3>
            <p>{t('vision_text')}</p>
          </article>
          <article className={styles.pillar}>
            <span>02 · {t('mission')}</span>
            <h3>{t('mission')}</h3>
            <p>{t('mission_text')}</p>
          </article>
        </section>

        <aside className={styles.quote}>
          <b>{t('house')}</b>
          <blockquote>{t('quote')}</blockquote>
          <footer>
            <span>{t('headline')}</span>
            <ClientTime locale={locale} value={new Date()} options={{ day: 'numeric', month: 'short' }} />
          </footer>
        </aside>

        <section className={styles.panel} id="desk">
          <header className={styles.panelHead}>
            <div>
              <p>{t('desk_kicker')}</p>
              <h2>{t('desk_title')}</h2>
              <em>{t('desk_note')}</em>
            </div>
            {live > 0 ? (
              <span className={styles.livePill}>
                <i aria-hidden />
                {live} {t('tally_live')}
              </span>
            ) : null}
          </header>

          <Stagger className={styles.stats} delay={0.02}>
            {tally.map((item) => (
              <StaggerItem key={item.label}>
                <Link href={item.href} className={`${styles.stat}${item.live ? ` ${styles['is-live']}` : ''}`}>
                  <strong>{item.value}</strong>
                  <em>{item.label}</em>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>

          <div className={styles.wire}>
            <div className={styles.wireHead}>
              <i aria-hidden />
              <span>{t('desk_kicker')}</span>
            </div>
            {liveRows.length > 0 ? (
              <div className={styles.wireGrid}>
                {liveRows.map((row) => {
                  const scored = row.homeScore != null && row.awayScore != null;
                  const home = localizePlainName(locale, row.homeTeam.name);
                  const away = localizePlainName(locale, row.awayTeam.name);
                  const league = localizePlainName(locale, row.league.name);
                  return (
                    <Link key={row.id} href={`/match/${row.id}`} className={styles.match}>
                      <span>{league}</span>
                      <b>
                        {home} — {away}
                      </b>
                      <em>
                        {scored ? `${row.homeScore}–${row.awayScore}` : isAr ? 'مباشر' : 'LIVE'}
                        {row.minute != null ? ` · ${row.minute}′` : ''}
                      </em>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className={styles.empty}>{t('desk_empty')}</p>
            )}
          </div>
        </section>

        <section className={styles.panel} id="pillars">
          <header className={styles.panelHead}>
            <div>
              <p>02</p>
              <h2>{t('pillars_title')}</h2>
              <em>{t('pillars_note')}</em>
            </div>
          </header>
          <Stagger className={styles.grid4} delay={0.02}>
            {principles.map((item) => (
              <StaggerItem key={item.no}>
                <article className={styles.card}>
                  <header>
                    <em>{item.no}</em>
                  </header>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        <div className={styles.split}>
          <section className={styles.panel} id="charter">
            <header className={styles.panelHead}>
              <div>
                <p>{t('rules_kicker')}</p>
                <h2>{t('rules_title')}</h2>
              </div>
            </header>
            <div className={styles.list}>
              {rules.map((rule) => (
                <article key={rule.no} className={styles.row}>
                  <b>{rule.no}</b>
                  <div>
                    <h3>{rule.title}</h3>
                    <p>{rule.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.panel} id="flow">
            <header className={styles.panelHead}>
              <div>
                <p>{t('flow_kicker')}</p>
                <h2>{t('flow_title')}</h2>
              </div>
            </header>
            <div className={styles.list}>
              {flow.map((step) => (
                <article key={step.no} className={styles.row}>
                  <b>{step.no}</b>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <section className={styles.panel} id="wings">
          <header className={styles.panelHead}>
            <div>
              <p>{t('wings_kicker')}</p>
              <h2>{t('wings_title')}</h2>
            </div>
          </header>
          <Stagger className={styles.grid4} delay={0.02}>
            {wings.map((wing) => (
              <StaggerItem key={wing.no}>
                <article className={styles.card}>
                  <header>
                    <em>{wing.no}</em>
                  </header>
                  <h3>{wing.title}</h3>
                  <p>{wing.body}</p>
                </article>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        <section className={styles.panel} id="langs">
          <header className={styles.panelHead}>
            <div>
              <p>{t('langs_kicker')}</p>
              <h2>{t('langs_title')}</h2>
              <em>{t('langs_body')}</em>
            </div>
          </header>
          <div className={styles.langs}>
            <div className={styles.langRow}>
              <span>{t('langs_ar')}</span>
              <span>{t('langs_en')}</span>
            </div>
          </div>
        </section>

        <section className={styles.panel} id="rooms">
          <header className={styles.panelHead}>
            <div>
              <p>{t('rooms_kicker')}</p>
              <h2>{t('rooms_title')}</h2>
            </div>
          </header>
          <Stagger className={styles.doors} delay={0.02}>
            {rooms.map((door, index) => (
              <StaggerItem key={door.href}>
                <Link href={door.href} className={styles.door}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{door.title}</strong>
                  <em>{door.hint}</em>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        <div className={styles.split}>
          <section className={styles.panel} id="absence">
            <header className={styles.panelHead}>
              <div>
                <p>{t('absence_kicker')}</p>
                <h2>{t('absence_title')}</h2>
              </div>
            </header>
            <ul className={styles.checks}>
              {absence.map((item) => (
                <li key={item}>
                  <i aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.panel} id="letter">
            <header className={styles.panelHead}>
              <div>
                <p>{t('letter_kicker')}</p>
                <h2>{t('letter_title')}</h2>
                <em>{t('letter_body')}</em>
              </div>
            </header>
            <div className={styles.actions}>
              <Link href="/contact" className={styles.cta}>
                {t('letter_cta')}
              </Link>
              <a href={`mailto:${CONTACT_EMAIL}`} className={styles.ghost}>
                {CONTACT_EMAIL}
              </a>
            </div>
            <div>
              <p className={styles.empty}>{t('legal_title')}</p>
              <div className={styles.legal}>
                {legal.map((item) => (
                  <Link key={item.href} href={item.href}>
                    {item.title}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </div>

        <p className={styles.colo}>
          {t('colo_print')} · {locale.toUpperCase()} · {timezone}
        </p>
      </div>
    </SalonStage>
  );
}
