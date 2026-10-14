'use client';

import React, { useState, useTransition } from 'react';
import styles from './admin-social.module.css';
import {
  SocialPlatform,
  SocialPostStatus,
  SocialAccountStatus,
  PLATFORM_SPECS,
  canComposeSocial,
  canReviewSocial,
  canApproveSocial,
  canPublishSocial,
  canManageSocialAccounts,
  getStatusArabicLabel,
  getRoleArabicTitle,
} from '@/lib/social/types';
import {
  createPostAction,
  submitForReviewAction,
  reviewPostAction,
  schedulePostAction,
  publishNowAction,
  retryPostAction,
  deletePostAction,
  testAccountConnectionAction,
  saveAccountConfigAction,
  triggerScheduledQueueAction,
  generateFromMatchAction,
  generateFromNewsAction,
} from './actions';
import {
  Share2,
  Send,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  Eye,
  Trash2,
  Radio,
  FileText,
  BarChart2,
  ExternalLink,
  ShieldCheck,
  Check,
  X,
  Play,
  Settings,
  Flame,
} from 'lucide-react';

interface SocialAccountItem {
  id: string;
  platform: SocialPlatform;
  accountName: string;
  accountHandle: string;
  status: SocialAccountStatus;
  followersCount: number | null;
  verified: boolean;
  lastSyncAt: Date | string | null;
  errorMessage: string | null;
  authConfig: unknown;
  _count?: { posts: number };
}

interface SocialPostItem {
  id: string;
  platform: SocialPlatform;
  content: string;
  mediaUrls: unknown;
  status: SocialPostStatus;
  scheduledAt: Date | string | null;
  publishedAt: Date | string | null;
  idempotencyKey: string;
  platformPostId: string | null;
  platformPostUrl: string | null;
  viewsCount: number | null;
  likesCount: number | null;
  sharesCount: number | null;
  reviewNotes: string | null;
  createdAt: Date | string;
  account?: { accountName: string; accountHandle: string } | null;
  author?: { name: string | null; role: string } | null;
  reviewer?: { name: string | null; role: string } | null;
}

interface LogItem {
  id: string;
  postId: string;
  status: string;
  attempt: number;
  statusCode: number | null;
  errorMessage: string | null;
  executedAt: Date | string;
  post?: {
    platform: SocialPlatform;
    content: string;
    platformPostUrl: string | null;
  };
}

interface MatchOption {
  id: string;
  home: string;
  away: string;
  league: string;
  kickoff: string;
}

interface NewsOption {
  id: string;
  title: string;
  breaking: boolean;
}

interface Props {
  locale: string;
  userRole: string;
  userName: string;
  metrics: {
    totalPosts: number;
    drafts: number;
    inReview: number;
    approved: number;
    scheduled: number;
    published: number;
    failed: number;
    connectedAccounts: number;
    recentLogs: LogItem[];
  };
  accounts: SocialAccountItem[];
  initialPosts: SocialPostItem[];
  recentMatches: MatchOption[];
  recentNews: NewsOption[];
}

export function SocialAdminClient({
  locale,
  userRole,
  userName,
  metrics,
  accounts,
  initialPosts,
  recentMatches,
  recentNews,
}: Props) {
  const isAr = locale === 'ar';
  const [activeTab, setActiveTab] = useState<'overview' | 'posts' | 'composer' | 'accounts' | 'logs'>('overview');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [posts, setPosts] = useState<SocialPostItem[]>(initialPosts);
  const [isPending, startTransition] = useTransition();
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Composer State
  const [compPlatform, setCompPlatform] = useState<SocialPlatform>('TELEGRAM');
  const [compContent, setCompContent] = useState('');
  const [compMediaUrl, setCompMediaUrl] = useState('');
  const [compScheduledAt, setCompScheduledAt] = useState('');
  const [selectedMatchId, setSelectedMatchId] = useState(recentMatches[0]?.id || '');
  const [matchAlertType, setMatchAlertType] = useState<'KICKOFF' | 'FINAL_RESULT' | 'LIVE_UPDATE'>('KICKOFF');
  const [selectedNewsId, setSelectedNewsId] = useState(recentNews[0]?.id || '');

  // Modals
  const [previewPost, setPreviewPost] = useState<SocialPostItem | null>(null);
  const [reviewModalPost, setReviewModalPost] = useState<SocialPostItem | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [scheduleModalPost, setScheduleModalPost] = useState<SocialPostItem | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [configModalAccount, setConfigModalAccount] = useState<SocialAccountItem | null>(null);
  const [cfgBotToken, setCfgBotToken] = useState('');
  const [cfgChannelId, setCfgChannelId] = useState('');

  // Permissions
  const canCompose = canComposeSocial(userRole);
  const canReview = canReviewSocial(userRole);
  const canApprove = canApproveSocial(userRole);
  const canPublish = canPublishSocial(userRole);
  const canManageAccounts = canManageSocialAccounts(userRole);

  const showBanner = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage(null), 5000);
  };

  // Quick Match Generator
  const handleGenerateFromMatch = () => {
    if (!selectedMatchId) return;
    startTransition(async () => {
      try {
        const res = await generateFromMatchAction(selectedMatchId, matchAlertType, compPlatform);
        if (res.success && res.generated) {
          setCompContent(res.generated.content);
          if (res.generated.mediaUrls[0]) setCompMediaUrl(res.generated.mediaUrls[0]);
          showBanner(isAr ? 'تم توليد المنشور من بيانات المباراة الفعلية!' : 'Generated from actual match data!');
        } else {
          showBanner(isAr ? 'تعذر توليد المنشور' : 'Could not generate post', 'error');
        }
      } catch (e) {
        showBanner(e instanceof Error ? e.message : 'Error generating post', 'error');
      }
    });
  };

  // Quick News Generator
  const handleGenerateFromNews = () => {
    if (!selectedNewsId) return;
    startTransition(async () => {
      try {
        const res = await generateFromNewsAction(selectedNewsId, compPlatform);
        if (res.success && res.generated) {
          setCompContent(res.generated.content);
          if (res.generated.mediaUrls[0]) setCompMediaUrl(res.generated.mediaUrls[0]);
          showBanner(isAr ? 'تم توليد المنشور من الخبر بنجاح!' : 'Generated from news story!');
        }
      } catch (e) {
        showBanner(e instanceof Error ? e.message : 'Error generating post', 'error');
      }
    });
  };

  // Submit Post to DB
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!compContent.trim()) {
      showBanner(isAr ? 'الرجاء إدخال نص المنشور' : 'Please provide post content', 'error');
      return;
    }

    startTransition(async () => {
      try {
        const res = await createPostAction({
          platform: compPlatform,
          content: compContent,
          mediaUrls: compMediaUrl ? [compMediaUrl] : [],
          scheduledAt: compScheduledAt ? compScheduledAt : null,
        });

        if (res.success && res.post) {
          setPosts([res.post as unknown as SocialPostItem, ...posts]);
          setCompContent('');
          setCompMediaUrl('');
          setCompScheduledAt('');
          setActiveTab('posts');
          showBanner(isAr ? 'تم حفظ المنشور بنجاح في دورة العمل!' : 'Post saved successfully into workflow!');
        }
      } catch (err) {
        showBanner(err instanceof Error ? err.message : 'Error creating post', 'error');
      }
    });
  };

  // Lifecycle Actions
  const handleSubmitForReview = (postId: string) => {
    startTransition(async () => {
      try {
        await submitForReviewAction(postId);
        setPosts(posts.map((p) => (p.id === postId ? { ...p, status: 'IN_REVIEW' as SocialPostStatus } : p)));
        showBanner(isAr ? 'تم تقديم المنشور للمراجعة والتدقيق' : 'Submitted for review');
      } catch (err) {
        showBanner(err instanceof Error ? err.message : 'Error submitting for review', 'error');
      }
    });
  };

  const handleReviewDecision = (action: 'APPROVE' | 'REJECT') => {
    if (!reviewModalPost) return;
    startTransition(async () => {
      try {
        await reviewPostAction(reviewModalPost.id, action, reviewNotes);
        const newStatus: SocialPostStatus = action === 'APPROVE' ? 'APPROVED' : 'DRAFT';
        setPosts(posts.map((p) => (p.id === reviewModalPost.id ? { ...p, status: newStatus, reviewNotes } : p)));
        setReviewModalPost(null);
        setReviewNotes('');
        showBanner(
          action === 'APPROVE'
            ? isAr ? 'تم اعتماد المنشور وهو جاهز للنشر أو الجدولة' : 'Post approved'
            : isAr ? 'تمت إعادة المنشور إلى مسودة مع الملاحظات' : 'Post returned to draft'
        );
      } catch (err) {
        showBanner(err instanceof Error ? err.message : 'Review action failed', 'error');
      }
    });
  };

  const handleSchedulePost = () => {
    if (!scheduleModalPost || !scheduleDate) return;
    startTransition(async () => {
      try {
        await schedulePostAction(scheduleModalPost.id, scheduleDate);
        setPosts(posts.map((p) => (p.id === scheduleModalPost.id ? { ...p, status: 'SCHEDULED', scheduledAt: scheduleDate } : p)));
        setScheduleModalPost(null);
        setScheduleDate('');
        showBanner(isAr ? 'تمت جدولة المنشور للنشر التلقائي عبر المحرك الخلفي!' : 'Post scheduled for background autonomous publishing!');
      } catch (err) {
        showBanner(err instanceof Error ? err.message : 'Scheduling failed', 'error');
      }
    });
  };

  const handlePublishNow = (postId: string) => {
    startTransition(async () => {
      try {
        const res = await publishNowAction(postId);
        if (res.success) {
          setPosts(
            posts.map((p) =>
              p.id === postId
                ? {
                    ...p,
                    status: 'PUBLISHED',
                    platformPostId: res.platformPostId || null,
                    platformPostUrl: res.platformPostUrl || null,
                    publishedAt: new Date().toISOString(),
                  }
                : p
            )
          );
          showBanner(isAr ? 'تم النشر بنجاح على القناة الرسمية وتوثيق المعرّف!' : 'Published successfully to official channel!');
        } else {
          showBanner(res.error || (isAr ? 'تعثر النشر على المنصة' : 'Publishing failed'), 'error');
        }
      } catch (err) {
        showBanner(err instanceof Error ? err.message : 'Publish failed', 'error');
      }
    });
  };

  const handleRetry = (postId: string) => {
    startTransition(async () => {
      try {
        const res = await retryPostAction(postId);
        if (res.success) {
          setPosts(
            posts.map((p) =>
              p.id === postId
                ? {
                    ...p,
                    status: 'PUBLISHED',
                    platformPostId: res.platformPostId || null,
                    platformPostUrl: res.platformPostUrl || null,
                    publishedAt: new Date().toISOString(),
                  }
                : p
            )
          );
          showBanner(isAr ? 'تمت إعادة المحاولة والنشر بنجاح مع منع التكرار!' : 'Retried and published successfully!');
        } else {
          showBanner(res.error || (isAr ? 'فشلت إعادة المحاولة' : 'Retry failed'), 'error');
        }
      } catch (err) {
        showBanner(err instanceof Error ? err.message : 'Retry failed', 'error');
      }
    });
  };

  const handleDelete = (postId: string) => {
    if (!confirm(isAr ? 'هل أنت متأكد من حذف هذا المنشور؟' : 'Are you sure you want to delete this post?')) return;
    startTransition(async () => {
      try {
        await deletePostAction(postId);
        setPosts(posts.filter((p) => p.id !== postId));
        showBanner(isAr ? 'تم حذف المنشور' : 'Post deleted');
      } catch (err) {
        showBanner(err instanceof Error ? err.message : 'Delete failed', 'error');
      }
    });
  };

  const handleTestConnection = (accountId: string) => {
    startTransition(async () => {
      try {
        const res = await testAccountConnectionAction(accountId);
        if (res.success) {
          showBanner(res.message);
        } else {
          showBanner(res.message, 'error');
        }
      } catch (err) {
        showBanner(err instanceof Error ? err.message : 'Test failed', 'error');
      }
    });
  };

  const handleTriggerQueue = () => {
    startTransition(async () => {
      try {
        const res = await triggerScheduledQueueAction();
        showBanner(
          isAr
            ? `اكتمل فحص الجدولة: تم معالجة ${res.processed}، نجح ${res.succeeded}، تعثر ${res.failed}.`
            : `Queue processed: ${res.processed} checked, ${res.succeeded} published, ${res.failed} failed.`
        );
      } catch (err) {
        showBanner(err instanceof Error ? err.message : 'Queue trigger failed', 'error');
      }
    });
  };

  const filteredPosts = posts.filter((p) => {
    if (statusFilter === 'ALL') return true;
    return p.status === statusFilter;
  });

  const spec = PLATFORM_SPECS[compPlatform];
  const charRemaining = spec.maxChars - compContent.length;

  return (
    <div className={styles.container}>
      {/* Top Bar with RBAC info */}
      <header className={styles.topBar}>
        <div className={styles.topBarInfo}>
          <h1>
            <Share2 className="h-6 w-6 text-emerald-500" />
            <span>{isAr ? 'مركز التواصل الاجتماعي وإدارة النشر' : 'Social Media & Publishing Center'}</span>
          </h1>
          <p>
            {isAr
              ? 'إدارة الحسابات الرسمية، دورة النشر التحريري (مسودة ← مراجعة ← اعتماد ← جدولة)، والتكامل مع المنصات عبر API الرسمية.'
              : 'Official social accounts, editorial workflow (Draft → Review → Approval → Schedule), and official API integrations.'}
          </p>
          <div style={{ marginTop: 8 }}>
            <span className={styles.roleBadge}>
              <ShieldCheck className="h-4 w-4" />
              <span>{getRoleArabicTitle(userRole)}: {userName}</span>
            </span>
          </div>
        </div>

        <div className={styles.topBarActions}>
          {canPublish && (
            <button
              onClick={handleTriggerQueue}
              disabled={isPending}
              className={styles.btnSecondary}
              title={isAr ? 'فحص ونشر المنشورات المجدولة المستحقة الآن' : 'Process scheduled queue now'}
            >
              <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
              <span>{isAr ? 'تشغيل رتل الجدولة الآن' : 'Run Scheduler Queue'}</span>
            </button>
          )}
          {canCompose && (
            <button
              onClick={() => setActiveTab('composer')}
              className={styles.btnPrimary}
            >
              <Plus className="h-4 w-4" />
              <span>{isAr ? 'إنشاء منشور جديد' : 'New Post'}</span>
            </button>
          )}
        </div>
      </header>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div
          style={{
            padding: '12px 20px',
            borderRadius: 12,
            background: actionMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${actionMessage.type === 'success' ? '#10b981' : '#ef4444'}`,
            color: actionMessage.type === 'success' ? '#047857' : '#b91c1c',
            fontWeight: 700,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          {actionMessage.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <nav className={styles.tabsNav}>
        <button
          onClick={() => setActiveTab('overview')}
          className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.tabBtnActive : ''}`}
        >
          <BarChart2 className="h-4 w-4" />
          <span>{isAr ? 'نظرة عامة والمؤشرات' : 'Overview & KPIs'}</span>
        </button>
        <button
          onClick={() => setActiveTab('posts')}
          className={`${styles.tabBtn} ${activeTab === 'posts' ? styles.tabBtnActive : ''}`}
        >
          <Radio className="h-4 w-4" />
          <span>{isAr ? 'المنشورات ودورة العمل' : 'Posts & Workflow'}</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>({posts.length})</span>
        </button>
        {canCompose && (
          <button
            onClick={() => setActiveTab('composer')}
            className={`${styles.tabBtn} ${activeTab === 'composer' ? styles.tabBtnActive : ''}`}
          >
            <FileText className="h-4 w-4" />
            <span>{isAr ? 'محرر المنشورات والقوالب' : 'Post Composer & Generator'}</span>
          </button>
        )}
        <button
          onClick={() => setActiveTab('accounts')}
          className={`${styles.tabBtn} ${activeTab === 'accounts' ? styles.tabBtnActive : ''}`}
        >
          <Settings className="h-4 w-4" />
          <span>{isAr ? 'الحسابات الرسمية وAPI' : 'Official Accounts & APIs'}</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>({accounts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`${styles.tabBtn} ${activeTab === 'logs' ? styles.tabBtnActive : ''}`}
        >
          <Clock className="h-4 w-4" />
          <span>{isAr ? 'سجل النشر والتدقيق' : 'Publish History Logs'}</span>
        </button>
      </nav>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* KPI Cards */}
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>{isAr ? 'إجمالي المنشورات' : 'Total Posts'}</span>
              <span className={styles.kpiValue}>{metrics.totalPosts}</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>{isAr ? 'مسودات قيد التحرير' : 'Drafts'}</span>
              <span className={styles.kpiValue} style={{ color: '#6b7280' }}>{metrics.drafts}</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>{isAr ? 'قيد المراجعة والتدقيق' : 'In Review'}</span>
              <span className={styles.kpiValue} style={{ color: '#f59e0b' }}>{metrics.inReview}</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>{isAr ? 'معتمد للنشر' : 'Approved'}</span>
              <span className={styles.kpiValue} style={{ color: '#10b981' }}>{metrics.approved}</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>{isAr ? 'مجدول عبر المحرك' : 'Scheduled'}</span>
              <span className={styles.kpiValue} style={{ color: '#3b82f6' }}>{metrics.scheduled}</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>{isAr ? 'تم النشر بنجاح' : 'Published'}</span>
              <span className={styles.kpiValue} style={{ color: '#059669' }}>{metrics.published}</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>{isAr ? 'حالات تعثر النشر' : 'Failed Attempts'}</span>
              <span className={styles.kpiValue} style={{ color: '#ef4444' }}>{metrics.failed}</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>{isAr ? 'الحسابات المربوطة' : 'Connected Accounts'}</span>
              <span className={styles.kpiValue} style={{ color: '#0088cc' }}>{metrics.connectedAccounts}</span>
            </div>
          </div>

          {/* Quick overview of workflow status */}
          <div className={styles.cardSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <Radio className="h-5 w-5 text-emerald-500" />
                <span>{isAr ? 'دورة عمل النشر التحريري (Workflow Pipeline)' : 'Publishing Workflow Pipeline'}</span>
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div style={{ padding: 16, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--muted)' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#6b7280', marginBottom: 6 }}>1. مسودة (Draft)</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
                  {isAr ? 'يتم الإنشاء يدويًا أو عبر تحويل بيانات المباريات والأخبار تلقائيًا.' : 'Created manually or converted from matches/news.'}
                </p>
              </div>
              <div style={{ padding: 16, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--muted)' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f59e0b', marginBottom: 6 }}>2. مراجعة (Review)</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
                  {isAr ? 'تدقيق الصياغة والروابط والوسوم من قبل المراجع أو المدير.' : 'Copy, hashtags, and links vetted by Reviewer/Manager.'}
                </p>
              </div>
              <div style={{ padding: 16, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--muted)' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#10b981', marginBottom: 6 }}>3. اعتماد (Approved)</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
                  {isAr ? 'اعتماد المنشور وجاهزيته للنشر الفوري أو وضعه في الجدولة.' : 'Approved and ready for immediate dispatch or scheduling.'}
                </p>
              </div>
              <div style={{ padding: 16, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--muted)' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#3b82f6', marginBottom: 6 }}>4. جدولة / نشر تلقائي</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
                  {isAr ? 'المحرك الخلفي ينفذ النشر آلياً بدون الحاجة لفتح المتصفح.' : 'Background scheduler dispatches autonomously.'}
                </p>
              </div>
              <div style={{ padding: 16, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--muted)' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#059669', marginBottom: 6 }}>5. تدقيق النتيجة</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
                  {isAr ? 'تسجيل معرّف المنصة ومنع التكرار نهائيًا عند إعادة المحاولة.' : 'Logs official platform ID and prevents duplication.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: POSTS & WORKFLOW */}
      {activeTab === 'posts' && (
        <div className={styles.cardSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.statusPills}>
              {['ALL', 'DRAFT', 'IN_REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'FAILED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`${styles.pillBtn} ${statusFilter === st ? styles.pillBtnActive : ''}`}
                >
                  {st === 'ALL'
                    ? isAr ? 'جميع المنشورات' : 'All'
                    : getStatusArabicLabel(st as SocialPostStatus).label}
                </button>
              ))}
            </div>

            {canCompose && (
              <button onClick={() => setActiveTab('composer')} className={styles.btnPrimary}>
                <Plus className="h-4 w-4" />
                <span>{isAr ? 'منشور جديد' : 'New Post'}</span>
              </button>
            )}
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{isAr ? 'المنصة' : 'Platform'}</th>
                  <th>{isAr ? 'محتوى المنشور' : 'Content'}</th>
                  <th>{isAr ? 'الحالة' : 'Status'}</th>
                  <th>{isAr ? 'التوقيت / الجدولة' : 'Time / Schedule'}</th>
                  <th>{isAr ? 'المحرر / المراجع' : 'Author / Reviewer'}</th>
                  <th>{isAr ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted-foreground)' }}>
                      {isAr ? 'لا توجد منشورات مطابقة للفلاتر المحددة.' : 'No posts matching the selected filter.'}
                    </td>
                  </tr>
                ) : (
                  filteredPosts.map((post) => {
                    const st = getStatusArabicLabel(post.status);
                    const pSpec = PLATFORM_SPECS[post.platform];
                    return (
                      <tr key={post.id}>
                        <td>
                          <span className={styles.platformTag} style={{ background: pSpec.brandColor }}>
                            {pSpec.name}
                          </span>
                        </td>
                        <td style={{ maxWidth: 360 }}>
                          <p style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', fontSize: '0.85rem' }}>
                            {post.content}
                          </p>
                          {post.platformPostUrl && (
                            <a
                              href={post.platformPostUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: '#0088cc', marginTop: 4, fontWeight: 700 }}
                            >
                              <span>{isAr ? 'عرض على القناة الرسمية' : 'View on Channel'}</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          {post.reviewNotes && (
                            <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: 4 }}>
                              <b>{isAr ? 'ملاحظة:' : 'Note:'}</b> {post.reviewNotes}
                            </div>
                          )}
                        </td>
                        <td>
                          <span
                            className={styles.statusBadge}
                            style={{
                              background: `${st.color}15`,
                              color: st.color,
                              border: `1px solid ${st.color}40`,
                            }}
                          >
                            {st.label}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
                          {post.publishedAt ? (
                            <div>
                              <span style={{ color: '#059669', fontWeight: 700 }}>
                                {isAr ? 'تم النشر: ' : 'Published: '}
                              </span>
                              {new Date(post.publishedAt).toLocaleString(isAr ? 'ar-EG' : 'en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          ) : post.scheduledAt ? (
                            <div>
                              <span style={{ color: '#3b82f6', fontWeight: 700 }}>
                                {isAr ? 'مجدول لـ: ' : 'Scheduled for: '}
                              </span>
                              {new Date(post.scheduledAt).toLocaleString(isAr ? 'ar-EG' : 'en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          ) : (
                            new Date(post.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')
                          )}
                        </td>
                        <td style={{ fontSize: '0.8rem' }}>
                          <div>{post.author?.name || (isAr ? 'المحرر' : 'Editor')}</div>
                          {post.reviewer && (
                            <div style={{ fontSize: '0.7rem', color: '#10b981' }}>
                              ✓ {post.reviewer.name}
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {/* Preview */}
                            <button
                              onClick={() => setPreviewPost(post)}
                              className={styles.btnSecondary}
                              style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                              title={isAr ? 'معاينة المنشور' : 'Preview'}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>

                            {/* Submit for review (Draft or Failed) */}
                            {(post.status === 'DRAFT' || post.status === 'FAILED') && canCompose && (
                              <button
                                onClick={() => handleSubmitForReview(post.id)}
                                className={styles.btnSecondary}
                                style={{ padding: '6px 10px', fontSize: '0.75rem', color: '#f59e0b' }}
                                title={isAr ? 'تقديم للمراجعة' : 'Submit for review'}
                              >
                                <Send className="h-3.5 w-3.5" />
                                <span>{isAr ? 'طلب مراجعة' : 'Review'}</span>
                              </button>
                            )}

                            {/* Review & Approve / Reject (In Review) */}
                            {post.status === 'IN_REVIEW' && (canReview || canApprove) && (
                              <button
                                onClick={() => setReviewModalPost(post)}
                                className={styles.btnSecondary}
                                style={{ padding: '6px 10px', fontSize: '0.75rem', color: '#10b981', fontWeight: 800 }}
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                <span>{isAr ? 'تدقيق واعتماد' : 'Approve'}</span>
                              </button>
                            )}

                            {/* Schedule (Approved) */}
                            {post.status === 'APPROVED' && canPublish && (
                              <button
                                onClick={() => setScheduleModalPost(post)}
                                className={styles.btnSecondary}
                                style={{ padding: '6px 10px', fontSize: '0.75rem', color: '#3b82f6' }}
                              >
                                <Calendar className="h-3.5 w-3.5" />
                                <span>{isAr ? 'جدولة' : 'Schedule'}</span>
                              </button>
                            )}

                            {/* Publish Now (Approved or Scheduled) */}
                            {(post.status === 'APPROVED' || post.status === 'SCHEDULED') && canPublish && (
                              <button
                                onClick={() => handlePublishNow(post.id)}
                                className={styles.btnPrimary}
                                style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                              >
                                <Play className="h-3.5 w-3.5" />
                                <span>{isAr ? 'نشر فوري' : 'Publish'}</span>
                              </button>
                            )}

                            {/* Retry (Failed) with idempotency */}
                            {post.status === 'FAILED' && canPublish && (
                              <button
                                onClick={() => handleRetry(post.id)}
                                className={styles.btnSecondary}
                                style={{ padding: '6px 10px', fontSize: '0.75rem', color: '#ef4444' }}
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                                <span>{isAr ? 'إعادة المحاولة' : 'Retry'}</span>
                              </button>
                            )}

                            {/* Delete */}
                            {post.status !== 'PUBLISHED' && canCompose && (
                              <button
                                onClick={() => handleDelete(post.id)}
                                className={styles.btnSecondary}
                                style={{ padding: '6px 8px', fontSize: '0.75rem', color: '#ef4444' }}
                                title={isAr ? 'حذف' : 'Delete'}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: COMPOSER & SMART GENERATOR */}
      {activeTab === 'composer' && canCompose && (
        <div className={styles.composerGrid}>
          {/* Main Composer Box */}
          <div className={styles.cardSection}>
            {/* Quick Generator Box: Matches & News */}
            <div className={styles.generatorBox}>
              <div className={styles.genHeader}>
                <span className={styles.genTitle}>
                  <Flame className="h-4 w-4" />
                  <span>{isAr ? 'المحول الذكي: تحويل المباريات والأخبار لمنشورات فورية' : 'Smart Sports Content Generator'}</span>
                </span>
              </div>

              {/* Match converter */}
              <div style={{ marginBottom: 14 }}>
                <label className={styles.formLabel}>{isAr ? 'توليد من مباراة فعلية:' : 'Generate from Match:'}</label>
                <div className={styles.genRow}>
                  <select
                    value={selectedMatchId}
                    onChange={(e) => setSelectedMatchId(e.target.value)}
                    className={styles.input}
                    style={{ flex: 1, minWidth: 200 }}
                  >
                    {recentMatches.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.home} 🆚 {m.away} ({m.league})
                      </option>
                    ))}
                  </select>

                  <select
                    value={matchAlertType}
                    onChange={(e) => setMatchAlertType(e.target.value as unknown as 'KICKOFF')}
                    className={styles.input}
                    style={{ width: 140 }}
                  >
                    <option value="KICKOFF">{isAr ? 'تنبيه موعد وقنوات' : 'Kickoff Alert'}</option>
                    <option value="FINAL_RESULT">{isAr ? 'النتيجة النهائية' : 'Final Result'}</option>
                    <option value="LIVE_UPDATE">{isAr ? 'تحديث مباشر' : 'Live Update'}</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleGenerateFromMatch}
                    disabled={isPending}
                    className={styles.btnSecondary}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {isAr ? 'توليد الصياغة' : 'Generate'}
                  </button>
                </div>
              </div>

              {/* News converter */}
              {recentNews.length > 0 && (
                <div>
                  <label className={styles.formLabel}>{isAr ? 'توليد من خبر منشور:' : 'Generate from News Story:'}</label>
                  <div className={styles.genRow}>
                    <select
                      value={selectedNewsId}
                      onChange={(e) => setSelectedNewsId(e.target.value)}
                      className={styles.input}
                      style={{ flex: 1, minWidth: 200 }}
                    >
                      {recentNews.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.breaking ? '🚨 ' : ''}{n.title}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={handleGenerateFromNews}
                      disabled={isPending}
                      className={styles.btnSecondary}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {isAr ? 'توليد الخبر' : 'Generate'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Platform Selection */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>{isAr ? 'اختر المنصة المستهدفة:' : 'Target Platform:'}</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(['TELEGRAM', 'TWITTER', 'FACEBOOK', 'INSTAGRAM', 'YOUTUBE', 'WHATSAPP'] as SocialPlatform[]).map((pl) => {
                  const p = PLATFORM_SPECS[pl];
                  const active = compPlatform === pl;
                  return (
                    <button
                      key={pl}
                      type="button"
                      onClick={() => setCompPlatform(pl)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 10,
                        border: `2px solid ${active ? p.brandColor : 'var(--border)'}`,
                        background: active ? `${p.brandColor}15` : 'none',
                        color: active ? p.brandColor : 'var(--foreground)',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: p.brandColor,
                        }}
                      />
                      <span>{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Textarea */}
            <form onSubmit={handleCreatePost}>
              <div className={styles.formGroup}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className={styles.formLabel}>{isAr ? 'نص المنشور:' : 'Post Content:'}</label>
                  <span className={`${styles.charCount} ${charRemaining < 0 ? styles.charWarning : ''}`}>
                    {compContent.length} / {spec.maxChars} {isAr ? 'حرف' : 'chars'}
                    {charRemaining < 0 && (isAr ? ' (تجاوز الحد!)' : ' (Limit exceeded!)')}
                  </span>
                </div>
                <textarea
                  value={compContent}
                  onChange={(e) => setCompContent(e.target.value)}
                  placeholder={
                    compPlatform === 'TWITTER'
                      ? isAr
                        ? 'أدخل التغريدة مع الهاشتاجات (حد أقصى 280 حرف)...'
                        : 'Enter tweet with hashtags (max 280 chars)...'
                      : isAr
                      ? 'أدخل نص المنشور (يدعم وسوم HTML مثل <b>، <i>، وروابط)...'
                      : 'Enter post content (HTML supported: <b>, <i>, links)...'
                  }
                  className={styles.textarea}
                  required
                />
              </div>

              {/* Media URL */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{isAr ? 'رابط الصورة المرفقة (اختياري):' : 'Media Image URL (Optional):'}</label>
                <input
                  type="url"
                  value={compMediaUrl}
                  onChange={(e) => setCompMediaUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or /images/..."
                  className={styles.input}
                />
              </div>

              {/* Scheduled Date/Time */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{isAr ? 'موعد الجدولة (اتركه فارغاً للحفظ كمسودة فورا):' : 'Schedule At (Leave empty for Draft):'}</label>
                <input
                  type="datetime-local"
                  value={compScheduledAt}
                  onChange={(e) => setCompScheduledAt(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
                <button
                  type="submit"
                  disabled={isPending || charRemaining < 0}
                  className={styles.btnPrimary}
                  style={{ minWidth: 160 }}
                >
                  <Plus className="h-4 w-4" />
                  <span>
                    {compScheduledAt
                      ? isAr ? 'جدولة المنشور' : 'Schedule Post'
                      : isAr ? 'حفظ كمسودة في دورة العمل' : 'Save as Draft'}
                  </span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Live Mockup Preview */}
          <div>
            <div style={{ marginBottom: 12, fontWeight: 700, fontSize: '0.95rem' }}>
              {isAr ? 'معاينة الجهاز والمنصة الحية:' : 'Live Device & Platform Preview:'}
            </div>
            <div className={styles.previewBox}>
              <div className={styles.previewHead}>
                <div className={styles.previewAvatar} style={{ background: spec.brandColor }}>
                  YS
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>يلا سبورت | Yalla Sport</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                    {compPlatform === 'TELEGRAM' ? '@yallasport' : '@yallasport'}
                  </div>
                </div>
              </div>

              <div
                className={styles.previewText}
                dangerouslySetInnerHTML={{
                  __html: compContent
                    ? compContent.replace(/\n/g, '<br/>')
                    : `<span style="color: #9ca3af; font-style: italic;">${isAr ? 'سيظهر نص المنشور هنا أثناء الكتابة...' : 'Post text will appear here...'}</span>`,
                }}
              />

              {compMediaUrl && (
                <div style={{ borderRadius: 10, overflow: 'hidden', maxHeight: 200 }}>
                  <img
                    src={compMediaUrl}
                    alt="Preview media"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}

              <div className={styles.previewFooter}>
                <span>{spec.name}</span>
                <span>{new Date().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: OFFICIAL ACCOUNTS & APIS */}
      {activeTab === 'accounts' && (
        <div className={styles.cardSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Settings className="h-5 w-5 text-emerald-500" />
              <span>{isAr ? 'الحسابات الرسمية وإدارة الربط عبر API' : 'Official Accounts & API Integration'}</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {accounts.map((acc) => {
              const specItem = PLATFORM_SPECS[acc.platform];
              const isConnected = acc.status === 'CONNECTED';
              return (
                <div key={acc.id} className={styles.accountCard}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: `${specItem.brandColor}15`,
                        color: specItem.brandColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1rem',
                      }}
                    >
                      {specItem.name[0]}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>{acc.accountName}</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', margin: '2px 0 0 0' }}>
                        {acc.accountHandle}
                      </p>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 10,
                            background: isConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: isConnected ? '#059669' : '#dc2626',
                          }}
                        >
                          {isConnected
                            ? isAr ? 'متصل بنجاح' : 'Connected'
                            : isAr ? 'غير متصل أو خطأ' : 'Disconnected / Error'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                          {acc.followersCount !== null
                            ? `${acc.followersCount.toLocaleString()} ${isAr ? 'متابع' : 'followers'}`
                            : (isAr ? 'المتابعون: غير متاح' : 'Followers: N/A')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {canManageAccounts && (
                      <>
                        <button
                          onClick={() => handleTestConnection(acc.id)}
                          disabled={isPending}
                          className={styles.btnSecondary}
                          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>{isAr ? 'فحص الاتصال' : 'Test Ping'}</span>
                        </button>
                        <button
                          onClick={() => {
                            setConfigModalAccount(acc);
                            const cfg = (acc.authConfig as { botToken?: string; channelId?: string }) || {};
                            setCfgBotToken(cfg.botToken || '');
                            setCfgChannelId(cfg.channelId || '');
                          }}
                          className={styles.btnSecondary}
                          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                        >
                          <Settings className="h-3.5 w-3.5" />
                          <span>{isAr ? 'تعديل الإعدادات' : 'Configure'}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: PUBLISH HISTORY & AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className={styles.cardSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Clock className="h-5 w-5 text-emerald-500" />
              <span>{isAr ? 'سجل عمليات النشر والتدقيق (Publish Audit Trail)' : 'Publish Audit Trail'}</span>
            </h2>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{isAr ? 'المنصة والمنشور' : 'Platform & Post'}</th>
                  <th>{isAr ? 'النتيجة' : 'Result'}</th>
                  <th>{isAr ? 'رمز الحالة' : 'Status Code'}</th>
                  <th>{isAr ? 'رقم المحاولة' : 'Attempt #'}</th>
                  <th>{isAr ? 'وقت التنفيذ' : 'Executed At'}</th>
                  <th>{isAr ? 'رسالة الخطأ / الرد' : 'Details / Error'}</th>
                </tr>
              </thead>
              <tbody>
                {metrics.recentLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--muted-foreground)' }}>
                      {isAr ? 'لا توجد سجلات نشر سابقة حتى الآن.' : 'No publish logs recorded yet.'}
                    </td>
                  </tr>
                ) : (
                  metrics.recentLogs.map((log) => {
                    const isSuccess = log.status === 'SUCCESS';
                    return (
                      <tr key={log.id}>
                        <td>
                          <div style={{ fontWeight: 700 }}>
                            {log.post?.platform || 'TELEGRAM'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {log.post?.content || log.postId}
                          </div>
                        </td>
                        <td>
                          <span
                            className={styles.statusBadge}
                            style={{
                              background: isSuccess ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: isSuccess ? '#059669' : '#dc2626',
                            }}
                          >
                            {isSuccess ? (isAr ? 'نجاح النشر' : 'SUCCESS') : (isAr ? 'تعثر' : 'FAILED')}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700 }}>{log.statusCode || '-'}</td>
                        <td>#{log.attempt}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
                          {new Date(log.executedAt).toLocaleString(isAr ? 'ar-EG' : 'en-US')}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: isSuccess ? '#059669' : '#ef4444', maxWidth: 300 }}>
                          {isSuccess
                            ? isAr ? 'تم النشر بنجاح وتسجيل المعرّف الرسمي لمنع التكرار' : 'Dispatched cleanly'
                            : log.errorMessage || (isAr ? 'خطأ في الاستجابة' : 'Response error')}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: LIVE PREVIEW */}
      {previewPost && (
        <div className={styles.modalBackdrop} onClick={() => setPreviewPost(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {isAr ? 'معاينة المنشور قبل النشر' : 'Post Live Preview'}
              </h3>
              <button onClick={() => setPreviewPost(null)} className={styles.closeBtn}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className={styles.previewBox}>
              <div className={styles.previewHead}>
                <div
                  className={styles.previewAvatar}
                  style={{ background: PLATFORM_SPECS[previewPost.platform].brandColor }}
                >
                  YS
                </div>
                <div>
                  <div style={{ fontWeight: 800 }}>يلا سبورت | Yalla Sport</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                    {previewPost.account?.accountHandle || '@yallasport'}
                  </div>
                </div>
              </div>

              <div
                className={styles.previewText}
                dangerouslySetInnerHTML={{ __html: previewPost.content.replace(/\n/g, '<br/>') }}
              />

              <div className={styles.previewFooter}>
                <span>{PLATFORM_SPECS[previewPost.platform].name}</span>
                <span>{previewPost.status}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setPreviewPost(null)} className={styles.btnSecondary}>
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REVIEW & APPROVAL */}
      {reviewModalPost && (
        <div className={styles.modalBackdrop} onClick={() => setReviewModalPost(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {isAr ? 'مراجعة وتدقيق المنشور' : 'Review & Approve Post'}
              </h3>
              <button onClick={() => setReviewModalPost(null)} className={styles.closeBtn}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div style={{ background: 'var(--muted)', padding: 14, borderRadius: 12, fontSize: '0.875rem' }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{isAr ? 'محتوى المنشور للمراجعة:' : 'Content to review:'}</div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{reviewModalPost.content}</div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>{isAr ? 'ملاحظات المراجع (اختياري في حال الاعتماد، مطلوب في حال الرفض):' : 'Review Notes:'}</label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder={isAr ? 'أدخل ملاحظات التدقيق أو أسباب الرفض...' : 'Enter review comments or reason for rejection...'}
                className={styles.textarea}
                style={{ minHeight: 90 }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                onClick={() => handleReviewDecision('REJECT')}
                disabled={isPending}
                className={styles.btnSecondary}
                style={{ color: '#ef4444', borderColor: '#ef4444' }}
              >
                <X className="h-4 w-4" />
                <span>{isAr ? 'رفض وإعادة كمسودة' : 'Reject to Draft'}</span>
              </button>

              <button
                onClick={() => handleReviewDecision('APPROVE')}
                disabled={isPending}
                className={styles.btnPrimary}
              >
                <Check className="h-4 w-4" />
                <span>{isAr ? 'اعتماد المنشور' : 'Approve Post'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SCHEDULE */}
      {scheduleModalPost && (
        <div className={styles.modalBackdrop} onClick={() => setScheduleModalPost(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {isAr ? 'جدولة المنشور للنشر التلقائي' : 'Schedule Post'}
              </h3>
              <button onClick={() => setScheduleModalPost(null)} className={styles.closeBtn}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>{isAr ? 'اختر تاريخ ووقت النشر المستهدف:' : 'Target Date & Time:'}</label>
              <input
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className={styles.input}
                required
              />
              <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginTop: 4 }}>
                {isAr
                  ? 'يعمل محرك الجدولة في الخلفية تلقائياً وينفذ النشر في الموعد المحدد حتى عند إغلاق المتصفح.'
                  : 'The background scheduler will execute automatically even with the browser closed.'}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setScheduleModalPost(null)} className={styles.btnSecondary}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleSchedulePost}
                disabled={isPending || !scheduleDate}
                className={styles.btnPrimary}
              >
                <Calendar className="h-4 w-4" />
                <span>{isAr ? 'تأكيد الجدولة' : 'Confirm Schedule'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ACCOUNT CONFIG */}
      {configModalAccount && (
        <div className={styles.modalBackdrop} onClick={() => setConfigModalAccount(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {isAr ? `إعدادات حساب ${configModalAccount.accountName}` : `Configure ${configModalAccount.accountName}`}
              </h3>
              <button onClick={() => setConfigModalAccount(null)} className={styles.closeBtn}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                {configModalAccount.platform === 'TELEGRAM' ? 'Telegram Bot Token' : 'API Key / Token'}
              </label>
              <input
                type="password"
                value={cfgBotToken}
                onChange={(e) => setCfgBotToken(e.target.value)}
                placeholder="bot123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                {configModalAccount.platform === 'TELEGRAM' ? 'Channel Username or Chat ID' : 'Account Handle / Channel ID'}
              </label>
              <input
                type="text"
                value={cfgChannelId}
                onChange={(e) => setCfgChannelId(e.target.value)}
                placeholder="@yallasport or -100123456789"
                className={styles.input}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setConfigModalAccount(null)} className={styles.btnSecondary}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  startTransition(async () => {
                    try {
                      await saveAccountConfigAction(configModalAccount.id, {
                        authConfig: {
                          botToken: cfgBotToken,
                          channelId: cfgChannelId,
                        },
                      });
                      setConfigModalAccount(null);
                      showBanner(isAr ? 'تم حفظ إعدادات الحساب بنجاح!' : 'Account config saved successfully!');
                    } catch (err) {
                      showBanner(err instanceof Error ? err.message : 'Save failed', 'error');
                    }
                  });
                }}
                disabled={isPending}
                className={styles.btnPrimary}
              >
                {isAr ? 'حفظ الإعدادات' : 'Save Config'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
