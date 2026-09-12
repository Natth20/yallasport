import { BrandMark } from '@/components/brand/BrandMark';
import { LEGAL_NAV } from '@/components/legal/LegalDesk';
import { Link } from '@/i18n/navigation';
import { pick } from '@/i18n/pick';
import { CONTACT_EMAIL } from '@/lib/seo/site';

const TOC = [
  { id: 'agree', ar: 'القبول', en: 'Agreement' },
  { id: 'words', ar: 'التعاريف', en: 'Definitions' },
  { id: 'desk', ar: 'المكتب', en: 'The desk' },
  { id: 'licence', ar: 'الرخصة لك', en: 'Your licence' },
  { id: 'account', ar: 'الحساب', en: 'Account' },
  { id: 'scores', ar: 'النتائج', en: 'Scores' },
  { id: 'news', ar: 'الأخبار', en: 'News' },
  { id: 'watch', ar: 'البث', en: 'Streaming' },
  { id: 'play', ar: 'التوقعات', en: 'Predictions' },
  { id: 'speech', ar: 'التعليقات', en: 'Comments' },
  { id: 'forbid', ar: 'المحظور', en: 'Forbidden use' },
  { id: 'ip', ar: 'الملكية', en: 'Intellectual property' },
  { id: 'links', ar: 'الروابط', en: 'Links' },
  { id: 'uptime', ar: 'التوفر', en: 'Availability' },
  { id: 'limit', ar: 'المسؤولية', en: 'Liability' },
  { id: 'privacy', ar: 'الخصوصية', en: 'Privacy' },
  { id: 'end', ar: 'الإنهاء', en: 'Termination' },
  { id: 'law', ar: 'القانون', en: 'Law' },
  { id: 'change', ar: 'التعديل', en: 'Changes' },
] as const;

export function TermsDeed({ locale }: { locale: string }) {
  const date = pick(locale, '11 سبتمبر 2026', '11 September 2026');

  const words = [
    {
      term: pick(locale, '«المنصة» / «الملعب»', '“Platform” / “pitch”'),
      meaning: pick(locale, 'موقع يلا سبورت على yalla-sport.com وما يتفرع عنه من صفحات واجهات.', 'The Yalla Sport site at yalla-sport.com and the pages that hang from it.'),
    },
    {
      term: pick(locale, '«المكتب»', '“Desk”'),
      meaning: pick(locale, 'التحرير والتشغيل المسؤول عن اعتماد الخبر وتشغيل النتائج.', 'The editorial and operations side that approves news and runs the scores.'),
    },
    {
      term: pick(locale, '«أنت»', '“You”'),
      meaning: pick(locale, 'الزائر أو صاحب الحساب الذي يستخدم المنصة.', 'The visitor or account holder using the platform.'),
    },
    {
      term: pick(locale, '«المصدر»', '“Source”'),
      meaning: pick(locale, 'مزود البيانات الرياضية أو صاحب الحق في الخبر أو أصل البث، لا شائعة على الشبكة.', 'The sports-data provider, the rights holder in a story, or a licensed playback asset — not a rumour on the network.'),
    },
    {
      term: pick(locale, '«التوقع»', '“Prediction”'),
      meaning: pick(locale, 'تخمين نتيجة مباراة مسجّلة لدينا داخل الحساب. ليس رهاناً وليس عقداً مالياً.', 'Guessing a fixture we hold, inside the account. Not a bet and not a financial contract.'),
    },
  ];

  const youDo = [
    pick(locale, 'تدخل وأنت قابل لهذا العقد ولسجل الخصوصية وحقوق النشر.', 'You enter having accepted this deed and the privacy and copyright ledgers.'),
    pick(locale, 'تحفظ سرّ جلسة غوغل ولا تفتح حساباً باسم غيرك.', 'You keep the Google session private and do not open an account in someone else’s name.'),
    pick(locale, 'لا تعتمد على الشاشة وحدها لقرار مالي أو قانوني.', 'You do not rely on the screen alone for a financial or legal decision.'),
    pick(locale, 'لا تكشط الجداول ولا تعيد بيع التغذية كخدمة.', 'You do not scrape tables or resell the feed as a service.'),
    pick(locale, 'تكتب التعليق باسمك وتتحمّل معناه.', 'You write a comment in your name and own its meaning.'),
  ];

  const weDo = [
    pick(locale, 'نعرض الرقم بعد وصوله من المصدر، ونترك الفراغ فارغاً إن غاب.', 'We show a figure after it arrives from the source, and leave a gap empty if it is missing.'),
    pick(locale, 'ننشر الخبر بعد اعتماد تحريري، لا مسودة المراجعة.', 'We publish news after editorial approval, not the review draft.'),
    pick(locale, 'لا نفتح بثاً بلا أصل مرخّص، ولا ندلّ على مصدر غير مرخّص.', 'We do not open a stream without a licensed asset, and we do not point to an unlicensed source.'),
    pick(locale, 'نوقف حساباً يسيء أو يحتال أو ينتحل صفة المكتب.', 'We may suspend an account that abuses, defrauds, or impersonates the desk.'),
    pick(locale, 'لا نعد بتزامن لحظي مع كل صافرة، ولا بجائزة نقدية على النقاط.', 'We do not promise instant alignment with every whistle, or a cash prize on points.'),
  ];

  const forbid = [
    pick(locale, 'كشط الجداول أو التغذية الحية لإعادة بيعها أو بناء خدمة منافسة عليها.', 'Scraping tables or the live feed to resell them or to build a competing service on them.'),
    pick(locale, 'تجاوز حدود الطلب أو محاولة دخول الإدارة دون دور.', 'Bypassing rate limits or attempting admin access without a role.'),
    pick(locale, 'زرع برمجيات ضارة، أو اختبار اختراق دون إذن مكتوب من المكتب.', 'Planting malware, or running an intrusion test without written permission from the desk.'),
    pick(locale, 'انتحال التحرير، أو نشر خبر كأنه صادر عن يلا سبورت وهو ليس كذلك.', 'Impersonating the desk, or circulating a story as if Yalla Sport issued it when it did not.'),
    pick(locale, 'استخدام التوقعات كواجهة قمار أو جمع أموال على النقاط.', 'Using predictions as a gambling front or collecting money against points.'),
    pick(locale, 'إعادة نشر ملف خبر كامل كخدمة موازية، بعد الاقتباس القصير المسموح.', 'Republishing a full news file as a parallel service, beyond the short quotation that is allowed.'),
  ];

  return (
    <article className="deed-house is-deed">
      <header className="deed-night">
        <div className="deed-night-inner">
          <div className="deed-night-row">
            <p className="deed-kicker">{pick(locale, 'عقد الاستخدام · الملعب', 'Deed of use · the pitch')}</p>
            <p className="deed-code">YS-L02 · {pick(locale, 'المادة الحاكمة', 'Governing instrument')}</p>
          </div>
          <h1 className="deed-title">{pick(locale, 'شروط الاستخدام', 'Terms of Use')}</h1>
          <p className="deed-lead">
            {pick(
              locale,
              'الدخول إلى الملعب قبول لهذا العقد. إن لم توافق، أغلق الصفحة. النص هنا يعلو أي شعار تسويقي. لا بث بلا ترخيص، ولا نتيجة بلا مصدر، ولا قمار على التوقع.',
              'Entering the pitch is acceptance of this deed. If you do not agree, leave the page. This text outranks any marketing line. No stream without a licence, no score without a source, and predictions are not a wager.'
            )}
          </p>
          <p className="deed-date">
            {pick(locale, 'آخر تحديث', 'Last updated')} · {date}
          </p>

          <nav className="deed-doors" aria-label={pick(locale, 'دفتر القوانين', 'Legal ledger')}>
            {LEGAL_NAV.map((item) => {
              const active = item.href === '/terms';
              return (
                <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined}>
                  <em>{item.code}</em>
                  {pick(locale, item.ar, item.en)}
                </Link>
              );
            })}
          </nav>

          <ol className="deed-rail">
            {TOC.map((item, index) => (
              <li key={item.id}>
                <a href={`#${item.id}`}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  {pick(locale, item.ar, item.en)}
                </a>
              </li>
            ))}
          </ol>
        </div>
      </header>

      <div className="deed-stage">
        <div className="deed-under" aria-hidden="true" />
        <div className="deed-indenture">
          <div className="deed-indenture-head">
            <div className="deed-brand">
              <BrandMark size={34} priority />
              <div>
                <p>YALLA SPORT</p>
                <p>{pick(locale, 'صك ثنائي اللغة · غير قابل للاختزال إلى شعار', 'Bilingual deed · not reducible to a slogan')}</p>
              </div>
            </div>
            <p className="deed-wafer">{pick(locale, 'يُقرأ كاملاً', 'Read in full')}</p>
          </div>

          <section id="agree" className="deed-article">
            <h2>
              <span>01</span>
              {pick(locale, 'القبول', 'Agreement')}
            </h2>
            <p>
              {pick(
                locale,
                'باستخدام يلا سبورت أنت توافق على هذه الشروط وعلى سجل الخصوصية وحقوق النشر. إن تعارض سطر في صفحة أخرى مع هذا العقد، يُعتدّ بالعقد. الاستخدام بعد تحديث التاريخ في الرأس قبول للنسخة الظاهرة.',
                'By using Yalla Sport you agree to these terms and to the privacy and copyright ledgers. If a line on another page conflicts with this deed, the deed prevails. Use after the masthead date is updated is acceptance of the version on the page.'
              )}
            </p>
          </section>

          <section id="words" className="deed-article">
            <h2>
              <span>02</span>
              {pick(locale, 'التعاريف', 'Definitions')}
            </h2>
            <dl className="deed-words">
              {words.map((row) => (
                <div key={row.term}>
                  <dt>{row.term}</dt>
                  <dd>{row.meaning}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section id="desk" className="deed-article">
            <h2>
              <span>03</span>
              {pick(locale, 'ما يقدّمه المكتب وما لا يقدّمه', 'What the desk is and is not')}
            </h2>
            <p>
              {pick(
                locale,
                'نوفّر برنامج مباريات، نتائج وجداول عند وصولها، أخباراً معتمدة، وصفحة بثوث. الخدمة أداة إعلام رياضي. ليست وكالة مراهنات، وليست ناشراً لكل خبر يدور على الشبكة، وليست ضماناً أن المباراة تُبث لأن الخبر نُشر.',
                'We provide a match programme, scores and tables when they arrive, approved news, and a broadcasts page. The service is a sports desk. It is not a betting desk, not a publisher of every rumour on the network, and not a promise that a match is streaming because a story ran.'
              )}
            </p>

            <div className="deed-duties">
              <div>
                <p>{pick(locale, 'عليك', 'You')}</p>
                <ul>
                  {youDo.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p>{pick(locale, 'على المكتب', 'The desk')}</p>
                <ul>
                  {weDo.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section id="licence" className="deed-article">
            <h2>
              <span>04</span>
              {pick(locale, 'رخصة الاستخدام', 'Licence to use')}
            </h2>
            <p>
              {pick(
                locale,
                'نمنحك رخصة شخصية غير حصرية وغير قابلة للتحويل لتصفح المنصة لاستخدامك الخاص. لا تُمنح رخصة لإعادة بيع البيانات، ولا لتشغيل واجهة فوق التغذية، ولا لنسخ التصميم كخدمة موازية.',
                'We grant a personal, non-exclusive, non-transferable licence to browse the platform for your own use. It is not a licence to resell the data, to run an interface on top of the feed, or to copy the design as a parallel service.'
              )}
            </p>
          </section>

          <section id="account" className="deed-article">
            <h2>
              <span>05</span>
              {pick(locale, 'الحساب', 'Your account')}
            </h2>
            <p>
              {pick(
                locale,
                'الدخول عبر غوغل فقط. أنت مسؤول عن سرية تلك الجلسة وعن كل نشاط من الحساب. لا تفتح حساباً باسم غيرك. يحق لنا إيقاف حساب يسيء، يحتال، يكرر الطلبات لإسقاط الخدمة، أو ينتحل صفة التحرير.',
                'Sign-in is Google only. You are responsible for keeping that session private and for activity on the account. Do not open an account in someone else’s name. We may suspend an account that abuses, defrauds, floods the service, or impersonates the desk.'
              )}
            </p>
            <p>
              {pick(
                locale,
                'دور المشرف أو الإدارة امتياز داخلي لا يحوّل صاحبه إلى متحدث رسمي خارج الصفحة إلا بما يُنشر باسم المكتب.',
                'A moderator or admin role is an internal privilege. It does not make the holder an official spokesperson off the page except for what is published in the desk’s name.'
              )}
            </p>
          </section>

          <section id="scores" className="deed-article">
            <h2>
              <span>06</span>
              {pick(locale, 'النتائج والإحصائيات', 'Scores and statistics')}
            </h2>
            <p>
              {pick(
                locale,
                'الأرقام تأتي من مزود خارجي وقد تتأخر أو تُصحَّح لاحقاً. غياب الرقم ليس صفراً مخترعاً. المقارنة بين لاعبين أو فريقين تُبنى على ما وصل من المصدر؛ إن نقص صفّ تُرك ناقصاً.',
                'Figures come from an external provider and may lag or later be corrected. A missing figure is not an invented zero. A comparison of players or sides is built from what arrived; if a row is thin, it stays thin.'
              )}
            </p>
          </section>

          <section id="news" className="deed-article">
            <h2>
              <span>07</span>
              {pick(locale, 'الأخبار', 'News')}
            </h2>
            <p>
              {pick(
                locale,
                'ما يُنشر في قسم الأخبار بعد اعتماد تحريري. المواد قيد المراجعة لا تُعرض للقرّاء. الاقتباس القصير مسموح مع ذكر يلا سبورت ورابط الصفحة. إعادة نشر الملف كاملاً كخدمة منافسة غير مسموحة.',
                'News appears after editorial approval. Items under review are not shown to readers. Short quotation is allowed with credit to Yalla Sport and a link to the page. Republishing the whole file as a competing service is not allowed.'
              )}
            </p>
          </section>

          <section id="watch" className="deed-article">
            <h2>
              <span>08</span>
              {pick(locale, 'البث', 'Streaming')}
            </h2>
            <p>
              {pick(
                locale,
                'المشاهدة فقط عند أصل مرخّص، وترخيص نشط، وجغرافيا مسموحة، ومستوى اشتراك إن طُلب. إن كان البث معطّلاً في الإعداد، لن يظهر زر مشاهدة. لا نوفّر ولا ندلّ على مصادر غير مرخّصة، ولا نعد ببث كل مباراة ذُكرت في الخبر.',
                'Watching exists only with a licensed asset, an active licence, an allowed territory, and a required subscription tier if any. If streaming is disabled in configuration, no Watch button appears. We do not provide or point to unlicensed sources, and we do not promise a stream for every match mentioned in a story.'
              )}
            </p>
          </section>

          <section id="play" className="deed-article">
            <h2>
              <span>09</span>
              {pick(locale, 'التوقعات والنقاط', 'Predictions and points')}
            </h2>
            <p>
              {pick(
                locale,
                'توقّع نتيجة مباراة مسجّلة لدينا نشاط ترفيهي داخل الحساب. النقاط على لوحة المتصدرين ليست مالاً، وليست جائزة نقدية معلنة، وليست دعوة للمقامرة، وليست أداة لتسوية رهان بين أطراف.',
                'Predicting a fixture we hold is an in-account pastime. Leaderboard points are not money, not a declared cash prize, not an invitation to gamble, and not a tool for settling a wager between parties.'
              )}
            </p>
            <p>
              {pick(
                locale,
                'حفظ التوقع يستبدل التوقع السابق لنفس المباراة إن وُجد. لا محرّك نقاط معلن كجائزة، ولا رصيد يُسحب.',
                'Saving a prediction replaces the previous one for that match if it exists. There is no published points engine as a prize, and no balance you can withdraw.'
              )}
            </p>
          </section>

          <section id="speech" className="deed-article">
            <h2>
              <span>10</span>
              {pick(locale, 'التعليقات', 'Comments')}
            </h2>
            <p>
              {pick(
                locale,
                'التعليق باسمك ومسؤوليتك. يُمنع السب، والتحريض، والسبام، وانتحال المصدر. يمكننا حذف المخالف دون إشعار، وقد نوقف الحساب. فلتر الكلمات ليس ضماناً لكل إساءة.',
                'A comment is in your name and on you. Abuse, incitement, spam, and impersonation of a source are forbidden. We may remove violating copy without notice, and we may suspend the account. The word filter is not a guarantee against every insult.'
              )}
            </p>
          </section>

          <section id="forbid" className="deed-article">
            <h2>
              <span>11</span>
              {pick(locale, 'الاستخدام المحظور', 'Forbidden use')}
            </h2>
            <ol className="deed-forbid">
              {forbid.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </section>

          <section id="ip" className="deed-article">
            <h2>
              <span>12</span>
              {pick(locale, 'الملكية الفكرية', 'Intellectual property')}
            </h2>
            <p>
              {pick(
                locale,
                'اسم يلا سبورت، والتصميم، والتحرير المعتمد ملك للمكتب في حدود ما أنتجناه. شعارات الأندية، وأسماء اللاعبين، وبيانات النتائج، وأصول البث تبقى لأصحابها. التفاصيل في سجل حقوق النشر.',
                'The Yalla Sport name, the design, and approved editorial copy belong to the desk insofar as we made them. Club marks, player names, score data, and playback assets remain with their owners. Detail lives in the copyright ledger.'
              )}
            </p>
          </section>

          <section id="links" className="deed-article">
            <h2>
              <span>13</span>
              {pick(locale, 'روابط الغير', 'Third-party links')}
            </h2>
            <p>
              {pick(
                locale,
                'قد يشير خبر أو صفحة إلى موقع خارجي. ذلك الرابط ليس ضماناً لمحتواه ولا شراكة معلنة لمجرد وجوده. شروط ذلك الموقع تخصّه.',
                'A story or a page may point off-site. That link is not a warranty of the destination, and not a declared partnership merely because it exists. That site’s terms are its own.'
              )}
            </p>
          </section>

          <section id="uptime" className="deed-article">
            <h2>
              <span>14</span>
              {pick(locale, 'التوفر والصيانة', 'Availability')}
            </h2>
            <p>
              {pick(
                locale,
                'قد تنقطع الخدمة للصيانة أو لعطل في المزود أو في الشبكة. لا نعلن نسبة توفر سنوية في هذا العقد، ولا نعد بأن التغذية الحية لا تسكت دقيقة.',
                'The service may pause for maintenance, a provider fault, or the network. This deed does not declare an annual uptime percentage, and it does not promise that the live feed never goes quiet.'
              )}
            </p>
          </section>

          <section id="limit" className="deed-article">
            <h2>
              <span>15</span>
              {pick(locale, 'حدود المسؤولية', 'Limits of liability')}
            </h2>
            <p>
              {pick(
                locale,
                'الموقع يُقدَّم كما هو. لا نضمن تزامناً لحظياً مع كل صافرة، ولا توفر بث في كل دقيقة. في حدود ما يسمح به القانون، لا نتحمّل خسائر ناتجة عن اعتمادك على رقم أو عن انقطاع الخدمة. هذا ليس إعفاءً من الغش أو الضرر العمدي حيث يمنعه القانون.',
                'The site is provided as is. We do not guarantee instant alignment with every whistle, or a stream in every minute. To the extent the law allows, we are not liable for losses from relying on a figure or from downtime. This is not a waiver of fraud or wilful harm where the law forbids that waiver.'
              )}
            </p>
          </section>

          <section id="privacy" className="deed-article">
            <h2>
              <span>16</span>
              {pick(locale, 'الخصوصية جزء من العقد', 'Privacy is part of this deed')}
            </h2>
            <p>
              {pick(
                locale,
                'سجل الخصوصية يشرح ما يُجمع وكيف. استخدام المنصة قبول لذلك السجل أيضاً. لطلب الاطلاع أو الحذف: البريد أدناه، لا نموذج وهمي في هذه الصفحة.',
                'The privacy ledger explains what is collected and how. Using the platform is also acceptance of that ledger. For access or deletion: the mail below, not a dummy form on this page.'
              )}{' '}
              <Link href="/privacy">{pick(locale, 'اقرأ سجل الخصوصية', 'Read the privacy ledger')}</Link>
            </p>
          </section>

          <section id="end" className="deed-article">
            <h2>
              <span>17</span>
              {pick(locale, 'الإنهاء', 'Termination')}
            </h2>
            <p>
              {pick(
                locale,
                'يمكنك التوقف عن الاستخدام في أي وقت وطلب حذف الحساب عبر البريد. يجوز لنا إيقاف الوصول إن خُرقت مادة جوهرية، أو إن أُسيء للخدمة، أو إن أُلزمنا قانوناً. الإنهاء لا يسقط المواد التي بطبيعتها تبقى: الملكية، حدود المسؤولية، والقانون الواجب.',
                'You may stop using the service at any time and ask by mail to delete the account. We may suspend access if a material clause is broken, if the service is abused, or if the law requires it. Termination does not unwind clauses that naturally survive: intellectual property, limits of liability, and governing law.'
              )}
            </p>
          </section>

          <section id="law" className="deed-article">
            <h2>
              <span>18</span>
              {pick(locale, 'القانون والنزاع', 'Law and disputes')}
            </h2>
            <p>
              {pick(
                locale,
                'تُفسَّر الشروط وفق قوانين دولة تشغيل الخدمة، دون أن نخترع مقراً قضائياً باسم مدينة لم نعلنها. للنزاع نبدأ بالبريد. إن بقي الخلاف، فالمحاكم المختصة في مقر التشغيل، ما لم يُلزم نص آمر بخلاف ذلك.',
                'These terms are read under the laws of the country where the service is operated, without inventing a court city we have not named. Disputes start by mail. If they remain, the courts of that seat apply, unless mandatory law says otherwise.'
              )}
            </p>
          </section>

          <section id="change" className="deed-article">
            <h2>
              <span>19</span>
              {pick(locale, 'تعديل العقد', 'Changes')}
            </h2>
            <p>
              {pick(
                locale,
                'نحدّث العقد بتاريخ ظاهر في رأس الليل. لا نعد بإشعار بريد لكل تعديل. الاستمرار بعد ظهور التاريخ الجديد قبول للنسخة الجديدة.',
                'We date deed updates in the night masthead. We do not promise an email for every change. Continuing after the new date appears is acceptance of the new version.'
              )}
            </p>
            <p>
              {pick(locale, 'لرسائل المكتب:', 'Desk mail:')}{' '}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </p>
          </section>

          <footer className="deed-colophon">
            <p>YS-L02 · {date}</p>
            <p>{pick(locale, 'يُحفظ مع سجل الخصوصية وحقوق النشر', 'Kept with the privacy and copyright ledgers')}</p>
          </footer>
        </div>
      </div>
    </article>
  );
}
