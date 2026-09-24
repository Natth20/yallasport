'use client';

import { CONTACT_EMAIL } from '@/lib/seo/site';
import { CONTACT_KINDS } from '@/lib/desk/kinds';
import { useLocale, useTranslations } from 'next-intl';
import { FormEvent, useState } from 'react';

const KIND_KEYS = {
  enquiry: 'kind_enquiry',
  privacy: 'kind_privacy',
  rights: 'kind_rights',
  press: 'kind_press',
  other: 'kind_other',
} as const;

export function ContactLetter({ defaultReply = '' }: { defaultReply?: string }) {
  const t = useTranslations('post');
  const locale = useLocale();
  const [kind, setKind] = useState<string>(CONTACT_KINDS[0].id);
  const [url, setUrl] = useState('');
  const [details, setDetails] = useState('');
  const [replyEmail, setReplyEmail] = useState(defaultReply);
  const [company, setCompany] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<null | { emailed: boolean; mail: string; deskId: string }>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/desk/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'contact',
          kind,
          pageUrl: url.trim(),
          details: details.trim(),
          replyEmail: replyEmail.trim(),
          locale: locale === 'en' ? 'en' : 'ar',
          company,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setError(res.status === 429 ? t('err_rate') : t('err_save'));
        return;
      }
      setResult({
        emailed: Boolean(data.emailed),
        mail: String(data.mail || ''),
        deskId: String(data.deskId || ''),
      });
      setDetails('');
    } catch {
      setError(t('err_net'));
    } finally {
      setBusy(false);
    }
  };

  if (result) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card/50 to-card/20 p-6 sm:p-8 backdrop-blur-xl shadow-2xl text-start">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">{t('receipt_kicker')}</p>
            <h3 className="text-lg sm:text-xl font-black text-white">{t('receipt_title')}</h3>
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          {result.emailed
            ? t('receipt_mailed', { mail: CONTACT_EMAIL })
            : result.mail === 'not_configured'
              ? t('receipt_stored')
              : t('receipt_mail_fail')}
        </p>

        {result.deskId && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 p-4">
            <span className="text-xs text-muted-foreground">{t('receipt_ref')}</span>
            <span className="font-mono text-xs font-bold text-primary">{result.deskId}</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => setResult(null)}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/20"
        >
          {locale === 'en' ? 'Send another message' : 'إرسال رسالة أخرى'}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="hidden" aria-hidden="true">
        <input tabIndex={-1} autoComplete="off" value={company} onChange={(event) => setCompany(event.target.value)} />
      </div>

      {/* Topic selection radio pills */}
      <fieldset className="space-y-2.5">
        <legend className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
          {t('stamps_legend')}
        </legend>
        <div className="flex flex-wrap gap-2">
          {CONTACT_KINDS.map((item) => {
            const checked = kind === item.id;
            return (
              <label
                key={item.id}
                className={`relative flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all ${
                  checked
                    ? 'border-primary bg-primary/20 text-white shadow-sm shadow-primary/20'
                    : 'border-white/10 bg-white/[0.03] text-muted-foreground hover:border-white/20 hover:text-white'
                }`}
              >
                <input
                  type="radio"
                  name="kind"
                  value={item.id}
                  checked={checked}
                  onChange={() => setKind(item.id)}
                  className="sr-only"
                />
                <span className={`h-2 w-2 rounded-full ${checked ? 'bg-primary animate-pulse' : 'bg-white/20'}`} />
                <span>{t(KIND_KEYS[item.id as keyof typeof KIND_KEYS])}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* URL & Reply Email */}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-muted-foreground">{t('field_url')}</span>
          <input
            type="text"
            dir="ltr"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://yalla-sport.com/ar/..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-white placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-muted-foreground">{t('field_reply')}</span>
          <input
            type="text"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            dir="ltr"
            value={replyEmail}
            onChange={(event) => setReplyEmail(event.target.value)}
            placeholder="name@example.com"
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-white placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            suppressHydrationWarning
          />
        </label>
      </div>

      {/* Message Body */}
      <label className="block space-y-1.5">
        <span className="text-xs font-semibold text-muted-foreground">{t('field_body')}</span>
        <textarea
          required
          minLength={12}
          maxLength={4000}
          rows={6}
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          placeholder={t('field_body_ph')}
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-3.5 text-xs text-white placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
        />
      </label>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
          {error}
        </div>
      )}

      {/* Submit button & SLA note */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-50"
        >
          {busy ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="4" strokeDasharray="32" strokeDashoffset="12" />
              </svg>
              <span>{t('sending')}</span>
            </>
          ) : (
            <>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              <span>{t('send')}</span>
            </>
          )}
        </button>

        <p className="text-[11px] text-muted-foreground">
          {t('copy_to')} <span className="text-white font-mono">{CONTACT_EMAIL}</span>
        </p>
      </div>
    </form>
  );
}
