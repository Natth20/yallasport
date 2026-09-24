# متغيرات البيئة — قائمة نهائية

انسخ هذا الجدول إلى `.env` محلياً وإلى لوحة الاستضافة (Vercel). لا ترفع `.env` إلى Git.

## إلزامية للتشغيل

| المتغير | الشرح |
|---|---|
| `DATABASE_URL` | سلسلة اتصال Postgres للمجمّع (Neon/Supabase/أي مزوّد). Prisma يستخدمها في التشغيل. |
| `DIRECT_URL` | اتصال مباشر لترحيل Prisma (`migrate`). إن غاب يُستخدم `DATABASE_URL`. |
| `AUTH_SECRET` | سر جلسات NextAuth. ولّده محلياً ولا تشاركه. |

## الموقع والبريد

| المتغير | الشرح |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | العنوان العلني، مثال `https://yallasport.com`. |
| `SITE_INBOX_EMAIL` | صندوق المكتب. الافتراضي `contact@yallasport.com`. |
| `MAIL_FROM` | عنوان المرسل بعد توثيق النطاق عند Resend، مثال `Yalla Sport <contact@yallasport.com>`. |
| `RESEND_API_KEY` | مفتاح Resend. بديل: `SENDGRID_API_KEY`. |

## الرياضة والمزامنة

| المتغير | الشرح |
|---|---|
| `SPORTS_API_KEY` | مفتاح API-Football / API-Sports. بدون مفتاح حقيقي لا تُختلق نتائج. |
| `SPORTS_API_PROVIDER` | الافتراضي `apisports`. |
| `CRON_SECRET` | رأس `Authorization: Bearer` لمسارات المزامنة والنسخ الاحتياطي. |
| `YOUTUBE_API_KEY` | سحب رف الفيديو. بدونها يبقى الرف فارغاً أو كما في القاعدة. |

## كاش وحدود

| المتغير | الشرح |
|---|---|
| `UPSTASH_REDIS_REST_URL` | Redis عبر Upstash. إن غاب يعمل التطبيق بدون هذا الكاش. |
| `UPSTASH_REDIS_REST_TOKEN` | توكن Upstash. |

## تسجيل الدخول الاجتماعي (اختياري)

| المتغير | الشرح |
|---|---|
| `AUTH_GOOGLE_ID` أو `GOOGLE_CLIENT_ID` | عميل Google OAuth. |
| `AUTH_GOOGLE_SECRET` أو `GOOGLE_CLIENT_SECRET` | سر Google OAuth. |

## تحليلات وSEO (اختياري)

| المتغير | الشرح |
|---|---|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | قياس Google Analytics. |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | تحقق Search Console. |

## إشعارات الويب (اختياري)

| المتغير | الشرح |
|---|---|
| `VAPID_PUBLIC_KEY` | مفتاح عام لـ Web Push. |
| `VAPID_PRIVATE_KEY` | المفتاح الخاص. |
| `VAPID_SUBJECT` | `mailto:` صاحب الموقع. |

## ترجمة آلية (اختياري)

| المتغير | الشرح |
|---|---|
| `TRANSLATION_PROVIDER` | إن لم يُضبط تبقى `unconfigured`. لا تُترجم الأخبار آلياً بدون مزوّد. |

## بث مرخّص (معطّل في الكود)

هذه المتغيرات لا تشغّل البث وحدها. العلم في `src/lib/streaming/flag.ts` يبقى `false` حتى يوجد عقد.

| المتغير | الشرح |
|---|---|
| `STREAMING_PROVIDER` | مفتاح المزوّد المرخّص. |
| `STREAMING_PLAYBACK_URL` | نقطة التشغيل. |
| `STREAMING_CATALOG_URL` | كتالوج الأصول. |
| `STREAMING_API_KEY` | سر المزوّد. |
| `STREAM_TOKEN_SECRET` | توقيع رموز التشغيل؛ إن غاب يُستخدم `AUTH_SECRET`. |

## غير مستخدمة في الكود الحالي

- **Cloudinary**: لا يوجد تكامل في المستودع. الصور تُخزَّن كروابط أو تُخدم عبر Next Image.
- **Supabase Auth / Storage**: غير مربوط. القاعدة Postgres عبر Prisma فقط.
- `STREAMING_ENABLED` / `PAYMENTS_ENABLED` كمتغيرات بيئة: **لا تُقرأ**. التعطيل صريح في الكود.

## تحقق سريع بعد التعبئة

```bash
pnpm exec prisma migrate deploy
pnpm dev
```

افتح `/ar` ثم أرسل رسالة من `/contact` إن وُجد مفتاح بريد.
