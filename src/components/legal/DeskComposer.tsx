'use client';

import { swallow, reportCaughtError } from '@/lib/ops/caught';
import { FormEvent, useState } from 'react';
import { CONTACT_EMAIL } from '@/lib/seo/site';
import { pick } from '@/i18n/pick';
import { kindsFor, type DeskChannelId } from '@/lib/desk/kinds';
import {
  Send,
  CheckCircle,
  AlertCircle,
  Link as LinkIcon,
  Mail,
  FileText,
  Copy,
  Sparkles,
  ShieldCheck,
  Trophy,
  AlertTriangle,
  Radio,
  Flame,
  Bug,
  HelpCircle,
} from 'lucide-react';

const KIND_ICONS: Record<string, any> = {
  data: Trophy,
  news: FileText,
  rights: ShieldCheck,
  abuse: Flame,
  stream: Radio,
  privacy: ShieldCheck,
  tech: Bug,
  enquiry: HelpCircle,
  press: Sparkles,
  other: AlertTriangle,
};

export function DeskComposer({ locale, channel }: { locale: string; channel: DeskChannelId }) {
  const isAr = locale === 'ar';
  const kinds = kindsFor(channel);
  const [type, setType] = useState<string>(kinds[0].id);
  const [url, setUrl] = useState('');
  const [details, setDetails] = useState('');
  const [replyEmail, setReplyEmail] = useState('');
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
          channel,
          kind: type,
          pageUrl: url.trim(),
          details: details.trim(),
          replyEmail: replyEmail.trim(),
          locale,
          company,
        }),
      });

      const data = await res.json().catch(swallow('src/components/legal/DeskComposer.tsx:38', null, { persist: false }));
      if (!res.ok || !data?.ok) {
        setError(
          res.status === 429
            ? pick(locale, 'تجاوزت عدد المحاولات المسموح. يرجى الانتظار دقيقة ثم إعادة المحاولة.', 'Too many attempts. Please wait a minute and try again.')
            : pick(locale, 'تعذر إرسال البلاغ. يرجى التأكد من كتابة التفاصيل بوضوح (12 حرفاً على الأقل).', 'Could not send report. Please ensure details contain at least 12 characters.')
        );
        return;
      }

      setResult({ emailed: Boolean(data.emailed), mail: String(data.mail || ''), deskId: String(data.deskId || '') });
      setDetails('');
    } catch (err) {
      reportCaughtError('src/components/legal/DeskComposer.tsx:50', err, { persist: false });
      setError(pick(locale, 'تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.', 'Could not reach server. Please check your network.'));
    } finally {
      setBusy(false);
    }
  };

  if (result) {
    return (
      <div className="lex-receipt-box">
        <div className="lex-receipt-success-icon">
          <CheckCircle className="w-8 h-8" />
        </div>

        <h3 className="lex-receipt-title">
          {pick(locale, 'تم استلام بلاغك بنجاح!', 'Report Received Successfully!')}
        </h3>

        <p className="lex-receipt-desc">
          {result.emailed
            ? pick(
                locale,
                `تم حفظ البلاغ في لوحة تحكم العمليات وأُرسلت نسخة فورية إلى فريق الدعم (${CONTACT_EMAIL}). سيتم التعامل مع البلاغ بأولوية قصوى.`,
                `Your report is logged in our operations desk and dispatched to our review team (${CONTACT_EMAIL}). We will audit this promptly.`
              )
            : pick(
                locale,
                'تم حفظ البلاغ في نظام لوحة التحكم وسيتم مراجعته والتحقق منه من قبل فريق التحرير والعمليات.',
                'Your report is logged directly in our operations desk and queued for priority editorial review.'
              )}
        </p>

        {result.deskId && (
          <div className="flex flex-col items-center gap-2 mb-6">
            <span className="text-xs text-muted-foreground uppercase font-semibold">
              {pick(locale, 'رقم التتبع المرجعي', 'Tracking Reference Number')}
            </span>
            <div className="flex items-center gap-2">
              <span className="lex-receipt-tag">{result.deskId}</span>
              <button
                type="button"
                onClick={() => copyDeskId(result.deskId)}
                className="p-2 rounded-lg border border-border bg-card hover:bg-accent text-foreground text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title={pick(locale, 'نسخ الرقم', 'Copy reference')}
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
          className="px-6 py-2.5 rounded-xl font-bold text-sm bg-secondary hover:bg-secondary/80 text-foreground transition-all cursor-pointer border border-border"
        >
          {pick(locale, 'إرسال بلاغ آخر', 'Submit Another Report')}
        </button>
      </div>
    );
  }

  return (
    <div className="lex-desk-card">
      <form onSubmit={handleSubmit}>
        {/* Anti-spam Honeypot */}
        <div className="hidden" aria-hidden="true">
          <input tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} />
        </div>

        {/* Visual Kind Selector */}
        <div className="mb-6">
          <label className="lex-input-label mb-2.5">
            <span>{pick(locale, 'اختر نوع البلاغ أو المشكلة', 'Select Issue Category')}</span>
            <span className="lex-input-label-hint">{pick(locale, 'محدد مرئي فوري', 'Quick Selector')}</span>
          </label>

          <div className="lex-kinds-grid">
            {kinds.map((item) => {
              const selected = type === item.id;
              const Icon = KIND_ICONS[item.id] || AlertTriangle;
              return (
                <div
                  key={item.id}
                  onClick={() => setType(item.id)}
                  className="lex-kind-card"
                  data-selected={selected ? 'true' : 'false'}
                >
                  <div className="lex-kind-icon">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="lex-kind-label">{pick(locale, item.ar, item.en)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Fields Grid */}
        <div className="lex-form-grid">
          {/* URL Input */}
          <div className="lex-input-group">
            <div className="lex-input-label">
              <span>{pick(locale, 'رابط الصفحة المعنية (اختياري)', 'Target Page URL (optional)')}</span>
              <button
                type="button"
                onClick={fillCurrentUrl}
                className="text-[11px] font-bold text-[var(--lex-accent)] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <LinkIcon className="w-3 h-3" />
                <span>{pick(locale, 'الصفحة الحالية', 'Current Page')}</span>
              </button>
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://yalla-sport.com/ar/match/..."
              className="lex-text-input font-mono text-xs"
            />
          </div>

          {/* Email Input */}
          <div className="lex-input-group">
            <div className="lex-input-label">
              <span>{pick(locale, 'بريدك للرد والمتابعة (اختياري)', 'Reply Email (optional)')}</span>
              <span className="lex-input-label-hint">{pick(locale, 'لتلقي النتيجة', 'For updates')}</span>
            </div>
            <input
              type="email"
              value={replyEmail}
              onChange={(e) => setReplyEmail(e.target.value)}
              placeholder="your-email@example.com"
              className="lex-text-input"
              spellCheck={false}
              suppressHydrationWarning
            />
          </div>

          {/* Details Area */}
          <div className="lex-input-group lex-form-full">
            <div className="lex-input-label">
              <span>{pick(locale, 'تفاصيل البلاغ والواقعة بالتحديد', 'Detailed Report & What Happened')}</span>
              <span className="lex-input-label-hint">
                {details.length} / 4000 {pick(locale, 'حرف', 'chars')}
              </span>
            </div>
            <textarea
              required
              minLength={12}
              maxLength={4000}
              rows={5}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={pick(
                locale,
                'اشرح المشكلة بوضوح: مثل خطأ في نتيجة مباراة، دقيقة هدف غير دقيقة، أو رابط غير مصرح به...',
                'Describe the exact issue: e.g. score discrepancy, wrong goal minute, unsourced news story, or copyright claim...'
              )}
              className="lex-text-input lex-textarea"
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            {pick(
              locale,
              `يتم فحص كافة البلاغات بواسطة فريق عمليات يلا سبورت ونلتزم بالسرعة والإنصاف.`,
              `All reports are audited by the Yalla Sport operations desk with rigorous speed and equity.`
            )}
          </p>

          <button
            type="submit"
            disabled={busy || details.trim().length < 12}
            className="lex-submit-btn sm:w-auto"
          >
            <Send className="w-4 h-4" />
            <span>{busy ? pick(locale, 'جارٍ الإرسال الفوري...', 'Dispatching...') : pick(locale, 'إرسال البلاغ الآن', 'Submit Report Now')}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
