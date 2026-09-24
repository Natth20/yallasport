# النسخ الاحتياطي

## الآلية في الكود

- المسار: `GET /api/system/backup?kind=daily|weekly`
- الحماية: `CRON_SECRET`
- التنفيذ: `src/lib/ops/backup.ts`
- يتحقق من اتصال Postgres، يعد جداول أساسية، ي conserv عينات، يسجّل في جدول `BackupRun` (يُنشأ إن لزم)، ويرسل بريداً عبر `sendSiteMail` إن وُجد مفتاح.

جدولة مقترحة (Cloudflare Cron أو Vercel Cron) يومياً على المسار مع الرأس السري.

## قاعدة البيانات

خارج التطبيق احتفظ بنسخة Postgres دورية عند مزوّد الاستضافة (لقطة يومية + أسبوعية).

### الاستعادة

1. أنشئ قاعدة فارغة أو أوقف التطبيق.
2. استعد اللقطة (`pg_restore` أو واجهة Neon/Supabase).
3. `pnpm exec prisma migrate deploy` ليصل المخطط لآخر ترحيل.
4. عبّئ `.env` ثم `pnpm build` و`pnpm start`.
5. افحص `/ar` و`/admin` وعدد صفوف `Match`/`News` عبر مسار النسخ أو Prisma Studio.

تفاصيل ترحيل المخطط: `prisma/MIGRATIONS.md`.
