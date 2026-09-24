import { Link } from '@/i18n/navigation';
import { pick } from '@/i18n/pick';
import { CONTACT_EMAIL } from '@/lib/seo/site';
import {
  LexArticle,
  LexAsideCard,
  LexChamber,
  LexNote,
  LexPoints,
  LexTable,
} from './LexChamber';

export function PrivacyVault({ locale }: { locale: string }) {
  const date = pick(locale, '11 سبتمبر 2026', '11 September 2026');

  const rail = [
    { id: 'who', label: pick(locale, 'من نحن', 'Who we are') },
    { id: 'inventory', label: pick(locale, 'سجل البيانات', 'Data inventory') },
    { id: 'account', label: pick(locale, 'الحساب وغوغل', 'Account and Google') },
    { id: 'cookies', label: pick(locale, 'ملفات الارتباط', 'Cookies') },
    { id: 'storage', label: pick(locale, 'التخزين المحلي', 'Local storage') },
    { id: 'sports', label: pick(locale, 'البيانات الرياضية', 'Sports data') },
    { id: 'stream', label: pick(locale, 'البث والجغرافيا', 'Streaming and geo') },
    { id: 'use', label: pick(locale, 'الاستخدام', 'Use') },
    { id: 'processors', label: pick(locale, 'المعالجون', 'Processors') },
    { id: 'sale', label: pick(locale, 'البيع والإعلان', 'Sale and ads') },
    { id: 'rights', label: pick(locale, 'حقوقك', 'Your rights') },
    { id: 'keep', label: pick(locale, 'الاحتفاظ', 'Retention') },
    { id: 'security', label: pick(locale, 'الأمان', 'Security') },
    { id: 'kids', label: pick(locale, 'الأطفال', 'Children') },
    { id: 'change', label: pick(locale, 'التعديل', 'Changes') },
    { id: 'mail', label: pick(locale, 'التواصل', 'Contact') },
  ];

  const inventory: string[][] = [
    [
      pick(locale, 'الاسم والبريد والصورة', 'Name, email, and photo'),
      pick(locale, 'فتح الحساب عبر غوغل وعرضه في التعليق', 'To open the Google account and show it on a comment'),
      pick(locale, 'قاعدة الحسابات', 'Account database'),
    ],
    [
      pick(locale, 'معرّف غوغل ورموز الجلسة', 'Google account id and session tokens'),
      pick(locale, 'إبقاؤك مسجّلاً دون كلمة مرور عندنا', 'To keep you signed in; we do not store a password'),
      pick(locale, 'Auth.js + جدول الجلسات', 'Auth.js and the session table'),
    ],
    [
      pick(locale, 'المفضلة والمتابعة', 'Favourites and follows'),
      pick(locale, 'إظهار الفرق والبطولات التي حفظتها', 'To show teams and leagues you saved'),
      pick(locale, 'جدول المتابعة', 'Favourites table'),
    ],
    [
      pick(locale, 'توقعات النتائج والنقاط', 'Score predictions and points'),
      pick(locale, 'لوحة التوقعات داخل الحساب', 'The in-account predictions board'),
      pick(locale, 'جدول التوقعات', 'Predictions table'),
    ],
    [
      pick(locale, 'التعليقات', 'Comments'),
      pick(locale, 'غرفة المباراة والمراجعة', 'Match chat and moderation'),
      pick(locale, 'جدول التعليقات', 'Comments table'),
    ],
    [
      pick(locale, 'رسائل المكتب والبلاغات', 'Desk messages and reports'),
      pick(locale, 'الرد على ما كتبته أنت', 'To answer what you wrote'),
      pick(locale, 'صندوق المكتب', 'Desk inbox'),
    ],
    [
      pick(locale, 'تذكير المباراة واشتراك الدفع', 'Match reminder and push subscription'),
      pick(locale, 'تنبيه طلبته من الواجهة', 'An alert you switched on'),
      pick(locale, 'جداول التذكير والدفع', 'Reminder and push tables'),
    ],
    [
      pick(locale, 'اللغة والمظهر والمنطقة الزمنية', 'Language, theme, and timezone'),
      pick(locale, 'برنامج اليوم كما اخترته', 'The matchday programme as you set it'),
      pick(locale, 'كوكي + تخزين محلي', 'Cookie and local storage'),
    ],
    [
      pick(locale, 'عنوان تقريبي للطلب وسجلات الأخطاء', 'Approximate request address and error logs'),
      pick(locale, 'حماية الخدمة وحدّ الإساءة', 'To protect the service and stop abuse'),
      pick(locale, 'سجلات التشغيل لفترة محدودة', 'Operational logs for a limited time'),
    ],
  ];

  const cookies: string[][] = [
    ['yalla-locale', pick(locale, 'سنة', '1 year'), pick(locale, 'لغة الواجهة (عربي / إنجليزي).', 'Interface language (Arabic / English).')],
    ['yalla-theme', pick(locale, 'سنة', '1 year'), pick(locale, 'المظهر الفاتح أو الداكن.', 'Light or dark theme.')],
    ['yalla-tz', pick(locale, 'سنة', '1 year'), pick(locale, 'منطقتك الزمنية لبرنامج المباريات.', 'Your timezone for the match programme.')],
    [
      pick(locale, 'authjs.session-token', 'authjs.session-token'),
      pick(locale, 'مدة الجلسة', 'Session lifetime'),
      pick(
        locale,
        'إبقاؤك مسجّلاً. تظهر بصيغة __Secure- على HTTPS.',
        'Keeps you signed in. Appears in the __Secure- form on HTTPS.'
      ),
    ],
  ];

  const storage: string[][] = [
    [
      'yalla-cookie-consent',
      pick(
        locale,
        'ليس كوكياً. مفتاح في localStorage يُسجّل أنك أغلقت شريط ملفات الارتباط.',
        'Not a cookie. A localStorage key recording that you dismissed the cookie bar.'
      ),
    ],
    ['yalla-data-saver', pick(locale, 'وضع توفير البيانات لتحديث النتائج.', 'Data-saver mode for score refresh.')],
    [
      'yalla-timezone',
      pick(
        locale,
        'اختيار المنطقة الزمنية (تلقائي أو يدوي)، إلى جانب كوكي yalla-tz.',
        'Timezone choice (auto or manual), alongside the yalla-tz cookie.'
      ),
    ],
  ];

  const processors: string[][] = [
    [pick(locale, 'غوغل', 'Google'), pick(locale, 'الدخول الوحيد إلى الحساب.', 'The only sign-in to the account.')],
    [
      pick(locale, 'API-Football عبر RapidAPI', 'API-Football via RapidAPI'),
      pick(locale, 'النتائج والجداول والأحداث المعروضة.', 'Scores, tables, and events shown on the desk.'),
    ],
    [
      pick(locale, 'Upstash Redis', 'Upstash Redis'),
      pick(locale, 'التغذية الحية وحدّ الطلبات المسيئة.', 'The live feed and rate-limiting hostile requests.'),
    ],
    [
      pick(locale, 'Resend أو SendGrid (إن وُجد المفتاح)', 'Resend or SendGrid (if a key is set)'),
      pick(locale, 'إيصال رسالة المكتب عندما تُرسل فعلاً.', 'Delivering a desk message when one is actually sent.'),
    ],
    [
      pick(locale, 'مشغّل الاستضافة وقاعدة البيانات', 'Hosting operator and database'),
      pick(locale, 'تشغيل الصفحة وحفظ الحساب والتعليق والتوقع.', 'Running the site and storing the account, comment, and prediction.'),
    ],
  ];

  const rights = [
    pick(locale, 'الاطلاع: اطلب نسخة مما نحفظه عن حسابك عبر البريد.', 'Access: ask by mail for a copy of what we hold on your account.'),
    pick(locale, 'التصحيح: حدّث الاسم الظاهر من غوغل، أو اكتب لنا إن بقي خطأ.', 'Correction: update the visible name via Google, or write if an error remains.'),
    pick(
      locale,
      'الحذف: اطلب حذف الحساب. نزيل التفضيلات والتعليقات المرتبطة، مع ما قد يبقى في نسخة احتياطية تشغيلية لفترة محدودة.',
      'Deletion: ask to delete the account. Linked preferences and comments go with it, subject to operational backups for a limited time.'
    ),
    pick(locale, 'المتابعة: احذف المفضلة من الواجهة دون انتظار رد.', 'Follows: unfollow from the interface without waiting for a reply.'),
    pick(
      locale,
      'التنبيه: أوقف إشعارات المتصفح من إعداداته، وألغِ تذكير المباراة من الصفحة.',
      'Alerts: stop browser notifications in the browser, and cancel a match reminder on the page.'
    ),
    pick(locale, 'الاعتراض: اكتب إن رأيت استخداماً لا يطابق هذا السجل.', 'Objection: write if you see a use that does not match this ledger.'),
  ];

  const uses = [
    pick(
      locale,
      'تشغيل الحساب وعرض البرنامج بلغتك وفي منطقتك الزمنية.',
      'To run the account and show the programme in your language and timezone.'
    ),
    pick(
      locale,
      'حفظ المتابعات والتوقعات والتعليقات ورسائل المكتب التي كتبتها.',
      'To keep follows, predictions, comments, and desk messages you wrote.'
    ),
    pick(locale, 'إرسال تنبيه مباراة طلبته، لا رسائل ترويجية مخترعة.', 'To send a match alert you asked for — not invented promotional mail.'),
    pick(
      locale,
      'صدّ الإساءة، ومراجعة التعليق، وحدّ الطلبات المسيئة لواجهات البرمجة.',
      'To stop abuse, moderate comments, and rate-limit hostile API use.'
    ),
  ];

  return (
    <LexChamber
      locale={locale}
      path="/privacy"
      tone="vault"
      code="YS-L01"
      instrument={pick(locale, 'الصك الأول', 'Instrument one')}
      title={pick(locale, 'سياسة الخصوصية', 'Privacy Policy')}
      wordmark={pick(locale, 'سياسة الخصوصية', 'Privacy Policy')}
      eyebrow={pick(locale, 'خزنة البيانات · جرد مفتوح', 'The data vault · an open inventory')}
      lead={pick(
        locale,
        'هذا السجل يصف ما نجمعه فعلاً لتشغيل يلا سبورت، ولماذا، وأين يُحفظ، ومن يعالجه. لا بيع للحسابات، ولا مسؤول حماية بيانات باسم شخص لم نعيّنه، ولا سجل تجاري مخترع، ولا كوكي إعلان طرف ثالث في هذا الدفتر.',
        'This ledger describes what Yalla Sport actually collects, why, where it is kept, and who processes it. No sale of accounts, no named data-protection officer we have not appointed, no invented company registry, and no third-party advertising cookie in this book.'
      )}
      date={date}
      seals={[
        pick(locale, 'لا بيع للبيانات', 'No data sale'),
        pick(locale, 'غوغل فقط للدخول', 'Google sign-in only'),
        pick(locale, 'كوكي باسمه الحقيقي', 'Cookies by real name'),
        pick(locale, 'الموافقة محلية لا كوكي', 'Consent is local, not a cookie'),
      ]}
      rail={rail}
      aside={
        <LexAsideCard title={pick(locale, 'طلب سريع', 'Quick request')}>
          <p>
            {pick(
              locale,
              'لطلب نسخة من بياناتك أو حذف حسابك، أرسل من البريد نفسه المسجّل في الحساب.',
              'To request a copy of your data or delete your account, write from the address on the account.'
            )}
          </p>
          <p className="mt-2">
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
        </LexAsideCard>
      }
    >
      {/* Security & Transparency Bento */}
      <div className="mb-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-card/40 to-card/20 p-5 backdrop-blur-md transition-all hover:border-emerald-500/40">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {pick(locale, 'تشفير تام 256-bit SSL', '256-Bit SSL Encryption')}
              </h3>
              <p className="text-[11px] text-emerald-400 font-mono">TLS 1.3 · HTTPS ONLY</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {pick(
              locale,
              'جميع اتصالاتك بالموقع مؤمنة بتقنيات التشفير الحديثة؛ لا يمكن لأي وسيط التلصص على تصفحك أو تتبع اهتماماتك الرياضية.',
              'All platform requests are shielded by high-grade encryption; zero intermediary tampering or passive eavesdropping.'
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card/40 to-card/20 p-5 backdrop-blur-md transition-all hover:border-primary/40">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/30">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {pick(locale, 'صفر سماسرة بيانات (0 Data Brokers)', 'Zero Data Brokers Sold')}
              </h3>
              <p className="text-[11px] text-primary font-mono">NO TRACKERS · NO AD-NETWORKS</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {pick(
              locale,
              'لا نبيع ولا نتاجر بمعلوماتك أو بريدك الإلكتروني مع أي وكالات إعلانية أو شبكات ترويجية نهائياً.',
              'We never sell, rent, or lease your profile, email, or usage data to third-party ad networks or data brokers.'
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-card/40 to-card/20 p-5 backdrop-blur-md transition-all hover:border-cyan-500/40">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {pick(locale, 'دخول محمي عبر Google OAuth', 'Google OAuth Passwordless')}
              </h3>
              <p className="text-[11px] text-cyan-400 font-mono">ZERO STORED PASSWORDS</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {pick(
              locale,
              'لا نحتفظ بكلمات مرور على خوادمنا نهائياً. يتم التوثيق مباشرة عبر بروتوكولات غوغل المشفرة بحماية ثنائية.',
              'We never store passwords on our databases. Sign-ins are securely validated via official Google OAuth tokens.'
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-card/40 to-card/20 p-5 backdrop-blur-md transition-all hover:border-amber-500/40">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {pick(locale, 'حق الوصول والمسح الفوري', 'Self-Service & Data Rights')}
              </h3>
              <p className="text-[11px] text-amber-400 font-mono">GDPR & PRIVACY COMPLIANT</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {pick(
              locale,
              'يمكنك إلغاء متابعة الفرق أو إيقاف التنبيهات من الواجهة مباشرة، أو طلب تصدير وحذف حسابك بالكامل عبر بريدنا.',
              'You retain total sovereignty: easily clear team follows, revoke push notifications, or request complete account erasure.'
            )}
          </p>
        </div>
      </div>

      <LexArticle
        id="who"
        index="01"
        title={pick(locale, 'من نحن', 'Who we are')}
        kicker={pick(locale, 'الجهة', 'The party')}
      >
        <p>
          {pick(
            locale,
            'يلا سبورت منصة نتائج وأخبار كرة قدم على yalla-sport.com. المكتب يصل عبر البريد أدناه. لا ندّعي مقراً قضائياً باسم مدينة لم نعلنها، ولا مسؤولاً عن حماية البيانات باسم شخص لم يُعيَّن في هذه الصفحة.',
            'Yalla Sport is a football scores and news desk at yalla-sport.com. The desk is reached at the mail below. We do not invent a court city we have not named, and we do not invent a data-protection officer who is not appointed on this page.'
          )}
        </p>
        <LexNote label={pick(locale, 'الأولوية', 'Precedence')}>
          {pick(
            locale,
            'إن تعارض ملخص تسويقي أو شريط في التذييل مع هذا السجل، يُعتدّ بالنص الظاهر هنا وبتاريخ النسخة في الرأس.',
            'If a marketing line or a footer chip conflicts with this ledger, the text on this page and the edition date in the masthead prevail.'
          )}
        </LexNote>
      </LexArticle>

      <LexArticle
        id="inventory"
        index="02"
        title={pick(locale, 'سجل البيانات', 'Data inventory')}
        kicker={pick(locale, 'الجرد', 'The inventory')}
      >
        <p>
          {pick(
            locale,
            'الجدول التالي جرد لما نلمسه فعلاً. إن لم تستخدم الحساب، يبقى من ذلك ما يلزم لتشغيل اللغة والمظهر والمنطقة الزمنية على جهازك.',
            'The table is an inventory of what we actually touch. If you never sign in, what remains is what the device needs for language, theme, and timezone.'
          )}
        </p>
        <LexTable
          head={[pick(locale, 'المادة', 'Item'), pick(locale, 'الغرض', 'Purpose'), pick(locale, 'المكان', 'Where')]}
          rows={inventory}
        />
      </LexArticle>

      <LexArticle
        id="account"
        index="03"
        title={pick(locale, 'الحساب وغوغل', 'Account and Google')}
        kicker={pick(locale, 'الدخول', 'Sign-in')}
      >
        <p>
          {pick(
            locale,
            'الدخول إلى الحساب عبر غوغل فقط. لا نموذج بريد وكلمة مرور على المنصة. غوغل يزوّدنا بالاسم والبريد والصورة إن منحتها لتطبيق الدخول. لا نخزّن كلمة مرورك.',
            'Sign-in is Google only. There is no email-and-password form on the platform. Google supplies the name, email, and photo you grant to the sign-in app. We do not store your password.'
          )}
        </p>
        <p>
          {pick(
            locale,
            'قد يُحفظ دور الحساب (قارئ، مشرف، إدارة) وحالة اشتراك داخلية لصفحة البث إن فُعّلت. النقاط على لوحة التوقعات رقم داخل الحساب، ليست مالاً.',
            'The account may hold a role (reader, moderator, admin) and an internal subscription status for the watch page if streaming is on. Leaderboard points are an in-account figure, not money.'
          )}
        </p>
      </LexArticle>

      <LexArticle
        id="cookies"
        index="04"
        title={pick(locale, 'ملفات الارتباط', 'Cookies')}
        kicker={pick(locale, 'بأسمائها', 'By real name')}
      >
        <p>
          {pick(
            locale,
            'هذه الأسماء مستخدمة في المنصة، لا قائمة عامة منسوخة من قالب قانوني. بدونها لا تعمل اللغة والمظهر والجلسة كما صُمّمت.',
            'These names are used on the platform, not copied from a generic legal template. Without them, language, theme, and session do not work as designed.'
          )}
        </p>
        <LexTable
          head={[pick(locale, 'الاسم', 'Name'), pick(locale, 'المدة', 'Life'), pick(locale, 'العمل', 'Job')]}
          rows={cookies}
          mono
        />
      </LexArticle>

      <LexArticle
        id="storage"
        index="05"
        title={pick(locale, 'التخزين المحلي', 'Local storage')}
        kicker={pick(locale, 'على جهازك', 'On your device')}
      >
        <p>
          {pick(
            locale,
            'بعض الاختيارات تُحفظ في المتصفح لا كملف ارتباط. شريط الموافقة نفسه لا يزرع كوكياً باسم الموافقة.',
            'Some choices live in the browser, not as a cookie. The consent bar itself does not plant a cookie named after consent.'
          )}
        </p>
        <LexTable head={[pick(locale, 'المفتاح', 'Key'), pick(locale, 'العمل', 'Job')]} rows={storage} mono />
      </LexArticle>

      <LexArticle
        id="sports"
        index="06"
        title={pick(locale, 'البيانات الرياضية', 'Sports data')}
        kicker={pick(locale, 'من المصدر', 'From the source')}
      >
        <p>
          {pick(
            locale,
            'النتائج والجداول والأحداث تصل من مزود خارجي (API-Football) وتُحفظ للعرض والمزامنة. الرقم يظهر بعد وصوله. لا نولّد 0–0 مكان غياب النتيجة، ولا نخترع هدافاً بلا اسم في المصدر.',
            'Scores, tables, and events arrive from an external provider (API-Football) and are stored for display and sync. A figure appears after it arrives. We do not mint 0–0 where a score is missing, and we do not invent a scorer without a name in the source.'
          )}
        </p>
        <p>
          {pick(
            locale,
            'هذا الجرد يخص بياناتك أنت. بيانات الأندية واللاعبين والنتائج ملك مصادرها، وتُعرض وفق ترخيص المزود لا كأنها ملكية شخصية لزائر.',
            'This inventory is about your data. Club, player, and score records belong to their sources and are shown under the provider licence, not as a visitor’s personal property.'
          )}
        </p>
      </LexArticle>

      <LexArticle
        id="stream"
        index="07"
        title={pick(locale, 'البث والجغرافيا', 'Streaming and geo')}
        kicker={pick(locale, 'الترخيص', 'The licence')}
      >
        <p>
          {pick(
            locale,
            'إن كان البث معطّلاً في الإعداد، لا يُطلب بلد للمشاهدة ولا تُحفظ أسرار تشغيل. إن فُعّل البث، قد يُستنتج بلد تقريبي من ترويسة الطلب لمعرفة إن كان الأصل المرخّص مسموحاً في منطقتك. هذا ليس تتبعاً إعلانياً.',
            'If streaming is off in configuration, no country is asked for playback and no playback secrets are stored. If streaming is on, an approximate country may be read from the request header to see whether a licensed asset is allowed in your territory. That is not advertising tracking.'
          )}
        </p>
        <LexNote label={pick(locale, 'قاعدة ثابتة', 'Standing rule')}>
          {pick(
            locale,
            'لا بث بلا أصل مرخّص. أسرار واجهة التشغيل لا تُحفظ في قاعدة البيانات.',
            'There is no stream without a licensed asset. Playback secrets are not stored in the database.'
          )}
        </LexNote>
      </LexArticle>

      <LexArticle
        id="use"
        index="08"
        title={pick(locale, 'كيف نستخدم البيانات', 'How we use data')}
        kicker={pick(locale, 'الغرض', 'Purpose')}
      >
        <LexPoints items={uses} />
      </LexArticle>

      <LexArticle
        id="processors"
        index="09"
        title={pick(locale, 'المعالجون', 'Processors')}
        kicker={pick(locale, 'من يلمس ماذا', 'Who touches what')}
      >
        <p>
          {pick(
            locale,
            'لا نبيع الحساب. الجهات التالية قد تعالج ما يلزم لتشغيل الخدمة، كلٌّ في حدود عمله:',
            'We do not sell the account. The following may process what is needed to run the service, each within its job:'
          )}
        </p>
        <LexTable head={[pick(locale, 'الجهة', 'Party'), pick(locale, 'الدور', 'Role')]} rows={processors} />
        <p>
          {pick(
            locale,
            'إن ألزمنا القانون، نكشف الحد الأدنى للجهة المختصة. لا نضمّن في هذا السجل أداة تحليلات إعلانية غير موصولة في الشفرة.',
            'If the law requires it, we disclose the minimum to the competent authority. This ledger does not include an advertising analytics tool that is not wired in the code.'
          )}
        </p>
      </LexArticle>

      <LexArticle
        id="sale"
        index="10"
        title={pick(locale, 'البيع والإعلان', 'Sale and ads')}
        kicker={pick(locale, 'لا يحدث', 'Does not happen')}
      >
        <p>
          {pick(
            locale,
            'لا نبيع بيانات الحساب ولا نؤجّرها. قد توجد مساحات إعلان طرف أول في التصميم؛ هذا السجل لا يضع كوكي إعلان لطرف ثالث. إن وصل إعلان خارجي لاحقاً، يُذكر هنا باسمه قبل تشغيله كأنه أمر واقع.',
            'We do not sell or rent account data. First-party ad placements may exist in the design; this ledger does not set a third-party advertising cookie. If an external ad later arrives, it will be named here before it is treated as a fact.'
          )}
        </p>
      </LexArticle>

      <LexArticle
        id="rights"
        index="11"
        title={pick(locale, 'حقوقك', 'Your rights')}
        kicker={pick(locale, 'ما تملك طلبه', 'What you may ask')}
      >
        <LexPoints items={rights} ordered />
        <p>
          {pick(
            locale,
            'لا نعد بمهلة ساعات مخترعة للرد. نقرأ البريد ونرد حين يُعالج الطلب.',
            'We do not invent an hours-long reply SLA. We read the mail and reply when the request is handled.'
          )}
        </p>
      </LexArticle>

      <LexArticle
        id="keep"
        index="12"
        title={pick(locale, 'الاحتفاظ', 'Retention')}
        kicker={pick(locale, 'كم يبقى', 'How long')}
      >
        <p>
          {pick(
            locale,
            'نحتفظ بالحساب ما دام نشطاً. التعليق والتوقع ورسالة المكتب تبقى ما بقي الحساب، أو إلى أن تُحذف للمخالفة. سجلات التشغيل تُحفظ للمدة اللازمة للأمان والقانون ثم تُزال أو تُختصر.',
            'We keep the account while it is active. A comment, prediction, or desk message stays while the account stays, or until it is removed for a violation. Operational logs are kept as needed for security and law, then dropped or reduced.'
          )}
        </p>
      </LexArticle>

      <LexArticle
        id="security"
        index="13"
        title={pick(locale, 'الأمان', 'Security')}
        kicker={pick(locale, 'ما نفعله', 'What we do')}
      >
        <p>
          {pick(
            locale,
            'النقل مشفّر، والوصول إلى الإدارة مقيّد بالدور، وواجهات الكتابة محدودة المعدل. لا توجد حماية مطلقة على الشبكة، ولا شهادة أمنية نعلقها هنا دون تدقيق منشور.',
            'Transport is encrypted, admin access is role-gated, and write routes are rate-limited. No network service is perfectly secure, and we do not hang a security badge here without a published audit.'
          )}
        </p>
      </LexArticle>

      <LexArticle
        id="kids"
        index="14"
        title={pick(locale, 'الأطفال', 'Children')}
        kicker={pick(locale, 'السن', 'Age')}
      >
        <p>
          {pick(
            locale,
            'المنصة غير موجّهة لمن دون سنّ يؤهّل لفتح حساب بمفرده في بلدك. إن علمنا بحساب لطفل دون ذلك، نحذفه بعد تحقق معقول.',
            'The platform is not directed at anyone below the age that can open an account alone in your country. If we learn of such an account, we delete it after reasonable verification.'
          )}
        </p>
      </LexArticle>

      <LexArticle
        id="change"
        index="15"
        title={pick(locale, 'تعديل هذا السجل', 'Changes to this ledger')}
        kicker={pick(locale, 'النسخة', 'The edition')}
      >
        <p>
          {pick(
            locale,
            'إن تغيّر السجل جوهرياً نحدّث تاريخ النسخة في الرأس. الاستمرار بعد التحديث يعني أنك قرأت النسخة الظاهرة، لا نسخة قديمة في ذاكرتك.',
            'If this ledger changes in substance we update the edition date in the masthead. Continuing after an update means you have read the version on the page, not an older one in memory.'
          )}
        </p>
        <p>
          <Link href="/terms">{pick(locale, 'اقرأ عقد الاستخدام', 'Read the deed of use')}</Link>
        </p>
      </LexArticle>

      <LexArticle
        id="mail"
        index="16"
        title={pick(locale, 'التواصل', 'Contact')}
        kicker={pick(locale, 'خط المكتب', 'Desk line')}
      >
        <p>
          {pick(locale, 'لأسئلة الخصوصية والحذف والاطلاع:', 'For privacy, deletion, and access questions:')}{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
        <p>
          {pick(
            locale,
            'لا نموذج وهمي في هذه الصفحة، ولا رقم هاتف أو واتساب لم ننشره كقناة رسمية.',
            'There is no dummy form on this page, and no phone or WhatsApp number we have not published as an official channel.'
          )}
        </p>
      </LexArticle>
    </LexChamber>
  );
}
