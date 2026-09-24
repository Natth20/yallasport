# النشر

## المتطلبات

- Node.js متوافق مع المشروع (`package.json` engines إن وُجد)
- PostgreSQL
- `pnpm install`
- `pnpm exec prisma migrate deploy`
- `pnpm build` ثم `pnpm start`

أو منصة مثل Vercel مع نفس متغيرات البيئة و`DATABASE_URL`.

## متغيرات أساسية

| المتغير | الغرض |
|---|---|
| `DATABASE_URL` | Postgres |
| `AUTH_SECRET` / أسرار NextAuth | الجلسات |
| `NEXT_PUBLIC_SITE_URL` | عنوان الموقع العلني (يفضّل `https://yallasport.com`) |
| `CRON_SECRET` | حماية مسارات المزامنة والنسخ |
| `RESEND_API_KEY` أو `SENDGRID_API_KEY` | البريد |
| `MAIL_FROM` | عنوان المرسل بعد توثيق النطاق |
| `SITE_INBOX_EMAIL` | صندوق التنبيهات (افتراضي `contact@yallasport.com`) |
| مفاتيح API-Football | المزامنة |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | اختياري |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | اختياري |

لا يوجد مفتاح بيئة يشغّل البث أو الدفع. ذلك تغيير صريح في `src/lib/streaming/flag.ts` و`src/lib/auth/premium.ts`.

## DNS / Resend

على Cloudflare للنطاق `yallasport.com`:

1. سجلات SPF وDKIM التي يعطيها Resend.
2. MX إن لزم صندوق الاستقبال.
3. أرسل رسالة اختبار من الموقع (نموذج تواصل) وتأكد من وصولها للصندوق الحقيقي.

هذا التحقق لا يكتمل من بيئة التطوير المحلية وحدها.

## بعد النشر

- افتح `/ar` و`/en`
- مركز مباراة مباشرة إن وُجدت
- خبر منشور
- لوحة `/admin` بحسابك
- قِس Lighthouse على الدومين الحي (LCP / INP / CLS / TTFB)
