import { Link } from '@/i18n/navigation';
import { pick } from '@/i18n/pick';
import { CONTACT_EMAIL } from '@/lib/seo/site';
import {
  LexArticle,
  LexAsideCard,
  LexChamber,
  LexKeys,
  LexNote,
  LexPoints,
  LexSplit,
} from './LexChamber';

export function TermsDeed({ locale }: { locale: string }) {
  const date = pick(locale, '11 سبتمبر 2026', '11 September 2026');

  const rail = [
    { id: 'agree', label: pick(locale, 'القبول', 'Agreement') },
    { id: 'words', label: pick(locale, 'التعاريف', 'Definitions') },
    { id: 'desk', label: pick(locale, 'المكتب', 'The desk') },
    { id: 'licence', label: pick(locale, 'الرخصة لك', 'Your licence') },
    { id: 'account', label: pick(locale, 'الحساب', 'Account') },
    { id: 'scores', label: pick(locale, 'النتائج', 'Scores') },
    { id: 'news', label: pick(locale, 'الأخبار', 'News') },
    { id: 'watch', label: pick(locale, 'البث', 'Streaming') },
    { id: 'play', label: pick(locale, 'التوقعات', 'Predictions') },
    { id: 'speech', label: pick(locale, 'التعليقات', 'Comments') },
    { id: 'forbid', label: pick(locale, 'المحظور', 'Forbidden use') },
    { id: 'ip', label: pick(locale, 'الملكية', 'Intellectual property') },
    { id: 'links', label: pick(locale, 'الروابط', 'Links') },
    { id: 'uptime', label: pick(locale, 'التوفر', 'Availability') },
    { id: 'limit', label: pick(locale, 'المسؤولية', 'Liability') },
    { id: 'privacy', label: pick(locale, 'الخصوصية', 'Privacy') },
    { id: 'end', label: pick(locale, 'الإنهاء', 'Termination') },
    { id: 'law', label: pick(locale, 'القانون', 'Law') },
    { id: 'change', label: pick(locale, 'التعديل', 'Changes') },
  ];

  const words = [
    {
      term: pick(locale, '«المنصة» / «الملعب»', '“Platform” / “pitch”'),
      meaning: pick(
        locale,
        'موقع يلا سبورت على yalla-sport.com وما يتفرع عنه من صفحات واجهات.',
        'The Yalla Sport site at yalla-sport.com and the pages that hang from it.'
      ),
    },
    {
      term: pick(locale, '«المكتب»', '“Desk”'),
      meaning: pick(
        locale,
        'التحرير والتشغيل المسؤول عن اعتماد الخبر وتشغيل النتائج.',
        'The editorial and operations side that approves news and runs the scores.'
      ),
    },
    {
      term: pick(locale, '«أنت»', '“You”'),
      meaning: pick(locale, 'الزائر أو صاحب الحساب الذي يستخدم المنصة.', 'The visitor or account holder using the platform.'),
    },
    {
      term: pick(locale, '«المصدر»', '“Source”'),
      meaning: pick(
        locale,
        'مزود البيانات الرياضية أو صاحب الحق في الخبر أو أصل البث، لا شائعة على الشبكة.',
        'The sports-data provider, the rights holder in a story, or a licensed playback asset — not a rumour on the network.'
      ),
    },
    {
      term: pick(locale, '«التوقع»', '“Prediction”'),
      meaning: pick(
        locale,
        'تخمين نتيجة مباراة مسجّلة لدينا داخل الحساب. ليس رهاناً وليس عقداً مالياً.',
        'Guessing a fixture we hold, inside the account. Not a bet and not a financial contract.'
      ),
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
    pick(
      locale,
      'كشط الجداول أو التغذية الحية لإعادة بيعها أو بناء خدمة منافسة عليها.',
      'Scraping tables or the live feed to resell them or to build a competing service on them.'
    ),
    pick(locale, 'تجاوز حدود الطلب أو محاولة دخول الإدارة دون دور.', 'Bypassing rate limits or attempting admin access without a role.'),
    pick(
      locale,
      'زرع برمجيات ضارة، أو اختبار اختراق دون إذن مكتوب من المكتب.',
      'Planting malware, or running an intrusion test without written permission from the desk.'
    ),
    pick(
      locale,
      'انتحال التحرير، أو نشر خبر كأنه صادر عن يلا سبورت وهو ليس كذلك.',
      'Impersonating the desk, or circulating a story as if Yalla Sport issued it when it did not.'
    ),
    pick(locale, 'استخدام التوقعات كواجهة قمار أو جمع أموال على النقاط.', 'Using predictions as a gambling front or collecting money against points.'),
    pick(
      locale,
      'إعادة نشر ملف خبر كامل كخدمة موازية، بعد الاقتباس القصير المسموح.',
      'Republishing a full news file as a parallel service, beyond the short quotation that is allowed.'
    ),
  ];

  return (
    <LexChamber
      locale={locale}
      path="/terms"
      tone="deed"
      code="YS-L02"
      instrument={pick(locale, 'الصك الثاني', 'Instrument two')}
      title={pick(locale, 'شروط الاستخدام', 'Terms of Use')}
      wordmark={pick(locale, 'شروط الاستخدام', 'Terms of Use')}
      eyebrow={pick(locale, 'عقد الملعب · المادة الحاكمة', 'Deed of the pitch · governing instrument')}
      lead={pick(
        locale,
        'الدخول إلى الملعب قبول لهذا العقد. إن لم توافق، أغلق الصفحة. النص هنا يعلو أي شعار تسويقي. لا بث بلا ترخيص، ولا نتيجة بلا مصدر، ولا قمار على التوقع.',
        'Entering the pitch is acceptance of this deed. If you do not agree, leave the page. This text outranks any marketing line. No stream without a licence, no score without a source, and predictions are not a wager.'
      )}
      date={date}
      seals={[
        pick(locale, 'صك ثنائي اللغة', 'Bilingual deed'),
        pick(locale, 'لا بث بلا ترخيص', 'No unlicensed stream'),
        pick(locale, 'التوقع ليس رهاناً', 'A prediction is not a wager'),
        pick(locale, 'يُقرأ كاملاً', 'Read in full'),
      ]}
      rail={rail}
      aside={
        <LexAsideCard title={pick(locale, 'الصكوك المرافقة', 'Companion instruments')}>
          <p>
            {pick(
              locale,
              'هذا العقد يُقرأ مع سجل الخصوصية وحقوق النشر. الثلاثة معاً نص واحد.',
              'This deed is read with the privacy and copyright ledgers. The three are one text.'
            )}
          </p>
          <p className="mt-2">
            <Link href="/privacy">{pick(locale, 'سجل الخصوصية', 'Privacy ledger')}</Link>
            {' · '}
            <Link href="/copyright">{pick(locale, 'حقوق النشر', 'Copyright')}</Link>
          </p>
        </LexAsideCard>
      }
    >
      {/* Fair Play Stadium Charter Bento */}
      <div className="mb-10 grid gap-4 sm:grid-cols-2">
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
                {pick(locale, 'الروح الرياضية والاحترام', 'Sportsmanship & Respect')}
              </h3>
              <p className="text-[11px] text-primary font-mono">FAIR PLAY CHARTER</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {pick(
              locale,
              'المنصة مصممة لعشاق كرة القدم؛ يُحظر التعصب الأعمى، الشتائم، أو التنمر في التعليقات وغرف المباريات.',
              'A platform crafted for true football supporters. Harassment, abuse, or toxic speech in match discussions are strictly banned.'
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/10 via-card/40 to-card/20 p-5 backdrop-blur-md transition hover:border-rose-500/40">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {pick(locale, 'حظر الكشط والقرصنة', 'Anti-Scraping & Fair Access')}
              </h3>
              <p className="text-[11px] text-rose-400 font-mono">RATE LIMIT PROTECTED</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {pick(
              locale,
              'يُمنع منعاً باتاً استخراج أو كشط بيانات المباريات والتغذية الحية لإنشاء خدمات تجارية موازية دون ترخيص كتابي.',
              'Automated scraping, harvesting, or reverse engineering of live score feeds and streaming assets is expressly prohibited.'
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-card/40 to-card/20 p-5 backdrop-blur-md transition hover:border-amber-500/40">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="7" />
                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {pick(locale, 'التوقعات ترفيه رياضي وليست رهاناً', 'Skill Game, Never a Wager')}
              </h3>
              <p className="text-[11px] text-amber-400 font-mono">NO GAMBLING · NO CASH</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {pick(
              locale,
              'لعبة التوقعات مصممة لاختبار المعرفة الكروية والتنافس الودي على لوحة الصدارة؛ لا نقدية ولا مراهنات مالية نهائياً.',
              'The predictions board is a friendly competition for football analytical skill. No financial betting or monetary stakes.'
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-card/40 to-card/20 p-5 backdrop-blur-md transition hover:border-emerald-500/40">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {pick(locale, 'المصداقية والأصل القانوني', 'Accredited Source Ledger')}
              </h3>
              <p className="text-[11px] text-emerald-400 font-mono">VERIFIED PROVIDERS</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {pick(
              locale,
              'تُعتمد النتائج والجداول من مزودي البيانات الرسميين؛ وفي حال وجود تضارب فإن المصدر الرسمي للمباراة هو المعتمد.',
              'Match statistics and standings are ingested from certified sports feeds under official syndication rules.'
            )}
          </p>
        </div>
      </div>

      <LexArticle id="agree" index="01" title={pick(locale, 'القبول', 'Agreement')} kicker={pick(locale, 'الدخول', 'Entry')}>
        <p>
          {pick(
            locale,
            'باستخدام يلا سبورت أنت توافق على هذه الشروط وعلى سجل الخصوصية وحقوق النشر. إن تعارض سطر في صفحة أخرى مع هذا العقد، يُعتدّ بالعقد. الاستخدام بعد تحديث التاريخ في الرأس قبول للنسخة الظاهرة.',
            'By using Yalla Sport you agree to these terms and to the privacy and copyright ledgers. If a line on another page conflicts with this deed, the deed prevails. Use after the masthead date is updated is acceptance of the version on the page.'
          )}
        </p>
      </LexArticle>

      <LexArticle id="words" index="02" title={pick(locale, 'التعاريف', 'Definitions')} kicker={pick(locale, 'المصطلح', 'The terms')}>
        <LexKeys rows={words} />
      </LexArticle>

      <LexArticle
        id="desk"
        index="03"
        title={pick(locale, 'ما يقدّمه المكتب وما لا يقدّمه', 'What the desk is and is not')}
        kicker={pick(locale, 'الالتزامات', 'Duties')}
      >
        <p>
          {pick(
            locale,
            'نوفّر برنامج مباريات، نتائج وجداول عند وصولها، أخباراً معتمدة، وصفحة بثوث. الخدمة أداة إعلام رياضي. ليست وكالة مراهنات، وليست ناشراً لكل خبر يدور على الشبكة، وليست ضماناً أن المباراة تُبث لأن الخبر نُشر.',
            'We provide a match programme, scores and tables when they arrive, approved news, and a broadcasts page. The service is a sports desk. It is not a betting desk, not a publisher of every rumour on the network, and not a promise that a match is streaming because a story ran.'
          )}
        </p>
        <LexSplit
          left={{ title: pick(locale, 'عليك', 'You'), items: youDo }}
          right={{ title: pick(locale, 'على المكتب', 'The desk'), items: weDo }}
        />
      </LexArticle>

      <LexArticle id="licence" index="04" title={pick(locale, 'رخصة الاستخدام', 'Licence to use')} kicker={pick(locale, 'حدودها', 'Its limits')}>
        <p>
          {pick(
            locale,
            'نمنحك رخصة شخصية غير حصرية وغير قابلة للتحويل لتصفح المنصة لاستخدامك الخاص. لا تُمنح رخصة لإعادة بيع البيانات، ولا لتشغيل واجهة فوق التغذية، ولا لنسخ التصميم كخدمة موازية.',
            'We grant a personal, non-exclusive, non-transferable licence to browse the platform for your own use. It is not a licence to resell the data, to run an interface on top of the feed, or to copy the design as a parallel service.'
          )}
        </p>
      </LexArticle>

      <LexArticle id="account" index="05" title={pick(locale, 'الحساب', 'Your account')} kicker={pick(locale, 'مسؤوليتك', 'Your charge')}>
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
      </LexArticle>

      <LexArticle id="scores" index="06" title={pick(locale, 'النتائج والإحصائيات', 'Scores and statistics')} kicker={pick(locale, 'الرقم', 'The figure')}>
        <p>
          {pick(
            locale,
            'الأرقام تأتي من مزود خارجي وقد تتأخر أو تُصحَّح لاحقاً. غياب الرقم ليس صفراً مخترعاً. المقارنة بين لاعبين أو فريقين تُبنى على ما وصل من المصدر؛ إن نقص صفّ تُرك ناقصاً.',
            'Figures come from an external provider and may lag or later be corrected. A missing figure is not an invented zero. A comparison of players or sides is built from what arrived; if a row is thin, it stays thin.'
          )}
        </p>
      </LexArticle>

      <LexArticle id="news" index="07" title={pick(locale, 'الأخبار', 'News')} kicker={pick(locale, 'الاعتماد', 'Approval')}>
        <p>
          {pick(
            locale,
            'ما يُنشر في قسم الأخبار بعد اعتماد تحريري. المواد قيد المراجعة لا تُعرض للقرّاء. الاقتباس القصير مسموح مع ذكر يلا سبورت ورابط الصفحة. إعادة نشر الملف كاملاً كخدمة منافسة غير مسموحة.',
            'News appears after editorial approval. Items under review are not shown to readers. Short quotation is allowed with credit to Yalla Sport and a link to the page. Republishing the whole file as a competing service is not allowed.'
          )}
        </p>
      </LexArticle>

      <LexArticle id="watch" index="08" title={pick(locale, 'البث', 'Streaming')} kicker={pick(locale, 'الترخيص أولاً', 'Licence first')}>
        <p>
          {pick(
            locale,
            'المشاهدة فقط عند أصل مرخّص، وترخيص نشط، وجغرافيا مسموحة، ومستوى اشتراك إن طُلب. إن كان البث معطّلاً في الإعداد، لن يظهر زر مشاهدة. لا نوفّر ولا ندلّ على مصادر غير مرخّصة، ولا نعد ببث كل مباراة ذُكرت في الخبر.',
            'Watching exists only with a licensed asset, an active licence, an allowed territory, and a required subscription tier if any. If streaming is disabled in configuration, no Watch button appears. We do not provide or point to unlicensed sources, and we do not promise a stream for every match mentioned in a story.'
          )}
        </p>
      </LexArticle>

      <LexArticle
        id="play"
        index="09"
        title={pick(locale, 'التوقعات والنقاط', 'Predictions and points')}
        kicker={pick(locale, 'ليست رهاناً', 'Not a wager')}
      >
        <LexNote label={pick(locale, 'تنبيه صريح', 'Plain warning')}>
          {pick(
            locale,
            'توقّع نتيجة مباراة مسجّلة لدينا نشاط ترفيهي داخل الحساب. النقاط على لوحة المتصدرين ليست مالاً، وليست جائزة نقدية معلنة، وليست دعوة للمقامرة، وليست أداة لتسوية رهان بين أطراف.',
            'Predicting a fixture we hold is an in-account pastime. Leaderboard points are not money, not a declared cash prize, not an invitation to gamble, and not a tool for settling a wager between parties.'
          )}
        </LexNote>
        <p>
          {pick(
            locale,
            'حفظ التوقع يستبدل التوقع السابق لنفس المباراة إن وُجد. لا محرّك نقاط معلن كجائزة، ولا رصيد يُسحب.',
            'Saving a prediction replaces the previous one for that match if it exists. There is no published points engine as a prize, and no balance you can withdraw.'
          )}
        </p>
      </LexArticle>

      <LexArticle id="speech" index="10" title={pick(locale, 'التعليقات', 'Comments')} kicker={pick(locale, 'باسمك', 'In your name')}>
        <p>
          {pick(
            locale,
            'التعليق باسمك ومسؤوليتك. يُمنع السب، والتحريض، والسبام، وانتحال المصدر. يمكننا حذف المخالف دون إشعار، وقد نوقف الحساب. فلتر الكلمات ليس ضماناً لكل إساءة.',
            'A comment is in your name and on you. Abuse, incitement, spam, and impersonation of a source are forbidden. We may remove violating copy without notice, and we may suspend the account. The word filter is not a guarantee against every insult.'
          )}
        </p>
      </LexArticle>

      <LexArticle id="forbid" index="11" title={pick(locale, 'الاستخدام المحظور', 'Forbidden use')} kicker={pick(locale, 'الخط الأحمر', 'The red line')}>
        <LexPoints items={forbid} ordered />
      </LexArticle>

      <LexArticle id="ip" index="12" title={pick(locale, 'الملكية الفكرية', 'Intellectual property')} kicker={pick(locale, 'لمن', 'To whom')}>
        <p>
          {pick(
            locale,
            'اسم يلا سبورت، والتصميم، والتحرير المعتمد ملك للمكتب في حدود ما أنتجناه. شعارات الأندية، وأسماء اللاعبين، وبيانات النتائج، وأصول البث تبقى لأصحابها. التفاصيل في سجل حقوق النشر.',
            'The Yalla Sport name, the design, and approved editorial copy belong to the desk insofar as we made them. Club marks, player names, score data, and playback assets remain with their owners. Detail lives in the copyright ledger.'
          )}{' '}
          <Link href="/copyright">{pick(locale, 'افتح سجل حقوق النشر', 'Open the copyright ledger')}</Link>
        </p>
      </LexArticle>

      <LexArticle id="links" index="13" title={pick(locale, 'روابط الغير', 'Third-party links')} kicker={pick(locale, 'خارج الملعب', 'Off the pitch')}>
        <p>
          {pick(
            locale,
            'قد يشير خبر أو صفحة إلى موقع خارجي. ذلك الرابط ليس ضماناً لمحتواه ولا شراكة معلنة لمجرد وجوده. شروط ذلك الموقع تخصّه.',
            'A story or a page may point off-site. That link is not a warranty of the destination, and not a declared partnership merely because it exists. That site’s terms are its own.'
          )}
        </p>
      </LexArticle>

      <LexArticle id="uptime" index="14" title={pick(locale, 'التوفر والصيانة', 'Availability')} kicker={pick(locale, 'بلا وعود', 'No promises')}>
        <p>
          {pick(
            locale,
            'قد تنقطع الخدمة للصيانة أو لعطل في المزود أو في الشبكة. لا نعلن نسبة توفر سنوية في هذا العقد، ولا نعد بأن التغذية الحية لا تسكت دقيقة.',
            'The service may pause for maintenance, a provider fault, or the network. This deed does not declare an annual uptime percentage, and it does not promise that the live feed never goes quiet.'
          )}
        </p>
      </LexArticle>

      <LexArticle id="limit" index="15" title={pick(locale, 'حدود المسؤولية', 'Limits of liability')} kicker={pick(locale, 'المدى', 'The extent')}>
        <p>
          {pick(
            locale,
            'الموقع يُقدَّم كما هو. لا نضمن تزامناً لحظياً مع كل صافرة، ولا توفر بث في كل دقيقة. في حدود ما يسمح به القانون، لا نتحمّل خسائر ناتجة عن اعتمادك على رقم أو عن انقطاع الخدمة. هذا ليس إعفاءً من الغش أو الضرر العمدي حيث يمنعه القانون.',
            'The site is provided as is. We do not guarantee instant alignment with every whistle, or a stream in every minute. To the extent the law allows, we are not liable for losses from relying on a figure or from downtime. This is not a waiver of fraud or wilful harm where the law forbids that waiver.'
          )}
        </p>
      </LexArticle>

      <LexArticle
        id="privacy"
        index="16"
        title={pick(locale, 'الخصوصية جزء من العقد', 'Privacy is part of this deed')}
        kicker={pick(locale, 'مرفق ملزم', 'Binding annex')}
      >
        <p>
          {pick(
            locale,
            'سجل الخصوصية يشرح ما يُجمع وكيف. استخدام المنصة قبول لذلك السجل أيضاً. لطلب الاطلاع أو الحذف: البريد أدناه، لا نموذج وهمي في هذه الصفحة.',
            'The privacy ledger explains what is collected and how. Using the platform is also acceptance of that ledger. For access or deletion: the mail below, not a dummy form on this page.'
          )}{' '}
          <Link href="/privacy">{pick(locale, 'اقرأ سجل الخصوصية', 'Read the privacy ledger')}</Link>
        </p>
      </LexArticle>

      <LexArticle id="end" index="17" title={pick(locale, 'الإنهاء', 'Termination')} kicker={pick(locale, 'الخروج', 'The exit')}>
        <p>
          {pick(
            locale,
            'يمكنك التوقف عن الاستخدام في أي وقت وطلب حذف الحساب عبر البريد. يجوز لنا إيقاف الوصول إن خُرقت مادة جوهرية، أو إن أُسيء للخدمة، أو إن أُلزمنا قانوناً. الإنهاء لا يسقط المواد التي بطبيعتها تبقى: الملكية، حدود المسؤولية، والقانون الواجب.',
            'You may stop using the service at any time and ask by mail to delete the account. We may suspend access if a material clause is broken, if the service is abused, or if the law requires it. Termination does not unwind clauses that naturally survive: intellectual property, limits of liability, and governing law.'
          )}
        </p>
      </LexArticle>

      <LexArticle id="law" index="18" title={pick(locale, 'القانون والنزاع', 'Law and disputes')} kicker={pick(locale, 'المرجع', 'The forum')}>
        <p>
          {pick(
            locale,
            'تُفسَّر الشروط وفق قوانين دولة تشغيل الخدمة، دون أن نخترع مقراً قضائياً باسم مدينة لم نعلنها. للنزاع نبدأ بالبريد. إن بقي الخلاف، فالمحاكم المختصة في مقر التشغيل، ما لم يُلزم نص آمر بخلاف ذلك.',
            'These terms are read under the laws of the country where the service is operated, without inventing a court city we have not named. Disputes start by mail. If they remain, the courts of that seat apply, unless mandatory law says otherwise.'
          )}
        </p>
      </LexArticle>

      <LexArticle id="change" index="19" title={pick(locale, 'تعديل العقد', 'Changes')} kicker={pick(locale, 'النسخة', 'The edition')}>
        <p>
          {pick(
            locale,
            'نحدّث العقد بتاريخ ظاهر في الرأس. لا نعد بإشعار بريد لكل تعديل. الاستمرار بعد ظهور التاريخ الجديد قبول للنسخة الجديدة.',
            'We date deed updates in the masthead. We do not promise an email for every change. Continuing after the new date appears is acceptance of the new version.'
          )}
        </p>
        <p>
          {pick(locale, 'لرسائل المكتب:', 'Desk mail:')} <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      </LexArticle>
    </LexChamber>
  );
}
