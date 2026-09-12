'use client';

import { FormEvent, useState } from 'react';
import { CONTACT_EMAIL } from '@/lib/seo/site';
import { pick } from '@/i18n/pick';
import { kindsFor, type DeskChannelId } from '@/lib/desk/kinds';

export function DeskComposer({ locale, channel }: { locale: string; channel: DeskChannelId }) {
  const kinds = kindsFor(channel);
  const [type, setType] = useState<string>(kinds[0].id);
  const [url, setUrl] = useState('');
  const [details, setDetails] = useState('');
  const [replyEmail, setReplyEmail] = useState('');
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
          channel,
          kind: type,
          pageUrl: url.trim(),
          details: details.trim(),
          replyEmail: replyEmail.trim(),
          locale,
          company,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setError(
          res.status === 429
            ? pick(locale, 'محاولات كثيرة. انتظر دقيقة ثم أعد المحاولة.', 'Too many attempts. Wait a minute and try again.')
            : pick(locale, 'تعذر حفظ الرسالة. راجع الحقول وأعد المحاولة.', 'Could not save the message. Check the fields and try again.')
        );
        return;
      }
      setResult({ emailed: Boolean(data.emailed), mail: String(data.mail || ''), deskId: String(data.deskId || '') });
      setDetails('');
    } catch {
      setError(pick(locale, 'تعذر الاتصال بالخادم.', 'Could not reach the server.'));
    } finally {
      setBusy(false);
    }
  };

  if (result) {
    return (
      <div className="legal-report-card space-y-4">
        <p className="text-[15px] font-black text-foreground dark:text-foreground">
          {pick(locale, 'وصلت إلى مكتب يلا سبورت.', 'It reached the Yalla Sport desk.')}
        </p>
        <p className="text-[13px] leading-7 text-muted-foreground">
          {result.emailed
            ? pick(
                locale,
                `حُفظت في صندوق لوحة التحكم، وأُرسلت نسخة إلى ${CONTACT_EMAIL}.`,
                `It is stored in the dashboard inbox, and a copy was sent to ${CONTACT_EMAIL}.`
              )
            : result.mail === 'not_configured'
              ? pick(
                  locale,
                  'حُفظت في صندوق لوحة التحكم. نسخة البريد لم تُرسل بعد لأن خدمة البريد غير مفعّلة على الخادم.',
                  'It is stored in the dashboard inbox. A mail copy was not sent because site mail is not configured yet.'
                )
              : pick(
                  locale,
                  'حُفظت في صندوق لوحة التحكم. نسخة البريد لم تُرسل بسبب خلل في خدمة البريد.',
                  'It is stored in the dashboard inbox. The mail copy failed at the mail service.'
                )}
        </p>
        {result.deskId ? (
          <p className="font-mono text-[11px] text-muted-foreground">
            {pick(locale, 'مرجع المكتب:', 'Desk ref:')} {result.deskId}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="legal-report-card space-y-5">
      <p className="text-[13px] leading-7 text-muted-foreground dark:text-foreground/50">
        {pick(
          locale,
          `الرسالة تُحفظ في صندوق المكتب بلوحة التحكم، وتُرسل نسخة إلى ${CONTACT_EMAIL} إن كانت خدمة البريد مفعّلة.`,
          `The message is stored in the dashboard desk inbox, and a copy is sent to ${CONTACT_EMAIL} when mail is configured.`
        )}
      </p>

      <div className="hidden" aria-hidden="true">
        <input tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} />
      </div>

      <label className="block">
        <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.2em] text-orange-600">
          {pick(locale, channel === 'contact' ? 'الموضوع' : 'نوع البلاغ', channel === 'contact' ? 'Subject' : 'Report type')}
        </span>
        <select value={type} onChange={(event) => setType(event.target.value)} className="legal-field">
          {kinds.map((item) => (
            <option key={item.id} value={item.id}>
              {pick(locale, item.ar, item.en)}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.2em] text-orange-600">
          {pick(locale, 'رابط الصفحة (اختياري)', 'Page URL (optional)')}
        </span>
        <input
          type="text"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://yalla-sport.com/ar/..."
          className="legal-field"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.2em] text-orange-600">
          {pick(locale, 'بريد للرد (اختياري)', 'Reply email (optional)')}
        </span>
        <input
          type="text"
          inputMode="email"
          autoComplete="email"
          spellCheck={false}
          value={replyEmail}
          onChange={(event) => setReplyEmail(event.target.value)}
          className="legal-field"
          suppressHydrationWarning
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.2em] text-orange-600">
          {pick(locale, 'الواقعة', 'What happened')}
        </span>
        <textarea
          required
          minLength={12}
          maxLength={4000}
          rows={6}
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          placeholder={pick(
            locale,
            'اكتب التفاصيل بوضوح. بلاغ بلا وصف كافٍ قد يُهمل.',
            'Write clearly. A notice without enough detail may be set aside.'
          )}
          className="legal-field min-h-36"
        />
      </label>

      {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}

      <button type="submit" disabled={busy} className="legal-send">
        {busy
          ? pick(locale, 'جارٍ الإرسال…', 'Sending…')
          : pick(locale, 'إرسال إلى المكتب', 'Send to the desk')}
      </button>
      <p className="text-[12px] leading-6 text-muted-foreground">
        {pick(locale, 'نسخة البريد:', 'Mail copy:')} {CONTACT_EMAIL}
      </p>
    </form>
  );
}
