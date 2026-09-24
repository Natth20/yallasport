'use client';

import React, { useRef, useState } from 'react';
import { MessageSquare, Send, User as UserIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

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
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-16 overflow-hidden rounded-[2rem] border border-border bg-card dark:border-border dark:bg-background">
      <div className="flex items-center gap-3 border-b border-gray-50 px-6 py-5 dark:border-border">
        <MessageSquare className="h-4 w-4 text-orange-500" />
        <div>
          <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-orange-500">{t('chat')}</p>
          <h2 className="text-base font-bold text-foreground dark:text-foreground">{t('live_chat')}</h2>
        </div>
      </div>

      <div ref={listRef} className="max-h-96 space-y-4 overflow-y-auto px-6 py-5">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted dark:bg-muted">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 rounded-2xl bg-muted px-4 py-3 dark:bg-muted/60">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-foreground dark:text-foreground">
                    {comment.user.name || '—'}
                  </span>
                  <span className="text-[9px] font-bold uppercase text-muted-foreground">
                    {new Date(comment.createdAt).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: 'short',
                    })}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-foreground dark:text-muted-foreground">{comment.content}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">{t('first_comment')}</p>
        )}
      </div>

      <div className="border-t border-gray-50 px-6 py-4 dark:border-border">
        {isLoggedIn ? (
          <>
          <form onSubmit={submit} className="relative">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={busy}
              maxLength={500}
              placeholder={t('comment_placeholder')}
              className="w-full rounded-2xl border border-border bg-card py-4 pe-14 ps-5 text-sm outline-none focus:ring-2 focus:ring-orange-500 dark:border-border dark:bg-background"
            />
            <button
              type="submit"
              disabled={busy || !text.trim()}
              className="absolute end-2 top-2 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500 text-primary-foreground disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          {error ? <p className="mt-2 text-xs font-bold text-red-500">{error}</p> : null}
          </>
        ) : (
          <p className="py-2 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <Link href="/login" className="text-orange-500 hover:underline">
              {t('chat_sign_in')}
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
