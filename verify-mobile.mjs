import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

mkdirSync('verify-screenshots', { recursive: true });

const MOBILE = { width: 390, height: 844 }; // iPhone 14
const TABLET = { width: 768, height: 1024 }; // iPad

const browser = await chromium.launch({ headless: false });

async function shot(page, name) {
  await page.screenshot({ path: `verify-screenshots/mobile-${name}.png`, fullPage: false });
}

// Mobile
const mobile = await browser.newPage();
await mobile.setViewportSize(MOBILE);
await mobile.goto('http://localhost:3000');
await mobile.waitForTimeout(1500);
await shot(mobile, '01-login-390');

// Tablet
const tablet = await browser.newPage();
await tablet.setViewportSize(TABLET);
await tablet.goto('http://localhost:3000');
await tablet.waitForTimeout(1500);
await shot(tablet, '02-login-768');

// Small phone
const small = await browser.newPage();
await small.setViewportSize({ width: 320, height: 568 }); // iPhone SE 1st gen
await small.goto('http://localhost:3000');
await small.waitForTimeout(1500);
await shot(small, '03-login-320');

await browser.close();
console.log('Done — check verify-screenshots/mobile-*.png');
