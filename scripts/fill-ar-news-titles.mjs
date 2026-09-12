/**
 * Fill Arabic news translations with real Arabic titles/excerpts
 * (Phase 2 created APPROVED rows but copied English text).
 */
import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

/** @type {Record<string, { title: string; excerpt: string }>} */
const AR = {
  "Hull winger Thomas unhurt after car crash": {
    title: "جناح هال سوربا توماس ينجو من حادث سيارة",
    excerpt: "انقلاب سيارة لاند روفر لجناح الدوري الإنجليزي سوربا توماس في كوتينغهام دون إصابات خطرة.",
  },
  "Who am I? Guess Bundesliga star No 3": {
    title: "من أنا؟ خمن نجم البوندسليغا رقم 3",
    excerpt: "اكتشف هوية لاعب اليوم بأقل عدد ممكن من المحاولات.",
  },
  "Fenerbahce boss stuns club by quitting after Roma draw": {
    title: "مدرب فنربخشة يفاجئ النادي بالاستقالة بعد التعادل مع روما",
    excerpt: "إسماعيل كارتال يستقيل دقائق بعد تعادل فنربخشة 1-1 مع روما في دوري الأبطال.",
  },
  "Just like riding a bike - five things to watch in the EFL": {
    title: "خمس نقاط لمتابعتها في دوريات إنجلترا هذا الأسبوع",
    excerpt: "أبرز المحاور قبل مباريات البطولة وليفغ ون وليفغ تو.",
  },
  "Flex your football brain with our daily quizzes": {
    title: "اختبر معرفتك الكروية مع مسابقاتنا اليومية",
    excerpt: "من أنا؟ وخمس في خمس وألغاز كروية يومية.",
  },
  "Two goals in two games - Sesko gives Man Utd a different threat": {
    title: "هدفان في مباراتين — سيسكو يمنح يونايتد تهديداً مختلفاً",
    excerpt: "عودة بنجامين سيسكو إلى التشكيلة في توقيت مناسب قبل مواجهة سيتي.",
  },
  "Is Dorgu the answer at left -back for Man Utd?": {
    title: "هل دورغو هو الحل في الظهير الأيسر ليونايتد؟",
    excerpt: "تحليل أداء باتريك دورغو خلال فوز مانشستر يونايتد 4-0 على صباح.",
  },
  "Olise scores twice as Bayern thrash Bodo/Glimt": {
    title: "أوليز يسجل مرتين وبايرن يكتسح بودو/غليمت",
    excerpt: "هاري كين يسجل هدفه 55 في دوري الأبطال وأوليز يضاعف في بداية حملة بايرن.",
  },
  "Champions League new boys Como dominate Leipzig": {
    title: "قادم دوري الأبطال كومو يسيطر على لايبزيغ",
    excerpt: "كومو يفتتح مشواره في دوري الأبطال بفوز مقنع 4-1 على ضيفه آر بي لايبزيغ.",
  },
  "Brown scores fine equaliser as Fenerbahce draw with Roma": {
    title: "براون يسجل تعادلاً رائعاً وفنربخشة يتعادل مع روما",
    excerpt: "الإنجليزي آرتشي براون يسجل مع عودة فنربخشة إلى دوري الأبطال أمام روما.",
  },
  "Man Utd put four past Sabah on Champions League return": {
    title: "يونايتد يسجل أربعة في صباح مع عودته لدوري الأبطال",
    excerpt: "أكبر فوز لمانشستر يونايتد في دوري الأبطال منذ 2020 على ملعب أولد ترافورد.",
  },
  "PSV & Shakhtar Donetsk open Champions League campaign with draw": {
    title: "بي إس في وشاختار يفتتحان دوري الأبطال بالتعادل",
    excerpt: "تعادل 1-1 في افتتاح مشوار الفريقين بدوري الأبطال على فيليبس ستاديون.",
  },
  "Sutton's predictions v Dorking Wanderers manager Marc White": {
    title: "توقعات ساتون أمام مدرب دوركينغ مارك وايت",
    excerpt: "كريس ساتون يواجه مدرب دوركينغ واندررز وقراء بي بي سي في توقعات البريميرليغ.",
  },
  "Torres hat-trick fires Paris Saint-Germain to dominant win against Bratislava": {
    title: "هاتريك توريس يقود سان جيرمان لفوز كبير على براتيسلافا",
    excerpt: "فيران توريس يسجل ثلاثية وسان جيرمان يبدأ الدفاع عن لقبه بفوز مقنع.",
  },
  "Liverpool come from behind to beat Atletico Madrid": {
    title: "ليفربول يعود ويتفوق على أتلتيكو مدريد",
    excerpt: "أليكسس ماك أليستر يسجل هدف الفوز ويبدأ ليفربول مشواره في دوري الأبطال بانتصار على أنفيلد.",
  },
};

const rows = await p.newsTranslation.findMany({
  where: { locale: "ar" },
  include: { news: { select: { title: true, excerpt: true } } },
});

let updated = 0;
for (const row of rows) {
  const mapped = AR[row.news.title];
  if (!mapped) {
    console.warn("No AR map for:", row.news.title);
    continue;
  }
  await p.newsTranslation.update({
    where: { id: row.id },
    data: {
      title: mapped.title,
      excerpt: mapped.excerpt,
      content: mapped.excerpt,
      seoTitle: mapped.title,
      seoDescription: mapped.excerpt,
    },
  });
  updated += 1;
}

console.log(`Updated ${updated}/${rows.length} Arabic translations`);
await p.$disconnect();
