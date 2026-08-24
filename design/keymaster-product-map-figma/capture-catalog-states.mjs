/**
 * Capture authed catalog / vscode detail / course-not-found from the live app.
 * Does not change application code. Requires Vite at 127.0.0.1:5173.
 */
import { createRequire } from 'node:module';
const require = createRequire(new URL('../../frontend/package.json', import.meta.url));
const { chromium } = require('playwright-core');
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const shotsDir = path.join(here, 'shots');
const BASE = process.env.KM_BASE || 'http://127.0.0.1:5173';
const browserPath =
  process.env.CHROME_PATH ||
  '/home/ubuntu/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell';
const LEARNER = { email: 'learner@example.com', password: 'learn123' };

async function shot(page, file, fullPage) {
  const dest = path.join(shotsDir, file);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72, fullPage: !!fullPage });
  return { file, bytes: fs.statSync(dest).size };
}

async function login(page) {
  await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 30000 });
  await page.fill('#login-email', LEARNER.email);
  await page.fill('#login-password', LEARNER.password);
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => (localStorage.getItem('km_token') || '').length > 20, { timeout: 20000 });
}

const browser = await chromium.launch({
  executablePath: browserPath,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

const results = [];
async function run(name, fn) {
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const out = await fn(page);
    results.push({ name, ok: true, ...out });
    await ctx.close();
  } catch (err) {
    results.push({ name, ok: false, error: String(err) });
  }
}

await run('authed-catalog', async (page) => {
  await login(page);
  await page.goto(BASE + '/courses', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForSelector('text=Первый ноутбук', { timeout: 15000 });
  await page.waitForTimeout(400);
  return shot(page, 'desktop-learner-courses.jpg', true);
});

await run('authed-vscode', async (page) => {
  await login(page);
  await page.goto(BASE + '/courses/vscode', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForSelector('text=Навигация', { timeout: 15000 });
  await page.waitForTimeout(400);
  return shot(page, 'desktop-learner-course-vscode.jpg', true);
});

await run('course-not-found', async (page) => {
  await page.goto(BASE + '/courses/does-not-exist', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForSelector('text=Курс не найден', { timeout: 15000 });
  await page.waitForTimeout(200);
  return shot(page, 'desktop-guest-course-not-found.jpg', false);
});

await browser.close();

const sizesPath = path.join(here, 'shot-sizes.json');
const sizes = JSON.parse(fs.readFileSync(sizesPath, 'utf8'));
for (const r of results) {
  if (!r.ok || !r.file) continue;
  const buf = fs.readFileSync(path.join(shotsDir, r.file));
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
  sizes[r.file] = { w, h };
}
fs.writeFileSync(sizesPath, JSON.stringify(sizes, null, 2) + '\n');
console.log(JSON.stringify(results, null, 2));
if (results.some((r) => !r.ok)) process.exit(1);
