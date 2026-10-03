import { test } from 'node:test';
import assert from 'node:assert/strict';
import { didYouMean, expandQueryVariants } from './aliases';
import { dedupeNews, scoreNewsItem } from './news-rank';
import { foldSearch, scoreNameHit } from './text';

test('Arabic and English Real Madrid expand to the same desk name', () => {
  const ar = expandQueryVariants('ريال مدريد');
  const en = expandQueryVariants('Real Madrid');
  assert.ok(ar.includes('Real Madrid'));
  assert.ok(en.includes('Real Madrid'));
  assert.ok(expandQueryVariants('الريال').includes('Real Madrid'));
  assert.ok(expandQueryVariants('الملكي').includes('Real Madrid'));
});

test('entity name scoring prefers exact over mention', () => {
  assert.ok(scoreNameHit('Real Madrid', 'ريال مدريد', ['ريال مدريد']) > scoreNameHit('Real Sociedad', 'ريال مدريد', []));
  assert.equal(foldSearch('الريال'), foldSearch('ريال'));
});

test('news ranking puts linked entity above body mention', () => {
  const linked = scoreNewsItem(
    {
      id: '1',
      title: 'صفقة جديدة',
      excerpt: null,
      content: 'ريال مدريد',
      category: 'انتقالات',
      tags: [],
      publishedAt: new Date(),
      linkedConfirmed: true,
      linkedSuggested: false,
    },
    'ريال مدريد',
    ['ريال مدريد', 'Real Madrid'],
  );
  const mention = scoreNewsItem(
    {
      id: '2',
      title: 'منتخب إنجلترا يستدعي أرنولد',
      excerpt: 'ذكر عابر لريال مدريد',
      content: 'ريال مدريد في جملة جانبية',
      category: 'منتخبات',
      tags: [],
      publishedAt: new Date(),
      linkedConfirmed: false,
      linkedSuggested: false,
    },
    'ريال مدريد',
    ['ريال مدريد', 'Real Madrid'],
  );
  assert.ok(linked.score > mention.score);
  assert.equal(linked.why, 'entity');
});

test('near-duplicate news titles collapse', () => {
  const rows = dedupeNews([
    { id: 'a', title: 'مبابي يتفادى انتكاسة كبيرة قرار حاسم ينقذ موسمه' },
    { id: 'b', title: 'مبابي يتفادى انتكاسة كبيرة قرار حاسم ينقذ موسمه' },
    { id: 'c', title: 'خبر آخر عن الديربي' },
  ]);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].id, 'a');
});

test('typo hint offers Real Madrid', () => {
  assert.equal(didYouMean('ريال مديد'), 'ريال مدريد');
});

test('Mbappe aliases resolve to the same player name', () => {
  for (const q of ['مبابي', 'كيليان مبابي', 'Kylian Mbappe', 'Mbappé']) {
    assert.ok(expandQueryVariants(q).includes('Kylian Mbappe'), q);
  }
  assert.equal(didYouMean('كليان مبابي'), 'كيليان مبابي');
});
