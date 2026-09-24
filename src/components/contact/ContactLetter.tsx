'use client';

import { swallow, reportCaughtError } from '@/lib/ops/caught';
import { CONTACT_EMAIL } from '@/lib/seo/site';
import { CONTACT_KINDS } from '@/lib/desk/kinds';
import { useLocale, useTranslations } from 'next-intl';
import { FormEvent, useState } from 'react';
import styles from './contact-house.module.css';
import {
  Send,
  CheckCircle,
  Link as LinkIcon,
  Copy,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Scale,
  Sparkles,
  MessageSquare,
} from 'lucide-react';

const KIND_ICONS: Record<string, any> = {
  enquiry: HelpCircle,
  privacy: ShieldCheck,
  rights: Scale,
  press: Sparkles,
  other: MessageSquare,
};

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
  const isAr = locale === 'ar';
  const [kind, setKind] = useState<string>(CONTACT_KINDS[0].id);
  const [url, setUrl] = useState('');
  const [details, setDetails] = useState('');
  const [replyEmail, setReplyEmail] = useState(defaultReply);
  const [company, setCompany] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<null | { emailed: boolean; mail: string; deskId: string }>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  const fillCurrentUrl = () => {
    if (typeof window !== 'undefined') {
      setUrl(window.location.href);
    }
  };

  const copyDeskId = (id: string) => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(id);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2500);
    }
  };

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

      const data = await res.json().catch(swallow('src/components/contact/ContactLetter.tsx:47', null, { persist: false }));
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
    } catch (err) {
      reportCaughtError('src/components/contact/ContactLetter.tsx:59', err, { persist: false });
      setError(t('err_net'));
    } finally {
      setBusy(false);
    }
  };

  if (result) {
    return (
      <div className={styles.contactReceipt}>
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8" />
        </div>

        <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">{t('receipt_kicker')}</p>
        <h3 className="text-xl sm:text-2xl font-black text-foreground mb-3">{t('receipt_title')}</h3>

        <p className="text-sm text-muted-foreground leading-relaxed max-w-lg mb-6">
          {result.emailed
            ? t('receipt_mailed', { mail: CONTACT_EMAIL })
            : result.mail === 'not_configured'
              ? t('receipt_stored')
              : t('receipt_mail_fail')}
        </p>

        {result.deskId && (
          <div className="flex flex-col items-center gap-2 mb-6">
            <span className="text-xs text-muted-foreground uppercase font-semibold">
              {t('receipt_ref')}
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-primary bg-background/80 px-3.5 py-1.5 rounded-xl border border-border">
                {result.deskId}
              </span>
              <button
                type="button"
                onClick={() => copyDeskId(result.deskId)}
                className="p-2 rounded-xl border border-border bg-card hover:bg-accent text-foreground text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedRef ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ' : 'Copy')}</span>
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setResult(null)}
          className="px-6 py-2.5 rounded-xl font-bold text-xs bg-secondary hover:bg-secondary/80 text-foreground transition-all cursor-pointer border border-border"
        >
          {locale === 'en' ? 'Send another message' : 'إرسال رسالة أخرى'}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Honeypot */}
      <div className="hidden" aria-hidden="true">
        <input tabIndex={-1} autoComplete="off" value={company} onChange={(event) => setCompany(event.target.value)} />
      </div>

      {/* Topic Selection Grid */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
          {t('stamps_legend')}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {CONTACT_KINDS.map((item) => {
            const checked = kind === item.id;
            const Icon = KIND_ICONS[item.id] || MessageSquare;
            return (
              <div
                key={item.id}
                onClick={() => setKind(item.id)}
                className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  checked
                    ? 'border-primary bg-primary/15 text-foreground shadow-sm shadow-primary/20'
                    : 'border-border bg-card/60 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${checked ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold truncate">
                  {t(KIND_KEYS[item.id as keyof typeof KIND_KEYS])}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* URL & Reply Email Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">{t('field_url')}</span>
            <button
              type="button"
              onClick={fillCurrentUrl}
              className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <LinkIcon className="w-3 h-3" />
              <span>{isAr ? 'الصفحة الحالية' : 'Current'}</span>
            </button>
          </div>
          <input
            type="text"
            dir="ltr"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://yalla-sport.com/ar/..."
            className={`${styles.contactInput} font-mono text-xs`}
          />
        </div>

        <div className="space-y-1.5">
          <span className="text-xs font-bold text-foreground block">{t('field_reply')}</span>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            dir="ltr"
            value={replyEmail}
            onChange={(event) => setReplyEmail(event.target.value)}
            placeholder="name@example.com"
            className={`${styles.contactInput} text-xs`}
            suppressHydrationWarning
          />
        </div>
      </div>

      {/* Message Body */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-foreground">{t('field_body')}</span>
          <span className="text-[11px] text-muted-foreground">
            {details.length} / 4000 {isAr ? 'حرف' : 'chars'}
          </span>
        </div>
        <textarea
          required
          minLength={12}
          maxLength={4000}
          rows={6}
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          placeholder={t('field_body_ph')}
          className={`${styles.contactInput} text-xs leading-relaxed resize-y`}
        />
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Submit Button & SLA note */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <button
          type="submit"
          disabled={busy || details.trim().length < 12}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
        >
          {busy ? (
            <span>{t('sending')}</span>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>{t('send')}</span>
            </>
          )}
        </button>

        <p className="text-[11px] text-muted-foreground">
          {t('copy_to')} <span className="text-foreground font-mono font-semibold">{CONTACT_EMAIL}</span>
        </p>
      </div>
    </form>
  );
}
