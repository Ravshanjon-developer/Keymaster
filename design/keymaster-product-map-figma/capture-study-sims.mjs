/**
 * Focused capture: desktop sim, code (VS Code) sim, course study pages.
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
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';

async function login(page) {
  await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 45000 });
  await page.fill('#login-email', 'learner@example.com');
  await page.fill('#login-password', 'learn123');
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => (localStorage.getItem('km_token') || '').length > 20, { timeout: 25000 });
}

async function shot(page, file) {
  const dest = path.join(shotsDir, file);
  await page.waitForTimeout(500);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72, fullPage: false });
  const st = fs.statSync(dest);
  return { file, bytes: st.size };
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
    console.log('OK', name, out?.file || '');
    await ctx.close();
  } catch (err) {
    results.push({ name, ok: false, error: String(err) });
    console.error('FAIL', name, String(err));
  }
}

await run('course-computer-basics', async (page) => {
  await login(page);
  await page.goto(BASE + '/courses/computer-basics', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(800);
  return shot(page, 'desktop-learner-course-computer-basics.jpg');
});

await run('course-vscode', async (page) => {
  await login(page);
  await page.goto(BASE + '/courses/vscode', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(800);
  return shot(page, 'desktop-learner-course-vscode.jpg');
});

await run('sim-desktop', async (page) => {
  await login(page);
  await page.goto(BASE + '/simulator?mode=desktop', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.getByText('Этот компьютер', { exact: true }).waitFor({ timeout: 25000 }).catch(() => {});
  const ok = page.getByRole('button', { name: 'Понятно' });
  if (await ok.isVisible().catch(() => false)) await ok.click();
  await page.waitForTimeout(600);
  return shot(page, 'desktop-learner-23-simulator-desktop.jpg');
});

await run('sim-code', async (page) => {
  await login(page);
  await page.goto(BASE + '/simulator?mode=code', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(1200);
  const ok = page.getByRole('button', { name: 'Понятно' });
  if (await ok.isVisible().catch(() => false)) await ok.click();
  await page.waitForTimeout(600);
  return shot(page, 'desktop-learner-22-simulator-code.jpg');
});

await run('lesson-desktop-task', async (page) => {
  await login(page);
  await page.goto(BASE + '/courses/computer-basics', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(600);
  const link = page.locator('a[href*="/lessons/"]').first();
  if (await link.count()) {
    await link.click();
    await page.waitForTimeout(1200);
  }
  return shot(page, 'desktop-learner-lesson-desktop-task.jpg');
});

await run('path-study', async (page) => {
  await login(page);
  await page.goto(BASE + '/path', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(800);
  return shot(page, 'desktop-learner-09-path.jpg');
});

await browser.close();
console.log(JSON.stringify(results, null, 2));
const failed = results.filter((r) => !r.ok);
process.exit(failed.length ? 1 : 0);
