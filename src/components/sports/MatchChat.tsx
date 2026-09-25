'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, MessageSquare, Send, Shield } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { swallow, reportCaughtError } from '@/lib/ops/caught';
import { CHAT_MAX_LENGTH, CHAT_MIN_LENGTH } from '@/lib/utils/word-filter';
import styles from '@/components/sports/match-dossier.module.css';

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    name: string;
    role: string;
  };
}

export interface MatchChatProps {
  matchId: string;
  isLoggedIn: boolean;
  initialComments: Comment[];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

export const MatchChat: React.FC<MatchChatProps> = ({ matchId, isLoggedIn, initialComments }) => {
  const locale = useLocale();
  const t = useTranslations('sports');
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [acceptedRules, setAcceptedRules] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const latestStamp = useRef(
    initialComments.length > 0 ? initialComments[initialComments.length - 1]!.createdAt : null
  );

  useEffect(() => {
    setComments(initialComments);
    latestStamp.current =
      initialComments.length > 0 ? initialComments[initialComments.length - 1]!.createdAt : null;
  }, [initialComments, matchId]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node || !stickToBottom.current) return;
    node.scrollTop = node.scrollHeight;
  }, [comments]);

  useEffect(() => {
    let cancelled = false;

    const pull = async () => {
      try {
        const params = new URLSearchParams({ matchId });
        if (latestStamp.current) params.set('after', latestStamp.current);
        const res = await fetch(`/api/sports/comments?${params.toString()}`, { cache: 'no-store' });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!data?.success || !Array.isArray(data.comments) || data.comments.length === 0) return;

        setComments((current) => {
          const seen = new Set(current.map((row) => row.id));
          const incoming = (data.comments as Comment[]).filter((row) => !seen.has(row.id));
          if (incoming.length === 0) return current;
          const next = [...current, ...incoming];
          latestStamp.current = next[next.length - 1]!.createdAt;
          return next.slice(-120);
        });
      } catch (err) {
        reportCaughtError('MatchChat.pull', err, { persist: false });
      }
    };

    const timer = window.setInterval(() => {
      void pull();
    }, 10000);
    void pull();

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [matchId]);

  const onFeedScroll = () => {
    const node = scrollRef.current;
    if (!node) return;
    stickToBottom.current = node.scrollHeight - node.scrollTop - node.clientHeight < 48;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newComment.trim();
    if (!text || !isLoggedIn || submitting) return;
    if (!acceptedRules) {
      setError(t('chat_error_rules'));
      setRulesOpen(true);
      return;
    }
    if (text.length < CHAT_MIN_LENGTH || text.length > CHAT_MAX_LENGTH) {
      setError(t('chat_error_length'));
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/sports/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, content: text }),
      });
      const data = await res.json().catch(swallow('MatchChat.post', null, { persist: false }));
      if (!res.ok || !data?.success) {
        setError(data?.error || t('chat_error_generic'));
        return;
      }
      const comment = data.comment as Comment;
      setComments((current) => {
        if (current.some((row) => row.id === comment.id)) return current;
        const next = [...current, comment];
        latestStamp.current = comment.createdAt;
        return next;
      });
      setNewComment('');
      stickToBottom.current = true;
    } catch (err) {
      reportCaughtError('MatchChat.submit', err, { persist: false });
      setError(t('chat_error_generic'));
    } finally {
      setSubmitting(false);
    }
  };

  const remaining = CHAT_MAX_LENGTH - newComment.length;

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[var(--ys-orange)]" />
          <h3 className="text-xs font-black uppercase tracking-wider text-[var(--foreground)]">
            {t('chat')}
          </h3>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-bold text-[var(--muted-foreground)]">
          <span className="tabular-nums">{comments.length}</span>
          <span>{t('chat_msgs')}</span>
        </div>
      </div>

      <div className="border-b border-[var(--border)] bg-[var(--muted)]/20 px-3 py-1.5 text-[11px]">
        <button
          type="button"
          className="flex w-full items-center justify-between font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          aria-expanded={rulesOpen}
          onClick={() => setRulesOpen((open) => !open)}
        >
          <span className="flex items-center gap-1.5">
            <Shield className="h-3 w-3 text-[var(--ys-orange)]" />
            <span>{t('chat_rules_title')}</span>
          </span>
          <ChevronDown className={`h-3 w-3 transition-transform ${rulesOpen ? 'rotate-180' : ''}`} />
        </button>
        {rulesOpen ? (
          <ul className="mt-2 space-y-1 text-[10px] text-[var(--muted-foreground)]">
            <li>• {t('chat_rule_1')}</li>
            <li>• {t('chat_rule_2')}</li>
            <li>• {t('chat_rule_3')}</li>
          </ul>
        ) : null}
      </div>

      <div ref={scrollRef} onScroll={onFeedScroll} className={styles.chatFeed}>
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className={styles.chatMessage}>
              <div className={styles.chatAvatar}>
                {initials(comment.user.name)}
              </div>
              <div className={styles.chatBubble}>
                <div className={styles.chatUserRow}>
                  <span className={styles.chatUserName}>{comment.user.name}</span>
                  <time className={styles.chatTime} dateTime={comment.createdAt}>
                    {new Date(comment.createdAt).toLocaleTimeString(locale === 'ar' ? 'ar-EG' : 'en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </div>
                <p className={styles.chatText}>{comment.content}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="flex h-full flex-col items-center justify-center py-8 text-center text-[var(--muted-foreground)]">
            <MessageSquare className="h-8 w-8 opacity-30" />
            <strong className="mt-2 text-xs font-bold text-[var(--foreground)]">{t('first_comment')}</strong>
            <p className="text-[11px]">{t('chat_empty_copy')}</p>
          </div>
        )}
      </div>

      <div className={styles.chatInputArea}>
        {isLoggedIn ? (
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--muted-foreground)]">
                <input
                  type="checkbox"
                  checked={acceptedRules}
                  onChange={(e) => setAcceptedRules(e.target.checked)}
                  className="rounded border-[var(--border)]"
                />
                <span>{t('chat_accept_rules')}</span>
              </label>
              <span className="ms-auto text-[10px] font-bold tabular-nums text-[var(--muted-foreground)]">
                {remaining}
              </span>
            </div>

            <div className={styles.chatInputForm}>
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value.slice(0, CHAT_MAX_LENGTH))}
                disabled={submitting}
                placeholder={t('comment_placeholder')}
                maxLength={CHAT_MAX_LENGTH}
                className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none"
              />
              <button
                type="submit"
                disabled={submitting || newComment.trim().length < CHAT_MIN_LENGTH || !acceptedRules}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary)] text-white transition hover:opacity-90 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            {error ? <p className="text-[10px] font-bold text-rose-500">{error}</p> : null}
          </form>
        ) : (
          <div className="flex items-center justify-between py-1">
            <p className="text-[11px] font-medium text-[var(--muted-foreground)]">{t('chat_sign_in')}</p>
            <Link
              href="/login"
              className="rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:opacity-90"
            >
              {t('chat_sign_in_cta')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
