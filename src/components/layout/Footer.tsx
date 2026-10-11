import { auth } from '@/lib/auth/auth';
import { isStaffRole } from '@/lib/auth/admin-access';
import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { BrandMark } from '@/components/brand/BrandMark';
import { prisma } from '@/lib/prisma';
import { swallow } from '@/lib/ops/caught';
import { localizePlainName } from '@/lib/i18n/sports-lexicon';
import { countLiveMatches } from '@/lib/sports-data/live-census';
import { FooterBrief } from './FooterBrief';
import styles from './footer.module.css';

const FOOTER_LEAGUE_IDS = ['2', '39', '140', '307', '135'] as const;
const FOOTER_DESK_TTL_MS = 60_000;

type FooterLeague = { name: string; slug: string; externalId: string };
type FooterDesk = { leagues: FooterLeague[]; liveNow: number; todayStories: number };

let footerDeskMemo: { at: number; value: FooterDesk } | null = null;

async function loadFooterDesk(): Promise<FooterDesk> {
  if (footerDeskMemo && Date.now() - footerDeskMemo.at < FOOTER_DESK_TTL_MS) {
    return footerDeskMemo.value;
  }

  const empty: FooterLeague[] = [];
  const [leagues, liveNow, todayStories] = await Promise.all([
    prisma.league
      .findMany({
        where: { externalId: { in: [...FOOTER_LEAGUE_IDS] } },
        select: { name: true, slug: true, externalId: true },
      })
      .catch(swallow('footer.leagues', empty, { persist: false })),
    countLiveMatches(),
    prisma.news
      .count({
        where: {
          status: 'PUBLISHED',
          publishedAt: { gte: new Date(Date.now() - 36 * 60 * 60 * 1000) },
        },
      })
      .catch(swallow('footer.stories', 0, { persist: false })),
  ]);

  const value = { leagues, liveNow, todayStories };
  footerDeskMemo = { at: Date.now(), value };
  return value;
}

export async function Footer() {
  const t = await getTranslations();
  const locale = await getLocale();
  const year = new Date().getFullYear();
  const ar = locale === 'ar';

  const { leagues: featuredLeagues, liveNow, todayStories } = await loadFooterDesk();
  const leagueLinks = FOOTER_LEAGUE_IDS
    .map((id) => featuredLeagues.find((row) => row.externalId === id))
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .map((row) => ({ name: localizePlainName(locale, row.name), href: `/league/${row.slug}` }));

  const session = await auth();
  const staff = isStaffRole(session?.user?.role);

  const columns = [
    {
      title: ar ? 'المنافسات والمباريات' : 'Matches & Leagues',
      links: [
        { name: t('common.matches') || 'المباريات والنتائج', href: '/matches' },
        { name: t('common.leagues') || 'البطولات والدوريات', href: '/leagues' },
        { name: t('common.broadcasts') || 'يلا سبورت مباشر', href: '/live' },
        { name: ar ? 'دليل القنوات والبث' : 'TV Guide', href: '/tv-guide' },
        { name: ar ? 'لوحة الصدارة والتوقعات' : 'Leaderboard', href: '/leaderboard' },
        ...leagueLinks.slice(0, 3),
      ],
    },
    {
      title: ar ? 'الأخبار والوسائط' : 'News & Media',
      links: [
        { name: t('common.news') || 'أحدث الأخبار والتقارير', href: '/news' },
        { name: t('common.video') || 'مكتبة الفيديو والأهداف', href: '/videos' },
        { name: ar ? 'ريلز ولقطات سريعة' : 'Reels', href: '/videos#reels' },
        { name: t('common.photos') || 'الصور والعدسة', href: '/photos' },
        { name: t('common.transfers') || 'سوق الانتقالات', href: '/transfers' },
      ],
    },
    {
      title: ar ? 'الإحصائيات والمقارنات' : 'Stats & Compare',
      links: [
        { name: t('common.stats') || 'إحصائيات المواسم والفرق', href: '/stats' },
        { name: t('common.player_compare') || 'مقارنة اللاعبين', href: '/compare-players' },
        { name: t('common.club_compare') || 'مقارنة الأندية', href: '/compare' },
        { name: ar ? 'البحث الرياضي الشامل' : 'Search', href: '/search' },
      ],
    },
    {
      title: ar ? 'المنصة والحساب' : 'Account & About',
      links: [
        { name: ar ? 'حسابي والإشعارات' : 'My Account & Alerts', href: '/profile' },
        { name: t('common.favorites') || 'الفرق والمباريات المفضلة', href: '/favorites' },
        { name: t('common.settings') || 'الإعدادات والمظهر', href: '/settings' },
        { name: t('footer.about') || 'من نحن', href: '/about' },
        { name: t('footer.connect') || 'تواصل معنا', href: '/contact' },
        { name: t('common.report') || 'إبلاغ عن محتوى', href: '/report' },
        ...(staff ? [{ name: ar ? 'لوحة الإدارة والتحكم' : 'Control Desk', href: '/admin' }] : []),
      ],
    },
  ];

  const legalLinks = [
    { name: t('common.privacy') || 'الخصوصية', href: '/privacy' },
    { name: t('common.terms') || 'الشروط والأحكام', href: '/terms' },
    { name: t('common.cookies') || 'ملفات تعريف الارتباط', href: '/cookies' },
    { name: t('footer.copyright') || 'حقوق الملكية الفكرية', href: '/copyright' },
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.filament} aria-hidden />
      <div className={styles.orbit} aria-hidden />

      <div className={styles.bezel}>
        <span className={styles.bezelLive}>
          <span className={styles.eq} aria-hidden>
            <span />
            <span />
            <span />
          </span>
          {ar ? 'يلا سبورت — التغطية الرياضية المباشرة' : 'Yalla Sport — Live Sports Coverage'}
        </span>
      </div>

      <div className={styles.container}>
        <div className={styles.mast}>
          <div>
            <Link href="/" className={styles.brandLink} aria-label="Yalla Sport">
              <span className={styles.seal}>
                <span className={styles.orbitRing} aria-hidden />
                <BrandMark size={40} />
              </span>
              <span>
                <span className={styles.brandName}>
                  {ar ? (
                    <>
                      <span className={styles.brandAccent}>يلا</span> سبورت
                    </>
                  ) : (
                    <>
                      <span className={styles.brandAccent}>Yalla</span> Sport
                    </>
                  )}
                </span>
                <span className={styles.brandMark} aria-hidden />
              </span>
            </Link>
            <p className={styles.brandDesc}>
              {ar
                ? 'يلا سبورت منصة رياضية متكاملة تجمع الأخبار الرياضية، المباريات والنتائج المباشرة، البطولات والدوريات، الفرق واللاعبين والمدربين، الإحصائيات، الانتقالات، الفيديو والصور، مع تغطية رياضية شاملة من مصادر موثوقة.'
                : 'Yalla Sport is a comprehensive sports platform that aggregates sports news, live match coverage and scores, tournaments and leagues, teams, players, coaches, statistics, transfers, video, and photos, with extensive coverage from reliable sources.'}
            </p>
          </div>

          <div className={styles.invite}>
            <h4 className={styles.inviteTitle}>
              {ar ? 'النشرة' : 'Briefing'}
            </h4>
            <p className={styles.inviteDesc}>
              {ar
                ? 'احصل على ملخص يومي بأبرز الأهداف ونتائج المباريات وأحدث الأخبار في بريدك.'
                : 'Get daily match highlights, major scores, and football news directly to your inbox.'}
            </p>
            <FooterBrief locale={locale} />
          </div>
        </div>

        <div className={styles.pulse}>
          <span className={styles.pulseChip}>
            <span className={styles.pulseDot} aria-hidden />
            {liveNow > 0
              ? ar
                ? `${liveNow} مباراة مباشرة الآن`
                : `${liveNow} live matches now`
              : ar
                ? 'متابعة مباشرة للنتائج والمباريات'
                : 'Live scores and fixture tracking'}
          </span>
          <span className={styles.pulseChip}>
            {ar
              ? 'محدث لحظياً من المصدر الحي'
              : 'Updated in real-time from the live source'}
          </span>
          <Link href="/live" className={styles.pulseLink}>
            {ar ? 'افتح يلا سبورت مباشر' : 'Open Yalla Sport Live'}
          </Link>
        </div>

        <div className={styles.grid}>
          {columns.map((column, index) => (
            <section key={column.title} className={styles.column}>
              <h4 className={styles.colTitle}>
                <span className={styles.colIndex}>{String(index + 1).padStart(2, '0')}</span>
                {column.title}
              </h4>
              <nav className={styles.linksList} aria-label={column.title}>
                {column.links.map((link) => (
                  <Link key={link.href} href={link.href} className={styles.linkItem}>
                    {link.name}
                  </Link>
                ))}
              </nav>
            </section>
          ))}
        </div>

        <div className={styles.closer}>
          {/* <span className={styles.monogram} aria-hidden>
            YS
          </span> */}
          <p>
            {ar
              ? 'يلا سبورت منصة رياضية متكاملة'
              : 'Yalla Sport is a comprehensive sports platform'}
          </p>
        </div>

        <div className={styles.bottom}>
          <div className={styles.socialRow}>
            <Link href="/contact" className={styles.socialIcon}>
              {ar ? 'غرفة التحرير' : 'Newsroom'}
            </Link>
            <Link href="/report" className={styles.socialIcon}>
              {ar ? 'إبلاغ' : 'Report'}
            </Link>
            <Link href="/about" className={styles.socialIcon}>
              {ar ? 'من نحن' : 'About'}
            </Link>
          </div>

          <div className={styles.legalLinks}>
            {legalLinks.map((link) => (
              <Link key={link.href} href={link.href} className={styles.legalLink}>
                {link.name}
              </Link>
            ))}
          </div>

          <p className={styles.copyright}>
            © {year} {ar ? 'يلا سبورت. جميع الحقوق محفوظة.' : 'Yalla Sport. All rights reserved.'}
          </p>
        </div>
      </div>
    </footer>
  );
}
