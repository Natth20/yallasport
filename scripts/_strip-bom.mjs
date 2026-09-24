import fs from 'node:fs';
import path from 'node:path';

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) out.push(full);
  }
  return out;
}

let n = 0;
for (const file of walk(path.resolve('src'))) {
  let text = fs.readFileSync(file, 'utf8');
  const next = text.replaceAll('\uFEFF', '');
  if (next !== text) {
    fs.writeFileSync(file, next);
    n += 1;
  }
}
console.log('stripped bom', n);
