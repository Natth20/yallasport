import { swallow } from '@/lib/ops/caught';
import React from 'react';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { EyeOff, Eye, Trash2, MessageSquare, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import { getLocale } from 'next-intl/server';
import { pick } from '@/i18n/pick';
import { deleteComment, hideComment, unhideComment } from './actions';

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
      news: { select: { title: true } },
    },
    take: 100,
  });
  const hiddenRows = await prisma.$queryRaw<Array<{ id: string; hiddenAt: Date }>>`
    SELECT id, "hiddenAt" FROM "Comment" WHERE "hiddenAt" IS NOT NULL
  `.catch(swallow("src/app/[locale]/admin/comments/page.tsx:31", [] as Array<{ id: string; hiddenAt: Date }>));
  const hiddenAt = new Map(hiddenRows.map((row) => [row.id, row.hiddenAt]));

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-4 text-3xl font-black text-foreground dark:text-foreground">
          <MessageSquare className="h-8 w-8 text-orange-500" />
          {pick(locale, 'إدارة التعليقات', 'Manage comments')}
        </h2>
        <div className="rounded-2xl border border-orange-100 bg-orange-50 px-6 py-2 text-xs font-black text-orange-600 dark:border-orange-900/30 dark:bg-orange-950/20">
          {pick(locale, 'إجمالي التعليقات المراقبة:', 'Moderated comments:')} {comments.length}
        </div>
      </div>

      <div className="overflow-hidden rounded-[3rem] border border-gray-50 bg-card shadow-xl dark:border-border dark:bg-background">
        <table className="w-full text-right">
          <thead>
            <tr className="border-b border-border bg-muted text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:border-border dark:bg-muted/50">
              <th className="px-8 py-6">{pick(locale, 'المستخدم', 'User')}</th>
              <th className="px-8 py-6">{pick(locale, 'المحتوى', 'Content')}</th>
              <th className="px-8 py-6">{pick(locale, 'المصدر', 'Source')}</th>
              <th className="px-8 py-6">{pick(locale, 'التاريخ', 'Date')}</th>
              <th className="px-8 py-6">{pick(locale, 'الإجراءات', 'Actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
            {comments.map((comment) => {
              const hidden = hiddenAt.has(comment.id);
              return (
                <tr
                  key={comment.id}
                  className={`group transition-colors hover:bg-muted dark:hover:bg-slate-800/30 ${hidden ? 'opacity-60' : ''}`}
                >
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-foreground dark:text-foreground">
                        {comment.user.name || pick(locale, 'مجهول', 'Unknown')}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{comment.user.email}</span>
                      {hidden ? (
                        <span className="mt-1 text-[10px] font-black uppercase text-amber-600">
                          {pick(locale, 'مخفي', 'Hidden')}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="line-clamp-2 max-w-md text-sm font-medium text-foreground dark:text-muted-foreground">
                      {comment.content}
                    </p>
                  </td>
                  <td className="px-8 py-6">
                    <span className="rounded-lg bg-muted px-3 py-1 text-[10px] font-black text-muted-foreground dark:bg-muted">
                      {comment.match
                        ? `${comment.match.homeTeam.name} vs ${comment.match.awayTeam.name}`
                        : comment.news
                          ? comment.news.title
                          : pick(locale, 'عام', 'General')}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-xs font-bold tabular-nums text-muted-foreground">
                    {format(comment.createdAt, 'dd/MM HH:mm', { locale: locale === 'ar' ? ar : enUS })}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      {hidden ? (
                        <form action={unhideComment}>
                          <input type="hidden" name="commentId" value={comment.id} />
                          <button
                            type="submit"
                            className="rounded-xl bg-emerald-50 p-3 text-emerald-600 hover:bg-emerald-500 hover:text-white dark:bg-emerald-950/20"
                            title={pick(locale, 'إظهار', 'Unhide')}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </form>
                      ) : (
                        <form action={hideComment}>
                          <input type="hidden" name="commentId" value={comment.id} />
                          <button
                            type="submit"
                            className="rounded-xl bg-amber-50 p-3 text-amber-600 hover:bg-amber-500 hover:text-white dark:bg-amber-950/20"
                            title={pick(locale, 'إخفاء', 'Hide')}
                          >
                            <EyeOff className="h-4 w-4" />
                          </button>
                        </form>
                      )}
                      <form action={deleteComment}>
                        <input type="hidden" name="commentId" value={comment.id} />
                        <button
                          type="submit"
                          className="rounded-xl bg-red-50 p-3 text-red-500 hover:bg-red-500 hover:text-white dark:bg-red-950/20"
                          title={pick(locale, 'حذف', 'Delete')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {comments.length === 0 && (
          <div className="py-32 text-center italic opacity-30">
            <Shield className="mx-auto mb-4 h-16 w-16" />
            <p>{pick(locale, 'لا توجد تعليقات للمراجعة حالياً.', 'No comments to review.')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
