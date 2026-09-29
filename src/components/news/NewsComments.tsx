'use client';

import React, { useRef, useState } from 'react';
import { MessageSquare, Send, User as UserIcon, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { pick } from '@/i18n/pick';

export type NewsCommentRow = {
  id: string;
  content: string;
  createdAt: string;
  user: { name: string | null; role: string };
};

export function NewsComments({
  newsId,
  isLoggedIn,
  initialComments,
}: {
  newsId: string;
  isLoggedIn: boolean;
  initialComments: NewsCommentRow[];
}) {
  const locale = useLocale();
  const t = useTranslations('sports');
  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isLoggedIn || !text.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/sports/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsId, content: text.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        const code = data?.error;
        setError(
          code === 'unauthorized'
            ? t('chat_error_auth')
            : code === 'flagged'
              ? t('chat_error_flagged')
              : code === 'spam'
                ? t('chat_error_spam')
                : code === 'no_links'
                  ? t('chat_error_links')
                  : t('chat_error_generic'),
        );
        return;
      }
      if (data.comment) {
        setComments((prev) => [...prev, data.comment]);
        setText('');
        requestAnimationFrame(() => {
          listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
        });
      }
    } catch {
      setError(t('chat_error_generic'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-12 overflow-hidden rounded-3xl border border-border/80 bg-card/70 backdrop-blur-md">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-border/60 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">
              {pick(locale, 'مجتمع القراء', 'Reader Community')}
            </span>
            <h2 className="text-base font-black text-foreground">
              {pick(locale, 'التعليقات والآراء', 'Comments & Discussion')}
              <span className="ms-2 inline-flex items-center justify-center rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">
                {comments.length}
              </span>
            </h2>
          </div>
        </div>
      </div>

      {/* Comment List */}
      <div ref={listRef} className="max-h-[26rem] space-y-3.5 overflow-y-auto p-6">
        {comments.length > 0 ? (
          comments.map((comment) => {
            const isAdmin = comment.user.role === 'ADMIN' || comment.user.role === 'SUPERADMIN';
            const initials = (comment.user.name || '?').slice(0, 2).toUpperCase();

            return (
              <div key={comment.id} className="flex gap-3.5 group">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 font-black text-xs text-primary border border-primary/20">
                  {initials}
                </div>
                <div className="flex-1 rounded-2xl border border-border/50 bg-card/50 p-4 transition-colors group-hover:border-primary/20">
                  <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-foreground">
                        {comment.user.name || pick(locale, 'مستخدم', 'User')}
                      </span>
                      {isAdmin ? (
                        <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-black text-amber-500">
                          <ShieldCheck className="h-2.5 w-2.5" />
                          {pick(locale, 'إدارة', 'Admin')}
                        </span>
                      ) : null}
                    </div>
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: 'short',
                      })}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
              <Sparkles className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-foreground">
              {pick(locale, 'كن أول من يشارك برأيه!', 'Be the first to share your opinion!')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {pick(locale, 'شارك تحليلك أو تعليقك حول هذا التقرير', 'Share your thoughts on this story')}
            </p>
          </div>
        )}
      </div>

      {/* Input / Gate Footer */}
      <div className="border-t border-border/60 bg-muted/20 p-5">
        {isLoggedIn ? (
          <form onSubmit={submit} className="space-y-3">
            <div className="relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={busy}
                maxLength={500}
                rows={3}
                placeholder={pick(locale, 'اكتب تعليقك أو تحليلك هنا...', 'Write your thoughts or analysis here...')}
                className="w-full resize-none rounded-2xl border border-border bg-card p-4 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground">
                  {text.length}/500
                </span>
                <button
                  type="submit"
                  disabled={busy || !text.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:opacity-90 disabled:opacity-50"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span>{pick(locale, 'نشر التعليق', 'Post Comment')}</span>
                      <Send className="h-3.5 w-3.5 rtl:rotate-180" />
                    </>
                  )}
                </button>
              </div>
            </div>
            {error ? (
              <p className="text-xs font-bold text-red-500 animate-in fade-in">{error}</p>
            ) : null}
          </form>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/80 bg-card/40 p-4 text-center">
            <p className="text-xs font-semibold text-muted-foreground">
              {pick(locale, 'للمشاركة في النقاش وإضافة تعليق:', 'To join the discussion and post a comment:')}
            </p>
            <Link
              href="/login"
              className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-4 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              {pick(locale, 'تسجيل الدخول الآن', 'Sign in now')}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

export default NewsComments;
