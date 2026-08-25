/**
 * Capture desktop-task lesson and authed mobile dashboard from the live app.
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

function jpegSize(file) {
  const buf = fs.readFileSync(path.join(shotsDir, file));
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

const browser = await chromium.launch({
  executablePath: browserPath,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

async function login(page) {
  await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 30000 });
  await page.fill('#login-email', 'learner@example.com');
  await page.fill('#login-password', 'learn123');
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => (localStorage.getItem('km_token') || '').length > 20, { timeout: 20000 });
}

const results = [];

{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await login(page);
  const lesson = await page.evaluate(async () => {
    const token = localStorage.getItem('km_token');
    const res = await fetch('/api/courses/computer-basics', {
      headers: { Authorization: 'Bearer ' + token },
    });
    const course = await res.json();
    const lessons = (course.categories || []).flatMap((c) => c.lessons || []);
    const hit = lessons.find((l) => Array.isArray(l.keys) && String(l.keys[0] || '').startsWith('desktop:'));
    return hit ? { id: hit.id, title: hit.title, keys: hit.keys } : null;
  });
  if (!lesson) throw new Error('no desktop: lesson on computer-basics');
  await page.goto(BASE + '/lessons/' + lesson.id, { waitUntil: 'networkidle', timeout: 30000 });
  await page.locator('h1').waitFor({ timeout: 15000 });
  await page.waitForTimeout(300);
  const file = 'desktop-learner-lesson-desktop-task.jpg';
  await page.screenshot({ path: path.join(shotsDir, file), type: 'jpeg', quality: 72, fullPage: true });
  const body = await page.locator('main').innerText();
  results.push({
    file,
    bytes: fs.statSync(path.join(shotsDir, file)).size,
    lesson,
    h1: await page.locator('h1').innerText(),
    body: body.slice(0, 900),
    hasSimCta: /симулятор/i.test(body),
    hasHonesty: body.includes('сам засчитает'),
  });
  await ctx.close();
}

{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  await login(page);
  await page.goto(BASE + '/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
  await page.getByRole('heading', { name: /Привет/ }).waitFor({ timeout: 15000 });
  await page.waitForTimeout(300);
  const file = 'mobile-authed-12-dashboard.jpg';
  await page.screenshot({ path: path.join(shotsDir, file), type: 'jpeg', quality: 72 });
  const header = await page.locator('header').innerText().catch(() => '');
  results.push({
    file,
    bytes: fs.statSync(path.join(shotsDir, file)).size,
    header: header.slice(0, 200),
    main: (await page.locator('main').innerText()).slice(0, 700),
  });
  await ctx.close();
}

const sizesPath = path.join(here, 'shot-sizes.json');
const sizes = JSON.parse(fs.readFileSync(sizesPath, 'utf8'));
sizes['desktop-learner-lesson-desktop-task.jpg'] = jpegSize('desktop-learner-lesson-desktop-task.jpg');
sizes['mobile-authed-12-dashboard.jpg'] = jpegSize('mobile-authed-12-dashboard.jpg');
fs.writeFileSync(sizesPath, JSON.stringify(sizes, null, 2) + '\n');
await browser.close();
console.log(JSON.stringify({ results, sizes: {
  lesson: sizes['desktop-learner-lesson-desktop-task.jpg'],
  dashboard: sizes['mobile-authed-12-dashboard.jpg'],
} }, null, 2));
