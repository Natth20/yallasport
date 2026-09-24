# تقرير التشخيص الشامل لمشروع YallaSport (المرحلة 0)

تاريخ التشخيص: 2026-09-24
حالة الفحص الأولي: ✅ TypeScript Typecheck نجح (0 errors)
نقطة الاستعادة (Backup): `git tag before-rebuild` | فرع العمل: `rebuild/phase-0`

---

## 📊 ملخص الأرقام والتشخيص العام

| المقياس | القيمة الحالية | الهدف بعد إعادة البناء | التقييم |
| :--- | :--- | :--- | :--- |
| **إجمالي ملفات CSS** | 19 ملف | 1 global + CSS Modules مستقلة | ⚠️ تراكم وتداخل عالي |
| **إجمالي حجم CSS** | 713.7 KB | < 120 KB إجمالي | ❌ متضخم للغاية |
| **أسطر globals.css** | 31277 سطر | < 600 سطر | ❌ كود ضخم ومعقد |
| **استخدامات !important** | 150 | 0 | ❌ تكسير Specificity |
| **عدد الصفحات (Pages)** | 67 صفحة | 67 صفحة نظيفة ومترابطة | 🟡 بعضها صفحات Placeholder |
| **عدد المكونات (Components)** | 141 مكوّن | مكتبة ui موحدة + مكونات مخصصة | 🟡 50 مستخدمة مباشرة / الباقي مكرر أو معزول |

---

## 🎨 1. تشخيص ملفات CSS والتصاميم الحالية

### تفاصيل ملفات الـ CSS:
| مسار الملف | الحجم (KB) | عدد الأسطر | استخدامات `!important` |
| :--- | :--- | :--- | :--- |
| `src/app/globals.css` | 600.21 KB | 31277 | 149 |
| `src/components/about/about-house.module.css` | 3.76 KB | 122 | 0 |
| `src/components/admin/admin-desk.module.css` | 0.65 KB | 34 | 0 |
| `src/components/auth/auth-gate.module.css` | 0.22 KB | 15 | 0 |
| `src/components/brand/brand-build.module.css` | 4.29 KB | 187 | 0 |
| `src/components/contact/contact-house.module.css` | 3.12 KB | 104 | 0 |
| `src/components/entity/entity.module.css` | 4.18 KB | 164 | 0 |
| `src/components/front/front-hall.css` | 22.07 KB | 1180 | 0 |
| `src/components/house/house.module.css` | 4.09 KB | 169 | 0 |
| `src/components/leagues/league-house.module.css` | 0.97 KB | 50 | 0 |
| `src/components/leagues/leagues-atlas.module.css` | 1.33 KB | 51 | 0 |
| `src/components/legal/lex.module.css` | 22.30 KB | 983 | 0 |
| `src/components/live/live-hall.module.css` | 2.72 KB | 108 | 0 |
| `src/components/matches/matches-hall.module.css` | 1.06 KB | 54 | 0 |
| `src/components/news/news-chamber.module.css` | 17.28 KB | 947 | 0 |
| `src/components/news/story-folio.module.css` | 13.44 KB | 705 | 0 |
| `src/components/photos/photo-hall.module.css` | 3.19 KB | 133 | 0 |
| `src/components/predictions/predictions-house.module.css` | 4.26 KB | 160 | 0 |
| `src/components/youtube/youtube.module.css` | 4.56 KB | 210 | 1 |

### المشاكل المكتشفة في CSS:
1. **تضخم ملف `globals.css`**: يحتوي على أكثر من 31277 سطر كود، ويجمع بين قواعد عامة، مكونات كاملة، وألوان ثابتة عشوائية.
2. **تداخل Specificity و `!important`**: يوجد أكثر من 150 تصريح `!important` يمنع التخصيص النظيف ويخلق صراعات بين Tailwind v4 و CSS Modules.
3. **تكرار وتشتت الـ CSS Modules**: وجود ملفات مثل `front-hall.css` و `lex.module.css` و `news-chamber.module.css` بحجوم كبيرة ومكررة لنفس أنماط البطاقات والأزرار والحاويات.
4. **غياب Design Tokens موحدة**: القيم مثل الألوان والـ border-radius والظلال معرّفة بشكل يدوي مكرر في عدة أماكن بدلاً من استخدام CSS variables قياسية.

---

## 📑 2. قائمة وتشخيص الصفحات (67 صفحة)

| المسار (Route) | مسار الملف | الأسطر | النوع | الحالة |
| :--- | :--- | :--- | :--- | :--- |
| `/ (Home)` | `[locale]/page.tsx` | 23 | Server | Working / Active |
| `/about` | `[locale]/about/page.tsx` | 28 | Server | Working / Active |
| `/admin` | `[locale]/admin/page.tsx` | 119 | Server | Working / Active |
| `/admin/ads` | `[locale]/admin/ads/page.tsx` | 84 | Server | Working / Active |
| `/admin/comments` | `[locale]/admin/comments/page.tsx` | 149 | Server | Working / Active |
| `/admin/inbox` | `[locale]/admin/inbox/page.tsx` | 166 | Server | Working / Active |
| `/admin/kpis` | `[locale]/admin/kpis/page.tsx` | 98 | Server | Working / Active |
| `/admin/leagues` | `[locale]/admin/leagues/page.tsx` | 60 | Server | Has Placeholders |
| `/admin/licenses` | `[locale]/admin/licenses/page.tsx` | 120 | Server | Has Placeholders |
| `/admin/matches` | `[locale]/admin/matches/page.tsx` | 133 | Server | Working / Active |
| `/admin/matches/[id]` | `[locale]/admin/matches/[id]/page.tsx` | 87 | Server | Has Placeholders |
| `/admin/news` | `[locale]/admin/news/page.tsx` | 292 | Server | Has Placeholders |
| `/admin/news/calendar` | `[locale]/admin/news/calendar/page.tsx` | 80 | Server | Working / Active |
| `/admin/players` | `[locale]/admin/players/page.tsx` | 65 | Server | Working / Active |
| `/admin/streaming` | `[locale]/admin/streaming/page.tsx` | 93 | Server | Has Placeholders |
| `/admin/teams` | `[locale]/admin/teams/page.tsx` | 62 | Server | Has Placeholders |
| `/admin/translations` | `[locale]/admin/translations/page.tsx` | 32 | Server | Working / Active |
| `/admin/tv-guide` | `[locale]/admin/tv-guide/page.tsx` | 99 | Server | Working / Active |
| `/admin/users` | `[locale]/admin/users/page.tsx` | 130 | Server | Working / Active |
| `/admin/vod` | `[locale]/admin/vod/page.tsx` | 72 | Server | Working / Active |
| `/coach/[slug]` | `[locale]/coach/[slug]/page.tsx` | 327 | Server | Working / Active |
| `/compare` | `[locale]/compare/page.tsx` | 67 | Server | Working / Active |
| `/compare-players` | `[locale]/compare-players/page.tsx` | 249 | Server | Working / Active |
| `/contact` | `[locale]/contact/page.tsx` | 26 | Server | Working / Active |
| `/cookies` | `[locale]/cookies/page.tsx` | 36 | Server | Working / Active |
| `/copyright` | `[locale]/copyright/page.tsx` | 35 | Server | Working / Active |
| `/favorites` | `[locale]/favorites/page.tsx` | 333 | Server | Working / Active |
| `/forgot-password` | `[locale]/forgot-password/page.tsx` | 53 | Server | Working / Active |
| `/leaderboard` | `[locale]/leaderboard/page.tsx` | 28 | Server | Working / Active |
| `/league/[slug]` | `[locale]/league/[slug]/page.tsx` | 94 | Server | Working / Active |
| `/league/[slug]/archive` | `[locale]/league/[slug]/archive/page.tsx` | 205 | Server | Working / Active |
| `/league/[slug]/fixtures` | `[locale]/league/[slug]/fixtures/page.tsx` | 387 | Server | Working / Active |
| `/league/[slug]/standings` | `[locale]/league/[slug]/standings/page.tsx` | 271 | Server | Working / Active |
| `/league/[slug]/top-scorers` | `[locale]/league/[slug]/top-scorers/page.tsx` | 273 | Server | Working / Active |
| `/leagues` | `[locale]/leagues/page.tsx` | 492 | Server | Working / Active |
| `/live` | `[locale]/live/page.tsx` | 591 | Server | Has Placeholders |
| `/login` | `[locale]/login/page.tsx` | 56 | Server | Working / Active |
| `/match/[id]` | `[locale]/match/[id]/page.tsx` | 661 | Server | Working / Active |
| `/matches` | `[locale]/matches/page.tsx` | 2076 | Server | Has Placeholders |
| `/news` | `[locale]/news/page.tsx` | 382 | Server | Working / Active |
| `/news/[slug]` | `[locale]/news/[slug]/page.tsx` | 288 | Server | Working / Active |
| `/page.tsx` | `page.tsx` | 6 | Server | Minimal / Stub |
| `/photos` | `[locale]/photos/page.tsx` | 113 | Server | Working / Active |
| `/player/[slug]` | `[locale]/player/[slug]/page.tsx` | 99 | Server | Working / Active |
| `/privacy` | `[locale]/privacy/page.tsx` | 36 | Server | Working / Active |
| `/profile` | `[locale]/profile/page.tsx` | 194 | Server | Working / Active |
| `/profile/edit` | `[locale]/profile/edit/page.tsx` | 60 | Server | Working / Active |
| `/register` | `[locale]/register/page.tsx` | 51 | Server | Working / Active |
| `/report` | `[locale]/report/page.tsx` | 35 | Server | Working / Active |
| `/search` | `[locale]/search/page.tsx` | 50 | Server | Working / Active |
| `/settings` | `[locale]/settings/page.tsx` | 19 | Server | Working / Active |
| `/settings/notifications` | `[locale]/settings/notifications/page.tsx` | 61 | Server | Working / Active |
| `/stats` | `[locale]/stats/page.tsx` | 217 | Server | Working / Active |
| `/subscribe` | `[locale]/subscribe/page.tsx` | 12 | Server | Minimal / Stub |
| `/team/[slug]` | `[locale]/team/[slug]/page.tsx` | 114 | Server | Working / Active |
| `/terms` | `[locale]/terms/page.tsx` | 35 | Server | Working / Active |
| `/transfers` | `[locale]/transfers/page.tsx` | 199 | Server | Working / Active |
| `/tv-guide` | `[locale]/tv-guide/page.tsx` | 8 | Server | Minimal / Stub |
| `/video` | `[locale]/video/page.tsx` | 10 | Server | Minimal / Stub |
| `/videos` | `[locale]/videos/page.tsx` | 83 | Server | Working / Active |
| `/videos/archive` | `[locale]/videos/archive/page.tsx` | 75 | Server | Working / Active |
| `/videos/reels` | `[locale]/videos/reels/page.tsx` | 83 | Server | Working / Active |
| `/vod` | `[locale]/vod/page.tsx` | 26 | Server | Working / Active |
| `/vod/[slug]` | `[locale]/vod/[slug]/page.tsx` | 82 | Server | Working / Active |
| `/vod/player/[id]` | `[locale]/vod/player/[id]/page.tsx` | 145 | Server | Working / Active |
| `/watch` | `[locale]/watch/page.tsx` | 26 | Server | Working / Active |
| `/watch/[id]` | `[locale]/watch/[id]/page.tsx` | 90 | Server | Working / Active |

---

## 🧩 3. تشخيص المكونات (Used vs Orphan / Legacy Components)

### إحصائية المكونات:
- **المكونات النشطة والمستخدمة مباشرة**: 125 مكوّن
- **المكونات المعزولة / المرشحة للأرشفة إلى `legacy/`**: 16 مكوّن

### عينة من أهم المكونات المستخدمة:
- **`FrontMark`** (`front/FrontMark.tsx`): مستخدم في 51 ملفات (app/[locale]/about/page.tsx, app/[locale]/coach/[slug]/page.tsx, app/[locale]/compare/page.tsx)
- **`ClientTime`** (`datetime/ClientTime.tsx`): مستخدم في 31 ملفات (app/[locale]/admin/page.tsx, app/[locale]/league/[slug]/fixtures/page.tsx, app/[locale]/live/page.tsx)
- **`LeagueCrest`** (`leagues/LeagueCrest.tsx`): مستخدم في 24 ملفات (app/[locale]/coach/[slug]/page.tsx, app/[locale]/favorites/page.tsx, app/[locale]/league/[slug]/archive/page.tsx)
- **`BrandMark`** (`brand/BrandMark.tsx`): مستخدم في 18 ملفات (app/[locale]/compare-players/page.tsx, app/[locale]/live/page.tsx, app/[locale]/vod/player/[id]/page.tsx)
- **`PageMotion`** (`motion/PageMotion.tsx`): مستخدم في 15 ملفات (app/[locale]/favorites/page.tsx, app/[locale]/layout.tsx, app/[locale]/live/page.tsx)
- **`NewsOrnaments`** (`news/NewsOrnaments.tsx`): مستخدم في 8 ملفات (app/[locale]/match/[id]/page.tsx, app/[locale]/vod/player/[id]/page.tsx, components/leagues/LeagueDossier.tsx)
- **`CraftMarks`** (`decor/CraftMarks.tsx`): مستخدم في 7 ملفات (app/[locale]/news/page.tsx, components/auth/AuthGate.tsx, components/layout/Footer.tsx)
- **`SalonStage`** (`salon/SalonStage.tsx`): مستخدم في 7 ملفات (app/[locale]/favorites/page.tsx, app/[locale]/photos/page.tsx, app/[locale]/stats/page.tsx)
- **`JsonLd`** (`seo/JsonLd.tsx`): مستخدم في 6 ملفات (app/[locale]/coach/[slug]/page.tsx, app/[locale]/layout.tsx, app/[locale]/league/[slug]/page.tsx)
- **`versus`** (`versus/versus.ts`): مستخدم في 6 ملفات (app/[locale]/compare/page.tsx, app/[locale]/matches/page.tsx, components/matches/KickoffTimeline.tsx)
- **`CrestImage`** (`common/CrestImage.tsx`): مستخدم في 5 ملفات (app/[locale]/match/[id]/page.tsx, components/home/HomeFanPoll.tsx, components/predictions/PredictionsHouse.tsx)
- **`index`** (`leagues/index.ts`): مستخدم في 5 ملفات (generated/prisma/default.d.ts, generated/prisma/index-browser.js, generated/prisma/wasm.d.ts)
- **`LexChamber`** (`legal/LexChamber.tsx`): مستخدم في 5 ملفات (components/legal/CookieLedger.tsx, components/legal/CopyrightMark.tsx, components/legal/PrivacyVault.tsx)
- **`CoverImage`** (`common/CoverImage.tsx`): مستخدم في 4 ملفات (components/news/desk/DeskStories.tsx, components/news/NewsInk.tsx, components/news/StoryFolio.tsx)
- **`EntityFrame`** (`entity/EntityFrame.tsx`): مستخدم في 4 ملفات (app/[locale]/coach/[slug]/page.tsx, components/players/PlayerDossier.tsx, components/sports/MatchDossier.tsx)
- **`LeagueChapterShell`** (`leagues/LeagueChapterShell.tsx`): مستخدم في 4 ملفات (app/[locale]/league/[slug]/archive/page.tsx, app/[locale]/league/[slug]/fixtures/page.tsx, app/[locale]/league/[slug]/standings/page.tsx)
- **`LeagueFollowChip`** (`leagues/LeagueFollowChip.tsx`): مستخدم في 4 ملفات (components/leagues/index.ts, components/leagues/LeagueDeskCard.tsx, components/leagues/LeagueDossier.tsx)
- **`MatchStreamPlayer`** (`streaming/MatchStreamPlayer.tsx`): مستخدم في 4 ملفات (app/[locale]/match/[id]/page.tsx, app/[locale]/vod/player/[id]/page.tsx, components/streaming/WatchBooth.tsx)
- **`YoutubeDesk`** (`youtube/YoutubeDesk.tsx`): مستخدم في 4 ملفات (app/[locale]/videos/archive/page.tsx, app/[locale]/videos/page.tsx, app/[locale]/videos/reels/page.tsx)
- **`AuthGate`** (`auth/AuthGate.tsx`): مستخدم في 3 ملفات (app/[locale]/forgot-password/page.tsx, app/[locale]/login/page.tsx, app/[locale]/register/page.tsx)
- **`BrandBuildScreen`** (`brand/BrandBuildScreen.tsx`): مستخدم في 3 ملفات (app/[locale]/admin/loading.tsx, app/[locale]/loading.tsx, components/front/FrontMark.tsx)
- **`EntityPortrait`** (`common/EntityPortrait.tsx`): مستخدم في 3 ملفات (components/common/CoverImage.tsx, components/common/CrestImage.tsx, components/news/NewsCard.tsx)
- **`FrontMatchTile`** (`front/FrontMatchTile.tsx`): مستخدم في 3 ملفات (components/front/chapters/BoardChapter.tsx, components/front/FrontHero.tsx, components/front/FrontStage.tsx)
- **`LeagueChapterNav`** (`leagues/LeagueChapterNav.tsx`): مستخدم في 3 ملفات (components/leagues/index.ts, components/leagues/LeagueChapterShell.tsx, components/leagues/LeagueDossier.tsx)
- **`seek`** (`search/seek.ts`): مستخدم في 3 ملفات (components/salon/SalonStage.tsx, components/search/SearchHouse.tsx, components/search/SearchTicket.tsx)

### المكونات غير المستخدمة مباشرة (Orphan / Candidates for Legacy):
- `FootballLoader` (`src/components/common/FootballLoader.tsx`)
- `FormGuidePills` (`src/components/common/FormGuidePills.tsx`)
- `DeskPage` (`src/components/desk/DeskPage.tsx`)
- `FrontHero` (`src/components/front/FrontHero.tsx`)
- `FrontMoment` (`src/components/front/FrontMoment.tsx`)
- `MyYallaSport` (`src/components/layout/MyYallaSport.tsx`)
- `NetworkQualityHint` (`src/components/live/NetworkQualityHint.tsx`)
- `DayWire` (`src/components/matches/DayWire.tsx`)
- `MatchdayLedger` (`src/components/matches/MatchdayLedger.tsx`)
- `PinnedMatchesBar` (`src/components/matches/PinnedMatchesBar.tsx`)
- `DeskStories` (`src/components/news/desk/DeskStories.tsx`)
- `NewsShareButton` (`src/components/news/NewsShareButton.tsx`)
- `ReadingProgressBar` (`src/components/news/ReadingProgressBar.tsx`)
- `PwaInstallBanner` (`src/components/pwa/PwaInstallBanner.tsx`)
- `LiveTicker` (`src/components/sports/LiveTicker.tsx`)
- `MatchDetailTabs` (`src/components/sports/MatchDetailTabs.tsx`)

---

## 🏗️ 4. توصيات وخطة تنفيذ المراحل القادمة

1. **المرحلة 1 (Design System جديد)**:
   - إنشاء `globals.css.backup` للرجوع إليه عند الحاجة.
   - بناء `globals.css` نقي ومختصر (~500 سطر) يحدد المتغيرات اللونية، خط Cairo، أساسيات RTL/LTR، والأنماط الأساسية بدون أي `!important`.
   - توثيق المتغيرات في `docs/design-system.md`.

2. **المرحلة 2 (مكتبة UI الموحدة)**:
   - بناء مكونات `src/components/ui/` (Button, Card, Badge, Input, Tabs, Modal, Skeleton, Dropdown, Tooltip, Loader) مع CSS Modules مستقلة.

3. **المرحلة 3 (Header & Footer)**:
   - إعادة بناء الملاحة العلوية والسفلية بنظافة كاملة تدعم اللغة وتغيير الثيم.

4. **المراحل 4 - 8 (إعادة بناء الشاشات حسب الأولوية)**:
   - الرئيسية (Home) -> المباريات -> البطولات والفرق واللاعبين -> الأخبار والبث -> باقي الصفحات.

5. **المرحلة 9 (التنظيف النهائي)**:
   - نقل الملفات الميتة إلى `legacy/` وحذف القواعد الزائدة.

6. **المرحلة 10 (التحسين والاختبار النهائي)**:
   - اختبار الاستجابة لجميع الشاشات والأداء و SEO و PWA.

---

## 🛡️ حالة النسخ الاحتياطي والسلامة
- **Git Branch**: `rebuild/phase-0`
- **Git Tag**: `before-rebuild`
- **Backend & Database Integrity**: لم يتم المساس بأي ملف في `src/lib/` أو `src/app/api/` أو `prisma/`.
