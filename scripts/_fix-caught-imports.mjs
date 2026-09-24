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
  if (!text.includes('reportCaughtError(')) continue;
  if (/import \{[^}]*reportCaughtError/.test(text)) continue;
  if (/from ['"]@\/lib\/ops\/caught['"]/.test(text)) {
    text = text.replace(/import \{([^}]+)\} from ['"]@\/lib\/ops\/caught['"]/, (m, g) => {
      if (g.includes('reportCaughtError')) return m;
      return `import {${g.replace(/\s+$/, '')}, reportCaughtError } from '@/lib/ops/caught'`;
    });
  } else if (text.startsWith("'use client';")) {
    text = `'use client';\nimport { reportCaughtError } from '@/lib/ops/caught';\n` + text.slice("'use client';".length);
  } else {
    text = `import { reportCaughtError } from '@/lib/ops/caught';\n` + text;
  }
  fs.writeFileSync(file, text);
  n += 1;
  console.log(path.relative(process.cwd(), file));
}
console.log('updated', n);
