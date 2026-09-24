# 🎨 YallaSport Design System (نظام التصميم الموحد)

نظام التصميم القياسي لمنصة **يلا سبورت (YallaSport)** — المنصة الرياضية العربية الرائدة. تم بناء هذا النظام ليحقق التوازن بين السرعة والأداء والتناسق البصري الفاخر (Editorial Premium Sports Aesthetic).

---

## 📌 المبادئ الأساسية (Core Principles)

1. **الصرامة والنقاء (Zero-Important & No Collisions)**:
   - منع استخدام `!important` نهائياً.
   - الاعتماد على CSS Variables القياسية و Tailwind v4 `@theme inline`.
   - عزل كل مكوّن في CSS Module مستقل لتفادي أي تداخل.

2. **دعم كامل للغتين والاتجاهين (RTL / LTR First)**:
   - اللغة العربية والاتجاه من اليمين إلى اليسار (RTL) هما الأساس الافتراضي.
   - الخط المعتمد هو **Cairo** بجميع أوزانه.

3. **الوضع الداكن والفاتح المدمج (Seamless Dark / Light Mode)**:
   - التحول التلقائي للثيم بناءً على فئة `.dark` أو السمة `[data-theme="dark"]`.

---

## 🎨 لوحة الألوان (Color Palette & Tokens)

### 1. الألوان الأساسية للعلامة التجارية (Brand Tokens)

| المتغير (CSS Variable) | الفئة في Tailwind | القيمة الفاتحة (Light) | القيمة الداكنة (Dark) | الاستخدام |
| :--- | :--- | :--- | :--- | :--- |
| `--ys-orange` | `text-ys-orange` / `bg-ys-orange` | `#f97316` | `#f97316` | اللون التفاعلي الرئيسي، البث المباشر، التنبيهات المهمة |
| `--ys-orange-hover` | `hover:bg-ys-orange-hover` | `#ea580c` | `#fb923c` | حالة التمرير (Hover) على الأزرار البرتقالية |
| `--ys-orange-soft` | `bg-ys-orange-soft` | `#ffedd5` | `rgba(249, 115, 22, 0.15)` | خلفيات الشارات والبطاقات المميزة |
| `--ys-green-dark` | `bg-ys-green-dark` | `#0a4d3a` | `#052e24` | اللون الأساسي (Primary) للواجهة وأشرطة العناوين |
| `--ys-green` | `text-ys-green` / `bg-ys-green` | `#10b981` | `#10b981` | الفوز، النتائج الإيجابية، الأهداف |
| `--ys-green-soft` | `bg-ys-green-soft` | `#d1fae5` | `rgba(16, 185, 129, 0.15)` | خلفيات شارات الفوز والنجاح |
| `--ys-red` | `text-ys-red` / `bg-ys-red` | `#ef4444` | `#ef4444` | البث المباشر الحارق (LIVE)، البطاقات الحمراء، الخسارة |
| `--ys-red-soft` | `bg-ys-red-soft` | `#fee2e2` | `rgba(239, 68, 68, 0.15)` | شارات المباريات المباشرة |

---

### 2. المتغيرات الدلالية للثيم (Semantic Theme Variables)

| المتغير | الوصف | الوضع الفاتح | الوضع الداكن |
| :--- | :--- | :--- | :--- |
| `--background` | خلفية الصفحة العامة | `#f8fafc` | `#0a0a0a` |
| `--foreground` | لون النصوص الأساسي | `#0f172a` | `#f8fafc` |
| `--card` | خلفية البطاقات والحاويات | `#ffffff` | `#121212` |
| `--card-foreground` | لون النصوص داخل البطاقات | `#0f172a` | `#f8fafc` |
| `--primary` | اللون الأساسي التفاعلي | `#0a4d3a` | `#10b981` |
| `--primary-foreground` | نص فوق اللون الأساسي | `#ffffff` | `#0a0a0a` |
| `--secondary` | خلفية ثانوية (Secondary) | `#f1f5f9` | `#1e1e1e` |
| `--secondary-foreground`| نص فوق الخلفية الثانوية | `#0f172a` | `#f8fafc` |
| `--muted` | عناصر مطفأة أو فرعية | `#f1f5f9` | `#18181b` |
| `--muted-foreground` | نصوص فرعية/رمادية | `#64748b` | `#a1a1aa` |
| `--border` | حدود العناصر والبطاقات | `#e2e8f0` | `#27272a` |
| `--input` | حدود حقول الإدخال | `#e2e8f0` | `#27272a` |
| `--ring` | حلقة التركيز للوصولية (Focus Ring)| `#0a4d3a` | `#10b981` |

---

## ✍️ الخطوط والطباعة (Typography)

- **عائلة الخط**: `Cairo, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **الأوزان المتاحة**: 300 (Light), 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold), 800 (ExtraBold), 900 (Black).

### سلم المقاسات (Type Scale):
- **H1**: `clamp(1.75rem, 3.5vw, 2.5rem)` — العناوين الرئيسية للصفحات.
- **H2**: `clamp(1.4rem, 2.5vw, 1.875rem)` — عناوين الأقسام الرئيسية.
- **H3**: `clamp(1.2rem, 2vw, 1.5rem)` — عناوين البطاقات والوحدات.
- **H4 - H6**: `1.25rem` إلى `1.0rem`.
- **Body / Paragraph**: `1.0rem` (16px) مع `line-height: 1.65`.
- **Caption / Small**: `0.875rem` (14px) و `0.75rem` (12px).

---

## 🔲 زوايا الحواف والظلال (Radii & Elevation)

### أنصاف الأقطار (Border Radii):
- `--radius-xs`: `0.25rem` (4px)
- `--radius-sm`: `0.375rem` (6px)
- `--radius-md`: `0.5rem` (8px)
- `--radius-lg`: `0.75rem` (12px)
- `--radius-xl`: `1rem` (16px)
- `--radius-2xl`: `1.25rem` (20px)
- `--radius-full`: `9999px` (حبوب، شارات، أزرار دائرية)

### الظلال (Elevation Shadows):
- **خفيف (`--ys-shadow-sm`)**: للحالات العادية والحدود الدقيقة.
- **متوسط (`--ys-shadow-md`)**: لبطاقات المباريات والأخبار.
- **طافي (`--ys-shadow-lg`)**: للقوائم المنسدلة والمودال (Modals) والعناصر العائمة.

---

## 📐 قواعد الاستخدام للمراحل القادمة

1. **الهيكل والتخطيط السريع (Layout)**:
   - استخدام Tailwind v4 classes لشبكة الـ Grid و Flexbox والـ Spacing السريع.
   
2. **التصميم المتقدم والمكونات المعقدة**:
   - استخدام **CSS Modules** مخصصة لكل مكوّن (`[ComponentName].module.css`).
   - استيراد واستخدام متغيرات CSS المتوفرة في `:root` و `.dark`.
   
3. **منع التداخل (Strict Isolation)**:
   - عدم إضافة أي قواعد خاصة بمكون محدد داخل `globals.css`.
   - عدم استخدام كلاسات عامة متضاربة.
   - احترام تباين الألوان (WCAG AA).
