import React from 'react';
import { prisma } from '@/lib/prisma';
import { User, Shield, Mail, Calendar, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import {getLocale} from 'next-intl/server';
import {pick} from '@/i18n/pick';

/**
 * UsersAdminPage - Management of platform users and administrative roles (RBAC).
 */
export default async function UsersAdminPage() {
  const locale = await getLocale();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black">{pick(locale, 'إدارة المستخدمين', 'Manage users')}</h1>
        <div className="flex bg-card dark:bg-muted p-1 rounded-2xl shadow-sm border border-border dark:border-border">
          <button className="px-6 py-2 rounded-xl bg-orange-500 text-primary-foreground font-black text-xs">{pick(locale, 'الكل', 'All')}</button>
          <button className="px-6 py-2 rounded-xl text-muted-foreground font-bold text-xs">{pick(locale, 'المدراء', 'Administrators')}</button>
          <button className="px-6 py-2 rounded-xl text-muted-foreground font-bold text-xs">{pick(locale, 'المحررون', 'Editors')}</button>
        </div>
      </div>

      <div className="bg-card dark:bg-background rounded-[2.5rem] shadow-xl border border-gray-50 dark:border-border overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-muted dark:bg-muted/50">
            <tr>
              <th className="px-8 py-5 text-xs font-black uppercase text-muted-foreground">{pick(locale, 'المستخدم', 'User')}</th>
              <th className="px-8 py-5 text-xs font-black uppercase text-muted-foreground">{pick(locale, 'البريد الإلكتروني', 'Email')}</th>
              <th className="px-8 py-5 text-xs font-black uppercase text-muted-foreground">{pick(locale, 'الدور', 'Role')}</th>
              <th className="px-8 py-5 text-xs font-black uppercase text-muted-foreground">{pick(locale, 'تاريخ التسجيل', 'Registered')}</th>
              <th className="px-8 py-5 text-xs font-black uppercase text-muted-foreground text-left">{pick(locale, 'الإجراءات', 'Actions')}</th>
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
                   <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(user.createdAt, 'dd MMM yyyy', { locale: locale === 'ar' ? ar : enUS })}
                   </div>
                </td>
                <td className="px-8 py-6 text-left">
                   <button className="p-2 hover:bg-muted dark:hover:bg-slate-800 rounded-lg transition-colors">
                      <MoreVertical className="w-5 h-5 text-muted-foreground" />
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
