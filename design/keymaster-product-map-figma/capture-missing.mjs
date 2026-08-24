/**
 * Capture remaining unique-page states from the live app (as-is, no redesign).
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

async function shot(page, file) {
  const dest = path.join(shotsDir, file);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  return { file, bytes: fs.statSync(dest).size };
}

async function login(page, creds) {
  await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 30000 });
  await page.fill('#login-email', creds.email);
  await page.fill('#login-password', creds.password);
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

await run('login-error', async (page) => {
  await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 30000 });
  await page.fill('#login-email', 'nobody@example.com');
  await page.fill('#login-password', 'wrong-password');
  await page.click('button[type="submit"]');
  await page.waitForSelector('[role="alert"]', { timeout: 15000 });
  await page.waitForTimeout(300);
  return shot(page, 'desktop-guest-login-error.jpg');
});

await run('exam-empty', async (page) => {
  await login(page, LEARNER);
  await page.route('**/training/random**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await page.goto(BASE + '/exam', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: 'Начать экзамен' }).click();
  await page.waitForSelector('text=Нет вопросов', { timeout: 15000 });
  await page.waitForTimeout(200);
  return shot(page, 'desktop-learner-exam-empty.jpg');
});

await run('exam-feedback', async (page) => {
  await login(page, LEARNER);
  await page.goto(BASE + '/exam', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: 'Начать экзамен' }).click();
  await page.waitForTimeout(800);
  await page.keyboard.press('KeyX');
  await page.waitForSelector('text=Неверно', { timeout: 8000 });
  await page.waitForTimeout(200);
  return shot(page, 'desktop-learner-exam-feedback.jpg');
});

await run('speed-done', async (page) => {
  await login(page, LEARNER);
  await page.goto(BASE + '/speed', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Старт 60 сек' }).click();
  await page.waitForTimeout(62000);
  await page.waitForSelector('text=Время вышло', { timeout: 8000 });
  return shot(page, 'desktop-learner-speed-done.jpg');
});

await run('study-only', async (page) => {
  await page.goto(BASE + '/courses/windows', { waitUntil: 'networkidle', timeout: 30000 });
  const href = await page.evaluate(() => {
    const links = [...document.querySelectorAll('a[href^="/lessons/"]')];
    const hit = links.find((a) => /Alt|Tab|F12|Print|системн/i.test(a.textContent || ''));
    return (hit || links[0])?.getAttribute('href');
  });
  if (!href) throw new Error('no lesson links on /courses/windows');
  await page.goto(BASE + href, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(500);
  return shot(page, 'desktop-guest-lesson-study-only.jpg');
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
