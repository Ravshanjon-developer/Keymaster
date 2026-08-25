/**
 * Recapture PracticeKeyboardGate on mobile /exam (training allows virtual keys, so /training never gates).
 * Does not change the KeyMaster app. Requires Vite at 127.0.0.1:5173.
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(new URL('../../frontend/package.json', import.meta.url));
const { chromium } = require('playwright-core');

const here = path.dirname(fileURLToPath(import.meta.url));
const dest = path.join(here, 'shots', 'mobile-authed-08-training-gate.jpg');
const BASE = process.env.KM_BASE || 'http://127.0.0.1:5173';
const browserPath =
  process.env.CHROME_PATH ||
  '/home/ubuntu/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell';

const browser = await chromium.launch({
  executablePath: browserPath,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 1,
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
});
await ctx.addInitScript(() => {
  const orig = window.matchMedia.bind(window);
  window.matchMedia = (q) => {
    if (/(pointer:\s*fine)|(hover:\s*hover)/i.test(q)) {
      return {
        matches: false,
        media: q,
        onchange: null,
        addListener() {},
        removeListener() {},
        addEventListener() {},
        removeEventListener() {},
        dispatchEvent() {
          return false;
        },
      };
    }
    return orig(q);
  };
  Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 5 });
});

const page = await ctx.newPage();
await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 30000 });
await page.fill('#login-email', 'learner@example.com');
await page.fill('#login-password', 'learn123');
await page.click('button[type="submit"]');
await page.waitForFunction(() => (localStorage.getItem('km_token') || '').length > 20, { timeout: 20000 });
await page.goto(BASE + '/exam', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(400);
await page.getByRole('button', { name: 'Начать экзамен' }).click();
await page.waitForSelector('text=Практика требует физической клавиатуры', { timeout: 15000 });
await page.waitForTimeout(200);
await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
await browser.close();
console.log('wrote', dest, fs.statSync(dest).size);
