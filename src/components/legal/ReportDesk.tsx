'use client';

import { pick } from '@/i18n/pick';
import { CONTACT_EMAIL } from '@/lib/seo/site';
import { DeskComposer } from './DeskComposer';
import {
  LexChamber,
  LexSection,
  LexHighlightsGrid,
  LexHighlightCard,
  LexCheckList,
  LexCallout,
} from './LexChamber';
import {
  AlertTriangle,
  Clock,
  ShieldCheck,
  Zap,
  Mail,
  Trophy,
  FileText,
  Radio,
  Flame,
  Bug,
  HelpCircle,
} from 'lucide-react';

export function ReportDesk({ locale }: { locale: string }) {
  const isAr = locale === 'ar';
  const date = pick(locale, '23 سبتمبر 2026', '23 September 2026');

  const rail = [
    { id: 'when-to-report', label: pick(locale, 'متى تبلّغ وفئات المشاكل', 'When to Report') },
    { id: 'submit-form', label: pick(locale, 'نموذج الإرسال الفوري', 'Instant Submission Form') },
    { id: 'workflow', label: pick(locale, 'مسار المعالجة وسرعة الرد', 'Processing Workflow & SLA') },
    { id: 'channels', label: pick(locale, 'القنوات المباشرة البديلة', 'Alternative Channels') },
  ];

  return (
    <LexChamber
      locale={locale}
      path="/report"
      tone="desk"
      code="YS-DESK-01"
      instrument={pick(locale, 'مركز البلاغات والدعم المباشر', 'Dispute & Report Center')}
      title={pick(locale, 'إبلاغ عن محتوى أو مشكلة', 'Report an Issue')}
      wordmark={pick(locale, 'مركز الإبلاغ والدعم الذكي', 'Report & Dispute Center')}
      eyebrow={pick(locale, 'صندوق عمليات مباشر · مراجعة بشرية سريعة', 'Direct Operations Hub · Prompt Human Review')}
      lead={pick(
        locale,
        'هل لاحظت نتيجة غير دقيقة، خبراً بلا مصدر، تعليقاً مسيئاً، أو مشكلة في حقوق النشر؟ استخدم هذا النموذج الذكي لإيصال بلاغك مباشرة إلى لوحة تحكم العمليات للتدخل والتحقق الفوري.',
        'Spotted a score discrepancy, unsourced headline, abusive comment, or copyright concern? Use this streamlined operations form to dispatch your notice directly to our live desk for immediate review.'
      )}
      date={date}
      seals={[
        pick(locale, 'ربط مباشر بلوحة التحكم', 'Direct Dashboard Dispatch'),
        pick(locale, 'مراجعة بشرية لكافة البلاغات', '100% Human Audited'),
        pick(locale, 'رقم تتبع لكل بلاغ', 'Unique Ticket Reference'),
      ]}
      rail={rail}
    >
      {/* ——— Executive Highlights ——— */}
      <LexHighlightsGrid>
        <LexHighlightCard
          icon={Zap}
          badge={pick(locale, 'استجابة سريعة', 'High Priority')}
          title={pick(locale, 'معالجة مباشرة دون وسطاء', 'Direct Desk Pipeline')}
          body={pick(
            locale,
            'رسالتك تصل فوراً إلى غرفة عمليات التحرير والمطورين لاتخاذ الإجراء المناسب.',
            'Your report is piped instantly into our operations dashboard for rapid editorial and technical remediation.'
          )}
        />

        <LexHighlightCard
          icon={Trophy}
          badge={pick(locale, 'دقة النتائج', 'Data Integrity')}
          title={pick(locale, 'تصحيح النتائج الرياضية', 'Score Correction SLA')}
          body={pick(
            locale,
            'يتم فحص أخطاء النتائج والتوقيتات وتصحيحها فوراً بمطابقتها مع التغذية الرسمية المعتمدة.',
            'Discrepancies in live scores or match minute timers are reconciled immediately against official feeds.'
          )}
        />

        <LexHighlightCard
          icon={ShieldCheck}
          badge={pick(locale, 'حماية الحقوق', 'Fast Takedown')}
          title={pick(locale, 'مسار عاجل لحقوق الملكية', 'Urgent DMCA Track')}
          body={pick(
            locale,
            'تُمنح بلاغات حقوق النشر والعلامات التجارية أولوية قصوى للحذف خلال 24-48 ساعة.',
            'Intellectual property and copyright notices are prioritized for review and takedown within 24-48 hours.'
          )}
        />

        <LexHighlightCard
          icon={Clock}
          badge={pick(locale, 'شفافية وتتبع', 'Tracking Ref')}
          title={pick(locale, 'رقم مرجعي لكل بلاغ', 'Unique Case ID')}
          body={pick(
            locale,
            'تحصل على رقم مرجعي رسمي فور الإرسال لتمكينك من متابعة حالة البلاغ عند الحاجة.',
            'A cryptographic tracking code is generated on submission to monitor resolution progress.'
          )}
        />
      </LexHighlightsGrid>

      {/* ——— Article 1: When to Report ——— */}
      <LexSection
        id="when-to-report"
        index="01"
        kicker={pick(locale, 'دليل الفئات', 'Category Guide')}
        title={pick(locale, 'متى تبلّغ وما هي الحالات التي نراجعها؟', 'When to Submit a Report & Covered Categories')}
      >
        <p>
          {pick(
            locale,
            'نرحب بملاحظات وبلاغات المشجعين والمستخدمين لمساعدتنا في الحفاظ على أعلى معايير الجودة والدقة الرياضية:',
            'We value community vigilance to ensure Yalla Sport remains the most authentic and enjoyable sports destination:'
          )}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-4">
          <div className="p-3.5 rounded-xl border border-border bg-card/60 flex items-start gap-3">
            <Trophy className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-foreground">{pick(locale, 'خطأ في نتيجة أو جدول', 'Score or Table Discrepancy')}</h4>
              <p className="text-xs text-muted-foreground mt-1">
                {pick(locale, 'نتيجة غير صحيحة، هداف مفقود، أو بطاقة غير مسجلة.', 'Incorrect scoreline, missing goalscorer, or unrecorded red card.')}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-card/60 flex items-start gap-3">
            <FileText className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-foreground">{pick(locale, 'خبر غير دقيق أو بلا مصدر', 'Inaccurate or Unsourced News')}</h4>
              <p className="text-xs text-muted-foreground mt-1">
                {pick(locale, 'خبر رياضي يحتوي على معلومات مضللة أو يفتقر لمصدر معتمد.', 'Misleading transfer rumour or news story lacking official source attribution.')}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-card/60 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-foreground">{pick(locale, 'حقوق نشر أو علامة تجارية', 'Copyright or Trademark Claim')}</h4>
              <p className="text-xs text-muted-foreground mt-1">
                {pick(locale, 'مادة مصورة أو محتوى ينتهك حقوق ملكيتك الفكرية.', 'Visual asset, clip, or text infringing on your proprietary rights.')}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-card/60 flex items-start gap-3">
            <Flame className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-foreground">{pick(locale, 'تعليق مسيء أو تحريض', 'Abusive Comment or Hate Speech')}</h4>
              <p className="text-xs text-muted-foreground mt-1">
                {pick(locale, 'تعليق ينتهك ميثاق الاحترام أو يحتوي على سباب أو عنصرية.', 'Chat message violating civility guidelines or containing toxic hostility.')}
              </p>
            </div>
          </div>
        </div>
      </LexSection>

      {/* ——— Article 2: Submission Form ——— */}
      <LexSection
        id="submit-form"
        index="02"
        kicker={pick(locale, 'النموذج الذكي', 'Direct Desk Form')}
        title={pick(locale, 'نموذج تقديم البلاغ المباشر', 'Direct Operations Desk Submission Form')}
      >
        <p className="mb-4">
          {pick(
            locale,
            'يرجى ملء الحقول أدناه بأكبر قدر ممكن من الوضوح لنتمكن من التدخل السريع:',
            'Please fill out the fields below with concise detail to enable swift investigation:'
          )}
        </p>

        <DeskComposer locale={locale} channel="report" />
      </LexSection>

      {/* ——— Article 3: Workflow ——— */}
      <LexSection
        id="workflow"
        index="03"
        kicker={pick(locale, 'دورة المراجعة', 'Investigation Steps')}
        title={pick(locale, 'ماذا يحدث بعد إرسال البلاغ؟', 'Post-Submission Review & Investigation Workflow')}
      >
        <p>
          {pick(
            locale,
            'بمجرد الضغط على إرسال، يمر بلاغك بالخطوات التالية لضمان الحل العادل:',
            'Upon submission, your case progresses through our standardized quality and legal workflow:'
          )}
        </p>

        <LexCheckList
          items={[
            pick(locale, 'التسجيل الفوري: يُحفظ البلاغ في قاعدة بيانات المكتب ويُولد له رقم تتبع فريد.', 'Instant Logging: Stored securely in our central desk repository with a distinct reference ID.'),
            pick(locale, 'المطابقة والتحقق: يقوم محرر أو مهندس مختص بمطابقة الواقعة مع مزودي البيانات وسجلات السيرفر.', 'Verification: Dedicated staff cross-reference the claim with sports providers and server traces.'),
            pick(locale, 'التصحيح والإشعار: يتم إجراء التصحيح فور ثبوت الخطأ وإرسال تحديث لبريدك إن كنت قد زودتنا به.', 'Remediation & Notification: Immediate correction of data or asset removal, with email updates dispatched if provided.'),
          ]}
        />
      </LexSection>

      {/* ——— Article 4: Channels ——— */}
      <LexSection
        id="channels"
        index="04"
        kicker={pick(locale, 'قنوات الاتصال المباشرة', 'Direct Channels')}
        title={pick(locale, 'قنوات المراسلة البديلة والمكتب الإداري', 'Direct Email Support & Alternative Channels')}
      >
        <p>
          {pick(
            locale,
            'يمكنك أيضاً مراسلتنا مباشرة عبر البريد الإلكتروني الرسمي المعتمد:',
            'You may also email our administrative and editorial desk directly:'
          )}
        </p>

        <div className="flex flex-wrap items-center gap-3 mt-3">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[var(--lex-accent)] text-white hover:opacity-90 transition-opacity"
          >
            <Mail className="w-4 h-4" />
            <span>{CONTACT_EMAIL}</span>
          </a>
        </div>
      </LexSection>
    </LexChamber>
  );
}
