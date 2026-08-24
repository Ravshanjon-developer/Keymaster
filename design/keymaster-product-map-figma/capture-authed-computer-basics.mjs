/**
 * Capture authed computer-basics course detail (Desktop CTA, no Training/Exam).
 * Does not change the KeyMaster app.
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(new URL('../../frontend/package.json', import.meta.url));
const { chromium } = require('playwright-core');

const here = path.dirname(fileURLToPath(import.meta.url));
const dest = path.join(here, 'shots', 'desktop-learner-course-computer-basics.jpg');
const BASE = process.env.KM_BASE || 'http://127.0.0.1:5173';
const browserPath =
  process.env.CHROME_PATH ||
  '/home/ubuntu/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell';

const browser = await chromium.launch({
  executablePath: browserPath,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 30000 });
await page.fill('#login-email', 'learner@example.com');
await page.fill('#login-password', 'learn123');
await page.click('button[type="submit"]');
await page.waitForFunction(() => (localStorage.getItem('km_token') || '').length > 20, { timeout: 20000 });
await page.goto(BASE + '/courses/computer-basics', { waitUntil: 'networkidle', timeout: 30000 });
await page.getByRole('heading', { name: 'Первый ноутбук: файлы и папки' }).waitFor({ timeout: 15000 });
await page.waitForTimeout(400);
await page.screenshot({ path: dest, type: 'jpeg', quality: 72, fullPage: true });
const main = await page.locator('main').innerText();
const buf = fs.readFileSync(dest);
let w = 1440;
let h = 900;
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
sizes['desktop-learner-course-computer-basics.jpg'] = { w, h };
fs.writeFileSync(sizesPath, JSON.stringify(sizes, null, 2) + '\n');
await browser.close();
console.log(JSON.stringify({
  dest,
  bytes: fs.statSync(dest).size,
  w,
  h,
  hasDesktopCta: main.includes('Рабочий стол'),
  hasTraining: main.includes('Тренировка'),
  hasExam: /\bЭкзамен\b/.test(main),
  hasProgress: main.includes('0/16'),
  hasLearnStatus: main.includes('НЕ ИЗУЧЕНО') || main.includes('Не изучено'),
  snippet: main.slice(0, 900),
}, null, 2));
