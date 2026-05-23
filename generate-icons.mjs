import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

mkdirSync('public/icons', { recursive: true });

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="8" fill="#6366f1"/>
  <text x="16" y="23" font-family="Georgia, serif" font-size="20" font-weight="bold" fill="white" text-anchor="middle">Ω</text>
</svg>`;

const html = (size) => `<!DOCTYPE html><html><head><style>*{margin:0;padding:0;background:transparent}</style></head><body>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="${size * 8 / 32}" fill="#6366f1"/>
  <text x="16" y="23" font-family="Georgia, serif" font-size="20" font-weight="bold" fill="white" text-anchor="middle">Ω</text>
</svg></body></html>`;

const browser = await chromium.launch({ headless: true });

for (const size of [192, 512]) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(html(size));
  await page.screenshot({ path: `public/icons/icon-${size}x${size}.png`, omitBackground: true });
  await page.close();
  console.log(`Generated icon-${size}x${size}.png`);
}

await browser.close();
console.log('Icons generated.');
