/**
 * Capture remaining unique loading/empty/admin-form states.
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

await run('path-loading', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-path-loading.jpg');
  await login(page, 'learner@example.com', 'learn123');
  await page.route('**/api/courses**', async (route) => {
    await new Promise((r) => setTimeout(r, 20000));
    await route.abort();
  });
  await page.goto(BASE + '/path', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.getByRole('heading', { name: 'Developer Growth Path' }).waitFor({ timeout: 15000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-path-loading.jpg', w, h };
});

await run('stats-loading', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-stats-loading.jpg');
  await login(page, 'learner@example.com', 'learn123');
  await page.route('**/stats/me**', async (route) => {
    await new Promise((r) => setTimeout(r, 20000));
    await route.abort();
  });
  await page.goto(BASE + '/stats', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.getByRole('heading', { name: 'Статистика' }).waitFor({ timeout: 15000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-stats-loading.jpg', w, h };
});

await run('dashboard-daily-empty', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-dashboard-daily-empty.jpg');
  await login(page, 'learner@example.com', 'learn123');
  await page.route('**/api/daily**', async (route) => route.fulfill(json([])));
  await page.goto(BASE + '/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
  await page.getByText('Задания на сегодня появятся после следующей активности.').waitFor({ timeout: 15000 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72, fullPage: true });
  const main = await page.locator('#main-content').innerText();
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-dashboard-daily-empty.jpg', w, h, snippet: main.slice(0, 900) };
});

await run('dashboard-stages-loading', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-dashboard-loading.jpg');
  await login(page, 'learner@example.com', 'learn123');
  await page.route('**/api/courses**', async (route) => {
    await new Promise((r) => setTimeout(r, 20000));
    await route.abort();
  });
  await page.route('**/api/daily**', async (route) => {
    await new Promise((r) => setTimeout(r, 20000));
    await route.abort();
  });
  await page.goto(BASE + '/dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.getByRole('heading', { name: 'Привет, Анна!' }).waitFor({ timeout: 15000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-dashboard-loading.jpg', w, h };
});

await run('admin-overview-loading', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-admin-overview-loading.jpg');
  await login(page, 'admin@example.com', 'KeyMasterAdmin1!');
  await page.route('**/admin/overview**', async (route) => {
    await new Promise((r) => setTimeout(r, 20000));
    await route.abort();
  });
  await page.goto(BASE + '/admin', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.getByRole('heading', { name: 'Админ-панель' }).waitFor({ timeout: 15000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-admin-overview-loading.jpg', w, h };
});

await run('admin-users-loading', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-admin-users-loading.jpg');
  await login(page, 'admin@example.com', 'KeyMasterAdmin1!');
  await page.goto(BASE + '/admin', { waitUntil: 'networkidle', timeout: 30000 });
  await page.route('**/admin/users**', async (route) => {
    await new Promise((r) => setTimeout(r, 20000));
    await route.abort();
  });
  await page.getByRole('button', { name: 'Пользователи' }).click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-admin-users-loading.jpg', w, h };
});

await run('admin-achievement-create', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-admin-achievement-create.jpg');
  await login(page, 'admin@example.com', 'KeyMasterAdmin1!');
  await page.goto(BASE + '/admin', { waitUntil: 'networkidle', timeout: 30000 });
  await page.getByRole('button', { name: 'Достижения' }).click();
  await page.getByRole('button', { name: 'Создать' }).click();
  await page.getByRole('button', { name: 'Сохранить' }).waitFor({ timeout: 10000 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72, fullPage: true });
  const main = await page.locator('#main-content').innerText();
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-admin-achievement-create.jpg', w, h, snippet: main.slice(0, 900) };
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
