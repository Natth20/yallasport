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
  Shield,
  Award,
  Users,
  Trophy,
} from 'lucide-react';

export function TermsDeed({ locale }: { locale: string }) {
  const date = pick(locale, '23 سبتمبر 2026', '23 September 2026');

  const rail = [
    { id: 'acceptance', label: pick(locale, 'القبول وميثاق الاستخدام', 'Acceptance of Terms') },
    { id: 'definitions', label: pick(locale, 'المصطلحات والمفاهيم', 'Defined Terms') },
    { id: 'license', label: pick(locale, 'الرخصة واستخدام المنصة', 'Permitted License') },
    { id: 'accounts', label: pick(locale, 'التزامات الحساب', 'Account Obligations') },
    { id: 'scores', label: pick(locale, 'النتائج والمصادر الرياضية', 'Scores & Data Feeds') },
    { id: 'predictions', label: pick(locale, 'ميثاق التوقعات والنقاط', 'Predictions & Gamification') },
    { id: 'community', label: pick(locale, 'آداب التعليق والدردشة', 'Community & Moderation') },
    { id: 'prohibited', label: pick(locale, 'الأنشطة المحظورة والكشط', 'Prohibited Activities') },
    { id: 'liability', label: pick(locale, 'حدود المسؤولية وإخلاء الطرف', 'Limitation of Liability') },
    { id: 'law', label: pick(locale, 'القانون الحاكم والتعديل', 'Governing Law & Changes') },
  ];

  const termsDefinitions = [
    [
      <strong className="text-foreground">«يلا سبورت / المنصة»</strong>,
      pick(locale, 'الموقع الإلكتروني الرسمي وكافة الخدمات الرقمية التابعة له على نطاق yalla-sport.com.', 'The official website and associated digital services on the yalla-sport.com domain.'),
    ],
    [
      <strong className="text-foreground">«المصدر الرياضي»</strong>,
      pick(locale, 'مزود البيانات الرياضية الرسمي المعتمد أو جهة البث المرخصة المعترف بها.', 'The accredited official sports-data provider or authorized broadcasting partner.'),
    ],
    [
      <strong className="text-foreground">«التوقع والنقاط»</strong>,
      pick(locale, 'نظام ترفيهي وتنافسي قائم على المعرفة الرياضية فقط دون أي مراهنات أو مقابل مالي.', 'Purely recreational football gamification based on sports knowledge; strictly non-wagering.'),
    ],
    [
      <strong className="text-foreground">«المستخدم / أنت»</strong>,
      pick(locale, 'أي شخص طبيعي أو اعتباري يزور المنصة أو ينشئ حساباً فيها.', 'Any individual or entity accessing, browsing, or maintaining an account on the platform.'),
    ],
  ];

  return (
    <LexChamber
      locale={locale}
      path="/terms"
      tone="deed"
      code="YS-TERMS-01"
      instrument={pick(locale, 'عقد الاستخدام والميثاق الرقمي', 'Terms & User Charter')}
      title={pick(locale, 'شروط الاستخدام', 'Terms of Service')}
      wordmark={pick(locale, 'ميثاق وشروط الاستخدام', 'Terms & Conditions')}
      eyebrow={pick(locale, 'مجتمع رياضي آمن · قواعد واضحة وعادلة', 'Safe Sports Community · Clear & Equitable Rules')}
      lead={pick(
        locale,
        'يحدد هذا الميثاق القواعد والشروط التي تحكم استخدامك لمنصة يلا سبورت. بدخولك وتصفحك للمنصة، فإنك توافق على الالتزام الكامل بهذه الشروط المصممة لضمان بيئة رياضية نزيهة وآمنة لجميع المشجعين.',
        'This agreement establishes the terms and conditions governing your access to Yalla Sport. By accessing or using the platform, you agree to be bound by these provisions, designed to maintain a fair, safe, and exhilarating digital sports environment.'
      )}
      date={date}
      seals={[
        pick(locale, 'بيانات معتمدة من المصدر', 'Direct Official Feeds'),
        pick(locale, 'توقعات ترفيهية خالية من الرهان', '100% Non-Gambling Gamification'),
        pick(locale, 'مجتمع رياضي آمن ومحترم', 'Civil Sports Discourse'),
      ]}
      rail={rail}
    >
      {/* ——— Executive Highlights ——— */}
      <LexHighlightsGrid>
        <LexHighlightCard
          icon={Award}
          badge={pick(locale, 'دقة ومصداقية', 'Authenticity')}
          title={pick(locale, 'النتائج من المصدر مباشرة', 'Official Score Feeds')}
          body={pick(
            locale,
            'نستعرض النتائج والأهداف والإحصاءات لحظياً من مزودي بيانات رياضية عالميين معتمدين.',
            'Match scores, timings, and events are sourced directly from global accredited sports data partners.'
          )}
        />

        <LexHighlightCard
          icon={Trophy}
          badge={pick(locale, 'تسلية رياضية', 'Recreational')}
          title={pick(locale, 'التوقعات ليست رهاناً', 'Zero Wagering / Pure Fun')}
          body={pick(
            locale,
            'نظام التوقعات ونقاط الصدارة هو نشاط تنافسي رياضي وترفيهي بحت، ولا ينطوي على أي مراهنات مالية.',
            'Our prediction system and leaderboards are designed purely for sports knowledge fun; no monetary stakes.'
          )}
        />

        <LexHighlightCard
          icon={Users}
          badge={pick(locale, 'أخلاقيات الملعب', 'Civil Discourse')}
          title={pick(locale, 'احترام متبادل ونبذ التعصب', 'Respectful Community')}
          body={pick(
            locale,
            'التعليقات مخصصة للتحليل الرياضي البناء؛ يُمنع تماماً أي سباب أو تعصب مسيء أو خطاب كراهية.',
            'Community chat is dedicated to passionate, civil match analysis; hate speech and toxicity result in instant bans.'
          )}
        />

        <LexHighlightCard
          icon={Shield}
          badge={pick(locale, 'حماية الحقوق', 'Integrity')}
          title={pick(locale, 'حظر الكشط والاستغلال التجاري', 'Anti-Scraping Protection')}
          body={pick(
            locale,
            'يُمنع كشط جداول المباريات أو استنساخ البنية التحتية للمنصة أو إعادة بيع التغذية الحية.',
            'Automated scraping of live tables, reverse-engineering, or commercial resale of feeds is strictly forbidden.'
          )}
        />
      </LexHighlightsGrid>

      {/* ——— Article 1: Acceptance ——— */}
      <LexSection
        id="acceptance"
        index="01"
        kicker={pick(locale, 'الموافقة والالتزام', 'Binding Agreement')}
        title={pick(locale, 'القبول بميثاق وشروط الاستخدام', 'Acceptance of the Platform Charter')}
      >
        <p>
          {pick(
            locale,
            'تشكل هذه الشروط عقداً ملزماً بينك وبين منصة يلا سبورت. إن استخدامك لأي جزء من الموقع يعني إقرارك الكامل بقراءة هذه الشروط وفهمها وموافقتك على الامتثال لكافة بنودها وسياسة الخصوصية الملحقة بها.',
            'These Terms constitute a legally binding agreement between you and Yalla Sport. By navigating or engaging with the platform, you acknowledge that you have read, understood, and consented to these Terms alongside our Privacy Vault.'
          )}
        </p>
      </LexSection>

      {/* ——— Article 2: Definitions ——— */}
      <LexSection
        id="definitions"
        index="02"
        kicker={pick(locale, 'وضوح المفاهيم', 'Clarification')}
        title={pick(locale, 'المصطلحات والمفاهيم الأساسية', 'Defined Terms & Interpretations')}
      >
        <p>
          {pick(
            locale,
            'لأغراض هذا الميثاق، تحمل المصطلحات التالية المعاني الموضحة إزاء كل منها:',
            'For the purposes of this charter, the following expressions bear the specific definitions below:'
          )}
        </p>

        <LexModernTable
          headers={[
            pick(locale, 'المصطلح', 'Term'),
            pick(locale, 'المعنى والمدلول القانوني', 'Operational Definition'),
          ]}
          rows={termsDefinitions}
        />
      </LexSection>

      {/* ——— Article 3: License ——— */}
      <LexSection
        id="license"
        index="03"
        kicker={pick(locale, 'حدود الاستخدام', 'User License')}
        title={pick(locale, 'الرخصة الممنوحة للمستخدم', 'Permitted Personal & Non-Commercial License')}
      >
        <p>
          {pick(
            locale,
            'تمنحك يلا سبورت رخصة شخصية، محدودة، غير حصرية، وغير قابلة للتحويل، للاطلاع على جداول المباريات، النتائج الحية، الأخبار، والمشاركة في مسابقات التوقعات الترفيهية للاستخدام الشخصي غير التجاري.',
            'Yalla Sport grants you a personal, revocable, non-exclusive, non-transferable license to access live fixtures, statistical coverage, approved news, and participate in prediction gamification solely for personal, non-commercial enjoyment.'
          )}
        </p>
      </LexSection>

      {/* ——— Article 4: Accounts ——— */}
      <LexSection
        id="accounts"
        index="04"
        kicker={pick(locale, 'المسؤولية الفردية', 'User Responsibility')}
        title={pick(locale, 'إنشاء الحساب ومسؤولية المستخدم', 'Account Creation & Profile Security')}
      >
        <p>
          {pick(
            locale,
            'عند تسجيل حسابك عبر مصادقة غوغل في يلا سبورت، فإنك توافق على تقديم معلومات صحيحة وتتحمل المسؤولية الكاملة عن كافة الأنشطة والتعليقات والتوقعات التي تصدر من حسابك.',
            'When registering via Google authentication, you agree to maintain accurate profile details and accept sole responsibility for all comments, predictions, and actions executed under your authenticated session.'
          )}
        </p>
      </LexSection>

      {/* ——— Article 5: Scores ——— */}
      <LexSection
        id="scores"
        index="05"
        kicker={pick(locale, 'التغذية الرياضية', 'Data Disclaimers')}
        title={pick(locale, 'النتائج الرياضية المباشرة والمصادر', 'Live Match Feeds & Source Reliability')}
      >
        <p>
          {pick(
            locale,
            'نبذل أقصى جهودنا التقنية لتوفير أسرع وأدق تحديثات النتائج والتوقيتات من مزودي البيانات الرياضية العالميين. ومع ذلك، فإن هذه البيانات مقدمة لأغراض الإخبار والإمتاع الرياضي، ولا ينبغي الاعتماد عليها كمرجع رسمي أو لاتخاذ قرارات تجارية أو مالية.',
            'While we deploy cutting-edge infrastructure to stream instant scores and events from world-class sports data providers, this information is intended for sports enthusiasts and entertainment. It should not be relied upon as an official legal arbiter.'
          )}
        </p>
      </LexSection>

      {/* ——— Article 6: Predictions ——— */}
      <LexSection
        id="predictions"
        index="06"
        kicker={pick(locale, 'ألعاب المعرفة الرياضية', 'Gamification Rules')}
        title={pick(locale, 'ميثاق التوقعات ونقاط الصدارة الترفيهية', 'Predictions Charter: Zero Gambling Policy')}
      >
        <p>
          {pick(
            locale,
            'تعتمد مسابقة التوقعات في منصة يلا سبورت على اختبار المعرفة الرياضية والشغف بكرة القدم. نؤكد بحزم:',
            'The Yalla Sport match predictions feature is designed strictly to celebrate sports knowledge and fan camaraderie. We explicitly declare:'
          )}
        </p>

        <LexCheckList
          items={[
            pick(locale, 'لا توجد أي مبالغ مالية مدفوعة للمشاركة أو رسوم دخول.', 'No entry fees, bets, wagers, or real-money transactions are involved or accepted.'),
            pick(locale, 'النقاط والرتب الرقمية في لوحة الصدارة هي نقاط شرفية رقمية وليست عملات مالية ولا يمكن استبدالها بنقد.', 'Leaderboard points and ranks are honorary digital badges, not convertible into monetary rewards.'),
            pick(locale, 'تمنع المنصة قطعياً أي ترويج لأنشطة القمار أو المراهنات غير القانونية في غرف الدردشة أو الملفات الشخصية.', 'Any promotion of illegal gambling or betting syndicates in comments or profiles will trigger immediate permanent banning.'),
          ]}
        />
      </LexSection>

      {/* ——— Article 7: Community ——— */}
      <LexSection
        id="community"
        index="07"
        kicker={pick(locale, 'نبذ التعصب', 'Civil Discourse')}
        title={pick(locale, 'ميثاق التعليقات وآداب الحوار الرياضي', 'Match Chat & Community Moderation Rules')}
      >
        <p>
          {pick(
            locale,
            'نريد لمنصة يلا سبورت أن تكون ملتقى راقياً يجمع كل عشاق الساحرة المستديرة. لذلك نطبق سياسة صارمة ضد التجاوزات:',
            'We are committed to fostering a vibrant, welcoming stadium atmosphere for fans across all clubs. Our moderation strictly prohibits:'
          )}
        </p>

        <LexCheckList
          items={[
            pick(locale, 'حظر الإساءة الشخصية، السباب، التمييز العنصري، أو الطائفي، أو التحريض على العنف بين الجماهير.', 'Personal abuse, vulgarity, racism, sectarianism, or incitement of violence among rival supporters.'),
            pick(locale, 'حظر نشر الروابط الخارجية المشبوهة أو الإعلانات الترويجية والسبام.', 'Posting spam, referral links, malicious URLs, or unauthorized advertising.'),
            pick(locale, 'يحق لإدارة المنصة حذف أي تعليق مخالف وحظر الحسابات المتجاوزة فوراً دون إشعار مسبق.', 'Moderators retain full discretion to delete non-compliant posts and permanently suspend abusive accounts.'),
          ]}
        />
      </LexSection>

      {/* ——— Article 8: Prohibited ——— */}
      <LexSection
        id="prohibited"
        index="08"
        kicker={pick(locale, 'حماية السيرفرات', 'Anti-Abuse')}
        title={pick(locale, 'الأنشطة المحظورة وحماية الأنظمة', 'Prohibited Technical Actions & Anti-Scraping')}
      >
        <p>
          {pick(
            locale,
            'يحظر على أي مستخدم أو كيان القيام بأي من الأفعال التالية تحت طائلة الملاحقة القانونية والحظر التقني:',
            'The following activities are strictly prohibited and subject to automated IP blocking and legal remedies:'
          )}
        </p>

        <LexCheckList
          items={[
            pick(locale, 'استخدام برامج الزحف الآلي (Scrapers / Bots) لكشط محتوى الجداول أو التغذية الحية وإعادة نشرها.', 'Automated web scraping, indexing bots, or extracting live feeds for unauthorized redistribution.'),
            pick(locale, 'شن هجمات الحرمان من الخدمة (DDoS) أو إرسال طلبات مكثفة تضر بأداء السيرفرات.', 'Denial of Service (DoS/DDoS) attacks, flood requests, or probing server vulnerabilities.'),
            pick(locale, 'محاولة انتحال صفة إدارة الموقع أو استخدام شعار يلا سبورت دون إذن خطي.', 'Impersonating Yalla Sport staff, editors, or misrepresenting official affiliation.'),
          ]}
        />
      </LexSection>

      {/* ——— Article 9: Liability ——— */}
      <LexSection
        id="liability"
        index="09"
        kicker={pick(locale, 'إخلاء الطرف', 'Legal Boundaries')}
        title={pick(locale, 'حدود المسؤولية وإخلاء الطرف القانوني', 'Limitation of Liability & Warranty Disclaimers')}
      >
        <p>
          {pick(
            locale,
            'تُقدم خدمات منصة يلا سبورت "كما هي" دون أي ضمانات صريحة أو ضمنية بخصوص استمرار الخدمة دون أي انقطاع فني خارج عن إرادتنا. لا تتحمل المنصة أي مسؤولية عن أي أخطاء غير مقصودة في نتائج المباريات الواردة من المصادر أو تأخر التغذية بسبب مشاكل الاتصال.',
            'Yalla Sport services and live scores are provided on an "as-is" basis without express or implied warranties of uninterrupted availability. We disclaim liability for unforeseen third-party data feed latency, force majeure events, or technical network interruptions.'
          )}
        </p>
      </LexSection>

      {/* ——— Article 10: Governing Law ——— */}
      <LexSection
        id="law"
        index="10"
        kicker={pick(locale, 'التسوية والتحديث', 'Jurisdiction & Updates')}
        title={pick(locale, 'القانون الحاكم وتحديث الشروط', 'Governing Law, Modifications & Notices')}
      >
        <p>
          {pick(
            locale,
            'نحتفظ بحق تحديث أو تعديل هذه الشروط في أي وقت لتعكس التطورات القانونية والتقنية. وتعتبر التعديلات سارية بمجرد نشرها على هذه الصفحة مع تحديث تاريخ السريان أعلاه.',
            'We reserve the prerogative to modify these Terms periodically to align with legislative and technical evolutions. Revisions become effective immediately upon posting to this official URL with an updated effective date.'
          )}
        </p>
      </LexSection>
    </LexChamber>
  );
}
