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

const PARSE_HINT = /isSafeHttpUrl|isValidTimezone|JSON\.parse|localStorage|sessionStorage|new URL\(|DateTimeFormat|clipboard|share\(/;

const inventory = [];

for (const file of walk(path.resolve('src'))) {
  let text = fs.readFileSync(file, 'utf8');
  if (!/catch\s*\{/.test(text) && !/catch\s*\{\s*\}/.test(text)) continue;
  const rel = path.relative(process.cwd(), file).replaceAll('\\', '/');
  const lines = text.split(/\n/);
  let changed = false;
  const next = lines.map((line, i) => {
    const trimmed = line.trim();
    if (trimmed !== '} catch {' && trimmed !== '} catch {}' && !/^\s*\} catch \{\s*$/.test(line)) {
      if (trimmed === '} catch {}') {
        inventory.push(`${rel}:${i + 1}`);
        changed = true;
        const indent = line.match(/^\s*/)[0];
        return `${indent}} catch (error) {\n${indent}  reportCaughtError("${rel}:${i + 1}", error, { persist: false });`;
      }
      return line;
    }
    if (trimmed === '} catch {}') {
      inventory.push(`${rel}:${i + 1}`);
      changed = true;
      const indent = line.match(/^\s*/)[0];
      return `${indent}} catch (error) {\n${indent}  reportCaughtError("${rel}:${i + 1}", error, { persist: false });`;
    }
    // peek following lines for existing log
    const window = lines.slice(i, i + 6).join('\n');
    if (window.includes('reportCaughtError') || window.includes('console.')) return line;
    inventory.push(`${rel}:${i + 1}`);
    changed = true;
    const indent = line.match(/^\s*/)[0];
    const persist = PARSE_HINT.test(window) || rel.includes('/components/') || rel.includes('Context')
      ? ', { persist: false }'
      : '';
    return `${indent}} catch (error) {\n${indent}  reportCaughtError("${rel}:${i + 1}", error${persist});`;
  });
  if (!changed) continue;
  let out = next.join('\n');
  if (!out.includes("from '@/lib/ops/caught'")) {
    if (out.startsWith("'use client';")) {
      out = `'use client';\nimport { reportCaughtError } from '@/lib/ops/caught';\n` + out.slice("'use client';".length);
    } else if (out.startsWith('"use client";')) {
      out = `"use client";\nimport { reportCaughtError } from '@/lib/ops/caught';\n` + out.slice('"use client";'.length);
    } else {
      out = `import { reportCaughtError } from '@/lib/ops/caught';\n` + out;
    }
  }
  fs.writeFileSync(file, out);
}

console.log('COUNT=' + inventory.length);
console.log(inventory.join('\n'));
