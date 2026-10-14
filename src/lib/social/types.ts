import { SocialPlatform, SocialPostStatus, SocialAccountStatus, UserRole } from '@/generated/prisma';

export { SocialPlatform, SocialPostStatus, SocialAccountStatus };

export interface SocialAccountConfig {
  botToken?: string;
  chatId?: string;
  channelId?: string;
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  webhookSecret?: string;
}

export interface PlatformSpec {
  name: string;
  platform: SocialPlatform;
  maxChars: number;
  supportsMedia: boolean;
  maxMediaCount: number;
  hashtagStyle: 'standard' | 'minimal' | 'camelCase';
  brandColor: string;
  iconName: string;
}

export const PLATFORM_SPECS: Record<SocialPlatform, PlatformSpec> = {
  TELEGRAM: {
    name: 'Telegram',
    platform: 'TELEGRAM',
    maxChars: 4096,
    supportsMedia: true,
    maxMediaCount: 10,
    hashtagStyle: 'standard',
    brandColor: '#0088cc',
    iconName: 'Send',
  },
  TWITTER: {
    name: 'X (Twitter)',
    platform: 'TWITTER',
    maxChars: 280,
    supportsMedia: true,
    maxMediaCount: 4,
    hashtagStyle: 'minimal',
    brandColor: '#1da1f2',
    iconName: 'Twitter',
  },
  FACEBOOK: {
    name: 'Facebook',
    platform: 'FACEBOOK',
    maxChars: 5000,
    supportsMedia: true,
    maxMediaCount: 10,
    hashtagStyle: 'standard',
    brandColor: '#1877f2',
    iconName: 'Facebook',
  },
  INSTAGRAM: {
    name: 'Instagram',
    platform: 'INSTAGRAM',
    maxChars: 2200,
    supportsMedia: true,
    maxMediaCount: 10,
    hashtagStyle: 'standard',
    brandColor: '#e4405f',
    iconName: 'Instagram',
  },
  YOUTUBE: {
    name: 'YouTube Community',
    platform: 'YOUTUBE',
    maxChars: 5000,
    supportsMedia: true,
    maxMediaCount: 5,
    hashtagStyle: 'standard',
    brandColor: '#ff0000',
    iconName: 'Youtube',
  },
  WHATSAPP: {
    name: 'WhatsApp Channels',
    platform: 'WHATSAPP',
    maxChars: 1024,
    supportsMedia: true,
    maxMediaCount: 1,
    hashtagStyle: 'minimal',
    brandColor: '#25d366',
    iconName: 'MessageCircle',
  },
};

/**
 * RBAC Helper: Verify staff role permissions for social media operations
 * Roles: SUPER_ADMIN (مدير), SOCIAL_MANAGER (مدير تواصل), EDITOR/NEWS_EDITOR (محرر), REVIEWER (مراجع), ANALYST (محلل)
 */
export function canComposeSocial(role?: string | null): boolean {
  return ['SUPER_ADMIN', 'SOCIAL_MANAGER', 'EDITOR', 'NEWS_EDITOR'].includes(role || '');
}

export function canReviewSocial(role?: string | null): boolean {
  return ['SUPER_ADMIN', 'SOCIAL_MANAGER', 'REVIEWER'].includes(role || '');
}

export function canApproveSocial(role?: string | null): boolean {
  return ['SUPER_ADMIN', 'SOCIAL_MANAGER', 'REVIEWER'].includes(role || '');
}

export function canPublishSocial(role?: string | null): boolean {
  return ['SUPER_ADMIN', 'SOCIAL_MANAGER'].includes(role || '');
}

export function canScheduleSocial(role?: string | null): boolean {
  return ['SUPER_ADMIN', 'SOCIAL_MANAGER'].includes(role || '');
}

export function canManageSocialAccounts(role?: string | null): boolean {
  return ['SUPER_ADMIN', 'SOCIAL_MANAGER'].includes(role || '');
}

export function canViewSocialAnalytics(role?: string | null): boolean {
  return ['SUPER_ADMIN', 'SOCIAL_MANAGER', 'EDITOR', 'NEWS_EDITOR', 'REVIEWER', 'ANALYST'].includes(role || '');
}

export function getRoleArabicTitle(role?: string | null): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'المدير التنفيذي للأنظمة (Super Admin)';
    case 'SOCIAL_MANAGER':
      return 'مدير التواصل الاجتماعي (Social Manager)';
    case 'EDITOR':
    case 'NEWS_EDITOR':
      return 'محرر محتوى رياضي (Editor)';
    case 'REVIEWER':
      return 'مراجع ومسؤول تدقيق (Reviewer)';
    case 'ANALYST':
      return 'محلل بيانات ورصد (Analyst)';
    default:
      return role || 'مستخدم';
  }
}

export function getStatusArabicLabel(status: SocialPostStatus): { label: string; color: string } {
  switch (status) {
    case 'DRAFT':
      return { label: 'مسودة', color: '#6b7280' };
    case 'IN_REVIEW':
      return { label: 'قيد المراجعة', color: '#f59e0b' };
    case 'APPROVED':
      return { label: 'معتمد للنشر', color: '#10b981' };
    case 'SCHEDULED':
      return { label: 'مجدول', color: '#3b82f6' };
    case 'PUBLISHED':
      return { label: 'تم النشر بنجاح', color: '#059669' };
    case 'FAILED':
      return { label: 'تعثر النشر', color: '#ef4444' };
    case 'CANCELLED':
      return { label: 'ملغي', color: '#9ca3af' };
  }
}
