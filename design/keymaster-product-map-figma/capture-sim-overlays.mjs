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

function playwrightKey(token) {
  const map = {
    Control: 'Control',
    Ctrl: 'Control',
    Shift: 'Shift',
    Alt: 'Alt',
    Meta: 'Meta',
    Win: 'Meta',
    Cmd: 'Meta',
    Home: 'Home',
    End: 'End',
    Enter: 'Enter',
    Tab: 'Tab',
    Escape: 'Escape',
    Esc: 'Escape',
    Backspace: 'Backspace',
    Delete: 'Delete',
    Space: 'Space',
    Slash: '/',
    Backquote: '`',
    ArrowUp: 'ArrowUp',
    ArrowDown: 'ArrowDown',
    ArrowLeft: 'ArrowLeft',
    ArrowRight: 'ArrowRight',
    PageUp: 'PageUp',
    PageDown: 'PageDown',
    Insert: 'Insert',
  };
  if (map[token]) return map[token];
  if (/^F\d{1,2}$/.test(token)) return token;
  if (/^Key[A-Z]$/.test(token)) return token.slice(-1).toLowerCase();
  if (/^Digit\d$/.test(token)) return token.slice(-1);
  if (token.length === 1) return token;
  return token;
}

async function pressChord(page, keys) {
  const modSet = new Set(['Control', 'Shift', 'Alt', 'Meta']);
  const normalized = keys.map((k) => {
    if (k === 'Ctrl') return 'Control';
    if (k === 'Win' || k === 'Cmd' || k === 'Command') return 'Meta';
    return k;
  });
  const held = normalized.filter((k) => modSet.has(k));
  const mains = normalized.filter((k) => !modSet.has(k));
  for (const m of held) await page.keyboard.down(playwrightKey(m));
  for (const main of mains) await page.keyboard.down(playwrightKey(main));
  for (const main of [...mains].reverse()) await page.keyboard.up(playwrightKey(main));
  for (const m of [...held].reverse()) await page.keyboard.up(playwrightKey(m));
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

await run('code-lab-viewmenu', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-simulator-code-viewmenu.jpg');
  await openCodeLab(page);
  await page.getByRole('button', { name: 'View', exact: true }).click();
  await page.getByText('Toggle Task Panel', { exact: true }).waitFor({ timeout: 8000 });
  await page.getByText('Toggle Keyboard Visualizer', { exact: true }).waitFor({ timeout: 8000 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-simulator-code-viewmenu.jpg', w, h };
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

await run('code-lab-taskrun', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-simulator-code-taskrun.jpg');
  await openCodeLab(page);
  await page.getByRole('button', { name: 'Начать первую задачу' }).click();
  await page.getByRole('button', { name: 'Следующая задача' }).click();
  await page.getByText('Создайте в корне проекта папку с именем «assets».', { exact: true }).waitFor({ timeout: 8000 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-simulator-code-taskrun.jpg', w, h };
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

await run('code-lab-manage', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-simulator-code-manage.jpg');
  await openCodeLab(page);
  await page.getByTitle('Manage').click();
  await page.getByText('Color Theme', { exact: true }).waitFor({ timeout: 8000 });
  await page.getByText('Keyboard Visualizer', { exact: true }).waitFor({ timeout: 8000 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-simulator-code-manage.jpg', w, h };
});

await run('code-lab-editmenu', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-simulator-code-editmenu.jpg');
  await openCodeLab(page);
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByText('Replace', { exact: true }).waitFor({ timeout: 8000 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-simulator-code-editmenu.jpg', w, h };
});

await run('code-lab-gomenu', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-simulator-code-gomenu.jpg');
  await openCodeLab(page);
  await page.getByRole('button', { name: 'Go', exact: true }).click();
  await page.getByText('Reopen Closed Tab', { exact: true }).waitFor({ timeout: 8000 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-simulator-code-gomenu.jpg', w, h };
});

await run('code-lab-runmenu', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-simulator-code-runmenu.jpg');
  await openCodeLab(page);
  await page.getByRole('button', { name: 'Run', exact: true }).click();
  await page.getByText('Start First Task', { exact: true }).waitFor({ timeout: 8000 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-simulator-code-runmenu.jpg', w, h };
});

await run('code-lab-termmenu', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-simulator-code-termmenu.jpg');
  await openCodeLab(page);
  await page.getByRole('button', { name: 'Terminal', exact: true }).click();
  await page.getByText('Clear Terminal', { exact: true }).waitFor({ timeout: 8000 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-simulator-code-termmenu.jpg', w, h };
});

await run('code-lab-helpmenu', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-simulator-code-helpmenu.jpg');
  await openCodeLab(page);
  await page.getByRole('button', { name: 'Help', exact: true }).click();
  await page.getByText('Show Hint', { exact: true }).waitFor({ timeout: 8000 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-simulator-code-helpmenu.jpg', w, h };
});

await run('code-lab-light', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-simulator-code-light.jpg');
  await openCodeLab(page);
  await page.getByTitle('Manage').click();
  await page.getByText('Color Theme', { exact: true }).click();
  await page.locator('.bolt-theme-light').waitFor({ timeout: 8000 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-simulator-code-light.jpg', w, h };
});

await run('desktop-light', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-simulator-desktop-light.jpg');
  await openDesktop(page);
  await page.getByTitle('Тема').click();
  await page.waitForFunction(() => {
    const root = document.querySelector('.bolt-desktop-root');
    return root && getComputedStyle(root).backgroundColor === 'rgb(232, 232, 232)';
  }, { timeout: 8000 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-simulator-desktop-light.jpg', w, h };
});

await run('code-lab-toast', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-simulator-code-toast.jpg');
  await openCodeLab(page);
  await page.getByText('README.md', { exact: true }).click();
  await page.getByText('# Keymaster Project', { exact: true }).waitFor({ timeout: 8000 });
  await page.keyboard.press('Control+KeyS');
  await page.getByText('File saved', { exact: true }).waitFor({ timeout: 8000 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-simulator-code-toast.jpg', w, h };
});

await run('desktop-toast', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-simulator-desktop-toast.jpg');
  await openDesktop(page);
  const root = page.locator('.bolt-desktop-root');
  await root.waitFor({ timeout: 10000 });
  const box = await root.boundingBox();
  await page.mouse.click(box.x + box.width * 0.42, box.y + box.height * 0.38, { button: 'right' });
  await page.getByText('Новая папка', { exact: true }).click();
  const rename = page.locator('.bolt-desktop-root input');
  await rename.waitFor({ timeout: 8000 });
  await rename.fill('Practice');
  await rename.press('Enter');
  await page.getByText(/Задача выполнена/).first().waitFor({ timeout: 15000 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  const snippet = await page.getByText(/Задача выполнена/).first().innerText();
  return { file: 'desktop-learner-simulator-desktop-toast.jpg', w, h, snippet };
});

await run('desktop-done', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-simulator-desktop-done.jpg');
  await login(page, 'learner@example.com', 'learn123');
  await page.evaluate(() => {
    localStorage.setItem(
      'km_desktop_tasks_v1',
      JSON.stringify({
        completed: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        xp: 160,
      }),
    );
  });
  await page.goto(BASE + '/simulator?mode=desktop', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.getByText('Этот компьютер', { exact: true }).waitFor({ timeout: 20000 });
  const ok = page.getByRole('button', { name: 'Понятно' });
  if (await ok.isVisible().catch(() => false)) await ok.click();
  await page.getByText('Все задачи выполнены!', { exact: true }).waitFor({ timeout: 12000 });
  await page.getByText('Вы заработали 160 XP. Отличная работа!', { exact: true }).waitFor({ timeout: 8000 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-simulator-desktop-done.jpg', w, h };
});

await run('code-lab-newfile', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-simulator-code-newfile.jpg');
  await openCodeLab(page);
  await page.getByTitle('New File', { exact: true }).click();
  await page.getByPlaceholder('filename.js').waitFor({ timeout: 8000 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-simulator-code-newfile.jpg', w, h };
});

await run('code-lab-hint', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-simulator-code-hint.jpg');
  await openCodeLab(page);
  await page.getByRole('button', { name: 'Начать первую задачу' }).click();
  await page.getByRole('button', { name: 'Следующая задача' }).click();
  await page.getByText('Создайте в корне проекта папку с именем «assets».', { exact: true }).waitFor({ timeout: 8000 });
  await page.getByRole('button', { name: /Подсказка/ }).click();
  await page
    .getByText('Подсказка 1: Папку нужно создать на верхнем уровне проекта.', { exact: true })
    .waitFor({ timeout: 8000 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-simulator-code-hint.jpg', w, h };
});

await run('desktop-fromlesson', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-simulator-desktop-fromlesson.jpg');
  await login(page, 'learner@example.com', 'learn123');
  await page.goto(
    BASE + '/simulator?mode=desktop&task=1&fromLesson=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    { waitUntil: 'domcontentloaded', timeout: 20000 },
  );
  await page.getByText('Этот компьютер', { exact: true }).waitFor({ timeout: 20000 });
  const ok = page.getByRole('button', { name: 'Понятно' });
  if (await ok.isVisible().catch(() => false)) await ok.click();
  await page.getByText('← К уроку', { exact: true }).waitFor({ timeout: 8000 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-simulator-desktop-fromlesson.jpg', w, h };
});

await run('desktop-hint', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-simulator-desktop-hint.jpg');
  await login(page, 'learner@example.com', 'learn123');
  await page.route('**/progress/lessons**', async (route) => {
    const res = await route.fetch();
    let json = [];
    try {
      json = await res.json();
    } catch {
      json = [];
    }
    const body = (Array.isArray(json) ? json : []).map((row) => {
      const key = Array.isArray(row.keys) ? row.keys[0] : '';
      if (typeof key === 'string' && key.startsWith('desktop:')) {
        return { ...row, completed: false };
      }
      return row;
    });
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  await page.evaluate(() => {
    localStorage.setItem('km_desktop_tasks_v1', JSON.stringify({ completed: [], xp: 0 }));
    localStorage.removeItem('km-desktop-vfs-v1');
    localStorage.setItem('km-desktop-firstrun-v1', '1');
  });
  await page.goto(BASE + '/simulator?mode=desktop', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.getByText('Этот компьютер', { exact: true }).waitFor({ timeout: 20000 });
  const ok = page.getByRole('button', { name: 'Понятно' });
  if (await ok.isVisible().catch(() => false)) await ok.click();
  await page.getByText('Создайте папку «Practice»', { exact: true }).first().waitFor({ timeout: 8000 });
  await page.getByRole('button', { name: 'Подсказка', exact: true }).click();
  await page.getByText('Скрыть подсказку', { exact: true }).waitFor({ timeout: 8000 });
  await page
    .getByText(
      'Правый клик по пустому месту на обоях (не по панели браузера). Альтернатива: «Этот компьютер» → правый клик в пустой области → «Новая папка». Горячие клавиши: Ctrl+Shift+N.',
      { exact: true },
    )
    .waitFor({ timeout: 8000 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-simulator-desktop-hint.jpg', w, h };
});

await run('speed-run', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-speed-run.jpg');
  await login(page, 'learner@example.com', 'learn123');
  await page.goto(BASE + '/speed', { waitUntil: 'networkidle', timeout: 30000 });
  await page.getByRole('button', { name: 'Старт 60 сек' }).click();
  await page.getByText('🔥 x0', { exact: true }).waitFor({ timeout: 8000 });
  await page.getByText('Нажмите сочетание на клавиатуре', { exact: true }).waitFor({ timeout: 8000 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-speed-run.jpg', w, h };
});

async function openTyping(page) {
  await login(page, 'learner@example.com', 'learn123');
  await page.goto(BASE + '/typing', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.getByText('Тренажёр печати', { exact: true }).waitFor({ timeout: 15000 });
  await page.locator('textarea[aria-label="Нажмите сюда и печатайте"]').waitFor({ timeout: 8000 });
}

await run('typing-busy', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-typing-busy.jpg');
  await openTyping(page);
  const input = page.locator('textarea[aria-label="Нажмите сюда и печатайте"]');
  await input.click();
  await page.keyboard.type('ф');
  await page.getByRole('heading', { name: 'Практика', exact: true }).waitFor({ timeout: 8000 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  const heading = await page.getByRole('heading', { level: 1 }).innerText();
  return { file: 'desktop-learner-typing-busy.jpg', w, h, snippet: heading };
});

await run('typing-paused', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-typing-paused.jpg');
  await openTyping(page);
  const input = page.locator('textarea[aria-label="Нажмите сюда и печатайте"]');
  await input.click();
  await page.keyboard.type('ф');
  await page.getByRole('heading', { name: 'Практика', exact: true }).waitFor({ timeout: 8000 });
  await page.keyboard.press('Escape');
  await page.getByText('Пауза', { exact: true }).waitFor({ timeout: 8000 });
  await page.getByText('Esc — продолжить', { exact: true }).waitFor({ timeout: 8000 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  return { file: 'desktop-learner-typing-paused.jpg', w, h };
});

await run('typing-result', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-typing-result.jpg');
  await openTyping(page);
  const input = page.locator('textarea[aria-label="Нажмите сюда и печатайте"]');
  await input.click();
  const typed = await input.evaluate((ta) => {
    const el = ta.parentElement?.querySelector('.relative.z-0');
    if (!el) return '';
    return [...el.querySelectorAll('span')]
      .map((s) => {
        const t = s.textContent || '';
        if (t === '\u00A0') return ' ';
        if (t === '↵') return '\n';
        if (t === '⇥') return '\t';
        return t;
      })
      .join('');
  });
  await input.evaluate((ta, text) => {
    ta.focus();
    for (const ch of text) {
      ta.value = ch;
      ta.dispatchEvent(new InputEvent('input', { bubbles: true }));
    }
  }, typed);
  await page.getByText('Подход завершён', { exact: true }).waitFor({ timeout: 20000 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  const snippet = await page.locator('main').innerText();
  return { file: 'desktop-learner-typing-result.jpg', w, h, snippet: String(snippet).slice(0, 900), typedLen: typed.length };
});

await run('desktop-newfolder', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-simulator-desktop-newfolder.jpg');
  await login(page, 'learner@example.com', 'learn123');
  await page.route('**/progress/lessons**', async (route) => {
    const res = await route.fetch();
    let json = [];
    try {
      json = await res.json();
    } catch {
      json = [];
    }
    const body = (Array.isArray(json) ? json : []).map((row) => {
      const key = Array.isArray(row.keys) ? row.keys[0] : '';
      if (typeof key === 'string' && key.startsWith('desktop:')) {
        return { ...row, completed: false };
      }
      return row;
    });
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  await page.evaluate(() => {
    localStorage.setItem('km_desktop_tasks_v1', JSON.stringify({ completed: [], xp: 0 }));
    localStorage.removeItem('km-desktop-vfs-v1');
    localStorage.setItem('km-desktop-firstrun-v1', '1');
  });
  await page.goto(BASE + '/simulator?mode=desktop', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.getByText('Этот компьютер', { exact: true }).waitFor({ timeout: 20000 });
  const ok = page.getByRole('button', { name: 'Понятно' });
  if (await ok.isVisible().catch(() => false)) await ok.click();
  const root = page.locator('.bolt-desktop-root');
  await root.waitFor({ timeout: 10000 });
  const box = await root.boundingBox();
  await page.mouse.click(box.x + box.width * 0.42, box.y + box.height * 0.38, { button: 'right' });
  await page.getByText('Новая папка', { exact: true }).click();
  const rename = page.locator('.bolt-desktop-root input');
  await rename.waitFor({ timeout: 8000 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  const value = await rename.inputValue();
  return { file: 'desktop-learner-simulator-desktop-newfolder.jpg', w, h, snippet: value };
});

await run('training-explain', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-training-explain.jpg');
  await login(page, 'learner@example.com', 'learn123');
  await page.goto(BASE + '/training', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.getByRole('button', { name: 'Объяснение' }).waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: 'Объяснение' }).click();
  await page.getByText('К упражнению', { exact: true }).waitFor({ timeout: 8000 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  const snippet = await page.locator('main').innerText();
  return { file: 'desktop-learner-training-explain.jpg', w, h, snippet: String(snippet).slice(0, 900) };
});

await run('training-correct', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-training-correct.jpg');
  let lessons = [];
  await page.route('**/training/random**', async (route) => {
    const res = await route.fetch();
    try {
      lessons = await res.json();
    } catch {
      lessons = [];
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(lessons),
    });
  });
  await login(page, 'learner@example.com', 'learn123');
  await page.goto(BASE + '/training', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.getByRole('button', { name: 'Объяснение' }).waitFor({ timeout: 15000 });
  const trainer = page.locator('[role="application"]');
  await trainer.focus();
  const keys = Array.isArray(lessons?.[0]?.keys) ? lessons[0].keys : [];
  if (!keys.length) throw new Error('no random lesson keys');
  await pressChord(page, keys);
  const nextBtn = page.getByRole('button', { name: 'Далее →' });
  await nextBtn.waitFor({ timeout: 8000 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  const snippet = await page.locator('main').innerText();
  return {
    file: 'desktop-learner-training-correct.jpg',
    w,
    h,
    keys,
    snippet: String(snippet).slice(0, 900),
  };
});

await run('exam-timeout', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-exam-timeout.jpg');
  await login(page, 'learner@example.com', 'learn123');
  await page.goto(BASE + '/exam', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.getByRole('button', { name: 'Начать экзамен' }).waitFor({ timeout: 20000 });
  await page.getByRole('button', { name: 'Начать экзамен' }).click();
  await page.getByRole('button', { name: 'Завершить' }).waitFor({ timeout: 20000 });
  await page.clock.install({ time: new Date() });
  await page.clock.fastForward(10 * 60 * 1000 + 1500);
  await page.getByRole('heading', { name: 'Время вышло' }).waitFor({ timeout: 8000 });
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  const snippet = await page.locator('main').innerText();
  return { file: 'desktop-learner-exam-timeout.jpg', w, h, snippet: String(snippet).slice(0, 900) };
});

await run('quiz-finished', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-quiz-finished.jpg');
  await login(page, 'learner@example.com', 'learn123');
  await page.goto(BASE + '/quiz', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.getByText('Основы hotkeys', { exact: true }).first().waitFor({ timeout: 15000 });
  for (let i = 0; i < 25; i++) {
    const options = page.locator('ul button');
    await options.first().waitFor({ timeout: 8000 });
    await options.first().click();
    const finish = page.getByRole('button', { name: 'Завершить' });
    const next = page.getByRole('button', { name: 'Дальше ›' });
    if (await finish.isVisible().catch(() => false)) {
      await finish.click();
      break;
    }
    await next.click();
  }
  await page.getByText('Основы hotkeys — готово', { exact: true }).waitFor({ timeout: 8000 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  const snippet = await page.locator('main').innerText();
  return { file: 'desktop-learner-quiz-finished.jpg', w, h, snippet: String(snippet).slice(0, 900) };
});

await run('training-hint', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-training-hint.jpg');
  await login(page, 'learner@example.com', 'learn123');
  await page.goto(BASE + '/training', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.getByRole('button', { name: 'Подсказка' }).waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: 'Подсказка' }).click();
  await page.locator('p.mt-4.text-center').filter({ hasText: 'Начните с Ctrl' }).waitFor({ timeout: 8000 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  const snippet = await page.locator('main').innerText();
  return { file: 'desktop-learner-training-hint.jpg', w, h, snippet: String(snippet).slice(0, 900) };
});

await run('desktop-trash-full', desk, async (page) => {
  const dest = path.join(shotsDir, 'desktop-learner-simulator-desktop-trash-full.jpg');
  await login(page, 'learner@example.com', 'learn123');
  await page.route('**/progress/lessons**', async (route) => {
    const res = await route.fetch();
    let json = [];
    try {
      json = await res.json();
    } catch {
      json = [];
    }
    const body = (Array.isArray(json) ? json : []).map((row) => {
      const key = Array.isArray(row.keys) ? row.keys[0] : '';
      if (typeof key === 'string' && key.startsWith('desktop:')) {
        return { ...row, completed: false };
      }
      return row;
    });
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  await page.evaluate(() => {
    localStorage.setItem('km_desktop_tasks_v1', JSON.stringify({ completed: [], xp: 0 }));
    localStorage.removeItem('km-desktop-vfs-v1');
    localStorage.setItem('km-desktop-firstrun-v1', '1');
  });
  await page.goto(BASE + '/simulator?mode=desktop', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.getByText('Этот компьютер', { exact: true }).waitFor({ timeout: 20000 });
  const ok = page.getByRole('button', { name: 'Понятно' });
  if (await ok.isVisible().catch(() => false)) await ok.click();
  await page.getByText('Welcome.txt', { exact: true }).click({ button: 'right' });
  await page.getByText('Удалить', { exact: true }).click();
  await page.getByText('Корзина', { exact: true }).first().dblclick();
  await page.getByText('Welcome.txt', { exact: true }).waitFor({ timeout: 8000 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: dest, type: 'jpeg', quality: 72 });
  const { w, h } = jpegSize(fs.readFileSync(dest));
  const snippet = await page.locator('.bolt-desktop-root').innerText();
  return { file: 'desktop-learner-simulator-desktop-trash-full.jpg', w, h, snippet: String(snippet).slice(0, 900) };
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
