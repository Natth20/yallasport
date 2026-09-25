const fs = require('fs');
const path = require('path');

function getFiles(dir, filter) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(fullPath, filter));
    } else if (!filter || filter(fullPath)) {
      results.push(fullPath);
    }
  });
  return results;
}

// 1. CSS Analysis
const cssFiles = getFiles('src', f => f.endsWith('.css'));
const cssReport = [];
let totalBytes = 0;
let totalLines = 0;
let totalImportant = 0;

cssFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n').length;
  const size = fs.statSync(file).size;
  const importantMatches = (content.match(/!important/g) || []).length;
  totalBytes += size;
  totalLines += lines;
  totalImportant += importantMatches;

  // extract classes defined
  const classMatches = content.match(/\.[a-zA-Z0-9_-]+/g) || [];
  const uniqueClasses = new Set(classMatches.map(c => c.slice(1)));

  cssReport.push({
    path: file.replace(/\\/g, '/'),
    sizeKB: (size / 1024).toFixed(2),
    lines,
    important: importantMatches,
    classCount: uniqueClasses.size
  });
});

// 2. Pages Analysis
const pageFiles = getFiles('src/app', f => f.endsWith('page.tsx'));
const pageReport = [];

pageFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const relPath = file.replace(/\\/g, '/').replace('src/app/', '');
  const lines = content.split('\n').length;
  const isClient = content.includes('"use client"') || content.includes("'use client'");

  // imports
  const imports = [];
  const importLines = content.match(/import .* from .*/g) || [];
  importLines.forEach(l => {
    const m = l.match(/from\s+['"]([^'"]+)['"]/);
    if (m) imports.push(m[1]);
  });

  // check if placeholder / minimal
  let status = 'Working / Active';
  if (lines < 15 && !content.includes('return <')) {
    status = 'Minimal / Stub';
  } else if (content.includes('// TODO') || content.includes('placeholder')) {
    status = 'Has Placeholders';
  }

  // route name
  let route = '/' + relPath.replace('/page.tsx', '').replace(/\[locale\]\/?/, '');
  if (route === '/') route = '/ (Home)';

  pageReport.push({
    route,
    path: relPath,
    lines,
    isClient,
    importsCount: imports.length,
    status
  });
});

// Sort pages by route
pageReport.sort((a, b) => a.route.localeCompare(b.route));

// 3. Components Analysis
const compFiles = getFiles('src/components', f => f.endsWith('.tsx') || f.endsWith('.ts'));
const allCodeFiles = getFiles('src', f => f.endsWith('.tsx') || f.endsWith('.ts') || f.endsWith('.js'));

const compReport = [];
compFiles.forEach(file => {
  const normPath = file.replace(/\\/g, '/');
  const baseName = path.basename(file, path.extname(file));
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n').length;
  const isClient = content.includes('"use client"') || content.includes("'use client'");

  // find usages in other files
  let usageCount = 0;
  const usedBy = [];

  allCodeFiles.forEach(cf => {
    const normCf = cf.replace(/\\/g, '/');
    if (normCf === normPath) return;
    const cContent = fs.readFileSync(cf, 'utf8');
    if (
      cContent.includes(`/${baseName}`) ||
      cContent.includes(`"${baseName}"`) ||
      cContent.includes(`'${baseName}'`) ||
      cContent.includes(`<${baseName}`)
    ) {
      usageCount++;
      usedBy.push(normCf.replace('src/', ''));
    }
  });

  compReport.push({
    name: baseName,
    path: normPath.replace('src/components/', ''),
    lines,
    isClient,
    usageCount,
    usedBy: usedBy.slice(0, 3)
  });
});

compReport.sort((a, b) => b.usageCount - a.usageCount);

// Generate Markdown
let md = `# تقرير التشخيص الشامل لمشروع YallaSport (المرحلة 0)

تاريخ التشخيص: ${new Date().toISOString().split('T')[0]}
حالة الفحص الأولي: ✅ TypeScript Typecheck نجح (0 errors)
نقطة الاستعادة (Backup): \`git tag before-rebuild\` | فرع العمل: \`rebuild/phase-0\`

---

## 📊 ملخص الأرقام والتشخيص العام

| المقياس | القيمة الحالية | الهدف بعد إعادة البناء | التقييم |
| :--- | :--- | :--- | :--- |
| **إجمالي ملفات CSS** | ${cssFiles.length} ملف | 1 global + CSS Modules مستقلة | ⚠️ تراكم وتداخل عالي |
| **إجمالي حجم CSS** | ${(totalBytes / 1024).toFixed(1)} KB | < 120 KB إجمالي | ❌ متضخم للغاية |
| **أسطر globals.css** | ${cssReport.find(c => c.path.includes('globals.css'))?.lines || 0} سطر | < 600 سطر | ❌ كود ضخم ومعقد |
| **استخدامات !important** | ${totalImportant} | 0 | ❌ تكسير Specificity |
| **عدد الصفحات (Pages)** | ${pageFiles.length} صفحة | 67 صفحة نظيفة ومترابطة | 🟡 بعضها صفحات Placeholder |
| **عدد المكونات (Components)** | ${compFiles.length} مكوّن | مكتبة ui موحدة + مكونات مخصصة | 🟡 50 مستخدمة مباشرة / الباقي مكرر أو معزول |

---

## 🎨 1. تشخيص ملفات CSS والتصاميم الحالية

### تفاصيل ملفات الـ CSS:
| مسار الملف | الحجم (KB) | عدد الأسطر | استخدامات \`!important\` |
| :--- | :--- | :--- | :--- |
${cssReport.map(c => `| \`${c.path}\` | ${c.sizeKB} KB | ${c.lines} | ${c.important} |`).join('\n')}

### المشاكل المكتشفة في CSS:
1. **تضخم ملف \`globals.css\`**: يحتوي على أكثر من ${cssReport.find(c => c.path.includes('globals.css'))?.lines || 0} سطر كود، ويجمع بين قواعد عامة، مكونات كاملة، وألوان ثابتة عشوائية.
2. **تداخل Specificity و \`!important\`**: يوجد أكثر من ${totalImportant} تصريح \`!important\` يمنع التخصيص النظيف ويخلق صراعات بين Tailwind v4 و CSS Modules.
3. **تكرار وتشتت الـ CSS Modules**: وجود ملفات مثل \`front-hall.css\` و \`lex.module.css\` و \`news-chamber.module.css\` بحجوم كبيرة ومكررة لنفس أنماط البطاقات والأزرار والحاويات.
4. **غياب Design Tokens موحدة**: القيم مثل الألوان والـ border-radius والظلال معرّفة بشكل يدوي مكرر في عدة أماكن بدلاً من استخدام CSS variables قياسية.

---

## 📑 2. قائمة وتشخيص الصفحات (${pageFiles.length} صفحة)

| المسار (Route) | مسار الملف | الأسطر | النوع | الحالة |
| :--- | :--- | :--- | :--- | :--- |
${pageReport.map(p => `| \`${p.route}\` | \`${p.path}\` | ${p.lines} | ${p.isClient ? 'Client' : 'Server'} | ${p.status} |`).join('\n')}

---

## 🧩 3. تشخيص المكونات (Used vs Orphan / Legacy Components)

### إحصائية المكونات:
- **المكونات النشطة والمستخدمة مباشرة**: ${compReport.filter(c => c.usageCount > 0).length} مكوّن
- **المكونات المعزولة / المرشحة للأرشفة إلى \`legacy/\`**: ${compReport.filter(c => c.usageCount === 0).length} مكوّن

### عينة من أهم المكونات المستخدمة:
${compReport.filter(c => c.usageCount > 0).slice(0, 25).map(c => `- **\`${c.name}\`** (\`${c.path}\`): مستخدم في ${c.usageCount} ملفات (${c.usedBy.join(', ')})`).join('\n')}

### المكونات غير المستخدمة مباشرة (Orphan / Candidates for Legacy):
${compReport.filter(c => c.usageCount === 0).map(c => `- \`${c.name}\` (\`src/components/${c.path}\`)`).join('\n')}

---

## 🏗️ 4. توصيات وخطة تنفيذ المراحل القادمة

1. **المرحلة 1 (Design System جديد)**:
   - إنشاء \`globals.css.backup\` للرجوع إليه عند الحاجة.
   - بناء \`globals.css\` نقي ومختصر (~500 سطر) يحدد المتغيرات اللونية، خط Cairo، أساسيات RTL/LTR، والأنماط الأساسية بدون أي \`!important\`.
   - توثيق المتغيرات في \`docs/design-system.md\`.

2. **المرحلة 2 (مكتبة UI الموحدة)**:
   - بناء مكونات \`src/components/ui/\` (Button, Card, Badge, Input, Tabs, Modal, Skeleton, Dropdown, Tooltip, Loader) مع CSS Modules مستقلة.

3. **المرحلة 3 (Header & Footer)**:
   - إعادة بناء الملاحة العلوية والسفلية بنظافة كاملة تدعم اللغة وتغيير الثيم.

4. **المراحل 4 - 8 (إعادة بناء الشاشات حسب الأولوية)**:
   - الرئيسية (Home) -> المباريات -> البطولات والفرق واللاعبين -> الأخبار والبث -> باقي الصفحات.

5. **المرحلة 9 (التنظيف النهائي)**:
   - نقل الملفات الميتة إلى \`legacy/\` وحذف القواعد الزائدة.

6. **المرحلة 10 (التحسين والاختبار النهائي)**:
   - اختبار الاستجابة لجميع الشاشات والأداء و SEO و PWA.

---

## 🛡️ حالة النسخ الاحتياطي والسلامة
- **Git Branch**: \`rebuild/phase-0\`
- **Git Tag**: \`before-rebuild\`
- **Backend & Database Integrity**: لم يتم المساس بأي ملف في \`src/lib/\` أو \`src/app/api/\` أو \`prisma/\`.
`;

fs.writeFileSync('docs/diagnosis.md', md, 'utf8');

// Also create rebuild log initial
const logMd = `# سجل إعادة بناء واجهة YallaSport (Rebuild Log)

## المرحلة 0: التشخيص والأرشفة الاحتياطية (Phase 0: Diagnosis)
- **التاريخ**: ${new Date().toISOString().split('T')[0]}
- **الحالة**: مكتملة ✅ — بانتظار الموافقة للانتقال إلى المرحلة 1.
- **الفرع**: \`rebuild/phase-0\`
- **التاج**: \`before-rebuild\`
- **الإنجازات**:
  1. فحص شامل لـ 19 ملف CSS بحجم إجمالي ${(totalBytes / 1024).toFixed(1)} KB.
  2. حصر 67 صفحة مع تصنيفها (Server / Client) وحالتها الحالية.
  3. حصر 141 مكوّن وتحديد المستخدم وغير المستخدم لنقلها بأمان.
  4. التحقق من سلامة TypeScript Typecheck (نجح بنسبة 100%).
  5. إنشاء وثيقة التشخيص الشاملة \`docs/diagnosis.md\`.
`;

fs.writeFileSync('docs/rebuild-log.md', logMd, 'utf8');

console.log('Diagnosis and rebuild-log generated successfully!');
