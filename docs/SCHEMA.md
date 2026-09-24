# Prisma Schema — الجداول الرئيسية

المصدر: `prisma/schema.prisma`. العميل المولَّد: `src/generated/prisma`.

كل `DateTime` في Postgres يُخزَّن كـ timestamptz (UTC). العرض يتم في `Asia/Riyadh` أو منطقة المستخدم (`yalla-tz`).

## الكيانات الرياضية (سجل واحد لكل كيان)

| الجدول | الغرض |
|---|---|
| `Team` | نادٍ واحد بـ `externalId` فريد. `name` + `officialName` (مثل Real Madrid CF). الاسم العربي في `EntityTranslation` لنفس `id`، ليس صفاً ثانياً. |
| `Player` | لاعب واحد بنفس القاعدة: `name` / `officialName` + ترجمة عربية اختيارية. |
| `League` | بطولة واحدة: `name` / `officialName` + ترجمة. |
| `EntityTranslation` | `@@unique([entityType, entityId, locale])` — عرض عربي/إنجليزي لنفس الكيان. |
| `Coach` | مدرب وربط اختياري بالفريق الحالي. |
| `Venue` / `Referee` | ملعب وحكم. |
| `Sport` | عقدة رياضة (`officialName` + `name`). كرة القدم: `sport_football`. |
| `CompetitionSeason` | موسم بطولة (`leagueId` + `year`). |
| `SportEvent` | حدث 1:1 مع `Match` لتوسيع الرياضات لاحقاً دون تفكيك الصفحات. |

## المباريات واللوح

| الجدول | الغرض |
|---|---|
| `Match` | مباراة المصدر: حالة، نتيجة، `kickoffAt` UTC، `externalId`. |
| `MatchEvent` | أهداف وبطاقات وتبديلات. |
| `MatchLineup` | تشكيل حقيقي أو متوقع. |
| `MatchStatistic` | استحواذ وتسديد لكل فريق. |
| `MatchChannel` / `Channel` | قنوات الدليل إن وُجدت صفوف حقيقية. |
| `MatchPoll` / `MatchReaction` / `MatchCommentator` | استطلاع وتفاعل وتعليق صوتي مكتبي. |
| `Standing` | ترتيب موسم: نقاط وأهداف. |
| `Transfer` | صفقة لاعب من المصدر. |
| `PlayerTeam` | ارتباط لاعب بنادٍ عبر فترة. |

## الأخبار والمكتب

| الجدول | الغرض |
|---|---|
| `News` | خبر تحريري. الاستيراد يدخل `PENDING_REVIEW`. المشاهدات من منارة العميل بعد النشر. |
| `NewsTranslation` | ترجمة خبر لكل لغة. |
| `NewsEntityLink` | ربط خبر بفريق/لاعب/بطولة. |
| `DeskMessage` | تواصل وتقارير من الموقع. |
| `Comment` | تعليقات المستخدم (أخبار/مباريات حسب الاستخدام). |

## المستخدم والحساب

| الجدول | الغرض |
|---|---|
| `User` | حساب + `role` لـ RBAC. |
| `Account` / `Session` / `VerificationToken` | NextAuth. |
| `UserFavorite` | متابعة فرق/بطولات/مباريات. |
| `Prediction` | توقع نتيجة مباراة ونقاط. |
| `MatchReminder` / `Notification` / `PushSubscription` | تذكير ودفع. |
| `Subscription` | طبقة اشتراك؛ الدفع التجاري مطفأ في الكود. |

## بث وأصول (جاهزة للعقد لاحقاً)

| الجدول | الغرض |
|---|---|
| `StreamAsset` | أصل HLS/DASH مربوط بمباراة أو حلقة. |
| `License` | رخصة بيانات/محتوى/بث. |
| `Episode` ونماذج VOD المرتبطة | كتالوج مرخّص إن وُجد. |

## يوتيوب وتشغيل الموقع

جداول رف الفيديو (إن وُجدت في نفس الملف) تخزّن كليبات مجلوبة بالكرون، لا تختلق مشاهدات.

## مبدأ الهوية

- المزامنة تتم بـ `externalId` (upsert). ريال مدريد صف واحد.
- لا تُنشأ ترجمة عربية كفريق جديد.
- النسخ الاحتياطي يعد هذه الجداول عبر `/api/system/backup`.
