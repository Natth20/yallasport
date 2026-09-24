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

const skipPersist = /json\(\)\.catch|\.play\(\)\.catch|\$disconnect\(\)\.catch/;
let changed = 0;
const inventory = [];

for (const file of files) {
  let text = fs.readFileSync(file, 'utf8');
  if (!text.includes('.catch(() =>') && !text.includes('.catch(() =>')) continue;
  const rel = path.relative(process.cwd(), file).replaceAll('\\', '/');
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    if (/\.catch\(\s*\(\)\s*=>/.test(line)) {
      inventory.push(`${rel}:${i + 1}:${line.trim()}`);
    }
  });

  if (file.endsWith('caught.ts') || file.endsWith('prisma.ts')) continue;

  const next = text.replace(/\.catch\(\s*\(\)\s*=>\s*/g, (match, offset) => {
    const before = text.slice(Math.max(0, offset - 80), offset);
    const persist = /json\(\)\.catch|\.play\(\)/.test(before) ? ', { persist: false }' : '';
    return `.catch(swallow(${JSON.stringify(rel)}${persist ? '' : ''}, `;
  });

  // The naive replace is wrong because we need fallback as first arg after scope.
  // Do a more precise replace instead.
}

fs.writeFileSync('scripts/_silent-catch-inventory.txt', inventory.join('\n'));
console.log(`inventory ${inventory.length}`);
