import fs from 'node:fs';
import path from 'node:path';

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

let n = 0;
for (const file of walk(path.resolve('src'))) {
  let text = fs.readFileSync(file, 'utf8');
  const orig = text;
  text = text.replace(/^\uFEFF/, '');
  const dirMatch = text.match(/^([\s\S]*?)(['"]use (client|server)['"];\r?\n)/);
  if (dirMatch && dirMatch[1].trim().length > 0 && dirMatch[1].includes('swallow')) {
    const kind = dirMatch[3];
    text = `'use ${kind}';\n` + text.replace(dirMatch[2], '');
  }
  text = text.replace(
    /\(await ([^)]+)\.catch\(swallow\(([^)]*)\)\) as /g,
    '(await $1.catch(swallow($2))) as ',
  );
  if (text !== orig) {
    fs.writeFileSync(file, text);
    n += 1;
  }
}
console.log('rewritten', n);
