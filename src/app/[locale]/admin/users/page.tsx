import React from 'react';
import { prisma } from '@/lib/prisma';
import { User, Mail, Calendar } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import {getLocale} from 'next-intl/server';
import {pick} from '@/i18n/pick';
import { setUserRole } from './actions';
import { STAFF_ROLES } from '@/lib/auth/admin-access';

/**
 * UsersAdminPage - Management of platform users and administrative roles (RBAC).
 */
export default async function UsersAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const locale = await getLocale();
  const { role } = await searchParams;
  const roleFilter =
    role === 'SUPER_ADMIN' ||
    role === 'EDITOR' ||
    role === 'NEWS_EDITOR' ||
    role === 'MODERATOR' ||
    role === 'CONTENT_MANAGER' ||
    role === 'ADS_MANAGER'
      ? role
      : undefined;
  const users = await prisma.user.findMany({
    where: roleFilter ? { role: roleFilter } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const filters = [
    { id: 'all', href: '/admin/users', label: pick(locale, 'الكل', 'All') },
    { id: 'SUPER_ADMIN', href: '/admin/users?role=SUPER_ADMIN', label: pick(locale, 'المدراء', 'Administrators') },
    { id: 'EDITOR', href: '/admin/users?role=EDITOR', label: pick(locale, 'المحررون', 'Editors') },
    { id: 'NEWS_EDITOR', href: '/admin/users?role=NEWS_EDITOR', label: pick(locale, 'محررو الأخبار', 'News editors') },
    { id: 'MODERATOR', href: '/admin/users?role=MODERATOR', label: pick(locale, 'المشرفون', 'Moderators') },
    { id: 'CONTENT_MANAGER', href: '/admin/users?role=CONTENT_MANAGER', label: pick(locale, 'المحتوى', 'Content') },
    { id: 'ADS_MANAGER', href: '/admin/users?role=ADS_MANAGER', label: pick(locale, 'الإعلانات', 'Ads') },
  ] as const;

  const active = roleFilter ?? 'all';

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black">{pick(locale, 'إدارة المستخدمين', 'Manage users')}</h1>
        <div className="flex bg-card dark:bg-muted p-1 rounded-2xl shadow-sm border border-border dark:border-border">
          {filters.map((filter) => (
            <Link
              key={filter.id}
              href={filter.href}
              className={`px-6 py-2 rounded-xl text-xs font-black ${
                active === filter.id ? 'bg-orange-500 text-primary-foreground' : 'text-muted-foreground font-bold'
              }`}
            >
              {filter.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-card dark:bg-background rounded-[2.5rem] shadow-xl border border-gray-50 dark:border-border overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-muted dark:bg-muted/50">
            <tr>
              <th className="px-8 py-5 text-xs font-black uppercase text-muted-foreground">{pick(locale, 'المستخدم', 'User')}</th>
              <th className="px-8 py-5 text-xs font-black uppercase text-muted-foreground">{pick(locale, 'البريد الإلكتروني', 'Email')}</th>
              <th className="px-8 py-5 text-xs font-black uppercase text-muted-foreground">{pick(locale, 'الدور', 'Role')}</th>
              <th className="px-8 py-5 text-xs font-black uppercase text-muted-foreground">{pick(locale, 'تغيير الدور', 'Change role')}</th>
              <th className="px-8 py-5 text-xs font-black uppercase text-muted-foreground">{pick(locale, 'تاريخ التسجيل', 'Registered')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-muted dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-muted dark:bg-muted rounded-full flex items-center justify-center text-muted-foreground">
                      <User className="w-5 h-5" />
                    </div>
                    <span className="font-bold">{user.name || pick(locale, 'مستخدم جديد', 'New user')}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                    <Mail className="w-3.5 h-3.5" />
                    {user.email}
                  </div>
                </td>
                <td className="px-8 py-6">
                   <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${user.role === 'SUPER_ADMIN' ? 'bg-orange-100 text-orange-600' : user.role === 'EDITOR' ? 'bg-blue-100 text-blue-600' : 'bg-muted text-muted-foreground'}`}>
                      {user.role}
                   </span>
                </td>
                <td className="px-8 py-6">
                  <form action={setUserRole} className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={user.id} />
                    <select name="role" defaultValue={user.role} className="rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-bold">
                      <option value="USER">USER</option>
                      {STAFF_ROLES.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                    <button type="submit" className="rounded-lg bg-foreground px-3 py-1 text-[11px] font-black text-white">
                      {pick(locale, 'حفظ', 'Save')}
                    </button>
                  </form>
                </td>
                <td className="px-8 py-6">
                   <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(user.createdAt, 'dd MMM yyyy', { locale: locale === 'ar' ? ar : enUS })}
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
