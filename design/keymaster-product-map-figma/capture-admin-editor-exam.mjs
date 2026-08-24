/**
 * Capture remaining unique admin editor / exam-loading / rank-outside-top states.
 * Does not change the KeyMaster application.
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

function json(data) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(data) };
}

async function login(page, email, password) {
  await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 30000 });
  await page.fill('#login-email', email);
  await page.fill('#login-password', password);
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

const desk = { width: 1440, height: 900 };

await run('admin-course-editor', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-admin-course-editor.jpg');
  await login(page, 'admin@example.com', 'KeyMasterAdmin1!');
  await page.goto(BASE + '/admin', { waitUntil: 'networkidle', timeout: 30000 });
  await page.getByRole('heading', { name: 'Админ-панель' }).waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: 'Курсы' }).click();
  await page.getByRole('button', { name: 'Открыть' }).first().waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: 'Открыть' }).first().click();
  await page.getByText('Назад к курсам').waitFor({ timeout: 15000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72, fullPage: true });
  const main = await page.locator('#main-content').innerText();
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-admin-course-editor.jpg', w, h, snippet: main.slice(0, 1400) };
});

await run('admin-course-create', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-admin-course-create.jpg');
  await login(page, 'admin@example.com', 'KeyMasterAdmin1!');
  await page.goto(BASE + '/admin', { waitUntil: 'networkidle', timeout: 30000 });
  await page.getByRole('button', { name: 'Курсы' }).click();
  await page.getByRole('button', { name: 'Создать' }).click();
  await page.getByRole('button', { name: 'Сохранить' }).waitFor({ timeout: 10000 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72, fullPage: true });
  const main = await page.locator('#main-content').innerText();
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-admin-course-create.jpg', w, h, snippet: main.slice(0, 900) };
});

await run('exam-loading', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-exam-loading.jpg');
  await login(page, 'learner@example.com', 'learn123');
  await page.route('**/training/random**', async (route) => {
    await new Promise((r) => setTimeout(r, 20000));
    await route.abort();
  });
  await page.goto(BASE + '/exam', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.getByRole('button', { name: 'Начать экзамен' }).waitFor({ timeout: 20000 });
  await page.getByRole('button', { name: 'Начать экзамен' }).click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-exam-loading.jpg', w, h };
});

await run('leaderboard-outside-top', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-leaderboard-outside-top.jpg');
  await login(page, 'learner@example.com', 'learn123');
  await page.route('**/api/leaderboard**', async (route) => {
    const url = route.request().url();
    if (url.includes('/leaderboard/my-rank')) {
      await route.fulfill(
        json({ rank: 12, xp: 40, level: 1, level_title: 'Новичок', in_top_list: false }),
      );
      return;
    }
    await route.fulfill(
      json([
        { rank: 1, username: 'alice', display_name: 'Алиса', xp: 900, level_title: 'Middle' },
        { rank: 2, username: 'bob', display_name: 'Боб', xp: 700, level_title: 'Junior+' },
        { rank: 3, username: 'cara', display_name: 'Кара', xp: 500, level_title: 'Junior' },
      ]),
    );
  });
  await page.goto(BASE + '/leaderboard', { waitUntil: 'networkidle', timeout: 30000 });
  await page.getByText('Ваше место: #12 · 40 XP').waitFor({ timeout: 15000 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72, fullPage: true });
  const main = await page.locator('#main-content').innerText();
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-leaderboard-outside-top.jpg', w, h, snippet: main.slice(0, 900) };
});

await browser.close();

const sizesPath = path.join(here, 'shot-sizes.json');
const sizes = JSON.parse(fs.readFileSync(sizesPath, 'utf8'));
for (const r of results) {
  if (r.ok && r.file) sizes[r.file] = { w: r.w, h: r.h };
}
fs.writeFileSync(sizesPath, JSON.stringify(sizes, null, 2) + '\n');
console.log(JSON.stringify(results, null, 2));
const failed = results.filter((r) => !r.ok);
if (failed.length) process.exit(1);
