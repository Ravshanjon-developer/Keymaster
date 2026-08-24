/**
 * Capture remaining unique PracticeShell / loading / mobile course-detail states.
 * Does not change the KeyMaster app.
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(new URL('../../frontend/package.json', import.meta.url));
const { chromium } = require('playwright-core');

const here = path.dirname(fileURLToPath(import.meta.url));
const shotsDir = path.join(here, 'shots');
const BASE = process.env.KM_BASE || 'http://127.0.0.1:5173';
const browserPath =
  process.env.CHROME_PATH ||
  '/home/ubuntu/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell';

function jpegSize(buf) {
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
  return { w, h };
}

async function login(page) {
  await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 30000 });
  await page.fill('#login-email', 'learner@example.com');
  await page.fill('#login-password', 'learn123');
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => (localStorage.getItem('km_token') || '').length > 20, { timeout: 20000 });
}

const browser = await chromium.launch({
  executablePath: browserPath,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

const results = [];
async function run(name, viewport, fn) {
  try {
    const ctx = await browser.newContext({ viewport });
    const page = await ctx.newPage();
    const out = await fn(page);
    results.push({ name, ok: true, ...out });
    await ctx.close();
  } catch (err) {
    results.push({ name, ok: false, error: String(err) });
  }
}

await run('training-empty', { width: 1440, height: 900 }, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-training-empty.jpg');
  await login(page);
  await page.route('**/training/random**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await page.goto(BASE + '/training', { waitUntil: 'networkidle', timeout: 30000 });
  await page.getByText('Нет заданий').waitFor({ timeout: 15000 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72, fullPage: true });
  const main = await page.locator('main').innerText();
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-training-empty.jpg', w, h, snippet: main.slice(0, 800) };
});

await run('course-loading', { width: 1440, height: 900 }, async (page) => {
  const dest = path.join(shotsDir, 'desktop-guest-course-loading.jpg');
  await page.route('**/api/courses/vscode', async (route) => {
    await new Promise((r) => setTimeout(r, 20000));
    await route.abort();
  });
  await page.goto(BASE + '/courses/vscode', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-guest-course-loading.jpg', w, h };
});

await run('review-empty', { width: 1440, height: 900 }, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-review-empty.jpg');
  await login(page);
  await page.route('**/training/random**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await page.goto(BASE + '/review?course=programmer-basics', { waitUntil: 'networkidle', timeout: 30000 });
  await page.getByText('Нет карточек').waitFor({ timeout: 15000 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72, fullPage: true });
  const main = await page.locator('main').innerText();
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-review-empty.jpg', w, h, snippet: main.slice(0, 800) };
});

await run('mobile-course-basics', { width: 390, height: 844 }, async (page) => {
  const dest = path.join(shotsDir, 'mobile-authed-13-course-computer-basics.jpg');
  await login(page);
  await page.goto(BASE + '/courses/computer-basics', { waitUntil: 'networkidle', timeout: 30000 });
  await page.getByRole('heading', { name: 'Первый ноутбук: файлы и папки' }).waitFor({ timeout: 15000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72, fullPage: true });
  const main = await page.locator('main').innerText();
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return {
    file: 'mobile-authed-13-course-computer-basics.jpg',
    w,
    h,
    hasDesktop: main.includes('Рабочий стол'),
    hasTraining: main.includes('Тренировка'),
    snippet: main.slice(0, 900),
  };
});

await browser.close();

const sizesPath = path.join(here, 'shot-sizes.json');
const sizes = JSON.parse(fs.readFileSync(sizesPath, 'utf8'));
for (const r of results) {
  if (!r.ok || !r.file) continue;
  sizes[r.file] = { w: r.w, h: r.h };
}
fs.writeFileSync(sizesPath, JSON.stringify(sizes, null, 2) + '\n');
console.log(JSON.stringify(results, null, 2));
if (results.some((r) => !r.ok)) process.exit(1);
