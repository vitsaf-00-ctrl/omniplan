import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

mkdirSync('verify-screenshots', { recursive: true });

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 800 });
await page.goto('http://localhost:3000');
await page.waitForTimeout(2000);
await page.screenshot({ path: 'verify-screenshots/search-01-initial.png' });

// Check Ctrl+F opens overlay
await page.keyboard.press('Control+f');
await page.waitForTimeout(600);
await page.screenshot({ path: 'verify-screenshots/search-02-overlay-open.png' });

const input = await page.$('input[placeholder="Пошук задач..."]');
console.log('1. Search overlay opened:', !!input);

// Type query
if (input) {
  await input.type('за');
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'verify-screenshots/search-03-results.png' });
  const results = await page.$$('button.w-full.flex.items-center');
  console.log('2. Results shown:', results.length);
}

// Escape closes overlay
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
const gone = !(await page.$('input[placeholder="Пошук задач..."]'));
console.log('3. Overlay closed on Esc:', gone);
await page.screenshot({ path: 'verify-screenshots/search-04-closed.png' });

// Click search button in header
const searchBtns = await page.$$('header button');
let opened = false;
for (const btn of searchBtns) {
  const text = await btn.textContent();
  if (text && text.includes('Ctrl+F')) {
    await btn.click();
    opened = true;
    break;
  }
}
await page.waitForTimeout(400);
const reopened = !!(await page.$('input[placeholder="Пошук задач..."]'));
console.log('4. Opens via header button:', reopened);
await page.screenshot({ path: 'verify-screenshots/search-05-via-button.png' });

await browser.close();
console.log('DONE');
