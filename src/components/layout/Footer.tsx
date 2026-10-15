import { auth } from '@/lib/auth/auth';
import { isStaffRole } from '@/lib/auth/admin-access';
import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { BrandMark } from '@/components/brand/BrandMark';
import { prisma } from '@/lib/prisma';
import { swallow } from '@/lib/ops/caught';
import { countLiveMatches } from '@/lib/sports-data/live-census';
import { FooterBrief } from './FooterBrief';
import styles from './footer.module.css';

const FOOTER_DESK_TTL_MS = 60_000;

type FooterDesk = { liveNow: number; todayStories: number };

let footerDeskMemo: { at: number; value: FooterDesk } | null = null;

async function loadFooterDesk(): Promise<FooterDesk> {
  if (footerDeskMemo && Date.now() - footerDeskMemo.at < FOOTER_DESK_TTL_MS) {
    return footerDeskMemo.value;
  }

  const [liveNow, todayStories] = await Promise.all([
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

  const value = { liveNow, todayStories };
  footerDeskMemo = { at: Date.now(), value };
  return value;
}

export async function Footer() {
  const t = await getTranslations();
  const locale = await getLocale();
  const year = new Date().getFullYear();
  const ar = locale === 'ar';

  const { liveNow } = await loadFooterDesk();

  const session = await auth().catch(swallow('footer.auth', null, { persist: false }));
  const staff = isStaffRole(session?.user?.role);

  const mastLinks = [
    { name: ar ? ' الرئيسية' : ' Home', href: '/' },
    { name: ar ? 'ℹ من نحن' : 'ℹ About Us', href: '/about' },
    { name: ar ? ' تواصل معنا' : ' Contact Us', href: '/contact' },
    { name: ar ? ' إبلاغ عن محتوى' : ' Report Content', href: '/report' },
  ];

  const columns = [
    {
      title: ar ? 'المحتوى' : 'Content',
      links: [
        { name: ar ? ' الأخبار' : ' News', href: '/news' },
        { name: ar ? ' الفيديو' : ' Videos', href: '/videos' },
        { name: ar ? ' الريلز' : ' Reels', href: '/reels' },
        { name: ar ? ' الصور' : ' Photos', href: '/photos' },
        { name: ar ? ' الانتقالات' : ' Transfers', href: '/transfers' },
      ],
    },
    {
      title: ar ? ' الرياضة' : ' Sports',
      links: [
        { name: ar ? ' المباريات' : ' Matches', href: '/matches' },
        { name: ar ? ' البطولات' : ' Tournaments & Leagues', href: '/leagues' },
        { name: ar ? ' الفرق' : ' Teams & Clubs', href: '/teams' },
        { name: ar ? ' اللاعبون' : ' Players', href: '/players' },
        { name: ar ? ' المدربون' : ' Coaches', href: '/coaches' },
        { name: ar ? ' القنوات الناقلة' : ' TV Channels', href: '/channels' },
        { name: ar ? ' يلا سبورت مباشر' : ' Yalla Sport Live', href: '/live', badge: 'LIVE' },
      ],
    },
    {
      title: ar ? "الإحصائيات والتفاعل" : ' Stats & Interaction',
      links: [
        { name: ar ? ' مركز الإحصائيات' : ' Stats Center', href: '/stats' },
        { name: ar ? 'الأحداث' : 'Events', href: '/events' },
        { name: ar ? ' مقارنة اللاعبين' : ' Compare Players', href: '/compare-players' },
        { name: ar ? ' مقارنة الأندية' : ' Compare Clubs', href: '/compare' },
        { name: ar ? ' لوحة الصدارة والتوقعات' : ' Leaderboard & Predictions', href: '/leaderboard' },
        { name: ar ? ' مركز التواصل الاجتماعي' : ' Social Media Hub', href: '/social' },
      ],
    },
    {
      title: ar ? 'الحساب والخدمات' : 'Account & Services',
      links: [
        { name: ar ? ' المفضلة' : ' Favorites', href: '/favorites' },
        { name: ar ? ' تابع فريقك' : ' Follow Your Team', href: '/follow' },
        { name: ar ? ' حسابي' : ' My Account', href: '/profile' },
        { name: ar ? ' الإعدادات' : ' Settings', href: '/settings' },
        { name: ar ? ' تطبيق يلا سبورت' : ' Yalla Sport App', href: '/app' },
        ...(staff ? [{ name: ar ? ' لوحة الإدارة' : ' Control Desk', href: '/admin' }] : []),
      ],
    },
  ];

  const legalPolicies = [
    { name: ar ? ' سياسة الخصوصية' : ' Privacy Policy', href: '/privacy' },
    { name: ar ? ' الشروط والأحكام' : ' Terms & Conditions', href: '/terms' },
    { name: ar ? ' حقوق الملكية الفكرية' : ' Copyright & IP', href: '/copyright' },
    { name: ar ? ' ملفات تعريف الارتباط' : ' Cookie Policy', href: '/cookies' },
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
        {/* 24. أسفل الصفحة — الفوتر: الشعار والروابط الرئيسية */}
        <div className={styles.mast}>
          <div>
            <Link href="/" className={styles.brandLink} aria-label="Yalla Sport">
              <BrandMark size={48} />
            </Link>
            <p className={styles.brandDesc}>
              {ar
                ? 'يلا سبورت منصة رياضية متكاملة تجمع الأخبار الرياضية، المباريات والنتائج المباشرة، البطولات والدوريات، الفرق واللاعبين والمدربين، الإحصائيات، الانتقالات، الفيديو والصور، مع تغطية شاملة من مصادر موثوقة.'
                : 'Yalla Sport is a comprehensive sports platform aggregating sports news, live fixtures, scores, tournaments, teams, players, coaches, statistics, transfers, video highlights, and photos from verified sources.'}
            </p>

            {/* Direct Masthead Links (الرئيسية، من نحن، تواصل معنا، إبلاغ عن محتوى) */}
            <div className={styles.mastLinks}>
              {mastLinks.map((link) => (
                <Link key={link.href} href={link.href} className={styles.mastLinkItem}>
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          <div className={styles.invite}>
            <h4 className={styles.inviteTitle}>
              {ar ? 'النشرة البريدية الرياضية' : 'Sports Briefing'}
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

        {/* 4 Categorized Columns */}
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
                    <span>{link.name}</span>
                    {link.badge ? (
                      <span className={styles.linkBadge}>{link.badge}</span>
                    ) : null}
                  </Link>
                ))}
              </nav>
            </section>
          ))}
        </div>

        <div className={styles.closer}>
          <p>
            {ar
              ? "يلا سبورت — منصة رياضية متكاملة"
              : 'Yalla Sport — Complete sports'}
          </p>
        </div>

        {/* أسفلهم السياسات بطريقة مرتبة */}
        <div className={styles.bottom}>
          <div className={styles.policiesContainer}>
            <div className={styles.policyHeading}>
              {ar ? 'السياسات والشروط القانونية' : 'Legal Policies & Compliance'}
            </div>
            <div className={styles.legalLinks}>
              {legalPolicies.map((link) => (
                <Link key={link.href} href={link.href} className={styles.legalLink}>
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          <p className={styles.copyright}>
            © {year} {ar ? 'يلا سبورت. جميع الحقوق محفوظة.' : 'Yalla Sport. All rights reserved.'}
          </p>
        </div>
      </div>
    </footer>
  );
}
