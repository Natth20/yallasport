import React from 'react';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { Trash2, MessageSquare, Shield, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import {getLocale} from 'next-intl/server';
import {pick} from '@/i18n/pick';

/**
 * AdminCommentsPage - For moderators to manage/delete user comments.
 */
export default async function AdminCommentsPage() {
  const locale = await getLocale();
  const session = await auth();
  if (!session || !['SUPER_ADMIN', 'MODERATOR'].includes(session.user?.role as string)) {
    redirect('/');
  }

  const comments = await prisma.comment.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, email: true } },
      match: { select: { homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } } },
      news: { select: { title: true } }
    },
    take: 100
  });

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-foreground dark:text-foreground flex items-center gap-4">
          <MessageSquare className="w-8 h-8 text-orange-500" />
          {pick(locale, 'إدارة التعليقات', 'Manage comments')}
        </h2>
        <div className="bg-orange-50 dark:bg-orange-950/20 px-6 py-2 rounded-2xl text-xs font-black text-orange-600 border border-orange-100 dark:border-orange-900/30">
          {pick(locale, 'إجمالي التعليقات المراقبة:', 'Moderated comments:')} {comments.length}
        </div>
      </div>

      <div className="bg-card dark:bg-background rounded-[3rem] shadow-xl border border-gray-50 dark:border-border overflow-hidden">
        <table className="w-full text-right">
          <thead>
            <tr className="bg-muted dark:bg-muted/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border dark:border-border">
              <th className="px-8 py-6">{pick(locale, 'المستخدم', 'User')}</th>
              <th className="px-8 py-6">{pick(locale, 'المحتوى', 'Content')}</th>
              <th className="px-8 py-6">{pick(locale, 'المصدر', 'Source')}</th>
              <th className="px-8 py-6">{pick(locale, 'التاريخ', 'Date')}</th>
              <th className="px-8 py-6">{pick(locale, 'الإجراءات', 'Actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
            {comments.map((c) => (
              <tr key={c.id} className="group hover:bg-muted dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-foreground dark:text-foreground">{c.user.name || pick(locale, 'مجهول', 'Unknown')}</span>
                    <span className="text-[10px] text-muted-foreground">{c.user.email}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <p className="text-sm font-medium text-foreground dark:text-muted-foreground line-clamp-2 max-w-md">{c.content}</p>
                </td>
                <td className="px-8 py-6">
                  <span className="text-[10px] font-black px-3 py-1 bg-muted dark:bg-muted rounded-lg text-muted-foreground">
                    {c.match ? `${c.match.homeTeam.name} vs ${c.match.awayTeam.name}` : c.news ? c.news.title : pick(locale, 'عام', 'General')}
                  </span>
                </td>
                <td className="px-8 py-6 text-xs text-muted-foreground font-bold tabular-nums">
                  {format(c.createdAt, 'dd/MM HH:mm', { locale: locale === 'ar' ? ar : enUS })}
                </td>
                <td className="px-8 py-6">
                  <form action={`/api/admin/comments/delete`} method="POST">
                    <input type="hidden" name="commentId" value={c.id} />
                    <button className="p-3 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {comments.length === 0 && (
           <div className="py-32 text-center opacity-30 italic">
              <Shield className="w-16 h-16 mx-auto mb-4" />
              <p>{pick(locale, 'لا توجد تعليقات للمراجعة حالياً.', 'No comments to review.')}</p>
           </div>
        )}
      </div>
    </div>
  );
}
