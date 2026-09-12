import { getLocale } from 'next-intl/server';
import { pick } from '@/i18n/pick';
import { LegalClause, LegalDesk } from '@/components/legal/LegalDesk';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo/site';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return pageMetadata({
    locale,
    title: pick(locale, 'حقوق النشر', 'Copyright'),
    description: pick(
      locale,
      'ما تملكه يلا سبورت، وما يبقى للأندية ومزود البيانات وصاحب البث، وكيف تبلّغ عن انتهاك دون نموذج وهمي.',
      'What Yalla Sport owns, what remains with clubs, the data provider and the rights holder, and how to notice infringement without a dummy form.'
    ),
    path: '/copyright',
  });
}

export default async function CopyrightPage() {
  const locale = await getLocale();
  const toc = [
    { id: 'ours', label: pick(locale, 'ما نملكه', 'What we own') },
    { id: 'theirs', label: pick(locale, 'ما لا ندّعيه', 'What we do not claim') },
    { id: 'fair', label: pick(locale, 'الاستخدام المسموح', 'Allowed use') },
    { id: 'comments', label: pick(locale, 'تعليقك', 'Your comment') },
    { id: 'notice', label: pick(locale, 'التبليغ', 'Notice') },
    { id: 'remove', label: pick(locale, 'الإزالة', 'Takedown') },
  ];

  return (
    <LegalDesk
      locale={locale}
      path="/copyright"
      code="YS-L03"
      gate={pick(locale, 'البوابة 03', 'Gate 03')}
      title={pick(locale, 'حقوق النشر', 'Copyright')}
      kicker={pick(locale, 'آخر تحديث: 10 سبتمبر 2026', 'Last updated: 10 September 2026')}
      updated={pick(locale, 'نسخة الملعب · سبتمبر 2026', 'Pitch edition · September 2026')}
      summary={pick(
        locale,
        'الشعار والنصوص الأصلية والكود لنا. الشارات والأسماء والبيانات والبث تبقى لأصحابها. نعرضها للتعريف والتغطية، لا كادّعاء ملكية.',
        'The mark, original copy and code are ours. Crests, names, data and streams remain with their owners. We show them for identification and coverage, not as a claim of title.'
      )}
      seals={[
        pick(locale, '© 2026 Yalla Sport', '© 2026 Yalla Sport'),
        pick(locale, 'الشارات لأصحابها', 'Crests stay with owners'),
        pick(locale, 'إزالة ببلاغ جدّي', 'Takedown on a serious notice'),
      ]}
      toc={toc}
    >
      <LegalClause id="ours" index="01" title={pick(locale, 'ما نملكه', 'What we own')}>
        <ul>
          <li>{pick(locale, 'اسم يلا سبورت وشعار الموقع كما يظهر في الرأس والفوتر.', 'The Yalla Sport name and the site logo as shown in the header and footer.')}</li>
          <li>{pick(locale, 'النصوص الأصلية، العناوين، والأخبار المعتمدة داخل المنصة.', 'Original copy, headlines and approved news on the platform.')}</li>
          <li>{pick(locale, 'تنظيم الواجهة، الدفتر البصري، والكود الخاص بالموقع.', 'The interface system, the visual ledger, and original site code.')}</li>
        </ul>
        <p>
          {pick(
            locale,
            'لا يُنسخ الموقع كمنتج منافس، ولا يُعاد بناء التغذية الحية كخدمة مستقلة، دون إذن مكتوب.',
            'The site may not be copied as a competing product, and the live feed may not be rebuilt as a separate service, without written permission.'
          )}
        </p>
      </LegalClause>

      <LegalClause id="theirs" index="02" title={pick(locale, 'ما لا ندّعي ملكيته', 'What we do not claim')}>
        <p>
          {pick(
            locale,
            'أسماء الأندية، الشعارات، الشارات، وأسماء البطولات ملك لأصحابها وتُعرض للتعريف في تغطية النتائج. بيانات المباريات ملك مزود البيانات وفق عقده. أي بث عبر أصل مرخّص يبقى تحت ترخيص صاحبه؛ يلا سبورت ليست مصدر الحقوق المجاورة لذلك البث.',
            'Club names, crests, badges and competition names belong to their owners and appear for identification in score coverage. Match data belongs to the data provider under its contract. Any stream through a licensed asset remains under its owner’s licence; Yalla Sport is not the neighbouring-rights source of that stream.'
          )}
        </p>
      </LegalClause>

      <LegalClause id="fair" index="03" title={pick(locale, 'الاستخدام المسموح', 'Allowed use')}>
        <p>
          {pick(
            locale,
            'يُسمح باقتباس قصير من خبر مع ذكر يلا سبورت ورابط الصفحة. يُسمح بالربط إلى صفحاتنا. لا يُسمح بتحميل شعارات الأندية من الموقع لاستخدام تجاري، ولا بنسخ الجداول لإعادة بثها كمنصة.',
            'A short quotation from a story is allowed with credit to Yalla Sport and a link to the page. Linking to our pages is allowed. Downloading club crests from the site for commercial use is not, nor is copying tables to rebroadcast them as a platform.'
          )}
        </p>
      </LegalClause>

      <LegalClause id="comments" index="04" title={pick(locale, 'تعليقك', 'Your comment')}>
        <p>
          {pick(
            locale,
            'تبقى صاحب ما تكتبه. بإرسال تعليق تمنح يلا سبورت ترخيصاً غير حصري لعرضه على الصفحة المرتبطة بالمباراة أو الخبر، وإزالته إن خالف الشروط. لا ننسب رأيك إلى التحرير.',
            'You remain the author of what you write. By posting a comment you grant Yalla Sport a non-exclusive licence to show it on the linked match or story page, and to remove it if it breaks the terms. We do not attribute your view to the desk.'
          )}
        </p>
      </LegalClause>

      <LegalClause id="notice" index="05" title={pick(locale, 'كيف تبلّغ', 'How to notice')}>
        <p>
          {pick(
            locale,
            'أرسل إلى contact@yallasport.com: رابط الصفحة، وصف العمل الأصلي، وصفتك كصاحب حق أو وكيل، وتصريح أن البلاغ صحيح على حد علمك. بلاغ بلا هذه العناصر قد لا يُعالج. لا يوجد نموذج إزالة وهمي يعدك برقم تذكرة.',
            'Write to contact@yallasport.com with the page URL, a description of the original work, your standing as rights holder or agent, and a statement that the notice is true to your knowledge. A notice without these parts may not be processed. There is no dummy takedown form that issues a ticket number.'
          )}
        </p>
      </LegalClause>

      <LegalClause id="remove" index="06" title={pick(locale, 'الإزالة والرد', 'Takedown and reply')}>
        <p>
          {pick(
            locale,
            'نراجع البلاغات الجدية خلال وقت معقول. إن ثبت الانتهاك نزيل أو نحجب المادة الظاهرة عندنا. إن كان البلاغ على شعار نادٍ أو مقطع بث، نتعامل معه بوصفه ملك الغير لا ملكنا. الرد يكون بالبريد، لا بإيصال آلي مخترع.',
            'We review genuine notices within a reasonable time. If infringement is made out we remove or withhold the material shown here. If the notice concerns a club crest or a stream clip, we treat it as someone else’s property, not ours. The reply is by mail, not an invented auto-receipt.'
          )}
        </p>
      </LegalClause>
    </LegalDesk>
  );
}
