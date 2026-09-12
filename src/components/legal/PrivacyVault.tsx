import { BrandMark } from '@/components/brand/BrandMark';
import { LEGAL_NAV } from '@/components/legal/LegalDesk';
import { Link } from '@/i18n/navigation';
import { pick } from '@/i18n/pick';
import { CONTACT_EMAIL } from '@/lib/seo/site';

const TOC = [
  { id: 'who', ar: 'من نحن', en: 'Who we are' },
  { id: 'inventory', ar: 'سجل البيانات', en: 'Data inventory' },
  { id: 'account', ar: 'الحساب وغوغل', en: 'Account and Google' },
  { id: 'cookies', ar: 'ملفات الارتباط', en: 'Cookies' },
  { id: 'storage', ar: 'التخزين المحلي', en: 'Local storage' },
  { id: 'sports', ar: 'البيانات الرياضية', en: 'Sports data' },
  { id: 'stream', ar: 'البث والجغرافيا', en: 'Streaming and geo' },
  { id: 'use', ar: 'الاستخدام', en: 'Use' },
  { id: 'processors', ar: 'المعالجون', en: 'Processors' },
  { id: 'sale', ar: 'البيع والإعلان', en: 'Sale and ads' },
  { id: 'rights', ar: 'حقوقك', en: 'Your rights' },
  { id: 'keep', ar: 'الاحتفاظ', en: 'Retention' },
  { id: 'security', ar: 'الأمان', en: 'Security' },
  { id: 'kids', ar: 'الأطفال', en: 'Children' },
  { id: 'change', ar: 'التعديل', en: 'Changes' },
  { id: 'mail', ar: 'التواصل', en: 'Contact' },
] as const;

export function PrivacyVault({ locale }: { locale: string }) {
  const date = pick(locale, '11 سبتمبر 2026', '11 September 2026');

  const inventory = [
    {
      what: pick(locale, 'الاسم والبريد والصورة', 'Name, email, and photo'),
      why: pick(locale, 'فتح الحساب عبر غوغل وعرضه في التعليق', 'To open the Google account and show it on a comment'),
      where: pick(locale, 'قاعدة الحسابات', 'Account database'),
    },
    {
      what: pick(locale, 'معرّف غوغل ورموز الجلسة', 'Google account id and session tokens'),
      why: pick(locale, 'إبقاؤك مسجّلاً دون كلمة مرور عندنا', 'To keep you signed in; we do not store a password'),
      where: pick(locale, 'Auth.js + جدول الجلسات', 'Auth.js and the session table'),
    },
    {
      what: pick(locale, 'المفضلة والمتابعة', 'Favourites and follows'),
      why: pick(locale, 'إظهار الفرق والبطولات التي حفظتها', 'To show teams and leagues you saved'),
      where: pick(locale, 'جدول المتابعة', 'Favourites table'),
    },
    {
      what: pick(locale, 'توقعات النتائج والنقاط', 'Score predictions and points'),
      why: pick(locale, 'لوحة التوقعات داخل الحساب', 'The in-account predictions board'),
      where: pick(locale, 'جدول التوقعات', 'Predictions table'),
    },
    {
      what: pick(locale, 'التعليقات', 'Comments'),
      why: pick(locale, 'غرفة المباراة والمراجعة', 'Match chat and moderation'),
      where: pick(locale, 'جدول التعليقات', 'Comments table'),
    },
    {
      what: pick(locale, 'رسائل المكتب والبلاغات', 'Desk messages and reports'),
      why: pick(locale, 'الرد على ما كتبته أنت', 'To answer what you wrote'),
      where: pick(locale, 'صندوق المكتب', 'Desk inbox'),
    },
    {
      what: pick(locale, 'تذكير المباراة واشتراك الدفع', 'Match reminder and push subscription'),
      why: pick(locale, 'تنبيه طلبته من الواجهة', 'An alert you switched on'),
      where: pick(locale, 'جداول التذكير والدفع', 'Reminder and push tables'),
    },
    {
      what: pick(locale, 'اللغة والمظهر والمنطقة الزمنية', 'Language, theme, and timezone'),
      why: pick(locale, 'برنامج اليوم كما اخترته', 'The matchday programme as you set it'),
      where: pick(locale, 'كوكي + تخزين محلي', 'Cookie and local storage'),
    },
    {
      what: pick(locale, 'عنوان تقريبي للطلب وسجلات الأخطاء', 'Approximate request address and error logs'),
      why: pick(locale, 'حماية الخدمة وحدّ الإساءة', 'To protect the service and stop abuse'),
      where: pick(locale, 'سجلات التشغيل لفترة محدودة', 'Operational logs for a limited time'),
    },
  ];

  const cookies = [
    {
      name: 'yalla-locale',
      life: pick(locale, 'سنة', '1 year'),
      role: pick(locale, 'لغة الواجهة (عربي / إنجليزي).', 'Interface language (Arabic / English).'),
    },
    {
      name: 'yalla-theme',
      life: pick(locale, 'سنة', '1 year'),
      role: pick(locale, 'المظهر الفاتح أو الداكن.', 'Light or dark theme.'),
    },
    {
      name: 'yalla-tz',
      life: pick(locale, 'سنة', '1 year'),
      role: pick(locale, 'منطقتك الزمنية لبرنامج المباريات.', 'Your timezone for the match programme.'),
    },
    {
      name: pick(locale, 'جلسة Auth.js', 'Auth.js session'),
      life: pick(locale, 'مدة الجلسة', 'Session lifetime'),
      role: pick(
        locale,
        'إبقاؤك مسجّلاً. الاسم الشائع authjs.session-token، أو النسخة الآمنة __Secure- على HTTPS.',
        'Keeps you signed in. Commonly named authjs.session-token, or the __Secure- form on HTTPS.'
      ),
    },
  ];

  const storage = [
    {
      name: 'yalla-cookie-consent',
      role: pick(
        locale,
        'ليس كوكياً. مفتاح في localStorage يُسجّل أنك أغلقت شريط ملفات الارتباط.',
        'Not a cookie. A localStorage key recording that you dismissed the cookie bar.'
      ),
    },
    {
      name: 'yalla-data-saver',
      role: pick(locale, 'وضع توفير البيانات لتحديث النتائج.', 'Data-saver mode for score refresh.'),
    },
    {
      name: 'yalla-timezone',
      role: pick(
        locale,
        'اختيار المنطقة الزمنية (تلقائي أو يدوي)، إلى جانب كوكي yalla-tz.',
        'Timezone choice (auto or manual), alongside the yalla-tz cookie.'
      ),
    },
  ];

  const processors = [
    {
      who: pick(locale, 'غوغل', 'Google'),
      for: pick(locale, 'الدخول الوحيد إلى الحساب.', 'The only sign-in to the account.'),
    },
    {
      who: pick(locale, 'مزود البيانات الرياضية (API-Football عبر RapidAPI)', 'Sports-data provider (API-Football via RapidAPI)'),
      for: pick(locale, 'النتائج والجداول والأحداث المعروضة.', 'Scores, tables, and events shown on the desk.'),
    },
    {
      who: pick(locale, 'طبقة التخزين المؤقت (Upstash Redis)', 'Cache layer (Upstash Redis)'),
      for: pick(locale, 'التغذية الحية وحدّ الطلبات المسيئة.', 'The live feed and rate-limiting hostile requests.'),
    },
    {
      who: pick(locale, 'مزود البريد (Resend أو SendGrid إن وُجد المفتاح)', 'Mail provider (Resend or SendGrid if a key is set)'),
      for: pick(locale, 'إيصال رسالة المكتب عندما تُرسل فعلاً.', 'Delivering a desk message when one is actually sent.'),
    },
    {
      who: pick(locale, 'مشغّل الاستضافة وقاعدة البيانات', 'The hosting operator and the database'),
      for: pick(locale, 'تشغيل الصفحة وحفظ الحساب والتعليق والتوقع.', 'Running the site and storing the account, comment, and prediction.'),
    },
  ];

  const rights = [
    pick(locale, 'الاطلاع: اطلب نسخة مما نحفظه عن حسابك عبر البريد.', 'Access: ask by mail for a copy of what we hold on your account.'),
    pick(locale, 'التصحيح: حدّث الاسم الظاهر من غوغل، أو اكتب لنا إن بقي خطأ.', 'Correction: update the visible name via Google, or write if an error remains.'),
    pick(locale, 'الحذف: اطلب حذف الحساب. نزيل التفضيلات والتعليقات المرتبطة، مع ما قد يبقى في نسخة احتياطية تشغيلية لفترة محدودة.', 'Deletion: ask to delete the account. Linked preferences and comments go with it, subject to operational backups for a limited time.'),
    pick(locale, 'المتابعة: احذف المفضلة من الواجهة دون انتظار رد.', 'Follows: unfollow from the interface without waiting for a reply.'),
    pick(locale, 'التنبيه: أوقف إشعارات المتصفح من إعداداته، وألغِ تذكير المباراة من الصفحة.', 'Alerts: stop browser notifications in the browser, and cancel a match reminder on the page.'),
    pick(locale, 'الاعتراض: اكتب إن رأيت استخداماً لا يطابق هذا السجل.', 'Objection: write if you see a use that does not match this ledger.'),
  ];

  return (
    <article className="vault-house is-vault">
      <div className="vault-sheet">
        <header className="vault-mast">
          <div className="vault-mast-row">
            <div className="vault-brand">
              <BrandMark size={36} priority />
              <div>
                <p className="vault-kicker">{pick(locale, 'خزنة الخصوصية · يلا سبورت', 'Privacy vault · Yalla Sport')}</p>
                <p className="vault-meta">
                  YS-L01 · {pick(locale, 'صك رقم', 'Instrument')} 01 · {date}
                </p>
              </div>
            </div>
            <p className="vault-stamp">{pick(locale, 'نسخة الملعب', 'Pitch edition')}</p>
          </div>

          <h1 className="vault-title">{pick(locale, 'سياسة الخصوصية', 'Privacy Policy')}</h1>
          <p className="vault-standfirst">
            {pick(
              locale,
              'هذا السجل يصف ما نجمعه فعلاً لتشغيل يلا سبورت، ولماذا، وأين يُحفظ، ومن يعالجه. لا بيع للحسابات، ولا مسؤول حماية بيانات باسم شخص لم نعيّنه، ولا سجل تجاري مخترع، ولا كوكي إعلان طرف ثالث في هذا الدفتر.',
              'This ledger describes what Yalla Sport actually collects, why, where it is kept, and who processes it. No sale of accounts, no named data-protection officer we have not appointed, no invented company registry, and no third-party advertising cookie in this book.'
            )}
          </p>

          <ul className="vault-seals">
            <li>{pick(locale, 'لا بيع للبيانات', 'No data sale')}</li>
            <li>{pick(locale, 'غوغل فقط للدخول', 'Google sign-in only')}</li>
            <li>{pick(locale, 'كوكي باسمه الحقيقي', 'Cookies by real name')}</li>
            <li>{pick(locale, 'الموافقة شريط محلي لا كوكي', 'Consent is local, not a cookie')}</li>
          </ul>

          <nav className="vault-doors" aria-label={pick(locale, 'دفتر القوانين', 'Legal ledger')}>
            {LEGAL_NAV.map((item) => {
              const active = item.href === '/privacy';
              return (
                <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined}>
                  <span>{item.code}</span>
                  {pick(locale, item.ar, item.en)}
                </Link>
              );
            })}
          </nav>
        </header>

        <div className="vault-body">
          <aside className="vault-index">
            <p>{pick(locale, 'فهرس المواد', 'Article index')}</p>
            <ol>
              {TOC.map((item, index) => (
                <li key={item.id}>
                  <a href={`#${item.id}`}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    {pick(locale, item.ar, item.en)}
                  </a>
                </li>
              ))}
            </ol>
          </aside>

          <div className="vault-copy">
            <section id="who" className="vault-article">
              <h2>
                <span>01</span>
                {pick(locale, 'من نحن', 'Who we are')}
              </h2>
              <p>
                {pick(
                  locale,
                  'يلا سبورت منصة نتائج وأخبار كرة قدم على yalla-sport.com. المكتب يصل عبر البريد أدناه. لا ندّعي مقراً قضائياً باسم مدينة لم نعلنها، ولا مسؤولاً عن حماية البيانات باسم شخص لم يُعيَّن في هذه الصفحة.',
                  'Yalla Sport is a football scores and news desk at yalla-sport.com. The desk is reached at the mail below. We do not invent a court city we have not named, and we do not invent a data-protection officer who is not appointed on this page.'
                )}
              </p>
              <p>
                {pick(
                  locale,
                  'إن تعارض ملخص تسويقي أو شريط في التذييل مع هذا السجل، يُعتدّ بالنص الظاهر هنا وبتاريخ النسخة في الرأس.',
                  'If a marketing line or a footer chip conflicts with this ledger, the text on this page and the edition date in the masthead prevail.'
                )}
              </p>
            </section>

            <section id="inventory" className="vault-article">
              <h2>
                <span>02</span>
                {pick(locale, 'سجل البيانات', 'Data inventory')}
              </h2>
              <p>
                {pick(
                  locale,
                  'الجدول التالي جرد لما نلمسه فعلاً. إن لم تستخدم الحساب، يبقى من ذلك ما يلزم لتشغيل اللغة والمظهر والمنطقة الزمنية على جهازك.',
                  'The table is an inventory of what we actually touch. If you never sign in, what remains is what the device needs for language, theme, and timezone.'
                )}
              </p>
              <div className="vault-scroll">
                <table className="vault-table">
                  <thead>
                    <tr>
                      <th>{pick(locale, 'المادة', 'Item')}</th>
                      <th>{pick(locale, 'الغرض', 'Purpose')}</th>
                      <th>{pick(locale, 'المكان', 'Where')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((row) => (
                      <tr key={row.what}>
                        <td>{row.what}</td>
                        <td>{row.why}</td>
                        <td>{row.where}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section id="account" className="vault-article">
              <h2>
                <span>03</span>
                {pick(locale, 'الحساب وغوغل', 'Account and Google')}
              </h2>
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
            </section>

            <section id="cookies" className="vault-article">
              <h2>
                <span>04</span>
                {pick(locale, 'ملفات الارتباط', 'Cookies')}
              </h2>
              <p>
                {pick(
                  locale,
                  'هذه الأسماء مستخدمة في المنصة، لا قائمة عامة منسوخة من قالب قانوني. بدونها لا تعمل اللغة والمظهر والجلسة كما صُمّمت.',
                  'These names are used on the platform, not copied from a generic legal template. Without them, language, theme, and session do not work as designed.'
                )}
              </p>
              <div className="vault-scroll">
                <table className="vault-table">
                  <thead>
                    <tr>
                      <th>{pick(locale, 'الاسم', 'Name')}</th>
                      <th>{pick(locale, 'المدة', 'Life')}</th>
                      <th>{pick(locale, 'العمل', 'Job')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cookies.map((row) => (
                      <tr key={row.name}>
                        <td>
                          <code>{row.name}</code>
                        </td>
                        <td>{row.life}</td>
                        <td>{row.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section id="storage" className="vault-article">
              <h2>
                <span>05</span>
                {pick(locale, 'التخزين المحلي', 'Local storage')}
              </h2>
              <p>
                {pick(
                  locale,
                  'بعض الاختيارات تُحفظ في المتصفح لا كملف ارتباط. شريط الموافقة نفسه لا يزرع كوكياً باسم الموافقة.',
                  'Some choices live in the browser, not as a cookie. The consent bar itself does not plant a cookie named after consent.'
                )}
              </p>
              <ul className="vault-list">
                {storage.map((row) => (
                  <li key={row.name}>
                    <code>{row.name}</code>
                    <span>{row.role}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section id="sports" className="vault-article">
              <h2>
                <span>06</span>
                {pick(locale, 'البيانات الرياضية', 'Sports data')}
              </h2>
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
            </section>

            <section id="stream" className="vault-article">
              <h2>
                <span>07</span>
                {pick(locale, 'البث والجغرافيا', 'Streaming and geo')}
              </h2>
              <p>
                {pick(
                  locale,
                  'إن كان البث معطّلاً في الإعداد، لا يُطلب بلد للمشاهدة ولا تُحفظ أسرار تشغيل. إن فُعّل البث، قد يُستنتج بلد تقريبي من ترويسة الطلب لمعرفة إن كان الأصل المرخّص مسموحاً في منطقتك. هذا ليس تتبعاً إعلانياً.',
                  'If streaming is off in configuration, no country is asked for playback and no playback secrets are stored. If streaming is on, an approximate country may be read from the request header to see whether a licensed asset is allowed in your territory. That is not advertising tracking.'
                )}
              </p>
              <p>
                {pick(
                  locale,
                  'لا بث بلا أصل مرخّص. أسرار واجهة التشغيل لا تُحفظ في قاعدة البيانات.',
                  'There is no stream without a licensed asset. Playback secrets are not stored in the database.'
                )}
              </p>
            </section>

            <section id="use" className="vault-article">
              <h2>
                <span>08</span>
                {pick(locale, 'كيف نستخدم البيانات', 'How we use data')}
              </h2>
              <ul className="vault-list">
                <li>
                  <span>
                    {pick(
                      locale,
                      'تشغيل الحساب وعرض البرنامج بلغتك وفي منطقتك الزمنية.',
                      'To run the account and show the programme in your language and timezone.'
                    )}
                  </span>
                </li>
                <li>
                  <span>
                    {pick(
                      locale,
                      'حفظ المتابعات والتوقعات والتعليقات ورسائل المكتب التي كتبتها.',
                      'To keep follows, predictions, comments, and desk messages you wrote.'
                    )}
                  </span>
                </li>
                <li>
                  <span>
                    {pick(
                      locale,
                      'إرسال تنبيه مباراة طلبته، لا رسائل ترويجية مخترعة.',
                      'To send a match alert you asked for — not invented promotional mail.'
                    )}
                  </span>
                </li>
                <li>
                  <span>
                    {pick(
                      locale,
                      'صدّ الإساءة، ومراجعة التعليق، وحدّ الطلبات المسيئة لواجهات البرمجة.',
                      'To stop abuse, moderate comments, and rate-limit hostile API use.'
                    )}
                  </span>
                </li>
              </ul>
            </section>

            <section id="processors" className="vault-article">
              <h2>
                <span>09</span>
                {pick(locale, 'المعالجون', 'Processors')}
              </h2>
              <p>
                {pick(
                  locale,
                  'لا نبيع الحساب. الجهات التالية قد تعالج ما يلزم لتشغيل الخدمة، كلٌّ في حدود عمله:',
                  'We do not sell the account. The following may process what is needed to run the service, each within its job:'
                )}
              </p>
              <ul className="vault-processors">
                {processors.map((row) => (
                  <li key={row.who}>
                    <strong>{row.who}</strong>
                    <span>{row.for}</span>
                  </li>
                ))}
              </ul>
              <p>
                {pick(
                  locale,
                  'إن ألزمنا القانون، نكشف الحد الأدنى للجهة المختصة. لا نضمّن في هذا السجل أداة تحليلات إعلانية غير موصولة في الشفرة.',
                  'If the law requires it, we disclose the minimum to the competent authority. This ledger does not include an advertising analytics tool that is not wired in the code.'
                )}
              </p>
            </section>

            <section id="sale" className="vault-article">
              <h2>
                <span>10</span>
                {pick(locale, 'البيع والإعلان', 'Sale and ads')}
              </h2>
              <p>
                {pick(
                  locale,
                  'لا نبيع بيانات الحساب ولا نؤجّرها. قد توجد مساحات إعلان طرف أول في التصميم؛ هذا السجل لا يضع كوكي إعلان لطرف ثالث. إن وصل إعلان خارجي لاحقاً، يُذكر هنا باسمه قبل تشغيله كأنه أمر واقع.',
                  'We do not sell or rent account data. First-party ad placements may exist in the design; this ledger does not set a third-party advertising cookie. If an external ad later arrives, it will be named here before it is treated as a fact.'
                )}
              </p>
            </section>

            <section id="rights" className="vault-article">
              <h2>
                <span>11</span>
                {pick(locale, 'حقوقك', 'Your rights')}
              </h2>
              <ol className="vault-rights">
                {rights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
              <p>
                {pick(
                  locale,
                  'لا نعد بمهلة ساعات مخترعة للرد. نقرأ البريد ونرد حين يُعالج الطلب.',
                  'We do not invent an hours-long reply SLA. We read the mail and reply when the request is handled.'
                )}
              </p>
            </section>

            <section id="keep" className="vault-article">
              <h2>
                <span>12</span>
                {pick(locale, 'الاحتفاظ', 'Retention')}
              </h2>
              <p>
                {pick(
                  locale,
                  'نحتفظ بالحساب ما دام نشطاً. التعليق والتوقع ورسالة المكتب تبقى ما بقي الحساب، أو إلى أن تُحذف للمخالفة. سجلات التشغيل تُحفظ للمدة اللازمة للأمان والقانون ثم تُزال أو تُختصر.',
                  'We keep the account while it is active. A comment, prediction, or desk message stays while the account stays, or until it is removed for a violation. Operational logs are kept as needed for security and law, then dropped or reduced.'
                )}
              </p>
            </section>

            <section id="security" className="vault-article">
              <h2>
                <span>13</span>
                {pick(locale, 'الأمان', 'Security')}
              </h2>
              <p>
                {pick(
                  locale,
                  'النقل مشفّر، والوصول إلى الإدارة مقيّد بالدور، وواجهات الكتابة محدودة المعدل. لا توجد حماية مطلقة على الشبكة، ولا شهادة أمنية نعلقها هنا دون تدقيق منشور.',
                  'Transport is encrypted, admin access is role-gated, and write routes are rate-limited. No network service is perfectly secure, and we do not hang a security badge here without a published audit.'
                )}
              </p>
            </section>

            <section id="kids" className="vault-article">
              <h2>
                <span>14</span>
                {pick(locale, 'الأطفال', 'Children')}
              </h2>
              <p>
                {pick(
                  locale,
                  'المنصة غير موجّهة لمن دون سنّ يؤهّل لفتح حساب بمفرده في بلدك. إن علمنا بحساب لطفل دون ذلك، نحذفه بعد تحقق معقول.',
                  'The platform is not directed at anyone below the age that can open an account alone in your country. If we learn of such an account, we delete it after reasonable verification.'
                )}
              </p>
            </section>

            <section id="change" className="vault-article">
              <h2>
                <span>15</span>
                {pick(locale, 'تعديل هذا السجل', 'Changes to this ledger')}
              </h2>
              <p>
                {pick(
                  locale,
                  'إن تغيّر السجل جوهرياً نحدّث تاريخ النسخة في الرأس. الاستمرار بعد التحديث يعني أنك قرأت النسخة الظاهرة، لا نسخة قديمة في ذاكرتك.',
                  'If this ledger changes in substance we update the edition date in the masthead. Continuing after an update means you have read the version on the page, not an older one in memory.'
                )}
              </p>
            </section>

            <section id="mail" className="vault-article">
              <h2>
                <span>16</span>
                {pick(locale, 'التواصل', 'Contact')}
              </h2>
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
            </section>
          </div>
        </div>

        <footer className="vault-foot">
          <p>
            {pick(locale, 'صك الخصوصية', 'Privacy instrument')} · YS-L01 · {date}
          </p>
          <p>
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
        </footer>
      </div>
    </article>
  );
}
