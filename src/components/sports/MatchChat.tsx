'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, MessageSquare, Send, Shield, User as UserIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { CHAT_MAX_LENGTH, CHAT_MIN_LENGTH } from '@/lib/utils/word-filter';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    name: string;
    role: string;
  };
}

interface MatchChatProps {
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

function roleTone(role: string) {
  const value = role.toUpperCase();
  if (value.includes('ADMIN') || value.includes('EDITOR') || value.includes('MODERATOR')) return 'is-desk';
  if (value.includes('PREMIUM')) return 'is-premium';
  return '';
}

function mapError(code: string | undefined, t: ReturnType<typeof useTranslations<'sports'>>) {
  switch (code) {
    case 'unauthorized':
      return t('chat_error_auth');
    case 'rate_limited':
      return t('chat_error_rate');
    case 'invalid_length':
      return t('chat_error_length');
    case 'flagged':
      return t('chat_error_flagged');
    case 'no_links':
      return t('chat_error_links');
    case 'spam':
      return t('chat_error_spam');
    case 'duplicate':
      return t('chat_error_duplicate');
    default:
      return t('chat_error_generic');
  }
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
      } catch {
        // Keep the room available if a poll fails.
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
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setError(mapError(data?.error, t));
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
    } catch {
      setError(t('chat_error_generic'));
    } finally {
      setSubmitting(false);
    }
  };

  const remaining = CHAT_MAX_LENGTH - newComment.length;

  return (
    <div className="match-chat">
      <div className="match-chat-head">
        <div className="match-chat-head-copy">
          <span className="match-chat-folio" aria-hidden>
            LIVE
          </span>
          <div>
            <span className="atlas-section-kicker text-primary">{t('chat')}</span>
            <h3 className="match-chat-title">{t('live_chat')}</h3>
          </div>
        </div>
        <div className="match-chat-meta">
          <MessageSquare className="h-3.5 w-3.5" aria-hidden />
          <strong>{comments.length}</strong>
          <span>{t('chat_msgs')}</span>
        </div>
      </div>

      <div className="match-chat-rules">
        <button
          type="button"
          className="match-chat-rules-toggle"
          aria-expanded={rulesOpen}
          onClick={() => setRulesOpen((open) => !open)}
        >
          <Shield className="h-3.5 w-3.5" aria-hidden />
          <span>{t('chat_rules_title')}</span>
          <ChevronDown className={`h-3.5 w-3.5 transition ${rulesOpen ? 'rotate-180' : ''}`} aria-hidden />
        </button>
        {rulesOpen ? (
          <ul className="match-chat-rules-list">
            <li>{t('chat_rule_1')}</li>
            <li>{t('chat_rule_2')}</li>
            <li>{t('chat_rule_3')}</li>
            <li>{t('chat_rule_4')}</li>
            <li>{t('chat_rule_5')}</li>
          </ul>
        ) : null}
      </div>

      <div ref={scrollRef} onScroll={onFeedScroll} className="match-chat-feed no-scrollbar">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <article key={comment.id} className={`match-chat-bubble ${roleTone(comment.user.role)}`}>
              <div className="match-chat-avatar" aria-hidden>
                {initials(comment.user.name)}
              </div>
              <div className="match-chat-body">
                <div className="match-chat-byline">
                  <strong>{comment.user.name}</strong>
                  <time dateTime={comment.createdAt}>
                    {new Date(comment.createdAt).toLocaleTimeString(locale === 'ar' ? 'ar-EG' : 'en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </div>
                <p>{comment.content}</p>
              </div>
            </article>
          ))
        ) : (
          <div className="match-chat-empty">
            <span className="match-chat-empty-mark" aria-hidden>
              <MessageSquare className="h-5 w-5" />
            </span>
            <strong>{t('first_comment')}</strong>
            <p>{t('chat_empty_copy')}</p>
          </div>
        )}
      </div>

      <div className="match-chat-composer">
        {isLoggedIn ? (
          <form onSubmit={handleSubmit} className="match-chat-form-stack">
            <label className="match-chat-accept">
              <input
                type="checkbox"
                checked={acceptedRules}
                onChange={(e) => setAcceptedRules(e.target.checked)}
              />
              <span>{t('chat_accept_rules')}</span>
            </label>
            <div className="match-chat-form">
              <div className="match-chat-input-shell">
                <span className="match-chat-input-avatar" aria-hidden>
                  <UserIcon className="h-3.5 w-3.5" />
                </span>
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value.slice(0, CHAT_MAX_LENGTH))}
                  disabled={submitting}
                  placeholder={t('comment_placeholder')}
                  maxLength={CHAT_MAX_LENGTH}
                  aria-label={t('comment_placeholder')}
                />
                <em className={`match-chat-count${remaining < 40 ? ' is-warn' : ''}`}>{remaining}</em>
              </div>
              <button
                type="submit"
                disabled={submitting || newComment.trim().length < CHAT_MIN_LENGTH || !acceptedRules}
                aria-label={t('chat')}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            {error ? <p className="match-chat-error">{error}</p> : null}
          </form>
        ) : (
          <div className="match-chat-gate">
            <p>{t('chat_sign_in')}</p>
            <Link href="/login" className="match-chat-gate-link">
              {t('chat_sign_in_cta')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
