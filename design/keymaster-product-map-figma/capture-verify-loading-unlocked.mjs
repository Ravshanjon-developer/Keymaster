/**
 * Capture remaining unique verify / loading / unlocked / mobile-period states.
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

async function login(page) {
  await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 30000 });
  await page.fill('#login-email', 'learner@example.com');
  await page.fill('#login-password', 'learn123');
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => (localStorage.getItem('km_token') || '').length > 20, { timeout: 20000 });
}

function json(data) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(data) };
}

const UNLOCKED = [
  {
    id: 'e4f03310-fa79-4ae0-831c-654d5e0b9219',
    slug: 'first-win',
    title: 'Первая победа',
    description: 'Первый правильный ответ',
    icon: 'star',
    xp_bonus: 50,
    unlocked: true,
    unlocked_at: '2026-08-24T00:00:00Z',
  },
  {
    id: '5c25f0aa-c133-4e7c-a512-d6ae43edb922',
    slug: '100-correct',
    title: '100 правильных',
    description: '100 правильных ответов',
    icon: 'target',
    xp_bonus: 50,
    unlocked: true,
    unlocked_at: '2026-08-24T00:00:00Z',
  },
  {
    id: '6686418a-4931-4408-acf0-c834009e1cd9',
    slug: '500-xp',
    title: '500 XP',
    description: 'Накопите 500 XP',
    icon: 'zap',
    xp_bonus: 50,
    unlocked: false,
    unlocked_at: null,
  },
  {
    id: 'ab1d4b12-7027-48bb-9a46-7e9cd2766758',
    slug: '1000-xp',
    title: '1000 XP',
    description: 'Накопите 1000 XP',
    icon: 'flame',
    xp_bonus: 50,
    unlocked: false,
    unlocked_at: null,
  },
];

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
const phone = { width: 390, height: 844 };

await run('verify-loading', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-guest-verify-email-loading.jpg');
  await page.route('**/api/auth/verify-email', async (route) => {
    await new Promise((r) => setTimeout(r, 20000));
    await route.abort();
  });
  await page.goto(BASE + '/verify-email?token=abcdefghijklmnopqrstuvwxyz12', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.getByText('Проверяем ссылку…').waitFor({ timeout: 10000 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const main = await page.locator('#main-content').innerText();
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-guest-verify-email-loading.jpg', w, h, snippet: main.slice(0, 600) };
});

await run('verify-success', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-guest-verify-email-ok.jpg');
  await page.route('**/api/auth/verify-email', async (route) => {
    await route.fulfill(json({ message: 'Email подтверждён. Теперь можно войти.', verified: true }));
  });
  await page.goto(BASE + '/verify-email?token=abcdefghijklmnopqrstuvwxyz12', { waitUntil: 'networkidle', timeout: 30000 });
  await page.getByText('Email подтверждён. Теперь можно войти.').waitFor({ timeout: 15000 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const main = await page.locator('#main-content').innerText();
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-guest-verify-email-ok.jpg', w, h, snippet: main.slice(0, 600) };
});

await run('achievements-loading', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-achievements-loading.jpg');
  await login(page);
  await page.route('**/api/achievements**', async (route) => {
    await new Promise((r) => setTimeout(r, 20000));
    await route.abort();
  });
  await page.goto(BASE + '/achievements', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-achievements-loading.jpg', w, h };
});

await run('achievements-unlocked', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-achievements-unlocked.jpg');
  await login(page);
  await page.route('**/api/achievements**', async (route) => {
    await route.fulfill(json(UNLOCKED));
  });
  await page.goto(BASE + '/achievements', { waitUntil: 'networkidle', timeout: 30000 });
  await page.getByText('Первая победа').waitFor({ timeout: 15000 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72, fullPage: true });
  const main = await page.locator('main').innerText();
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-achievements-unlocked.jpg', w, h, snippet: main.slice(0, 800) };
});

await run('training-loading', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-training-loading.jpg');
  await login(page);
  await page.route('**/training/random**', async (route) => {
    await new Promise((r) => setTimeout(r, 20000));
    await route.abort();
  });
  await page.goto(BASE + '/training', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-training-loading.jpg', w, h };
});

await run('review-loading', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-review-loading.jpg');
  await login(page);
  await page.route('**/training/random**', async (route) => {
    await new Promise((r) => setTimeout(r, 20000));
    await route.abort();
  });
  await page.goto(BASE + '/review', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-review-loading.jpg', w, h };
});

await run('speed-loading', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-speed-loading.jpg');
  await login(page);
  await page.route('**/training/random**', async (route) => {
    await new Promise((r) => setTimeout(r, 20000));
    await route.abort();
  });
  await page.goto(BASE + '/speed', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-speed-loading.jpg', w, h };
});

await run('mobile-leaderboard-week-empty', phone, async (page) => {
  const dest = path.join(shotsDir, 'mobile-authed-14-leaderboard-period-empty.jpg');
  await login(page);
  await page.goto(BASE + '/leaderboard', { waitUntil: 'networkidle', timeout: 30000 });
  await page.getByRole('button', { name: 'Неделя' }).click();
  await page.getByText('За этот период пока никого').waitFor({ timeout: 15000 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72, fullPage: true });
  const main = await page.locator('main').innerText();
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'mobile-authed-14-leaderboard-period-empty.jpg', w, h, snippet: main.slice(0, 800) };
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
