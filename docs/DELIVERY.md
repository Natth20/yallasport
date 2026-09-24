# يلا سبورت — تسليم المشروع

هذا الملف يجمع ما يطلبه التسليم: مصدر الكود، المخطط، الترحيل، واجهات البرمجة، النشر، النسخ الاحتياطي، والحسابات.

## 1. مصدر الكود

- المستودع: شجرة Next.js 16 (App Router) في الجذر.
- التطبيق: `src/app/[locale]/…`
- المكتبات: `src/lib/`
- المكوّنات: `src/components/`
- التشغيل المحلي: `pnpm install` ثم `pnpm dev` (المنفذ 3000).

الحسابات والبيئة **ليست** داخل المستودع. ضع المفاتيح في `.env` عندك أنت، لا عند المبرمج بعد التسليم.

## 2. Prisma Schema

- الملف: `prisma/schema.prisma`
- العميل المولَّد: `src/generated/prisma` حسب إعداد المشروع

## 3. Migrations

انظر `prisma/MIGRATIONS.md`. للإنتاج: `pnpm exec prisma migrate deploy`. لا تستخدم `db push` على قاعدة مشتركة.

## 4. وثائق أخرى في هذا المجلد

- [API.md](./API.md) — مسارات الواجهة
- [DEPLOY.md](./DEPLOY.md) — النشر
- [BACKUP.md](./BACKUP.md) — النسخ الاحتياطي والاستعادة
- [ENV.md](./ENV.md) — قائمة المتغيرات الكاملة
- [SCHEMA.md](./SCHEMA.md) — شرح الجداول

## 5. الحسابات تحت سيطرتك

هذا المستودع **لا يثبت** ملكية GitHub/Vercel/Cloudflare/Neon من الشيفرة. إن كان أي حساب باسم طرف ثالث، انقله فوراً كما في التقرير النهائي.

انقل أو أعد إنشاء هذه الحسابات باسمك:

| خدمة | الاستخدام |
|---|---|
| PostgreSQL | بيانات المباريات، الأخبار، المستخدمين |
| Cloudflare | الدومين، DNS، البريد (MX/SPF/DKIM لـ Resend) |
| Resend أو SendGrid | تنبيهات المكتب والنسخ الاحتياطي |
| API-Football | مصدر النتائج والملفات |
| Google Analytics (اختياري) | `NEXT_PUBLIC_GA_MEASUREMENT_ID` |
| Vercel / مستضيف Node | التشغيل |

البث المدفوع والتذاكر **مطفأة في الكود** (`STREAMING_ENABLED = false`, `PAYMENTS_ENABLED = false`) حتى يوجد عقد ومفتاح حقيقيان.

## 6. ما لا يُسلَّم كمكتمل من هنا

- إثبات وصول بريد إلى صندوق `yallasport.com` يحتاج فحص Cloudflare والصندوق عندك.
- Web Vitals على الدومين الحي تحتاج Lighthouse/CrUX بعد النشر، لا قياس `localhost`.
