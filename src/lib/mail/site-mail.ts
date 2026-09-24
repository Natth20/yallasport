import { swallow, reportCaughtError } from '@/lib/ops/caught';
import { CONTACT_EMAIL, siteInboxEmail } from '@/lib/seo/site';

export type MailSendResult =
  | { sent: true }
  | { sent: false; reason: string };

function fromAddress() {
  return process.env.MAIL_FROM?.trim() || `Yalla Sport <${CONTACT_EMAIL}>`;
}

async function sendWithResend(opts: {
  from: string;
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
  apiKey: string;
}): Promise<{ ok: boolean; detail?: string }> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: opts.from,
      to: [opts.to],
      subject: opts.subject,
      text: opts.text,
      ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
    }),
  });
  if (res.ok) return { ok: true };
  const body = await res.json().catch(swallow("src/lib/mail/site-mail.ts:34", null, { persist: false })) as { name?: string; message?: string } | null;
  const name = body?.name || 'resend';
  return { ok: false, detail: `${name}:${res.status}` };
}

async function sendWithSendgrid(opts: {
  from: string;
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
  apiKey: string;
}): Promise<boolean> {
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: opts.to }] }],
      from: { email: opts.from.includes('<') ? opts.from.replace(/^.*<([^>]+)>$/, '$1') : opts.from },
      ...(opts.replyTo ? { reply_to: { email: opts.replyTo } } : {}),
      subject: opts.subject,
      content: [{ type: 'text/plain', value: opts.text }],
    }),
  });
  return res.status === 202 || res.ok;
}

export async function sendSiteMail(opts: {
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<MailSendResult> {
  const to = siteInboxEmail();
  const from = fromAddress();
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const sendgridKey = process.env.SENDGRID_API_KEY?.trim();

  if (!resendKey && !sendgridKey) {
    return { sent: false, reason: 'not_configured' };
  }

  try {
    if (resendKey) {
      const result = await sendWithResend({ ...opts, from, to, apiKey: resendKey });
      return result.ok ? { sent: true } : { sent: false, reason: result.detail || 'failed' };
    }
    const ok = await sendWithSendgrid({ ...opts, from, to, apiKey: sendgridKey! });
    return ok ? { sent: true } : { sent: false, reason: 'failed' };
  } catch (error) {
    reportCaughtError('mail.send', error);
    return { sent: false, reason: 'failed' };
  }
}
