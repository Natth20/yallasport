'use client';

import { CONTACT_EMAIL } from '@/lib/seo/site';
import { CONTACT_KINDS } from '@/lib/desk/kinds';
import { TicketBarcode } from '@/components/decor/CraftMarks';
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
      <div className="contact-receipt">
        <p className="contact-receipt-kicker">{t('receipt_kicker')}</p>
        <h3>{t('receipt_title')}</h3>
        <p>
          {result.emailed
            ? t('receipt_mailed', { mail: CONTACT_EMAIL })
            : result.mail === 'not_configured'
              ? t('receipt_stored')
              : t('receipt_mail_fail')}
        </p>
        {result.deskId ? (
          <p className="contact-receipt-id">
            {t('receipt_ref')} {result.deskId}
          </p>
        ) : null}
        <TicketBarcode className="mt-4 text-[#c26a3a]" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="contact-form">
      <div className="hidden" aria-hidden="true">
        <input tabIndex={-1} autoComplete="off" value={company} onChange={(event) => setCompany(event.target.value)} />
      </div>

      <fieldset className="contact-kinds">
        <legend>{t('stamps_legend')}</legend>
        <div className="contact-kind-row">
          {CONTACT_KINDS.map((item) => (
            <label key={item.id} className={kind === item.id ? 'is-on' : ''}>
              <input
                type="radio"
                name="kind"
                value={item.id}
                checked={kind === item.id}
                onChange={() => setKind(item.id)}
              />
              <span>{t(KIND_KEYS[item.id as keyof typeof KIND_KEYS])}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="contact-fields">
        <label className="contact-field">
          <span>{t('field_url')}</span>
          <input
            type="text"
            dir="ltr"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://yalla-sport.com/ar/..."
          />
        </label>

        <label className="contact-field">
          <span>{t('field_reply')}</span>
          <input
            type="text"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            dir="ltr"
            value={replyEmail}
            onChange={(event) => setReplyEmail(event.target.value)}
            suppressHydrationWarning
          />
        </label>
      </div>

      <label className="contact-field is-body">
        <span>{t('field_body')}</span>
        <textarea
          required
          minLength={12}
          maxLength={4000}
          rows={8}
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          placeholder={t('field_body_ph')}
        />
      </label>

      {error ? <p className="contact-err">{error}</p> : null}

      <div className="contact-send-row">
        <button type="submit" disabled={busy} className="contact-send">
          {busy ? t('sending') : t('send')}
        </button>
        <p>
          {t('copy_to')} {CONTACT_EMAIL}
        </p>
      </div>
    </form>
  );
}
