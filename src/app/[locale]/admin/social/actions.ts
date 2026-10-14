'use server';

import { auth } from '@/lib/auth/auth';
import { isStaffRole } from '@/lib/auth/admin-access';
import {
  canComposeSocial,
  canReviewSocial,
  canApproveSocial,
  canPublishSocial,
  canManageSocialAccounts,
  SocialPlatform,
} from '@/lib/social/types';
import {
  createSocialPost,
  updateSocialPost,
  submitPostForReview,
  reviewSocialPost,
  scheduleSocialPost,
  publishSocialPostNow,
  retrySocialPost,
  deleteSocialPost,
  updateSocialAccountConfig,
  processScheduledSocialQueue,
} from '@/lib/social/service';
import { testAccountConnection } from '@/lib/social/publisher';
import {
  generateSocialPostFromMatch,
  generateSocialPostFromNews,
  MatchAlertType,
} from '@/lib/social/generator';
import { revalidatePath } from 'next/cache';

async function checkAuth(requiredCheck?: (role?: string | null) => boolean) {
  const session = await auth();
  if (!session?.user?.role || !isStaffRole(session.user.role)) {
    throw new Error('غير مصرح لك بتنفيذ هذه العملية');
  }
  if (requiredCheck && !requiredCheck(session.user.role)) {
    throw new Error('ليس لديك الصلاحية الكافية لهذه العملية');
  }
  return session.user;
}

export async function createPostAction(formData: {
  platform: SocialPlatform;
  content: string;
  mediaUrls?: string[];
  scheduledAt?: string | null;
  relatedType?: 'MATCH' | 'NEWS' | 'TRANSFER' | 'OTHER';
  relatedId?: string;
}) {
  const user = await checkAuth(canComposeSocial);

  const post = await createSocialPost({
    platform: formData.platform,
    content: formData.content,
    mediaUrls: formData.mediaUrls || [],
    scheduledAt: formData.scheduledAt ? new Date(formData.scheduledAt) : null,
    authorId: user.id,
    relatedType: formData.relatedType,
    relatedId: formData.relatedId,
  });

  revalidatePath('/[locale]/admin/social', 'page');
  return { success: true, post };
}

export async function submitForReviewAction(postId: string) {
  await checkAuth(canComposeSocial);
  await submitPostForReview(postId);
  revalidatePath('/[locale]/admin/social', 'page');
  return { success: true };
}

export async function reviewPostAction(
  postId: string,
  action: 'APPROVE' | 'REJECT',
  notes?: string
) {
  const user = await checkAuth(action === 'APPROVE' ? canApproveSocial : canReviewSocial);
  await reviewSocialPost(postId, user.id, action, notes);
  revalidatePath('/[locale]/admin/social', 'page');
  return { success: true };
}

export async function schedulePostAction(postId: string, scheduledAtStr: string) {
  await checkAuth(canPublishSocial);
  await scheduleSocialPost(postId, new Date(scheduledAtStr));
  revalidatePath('/[locale]/admin/social', 'page');
  return { success: true };
}

export async function publishNowAction(postId: string) {
  await checkAuth(canPublishSocial);
  const result = await publishSocialPostNow(postId);
  revalidatePath('/[locale]/admin/social', 'page');
  revalidatePath('/[locale]/social', 'page');
  return result;
}

export async function retryPostAction(postId: string) {
  await checkAuth(canPublishSocial);
  const result = await retrySocialPost(postId);
  revalidatePath('/[locale]/admin/social', 'page');
  revalidatePath('/[locale]/social', 'page');
  return result;
}

export async function deletePostAction(postId: string) {
  await checkAuth(canComposeSocial);
  await deleteSocialPost(postId);
  revalidatePath('/[locale]/admin/social', 'page');
  return { success: true };
}

export async function testAccountConnectionAction(accountId: string) {
  await checkAuth(canManageSocialAccounts);
  const result = await testAccountConnection(accountId);
  revalidatePath('/[locale]/admin/social', 'page');
  return result;
}

export async function saveAccountConfigAction(
  accountId: string,
  data: {
    accountName?: string;
    accountHandle?: string;
    authConfig?: Record<string, unknown>;
  }
) {
  await checkAuth(canManageSocialAccounts);
  await updateSocialAccountConfig(accountId, data);
  revalidatePath('/[locale]/admin/social', 'page');
  return { success: true };
}

export async function generateFromMatchAction(
  matchId: string,
  alertType: MatchAlertType,
  platform: SocialPlatform
) {
  await checkAuth(canComposeSocial);
  const generated = await generateSocialPostFromMatch(matchId, alertType, platform);
  return { success: Boolean(generated), generated };
}

export async function generateFromNewsAction(
  newsId: string,
  platform: SocialPlatform
) {
  await checkAuth(canComposeSocial);
  const generated = await generateSocialPostFromNews(newsId, platform);
  return { success: Boolean(generated), generated };
}

export async function triggerScheduledQueueAction() {
  await checkAuth(canPublishSocial);
  const result = await processScheduledSocialQueue();
  revalidatePath('/[locale]/admin/social', 'page');
  revalidatePath('/[locale]/social', 'page');
  return result;
}
