/**
 * Measure live KeyMaster unique pages (as-is) so Figma recreations stay faithful.
 * Does not change application code. Requires Vite at 127.0.0.1:5173.
 */
import { createRequire } from 'node:module';
const require = createRequire(new URL('../../frontend/package.json', import.meta.url));
const { chromium } = require('playwright-core');
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.KM_BASE || 'http://127.0.0.1:5173';
const browserPath =
  process.env.CHROME_PATH ||
  '/home/ubuntu/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell';

const LEARNER = { email: 'learner@example.com', password: 'learn123' };
const ADMIN = { email: 'admin@example.com', password: 'KeyMasterAdmin1!' };

function measureScript() {
  function box(el) {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return {
      w: Math.round(r.width),
      h: Math.round(r.height),
      x: Math.round(r.x),
      y: Math.round(r.y),
      radius: s.borderRadius,
      bg: s.backgroundColor,
      color: s.color,
      font: `${s.fontWeight} ${s.fontSize}/${s.lineHeight} ${s.fontFamily.split(',')[0].replace(/"/g, '')}`,
      padding: `${s.paddingTop} ${s.paddingRight} ${s.paddingBottom} ${s.paddingLeft}`,
    };
  }
  const nav = document.querySelector('header') || document.querySelector('.km-nav-bar');
  const footer = document.querySelector('footer');
  const bottom = document.querySelector('nav[aria-label], nav.fixed, nav[class*="fixed"]');
  const primary = document.querySelector('a.btn-primary, button.btn-primary');
  const secondary = document.querySelector('a.btn-secondary, button.btn-secondary');
  const hero = document.querySelector('.font-display');
  const input = document.querySelector('input');
  const card = document.querySelector('.km-card, .glass');
  const rail = document.querySelector('aside');
  const tokens = getComputedStyle(document.documentElement);
  const headings = [...document.querySelectorAll('h1, h2')].slice(0, 6).map((el) => el.textContent.trim());
  return {
    path: location.pathname + location.search,
    title: document.title,
    viewport: { w: window.innerWidth, h: window.innerHeight },
    tokens: {
      brand600: tokens.getPropertyValue('--color-brand-600').trim(),
      accent500: tokens.getPropertyValue('--color-accent-500').trim(),
      ink: tokens.getPropertyValue('--color-ink').trim(),
      paper: tokens.getPropertyValue('--color-paper').trim(),
      radiusButton: tokens.getPropertyValue('--radius-button').trim(),
      radiusCard: tokens.getPropertyValue('--radius-card').trim(),
      fontSans: tokens.getPropertyValue('--font-sans').trim().split(',')[0].replace(/"/g, ''),
      fontDisplay: tokens.getPropertyValue('--font-display').trim().split(',')[0].replace(/"/g, ''),
      bgPrimary: tokens.getPropertyValue('--bg-primary').trim(),
    },
    nav: box(nav),
    footer: box(footer),
    bottomNav: box(bottom),
    primaryBtn: box(primary),
    secondaryBtn: box(secondary),
    hero: box(hero),
    input: box(input),
    card: box(card),
    rail: box(rail),
    headings,
    hasBottomNav: Boolean(bottom && getComputedStyle(bottom).display !== 'none' && bottom.getBoundingClientRect().height > 0),
  };
}

const guestPages = [
  { name: 'home', url: '/', w: 1440, h: 900 },
  { name: 'login', url: '/login', w: 1440, h: 900 },
  { name: 'register', url: '/register', w: 1440, h: 900 },
  { name: 'verify-email', url: '/verify-email', w: 1440, h: 900 },
  { name: 'auth-callback', url: '/auth/callback', w: 1440, h: 900 },
  { name: 'courses', url: '/courses', w: 1440, h: 900 },
  { name: 'course-detail', url: '/courses/computer-basics', w: 1440, h: 900 },
  { name: 'leaderboard', url: '/leaderboard', w: 1440, h: 900 },
  { name: 'mobile-home', url: '/', w: 390, h: 844 },
  { name: 'mobile-login', url: '/login', w: 390, h: 844 },
  { name: 'mobile-courses', url: '/courses', w: 390, h: 844 },
];

const learnerPages = [
  { name: 'path', url: '/path', w: 1440, h: 900 },
  { name: 'dashboard', url: '/dashboard', w: 1440, h: 900 },
  { name: 'achievements', url: '/achievements', w: 1440, h: 900 },
  { name: 'stats', url: '/stats', w: 1440, h: 900 },
  { name: 'practice', url: '/practice', w: 1440, h: 900 },
  { name: 'typing', url: '/typing', w: 1440, h: 900 },
  { name: 'training', url: '/training', w: 1440, h: 900 },
  { name: 'speed', url: '/speed', w: 1440, h: 900 },
  { name: 'review', url: '/review', w: 1440, h: 900 },
  { name: 'quiz', url: '/quiz', w: 1440, h: 900 },
  { name: 'exam', url: '/exam', w: 1440, h: 900 },
  { name: 'simulator-code', url: '/simulator', w: 1440, h: 900 },
  { name: 'simulator-desktop', url: '/simulator?mode=desktop', w: 1440, h: 900 },
  { name: 'admin-forbidden', url: '/admin', w: 1440, h: 900 },
  { name: 'mobile-practice', url: '/practice', w: 390, h: 844 },
  { name: 'mobile-path', url: '/path', w: 390, h: 844 },
];

const adminPages = [
  { name: 'admin-overview', url: '/admin', w: 1440, h: 900 },
];

async function measureList(browser, pages, creds) {
  const report = [];
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const tab = await ctx.newPage();
  if (creds) {
    await tab.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 30000 });
    await tab.fill('#login-email', creds.email);
    await tab.fill('#login-password', creds.password);
    await tab.click('button[type="submit"]');
    await tab.waitForFunction(() => (localStorage.getItem('km_token') || '').length > 20, { timeout: 20000 });
  }
  for (const page of pages) {
    await tab.setViewportSize({ width: page.w, height: page.h });
    await tab.goto(BASE + page.url, { waitUntil: 'networkidle', timeout: 30000 });
    await tab.waitForTimeout(500);
    const metrics = await tab.evaluate(measureScript);
    report.push({ name: page.name, ...metrics });
  }
  await ctx.close();
  return report;
}

const browser = await chromium.launch({
  executablePath: browserPath,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

const report = [
  ...(await measureList(browser, guestPages, null)),
  ...(await measureList(browser, learnerPages, LEARNER)),
  ...(await measureList(browser, adminPages, ADMIN)),
];

await browser.close();
const out = path.join(here, 'live-metrics.json');
fs.writeFileSync(out, JSON.stringify(report, null, 2));
const summary = report.map((r) => ({
  name: r.name,
  path: r.path,
  navH: r.nav?.h,
  footerH: r.footer?.h,
  railW: r.rail?.w,
  btnH: r.primaryBtn?.h,
  headings: r.headings,
  fontSans: r.tokens?.fontSans,
  fontDisplay: r.tokens?.fontDisplay,
}));
console.log(JSON.stringify(summary, null, 2));
console.log('wrote', out, 'pages', report.length);
