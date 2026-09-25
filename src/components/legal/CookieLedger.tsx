'use client';

import { pick } from '@/i18n/pick';
import { CONTACT_EMAIL } from '@/lib/seo/site';
import {
  LexChamber,
  LexSection,
  LexHighlightsGrid,
  LexHighlightCard,
  LexModernTable,
  LexCheckList,
  LexCallout,
} from './LexChamber';
import {
  Sliders,
  ShieldCheck,
  Lock,
  EyeOff,
} from 'lucide-react';

export function CookieLedger({ locale, analyticsId = '' }: { locale: string; analyticsId?: string }) {
  const date = pick(locale, '23 سبتمبر 2026', '23 September 2026');

  const rail = [
    { id: 'overview', label: pick(locale, 'نظرة عامة والشفافية', 'Overview & Philosophy') },
    { id: 'cookies-table', label: pick(locale, 'جدول ملفات الارتباط الفنية', 'Technical Cookies Table') },
    { id: 'storage-table', label: pick(locale, 'سجل التخزين المحلي', 'Local Storage Inventory') },
    { id: 'analytics', label: pick(locale, 'التحليلات والموافقة', 'Analytics & Explicit Consent') },
    { id: 'controls', label: pick(locale, 'كيفية التحكم بالمتصفح', 'Browser Cookie Controls') },
    { id: 'contact', label: pick(locale, 'المساعدة والاستفسار', 'Support & Questions') },
  ];

  const cookiesTable = [
    [
      <span className="lex-mono-tag">yalla-locale</span>,
      <span className="text-emerald-500 font-semibold text-xs">{pick(locale, 'أساسي', 'Essential')}</span>,
      pick(locale, 'سنة واحدة', '1 year'),
      pick(locale, 'حفظ لغة العرض المفضلة لديك (العربية / English) لعرض النصوص فوراً دون وميض.', 'Stores your preferred interface language (Arabic/English) for instantaneous rendering.'),
    ],
    [
      <span className="lex-mono-tag">yalla-theme</span>,
      <span className="text-emerald-500 font-semibold text-xs">{pick(locale, 'أساسي', 'Essential')}</span>,
      pick(locale, 'سنة واحدة', '1 year'),
      pick(locale, 'تذكر اختيار المظهر (الداكن الفخم أو الفاتح الأنيق) ومنع وميض الشاشة عند التنقل.', 'Remembers your theme preference (dark/light mode) to prevent screen flickering.'),
    ],
    [
      <span className="lex-mono-tag">yalla-tz</span>,
      <span className="text-emerald-500 font-semibold text-xs">{pick(locale, 'أساسي', 'Essential')}</span>,
      pick(locale, 'سنة واحدة', '1 year'),
      pick(locale, 'المنطقة الزمنية الخاصة بك لضبط مواعيد انطلاق المباريات والعد التنازلي بدقة متناهية.', 'Your local timezone for calculating accurate match kick-off times and live count-ups.'),
    ],
    [
      <span className="lex-mono-tag">authjs.session-token</span>,
      <span className="text-blue-500 font-semibold text-xs">{pick(locale, 'أمان ومصادقة', 'Security')}</span>,
      pick(locale, 'مدة الجلسة النشطة', 'Active session lifetime'),
      pick(locale, 'رمز أمان مشفر للحفاظ على تسجيل دخولك مع الحماية ضد هجمات تزوير الطلبات عبر المواقع (CSRF).', 'Encrypted cryptographic token verifying your session with secure HTTPS and CSRF immunity.'),
    ],
    [
      <span className="lex-mono-tag">yalla-data-saver</span>,
      <span className="text-amber-500 font-semibold text-xs">{pick(locale, 'أداء وتوفير', 'Performance')}</span>,
      pick(locale, 'سنة واحدة', '1 year'),
      pick(locale, 'حفظ تفضيل وضع توفير باقة الإنترنت لتقليل التحديثات اللحظية واستهلاك البيانات عند التجوال.', 'Saves data-saver toggle to optimize network polling and conserve mobile data.'),
    ],
    [
      <span className="lex-mono-tag">ys_poll_*</span>,
      <span className="text-muted-foreground font-semibold text-xs">{pick(locale, 'وظيفي', 'Functional')}</span>,
      pick(locale, '7 أيام', '7 days'),
      pick(locale, 'ضمان نزاهة استطلاعات الرأي الرياضية ومنع تكرار التصويت في نفس الاستفتاء من ذات المتصفح.', 'Ensures integrity of match polls and prevents double-voting from the same device.'),
    ],
  ];

  if (analyticsId) {
    cookiesTable.push([
      <span className="lex-mono-tag">_ga / _ga_*</span>,
      <span className="text-purple-500 font-semibold text-xs">{pick(locale, 'إحصائي (بالموافقة)', 'Analytics (Consent)')}</span>,
      pick(locale, 'حتى عامين', 'Up to 2 years'),
      pick(locale, `إحصاءات استخدام مجهولة الهوية لتطوير المنصة، لا يتم زرعها إلا بعد موافقتك الصريحة.`, `Anonymous usage statistics via Google Analytics 4, active only after explicit user consent.`),
    ]);
  }

  const storageTable = [
    [
      <span className="lex-mono-tag">yalla-cookie-consent</span>,
      pick(locale, 'حفظ خيارك بخصوص شريط الموافقة على ملفات تعريف الارتباط لمنع إزعاجه مجدداً.', 'Remembers your acknowledgement of the cookie preferences bar to avoid repeating prompts.'),
    ],
    [
      <span className="lex-mono-tag">yalla-data-saver</span>,
      pick(locale, 'نسخة فورية للقراءة من جانب العميل لتقليل استهلاك موارد المعالج أثناء المباريات.', 'Client-side cached copy for instant responsiveness during live match polling.'),
    ],
    [
      <span className="lex-mono-tag">yalla-timezone</span>,
      pick(locale, 'تحديد المنطقة الزمنية التلقائي (Auto Detect) استناداً إلى إعدادات نظام التشغيل لديك.', 'Client-side detection of system timezone offset for seamless real-time schedules.'),
    ],
  ];

  return (
    <LexChamber
      locale={locale}
      path="/cookies"
      tone="crumb"
      code="YS-SEC-02"
      instrument={pick(locale, 'سجل ملفات الارتباط والتخزين', 'Cookie & Storage Ledger')}
      title={pick(locale, 'ملفات تعريف الارتباط', 'Cookie Policy')}
      wordmark={pick(locale, 'سجل ملفات الارتباط والتخزين', 'Cookie & Storage Ledger')}
      eyebrow={pick(locale, 'أسماء حقيقية من الشفرة · صفر إعلانات تطفلية', 'Real Code Identifiers · Zero Tracking Ads')}
      lead={pick(
        locale,
        'نحن لا نؤمن بالقوائم المبهمة أو المنسوخة. هذا السجل يعرض بالاسم كل ملف ارتباط ومفتاح تخزين محلي تستخدمه منصة يلا سبورت، والغرض البرمجي منه، ومدة بقائه في متصفحك.',
        'We do not present generic templates. This ledger itemises every real cookie and localStorage key executed by Yalla Sport code, along with its exact technical purpose and lifespan.'
      )}
      date={date}
      seals={[
        pick(locale, 'أسماء حقيقية ومطابقة للشفرة', '100% Code Synchronised'),
        pick(locale, 'لا ملفات تتبع إعلانية لأطراف ثالثة', 'No 3rd-Party Ad Trackers'),
        pick(locale, 'تحكم فوري من إعدادات المتصفح', 'Total Browser Autonomy'),
      ]}
      rail={rail}
    >
      {/* ——— Executive Highlights ——— */}
      <LexHighlightsGrid>
        <LexHighlightCard
          icon={ShieldCheck}
          badge={pick(locale, 'ملفات أساسية', 'Essential First-Party')}
          title={pick(locale, 'ملفات وظيفية لتشغيل المنصة', 'Functional Core')}
          body={pick(
            locale,
            'ملفات الارتباط لدينا مصممة لراحتك: تذكر اللغة، تطبيق المظهر الداكن، وضبط توقيت المباريات بدقة.',
            'Our cookies exist strictly to power your experience: remembering theme, language, and local kickoffs.'
          )}
        />

        <LexHighlightCard
          icon={EyeOff}
          badge={pick(locale, 'حماية قصوى', 'Privacy First')}
          title={pick(locale, 'لا ملفات تتبع للشركات الإعلانية', 'Zero Cross-Site Trackers')}
          body={pick(
            locale,
            'لا نزرع ملفات ارتباط لشبكات إعلانية تتجسس على نشاطك في المواقع الأخرى.',
            'We never deploy invasive third-party tracking cookies that profile you across external websites.'
          )}
        />

        <LexHighlightCard
          icon={Lock}
          badge={pick(locale, 'جلسات آمنة', 'Encrypted Tokens')}
          title={pick(locale, 'حماية الجلسة عبر HTTPS', 'Secure Session Protection')}
          body={pick(
            locale,
            'ملفات تسجيل الدخول محمية بخاصية Secure و SameSite لمنع أي محاولات اختراق أو تزوير للطلبات.',
            'Authentication tokens are guarded with Secure, HttpOnly, and SameSite flags against CSRF attacks.'
          )}
        />

        <LexHighlightCard
          icon={Sliders}
          badge={pick(locale, 'مرونة وتحكم', 'User Controls')}
          title={pick(locale, 'حرية المسح في أي ثانية', 'Clear at Any Time')}
          body={pick(
            locale,
            'يمكنك مسح كافة الملفات بضغطة زر من متصفحك وستعود المنصة إلى إعداداتها الأولية.',
            'You can wipe cookies and site data instantly from your browser settings with zero side effects.'
          )}
        />
      </LexHighlightsGrid>

      {/* ——— Article 1: Overview ——— */}
      <LexSection
        id="overview"
        index="01"
        kicker={pick(locale, 'ما هي ملفات الارتباط؟', 'Definition & Architecture')}
        title={pick(locale, 'ما هي ملفات تعريف الارتباط ولماذا نحتاجها؟', 'What are Cookies & Why Does Yalla Sport Use Them?')}
      >
        <p>
          {pick(
            locale,
            'ملفات تعريف الارتباط (Cookies) هي ملفات نصية صغيرة وآمنة يقوم متصفحك بحفظها عند زيارة المنصة. تلعب هذه الملفات دوراً حيوياً في تمكين المزايا الرياضية الحديثة، مثل تذكر النادي الذي تتابعه، ولغة الواجهة المفضلة لديك، وتوقيت انطلاق المباريات بتوقيت مدينتك دون الحاجة لضبطه في كل صفحة.',
            'Cookies are compact, secure text keys retained by your web browser when accessing Yalla Sport. They serve an indispensable role in enabling modern digital sports features: remembering your locale, maintaining your chosen theme, and ensuring fixture count-ups reflect your exact local clock.'
          )}
        </p>

        <LexCallout title={pick(locale, 'شفافية التسمية', 'Authentic Code Naming')}>
          {pick(
            locale,
            'الأسماء المدرجة في هذا السجل هي الأسماء الفعلية المستخدمة في شفرة منصة يلا سبورت وليست قائمة عامة تم اقتباسها دون صلة بالنظام.',
            'The names listed in this ledger correspond precisely to the runtime keys implemented in Yalla Sport production source code.'
          )}
        </LexCallout>
      </LexSection>

      {/* ——— Article 2: Technical Table ——— */}
      <LexSection
        id="cookies-table"
        index="02"
        kicker={pick(locale, 'السجل التقني الشامل', 'Technical Inventory')}
        title={pick(locale, 'جدول ملفات تعريف الارتباط بأسمائها الحقيقية', 'The Official Yalla Sport Cookie Ledger')}
      >
        <p>
          {pick(
            locale,
            'تفصيل شامل لملفات الارتباط الفنية النشطة في يلا سبورت ومدتها والغرض منها:',
            'Comprehensive specification of active technical cookies on Yalla Sport, their duration, and purpose:'
          )}
        </p>

        <LexModernTable
          headers={[
            pick(locale, 'اسم الكوكي البرمجي', 'Cookie Key'),
            pick(locale, 'التصنيف', 'Category'),
            pick(locale, 'مدة الصلاحية', 'Lifespan'),
            pick(locale, 'الوظيفة والغرض التقني', 'Technical Purpose'),
          ]}
          rows={cookiesTable}
        />
      </LexSection>

      {/* ——— Article 3: Local Storage ——— */}
      <LexSection
        id="storage-table"
        index="03"
        kicker={pick(locale, 'ذاكرة المتصفح', 'Web Storage')}
        title={pick(locale, 'سجل مفاتيح التخزين المحلي (Local Storage)', 'Local Storage Keys & Client Cache')}
      >
        <p>
          {pick(
            locale,
            'بالإضافة إلى ملفات الارتباط، تستخدم المنصة التخزين المحلي (Local Storage) في متصفحك لتخزين بعض الخيارات التفضيلية المؤقتة التي تسرع التصفح ولا تتطلب إرسالها مع كل طلب إلى الخادم:',
            'Alongside cookies, Yalla Sport utilises browser Local Storage for lightweight client-side configuration that accelerates responsiveness without adding payload to HTTP requests:'
          )}
        </p>

        <LexModernTable
          headers={[
            pick(locale, 'اسم المفتاح (Storage Key)', 'Storage Key'),
            pick(locale, 'الشرح والغرض', 'Description & Utility'),
          ]}
          rows={storageTable}
        />
      </LexSection>

      {/* ——— Article 4: Analytics ——— */}
      <LexSection
        id="analytics"
        index="04"
        kicker={pick(locale, 'الإحصاءات والتحسين', 'Analytics & Measurement')}
        title={pick(locale, 'التحليلات والموافقة الصريحة', 'Google Analytics & User Consent Protocol')}
      >
        <p>
          {pick(
            locale,
            'نستخدم أداة غوغل أناليتكس 4 (Google Analytics 4) فقط لقياس أداء المنصة ومعرفة الصفحات والمباريات الأكثر طلباً لتحسين سرعة السيرفرات. نحن لا نجمع أي بيانات تعريفية، ولا يتم تحميل ملفات التحليلات إلا بعد موافقتك عبر شريط الكوكيز.',
            'We employ Google Analytics 4 strictly to assess aggregated infrastructure performance, identifying high-traffic matchdays to scale servers reliably. Analytics scripts never load before you explicitly accept via our cookie consent banner.'
          )}
        </p>
      </LexSection>

      {/* ——— Article 5: Browser Controls ——— */}
      <LexSection
        id="controls"
        index="05"
        kicker={pick(locale, 'إدارة الخيارات', 'Browser Guidance')}
        title={pick(locale, 'كيفية إدارة ومسح ملفات الارتباط في متصفحك', 'How to Manage and Clear Cookies in Your Browser')}
      >
        <p>
          {pick(
            locale,
            'تتيح لك جميع متصفحات الإنترنت الحديثة التحكم الكامل في ملفات تعريف الارتباط. إليك كيفية مسحها أو حظرها:',
            'Modern browsers grant you total control over cookies and storage. Here is how to configure or clear them:'
          )}
        </p>

        <LexCheckList
          items={[
            pick(locale, 'جوجل كروم (Google Chrome): الإعدادات > الخصوصية والأمان > محو بيانات التصفح > ملفات تعريف الارتباط وبيانات المواقع الأخرى.', 'Google Chrome: Settings > Privacy and Security > Clear Browsing Data > Cookies and other site data.'),
            pick(locale, 'سفاري (Apple Safari): الإعدادات > الخصوصية > إدارة بيانات موقع الويب > إزالة الكل أو إزالة ملفات yalla-sport.', 'Apple Safari: Preferences / Settings > Privacy > Manage Website Data > Remove All or search for yalla-sport.'),
            pick(locale, 'موزيلا فايرفوكس (Mozilla Firefox): الإعدادات > الخصوصية والأمان > الكوكيز وبيانات المواقع > مسح البيانات.', 'Mozilla Firefox: Settings > Privacy & Security > Cookies and Site Data > Clear Data.'),
            pick(locale, 'مايكروسوفت إيدج (Microsoft Edge): الإعدادات > ملفات تعريف الارتباط وأذونات المواقع > إدارة ملفات تعريف الارتباط وحذفها.', 'Microsoft Edge: Settings > Cookies and site permissions > Manage and delete cookies.'),
          ]}
        />

        <LexCallout title={pick(locale, 'ماذا يحدث عند مسح ملفات الارتباط؟', 'What Happens When You Wipe Cookies?')}>
          {pick(
            locale,
            'عند مسح ملفات الارتباط، سيتم تسجيل خروجك من حسابك، وستعود اللغة والمظهر والمنطقة الزمنية إلى الإعدادات الافتراضية التلقائية حتى تختارها مرة أخرى.',
            'Clearing cookies will sign you out of your session and reset your theme, language, and timezone to defaults until you configure them afresh.'
          )}
        </LexCallout>
      </LexSection>

      {/* ——— Article 6: Support ——— */}
      <LexSection
        id="contact"
        index="06"
        kicker={pick(locale, 'الدعم والاستفسار', 'Support Desk')}
        title={pick(locale, 'هل لديك استفسار حول ملفات الارتباط؟', 'Need Additional Information on Our Cookie Policy?')}
      >
        <p>
          {pick(
            locale,
            'إذا كنت بحاجة إلى مزيد من الإيضاح حول أي جانب فني في ملفات الارتباط، يمكنك التواصل مع فريق الدعم الفني المباشر:',
            'Should you have any technical queries concerning our cookie deployment, our technical team is at your service:'
          )}
        </p>

        <div className="flex flex-wrap items-center gap-3 mt-4">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[var(--lex-accent)] text-white hover:opacity-90 transition-opacity shadow-lg shadow-[var(--lex-accent)]/20"
          >
            <span>{CONTACT_EMAIL}</span>
          </a>
        </div>
      </LexSection>
    </LexChamber>
  );
}
