import { prisma } from '@/lib/prisma';
import { SocialPlatform, SocialPostStatus, SocialAccountConfig } from './types';

export interface PublishResult {
  success: boolean;
  platformPostId?: string;
  platformPostUrl?: string;
  statusCode?: number;
  response?: unknown;
  error?: string;
  alreadyPublished?: boolean;
}

/**
 * Dispatch post to Telegram channel via official Bot API
 */
async function publishToTelegram(
  content: string,
  mediaUrls: string[],
  config: SocialAccountConfig
): Promise<PublishResult> {
  const botToken = config.botToken || process.env.TELEGRAM_BOT_TOKEN;
  const channelId = config.channelId || config.chatId || process.env.TELEGRAM_CHANNEL_ID;

  if (!botToken || !channelId) {
    return {
      success: false,
      statusCode: 400,
      error: 'لم يتم العثور على رمز البوت أو معرف القناة (TELEGRAM_BOT_TOKEN / TELEGRAM_CHANNEL_ID). يرجى ضبط الإعدادات في الحسابات المربوطة.',
    };
  }

  try {
    const hasPhoto = mediaUrls.length > 0 && mediaUrls[0].match(/\.(jpg|jpeg|png|webp)($|\?)/i);
    const endpoint = hasPhoto
      ? `https://api.telegram.org/bot${botToken}/sendPhoto`
      : `https://api.telegram.org/bot${botToken}/sendMessage`;

    const body: Record<string, unknown> = hasPhoto
      ? {
          chat_id: channelId,
          photo: mediaUrls[0],
          caption: content,
          parse_mode: 'HTML',
        }
      : {
          chat_id: channelId,
          text: content,
          parse_mode: 'HTML',
          disable_web_page_preview: false,
        };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const json = await res.json();

    if (!res.ok || !json.ok) {
      return {
        success: false,
        statusCode: res.status,
        response: json,
        error: json.description || `Telegram API error (${res.status})`,
      };
    }

    const messageId = json.result?.message_id;
    // Format official post URL if public channel
    const cleanChannel = channelId.startsWith('@') ? channelId.slice(1) : null;
    const postUrl = cleanChannel && messageId ? `https://t.me/${cleanChannel}/${messageId}` : undefined;

    return {
      success: true,
      statusCode: res.status,
      platformPostId: String(messageId || ''),
      platformPostUrl: postUrl,
      response: json,
    };
  } catch (err) {
    return {
      success: false,
      statusCode: 500,
      error: err instanceof Error ? err.message : 'Unknown Telegram connection error',
    };
  }
}

/**
 * Dispatch post to X / Twitter official API (v2)
 */
async function publishToTwitter(
  content: string,
  _mediaUrls: string[],
  config: SocialAccountConfig
): Promise<PublishResult> {
  const apiKey = config.apiKey || process.env.TWITTER_API_KEY;
  const accessToken = config.accessToken || process.env.TWITTER_ACCESS_TOKEN;

  if (!apiKey || !accessToken) {
    return {
      success: false,
      statusCode: 400,
      error: 'حساب إكس (تويتر) غير مقترن ببيانات الاعتماد الرسمية (API Key / Access Token).',
    };
  }

  // Official Twitter v2 API dispatch
  try {
    const res = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ text: content.slice(0, 280) }),
    });

    const json = await res.json();
    if (!res.ok) {
      return {
        success: false,
        statusCode: res.status,
        response: json,
        error: json.detail || json.title || 'Twitter API error',
      };
    }

    const tweetId = json.data?.id;
    return {
      success: true,
      statusCode: res.status,
      platformPostId: tweetId,
      platformPostUrl: tweetId ? `https://x.com/yallasport/status/${tweetId}` : undefined,
      response: json,
    };
  } catch (err) {
    return {
      success: false,
      statusCode: 500,
      error: err instanceof Error ? err.message : 'Twitter connection error',
    };
  }
}

/**
 * Dispatch post to Facebook Graph API
 */
async function publishToFacebook(
  content: string,
  mediaUrls: string[],
  config: SocialAccountConfig
): Promise<PublishResult> {
  const pageId = config.channelId || process.env.FACEBOOK_PAGE_ID;
  const accessToken = config.accessToken || process.env.FACEBOOK_ACCESS_TOKEN;

  if (!pageId || !accessToken) {
    return {
      success: false,
      statusCode: 400,
      error: 'حساب فيسبوك غير مقترن بالصفحة الرسمية أو رمز الوصول (Page ID / Access Token).',
    };
  }

  try {
    const hasPhoto = mediaUrls.length > 0;
    const url = hasPhoto
      ? `https://graph.facebook.com/v19.0/${pageId}/photos`
      : `https://graph.facebook.com/v19.0/${pageId}/feed`;

    const body: Record<string, string> = hasPhoto
      ? { url: mediaUrls[0], caption: content, access_token: accessToken }
      : { message: content, access_token: accessToken };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    if (!res.ok || json.error) {
      return {
        success: false,
        statusCode: res.status,
        response: json,
        error: json.error?.message || 'Facebook Graph API error',
      };
    }

    const postId = json.id || json.post_id;
    return {
      success: true,
      statusCode: res.status,
      platformPostId: postId,
      platformPostUrl: postId ? `https://facebook.com/${postId}` : undefined,
      response: json,
    };
  } catch (err) {
    return {
      success: false,
      statusCode: 500,
      error: err instanceof Error ? err.message : 'Facebook connection error',
    };
  }
}

/**
 * Main Publishing Engine with strict idempotency and audit logs
 */
export async function executeSocialPublish(postId: string): Promise<PublishResult> {
  const post = await prisma.socialPost.findUnique({
    where: { id: postId },
    include: { account: true, logs: { orderBy: { executedAt: 'desc' }, take: 1 } },
  });

  if (!post) {
    return { success: false, error: 'المنشور غير موجود.' };
  }

  // Idempotency: Prevent duplicate dispatches if already published
  if (post.status === 'PUBLISHED' && post.platformPostId) {
    return {
      success: true,
      alreadyPublished: true,
      platformPostId: post.platformPostId,
      platformPostUrl: post.platformPostUrl || undefined,
      error: 'المنشور تم نشره مسبقاً على المنصة الرسمية.',
    };
  }

  // Must be APPROVED or SCHEDULED (or FAILED for manual retry)
  const allowedStatuses: SocialPostStatus[] = ['APPROVED', 'SCHEDULED', 'FAILED'];
  if (!allowedStatuses.includes(post.status)) {
    return {
      success: false,
      error: `لا يمكن نشر المنشور في حالته الحالية (${post.status}). يجب أن يكون معتمداً (APPROVED).`,
    };
  }

  const mediaUrls: string[] = Array.isArray(post.mediaUrls) ? (post.mediaUrls as string[]) : [];
  const config: SocialAccountConfig = (post.account?.authConfig as SocialAccountConfig) || {};

  let result: PublishResult;

  switch (post.platform) {
    case 'TELEGRAM':
      result = await publishToTelegram(post.content, mediaUrls, config);
      break;
    case 'TWITTER':
      result = await publishToTwitter(post.content, mediaUrls, config);
      break;
    case 'FACEBOOK':
      result = await publishToFacebook(post.content, mediaUrls, config);
      break;
    default:
      result = {
        success: false,
        statusCode: 400,
        error: `المنصة ${post.platform} غير مدعومة حالياً للنشر التلقائي عبر API.`,
      };
      break;
  }

  // Attempt counter
  const previousAttempt = post.logs[0]?.attempt || 0;
  const currentAttempt = previousAttempt + 1;

  // Record audit log entry in database
  await prisma.socialPublishLog.create({
    data: {
      postId: post.id,
      status: result.success ? 'SUCCESS' : 'FAILED',
      attempt: currentAttempt,
      statusCode: result.statusCode,
      responseJson: result.response ? JSON.parse(JSON.stringify(result.response)) : undefined,
      errorMessage: result.error,
    },
  });

  // Update post status based on result
  if (result.success) {
    await prisma.socialPost.update({
      where: { id: post.id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        platformPostId: result.platformPostId,
        platformPostUrl: result.platformPostUrl,
      },
    });

    if (post.accountId) {
      await prisma.socialAccount.update({
        where: { id: post.accountId },
        data: {
          lastSyncAt: new Date(),
          status: 'CONNECTED',
          errorMessage: null,
        },
      });
    }
  } else {
    await prisma.socialPost.update({
      where: { id: post.id },
      data: {
        status: 'FAILED',
      },
    });

    if (post.accountId) {
      await prisma.socialAccount.update({
        where: { id: post.accountId },
        data: {
          status: 'ERROR',
          errorMessage: result.error?.slice(0, 500) || 'خطأ في عملية النشر',
        },
      });
    }
  }

  return result;
}

/**
 * Test account connection via official API ping
 */
export async function testAccountConnection(accountId: string): Promise<{ success: boolean; message: string; data?: unknown }> {
  const account = await prisma.socialAccount.findUnique({
    where: { id: accountId },
  });

  if (!account) {
    return { success: false, message: 'الحساب غير موجود' };
  }

  const config = (account.authConfig as SocialAccountConfig) || {};

  if (account.platform === 'TELEGRAM') {
    const botToken = config.botToken || process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return { success: false, message: 'لم يتم تكوين رمز البوت (Bot Token).' };
    }

    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
      const json = await res.json();
      if (res.ok && json.ok) {
        // Fetch chat member count if channel is provided
        const channelId = config.channelId || config.chatId || process.env.TELEGRAM_CHANNEL_ID;
        let membersCount: number | null = null;
        if (channelId) {
          try {
            const countRes = await fetch(`https://api.telegram.org/bot${botToken}/getChatMemberCount?chat_id=${channelId}`);
            const countJson = await countRes.json();
            if (countRes.ok && countJson.ok && typeof countJson.result === 'number') {
              membersCount = countJson.result;
            }
          } catch {
            // Count query optional
          }
        }

        await prisma.socialAccount.update({
          where: { id: accountId },
          data: {
            status: 'CONNECTED',
            lastSyncAt: new Date(),
            followersCount: membersCount !== null ? membersCount : undefined,
            errorMessage: null,
          },
        });

        return {
          success: true,
          message: `تم التحقق بنجاح من البوت: @${json.result?.username} (ID: ${json.result?.id})`,
          data: json.result,
        };
      } else {
        await prisma.socialAccount.update({
          where: { id: accountId },
          data: { status: 'ERROR', errorMessage: json.description },
        });
        return { success: false, message: json.description || 'فشل الاتصال بـ Telegram API' };
      }
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : 'خطأ غير معروف في الاتصال' };
    }
  }

  return {
    success: false,
    message: `التحقق التلقائي المباشر مدعوم حالياً لـ Telegram. بقية المنصات تتطلب إعداد OAuth معتمد.`,
  };
}
