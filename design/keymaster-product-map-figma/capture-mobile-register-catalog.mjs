/**
 * Capture mobile register (BottomNav hidden) and authed catalog (0/N + Выйти).
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
  let w = 390;
  let h = 844;
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

async function mobilePage() {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  });
  return { ctx, page: await ctx.newPage() };
}

const results = [];

{
  const { ctx, page } = await mobilePage();
  await page.goto(BASE + '/path', { waitUntil: 'networkidle', timeout: 30000 });
  await page.getByRole('heading', { name: 'Регистрация' }).waitFor({ timeout: 15000 });
  await page.waitForTimeout(300);
  const file = 'mobile-guest-05-register.jpg';
  await page.screenshot({ path: path.join(shotsDir, file), type: 'jpeg', quality: 72 });
  const heading = await page.getByRole('heading').allInnerTexts();
  const hasNav = await page.locator('nav[aria-label]').count();
  const subtitle = await page.locator('text=Добро пожаловать в KeyMaster').count();
  results.push({
    file,
    bytes: fs.statSync(path.join(shotsDir, file)).size,
    heading,
    bottomNavCount: hasNav,
    welcome: subtitle,
    url: page.url(),
  });
  await ctx.close();
}

{
  const { ctx, page } = await mobilePage();
  await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 30000 });
  await page.fill('#login-email', 'learner@example.com');
  await page.fill('#login-password', 'learn123');
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => (localStorage.getItem('km_token') || '').length > 20, { timeout: 20000 });
  await page.goto(BASE + '/courses', { waitUntil: 'networkidle', timeout: 30000 });
  await page.getByRole('heading', { name: 'Каталог курсов' }).waitFor({ timeout: 15000 });
  await page.getByText('0/16').waitFor({ timeout: 15000 });
  await page.waitForTimeout(300);
  const file = 'mobile-authed-11-courses.jpg';
  await page.screenshot({ path: path.join(shotsDir, file), type: 'jpeg', quality: 72 });
  const header = await page.locator('header').innerText().catch(() => '');
  const progress = await page.getByText(/0\/\d+/).allInnerTexts();
  results.push({
    file,
    bytes: fs.statSync(path.join(shotsDir, file)).size,
    header: header.slice(0, 200),
    progress: progress.slice(0, 8),
  });
  await ctx.close();
}

const sizesPath = path.join(here, 'shot-sizes.json');
const sizes = JSON.parse(fs.readFileSync(sizesPath, 'utf8'));
for (const file of ['mobile-guest-05-register.jpg', 'mobile-authed-11-courses.jpg']) {
  sizes[file] = jpegSize(file);
}
fs.writeFileSync(sizesPath, JSON.stringify(sizes, null, 2) + '\n');
await browser.close();
console.log(JSON.stringify({ results, sizes: {
  register: sizes['mobile-guest-05-register.jpg'],
  courses: sizes['mobile-authed-11-courses.jpg'],
} }, null, 2));
