// Probe candidate Arabic-language football feeds before trusting them.
import Parser from 'rss-parser';

const CANDIDATES = [
  // already-allowlisted hosts, general feeds that carry football
  ['aljazeera.net', 'https://www.aljazeera.net/aljazeerarss/a7c186be-1baa-4bd4-9d80-a84db769f779/73d0e1b4-532f-45ef-b135-bfdff8b8cab9'],
  ['bbc.com/arabic', 'https://feeds.bbci.co.uk/arabic/rss.xml'],
  ['dw.com arabic', 'https://rss.dw.com/rdf/rss-ar-all'],
  ['france24.com arabic', 'https://www.france24.com/ar/rss'],
  // football-dedicated Arabic source
  ['maddmon featured', 'https://maddmon.com/rss/featured-news'],
  ['maddmon english-fb', 'https://maddmon.com/rss/category/english-football'],
  ['maddmon spanish-fb', 'https://maddmon.com/rss/category/spanish-football'],
  ['maddmon italian-fb', 'https://maddmon.com/rss/category/italian-football'],
  ['maddmon saudi-fb', 'https://maddmon.com/rss/category/saudi-football'],
  ['maddmon egyptian-fb', 'https://maddmon.com/rss/category/egyptian-football'],
];

const parser = new Parser({
  timeout: 12000,
  customFields: {
    item: [
      ['content:encoded', 'contentEncoded'],
      ['media:content', 'mediaContent', { keepArray: true }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: true }],
    ],
  },
});

const arabic = /[\u0600-\u06FF]/;
const FOOTBALL = /football|soccer|premier league|laliga|serie a|bundesliga|champions|كرة|الدوري|مباراة|هدف|منتخب|لاعب|مدرب/i;

for (const [name, url] of CANDIDATES) {
  try {
    const feed = await parser.parseURL(url);
    const items = feed.items || [];
    const ar = items.filter((i) => arabic.test(i.title || '')).length;
    const fb = items.filter((i) => FOOTBALL.test(`${i.title || ''} ${i.contentSnippet || ''}`)).length;
    const img = items.filter(
      (i) => i.mediaThumbnail || i.mediaContent || i.enclosure?.url || /<img/i.test(i.contentEncoded || i.content || ''),
    ).length;
    console.log(
      `OK   ${name.padEnd(22)} items=${String(items.length).padEnd(4)} ar=${String(ar).padEnd(4)} football=${String(fb).padEnd(4)} withImage=${img}`,
    );
    const s = items.find((i) => FOOTBALL.test(i.title || '') && arabic.test(i.title || '')) || items[0];
    if (s) {
      console.log(`       "${(s.title || '').slice(0, 78)}"`);
      console.log(`       ${s.link}`);
    }
  } catch (e) {
    console.log(`FAIL ${name.padEnd(22)} ${e.message}`);
  }
}
