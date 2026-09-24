import { Link } from '@/i18n/navigation';
import { pick } from '@/i18n/pick';
import { CONTACT_EMAIL } from '@/lib/seo/site';
import {
  LexArticle,
  LexAsideCard,
  LexCards,
  LexChamber,
  LexNote,
  LexPoints,
} from './LexChamber';

export function CopyrightMark({ locale }: { locale: string }) {
  const date = pick(locale, '11 سبتمبر 2026', '11 September 2026');

  const rail = [
    { id: 'ours', label: pick(locale, 'ما نملكه', 'What we own') },
    { id: 'theirs', label: pick(locale, 'ما لا ندّعيه', 'What we do not claim') },
    { id: 'fair', label: pick(locale, 'الاستخدام المسموح', 'Allowed use') },
    { id: 'comments', label: pick(locale, 'تعليقك', 'Your comment') },
    { id: 'notice', label: pick(locale, 'كيف تبلّغ', 'How to notice') },
    { id: 'remove', label: pick(locale, 'الإزالة والرد', 'Takedown and reply') },
  ];

  const ours = [
    pick(locale, 'اسم يلا سبورت وشعار الموقع كما يظهر في الرأس والفوتر.', 'The Yalla Sport name and the site logo as shown in the header and footer.'),
    pick(locale, 'النصوص الأصلية، العناوين، والأخبار المعتمدة داخل المنصة.', 'Original copy, headlines and approved news on the platform.'),
    pick(locale, 'تنظيم الواجهة، الدفتر البصري، والكود الخاص بالموقع.', 'The interface system, the visual ledger, and original site code.'),
  ];

  const theirs = [
    {
      title: pick(locale, 'الأندية والبطولات', 'Clubs and competitions'),
      body: pick(
        locale,
        'الأسماء والشعارات والشارات ملك لأصحابها، وتُعرض للتعريف في تغطية النتائج.',
        'Names, crests and badges belong to their owners and appear for identification in score coverage.'
      ),
    },
    {
      title: pick(locale, 'بيانات المباريات', 'Match data'),
      body: pick(
        locale,
        'ملك مزود البيانات وفق عقده، وتُعرض تحت ذلك الترخيص لا كملكية لنا.',
        'Belongs to the data provider under its contract, shown under that licence and not as ours.'
      ),
    },
    {
      title: pick(locale, 'أصول البث', 'Playback assets'),
      body: pick(
        locale,
        'أي بث عبر أصل مرخّص يبقى تحت ترخيص صاحبه؛ لسنا مصدر الحقوق المجاورة له.',
        'Any stream through a licensed asset stays under its owner’s licence; we are not its neighbouring-rights source.'
      ),
    },
    {
      title: pick(locale, 'صور الوكالات', 'Agency imagery'),
      body: pick(
        locale,
        'ما يظهر من صور يبقى منسوباً لمصدره، ولا يُحمَّل من الصفحة كأنه مكتبة مفتوحة.',
        'Any image stays credited to its source and is not to be lifted from the page as if it were an open library.'
      ),
    },
  ];

  const allowed = [
    pick(locale, 'اقتباس قصير من خبر مع ذكر يلا سبورت ورابط الصفحة.', 'A short quotation from a story with credit to Yalla Sport and a link to the page.'),
    pick(locale, 'الربط إلى صفحاتنا من موقعك أو حسابك.', 'Linking to our pages from your site or account.'),
  ];

  const forbidden = [
    pick(locale, 'تحميل شعارات الأندية من الموقع لاستخدام تجاري.', 'Downloading club crests from the site for commercial use.'),
    pick(locale, 'نسخ الجداول لإعادة بثها كمنصة موازية.', 'Copying tables to rebroadcast them as a parallel platform.'),
    pick(locale, 'نسخ الموقع كمنتج منافس أو إعادة بناء التغذية الحية كخدمة مستقلة.', 'Copying the site as a competing product or rebuilding the live feed as a standalone service.'),
  ];

  const noticeParts = [
    pick(locale, 'رابط الصفحة التي يظهر فيها العمل.', 'The URL of the page where the work appears.'),
    pick(locale, 'وصف العمل الأصلي وما يثبت وجوده.', 'A description of the original work and what shows it exists.'),
    pick(locale, 'صفتك: صاحب الحق أو وكيل مخوّل.', 'Your standing: rights holder or authorised agent.'),
    pick(locale, 'تصريح أن البلاغ صحيح على حد علمك.', 'A statement that the notice is true to your knowledge.'),
  ];

  return (
    <LexChamber
      locale={locale}
      path="/copyright"
      tone="mark"
      code="YS-L03"
      instrument={pick(locale, 'الصك الثالث', 'Instrument three')}
      title={pick(locale, 'حقوق النشر', 'Copyright')}
      wordmark={pick(locale, 'حقوق النشر', 'Copyright')}
      eyebrow={pick(locale, 'سجل الملكية · ما لنا وما لغيرنا', 'The ownership ledger · ours and theirs')}
      lead={pick(
        locale,
        'الشعار والنصوص الأصلية والكود لنا. الشارات والأسماء والبيانات والبث تبقى لأصحابها. نعرضها للتعريف والتغطية، لا كادّعاء ملكية.',
        'The mark, original copy and code are ours. Crests, names, data and streams remain with their owners. We show them for identification and coverage, not as a claim of title.'
      )}
      date={date}
      seals={[
        pick(locale, '© 2026 Yalla Sport', '© 2026 Yalla Sport'),
        pick(locale, 'الشارات لأصحابها', 'Crests stay with owners'),
        pick(locale, 'إزالة ببلاغ جدّي', 'Takedown on a serious notice'),
        pick(locale, 'لا نموذج وهمي', 'No dummy form'),
      ]}
      rail={rail}
      aside={
        <LexAsideCard title={pick(locale, 'بلاغ حقوق', 'Rights notice')}>
          <p>
            {pick(
              locale,
              'البلاغ يصل بالبريد إلى مكتب التحرير، أو عبر صفحة الإبلاغ.',
              'A notice reaches the editorial desk by mail, or through the report page.'
            )}
          </p>
          <p className="mt-2">
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
          <p className="mt-2">
            <Link href="/report">{pick(locale, 'افتح صفحة الإبلاغ', 'Open the report page')}</Link>
          </p>
        </LexAsideCard>
      }
    >
      {/* IP & Sources Ledger Bento */}
      <div className="mb-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-card/40 to-card/20 p-5 backdrop-blur-md transition hover:border-amber-500/40">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M14.83 14.83a4 4 0 1 1 0-5.66" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {pick(locale, 'حقوق البرمجيات والتصميم الحصري', 'Original Platform Copyright')}
              </h3>
              <p className="text-[11px] text-amber-400 font-mono">© 2026 YALLA SPORT</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {pick(
              locale,
              'التصميم، هوية الواجهة، الشيفرة المصدرية، والعناوين التحريرية الأصلية ملكية حصرية لـ يلا سبورت ومحمية دولياً.',
              'Original software code, UI identity, design tokens, and editorial analyses are exclusive assets of Yalla Sport.'
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-card/40 to-card/20 p-5 backdrop-blur-md transition hover:border-cyan-500/40">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {pick(locale, 'شعارات وأصول الأندية والاتحادات', 'Club & League Trademarks')}
              </h3>
              <p className="text-[11px] text-cyan-400 font-mono">FAIR IDENTIFICATION USE</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {pick(
              locale,
              'تُعرض شعارات الفرق وأسماء المسابقات بغرض التعريف والتغطية الصحفية فقط، وتبقى ملكاً مطلقاً لأنديتها وهيئاتها.',
              'Club crests, tournament emblems, and sponsor badges belong entirely to their respective proprietors under fair use.'
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-card/40 to-card/20 p-5 backdrop-blur-md transition hover:border-emerald-500/40">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 11a9 9 0 0 1 9 9" />
                <path d="M4 4a16 16 0 0 1 16 16" />
                <circle cx="5" cy="19" r="1" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {pick(locale, 'اعتماد وكالات الأنباء الرياضية', 'Accredited Sports Feeds')}
              </h3>
              <p className="text-[11px] text-emerald-400 font-mono">AFP · REUTERS · BEIN · BBC</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {pick(
              locale,
              'جميع الأخبار المستوردة تنسب صراحة لمصادرها المعتمدة بروابط مباشرة دون تحريف للحقائق أو طمس للنسب الصحفي.',
              'Syndicated news articles faithfully link back to originating wire agencies and publishers with zero misattribution.'
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card/40 to-card/20 p-5 backdrop-blur-md transition hover:border-primary/40">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/30">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {pick(locale, 'بروتوكول إزالة DMCA السريع', 'Rapid DMCA Takedown')}
              </h3>
              <p className="text-[11px] text-primary font-mono">&lt; 24H RESPONSE TIME</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {pick(
              locale,
              'نستجيب فوراً وبجدية تامة لأي بلاغ انتهاك ملكية فكرية مؤيد بالأدلة مع إزالة أو حجب المحتوى المعني خلال ساعات.',
              'We enforce strict intellectual compliance, reviewing valid DMCA notifications and removing infringing assets within hours.'
            )}
          </p>
        </div>
      </div>

      <LexArticle id="ours" index="01" title={pick(locale, 'ما نملكه', 'What we own')} kicker={pick(locale, 'ملك المكتب', 'The desk’s own')}>
        <LexPoints items={ours} />
        <LexNote label={pick(locale, 'الحد', 'The limit')}>
          {pick(
            locale,
            'لا يُنسخ الموقع كمنتج منافس، ولا يُعاد بناء التغذية الحية كخدمة مستقلة، دون إذن مكتوب.',
            'The site may not be copied as a competing product, and the live feed may not be rebuilt as a separate service, without written permission.'
          )}
        </LexNote>
      </LexArticle>

      <LexArticle
        id="theirs"
        index="02"
        title={pick(locale, 'ما لا ندّعي ملكيته', 'What we do not claim')}
        kicker={pick(locale, 'ملك الغير', 'Someone else’s')}
      >
        <p>
          {pick(
            locale,
            'ما يلي يظهر على المنصة للتعريف والتغطية فقط. ظهوره عندنا لا ينقل ملكيته إلينا.',
            'The following appears on the platform for identification and coverage only. Appearing here does not move title to us.'
          )}
        </p>
        <LexCards rows={theirs} />
      </LexArticle>

      <LexArticle
        id="fair"
        index="03"
        title={pick(locale, 'الاستخدام المسموح', 'Allowed use')}
        kicker={pick(locale, 'ما يجوز وما لا يجوز', 'May and may not')}
      >
        <div className="lex-split">
          <div className="lex-split-card is-you">
            <p>{pick(locale, 'مسموح', 'Allowed')}</p>
            <ul>
              {allowed.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="lex-split-card is-desk">
            <p>{pick(locale, 'غير مسموح', 'Not allowed')}</p>
            <ul>
              {forbidden.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </LexArticle>

      <LexArticle id="comments" index="04" title={pick(locale, 'تعليقك', 'Your comment')} kicker={pick(locale, 'يبقى لك', 'Stays yours')}>
        <p>
          {pick(
            locale,
            'تبقى صاحب ما تكتبه. بإرسال تعليق تمنح يلا سبورت ترخيصاً غير حصري لعرضه على الصفحة المرتبطة بالمباراة أو الخبر، وإزالته إن خالف الشروط. لا ننسب رأيك إلى التحرير.',
            'You remain the author of what you write. By posting a comment you grant Yalla Sport a non-exclusive licence to show it on the linked match or story page, and to remove it if it breaks the terms. We do not attribute your view to the desk.'
          )}
        </p>
      </LexArticle>

      <LexArticle id="notice" index="05" title={pick(locale, 'كيف تبلّغ', 'How to notice')} kicker={pick(locale, 'عناصر البلاغ', 'Notice parts')}>
        <p>
          {pick(locale, 'أرسل إلى', 'Write to')} <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>{' '}
          {pick(locale, 'متضمناً:', 'including:')}
        </p>
        <LexPoints items={noticeParts} ordered />
        <LexNote label={pick(locale, 'بصراحة', 'Plainly')}>
          {pick(
            locale,
            'بلاغ بلا هذه العناصر قد لا يُعالج. لا يوجد نموذج إزالة وهمي يعدك برقم تذكرة.',
            'A notice without these parts may not be processed. There is no dummy takedown form that issues a ticket number.'
          )}
        </LexNote>
      </LexArticle>

      <LexArticle id="remove" index="06" title={pick(locale, 'الإزالة والرد', 'Takedown and reply')} kicker={pick(locale, 'ما يحدث بعدها', 'What follows')}>
        <p>
          {pick(
            locale,
            'نراجع البلاغات الجدية خلال وقت معقول. إن ثبت الانتهاك نزيل أو نحجب المادة الظاهرة عندنا. إن كان البلاغ على شعار نادٍ أو مقطع بث، نتعامل معه بوصفه ملك الغير لا ملكنا. الرد يكون بالبريد، لا بإيصال آلي مخترع.',
            'We review genuine notices within a reasonable time. If infringement is made out we remove or withhold the material shown here. If the notice concerns a club crest or a stream clip, we treat it as someone else’s property, not ours. The reply is by mail, not an invented auto-receipt.'
          )}
        </p>
      </LexArticle>
    </LexChamber>
  );
}
