import { newsRecencyBoost, scoreNameHit, similarTitle } from './text';

export type NewsRankInput = {
  id: string;
  title: string;
  excerpt: string | null;
  content?: string | null;
  category: string;
  tags: string[];
  publishedAt: Date | null;
  isDuplicate?: boolean;
  originalId?: string | null;
  linkedConfirmed: boolean;
  linkedSuggested: boolean;
};

export function scoreNewsItem(item: NewsRankInput, query: string, variants: string[]) {
  let score = 0;
  let why = 'mention';
  if (item.linkedConfirmed) {
    score += 400;
    why = 'entity';
  } else if (item.linkedSuggested) {
    score += 250;
    why = 'entity';
  }

  const titleHits = [query, ...variants].map((q) => scoreNameHit(item.title, q));
  const title = Math.max(0, ...titleHits);
  if (title >= 100) {
    score += 220;
    why = why === 'entity' ? 'entity' : 'title';
  } else if (title >= 58) {
    score += 140;
    if (why === 'mention') why = 'title';
  }

  const tagHit = item.tags.some((tag) => variants.some((q) => scoreNameHit(tag, q) >= 58));
  if (tagHit) {
    score += 130;
    if (why === 'mention') why = 'tag';
  }

  if (variants.some((q) => scoreNameHit(item.category, q) >= 58)) {
    score += 70;
    if (why === 'mention') why = 'category';
  }

  if (item.excerpt && variants.some((q) => scoreNameHit(item.excerpt ?? '', q) >= 58)) {
    score += 40;
    if (why === 'mention') why = 'excerpt';
  } else if (item.content && variants.some((q) => item.content!.toLowerCase().includes(q.toLowerCase()))) {
    score += 12;
  }

  score += newsRecencyBoost(item.publishedAt);
  return { score, why };
}

export function dedupeNews<T extends { id: string; title: string; originalId?: string | null; isDuplicate?: boolean }>(
  rows: T[],
): T[] {
  const out: T[] = [];
  const seenIds = new Set<string>();
  const seenOriginal = new Set<string>();
  for (const row of rows) {
    if (row.isDuplicate) continue;
    if (seenIds.has(row.id)) continue;
    if (row.originalId && seenOriginal.has(row.originalId)) continue;
    if (out.some((kept) => similarTitle(kept.title, row.title))) continue;
    seenIds.add(row.id);
    if (row.originalId) seenOriginal.add(row.originalId);
    out.push(row);
  }
  return out;
}
