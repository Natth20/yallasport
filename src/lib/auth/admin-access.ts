export const STAFF_ROLES = [
  'SUPER_ADMIN',
  'EDITOR',
  'NEWS_EDITOR',
  'MODERATOR',
  'CONTENT_MANAGER',
  'ADS_MANAGER',
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export const ADMIN_NAV: Array<{ href: string; roles: StaffRole[]; ar: string; en: string }> = [
  { href: '/admin', roles: [...STAFF_ROLES], ar: 'الرئيسية', en: 'Home' },
  { href: '/admin/news', roles: ['SUPER_ADMIN', 'EDITOR', 'NEWS_EDITOR', 'MODERATOR'], ar: 'إدارة الأخبار', en: 'Manage news' },
  { href: '/admin/news/calendar', roles: ['SUPER_ADMIN', 'EDITOR', 'NEWS_EDITOR'], ar: 'التقويم التحريري', en: 'Editorial calendar' },
  { href: '/admin/comments', roles: ['SUPER_ADMIN', 'MODERATOR'], ar: 'إدارة التعليقات', en: 'Manage comments' },
  { href: '/admin/inbox', roles: ['SUPER_ADMIN', 'MODERATOR', 'EDITOR'], ar: 'صندوق المكتب', en: 'Desk inbox' },
  { href: '/admin/matches', roles: ['SUPER_ADMIN', 'CONTENT_MANAGER', 'EDITOR'], ar: 'إدارة المباريات', en: 'Manage matches' },
  { href: '/admin/leagues', roles: ['SUPER_ADMIN', 'CONTENT_MANAGER'], ar: 'إدارة البطولات', en: 'Manage leagues' },
  { href: '/admin/teams', roles: ['SUPER_ADMIN', 'CONTENT_MANAGER'], ar: 'إدارة الأندية', en: 'Manage teams' },
  { href: '/admin/players', roles: ['SUPER_ADMIN', 'CONTENT_MANAGER'], ar: 'إدارة اللاعبين', en: 'Manage players' },
  { href: '/admin/vod', roles: ['SUPER_ADMIN', 'CONTENT_MANAGER'], ar: 'إدارة المحتوى', en: 'Manage VOD' },
  { href: '/admin/tv-guide', roles: ['SUPER_ADMIN', 'EDITOR'], ar: 'دليل القنوات', en: 'TV Guide' },
  { href: '/admin/ads', roles: ['SUPER_ADMIN', 'ADS_MANAGER'], ar: 'إدارة الإعلانات', en: 'Manage ads' },
  { href: '/admin/licenses', roles: ['SUPER_ADMIN'], ar: 'التراخيص', en: 'Licenses' },
  { href: '/admin/streaming', roles: ['SUPER_ADMIN'], ar: 'أصول البث', en: 'Stream assets' },
  { href: '/admin/translations', roles: ['SUPER_ADMIN', 'EDITOR', 'NEWS_EDITOR'], ar: 'الترجمات', en: 'Translations' },
  { href: '/admin/users', roles: ['SUPER_ADMIN'], ar: 'المستخدمون', en: 'Users' },
  { href: '/admin/kpis', roles: ['SUPER_ADMIN'], ar: 'مؤشرات الأداء', en: 'KPIs' },
];

export function isStaffRole(role?: string | null): role is StaffRole {
  return Boolean(role && (STAFF_ROLES as readonly string[]).includes(role));
}

export function canAccessAdminPath(role: string | null | undefined, pathname: string): boolean {
  if (!isStaffRole(role)) return false;
  if (role === 'SUPER_ADMIN') {
    return pathname === '/admin' || pathname.startsWith('/admin/');
  }
  const matches = ADMIN_NAV.filter((item) => {
    if (item.href === '/admin') return pathname === '/admin';
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }).sort((a, b) => b.href.length - a.href.length);
  const best = matches[0];
  return Boolean(best?.roles.includes(role));
}
