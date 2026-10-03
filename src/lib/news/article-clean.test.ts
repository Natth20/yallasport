import { test } from 'node:test';
import assert from 'node:assert/strict';
import { publicNewsTags, sanitizeArticleHtml, validateArticleHtml } from './article-clean';

const dirty = `
<p>غيّب كريستيانو رونالدو عن تدريبات منتخب البرتغال لليوم الثالث على التوالي بسبب الإصابة.</p>
<p>وقال الجهاز الفني إن النجم يخضع للعلاج قبل مواجهة في دوري الأمم الأوروبية.</p>
<nav>القائمة الرئيسية</nav>
<p>Facebook</p>
<p>X</p>
<p>VK.com</p>
<p>Telegram</p>
<h2>RT STORIES</h2>
<p>اضغط للمزيد</p>
<p>روسيا وأوكرانيا تتبادلان الاتهامات</p>
<p>Flydubai تعلن عن مسارات جديدة</p>
<p>العراق والخليج في اجتماع اقتصادي</p>
<p>رونالدو يغيب عن تدريبات البرتغال لليوم الثالث.. وتقارير تتحدث عن اعتزاله اللعب دوليا</p>
`;

test('strips social widgets, RT stories and unrelated headlines from article html', () => {
  const clean = sanitizeArticleHtml(dirty);
  assert.match(clean, /كريستيانو رونالدو/);
  assert.doesNotMatch(clean, /Facebook/);
  assert.doesNotMatch(clean, /VK\.com/);
  assert.doesNotMatch(clean, /Telegram/);
  assert.doesNotMatch(clean, /RT STORIES/);
  assert.doesNotMatch(clean, /اضغط للمزيد/);
  assert.doesNotMatch(clean, /Flydubai/);
  assert.doesNotMatch(clean, /روسيا وأوكرانيا/);
  assert.ok(validateArticleHtml(clean).ok);
});

test('hides technical import tags from readers', () => {
  assert.deepEqual(publicNewsTags(['football', 'rss', 'trusted', 'portugal', 'Cristiano']), ['portugal', 'Cristiano']);
});
