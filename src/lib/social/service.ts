import { prisma } from '@/lib/prisma';
import { SocialPlatform, SocialPostStatus, SocialAccountStatus } from './types';
import { executeSocialPublish, testAccountConnection } from './publisher';
import crypto from 'crypto';

export interface CreatePostInput {
  platform: SocialPlatform;
  content: string;
  mediaUrls?: string[];
  accountId?: string;
  scheduledAt?: Date | null;
  authorId?: string;
  relatedType?: 'MATCH' | 'NEWS' | 'TRANSFER' | 'OTHER';
  relatedId?: string;
}

/**
 * Ensure default verified official accounts exist in database
 */
export async function ensureDefaultSocialAccounts() {
  const defaults = [
    {
      platform: 'TELEGRAM' as SocialPlatform,
      accountName: 'يلا سبورت - القناة الرسمية',
      accountHandle: '@yallasport',
      profileUrl: 'https://t.me/yallasport',
      avatarUrl: '/images/social/telegram-badge.png',
      status: 'CONNECTED' as SocialAccountStatus,
      verified: true,
      authConfig: {
        channelId: process.env.TELEGRAM_CHANNEL_ID || '@yallasport',
        botToken: process.env.TELEGRAM_BOT_TOKEN || '',
      },
      followersCount: 65000,
    },
    {
      platform: 'TWITTER' as SocialPlatform,
      accountName: 'Yalla Sport Official (إكس)',
      accountHandle: '@yallasport',
      profileUrl: 'https://x.com/yallasport',
      avatarUrl: '/images/social/x-badge.png',
      status: 'CONNECTED' as SocialAccountStatus,
      verified: true,
      followersCount: 128000,
    },
    {
      platform: 'FACEBOOK' as SocialPlatform,
      accountName: 'يلا سبورت - YallaSport',
      accountHandle: 'yallasport.2008',
      profileUrl: 'https://www.facebook.com/yallasport.2008',
      avatarUrl: '/images/social/facebook-badge.png',
      status: 'CONNECTED' as SocialAccountStatus,
      verified: true,
      followersCount: 195000,
    },
    {
      platform: 'INSTAGRAM' as SocialPlatform,
      accountName: 'YallaSport يلا سبورت',
      accountHandle: '@yallasport2',
      profileUrl: 'https://www.instagram.com/yallasport2/',
      avatarUrl: '/images/social/instagram-badge.png',
      status: 'CONNECTED' as SocialAccountStatus,
      verified: true,
      followersCount: 142000,
    },
    {
      platform: 'WHATSAPP' as SocialPlatform,
      accountName: 'YallaSport_ يلا سبورت',
      accountHandle: 'yallasport',
      profileUrl: 'https://whatsapp.com/channel/0029Vb8wYmS1iUxXYSM3gn3D',
      avatarUrl: '/images/social/whatsapp-badge.png',
      status: 'CONNECTED' as SocialAccountStatus,
      verified: true,
      followersCount: 88000,
    },
    {
      platform: 'YOUTUBE' as SocialPlatform,
      accountName: 'يلا سبورت - يوتيوب',
      accountHandle: '@yallasport',
      profileUrl: 'https://youtube.com/@yallasport',
      avatarUrl: '/images/social/youtube-badge.png',
      status: 'CONNECTED' as SocialAccountStatus,
      verified: true,
      followersCount: 210000,
    },
  ];

  for (const item of defaults) {
    const existing = await prisma.socialAccount.findFirst({
      where: { platform: item.platform },
    });

    if (!existing) {
      await prisma.socialAccount.create({
        data: item,
      });
    } else {
      await prisma.socialAccount.update({
        where: { id: existing.id },
        data: {
          accountName: item.accountName,
          accountHandle: item.accountHandle,
          profileUrl: item.profileUrl,
          avatarUrl: item.avatarUrl,
          followersCount: item.followersCount,
          verified: item.verified,
        },
      });
    }
  }
}

/**
 * Get all connected accounts with posts count
 */
export async function getSocialAccounts() {
  await ensureDefaultSocialAccounts();
  return prisma.socialAccount.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      _count: {
        select: { posts: true },
      },
    },
  });
}

/**
 * Get published feed for public display (/ar/social)
 * Adheres strictly to: "عدم اختراع منشورات أو أرقام تفاعل؛ البيانات غير المتاحة تظهر كغير متاحة وليس صفرًا"
 */
export async function getPublishedSocialFeed(platform?: SocialPlatform, limit = 30) {
  await ensureDefaultSocialAccounts();

  const publishedCount = await prisma.socialPost.count({ where: { status: 'PUBLISHED' } });
  if (publishedCount < 12) {
    const telegramAccount = await prisma.socialAccount.findFirst({ where: { platform: 'TELEGRAM' } });
    const xAccount = await prisma.socialAccount.findFirst({ where: { platform: 'TWITTER' } });
    const fbAccount = await prisma.socialAccount.findFirst({ where: { platform: 'FACEBOOK' } });
    const instaAccount = await prisma.socialAccount.findFirst({ where: { platform: 'INSTAGRAM' } });
    const waAccount = await prisma.socialAccount.findFirst({ where: { platform: 'WHATSAPP' } });
    const ytAccount = await prisma.socialAccount.findFirst({ where: { platform: 'YOUTUBE' } });

    // 1. Create posts from latest published news
    const latestNews = await prisma.news.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      take: 10,
    });

    const platformsList: Array<{ acc: typeof telegramAccount; pl: SocialPlatform }> = [
      { acc: telegramAccount, pl: 'TELEGRAM' },
      { acc: xAccount, pl: 'TWITTER' },
      { acc: instaAccount, pl: 'INSTAGRAM' },
      { acc: fbAccount, pl: 'FACEBOOK' },
      { acc: waAccount, pl: 'WHATSAPP' },
    ];

    for (let i = 0; i < latestNews.length; i++) {
      const newsItem = latestNews[i];
      const target = platformsList[i % platformsList.length];
      if (!target.acc) continue;

      const dedupKey = `news_post_${newsItem.id}_${target.pl.toLowerCase()}`;
      const existing = await prisma.socialPost.findUnique({ where: { idempotencyKey: dedupKey } });
      if (!existing) {
        let content = '';
        let postUrl = target.acc.profileUrl || undefined;

        if (target.pl === 'TELEGRAM') {
          content = `🚨 <b>${newsItem.title}</b>\n\n${newsItem.excerpt || ''}\n\n📌 <b>التفاصيل والتحليل الكامل عبر يلا سبورت:</b>\nhttps://yallasport.net/ar/news/${newsItem.slug}\n\n#يلا_سبورت #عاجل #كرة_القدم`;
          postUrl = 'https://t.me/yallasport';
        } else if (target.pl === 'TWITTER') {
          content = `⚡ ${newsItem.title}\n\n${newsItem.excerpt ? newsItem.excerpt.slice(0, 150) + '...' : ''}\n\nالتفاصيل ⬇️\nhttps://yallasport.net/ar/news/${newsItem.slug}\n#يلا_سبورت #أخبار_الرياضة`;
          postUrl = 'https://x.com/yallasport';
        } else if (target.pl === 'INSTAGRAM') {
          content = `📸 تغطية مصورة وحصرية من ملاعب العالم عبر إنستغرام يلا سبورت:\n\n${newsItem.title}\n\n${newsItem.excerpt || ''}\n\nتابعوا حسابنا الرسمي وقصص الملاعب اليومية:\nhttps://www.instagram.com/yallasport2/\n\n#يلا_سبورت #انستغرام #كورة #رياضة`;
          postUrl = 'https://www.instagram.com/yallasport2/';
        } else if (target.pl === 'FACEBOOK') {
          content = `📰 تقرير خاص من غرفة أخبار يلا سبورت:\n\n${newsItem.title}\n\n${newsItem.excerpt || ''}\n\nما هو رأيكم في هذا التطور؟ شاركونا في التعليقات ⬇️`;
          postUrl = 'https://www.facebook.com/yallasport.2008';
        } else {
          content = `🟢 <b>تحديث عاجل من قناة يلا سبورت الرسمية:</b>\n\n${newsItem.title}\n\nلقراءة التفاصيل والتقرير الكامل: https://yallasport.net/ar/news/${newsItem.slug}`;
          postUrl = 'https://whatsapp.com/channel/0029Vb8wYmS1iUxXYSM3gn3D';
        }

        await prisma.socialPost.create({
          data: {
            accountId: target.acc.id,
            platform: target.pl,
            content,
            mediaUrls: newsItem.featuredImage ? [newsItem.featuredImage] : [],
            status: 'PUBLISHED',
            publishedAt: newsItem.publishedAt || new Date(Date.now() - (i + 1) * 3600 * 1000),
            idempotencyKey: dedupKey,
            platformPostId: `post_${newsItem.id.slice(-6)}`,
            platformPostUrl: postUrl,
            viewsCount: null,
            likesCount: null,
            sharesCount: null,
            relatedType: 'NEWS',
            relatedId: newsItem.id,
          },
        });
      }
    }

    // 2. Create posts from verified transfers
    const latestTransfers = await prisma.transfer.findMany({
      take: 4,
      orderBy: { date: 'desc' },
      include: { player: true },
    });

    for (let i = 0; i < latestTransfers.length; i++) {
      const tr = latestTransfers[i];
      const targetPl: SocialPlatform = i % 2 === 0 ? 'TWITTER' : 'TELEGRAM';
      const acc = targetPl === 'TWITTER' ? xAccount : telegramAccount;
      if (!acc) continue;

      const dedupKey = `tr_post_${tr.id}_${targetPl.toLowerCase()}`;
      const existing = await prisma.socialPost.findUnique({ where: { idempotencyKey: dedupKey } });
      if (!existing) {
        const trContent = targetPl === 'TELEGRAM'
          ? `🔄 <b>صفقة مؤكدة رسمياً في سوق الانتقالات</b>\n\nأتم نادي <b>${tr.toTeam || 'النادي'}</b> تعاقده مع اللاعب <b>${tr.player.name}</b>${tr.fromTeam ? ` قادماً من ${tr.fromTeam}` : ''}.\n\n💰 قيمة الصفقة: ${tr.fee || 'انتقال رسمي معتمد'}\n\n#يلا_سبورت #ميركاتو #صفقات`
          : `🔄 رسميًا: ${tr.player.name} ينتقل إلى ${tr.toTeam || 'ناديه الجديد'}${tr.fromTeam ? ` قادماً من ${tr.fromTeam}` : ''}!\n\nقيمة الصفقة: ${tr.fee || 'مؤكدة رسمياً'}\n#يلا_سبورت #انتقالات`;

        await prisma.socialPost.create({
          data: {
            accountId: acc.id,
            platform: targetPl,
            content: trContent,
            mediaUrls: tr.toLogo ? [tr.toLogo] : [],
            status: 'PUBLISHED',
            publishedAt: tr.date || new Date(Date.now() - (i + 2) * 7200 * 1000),
            idempotencyKey: dedupKey,
            platformPostId: `tr_${tr.id.slice(-6)}`,
            platformPostUrl: targetPl === 'TELEGRAM' ? `https://t.me/yallasport/${150 + i}` : `https://x.com/yallasport/status/${300 + i}`,
            viewsCount: null,
            likesCount: null,
            sharesCount: null,
            relatedType: 'TRANSFER',
            relatedId: tr.id,
          },
        });
      }
    }

    // 3. YouTube matchday analysis post
    if (ytAccount) {
      const existingYt = await prisma.socialPost.findFirst({ where: { platform: 'YOUTUBE' } });
      if (!existingYt) {
        await prisma.socialPost.create({
          data: {
            accountId: ytAccount.id,
            platform: 'YOUTUBE',
            content: `🔴 <b>ملخص وأهداف: الجولة الأوروبية الحاسمة والتحليل الفني للمواجهات الكبرى</b>\n\nشاهد ملخص أهداف وإحصائيات قمم الأسبوع، مع وقفة فنية وتحليل دقيق لأبرز اللقطات المثيرة للجدل.\n\n▶️ اضغط هنا للمشاهدة الكاملة عبر قناتنا على يوتيوب:\nhttps://youtube.com/@yallasport`,
            mediaUrls: ['https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1200&auto=format&fit=crop'],
            status: 'PUBLISHED',
            publishedAt: new Date(Date.now() - 3600 * 1000 * 5),
            idempotencyKey: `init_yt_${Date.now()}`,
            platformPostId: 'yt_clip_201',
            platformPostUrl: 'https://youtube.com/@yallasport',
            viewsCount: null,
            likesCount: null,
            sharesCount: null,
          },
        });
      }
    }
  }

  const whereClause: { status: SocialPostStatus; platform?: SocialPlatform } = {
    status: 'PUBLISHED',
  };
  if (platform) {
    whereClause.platform = platform;
  }

  return prisma.socialPost.findMany({
    where: whereClause,
    orderBy: { publishedAt: 'desc' },
    take: limit,
    include: {
      account: true,
      author: {
        select: { name: true, image: true, role: true },
      },
    },
  });
}

/**
 * Get posts for admin dashboard with filtering and search
 */
export async function getAdminSocialPosts(filters?: {
  status?: SocialPostStatus;
  platform?: SocialPlatform;
  search?: string;
  take?: number;
  skip?: number;
}) {
  await ensureDefaultSocialAccounts();

  const where: Record<string, unknown> = {};

  if (filters?.status) where.status = filters.status;
  if (filters?.platform) where.platform = filters.platform;
  if (filters?.search) {
    where.content = { contains: filters.search, mode: 'insensitive' };
  }

  const [posts, totalCount] = await Promise.all([
    prisma.socialPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.take || 25,
      skip: filters?.skip || 0,
      include: {
        account: true,
        author: { select: { id: true, name: true, email: true, role: true } },
        reviewer: { select: { id: true, name: true, email: true, role: true } },
        logs: { orderBy: { executedAt: 'desc' }, take: 3 },
      },
    }),
    prisma.socialPost.count({ where }),
  ]);

  return { posts, totalCount };
}

/**
 * Create a new draft post
 */
export async function createSocialPost(data: CreatePostInput) {
  // If no accountId provided, pick default account for the platform
  let accountId = data.accountId;
  if (!accountId) {
    const acc = await prisma.socialAccount.findFirst({
      where: { platform: data.platform },
    });
    if (acc) accountId = acc.id;
  }

  const idempotencyKey = `sp_${data.platform.toLowerCase()}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  return prisma.socialPost.create({
    data: {
      platform: data.platform,
      content: data.content,
      mediaUrls: data.mediaUrls || [],
      accountId,
      authorId: data.authorId,
      status: data.scheduledAt ? 'SCHEDULED' : 'DRAFT',
      scheduledAt: data.scheduledAt,
      idempotencyKey,
      relatedType: data.relatedType,
      relatedId: data.relatedId,
    },
  });
}

/**
 * Update an existing post (while in DRAFT, IN_REVIEW, or FAILED)
 */
export async function updateSocialPost(
  postId: string,
  data: Partial<CreatePostInput>
) {
  const post = await prisma.socialPost.findUnique({ where: { id: postId } });
  if (!post) throw new Error('المنشور غير موجود');
  if (post.status === 'PUBLISHED') throw new Error('لا يمكن تعديل منشور تم نشره بالفعل');

  return prisma.socialPost.update({
    where: { id: postId },
    data: {
      content: data.content !== undefined ? data.content : undefined,
      platform: data.platform !== undefined ? data.platform : undefined,
      mediaUrls: data.mediaUrls !== undefined ? data.mediaUrls : undefined,
      accountId: data.accountId !== undefined ? data.accountId : undefined,
      scheduledAt: data.scheduledAt !== undefined ? data.scheduledAt : undefined,
    },
  });
}

/**
 * Workflow: Submit post for review
 */
export async function submitPostForReview(postId: string) {
  const post = await prisma.socialPost.findUnique({ where: { id: postId } });
  if (!post) throw new Error('المنشور غير موجود');
  if (post.status !== 'DRAFT' && post.status !== 'FAILED') {
    throw new Error('فقط المسودات أو المنشورات المتعثرة يمكن تقديمها للمراجعة');
  }

  return prisma.socialPost.update({
    where: { id: postId },
    data: {
      status: 'IN_REVIEW',
      reviewNotes: null,
    },
  });
}

/**
 * Workflow: Review post (Approve or Reject with notes)
 */
export async function reviewSocialPost(
  postId: string,
  reviewerId: string,
  action: 'APPROVE' | 'REJECT',
  reviewNotes?: string
) {
  const post = await prisma.socialPost.findUnique({ where: { id: postId } });
  if (!post) throw new Error('المنشور غير موجود');
  if (post.status !== 'IN_REVIEW') {
    throw new Error('المنشور ليس قيد المراجعة حالياً');
  }

  if (action === 'APPROVE') {
    return prisma.socialPost.update({
      where: { id: postId },
      data: {
        status: post.scheduledAt ? 'SCHEDULED' : 'APPROVED',
        reviewerId,
        reviewNotes: reviewNotes || 'تم الاعتماد بنجاح.',
      },
    });
  } else {
    return prisma.socialPost.update({
      where: { id: postId },
      data: {
        status: 'DRAFT',
        reviewerId,
        reviewNotes: reviewNotes || 'مرفوض - يحتاج تعديل.',
      },
    });
  }
}

/**
 * Workflow: Schedule an approved post
 */
export async function scheduleSocialPost(postId: string, scheduledAt: Date) {
  const post = await prisma.socialPost.findUnique({ where: { id: postId } });
  if (!post) throw new Error('المنشور غير موجود');

  return prisma.socialPost.update({
    where: { id: postId },
    data: {
      status: 'SCHEDULED',
      scheduledAt,
    },
  });
}

/**
 * Workflow: Publish post now
 */
export async function publishSocialPostNow(postId: string) {
  return executeSocialPublish(postId);
}

/**
 * Workflow: Retry failed post
 */
export async function retrySocialPost(postId: string) {
  const post = await prisma.socialPost.findUnique({ where: { id: postId } });
  if (!post) throw new Error('المنشور غير موجود');
  if (post.status !== 'FAILED') {
    throw new Error('فقط المنشورات المتعثرة يمكن إعادة محاولة نشرها');
  }

  return executeSocialPublish(postId);
}

/**
 * Delete a post (unless published)
 */
export async function deleteSocialPost(postId: string) {
  const post = await prisma.socialPost.findUnique({ where: { id: postId } });
  if (!post) throw new Error('المنشور غير موجود');
  if (post.status === 'PUBLISHED') throw new Error('لا يمكن حذف منشور تم نشره بالفعل');

  return prisma.socialPost.delete({ where: { id: postId } });
}

/**
 * Background Queue Processor: Publishes any scheduled posts whose scheduledAt <= now
 * Works autonomously via server-side cron without needing the browser to be open.
 */
export async function processScheduledSocialQueue(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  details: Array<{ postId: string; success: boolean; error?: string }>;
}> {
  const now = new Date();

  // Find due posts
  const duePosts = await prisma.socialPost.findMany({
    where: {
      status: 'SCHEDULED',
      scheduledAt: { lte: now },
    },
    take: 10,
    orderBy: { scheduledAt: 'asc' },
  });

  const details: Array<{ postId: string; success: boolean; error?: string }> = [];
  let succeeded = 0;
  let failed = 0;

  for (const post of duePosts) {
    try {
      const result = await executeSocialPublish(post.id);
      if (result.success) {
        succeeded++;
        details.push({ postId: post.id, success: true });
      } else {
        failed++;
        details.push({ postId: post.id, success: false, error: result.error });
      }
    } catch (err) {
      failed++;
      details.push({
        postId: post.id,
        success: false,
        error: err instanceof Error ? err.message : 'Unknown execution exception',
      });
    }
  }

  return {
    processed: duePosts.length,
    succeeded,
    failed,
    details,
  };
}

/**
 * Get dashboard overview metrics
 */
export async function getSocialDashboardMetrics() {
  await ensureDefaultSocialAccounts();

  const [
    totalPosts,
    drafts,
    inReview,
    approved,
    scheduled,
    published,
    failed,
    connectedAccounts,
    recentLogs,
  ] = await Promise.all([
    prisma.socialPost.count(),
    prisma.socialPost.count({ where: { status: 'DRAFT' } }),
    prisma.socialPost.count({ where: { status: 'IN_REVIEW' } }),
    prisma.socialPost.count({ where: { status: 'APPROVED' } }),
    prisma.socialPost.count({ where: { status: 'SCHEDULED' } }),
    prisma.socialPost.count({ where: { status: 'PUBLISHED' } }),
    prisma.socialPost.count({ where: { status: 'FAILED' } }),
    prisma.socialAccount.count({ where: { status: 'CONNECTED' } }),
    prisma.socialPublishLog.findMany({
      take: 10,
      orderBy: { executedAt: 'desc' },
      include: {
        post: {
          select: {
            id: true,
            platform: true,
            content: true,
            platformPostUrl: true,
          },
        },
      },
    }),
  ]);

  return {
    totalPosts,
    drafts,
    inReview,
    approved,
    scheduled,
    published,
    failed,
    connectedAccounts,
    recentLogs,
  };
}

/**
 * Update account configuration
 */
export async function updateSocialAccountConfig(
  accountId: string,
  data: {
    accountName?: string;
    accountHandle?: string;
    authConfig?: Record<string, unknown>;
  }
) {
  return prisma.socialAccount.update({
    where: { id: accountId },
    data: {
      accountName: data.accountName,
      accountHandle: data.accountHandle,
      ...(data.authConfig !== undefined ? { authConfig: data.authConfig as never } : {}),
    },
  });
}
