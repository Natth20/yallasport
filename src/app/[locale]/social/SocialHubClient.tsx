'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styles from './social.module.css';
import { SocialPlatform, PLATFORM_SPECS } from '@/lib/social/types';
import {
  Share2,
  Send,
  MessageCircle,
  CheckCircle2,
  ArrowUpRight,
  Radio,
  Eye,
  Heart,
  Repeat2,
  Check,
  Search,
  RefreshCw,
  X,
  Copy,
  ExternalLink,
  Users,
  Bell,
  Sparkles,
} from 'lucide-react';

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

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function ThreadsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm3.89 12.89c-.31.62-.77 1.12-1.38 1.48-.6.36-1.3.54-2.1.54-.92 0-1.7-.24-2.33-.71-.63-.48-1.04-1.12-1.22-1.92h1.61c.14.43.38.77.72 1 .34.24.75.36 1.22.36.5 0 .93-.12 1.3-.35.36-.24.63-.58.8-1.02.17-.44.25-.97.25-1.59 0-.66-.08-1.21-.25-1.66-.17-.44-.44-.78-.8-1.01-.37-.23-.8-.35-1.3-.35-.47 0-.88.12-1.22.36-.34.24-.58.57-.72 1H8.86c.18-.8.59-1.44 1.22-1.92.63-.48 1.41-.71 2.33-.71.8 0 1.5.18 2.1.54.61.36 1.07.86 1.38 1.49.31.63.47 1.38.47 2.26 0 .88-.16 1.63-.47 2.26z" />
    </svg>
  );
}

const channelIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  TELEGRAM: Send,
  TWITTER: TwitterIcon,
  YOUTUBE: YoutubeIcon,
  WHATSAPP: MessageCircle,
  FACEBOOK: FacebookIcon,
  INSTAGRAM: InstagramIcon,
};

export interface SocialAccountItem {
  id: string;
  platform: SocialPlatform;
  accountName: string;
  accountHandle: string;
  avatarUrl: string | null;
  profileUrl: string | null;
  status: string;
  followersCount: number | null;
  verified: boolean;
  _count?: { posts: number };
}

export interface SocialPostItem {
  id: string;
  platform: SocialPlatform;
  content: string;
  mediaUrls: unknown;
  status: string;
  publishedAt: string | Date | null;
  platformPostId: string | null;
  platformPostUrl: string | null;
  viewsCount: number | null;
  likesCount: number | null;
  sharesCount: number | null;
  commentsCount: number | null;
  account: SocialAccountItem | null;
  author?: { name: string | null; image: string | null; role: string } | null;
}

interface Props {
  locale: string;
  initialAccounts: SocialAccountItem[];
  initialFeedPosts: SocialPostItem[];
  initialPlatform?: string;
}

export function SocialHubClient({
  locale,
  initialAccounts,
  initialFeedPosts,
  initialPlatform,
}: Props) {
  const isAr = locale === 'ar';
  const [accounts, setAccounts] = useState<SocialAccountItem[]>(initialAccounts);
  const [feedPosts, setFeedPosts] = useState<SocialPostItem[]>(initialFeedPosts);
  const [selectedPlatform, setSelectedPlatform] = useState<string>(initialPlatform || 'ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [countdown, setCountdown] = useState(30);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Live polling fetcher
  const fetchFeed = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const url = selectedPlatform !== 'ALL'
        ? `/api/social?platform=${selectedPlatform}`
        : '/api/social';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.feedPosts)) {
          setFeedPosts(data.feedPosts);
        }
        if (Array.isArray(data.accounts)) {
          setAccounts(data.accounts);
        }
        setLastRefreshedAt(new Date());
      }
    } catch (err) {
      console.error('Failed to sync social feed:', err);
    } finally {
      setIsRefreshing(false);
      setCountdown(30);
    }
  }, [selectedPlatform]);

  // Countdown timer
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchFeed();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefresh, fetchFeed]);

  // Handle platform filter click
  const handlePlatformSelect = (pl: string) => {
    setSelectedPlatform(pl);
  };

  // Copy post link
  const handleCopyLink = (post: SocialPostItem) => {
    const url = post.platformPostUrl || `${window.location.origin}/${locale}/social#${post.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(post.id);
      setTimeout(() => setCopiedId(null), 2500);
    });
  };

  // Metrics
  const totalFollowers = useMemo(() => {
    return accounts.reduce((sum, a) => sum + (a.followersCount || 0), 0);
  }, [accounts]);

  // Filtered posts
  const filteredPosts = useMemo(() => {
    let list = feedPosts;
    if (selectedPlatform !== 'ALL') {
      list = list.filter((p) => p.platform === selectedPlatform);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.content.toLowerCase().includes(q) ||
          p.account?.accountName.toLowerCase().includes(q)
      );
    }
    return list;
  }, [feedPosts, selectedPlatform, searchQuery]);

  // Counts by platform
  const platformCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: feedPosts.length };
    for (const p of feedPosts) {
      counts[p.platform] = (counts[p.platform] || 0) + 1;
    }
    return counts;
  }, [feedPosts]);

  return (
    <div className={styles.clientWrapper}>
      {/* Dynamic Metrics Header Strip */}
      <div className={styles.socialStatsStrip}>
        <div className={styles.socialStatCard}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
            <Radio className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <span className={styles.statVal}>{feedPosts.length}</span>
            <span className={styles.statLabel}>{isAr ? 'منشور رياضي مباشر' : 'Live Posts'}</span>
          </div>
        </div>

        <div className={styles.socialStatCard}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
            <Users className="h-4 w-4" />
          </div>
          <div>
            <span className={styles.statVal}>{(totalFollowers / 1000).toFixed(0)}K+</span>
            <span className={styles.statLabel}>{isAr ? 'متابع عبر الشبكات' : 'Network Followers'}</span>
          </div>
        </div>

        <div className={styles.socialStatCard}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <span className={styles.statVal}>{accounts.length}</span>
            <span className={styles.statLabel}>{isAr ? 'قنوات موثقة' : 'Verified Channels'}</span>
          </div>
        </div>

        <div className={styles.socialStatCard}>
          <div className={styles.statIconWrap} style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}>
            <Bell className="h-4 w-4" />
          </div>
          <div>
            <span className={styles.statVal}>{isAr ? 'فوري' : 'Instant'}</span>
            <span className={styles.statLabel}>{isAr ? 'تنبيهات فورية' : 'Live Alerts'}</span>
          </div>
        </div>
      </div>

      {/* Official Verified Channels Grid */}
      <section className={styles.channelsSection}>
        <div className={styles.channelsHeadingRow}>
          <h2 className={styles.sectionTitle}>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <span>{isAr ? 'القنوات والحسابات الرسمية المعتمدة' : 'Official Verified Channels'}</span>
          </h2>
          <span className={styles.channelsSubText}>
            {isAr ? 'انقر على أي قناة لزيارتها فوراً والاشتراك' : 'Click to visit and subscribe'}
          </span>
        </div>

        <div className={styles.grid}>
          {accounts.map((acc) => {
            const spec = PLATFORM_SPECS[acc.platform];
            const Icon = channelIcons[acc.platform] || Send;
            const isSelected = selectedPlatform === acc.platform;

            return (
              <article
                key={acc.id}
                className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
                style={{
                  borderTopColor: spec.brandColor,
                  borderTopWidth: '3px',
                }}
              >
                <div className={styles.cardTop}>
                  <div
                    className={styles.iconWrap}
                    style={{ background: `${spec.brandColor}18`, color: spec.brandColor }}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className={styles.chanBadge}>
                    {acc.verified ? (isAr ? 'موثق رسمياً' : 'Verified') : (isAr ? 'قناة رسمية' : 'Official')}
                  </span>
                </div>

                <div className={styles.cardMain}>
                  <h3 className={styles.chanTitle}>{acc.accountName}</h3>
                  <p className={styles.chanDesc}>{acc.accountHandle}</p>
                  <div className={styles.followersRow}>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span>
                      {acc.followersCount !== null
                        ? `${acc.followersCount.toLocaleString()} ${isAr ? 'متابع' : 'followers'}`
                        : isAr
                        ? 'المتابعون: غير متاح'
                        : 'Followers: N/A'}
                    </span>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <a
                    href={acc.profileUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.joinBtn}
                    style={{ background: `${spec.brandColor}15`, color: spec.brandColor }}
                  >
                    <span>{isAr ? 'الانتقال للقناة' : 'Open Channel'}</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
              </article>
            );
          })}
        </div>

        {/* Threads Direct Connect Banner */}
        <div className={styles.threadsBanner}>
          <div className={styles.threadsBannerContent}>
            <div className={styles.threadsIconBadge}>
              <ThreadsIcon className="h-5 w-5" />
            </div>
            <div>
              <h4 className={styles.threadsTitle}>{isAr ? 'تغطية ونقاشات يلا سبورت عبر تطبيق Threads' : 'Follow us on Threads'}</h4>
              <p className={styles.threadsSub}>{isAr ? 'حوارات رياضية حصرية وتغطيات سريعة ومباشرة عبر @yallasport2' : 'Live discussions & quick updates @yallasport2'}</p>
            </div>
          </div>
          <a
            href="https://www.threads.com/@yallasport2"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.threadsBtn}
          >
            <span>{isAr ? 'متابعة الحساب' : 'Open Threads'}</span>
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* Action Toolbar: Search + Auto-Refresh */}
      <div className={styles.feedControlToolbar}>
        {/* Search */}
        <div className={styles.searchBox}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'ابحث في المنشورات الرياضية...' : 'Search posts...'}
            className={styles.searchInput}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className={styles.clearSearchBtn}>
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Live Controls */}
        <div className={styles.liveControls}>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`${styles.toggleAutoBtn} ${autoRefresh ? styles.toggleAutoActive : ''}`}
            title={isAr ? 'تشغيل أو إيقاف المزامنة اللحظية' : 'Toggle live sync'}
          >
            <Radio className={`h-3.5 w-3.5 ${autoRefresh ? 'animate-pulse text-emerald-500' : ''}`} />
            <span>
              {autoRefresh
                ? isAr
                  ? `مزامنة حية (${countdown}ث)`
                  : `Live Sync (${countdown}s)`
                : isAr
                ? 'المزامنة متوقفة'
                : 'Paused'}
            </span>
          </button>

          <button
            onClick={fetchFeed}
            disabled={isRefreshing}
            className={styles.manualRefreshBtn}
            title={isAr ? 'تحديث فوري للمنشورات' : 'Refresh Now'}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isAr ? 'تحديث' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Platform Filter Tabs (Swipeable Pills) */}
      <div className={styles.platformTabsContainer}>
        <div className={styles.platformTabsTrack}>
          {[
            { key: 'ALL', labelAr: 'كافة المنصات', labelEn: 'All Platforms', icon: Sparkles },
            { key: 'INSTAGRAM', labelAr: 'إنستغرام', labelEn: 'Instagram', icon: InstagramIcon },
            { key: 'TWITTER', labelAr: 'إكس (تويتر)', labelEn: 'X (Twitter)', icon: TwitterIcon },
            { key: 'FACEBOOK', labelAr: 'فيسبوك', labelEn: 'Facebook', icon: FacebookIcon },
            { key: 'WHATSAPP', labelAr: 'واتساب', labelEn: 'WhatsApp', icon: MessageCircle },
            { key: 'TELEGRAM', labelAr: 'تيليجرام', labelEn: 'Telegram', icon: Send },
            { key: 'YOUTUBE', labelAr: 'يوتيوب', labelEn: 'YouTube', icon: YoutubeIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = selectedPlatform === tab.key;
            const count = platformCounts[tab.key] || 0;

            return (
              <button
                key={tab.key}
                onClick={() => handlePlatformSelect(tab.key)}
                className={`${styles.platformTab} ${active ? styles.platformTabActive : ''}`}
              >
                <Icon className="h-4 w-4" />
                <span>{isAr ? tab.labelAr : tab.labelEn}</span>
                {count > 0 && <span className={styles.tabCountBadge}>{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feed Stream */}
      <section className={styles.feedSection}>
        {filteredPosts.length === 0 ? (
          <div className={styles.emptyFeedState}>
            <Share2 className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <h3>{isAr ? 'لا توجد منشورات مطابقة حالياً' : 'No posts match this filter'}</h3>
            <p>
              {isAr
                ? 'يتم تحديث المنشورات تلقائياً فور صدورها من المصادر الرسمية المعتمدة.'
                : 'Posts synchronize automatically with verified official outlets.'}
            </p>
            <button
              onClick={() => {
                setSelectedPlatform('ALL');
                setSearchQuery('');
              }}
              className={styles.resetBtn}
            >
              {isAr ? 'عرض كافة المنشورات' : 'View all posts'}
            </button>
          </div>
        ) : (
          <div className={styles.feedGrid}>
            {filteredPosts.map((post) => {
              const spec = PLATFORM_SPECS[post.platform];
              const Icon = channelIcons[post.platform] || Send;
              const mediaArr: string[] = Array.isArray(post.mediaUrls) ? (post.mediaUrls as string[]) : [];
              const isCopied = copiedId === post.id;

              return (
                <article key={post.id} className={styles.postCard}>
                  {/* Card Top: Author, Platform badge, Time */}
                  <div className={styles.postTop}>
                    <div className={styles.postAuthor}>
                      <div
                        className={styles.authorAvatar}
                        style={{ background: `${spec.brandColor}22`, color: spec.brandColor }}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className={styles.authorMeta}>
                        <span className={styles.authorName}>
                          {post.account?.accountName || 'يلا سبورت'}
                          <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 inline" />
                        </span>
                        <span className={styles.postDate}>
                          {post.publishedAt
                            ? new Date(post.publishedAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : isAr
                            ? 'منشور حديث'
                            : 'Recent'}
                        </span>
                      </div>
                    </div>

                    <span
                      className={styles.platformPill}
                      style={{
                        background: `${spec.brandColor}18`,
                        color: spec.brandColor,
                        borderColor: `${spec.brandColor}35`,
                      }}
                    >
                      {spec.name}
                    </span>
                  </div>

                  {/* Media Attachment if available */}
                  {mediaArr.length > 0 && mediaArr[0] && (
                    <div className={styles.postMedia}>
                      <img src={mediaArr[0]} alt="Post media attachment" loading="lazy" />
                    </div>
                  )}

                  {/* Post Content */}
                  <div
                    className={styles.postContent}
                    dangerouslySetInnerHTML={{
                      __html: post.content.replace(/\n/g, '<br/>'),
                    }}
                  />

                  {/* Post Stats & Interactions */}
                  <div className={styles.postStats}>
                    {post.viewsCount !== null && (
                      <span className={styles.statItem} title={isAr ? 'المشاهدات' : 'Views'}>
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{post.viewsCount.toLocaleString()}</span>
                      </span>
                    )}
                    {post.likesCount !== null && (
                      <span className={styles.statItem} title={isAr ? 'الإعجابات' : 'Likes'}>
                        <Heart className="h-3.5 w-3.5 text-rose-500" />
                        <span>{post.likesCount.toLocaleString()}</span>
                      </span>
                    )}
                    {post.sharesCount !== null && (
                      <span className={styles.statItem} title={isAr ? 'إعادة النشر' : 'Shares'}>
                        <Repeat2 className="h-3.5 w-3.5 text-emerald-500" />
                        <span>{post.sharesCount.toLocaleString()}</span>
                      </span>
                    )}
                  </div>

                  {/* Post Actions Footer */}
                  <div className={styles.postActionsFooter}>
                    <button
                      onClick={() => handleCopyLink(post)}
                      className={styles.actionIconBtn}
                      title={isAr ? 'نسخ رابط المنشور' : 'Copy post link'}
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                          <span style={{ color: '#10b981', fontSize: '0.75rem' }}>
                            {isAr ? 'تم النسخ!' : 'Copied!'}
                          </span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>{isAr ? 'مشاركة' : 'Share'}</span>
                        </>
                      )}
                    </button>

                    {(() => {
                      const targetUrl =
                        post.platformPostUrl &&
                        !post.platformPostUrl.includes('/status/20') &&
                        !post.platformPostUrl.includes('/status/10') &&
                        !post.platformPostUrl.includes('/status/30') &&
                        !post.platformPostUrl.includes('/100') &&
                        !post.platformPostUrl.includes('/150')
                          ? post.platformPostUrl
                          : post.platform === 'TWITTER'
                          ? 'https://x.com/yallasport'
                          : post.platform === 'FACEBOOK'
                          ? 'https://www.facebook.com/yallasport.2008'
                          : post.platform === 'INSTAGRAM'
                          ? 'https://www.instagram.com/yallasport2/'
                          : post.platform === 'WHATSAPP'
                          ? 'https://whatsapp.com/channel/0029Vb8wYmS1iUxXYSM3gn3D'
                          : post.platform === 'TELEGRAM'
                          ? 'https://t.me/yallasport'
                          : 'https://youtube.com/@yallasport';

                      return (
                        <a
                          href={targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.openOriginalLink}
                          style={{ color: spec.brandColor }}
                        >
                          <span>{isAr ? `مشاهدة عبر ${spec.name}` : `View on ${spec.name}`}</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      );
                    })()}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
