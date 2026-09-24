import { Link } from '@/i18n/navigation';
import { pick } from '@/i18n/pick';
import { CONTACT_EMAIL } from '@/lib/seo/site';
import { DeskComposer } from './DeskComposer';
import {
  LexArticle,
  LexAsideCard,
  LexCards,
  LexChamber,
  LexNote,
  LexPoints,
} from './LexChamber';

export function ReportDesk({ locale }: { locale: string }) {
  const date = pick(locale, '11 سبتمبر 2026', '11 September 2026');

  const rail = [
    { id: 'when', label: pick(locale, 'متى تبلّغ', 'When to report') },
    { id: 'need', label: pick(locale, 'ماذا نحتاج', 'What we need') },
    { id: 'send', label: pick(locale, 'الإرسال', 'Send') },
    { id: 'after', label: pick(locale, 'بعد الإرسال', 'After you send') },
  ];

  const cases = [
    {
      title: pick(locale, 'رقم لا يطابق المصدر', 'A figure off the source'),
      body: pick(
        locale,
        'نتيجة أو دقيقة أو جدول يختلف عما في المصدر الرياضي.',
        'A score, minute or table that differs from the sports source.'
      ),
    },
    {
      title: pick(locale, 'خبر بلا اعتماد', 'An unapproved story'),
      body: pick(
        locale,
        'خبر منشور يبدو بلا مصدر أو يخلط رأياً بخبر معتمد.',
        'A published story that looks unsourced or mixes opinion with approved news.'
      ),
    },
    {
      title: pick(locale, 'علامة ليست لنا', 'A mark not ours'),
      body: pick(
        locale,
        'شعار أو مقطع أو نص تظن أنه يُعرض بلا حق.',
        'A crest, clip or text you believe is shown without right.'
      ),
    },
    {
      title: pick(locale, 'إساءة أو بث بلا ترخيص', 'Abuse or an unlicensed stream'),
      body: pick(
        locale,
        'تعليق مسيء، أو بث يظهر رغم أن الترخيص غير قائم.',
        'An abusive comment, or a stream showing when no licence stands.'
      ),
    },
  ];

  const needs = [
    pick(locale, 'رابط الصفحة التي رأيت فيها المشكلة.', 'The URL of the page where you saw it.'),
    pick(locale, 'الوقت التقريبي الذي ظهرت فيه.', 'The approximate time it appeared.'),
    pick(locale, 'ما يظهر عندك على الشاشة.', 'What your screen shows.'),
    pick(locale, 'ما يقوله المصدر إن كان بين يديك.', 'What the source says, if you have it.'),
  ];

  return (
    <LexChamber
      locale={locale}
      path="/report"
      tone="desk"
      code="YS-L04"
      instrument={pick(locale, 'خط المكتب', 'The desk line')}
      title={pick(locale, 'إبلاغ عن محتوى', 'Report content')}
      wordmark={pick(locale, 'إبلاغ عن محتوى', 'Report content')}
      eyebrow={pick(locale, 'صندوق واحد · بلا وسطاء', 'One inbox · no middlemen')}
      lead={pick(
        locale,
        'إن رأيت رقماً لا يطابق المصدر، أو خبراً بلا اعتماد، أو علامة ليست لنا، اكتب للمكتب. الإرسال يحفظ الرسالة في لوحة التحكم ويرسل نسخة إلى بريد الموقع إن كانت خدمة البريد مفعّلة.',
        'If a figure does not match the source, a story is unapproved, or a mark is not ours, write to the desk. Submit stores it in the dashboard and copies the site email when mail is configured.'
      )}
      date={date}
      seals={[
        pick(locale, 'صندوق اللوحة', 'Dashboard inbox'),
        pick(locale, 'نسخة للبريد', 'Mail copy'),
        pick(locale, 'المصدر أولاً', 'Source first'),
        pick(locale, 'مرجع حقيقي لا تذكرة وهمية', 'A real reference, not a fake ticket'),
      ]}
      rail={rail}
      aside={
        <LexAsideCard title={pick(locale, 'قنوات أخرى', 'Other channels')}>
          <p>
            {pick(
              locale,
              'للمراسلة العامة استخدم صفحة التواصل. لبلاغ حقوق النشر راجع الصك الثالث.',
              'For general mail use the contact page. For a rights notice see the third instrument.'
            )}
          </p>
          <p className="mt-2">
            <Link href="/contact">{pick(locale, 'صفحة التواصل', 'Contact page')}</Link>
            {' · '}
            <Link href="/copyright">{pick(locale, 'حقوق النشر', 'Copyright')}</Link>
          </p>
          <p className="mt-2">
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
        </LexAsideCard>
      }
    >
      {/* The VAR Incident Room Protocol Bento */}
      <div className="mb-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/10 via-card/40 to-card/20 p-5 backdrop-blur-md transition hover:border-rose-500/40">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect width="14" height="14" x="1" y="5" rx="2" ry="2" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {pick(locale, 'غرفة تدقيق الـ VAR اللحظية', 'VAR Live Review Desk')}
              </h3>
              <p className="text-[11px] text-rose-400 font-mono">INSTANT VERIFICATION</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {pick(
              locale,
              'عند الإبلاغ عن خطأ في نتيجة، دقيقة، أو حدث تحكيمي، يتولى فريق الرصد مطابقة البث ومصادر التغذية فوراً.',
              'Discrepancies in live scores, event minutes, or player cards trigger immediate comparison against raw provider feeds.'
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-card/40 to-card/20 p-5 backdrop-blur-md transition hover:border-emerald-500/40">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {pick(locale, 'زمن استجابة عاجل للبث الحي', 'High Priority Live SLA')}
              </h3>
              <p className="text-[11px] text-emerald-400 font-mono">&lt; 15 MINS IN LIVE MATCHES</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {pick(
              locale,
              'البلاغات المتعلقة بالمباريات الجارية الآن تمنح الأولوية القصوى وتُعرض مباشرة في شاشة مراقبي العمليات.',
              'Reports tagged to active live fixtures bypass normal triage and appear immediately on active duty operator dashboards.'
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-card/40 to-card/20 p-5 backdrop-blur-md transition hover:border-cyan-500/40">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {pick(locale, 'رقم تتبع موثق لكل بلاغ', 'Unique Incident Tracking')}
              </h3>
              <p className="text-[11px] text-cyan-400 font-mono">AUTOMATED LOG RECORD</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {pick(
              locale,
              'يتم تسجيل كل رسالة برقم تذكرة فريد في قاعدة البيانات وإرسال إشعار مباشر لبريد المتابعة الداخلي.',
              'Each incident logs directly to our Postgres operations table, yielding a trackable ticket ID for follow-up.'
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card/40 to-card/20 p-5 backdrop-blur-md transition hover:border-primary/40">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/30">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {pick(locale, 'حماية المبلغين والسرية', 'Reporter Confidentiality')}
              </h3>
              <p className="text-[11px] text-primary font-mono">100% PRIVATE INTAKE</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {pick(
              locale,
              'بياناتك وبريدك الإلكتروني تظل سرية بالكامل ومحمية ولا تتم مشاركتها مع أي طرف خارجي على الإطلاق.',
              'Your contact information and submission details remain strictly confidential and internal to Yalla Sport.'
            )}
          </p>
        </div>
      </div>

      <LexArticle id="when" index="01" title={pick(locale, 'متى تبلّغ', 'When to report')} kicker={pick(locale, 'الحالات', 'The cases')}>
        <LexCards rows={cases} />
      </LexArticle>

      <LexArticle id="need" index="02" title={pick(locale, 'ماذا نحتاج', 'What we need')} kicker={pick(locale, 'عناصر البلاغ', 'Notice parts')}>
        <LexPoints items={needs} ordered />
        <LexNote label={pick(locale, 'بصراحة', 'Plainly')}>
          {pick(
            locale,
            'كلّما كان البلاغ محدداً، كان الردّ أسرع. بلاغ بلا رابط قد يُهمل.',
            'The more specific the notice, the faster the reply. A notice without a link may be set aside.'
          )}
        </LexNote>
      </LexArticle>

      <LexArticle id="send" index="03" title={pick(locale, 'الإرسال', 'Send')} kicker={pick(locale, 'النموذج', 'The form')}>
        <DeskComposer locale={locale} channel="report" />
      </LexArticle>

      <LexArticle id="after" index="04" title={pick(locale, 'بعد الإرسال', 'After you send')} kicker={pick(locale, 'ما يحدث', 'What happens')}>
        <p>
          {pick(
            locale,
            'الرسائل الجدية تظهر في صندوق المكتب بلوحة التحكم، ونسخة إلى contact@yallasport.com عندما تكون خدمة البريد مفعّلة. مرجع المكتب الذي يظهر بعد الإرسال هو رقم السجل الحقيقي، لا تذكرة وهمية بمهلة ساعة. إن لزم تصحيح رقم رياضي ننتظر المصدر.',
            'Genuine notices appear in the dashboard desk inbox, with a copy to contact@yallasport.com when mail is configured. The desk reference after submit is the real record id, not a fake one-hour ticket. If a sports figure must change, we wait for the source.'
          )}
        </p>
      </LexArticle>
    </LexChamber>
  );
}
