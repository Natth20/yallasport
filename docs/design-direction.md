# اتجاه التصميم — هوية YS المعدنية

مرجع المرحلة البصرية. الصفحات لا تُعاد تصميمها قبل اعتماد هذا الاتجاه. الموجود في `globals.css` بقي، وهذه المتغيرات توسعة فوقه.

الوضع الداكن هو المرجعية. الوضع الفاتح يستخدم نفس المعدن على سطوح أفتح.

## المعدن

تدرج واحد يُعاد استخدامه، بلمعة فاتحة في الوسط (شريط الكروم) من غير صورة ومن غير `filter: blur`.

```css
--gradient-primary: linear-gradient(118deg, #9a3412 0%, #f97316 22%, #fff7ed 38%, #f97316 52%, #dc2626 78%, #7f1d1d 100%);
--gradient-primary-hover: linear-gradient(118deg, #c2410c 0%, #fb923c 22%, #ffffff 40%, #fb923c 54%, #ef4444 80%, #991b1b 100%);
--gradient-primary-active: linear-gradient(118deg, #7c2d12 0%, #ea580c 36%, #b91c1c 100%);
--gradient-metallic-orange: var(--gradient-primary);
--gradient-metallic-silver: linear-gradient(118deg, #64748b 0%, #e2e8f0 24%, #ffffff 42%, #f8fafc 50%, #cbd5e1 68%, #94a3b8 100%);
--gradient-metallic-silver-hover: linear-gradient(118deg, #475569 0%, #f8fafc 28%, #ffffff 46%, #e2e8f0 70%, #64748b 100%);
--gradient-metallic-silver-active: linear-gradient(118deg, #334155 0%, #cbd5e1 100%);
```

| الحالة | البرتقالي | الفضي |
|---|---|---|
| ساكن | `--gradient-primary` | `--gradient-metallic-silver` |
| تمرير | `--gradient-primary-hover` | `--gradient-metallic-silver-hover` |
| ضغط | `--gradient-primary-active` | `--gradient-metallic-silver-active` |

نص الزر المعدني `#1a0a04` حتى يُقرأ على اللمعة. الفئات الجاهزة: `.ys-gradient-primary` و`.ys-gradient-metallic-orange` و`.ys-gradient-metallic-silver`.

## الأخضر

يبقى لون الفوز والنجاح والمؤشر الرياضي. البرتقالي المعدني هو البطل، بما فيه شارة «مباشر».

| المتغير | فاتح | داكن | الاستخدام |
|---|---|---|---|
| `--ys-green` | `#10b981` | `#10b981` | نجاح |
| `--ys-green-dark` | `#0a4d3a` | `#052e24` | أرضية خضراء عميقة |
| `--ys-green-soft` | `#d1fae5` | `rgb(16 185 129 / 0.15)` | خلفية شارة |
| `--ys-green-live` | `#059669` | `#34d399` | نقطة الفوز على السطح |

## السطوح والنص

أربع طبقات. الداكن يبدأ أغمق من `#0a0a0a`.

| المتغير | فاتح | داكن |
|---|---|---|
| `--ys-bg-0` | `#f4f6f8` | `#070707` |
| `--ys-bg-1` | `#ffffff` | `#0a0a0a` |
| `--ys-bg-2` | `#f8fafc` | `#121212` |
| `--ys-bg-3` | `#eef2f6` | `#1a1a1a` |
| `--ys-text` | `#0f172a` | `#f8fafc` |
| `--ys-text-secondary` | `#334155` | `#e2e8f0` |
| `--ys-text-muted` | `#64748b` | `#a1a1aa` |
| `--ys-divider` | `#e2e8f0` | `#27272a` |

`--background` و`--foreground` و`--card` و`--border` الحالية تبقى كما هي حتى لا تقفز الصفحات قبل اعتماد الاتجاه. الطبقات الجديدة للصفحات التي ستُعاد لاحقاً.

## الخط — Cairo

| الدور | المتغير | القياس | الوزن |
|---|---|---|---|
| H1 | `--ys-font-h1` | `clamp(1.75rem, 3.5vw, 2.5rem)` | `--ys-weight-display` 800 |
| H2 | `--ys-font-h2` | `clamp(1.4rem, 2.5vw, 1.875rem)` | `--ys-weight-title` 700 |
| H3 | `--ys-font-h3` | `clamp(1.2rem, 2vw, 1.5rem)` | 700 |
| H4 | `--ys-font-h4` | `1.25rem` | 700 |
| H5 | `--ys-font-h5` | `1.125rem` | 700 |
| H6 | `--ys-font-h6` | `1rem` | 700 |
| متن | `--ys-font-body` | `1rem` | `--ys-weight-body` 400 |
| صغير | `--ys-font-small` | `0.875rem` | `--ys-weight-ui` 500 |

عناوين العرض والزر المعدني 800–900. المتن 400. واجهة الأزرار والشارات 500–700.

## المسافات

قاعدة 4px. `--ys-space-1` 4px، `2` 8px، `3` 12px، `4` 16px، `5` 24px، `6` 32px، `8` 48px، `10` 64px.

## الظل

الموجود `--ys-shadow-sm` و`--ys-shadow-md` و`--ys-shadow-lg` يبقى. السلم الجديد يشير إليه ثم يضيف درجة أعمق:

| المتغير | الاستخدام |
|---|---|
| `--ys-elev-1` | شعر، حدود خفيفة |
| `--ys-elev-2` | بطاقة عادية |
| `--ys-elev-3` | بطاقة مرفوعة |
| `--ys-elev-4` | بطاقة مميزة. في الداكن `0 18px 36px -14px rgb(0 0 0 / 0.65)` |
| `--ys-shadow-metallic` | هالة برتقالية قصيرة تحت الفعل الرئيسي |

الظل ظل واحد، ليس تكديس blur.

## الزوايا

العناصر الثانوية تبقى على `--radius-sm` حتى `--radius-xl`. العناصر البارزة (زر `metallic`، بطاقة `premium`، لوحة YS) تستخدم قصّة متناظرة حتى تعمل في RTL وLTR:

```css
--ys-clip-mark: polygon(
  0.65rem 0, calc(100% - 0.65rem) 0,
  100% 0.65rem, 100% calc(100% - 0.65rem),
  calc(100% - 0.65rem) 100%, 0.65rem 100%,
  0 calc(100% - 0.65rem), 0 0.65rem
);
```

`--ys-radius-sharp` 4px للشارة الحادة. `--ys-radius-ui` 8px للعنصر الثانوي الذي لا يُقص.

## الحركة

`--ys-duration-fast` 160ms، `--ys-duration` 220ms، `--ys-ease` `cubic-bezier(0.22, 1, 0.36, 1)`.

اللمعة حركة `background-position` أو `transform` فقط. شاشة التحميل وشارة المباشر تتوقف عند `prefers-reduced-motion: reduce`.

## ما يُستخدم الآن

- زر `metallic`: التدرج البرتقالي، القصّة، ظل إسقاط واحد.
- بطاقة `premium`: حافة 1px من التدرج عبر `mask`، نفس القصّة، ظل أعمق.
- شارة `live`: التدرج نفسه مع نبض لمعان. شارة `success` تبقى خضراء.
- التحميل: لوحة `YS` معدنية ولمعة تمرّ. `loading.tsx` ما زال يستدعي `BrandBuildScreen` كما كان.
