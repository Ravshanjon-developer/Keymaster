/**
 * Capture unique simulator overlays + admin add-lesson form from the live app.
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

async function login(page, email, password) {
  await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 30000 });
  await page.fill('#login-email', email);
  await page.fill('#login-password', password);
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => (localStorage.getItem('km_token') || '').length > 20, { timeout: 20000 });
}

async function openDesktop(page) {
  await login(page, 'learner@example.com', 'learn123');
  await page.goto(BASE + '/simulator?mode=desktop', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.getByText('Этот компьютер', { exact: true }).waitFor({ timeout: 20000 });
  const ok = page.getByRole('button', { name: 'Понятно' });
  if (await ok.isVisible().catch(() => false)) await ok.click();
  await page.waitForTimeout(300);
}

const browser = await chromium.launch({
  executablePath: browserPath,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

const only = new Set(
  (process.env.KM_CAPTURE || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
);

const results = [];
async function run(name, viewport, fn) {
  if (only.size && !only.has(name)) return;
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

await run('desktop-context-menu', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-simulator-desktop-menu.jpg');
  await openDesktop(page);
  const root = page.locator('.bolt-desktop-root');
  await root.waitFor({ timeout: 10000 });
  const box = await root.boundingBox();
  await page.mouse.click(box.x + box.width * 0.42, box.y + box.height * 0.38, { button: 'right' });
  await page.getByText('Открыть проводник', { exact: true }).waitFor({ timeout: 8000 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  const snippet = await page.getByText('Открыть проводник', { exact: true }).innerText();
  return { file: 'desktop-learner-simulator-desktop-menu.jpg', w, h, snippet };
});

await run('desktop-explorer', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-simulator-desktop-explorer.jpg');
  await openDesktop(page);
  await page.getByText('Этот компьютер', { exact: true }).dblclick();
  await page.getByText('Проводник', { exact: true }).waitFor({ timeout: 10000 });
  await page.getByText('/Рабочий стол', { exact: true }).waitFor({ timeout: 8000 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-simulator-desktop-explorer.jpg', w, h };
});

await run('desktop-recycle-bin', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-simulator-desktop-trash.jpg');
  await openDesktop(page);
  await page.getByText('Корзина', { exact: true }).first().dblclick();
  await page.getByText('Эта папка пуста', { exact: true }).waitFor({ timeout: 10000 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-simulator-desktop-trash.jpg', w, h };
});

await run('code-lab-palette', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-simulator-code-palette.jpg');
  await login(page, 'learner@example.com', 'learn123');
  await page.goto(BASE + '/simulator', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.getByText('Готовы к практике?', { exact: true }).waitFor({ timeout: 20000 });
  await page.keyboard.press('Control+Shift+KeyP');
  await page.getByPlaceholder('Type a command...').waitFor({ timeout: 8000 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  const snippet = await page.getByPlaceholder('Type a command...').getAttribute('placeholder');
  return { file: 'desktop-learner-simulator-code-palette.jpg', w, h, snippet };
});

await run('admin-add-lesson', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-admin-add-lesson.jpg');
  await login(page, 'admin@example.com', 'KeyMasterAdmin1!');
  await page.goto(BASE + '/admin', { waitUntil: 'networkidle', timeout: 30000 });
  await page.getByRole('button', { name: 'Курсы' }).click();
  await page.getByRole('button', { name: 'Открыть' }).first().click();
  await page.getByText('Назад к курсам').waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: 'Урок' }).first().click();
  await page.getByPlaceholder('Через + , например Control+Shift+P').waitFor({ timeout: 8000 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72, fullPage: true });
  const main = await page.locator('#main-content').innerText();
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-admin-add-lesson.jpg', w, h, snippet: main.slice(0, 1400) };
});

await run('desktop-start-menu', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-simulator-desktop-start.jpg');
  await openDesktop(page);
  await page.getByTitle('Пуск').click();
  await page.getByText('Закреплено', { exact: true }).waitFor({ timeout: 8000 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-simulator-desktop-start.jpg', w, h };
});

await run('desktop-editor', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-simulator-desktop-editor.jpg');
  await openDesktop(page);
  await page.getByText('Welcome.txt', { exact: true }).dblclick();
  await page.getByText('184 симв. · 5 строк', { exact: true }).waitFor({ timeout: 8000 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-simulator-desktop-editor.jpg', w, h };
});

await run('code-lab-quickopen', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-simulator-code-quickopen.jpg');
  await login(page, 'learner@example.com', 'learn123');
  await page.goto(BASE + '/simulator', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.getByText('Готовы к практике?', { exact: true }).waitFor({ timeout: 20000 });
  await page.keyboard.press('Control+KeyP');
  await page.getByPlaceholder('Search files by name...').waitFor({ timeout: 8000 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-simulator-code-quickopen.jpg', w, h };
});

await run('code-lab-terminal', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-simulator-code-terminal.jpg');
  await login(page, 'learner@example.com', 'learn123');
  await page.goto(BASE + '/simulator', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.getByText('Готовы к практике?', { exact: true }).waitFor({ timeout: 20000 });
  await page.keyboard.press('Control+Backquote');
  await page.getByText('python index.py · node app.js · run page.html · help', { exact: true }).waitFor({ timeout: 8000 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-simulator-code-terminal.jpg', w, h };
});

await run('desktop-keyboard', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-simulator-desktop-keyboard.jpg');
  await openDesktop(page);
  await page.getByTitle('Клавиатура').click();
  await page.locator('button').filter({ hasText: 'Клавиатура' }).click();
  await page.getByText('F12', { exact: true }).waitFor({ timeout: 8000 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-simulator-desktop-keyboard.jpg', w, h };
});

await run('desktop-properties', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-simulator-desktop-properties.jpg');
  await openDesktop(page);
  await page.getByText('Этот компьютер', { exact: true }).dblclick();
  await page.getByText('/Рабочий стол', { exact: true }).waitFor({ timeout: 10000 });
  await page.getByText('Welcome.txt', { exact: true }).last().click({ button: 'right' });
  await page.getByText('Свойства', { exact: true }).click();
  await page.getByText('184 байт', { exact: true }).waitFor({ timeout: 8000 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-simulator-desktop-properties.jpg', w, h };
});

await run('desktop-filemenu', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-simulator-desktop-filemenu.jpg');
  await openDesktop(page);
  await page.getByText('Welcome.txt', { exact: true }).click({ button: 'right' });
  await page.getByText('Открыть с помощью Code', { exact: true }).waitFor({ timeout: 8000 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-simulator-desktop-filemenu.jpg', w, h };
});

async function openCodeLab(page) {
  await login(page, 'learner@example.com', 'learn123');
  await page.goto(BASE + '/simulator', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.getByText('Готовы к практике?', { exact: true }).waitFor({ timeout: 20000 });
}

await run('code-lab-find', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-simulator-code-find.jpg');
  await openCodeLab(page);
  await page.getByText('README.md', { exact: true }).click();
  await page.getByText('# Keymaster Project', { exact: true }).waitFor({ timeout: 8000 });
  await page.keyboard.press('Control+KeyF');
  await page.getByPlaceholder('Find').waitFor({ timeout: 8000 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-simulator-code-find.jpg', w, h };
});

await run('code-lab-search', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-simulator-code-search.jpg');
  await openCodeLab(page);
  await page.getByTitle('Search', { exact: true }).click();
  await page.getByPlaceholder('Search across files').waitFor({ timeout: 8000 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-simulator-code-search.jpg', w, h };
});

await run('code-lab-scm', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-simulator-code-scm.jpg');
  await openCodeLab(page);
  await page.getByTitle('Source Control', { exact: true }).click();
  await page.getByText('Git не подключён', { exact: true }).waitFor({ timeout: 8000 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-simulator-code-scm.jpg', w, h };
});

await run('code-lab-run', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-simulator-code-run.jpg');
  await openCodeLab(page);
  await page.getByTitle('Run and Debug', { exact: true }).click();
  await page.getByText('Run (F5)', { exact: true }).waitFor({ timeout: 8000 });
  await page.getByText('Нет открытого файла. Откройте файл из Explorer.', { exact: true }).waitFor({ timeout: 8000 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-simulator-code-run.jpg', w, h };
});

await run('code-lab-extensions', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-simulator-code-extensions.jpg');
  await openCodeLab(page);
  await page.getByTitle('Extensions', { exact: true }).click();
  await page.getByText('Магазин расширений VS Code здесь не подключён. Ниже — настройки и импорт проекта с вашего компьютера.', { exact: true }).waitFor({ timeout: 8000 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-simulator-code-extensions.jpg', w, h };
});

await run('code-lab-filemenu', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-simulator-code-filemenu.jpg');
  await openCodeLab(page);
  await page.getByRole('button', { name: 'File', exact: true }).click();
  await page.getByText('Open Folder from Computer…', { exact: true }).waitFor({ timeout: 8000 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-simulator-code-filemenu.jpg', w, h };
});

await run('code-lab-task', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-simulator-code-task.jpg');
  await openCodeLab(page);
  await page.getByRole('button', { name: 'Начать первую задачу' }).click();
  await page.getByText('Создать новый файл', { exact: true }).waitFor({ timeout: 8000 });
  await page.getByText('Подсказка (0/3)', { exact: true }).waitFor({ timeout: 8000 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-simulator-code-task.jpg', w, h };
});

await run('code-lab-tasklist', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-simulator-code-tasklist.jpg');
  await openCodeLab(page);
  await page.getByRole('button', { name: 'Все задачи' }).click();
  await page.getByText('Создать папку', { exact: true }).waitFor({ timeout: 8000 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-simulator-code-tasklist.jpg', w, h };
});

await run('code-lab-preview', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-simulator-code-preview.jpg');
  await openCodeLab(page);
  await page.getByText('index.html', { exact: true }).click();
  await page.keyboard.press('F5');
  await page.getByText('Preview — index.html').waitFor({ timeout: 8000 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-simulator-code-preview.jpg', w, h };
});

await run('code-lab-keyboard', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-simulator-code-keyboard.jpg');
  await openCodeLab(page);
  await page.getByTitle('Toggle keyboard visualizer').first().click();
  await page.getByText('Keyboard Visualizer').waitFor({ timeout: 8000 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-simulator-code-keyboard.jpg', w, h };
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
