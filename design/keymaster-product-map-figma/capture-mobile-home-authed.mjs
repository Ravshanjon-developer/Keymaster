/**
 * Capture authed mobile Home (390) — Выйти header, path/practice CTAs, BottomNav inactive.
 * Does not change the KeyMaster app.
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(new URL('../../frontend/package.json', import.meta.url));
const { chromium } = require('playwright-core');

const here = path.dirname(fileURLToPath(import.meta.url));
const dest = path.join(here, 'shots', 'mobile-authed-09-home.jpg');
const BASE = process.env.KM_BASE || 'http://127.0.0.1:5173';
const browserPath =
  process.env.CHROME_PATH ||
  '/home/ubuntu/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell';

const browser = await chromium.launch({
  executablePath: browserPath,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 1,
});
const page = await ctx.newPage();
await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 30000 });
await page.fill('#login-email', 'learner@example.com');
await page.fill('#login-password', 'learn123');
await page.click('button[type="submit"]');
await page.waitForFunction(() => (localStorage.getItem('km_token') || '').length > 20, { timeout: 20000 });
await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForSelector('text=Мой путь развития', { timeout: 15000 });
await page.waitForTimeout(300);
await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });

const buf = fs.readFileSync(dest);
let w = 390;
let h = 844;
for (let i = 2; i < buf.length - 8; i++) {
  if (buf[i] !== 0xff) continue;
  const marker = buf[i + 1];
  if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
    h = (buf[i + 5] << 8) | buf[i + 6];
    w = (buf[i + 7] << 8) | buf[i + 8];
    break;
  }
}
const sizesPath = path.join(here, 'shot-sizes.json');
const sizes = JSON.parse(fs.readFileSync(sizesPath, 'utf8'));
sizes['mobile-authed-09-home.jpg'] = { w, h };
fs.writeFileSync(sizesPath, JSON.stringify(sizes, null, 2) + '\n');
await browser.close();
console.log('wrote', dest, fs.statSync(dest).size, w, h);
