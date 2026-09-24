import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('src');
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(full);
  }
}
walk(root);

const skipFiles = new Set([
  path.resolve('src/lib/ops/caught.ts'),
  path.resolve('src/lib/prisma.ts'),
]);

function findArrowCatch(text, from = 0) {
  const marker = '.catch(() =>';
  const alt = '.catch(() =>';
  let idx = text.indexOf('.catch(() =>', from);
  const idx2 = text.indexOf('.catch(() => ', from);
  // also .catch(() => without space
  if (idx === -1) idx = text.search(/\.catch\(\s*\(\)\s*=>/, from);
  return idx;
}

function extractCall(text, start) {
  const match = text.slice(start).match(/^\.catch\(\s*\(\)\s*=>/);
  if (!match) return null;
  let i = start + match[0].length;
  while (i < text.length && /\s/.test(text[i])) i += 1;
  const exprStart = i;
  let depth = 0;
  let inStr = null;
  let escaped = false;
  for (; i < text.length; i += 1) {
    const ch = text[i];
    if (inStr) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inStr = ch;
      continue;
    }
    if (ch === '(' || ch === '{' || ch === '[') depth += 1;
    else if (ch === ')' || ch === '}' || ch === ']') {
      if (depth === 0 && ch === ')') {
        return { headerEnd: start + match[0].length, exprStart, exprEnd: i, callEnd: i + 1 };
      }
      depth -= 1;
    }
  }
  return null;
}

const inventory = [];
let patchedFiles = 0;
let replacements = 0;

for (const file of files) {
  const rel = path.relative(process.cwd(), file).replaceAll('\\', '/');
  let text = fs.readFileSync(file, 'utf8');
  const hits = [];
  let searchFrom = 0;
  const re = /\.catch\(\s*\(\)\s*=>/g;
  let m;
  while ((m = re.exec(text))) hits.push(m.index);
  hits.forEach((idx) => {
    const line = text.slice(0, idx).split(/\n/).length;
    inventory.push(`${rel}:${line}`);
  });
  if (skipFiles.has(file) || hits.length === 0) continue;

  let next = '';
  let cursor = 0;
  let fileRepl = 0;
  searchFrom = 0;
  while (true) {
    const idx = text.slice(searchFrom).search(/\.catch\(\s*\(\)\s*=>/);
    if (idx === -1) break;
    const start = searchFrom + idx;
    const extracted = extractCall(text, start);
    if (!extracted) break;
    const expr = text.slice(extracted.exprStart, extracted.exprEnd).trim();
    const before = text.slice(Math.max(0, start - 40), start);
    const persist = /\.json\(\)\s*$|\.play\(\)\s*$/.test(before.trimEnd())
      ? ', { persist: false }'
      : '';
    next += text.slice(cursor, start);
    next += `.catch(swallow(${JSON.stringify(`${rel}:${text.slice(0, start).split(/\n/).length}`)}, ${expr}${persist})`;
    cursor = extracted.callEnd;
    searchFrom = extracted.callEnd;
    fileRepl += 1;
  }
  next += text.slice(cursor);
  if (fileRepl === 0) continue;
  if (!next.includes("from '@/lib/ops/caught'") && !next.includes('from "@/lib/ops/caught"')) {
    if (next.startsWith("'use client'") || next.startsWith('"use client"')) {
      next = next.replace(/^(['"]use client['"];\r?\n)/, `$1import { swallow } from '@/lib/ops/caught';\n`);
    } else if (next.startsWith("'use server'") || next.startsWith('"use server"')) {
      next = next.replace(/^(['"]use server['"];\r?\n)/, `$1import { swallow } from '@/lib/ops/caught';\n`);
    } else {
      next = `import { swallow } from '@/lib/ops/caught';\n${next}`;
    }
  }
  fs.writeFileSync(file, next);
  patchedFiles += 1;
  replacements += fileRepl;
}

fs.writeFileSync(
  'scripts/_silent-catch-inventory.txt',
  `${inventory.join('\n')}\n\nCOUNT=${inventory.length}\nPATCHED_FILES=${patchedFiles}\nREPLACEMENTS=${replacements}\n`,
);
console.log(JSON.stringify({ count: inventory.length, patchedFiles, replacements }, null, 2));
