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
  Lock,
  EyeOff,
  UserCheck,
  Globe,
  Trash2,
  Bell,
  RefreshCw,
  Mail,
} from 'lucide-react';

export function PrivacyVault({ locale, analyticsId = '' }: { locale: string; analyticsId?: string }) {
  const date = pick(locale, '23 سبتمبر 2026', '23 September 2026');

  const rail = [
    { id: 'commitments', label: pick(locale, 'التزاماتنا الجوهرية', 'Core Commitments') },
    { id: 'inventory', label: pick(locale, 'سجل البيانات المجموعة', 'Data Inventory') },
    { id: 'accounts', label: pick(locale, 'الحساب والمصادقة', 'Accounts & Auth') },
    { id: 'storage', label: pick(locale, 'الكوكيز والتخزين المحلي', 'Cookies & Storage') },
    { id: 'sports-data', label: pick(locale, 'البيانات الرياضية المباشرة', 'Sports Data & Live Feeds') },
    { id: 'processors', label: pick(locale, 'معالجو البيانات والشركاء', 'Data Processors') },
    { id: 'rights', label: pick(locale, 'حقوقك والتحكم ببياناتك', 'Your Rights & Controls') },
    { id: 'retention', label: pick(locale, 'الاحتفاظ بالأمان والتشفير', 'Retention & Security') },
    { id: 'children', label: pick(locale, 'حماية الأطفال والقُصَّر', 'Children Privacy') },
    { id: 'contact', label: pick(locale, 'قنوات التواصل ومسؤول الخصوصية', 'Privacy Contact') },
  ];

  const inventoryTable = [
    [
      <span className="lex-mono-tag">Google Profile</span>,
      pick(locale, 'الاسم، البريد الإلكتروني، الصورة الرمزية', 'Name, email address, avatar URL'),
      pick(locale, 'إنشاء الحساب، إدارة التوقعات، وعرض الهوية في التعليقات', 'Account creation, predictions management, comment identity'),
      <span className="text-emerald-500 font-semibold text-xs">{pick(locale, 'مشفّر في قاعدة البيانات', 'Encrypted in DB')}</span>,
    ],
    [
      <span className="lex-mono-tag">Session Token</span>,
      pick(locale, 'رموز جلسة تسجيل الدخول الآمنة', 'Secure cryptographic session tokens'),
      pick(locale, 'الحفاظ على تسجيل الدخول دون الحاجة لتخزين كلمات مرور لدينا', 'Keep you signed in securely without storing passwords'),
      <span className="text-blue-500 font-semibold text-xs">{pick(locale, 'HTTPS Secure Cookie', 'HTTPS Secure Cookie')}</span>,
    ],
    [
      <span className="lex-mono-tag">Favourites</span>,
      pick(locale, 'الفرق والبطولات المفضلة المختارة', 'Saved favourite teams and competitions'),
      pick(locale, 'تخصيص جدول المباريات وعرض نتائج ناديك المفضل في الواجهة', 'Customise matchday programme and highlights for your teams'),
      <span className="text-muted-foreground text-xs">{pick(locale, 'تخزين سحابي ومحلي', 'Cloud & local storage')}</span>,
    ],
    [
      <span className="lex-mono-tag">Predictions</span>,
      pick(locale, 'توقعات نتائج المباريات والنقاط المكتسبة', 'Match score predictions and leaderboard score'),
      pick(locale, 'حساب نقاط لوحة الصدارة ومقارنة التوقعات مع المستخدمين', 'Calculate leaderboard rank and prediction statistics'),
      <span className="text-muted-foreground text-xs">{pick(locale, 'حساب المنصة', 'Platform Account')}</span>,
    ],
    [
      <span className="lex-mono-tag">Preferences</span>,
      pick(locale, 'المظهر (داكن/فاتح)، اللغة، المنطقة الزمنية', 'Theme (dark/light), locale (AR/EN), timezone'),
      pick(locale, 'ضبط توقيت المباريات ليتناسب بدقة مع مدينتك وراحتك البصرية', 'Render kick-off times accurately for your local city and preferences'),
      <span className="text-muted-foreground text-xs">{pick(locale, 'ملفات ارتباط أساسية', 'First-party cookies')}</span>,
    ],
    [
      <span className="lex-mono-tag">Technical Logs</span>,
      pick(locale, 'عنوان IP تقريبي، سجلات الأخطاء والحماية', 'Anonymised IP snippet, security & error logs'),
      pick(locale, 'صد الهجمات الإلكترونية، الحماية من كشط البيانات والسبام', 'DDoS protection, rate limiting, and spam defense'),
      <span className="text-amber-500 font-semibold text-xs">{pick(locale, 'حذف تلقائي دوري', 'Auto-purged periodically')}</span>,
    ],
  ];

  const processorsTable = [
    [
      <strong>Google Identity Services</strong>,
      pick(locale, 'المصادقة وتسجيل الدخول', 'Authentication & SSO'),
      pick(locale, 'نستخدم تسجيل الدخول الموثوق عبر غوغل لحمايتك؛ نحن لا نخزن أو نطلب أي كلمة مرور أبداً.', 'We authenticate securely via Google; we never request or hold passwords.'),
    ],
    [
      <strong>API-Sports (API-Football)</strong>,
      pick(locale, 'تغذية البيانات الرياضية الحية', 'Live Sports Data Provider'),
      pick(locale, 'مزود البيانات الإحصائية والنتائج وجداول الترتيب عبر اتصال خلفي آمن مع الخادم.', 'Delivers scores, rosters, and statistics via secure server-to-server connections.'),
    ],
    [
      <strong>Upstash Redis</strong>,
      pick(locale, 'التخزين المؤقت والحماية', 'Caching & Rate Limiting'),
      pick(locale, 'تسريع الاستجابة للنتائج الحية وتطبيق حدود الحماية ضد الطلبات المؤذية.', 'Ultra-fast caching for real-time fixtures and rate-limiting anti-abuse protection.'),
    ],
    [
      <strong>Hosting & Infrastructure</strong>,
      pick(locale, 'الاستضافة وقاعدة البيانات السحابية', 'Cloud Infrastructure'),
      pick(locale, 'تشغيل خوادم الموقع وقواعد البيانات المشفرة بتوافق مع معايير الأمان العالمية.', 'Enterprise-grade hosting and encrypted PostgreSQL database storage.'),
    ],
  ];

  if (analyticsId) {
    processorsTable.push([
      <strong>Google Analytics 4</strong>,
      pick(locale, 'إحصاءات الزيارات مجهولة الهوية', 'Anonymous Usage Analytics'),
      pick(locale, `قياس مجهول الهوية للزيارات بالمعرّف ${analyticsId} ولا يُفعل إلا بعد موافقتك الصريحة.`, `Anonymous visit measurement with ID ${analyticsId}, loaded only after your explicit consent.`),
    ]);
  }

  return (
    <LexChamber
      locale={locale}
      path="/privacy"
      tone="vault"
      code="YS-SEC-01"
      instrument={pick(locale, 'ميثاق الخصوصية وحماية البيانات', 'Privacy & Trust Charter')}
      title={pick(locale, 'سياسة الخصوصية', 'Privacy Policy')}
      wordmark={pick(locale, 'خزنة الخصوصية والأمان', 'Privacy & Data Vault')}
      eyebrow={pick(locale, 'شفافية مطلقة · حماية كاملة لبياناتك', 'Absolute Transparency · Uncompromising Protection')}
      lead={pick(
        locale,
        'في يلا سبورت، نؤمن بأن الخصوصية حق أساسي وليست مجرد خيار. نحن لا نبيع بياناتك لأي جهة إعلانية، ولا نتتبعك عبر الإنترنت، ونوفر لك تحكماً كاملاً وسهلاً في كل معلومة تشاركها معنا.',
        'At Yalla Sport, privacy is a core foundation, not an afterthought. We never sell your data to advertisers, we never track you across the web, and we give you complete, transparent control over your information.'
      )}
      date={date}
      seals={[
        pick(locale, 'لا بيع للبيانات مطلقاً', 'Zero Data Selling'),
        pick(locale, 'تشفير كامل للجلسات', 'End-to-End Session Security'),
        pick(locale, 'تحكم فوري بحذف الحساب', 'Instant Data Deletion Rights'),
      ]}
      rail={rail}
    >
      {/* ——— Executive Highlights ——— */}
      <LexHighlightsGrid>
        <LexHighlightCard
          icon={EyeOff}
          badge={pick(locale, 'مبدأ أساسي', 'Core Principle')}
          title={pick(locale, 'لا بيع لبياناتك أبداً', 'Zero Data Monetisation')}
          body={pick(
            locale,
            'لا نقوم ببيع أو تأجير أو مقايضة بياناتك الشخصية مع أي أطراف ثالثة أو شركات تسويق وإعلانات.',
            'We never sell, rent, or trade your personal information with third-party brokers or advertisers.'
          )}
        />

        <LexHighlightCard
          icon={Lock}
          badge={pick(locale, 'أمان متقدم', 'Security')}
          title={pick(locale, 'مصادقة مشفرة دون كلمات مرور', 'Passwordless Auth')}
          body={pick(
            locale,
            'تسجيل الدخول يتم بأمان عبر غوغل؛ لا نخزن أي كلمات مرور على خوادمنا مما يضمن حمايتك القصوى.',
            'Authentication is powered by Google SSO; we never store passwords, keeping your account safeguarded.'
          )}
        />

        <LexHighlightCard
          icon={Trash2}
          badge={pick(locale, 'حقوقك', 'Your Control')}
          title={pick(locale, 'حق الحذف والتصدير بنقرة', 'Instant Right to Erase')}
          body={pick(
            locale,
            'يمكنك طلب حذف حسابك وتفضيلاتك أو تصدير بياناتك فوراً بمجرد مراسلتنا دون أي تعقيدات.',
            'You have full authority to request complete deletion or export of your account data anytime.'
          )}
        />

        <LexHighlightCard
          icon={Globe}
          badge={pick(locale, 'معايير عالمية', 'Compliance')}
          title={pick(locale, 'امتثال صارم لمعايير الخصوصية', 'Global Privacy Standards')}
          body={pick(
            locale,
            'نلتزم بمبادئ الشفافية والتقليل من جمع البيانات وتوافقنا الكامل مع لوائح حماية البيانات الرقمية.',
            'Built from the ground up to respect global data protection, minimisation, and consent frameworks.'
          )}
        />
      </LexHighlightsGrid>

      {/* ——— Article 1: Commitments ——— */}
      <LexSection
        id="commitments"
        index="01"
        kicker={pick(locale, 'المبادئ التوجيهية', 'Guiding Principles')}
        title={pick(locale, 'التزاماتنا الجوهرية تجاه خصوصيتك', 'Our Core Privacy Commitments')}
      >
        <p>
          {pick(
            locale,
            'تعتبر منصة يلا سبورت منصة رياضية رقمية متخصصة في توفير النتائج المباشرة والأخبار الرياضية والتحليلات وإحصاءات المباريات. لقد صممنا بنيتنا التحتية بحيث نجمع فقط الحد الأدنى الضروري من البيانات الذي يمكننا من تقديم تجربة مستخدم سريعة، مخصصة، وآمنة.',
            'Yalla Sport is a digital sports platform delivering live fixtures, football statistics, editorial news, and match insights. Our infrastructure is architected around data minimisation — gathering only what is strictly required to deliver a tailored, lightning-fast experience.'
          )}
        </p>

        <LexCheckList
          items={[
            pick(locale, 'الشفافية الكاملة: نوضح لك بالاسم ماذا نجمع ولأي سبب محدد.', 'Complete transparency: clearly declaring every data point and its exact operational purpose.'),
            pick(locale, 'لا إعلانات تتبعية تطفلية: لا نستخدم برمجيات تتبع خبيثة أو شبكات إعلانية سلوكية تجمع اهتماماتك عبر مواقع أخرى.', 'No behavioural surveillance: no invasive trackers capturing your web activity across external services.'),
            pick(locale, 'التحكم بيدك: إدارة تفضيلات الفرق والإشعارات والمظهر بنقرة واحدة من لوحة التحكم.', 'User sovereignty: instant toggling of favourite teams, notifications, and preferences.'),
          ]}
        />
      </LexSection>

      {/* ——— Article 2: Data Inventory ——— */}
      <LexSection
        id="inventory"
        index="02"
        kicker={pick(locale, 'جرد الشفافية', 'Full Disclosure')}
        title={pick(locale, 'سجل وجرد البيانات التي نجمعها', 'Data Inventory & Purpose Specification')}
      >
        <p>
          {pick(
            locale,
            'يوضح الجدول التالي كافة أصناف البيانات التي يتم التعامل معها في منصة يلا سبورت، والغرض التقني من كل منها، ومكان حفظها:',
            'The following ledger details all categories of data processed across Yalla Sport, alongside their specific purpose and storage mechanism:'
          )}
        </p>

        <LexModernTable
          headers={[
            pick(locale, 'نوع البيانات', 'Data Type'),
            pick(locale, 'التفاصيل والمكونات', 'Components'),
            pick(locale, 'الغرض من الاستخدام', 'Operational Purpose'),
            pick(locale, 'حالة الأمان والحفظ', 'Security & Storage'),
          ]}
          rows={inventoryTable}
        />
      </LexSection>

      {/* ——— Article 3: Accounts ——— */}
      <LexSection
        id="accounts"
        index="03"
        kicker={pick(locale, 'المصادقة والأمان', 'Authentication')}
        title={pick(locale, 'نظام الحسابات وتسجيل الدخول الآمن', 'Secure Account Architecture & Google SSO')}
      >
        <p>
          {pick(
            locale,
            'لتوفير أعلى درجات الأمان وتجنب مخاطر تسريب كلمات المرور، تعتمد منصة يلا سبورت على بروتوكول المصادقة الموحد (OAuth 2.0) عبر شركة غوغل (Google Identity). عند تسجيل دخولك:',
            'To ensure paramount security and eliminate credential theft risks, Yalla Sport leverages industry-standard OAuth 2.0 via Google Identity Services. When you authenticate:'
          )}
        </p>

        <LexCheckList
          items={[
            pick(locale, 'نحصل فقط على معرّف المستخدم العام واسمك وبريدك وصورتك الشخصية المعتمدة في حساب غوغل.', 'We receive only your public Google identifier, verified name, email address, and avatar.'),
            pick(locale, 'لا نملك أو نطلب أو نطلع على كلمة مرور حساب غوغل الخاص بك بأي شكل.', 'We never receive, solicit, or store your Google password.'),
            pick(locale, 'يتم إنشاء رمز جلسة مشفر (Cryptographic Session Token) يتم التحقق منه مع كل طلب بأمان تام.', 'A cryptographically signed session token is minted to authenticate your requests securely.'),
          ]}
        />

        <LexCallout title={pick(locale, 'حماية الحساب', 'Account Safeguard')}>
          {pick(
            locale,
            'إذا أردت إلغاء ربط حساب غوغل بموقع يلا سبورت في أي وقت، يمكنك ذلك مباشرة من خلال صفحة إدارة تطبيقات الطرف الثالث في حساب غوغل الخاص بك.',
            'You can revoke Yalla Sport access at any time via your official Google Account Third-Party Apps security dashboard.'
          )}
        </LexCallout>
      </LexSection>

      {/* ——— Article 4: Storage ——— */}
      <LexSection
        id="storage"
        index="04"
        kicker={pick(locale, 'ملفات المتصفح', 'Client Storage')}
        title={pick(locale, 'ملفات تعريف الارتباط والتخزين المحلي', 'Cookies and Local Storage Usage')}
      >
        <p>
          {pick(
            locale,
            'نستخدم ملفات تعريف الارتباط الأساسية (Essential First-Party Cookies) والتخزين المحلي في متصفحك لضمان عمل المزايا الحيوية مثل تذكر لغة العرض وتوقيت المباريات حسب دولتك. تفاصيل كل ملف موجودة في صفحة ملفات الارتباط المخصصة.',
            'We utilise essential first-party cookies and browser localStorage to ensure core platform features function seamlessly, including remembering your theme, timezone, and language. For complete details, consult our dedicated Cookie Policy.'
          )}
        </p>
      </LexSection>

      {/* ——— Article 5: Sports Data ——— */}
      <LexSection
        id="sports-data"
        index="05"
        kicker={pick(locale, 'التغطية الرياضية', 'Live Sports Operations')}
        title={pick(locale, 'البيانات الرياضية المباشرة وحماية البث', 'Sports Data, Match Feeds & Geo-rules')}
      >
        <p>
          {pick(
            locale,
            'نقوم باستيراد جداول المباريات، نتائج الأهداف، التشكيلات، وإحصاءات اللاعبين من مزودي بيانات رياضية دوليين مرخصين. لا تتضمن هذه التغذيات أي بيانات شخصية للمستخدمين.',
            'Match schedules, live scores, lineups, and statistical events are aggregated from licensed official sports data providers. These data streams are strictly operational and contain zero user-identifying data.'
          )}
        </p>
        <p>
          {pick(
            locale,
            'بالنسبة لروابط البث أو الملخصات المرئية، نحن نلتزم بالحقوق الجغرافية (Geo-licensing) والضوابط القانونية المعمول بها من قبل الجهات المالكة للحقوق.',
            'For video highlights and licensed playback streams, we strictly honour geo-licensing restrictions and distribution rights established by official broadcasters.'
          )}
        </p>
      </LexSection>

      {/* ——— Article 6: Processors ——— */}
      <LexSection
        id="processors"
        index="06"
        kicker={pick(locale, 'الشركاء والخدمات', 'Third-Party Processors')}
        title={pick(locale, 'معالجو البيانات المعتمدون وسلسلة الإمداد التقنية', 'Approved Service Providers & Processors')}
      >
        <p>
          {pick(
            locale,
            'نحن نختار شركاءنا التكنولوجيين بعناية فائقة ونضمن التزامهم بأعلى معايير الأمن الرقمي والتشفير:',
            'We partner exclusively with trusted, industry-leading infrastructure providers adhering to stringent digital security and encryption protocols:'
          )}
        </p>

        <LexModernTable
          headers={[
            pick(locale, 'الجهة / المزود', 'Provider / Service'),
            pick(locale, 'الدور الوظيفي', 'Operational Role'),
            pick(locale, 'ضمانات الخصوصية والحماية', 'Privacy Safeguards'),
          ]}
          rows={processorsTable}
        />
      </LexSection>

      {/* ——— Article 7: User Rights ——— */}
      <LexSection
        id="rights"
        index="07"
        kicker={pick(locale, 'سلطة المستخدم', 'User Sovereignty')}
        title={pick(locale, 'حقوقك القانونية والتحكم في بياناتك', 'Your Comprehensive Data Rights')}
      >
        <p>
          {pick(
            locale,
            'نمنحك الحقوق الكاملة فيما يتعلق بمعلوماتك المخزنة لدينا، دون أي قيد أو شروط معقدة:',
            'You possess absolute control and autonomy over your data residing on Yalla Sport:'
          )}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-4">
          <div className="p-4 rounded-xl border border-border bg-card/60">
            <h4 className="font-bold text-sm text-foreground flex items-center gap-2 mb-1.5">
              <UserCheck className="w-4 h-4 text-emerald-500" />
              <span>{pick(locale, 'حق الاطلاع والوصول', 'Right of Access')}</span>
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {pick(
                locale,
                'يمكنك في أي وقت طلب كشف كامل بكل البيانات المرتبطة بحسابك عبر مراسلتنا.',
                'Request a complete, machine-readable export of all records associated with your profile.'
              )}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card/60">
            <h4 className="font-bold text-sm text-foreground flex items-center gap-2 mb-1.5">
              <Trash2 className="w-4 h-4 text-rose-500" />
              <span>{pick(locale, 'حق المسح والحذف الكامل', 'Right to Complete Erasure')}</span>
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {pick(
                locale,
                'طلب حذف حسابك وجميع التفضيلات والتعليقات والتوقعات من قواعد بياناتنا نهائياً.',
                'Request total deletion of your profile, favourites, predictions, and history permanently.'
              )}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card/60">
            <h4 className="font-bold text-sm text-foreground flex items-center gap-2 mb-1.5">
              <RefreshCw className="w-4 h-4 text-blue-500" />
              <span>{pick(locale, 'حق التصحيح والتحديث', 'Right of Rectification')}</span>
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {pick(
                locale,
                'تحديث اسمك أو صورتك أو تفضيلاتك في أي لحظة عبر إعادة المزامنة مع غوغل أو من إعداداتك.',
                'Update and correct any profile details or preferences instantly in your settings.'
              )}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card/60">
            <h4 className="font-bold text-sm text-foreground flex items-center gap-2 mb-1.5">
              <Bell className="w-4 h-4 text-amber-500" />
              <span>{pick(locale, 'حق التحكم بالإشعارات', 'Notification Autonomy')}</span>
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {pick(
                locale,
                'تفعيل أو إلغاء تذكيرات المباريات وإشعارات المتصفح الفورية في أي وقت بضغطة زر.',
                'Toggle match alerts and browser web-push notifications on or off at will.'
              )}
            </p>
          </div>
        </div>
      </LexSection>

      {/* ——— Article 8: Security & Retention ——— */}
      <LexSection
        id="retention"
        index="08"
        kicker={pick(locale, 'التحصين والحفظ', 'Data Security')}
        title={pick(locale, 'معايير الأمان والتشفير وفترات الاحتفاظ', 'Security Standards, Encryption & Retention')}
      >
        <p>
          {pick(
            locale,
            'نطبق أعلى البروتوكولات الأمنية الحديثة لحماية البيانات أثناء النقل والتخزين، ومنها تشفير HTTPS/TLS 1.3 الشامل، وعزل قواعد البيانات، وحماية السيرفرات بجدران حماية ذكية (Cloudflare / WAF).',
            'We enforce enterprise-grade security protocols across all layers, including full HTTPS/TLS 1.3 encryption in transit, strict database isolation, and intelligent firewall defenses (Cloudflare / WAF).'
          )}
        </p>
        <p>
          {pick(
            locale,
            'نحتفظ ببيانات حسابك طالما كان حسابك نشطاً. عند تقديم طلب حذف، يتم مسح السجلات فوراً من خوادم الإنتاج، وتتلاشى من النسخ الاحتياطية المؤقتة خلال دورة الحفظ الروتينية (30 يوماً كحد أقصى).',
            'We retain account records for as long as your profile remains active. Upon an erasure request, data is deleted immediately from production environments and purged from rolling operational backups within 30 days.'
          )}
        </p>
      </LexSection>

      {/* ——— Article 9: Children ——— */}
      <LexSection
        id="children"
        index="09"
        kicker={pick(locale, 'الأمان الرقمي', 'Child Safety')}
        title={pick(locale, 'حماية خصوصية الأطفال والقُصَّر', 'Children and Minor Protection')}
      >
        <p>
          {pick(
            locale,
            'منصة يلا سبورت موجهة للجمهور العام من عشاق الرياضة، ولا تستهدف جمع بيانات الأطفال دون سن 13 عاماً عمداً. إذا علمنا بأننا جمعنا معلومات تخص طفلاً دون موافقة ولي الأمر، فإننا نتخذ تدابير فورية لحذف تلك البيانات.',
            'Yalla Sport is a sports information portal designed for general audiences and does not knowingly collect personal information from children under 13. If we discover inadvertent receipt of such data without parental consent, we will purge it immediately.'
          )}
        </p>
      </LexSection>

      {/* ——— Article 10: Contact ——— */}
      <LexSection
        id="contact"
        index="10"
        kicker={pick(locale, 'قنوات الدعم', 'Direct Assistance')}
        title={pick(locale, 'التواصل مع مسؤول حماية البيانات', 'Contact Our Privacy & Trust Team')}
      >
        <p>
          {pick(
            locale,
            'إذا كانت لديك أي أسئلة أو استفسارات حول سياسة الخصوصية هذه، أو كنت ترغب في ممارسة أي من حقوقك المتعلقة ببياناتك، يمكنك التواصل معنا مباشرة عبر البريد الإلكتروني المعتمد أو عبر مركز الإبلاغ والدعم في المنصة:',
            'If you have inquiries regarding this Privacy Policy or wish to exercise your statutory rights, please reach out to our team directly via our verified email or through the integrated Report Center:'
          )}
        </p>

        <div className="flex flex-wrap items-center gap-3 mt-4">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[var(--lex-accent)] text-white hover:opacity-90 transition-opacity shadow-lg shadow-[var(--lex-accent)]/20"
          >
            <Mail className="w-4 h-4" />
            <span>{CONTACT_EMAIL}</span>
          </a>
        </div>
      </LexSection>
    </LexChamber>
  );
}
