/**
 * Capture remaining unique empty / learned / loading states from the live app.
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

const STUDY_ID = '8601bce7-96cf-4cdc-987a-dadd05b6a107';
const TASK_ID = 'c9cfa769-ce53-4840-9379-288c06a1c5a7';
const DESK_ID = '0a5ab75c-9aad-4711-bd30-72135c993d58';
const HOTKEY_ID = '04d76280-d949-4e0b-a745-0aa4bba04b54';

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

function progressRow(lessonId, title, keys, courseSlug) {
  return [
    {
      lesson_id: lessonId,
      course_slug: courseSlug,
      title,
      keys,
      completed: true,
      attempts: 1,
      correct_count: 1,
      xp_reward: 15,
    },
  ];
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

await run('leaderboard-week-empty', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-leaderboard-period-empty.jpg');
  await login(page);
  await page.goto(BASE + '/leaderboard', { waitUntil: 'networkidle', timeout: 30000 });
  await page.getByRole('button', { name: 'Неделя' }).click();
  await page.getByText('За этот период пока никого').waitFor({ timeout: 15000 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72, fullPage: true });
  const main = await page.locator('main').innerText();
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-leaderboard-period-empty.jpg', w, h, snippet: main.slice(0, 900) };
});

await run('leaderboard-empty', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-guest-leaderboard-empty.jpg');
  await page.route('**/api/leaderboard**', async (route) => {
    const url = route.request().url();
    if (url.includes('/leaderboard/my-rank')) {
      await route.fulfill(
        json({ rank: 0, xp: 0, level: 1, level_title: 'Новичок', in_top_list: false }),
      );
      return;
    }
    await route.fulfill(json([]));
  });
  await page.goto(BASE + '/leaderboard', { waitUntil: 'networkidle', timeout: 30000 });
  await page.getByText('Рейтинг пуст').waitFor({ timeout: 15000 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72, fullPage: true });
  const main = await page.locator('main').innerText();
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-guest-leaderboard-empty.jpg', w, h, snippet: main.slice(0, 900) };
});

await run('leaderboard-api-down', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-guest-leaderboard-api-down.jpg');
  await page.route('**/api/leaderboard**', async (route) => {
    await route.fulfill({ status: 500, contentType: 'application/json', body: '{"detail":"fail"}' });
  });
  await page.goto(BASE + '/leaderboard', { waitUntil: 'networkidle', timeout: 30000 });
  await page.getByText('API недоступен').waitFor({ timeout: 15000 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72, fullPage: true });
  const main = await page.locator('main').innerText();
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-guest-leaderboard-api-down.jpg', w, h, snippet: main.slice(0, 900) };
});

await run('leaderboard-loading', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-guest-leaderboard-loading.jpg');
  await page.route('**/api/leaderboard**', async (route) => {
    await new Promise((r) => setTimeout(r, 20000));
    await route.abort();
  });
  await page.goto(BASE + '/leaderboard', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-guest-leaderboard-loading.jpg', w, h };
});

await run('achievements-empty', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-achievements-empty.jpg');
  await login(page);
  await page.route('**/api/achievements**', async (route) => {
    await route.fulfill(json([]));
  });
  await page.goto(BASE + '/achievements', { waitUntil: 'networkidle', timeout: 30000 });
  await page.getByText('Пройдите первый урок, чтобы открыть достижения').waitFor({ timeout: 15000 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72, fullPage: true });
  const main = await page.locator('main').innerText();
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-achievements-empty.jpg', w, h, snippet: main.slice(0, 900) };
});

await run('lesson-loading', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-guest-lesson-loading.jpg');
  await page.route('**/api/courses/lessons/**', async (route) => {
    await new Promise((r) => setTimeout(r, 20000));
    await route.abort();
  });
  await page.goto(BASE + '/lessons/' + HOTKEY_ID, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-guest-lesson-loading.jpg', w, h };
});

await run('study-only-authed', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-lesson-study-only.jpg');
  await login(page);
  await page.goto(BASE + '/lessons/' + STUDY_ID, { waitUntil: 'networkidle', timeout: 30000 });
  await page.getByRole('heading', { name: 'Окна' }).waitFor({ timeout: 15000 });
  await page.getByText('Запомнил').waitFor({ timeout: 10000 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72, fullPage: true });
  const main = await page.locator('main').innerText();
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-lesson-study-only.jpg', w, h, snippet: main.slice(0, 900) };
});

await run('study-only-learned', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-lesson-study-only-learned.jpg');
  await login(page);
  await page.route('**/progress/lessons**', async (route) => {
    await route.fulfill(json(progressRow(STUDY_ID, 'Окна', ['Alt', 'Tab'], 'programmer-basics')));
  });
  await page.goto(BASE + '/lessons/' + STUDY_ID, { waitUntil: 'networkidle', timeout: 30000 });
  await page.getByText('Это сочетание уже в вашем арсенале').waitFor({ timeout: 15000 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72, fullPage: true });
  const main = await page.locator('main').innerText();
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-lesson-study-only-learned.jpg', w, h, snippet: main.slice(0, 900) };
});

await run('task-done', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-lesson-task-done.jpg');
  await login(page);
  await page.route('**/progress/lessons**', async (route) => {
    await route.fulfill(json(progressRow(TASK_ID, 'Файл и папка', [], 'computer-basics')));
  });
  await page.goto(BASE + '/lessons/' + TASK_ID, { waitUntil: 'networkidle', timeout: 30000 });
  await page.getByText('Задание выполнено').waitFor({ timeout: 15000 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72, fullPage: true });
  const main = await page.locator('main').innerText();
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-lesson-task-done.jpg', w, h, snippet: main.slice(0, 1100) };
});

await run('desktop-task-done', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-lesson-desktop-task-done.jpg');
  await login(page);
  await page.route('**/progress/lessons**', async (route) => {
    await route.fulfill(json(progressRow(DESK_ID, 'Папка Practice', ['desktop:1'], 'computer-basics')));
  });
  await page.goto(BASE + '/lessons/' + DESK_ID, { waitUntil: 'networkidle', timeout: 30000 });
  await page.getByText('Задание выполнено').waitFor({ timeout: 15000 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72, fullPage: true });
  const main = await page.locator('main').innerText();
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-lesson-desktop-task-done.jpg', w, h, snippet: main.slice(0, 1100) };
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
