# يلا سبورت

منصة كرة قدم عربية (RTL أولاً، `/ar` الافتراضي و`/en` موازٍ). النتائج والجداول والملفات والأخبار تأتي من مصدر حقيقي أو من القاعدة بعد المزامنة. لا تُختلق نتائج ولا عدّادات مشاهدة في العرض. البث المدفوع والدفع **مطفآن في الكود** حتى يوجد عقد ومفتاح.

## تشغيل المشروع من الصفر

المتطلبات: Node.js 20+، pnpm، Postgres.

1. انسخ `.env.example` إلى `.env` واملأ على الأقل `DATABASE_URL` و`AUTH_SECRET`.
2. ثبّت الاعتماديات وولّد عميل Prisma:

```bash
pnpm install
pnpm exec prisma generate
pnpm exec prisma migrate deploy
```

3. شغّل التطوير:

```bash
pnpm dev
```

4. افتح [http://localhost:3000/ar](http://localhost:3000/ar) ثم `/en`.

أوامر مفيدة:

```bash
pnpm test
pnpm lint
pnpm build
```

بدون `SPORTS_API_KEY` حقيقي تبقى طبقة الرياضة فارغة (لا مباريات وهمية). استيراد RSS يدخل `PENDING_REVIEW`.

## هيكل سريع

- التطبيق: `src/app/[locale]/…`
- المكتبات: `src/lib/`
- الواجهات: `src/components/`
- المخطط: `prisma/schema.prisma`

## التوثيق (حزمة التسليم)

- [docs/DELIVERY.md](docs/DELIVERY.md) — فهرس التسليم والحسابات
- [docs/API.md](docs/API.md) — مسارات الواجهة الداخلية
- [docs/DEPLOY.md](docs/DEPLOY.md) — النشر
- [docs/BACKUP.md](docs/BACKUP.md) — النسخ والاستعادة
- [docs/ENV.md](docs/ENV.md) — كل متغيرات البيئة
- [docs/SCHEMA.md](docs/SCHEMA.md) — شرح الجداول الرئيسية
- [docs/AUDIT.md](docs/AUDIT.md) — تدقيق البريد والـ DNS
- [prisma/MIGRATIONS.md](prisma/MIGRATIONS.md) — الترحيل

## مبدأ البيانات والأسماء

كل فريق/لاعب/بطولة صف واحد (`externalId`). الحقل `officialName` للاسم الرسمي، والعرض العربي عبر المعجم + `EntityTranslation` لنفس المعرّف.

الأوقات تُخزَّن UTC وتُعرض حسب `yalla-tz` أو الافتراضي `Asia/Riyadh` (بدون توقيت صيفي).
