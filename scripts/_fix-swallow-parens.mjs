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

function matchingParen(text, openIdx) {
  let depth = 0;
  let inStr = null;
  let escaped = false;
  for (let i = openIdx; i < text.length; i += 1) {
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
    if (ch === '(') depth += 1;
    else if (ch === ')') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

let filesFixed = 0;
let inserts = 0;
for (const file of walk(path.resolve('src'))) {
  let text = fs.readFileSync(file, 'utf8');
  const marker = '.catch(swallow(';
  let search = 0;
  let next = '';
  let cursor = 0;
  let fileInserts = 0;
  while (true) {
    const idx = text.indexOf(marker, search);
    if (idx === -1) break;
    const swallowOpen = idx + '.catch'.length; // points at (
    // .catch(swallow(
    const catchOpen = idx + 6; // (
    const swallowCallOpen = idx + marker.length - 1; // ( of swallow
    const swallowClose = matchingParen(text, swallowCallOpen);
    if (swallowClose === -1) break;
    const after = text[swallowClose + 1];
    next += text.slice(cursor, swallowClose + 1);
    if (after !== ')') {
      next += ')';
      fileInserts += 1;
    }
    cursor = swallowClose + 1;
    search = swallowClose + 1;
  }
  if (fileInserts === 0) continue;
  next += text.slice(cursor);
  fs.writeFileSync(file, next);
  filesFixed += 1;
  inserts += fileInserts;
}
console.log(JSON.stringify({ filesFixed, inserts }));
