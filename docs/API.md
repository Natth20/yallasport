# واجهات البرمجة (API)

المصادقة للوظائف الإدارية والـ cron: رأس `Authorization: Bearer <CRON_SECRET>` عبر `isAuthorizedCron`، ما عدا مسارات المستخدم التي تعتمد الجلسة (NextAuth).

## رياضة

| المسار | الغرض |
|---|---|
| `GET /api/sports/live` | المباريات المباشرة من القاعدة/الكاش |
| `GET /api/sports/live/stream` | تدفق الحالة المباشرة |
| `GET /api/sports/match/[id]/live` | تحديث مركز مباراة واحدة |
| `GET /api/sports/meta` | بيانات وصفية |
| `POST /api/sports/sync` | مزامنة المصدر (cron) |
| `POST /api/sports/predict` | توقع المستخدم (جلسة) |
| `GET/POST /api/sports/polls` | استفتاءات موجودة مسبقاً |
| `POST /api/sports/comments` | تعليقات |
| `POST /api/sports/reactions` | تفاعلات المباراة |

## أخبار

| المسار | الغرض |
|---|---|
| `GET /api/news/cron` | استيراد RSS المعتمد → `PENDING_REVIEW` |
| `POST /api/news/import` | استيراد مكتبي |
| `POST /api/news/view` | عدّاد المشاهدات من العميل (بعد فتح خبر منشور) |
| `GET/POST /api/admin/news` | اعتماد/إدارة الأخبار |
| `POST /api/admin/news-links` | ربط الكيانات |

## مستخدم وجلسة

| المسار | الغرض |
|---|---|
| `/api/auth/[...nextauth]` | تسجيل الدخول |
| `POST /api/user/favorite` | المتابعة |
| `POST /api/user/match-reminder` | تذكير مباراة |
| `POST /api/user/notifications/prefs` | تفضيلات التنبيه |
| `POST /api/user/push/subscribe` | اشتراك الدفع |
| `GET /api/search/suggestions` | اقتراح البحث |

## بث (معطّل حتى يُفعَّل العلم في الكود)

`/api/stream/playback`, `/api/stream/availability`, `/api/stream/live`, `/api/stream/proxy`, `/api/admin/streaming/sync`

## مكتب ونظام

| المسار | الغرض |
|---|---|
| `POST /api/desk/messages` | رسائل التواصل تُحفظ في اللوحة وتُرسل بالبريد إن وُجد مفتاح |
| `GET /api/system/backup` | نسخة احتياطية مجدولة (cron) |
| `/api/notifications/sse` | أحداث الخادم |
| `/api/notifications/reminders` | تذكيرات |
| `/api/admin/translations` | ترجمات |
| `/api/admin/comments/delete` | حذف تعليق |
| `/api/youtube/cron` | رف يوتيوب |

لا تُخترع نتائج أو جداول عبر هذه المسارات؛ المصدر هو القاعدة بعد المزامنة.
