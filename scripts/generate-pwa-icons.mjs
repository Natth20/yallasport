import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const SOURCE = path.join(ROOT, 'public', 'images', 'logo.png');
const ICONS = path.join(ROOT, 'public', 'icons');
const BG = '#0b0b0b';

async function plate(size, logoRatio = 0.72) {
  const logoSize = Math.round(size * logoRatio);
  const logo = await sharp(SOURCE)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BG,
    },
  })
    .composite([{ input: logo, gravity: 'centre' }])
    .png()
    .toBuffer();
}

async function write(file, buffer) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buffer);
  console.log('wrote', path.relative(ROOT, file));
}

const any192 = await plate(192, 0.78);
const any512 = await plate(512, 0.78);
const mask192 = await plate(192, 0.58);
const mask512 = await plate(512, 0.58);
const apple180 = await plate(180, 0.76);
const shortcut96 = await plate(96, 0.78);

await write(path.join(ICONS, 'icon-192.png'), any192);
await write(path.join(ICONS, 'icon-512.png'), any512);
await write(path.join(ICONS, 'maskable-192.png'), mask192);
await write(path.join(ICONS, 'maskable-512.png'), mask512);
await write(path.join(ICONS, 'apple-touch-icon.png'), apple180);
await write(path.join(ICONS, 'shortcut-96.png'), shortcut96);
await write(path.join(ROOT, 'public', 'icon.png'), any192);
await write(path.join(ROOT, 'public', 'apple-touch-icon.png'), apple180);
await write(path.join(ROOT, 'src', 'app', 'icon.png'), any192);
await write(path.join(ROOT, 'src', 'app', 'apple-icon.png'), apple180);
