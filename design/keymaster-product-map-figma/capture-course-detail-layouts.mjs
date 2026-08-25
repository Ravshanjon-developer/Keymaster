/**
 * Capture remaining unique course-detail layouts from the live app (as-is).
 * Guest vscode, guest programmer-basics, authed programmer-basics.
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

await run('guest-vscode', async (page) => {
  const dest = path.join(shotsDir, 'desktop-guest-06-course-vscode.jpg');
  await page.goto(BASE + '/courses/vscode', { waitUntil: 'networkidle', timeout: 30000 });
  await page.getByRole('heading', { name: 'VS Code' }).waitFor({ timeout: 15000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72, fullPage: true });
  const main = await page.locator('main').innerText();
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return {
    file: 'desktop-guest-06-course-vscode.jpg',
    w,
    h,
    hasStart: main.includes('ОБЯЗАТЕЛЬНЫЙ СТАРТ'),
    hasDesktop: main.includes('Рабочий стол'),
    hasTraining: main.includes('Тренировка'),
    hasExam: /\bЭкзамен\b/.test(main),
    hasRegister: main.includes('Зарегистрируйтесь'),
    snippet: main.slice(0, 1200),
  };
});

await run('guest-programmer-basics', async (page) => {
  const dest = path.join(shotsDir, 'desktop-guest-course-programmer-basics.jpg');
  await page.goto(BASE + '/courses/programmer-basics', { waitUntil: 'networkidle', timeout: 30000 });
  await page.getByRole('heading', { name: 'Основные горячие клавиши программиста' }).waitFor({ timeout: 15000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72, fullPage: true });
  const main = await page.locator('main').innerText();
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return {
    file: 'desktop-guest-course-programmer-basics.jpg',
    w,
    h,
    hasStart: main.includes('ОБЯЗАТЕЛЬНЫЙ СТАРТ'),
    hasDesktop: main.includes('Рабочий стол'),
    hasTraining: main.includes('Тренировка'),
    hasExam: /\bЭкзамен\b/.test(main),
    hasRegister: main.includes('Зарегистрируйтесь'),
    snippet: main.slice(0, 1200),
  };
});

await run('authed-programmer-basics', async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-course-programmer-basics.jpg');
  await login(page);
  await page.goto(BASE + '/courses/programmer-basics', { waitUntil: 'networkidle', timeout: 30000 });
  await page.getByRole('heading', { name: 'Основные горячие клавиши программиста' }).waitFor({ timeout: 15000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72, fullPage: true });
  const main = await page.locator('main').innerText();
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return {
    file: 'desktop-learner-course-programmer-basics.jpg',
    w,
    h,
    hasStart: main.includes('ОБЯЗАТЕЛЬНЫЙ СТАРТ'),
    hasDesktop: main.includes('Рабочий стол'),
    hasTraining: main.includes('Тренировка'),
    hasExam: /\bЭкзамен\b/.test(main),
    hasLearnStatus: main.includes('НЕ ИЗУЧЕНО') || main.includes('Не изучено'),
    snippet: main.slice(0, 1400),
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
