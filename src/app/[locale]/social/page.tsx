import React from 'react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { pick } from '@/i18n/pick';
import { pageMetadata } from '@/lib/seo/site';
import { Link } from '@/i18n/navigation';
import {
  Share2,
  Send,
  MessageCircle,
  CheckCircle2,
  ArrowUpRight,
  ShieldAlert,
  Flame,
  Radio,
  Eye,
  Heart,
  Repeat2,
  Check,
} from 'lucide-react';
import styles from './social.module.css';
import { getPublishedSocialFeed, getSocialAccounts } from '@/lib/social/service';
import { SocialPlatform, PLATFORM_SPECS } from '@/lib/social/types';

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export const revalidate = 60; // Refresh live feed every 60 seconds

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({
    locale,
    title: pick(locale, 'مركز التواصل الاجتماعي والمجتمع | يلا سبورت', 'Social Hub & Community | Yalla Sport'),
    description: pick(
      locale,
      'تابع التغطية الرياضية اللحظية والمنشورات الرسمية لمنصة يلا سبورت عبر تيليجرام، إكس، يوتيوب، وواتساب.',
      'Follow breaking sports coverage and official feeds of Yalla Sport across Telegram, X, YouTube, and WhatsApp.'
    ),
    path: '/social',
  });
}

export default async function SocialHubPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ platform?: string }>;
}) {
  const { locale } = await params;
  const { platform } = (await searchParams) || {};
  setRequestLocale(locale);
  const ar = locale === 'ar';

  const validPlatform = platform && Object.keys(PLATFORM_SPECS).includes(platform)
    ? (platform as SocialPlatform)
    : undefined;

  const [accounts, feedPosts] = await Promise.all([
    getSocialAccounts(),
    getPublishedSocialFeed(validPlatform, 24),
  ]);

  const channelIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    TELEGRAM: Send,
    TWITTER: TwitterIcon,
    YOUTUBE: YoutubeIcon,
    WHATSAPP: MessageCircle,
    FACEBOOK: FacebookIcon,
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.badge}>
          <Share2 className="h-4 w-4" />
          <span>{ar ? 'مركز التواصل الاجتماعي الرسمي' : 'Official Social Hub'}</span>
        </div>
        <h1 className={styles.title}>
          {ar ? 'قنوات يلا سبورت الرسمية والمنشورات المباشرة' : 'Official Yalla Sport Channels & Live Feeds'}
        </h1>
        <p className={styles.subtitle}>
          {ar
            ? 'تابع أحدث التغطيات التحليلية، أهداف المباريات، والأخبار العاجلة الصادرة عبر قنواتنا الموثقة.'
            : 'Explore breaking sports news, video clips, and tactical analysis from our verified official media.'}
        </p>
      </header>

      {/* Official Verified Accounts Cards */}
      <section>
        <h2 className={styles.sectionTitle}>
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <span>{ar ? 'الحسابات والقنوات الرسمية المعتمدة' : 'Official Verified Channels'}</span>
        </h2>

        <div className={styles.grid}>
          {accounts.map((acc) => {
            const spec = PLATFORM_SPECS[acc.platform];
            const Icon = channelIcons[acc.platform] || Send;

            return (
              <article key={acc.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div
                    className={styles.iconWrap}
                    style={{ background: `${spec.brandColor}18`, color: spec.brandColor }}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className={styles.chanBadge}>
                    {acc.verified ? (ar ? 'موثق رسمياً' : 'Verified') : (ar ? 'قناة رسمية' : 'Official')}
                  </span>
                </div>

                <div style={{ flex: 1 }}>
                  <h3 className={styles.chanTitle}>{acc.accountName}</h3>
                  <p className={styles.chanDesc}>{acc.accountHandle}</p>
                  <div className={styles.followersRow}>
                    <Check className="h-3.5 w-3.5" />
                    <span>
                      {acc.followersCount !== null
                        ? `${acc.followersCount.toLocaleString()} ${ar ? 'متابع' : 'followers'}`
                        : (ar ? 'المتابعون: غير متاح' : 'Followers: N/A')}
                    </span>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <a
                    href={acc.profileUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.joinBtn}
                  >
                    <span>{ar ? 'الانتقال للقناة' : 'Open Channel'}</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Live Actual Social Posts Feed */}
      <section className={styles.feedSection}>
        <div className={styles.feedHeader}>
          <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
            <Radio className="h-5 w-5 text-emerald-500 animate-pulse" />
            <span>{ar ? 'المنشورات الحية المنشورة فعلياً' : 'Live Official Social Feed'}</span>
          </h2>

          {/* Filter Pills */}
          <div className={styles.feedFilterPills}>
            <Link
              href="/social"
              className={`${styles.filterPill} ${!validPlatform ? styles.filterPillActive : ''}`}
            >
              {ar ? 'الكل' : 'All'}
            </Link>
            {(['TELEGRAM', 'TWITTER', 'FACEBOOK', 'WHATSAPP'] as SocialPlatform[]).map((pl) => (
              <Link
                key={pl}
                href={`/social?platform=${pl}`}
                className={`${styles.filterPill} ${validPlatform === pl ? styles.filterPillActive : ''}`}
              >
                <span>{PLATFORM_SPECS[pl].name}</span>
              </Link>
            ))}
          </div>
        </div>

        {feedPosts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--card)', borderRadius: 16 }}>
            <p style={{ color: 'var(--muted-foreground)', margin: 0 }}>
              {ar ? 'لا توجد منشورات متاحة في هذه المنصة حالياً.' : 'No posts currently published on this platform.'}
            </p>
          </div>
        ) : (
          <div className={styles.feedGrid}>
            {feedPosts.map((post) => {
              const spec = PLATFORM_SPECS[post.platform];
              const mediaArr: string[] = Array.isArray(post.mediaUrls) ? (post.mediaUrls as string[]) : [];

              return (
                <article key={post.id} className={styles.postCard}>
                  <div className={styles.postTop}>
                    <div className={styles.postAuthor}>
                      <div className={styles.authorAvatar} style={{ background: spec.brandColor }}>
                        YS
                      </div>
                      <div className={styles.authorMeta}>
                        <span className={styles.authorName}>
                          {post.account?.accountName || 'يلا سبورت'}
                          <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 inline" />
                        </span>
                        <span className={styles.postDate}>
                          {post.publishedAt
                            ? new Date(post.publishedAt).toLocaleDateString(ar ? 'ar-EG' : 'en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : (ar ? 'منشور حديث' : 'Recent')}
                        </span>
                      </div>
                    </div>

                    <span className={styles.platformPill} style={{ background: spec.brandColor }}>
                      {spec.name}
                    </span>
                  </div>

                  {/* Post Content */}
                  <div
                    className={styles.postContent}
                    dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br/>') }}
                  />

                  {/* Media Attachment if available */}
                  {mediaArr.length > 0 && mediaArr[0] && (
                    <div className={styles.postMedia}>
                      <img src={mediaArr[0]} alt="Post media attachment" loading="lazy" />
                    </div>
                  )}

                  {/* Engagement Metrics (Strictly avoid fake 0s: show actual or 'غير متاح') */}
                  <div className={styles.postMetricsRow}>
                    <div className={styles.metricItem}>
                      <Eye className="h-3.5 w-3.5" />
                      {post.viewsCount !== null ? (
                        <span>{post.viewsCount.toLocaleString()} {ar ? 'مشاهدة' : 'views'}</span>
                      ) : (
                        <span className={styles.metricNa}>{ar ? 'المشاهدات: غير متاح' : 'Views: N/A'}</span>
                      )}
                    </div>

                    <div className={styles.metricItem}>
                      <Heart className="h-3.5 w-3.5" />
                      {post.likesCount !== null ? (
                        <span>{post.likesCount.toLocaleString()}</span>
                      ) : (
                        <span className={styles.metricNa}>{ar ? 'التفاعل: غير متاح' : 'Likes: N/A'}</span>
                      )}
                    </div>

                    <div className={styles.metricItem}>
                      <Repeat2 className="h-3.5 w-3.5" />
                      {post.sharesCount !== null ? (
                        <span>{post.sharesCount.toLocaleString()}</span>
                      ) : (
                        <span className={styles.metricNa}>{ar ? 'المشاركات: غير متاح' : 'Shares: N/A'}</span>
                      )}
                    </div>
                  </div>

                  {/* View official link */}
                  {post.platformPostUrl && (
                    <div className={styles.postActionRow}>
                      <a
                        href={post.platformPostUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.viewOfficialBtn}
                      >
                        <span>{ar ? 'مشاهدة المنشور الأصلي' : 'View on Platform'}</span>
                        <ArrowUpRight className="h-4 w-4" />
                      </a>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Community Guidelines */}
      <section className={styles.guidelines}>
        <div className={styles.guideHead}>
          <ShieldAlert className="h-5 w-5 text-amber-500" />
          <h2 className={styles.guideTitle}>
            {ar ? 'ميثاق النشر والمجتمع الرياضي في يلا سبورت' : 'Community & Moderation Guidelines'}
          </h2>
        </div>
        <ul className={styles.guideList}>
          <li>
            <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-1" />
            <span>
              {ar
                ? 'الاعتماد الحصري على البيانات والمصادر الرسمية الموثقة للأندية والاتحادات الكروية.'
                : 'Strict reliance on verified sports sources and official confederation data.'}
            </span>
          </li>
          <li>
            <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-1" />
            <span>
              {ar
                ? 'نبذ التعصب الرياضي والإساءة؛ جميع منصاتنا تخضع للتدقيق التحريري المستمر.'
                : 'Zero tolerance for abusive conduct; all platforms are under continuous editorial moderation.'}
            </span>
          </li>
          <li>
            <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-1" />
            <span>
              {ar
                ? 'يمكنك الإبلاغ عن أي انتهاك لحقوق النشر أو مخالفة عبر صفحة الإبلاغ المعتمدة.'
                : 'Report any violations or copyright claims directly through our official portal.'}
            </span>
          </li>
        </ul>
        <div className={styles.reportActionRow}>
          <Link href="/report" className={styles.reportBtn}>
            {ar ? 'تقديم إبلاغ عن محتوى أو مخالفة' : 'File a Content Report'}
          </Link>
        </div>
      </section>
    </main>
  );
}
