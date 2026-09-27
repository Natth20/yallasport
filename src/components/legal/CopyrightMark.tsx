'use client';

import { pick } from '@/i18n/pick';
import {
  LexChamber,
  LexSection,
  LexHighlightsGrid,
  LexHighlightCard,
  LexModernTable,
  LexCheckList,
} from './LexChamber';
import {
  Scale,
  ShieldAlert,
  FileBadge,
  Building,
  Send,
} from 'lucide-react';

export function CopyrightMark({ locale }: { locale: string }) {
  const date = pick(locale, '23 سبتمبر 2026', '23 September 2026');

  const rail = [
    { id: 'ownership', label: pick(locale, 'ما نملكه من حقوق وأصول', 'What We Own') },
    { id: 'third-party', label: pick(locale, 'شعارات الأندية والشركاء', 'Third-Party Crests & Marks') },
    { id: 'fair-use', label: pick(locale, 'الاستخدام العادل والمسموح', 'Permitted Fair Use') },
    { id: 'forbidden', label: pick(locale, 'الاستغلال غير المصرح به', 'Unlawful Infringements') },
    { id: 'dmca-notice', label: pick(locale, 'إجراءات إخطار DMCA', 'DMCA & Takedown Notices') },
    { id: 'response-time', label: pick(locale, 'المراجعة عند الاستلام', 'Review on receipt') },
  ];

  const thirdPartyMarks = [
    [
      <strong className="text-foreground">{pick(locale, 'شعارات وأسماء الأندية', 'Club Crests & Badges')}</strong>,
      pick(locale, 'حقوق ملكية فكرية وعلامات تجارية مسجلة لأنديتها وتُعرض حصراً للتعريف في جداول النتائج.', 'Registered trademarks of their respective football clubs, displayed solely for match identification.'),
    ],
    [
      <strong className="text-foreground">{pick(locale, 'شعارات البطولات والدوريات', 'League & Cup Badges')}</strong>,
      pick(locale, 'ملك للاتحادات والروابط الرياضية المنظمة (مثل Premier League, LaLiga, Champions League).', 'Proprietary marks of the organizing leagues and confederations (e.g. FIFA, UEFA, Premier League).'),
    ],
    [
      <strong className="text-foreground">{pick(locale, 'الصور الفوتوغرافية والوكالات', 'Press & Agency Photos')}</strong>,
      pick(locale, 'تعود للوكالات والمصورين المعتمدين وتُعرض مع نسب المصدر ولا تُعد مكتبة عامة للتحميل.', 'Belong to accredited press agencies and photographers; displayed with attribution, not an open stock library.'),
    ],
    [
      <strong className="text-foreground">{pick(locale, 'أصول وتضمينات البث', 'Broadcast & Stream Embeds')}</strong>,
      pick(locale, 'أي تضمينات لملخصات أو بث رسمي تبقى ملكاً لأصحاب الحقوق الأصلية دون ادعاء ملكية منا.', 'Official highlights and licensed video assets remain exclusively under the copyright of the rights holders.'),
    ],
  ];

  return (
    <LexChamber
      locale={locale}
      path="/copyright"
      tone="mark"
      code="YS-COPY-01"
      instrument={pick(locale, 'ميثاق الملكية الفكرية وحماية النشر', 'Intellectual Property Charter')}
      title={pick(locale, 'حقوق النشر والملكية الفكرية', 'Copyright & DMCA')}
      wordmark={pick(locale, 'حقوق الملكية الفكرية والنشر', 'Copyright & IP Charter')}
      eyebrow={pick(locale, 'ما نملكه وما لغيرنا · احترام كامل للملكية الفكرية', 'Ours & Theirs · Absolute Respect for Creators')}
      lead={pick(
        locale,
        'تلتزم منصة يلا سبورت باحترام كامل لحقوق الملكية الفكرية والعلامات التجارية لجميع الأندية والاتحادات والوكالات الإعلامية. هذا الميثاق يوضح ملكية المحتوى وإجراءات الإبلاغ الفوري عن أي انتهاك.',
        'Yalla Sport upholds rigorous standards of intellectual property and trademark respect across all football clubs, leagues, and media agencies. This charter defines content ownership boundaries and how to file a notice.'
      )}
      date={date}
      seals={[
        pick(locale, 'حماية الشعار والتصميم والكود', 'Original Platform Assets Protected'),
        pick(locale, 'احترام كامل لعلامات الأندية', 'Club Trademarks Respected'),
        pick(locale, 'نراجع كل بلاغ عند استلامه', 'We review every notice when it arrives'),
      ]}
      rail={rail}
    >
      {/* ——— Executive Highlights ——— */}
      <LexHighlightsGrid>
        <LexHighlightCard
          icon={FileBadge}
          badge={pick(locale, 'أصول أصلية', 'Proprietary')}
          title={pick(locale, 'ملكيتنا للشعار والكود والتحرير', 'Platform IP & Code')}
          body={pick(
            locale,
            'اسم يلا سبورت، التصميم البصري الفخم، بنية الكود، والتحليلات الرياضية الحصرية هي ملكيتنا الفكرية.',
            'The Yalla Sport brand, custom UI architecture, platform codebase, and original articles are our IP.'
          )}
        />

        <LexHighlightCard
          icon={Building}
          badge={pick(locale, 'حقوق الغير', 'Third-Party')}
          title={pick(locale, 'شعارات الأندية ملك لأصحابها', 'Club Marks Identified')}
          body={pick(
            locale,
            'شعارات الأندية والبطولات ملك لأصحابها وتُعرض حصراً لأغراض إخبارية وتعريفية بالنتائج.',
            'Crests and league logos are property of their respective clubs, shown strictly for informational reporting.'
          )}
        />

        <LexHighlightCard
          icon={Scale}
          badge={pick(locale, 'استخدام عادل', 'Fair Use')}
          title={pick(locale, 'اقتباس عادل مع ذكر المصدر', 'Attributed Quotation')}
          body={pick(
            locale,
            'يُسمح باقتباس الأخبار والتحليلات القصيرة بشرط وضع رابط صريح ينسب الخبر ليلا سبورت.',
            'Short news excerpts may be quoted provided clear attribution and a reciprocal hyperlink are present.'
          )}
        />

        <LexHighlightCard
          icon={ShieldAlert}
          badge={pick(locale, 'بلاغ الحقوق', 'Notice')}
          title={pick(locale, 'مسار إبلاغ للبلاغات', 'Copyright notice')}
          body={pick(
            locale,
            'إذا كنت صاحب حق وترى محتوى مخالفاً، أرسل بلاغاً. نراجع كل بلاغ عند استلامه.',
            'If you hold the rights and believe material infringes them, send a notice. We review every filing when it arrives.'
          )}
        />
      </LexHighlightsGrid>

      {/* ——— Article 1: What We Own ——— */}
      <LexSection
        id="ownership"
        index="01"
        kicker={pick(locale, 'الأصول الخاصة', 'Our Assets')}
        title={pick(locale, 'ما تملكه منصة يلا سبورت', 'What Yalla Sport Owns & Originates')}
      >
        <p>
          {pick(
            locale,
            'تمتلك منصة يلا سبورت كافة الحقوق الفكرية والتجارية الحصرية المتعلقة بالعناصر التالية:',
            'Yalla Sport retains exclusive intellectual property rights and ownership over:'
          )}
        </p>

        <LexCheckList
          items={[
            pick(locale, 'العلامة التجارية "يلا سبورت" (Yalla Sport)، والشعار الرسمي، والهوية البصرية.', 'The official Yalla Sport brand name, custom logos, emblems, and visual design system.'),
            pick(locale, 'الكود المصدري الأصلي (Front-end & Back-end)، وتصميم قواعد البيانات، والخوارزميات.', 'Original platform source code, custom API orchestrations, database schemas, and algorithms.'),
            pick(locale, 'التحليلات والمقالات الرياضية التحريرية الحصرية المكتوبة بأقلام محرري المنصة.', 'Exclusive editorial coverage, bespoke match previews, and analytical journalism produced in-house.'),
          ]}
        />
      </LexSection>

      {/* ——— Article 2: Third-Party Marks ——— */}
      <LexSection
        id="third-party"
        index="02"
        kicker={pick(locale, 'التعريف الرياضي', 'Nominative Fair Use')}
        title={pick(locale, 'شعارات الأندية والبطولات وعلامات الشركاء', 'Third-Party Crests, Badges & Trademarks')}
      >
        <p>
          {pick(
            locale,
            'نحن ندرك ونحترم أن شعارات الأندية والبطولات الرياضية العالمية هي علامات تجارية محمية لأصحابها الشرعيين. نعرض هذه الشعارات تحت مبدأ الاستخدام العادل الدلالي (Nominative Fair Use) لتسهيل تمييز المباريات والفرق للمشجعين:',
            'We recognize that football club crests, federation emblems, and competition marks are registered trademarks belonging to their respective holders. We display them under doctrine of Nominative Fair Use solely to identify fixtures accurately:'
          )}
        </p>

        <LexModernTable
          headers={[
            pick(locale, 'الفئة', 'Category'),
            pick(locale, 'البيان والصفة القانونية', 'Legal Status & Usage Purpose'),
          ]}
          rows={thirdPartyMarks}
        />
      </LexSection>

      {/* ——— Article 3: Permitted Fair Use ——— */}
      <LexSection
        id="fair-use"
        index="03"
        kicker={pick(locale, 'حدود الاستخدام', 'Permitted Actions')}
        title={pick(locale, 'الاستخدام العادل المسموح به للمحتوى', 'Permitted Sharing & Quotation Standards')}
      >
        <p>
          {pick(
            locale,
            'نشجع المشاركة الرياضية الإيجابية ونسمح بالاستخدام التالي لمحتوى يلا سبورت:',
            'We foster positive sports sharing and permit the following interactions with Yalla Sport assets:'
          )}
        </p>

        <LexCheckList
          items={[
            pick(locale, 'مشاركة روابط صفحات المباريات والأخبار عبر وسائل التواصل الاجتماعي.', 'Sharing direct links to match previews, scores, and news across social networks.'),
            pick(locale, 'اقتباس فقرة قصيرة من مقال تحليلي بشرط الإشارة الصريحة إلى "يلا سبورت" مع رابط مباشر للمقال.', 'Quoting brief analytical excerpts with prominent attribution and a direct link to Yalla Sport.'),
          ]}
        />
      </LexSection>

      {/* ——— Article 4: Forbidden Use ——— */}
      <LexSection
        id="forbidden"
        index="04"
        kicker={pick(locale, 'المحظورات', 'Violations')}
        title={pick(locale, 'الأفعال المحظورة التي تشكل انتهاكاً للملكية', 'Unlawful Reproductions & Prohibited Use')}
      >
        <p>
          {pick(
            locale,
            'يحظر تماماً ارتكاب أي من الأفعال التالية دون موافقة كتابية صريحة مسبقة:',
            'The following actions constitute copyright infringement and are categorically prohibited:'
          )}
        </p>

        <LexCheckList
          items={[
            pick(locale, 'كشط أو نسخ قواعد بيانات المباريات والنتائج لإعادة إطلاق موقع موازٍ أو منافس.', 'Scraping or duplicating our database structure to launch competing scoreboards or feeds.'),
            pick(locale, 'استخدام شعار يلا سبورت لترويج مواقع مراهنات أو منتجات غير مصرح بها.', 'Exploiting the Yalla Sport logo to endorse external gambling, betting, or commercial services.'),
            pick(locale, 'تنزيل شعارات الأندية أو الصور الصحفية من موقعنا لإعادة بيعها أو استخدامها تجارياً.', 'Extracting club badges or agency imagery for commercial merchandising or resale.'),
          ]}
        />
      </LexSection>

      {/* ——— Article 5: DMCA Notice ——— */}
      <LexSection
        id="dmca-notice"
        index="05"
        kicker={pick(locale, 'نموذج الإبلاغ الرسمي', 'Notice Requirements')}
        title={pick(locale, 'إجراءات تقديم إخطار انتهاك حقوق النشر (DMCA Notice)', 'DMCA & Copyright Infringement Notice Protocol')}
      >
        <p>
          {pick(
            locale,
            'إذا كنت صاحب حقوق نشر أو وكيلاً مفوضاً وتعتقد أن هناك مادة منشورة على منصة يلا سبورت تنتهك حقوقك، يرجى إرسال إخطار رسمي يتضمن البيانات التالية:',
            'If you are a copyright owner or authorised agent and believe material hosted on Yalla Sport infringes your rights, please furnish a formal takedown notice containing:'
          )}
        </p>

        <LexCheckList
          items={[
            pick(locale, 'تحديد دقيق للعمل المحمي بحقوق النشر ورابط الصفحة المحددة (URL) على يلا سبورت.', 'Precise identification of the copyrighted work and exact URL link on Yalla Sport.'),
            pick(locale, 'بيانات الاتصال الكاملة: الاسم، الجهة، البريد الإلكتروني، ورقم الهاتف.', 'Your full contact information: name, organisation, email address, and phone number.'),
            pick(locale, 'إقرار يفيد بأن استخدام المادة غير مصرح به من قبل صاحب الحق أو القانون.', 'A statement affirming good-faith belief that use of the material is unauthorized.'),
            pick(locale, 'إقرار تحت طائلة عقوبة شهادة الزور بأن المعلومات المقدمة صحيحة وأنك مخول بالتصرف.', 'A declaration under penalty of perjury that information is accurate and you are authorised to act.'),
          ]}
        />

        <div className="flex items-center gap-3 mt-4">
          <a
            href="/report"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[var(--lex-accent)] text-white hover:opacity-90 transition-opacity"
          >
            <Send className="w-4 h-4" />
            <span>{pick(locale, 'تقديم بلاغ عبر مركز الإبلاغ الذكي', 'Submit via Instant Report Center')}</span>
          </a>
        </div>
      </LexSection>

      {/* ——— Article 6: Response Time ——— */}
      <LexSection
        id="response-time"
        index="06"
        kicker={pick(locale, 'التنفيذ والمتابعة', 'Resolution')}
        title={pick(locale, 'نراجع كل بلاغ عند استلامه', 'We review every notice when it arrives')}
      >
        <p>
          {pick(
            locale,
            'يتعامل مكتب العمليات في يلا سبورت مع بلاغات حقوق النشر بجدية. نراجع كل بلاغ عند استلامه. ما في مهلة زمنية معلنة هنا لأننا لا نربط الإزالة بعدّاد ساعات غير مضمون.',
            'The Yalla Sport operations desk treats copyright notices seriously. We review every filing when it arrives. This page does not state a takedown clock, because we do not bind removal to an unenforced hour count.'
          )}
        </p>
      </LexSection>
    </LexChamber>
  );
}
