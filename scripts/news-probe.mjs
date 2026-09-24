// Probe: can this machine reach the trusted feeds and pull og:images?
// Decides whether the news page can be enriched with real content.
import Parser from 'rss-parser';

const FEEDS = [
  ['BBC Sport Football', 'https://feeds.bbci.co.uk/sport/football/rss.xml'],
  ['Al Jazeera', 'https://www.aljazeera.net/xml/rss/all.xml'],
  ['Goal', 'https://www.goal.com/feeds/en/news'],
  ['Sky Sports Football', 'https://www.skysports.com/rss/12040'],
  ['The Guardian Football', 'https://www.theguardian.com/football/rss'],
];

const parser = new Parser({
  customFields: {
    item: [
      ['content:encoded', 'contentEncoded'],
      ['media:content', 'mediaContent', { keepArray: true }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: true }],
    ],
  },
});

console.log('=== FEEDS ===');
const sampleLinks = [];
for (const [name, url] of FEEDS) {
  try {
    const feed = await parser.parseURL(url);
    const n = feed.items?.length ?? 0;
    const withImg = (feed.items || []).filter(
      (i) => i.mediaThumbnail || i.mediaContent || /<img/i.test(i.contentEncoded || i.content || ''),
    ).length;
    console.log(`OK    ${name.padEnd(24)} items=${String(n).padEnd(4)} withInlineImage=${withImg}`);
    if (feed.items?.[0]?.link) sampleLinks.push([name, feed.items[0].link]);
  } catch (e) {
    console.log(`FAIL  ${name.padEnd(24)} ${e.message}`);
  }
}

console.log('\n=== og:image scrape on a live article from each reachable feed ===');
for (const [name, link] of sampleLinks) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    const res = await fetch(link, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'YallaSportBot/1.0', Accept: 'text/html' },
    });
    clearTimeout(t);
    const html = await res.text();
    const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
      ?? html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)?.[1];
    console.log(`${name.padEnd(24)} status=${res.status} og:image=${og ? og.slice(0, 90) : 'NONE'}`);
  } catch (e) {
    console.log(`${name.padEnd(24)} FAIL ${e.message}`);
  }
}

// and one of our own stored stories, to see if backfill would work
console.log('\n=== og:image on a story already in our DB ===');
const stored = 'https://www.bbc.co.uk/news/articles/cn8m2p4dmjro';
try {
  const res = await fetch(stored, { headers: { 'User-Agent': 'YallaSportBot/1.0' } });
  const html = await res.text();
  const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1];
  console.log(`stored BBC story status=${res.status} og:image=${og ?? 'NONE'}`);
} catch (e) {
  console.log(`stored BBC story FAIL ${e.message}`);
}
