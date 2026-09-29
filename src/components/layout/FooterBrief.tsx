'use client';

import { FormEvent, useState } from 'react';
import { pick } from '@/i18n/pick';
import styles from './footer.module.css';

export function FooterBrief({ locale }: { locale: string }) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      const res = await fetch('/api/desk/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'contact',
          kind: 'enquiry',
          replyEmail: email.trim(),
          details: pick(
            locale,
            'طلب الاشتراك في النشرة اليومية على هذا البريد.',
            'Please add this address to the daily briefing list.',
          ),
          locale,
          company: '',
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setError(
          res.status === 429
            ? pick(locale, 'انتظر دقيقة ثم أعد المحاولة.', 'Wait a minute, then try again.')
            : pick(locale, 'تعذر حفظ الطلب. تأكد من البريد.', 'Could not save the request. Check the email.'),
        );
        return;
      }
      setDone(String(data.deskId || 'ok'));
      setEmail('');
    } catch {
      setError(pick(locale, 'تعذر الاتصال بالمكتب.', 'Could not reach the desk.'));
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <p className={styles.inviteOk}>
        {pick(locale, `اتسجل الطلب في المكتب${done !== 'ok' ? ` · ${done}` : ''}.`, `Logged at the desk${done !== 'ok' ? ` · ${done}` : ''}.`)}
      </p>
    );
  }

  return (
    <form className={styles.inviteForm} onSubmit={submit}>
      <input
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder={pick(locale, 'بريدك…', 'Your email…')}
        className={styles.inviteInput}
        autoComplete="email"
        suppressHydrationWarning
      />
      <button type="submit" className={styles.inviteBtn} disabled={busy}>
        {busy ? pick(locale, 'جارٍ الحفظ…', 'Saving…') : pick(locale, 'أضفني', 'Add me')}
      </button>
      {error ? <em className={styles.inviteErr}>{error}</em> : null}
    </form>
  );
}
