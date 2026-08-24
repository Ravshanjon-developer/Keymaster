const PAGE_NAMES = [
  '01 — Product Map',
  '02 — User Flows',
  '03 — Existing Screens',
  '04 — Design System',
  '05 — Components',
  '06 — Improved Screens',
  '07 — Mobile Screens',
];

const INK = { r: 0.058824, g: 0.090196, b: 0.164706 };
const PAPER = { r: 0.913725, g: 0.929412, b: 0.952941 };
const WHITE = { r: 1, g: 1, b: 1 };
const BRAND = { r: 0.145098, g: 0.388235, b: 0.921569 };
const BRAND500 = { r: 0.231373, g: 0.509804, b: 0.964706 };
const MUTED = { r: 0.392157, g: 0.454902, b: 0.545098 };
const SUCCESS = { r: 0.086275, g: 0.639216, b: 0.290196 };
const SIGNAL = { r: 0.882353, g: 0.113725, b: 0.282353 };
const ACCENT = { r: 0.023529, g: 0.713725, b: 0.831373 };
const BRAND50 = { r: 0.937255, g: 0.964706, b: 1 };
const BRAND800 = { r: 0.117647, g: 0.25098, b: 0.686275 };
const TRANSPARENT = { type: 'SOLID', color: WHITE, opacity: 0 };
const RAIL_BG = { r: 0.078431, g: 0.094118, b: 0.12549 };
const SHELL_BG = { r: 0.062745, g: 0.07451, b: 0.101961 };
const RAIL_ACTIVE_BG = { r: 0.117647, g: 0.14902, b: 0.211765 };
const RAIL_ACTIVE_TEXT = { r: 0.678431, g: 0.776471, b: 1 };
const RAIL_IDLE_TEXT = { r: 0.658824, g: 0.690196, b: 0.764706 };
const RAIL_TICK = { r: 0.537255, g: 0.807843, b: 1 };
const RAIL_MUTED = { r: 0.435294, g: 0.470588, b: 0.54902 };
const DARK_BG = { r: 0.007843, g: 0.023529, b: 0.090196 };
const DARK_SURFACE = { r: 0.027451, g: 0.05098, b: 0.101961 };
const DARK_ELEVATED = { r: 0.058824, g: 0.090196, b: 0.164706 };
const DARK_CARD = { r: 0.07451, g: 0.109804, b: 0.192157 };
const DARK_TEXT = { r: 0.972549, g: 0.980392, b: 0.988235 };
const DARK_SECONDARY = { r: 0.886275, g: 0.909804, b: 0.941176 };
const DARK_MUTED = { r: 0.721569, g: 0.760784, b: 0.831373 };

let outfit = (style) => ({ family: 'Inter', style: style === 'SemiBold' ? 'Semi Bold' : style });
let fraunces = (style) => outfit(style);

const screenIndex = {};
const groupCursors = {};
const imageByFile = {};

function hexToRgba(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16) / 255,
    g: parseInt(h.slice(2, 4), 16) / 255,
    b: parseInt(h.slice(4, 6), 16) / 255,
    a: 1,
  };
}

function solid(color, opacity) {
  const p = { type: 'SOLID', color };
  if (opacity != null) p.opacity = opacity;
  return p;
}

function pageByName(name) {
  return figma.root.children.find((p) => p.type === 'PAGE' && p.name === name);
}

function findAll(node, pred) {
  const out = [];
  function walk(n) {
    if (pred(n)) out.push(n);
    for (const c of n.children || []) walk(c);
  }
  walk(node);
  return out;
}

function inst(setName, variantName) {
  const page = pageByName('05 — Components');
  if (!page) return null;
  const set = page.findOne((n) => n.type === 'COMPONENT_SET' && n.name === setName);
  if (!set || !set.children) return null;
  const variant = set.children.find((c) => c.name === variantName) || set.children[0];
  if (!variant || typeof variant.createInstance !== 'function') return null;
  return variant.createInstance();
}

async function loadType() {
  const fonts = await figma.listAvailableFontsAsync();
  const has = (family, style) => fonts.some((f) => f.fontName.family === family && f.fontName.style === style);
  outfit = (style) => (has('Outfit', style) ? { family: 'Outfit', style } : { family: 'Inter', style: style === 'SemiBold' ? 'Semi Bold' : style });
  fraunces = (style) => (has('Fraunces', style) ? { family: 'Fraunces', style } : outfit(style));
  const toLoad = [
    outfit('Regular'),
    outfit('Medium'),
    outfit('SemiBold'),
    outfit('Bold'),
    fraunces('Medium'),
    fraunces('SemiBold'),
    fraunces('Bold'),
  ];
  for (const fn of toLoad) {
    try {
      await figma.loadFontAsync(fn);
    } catch (e) {
      /* missing */
    }
  }
}

function txt(chars, font, size, color, width) {
  const t = figma.createText();
  t.fontName = font;
  t.fontSize = size;
  t.fills = [solid(color)];
  t.characters = String(chars);
  if (width) {
    t.resize(width, t.height);
    t.textAutoResize = 'HEIGHT';
  }
  return t;
}

function card(name, w, children) {
  const f = figma.createAutoLayout('VERTICAL');
  f.name = name;
  f.paddingTop = f.paddingBottom = 20;
  f.paddingLeft = f.paddingRight = 20;
  f.itemSpacing = 10;
  f.cornerRadius = 16;
  f.fills = [solid(WHITE)];
  f.strokes = [solid(INK, 0.1)];
  f.strokeWeight = 1;
  f.resize(w, 100);
  f.layoutSizingHorizontal = 'FIXED';
  f.layoutSizingVertical = 'HUG';
  for (const c of children) f.appendChild(c);
  return f;
}

async function ensurePages() {
  const existing = figma.root.children.filter((n) => n.type === 'PAGE');
  existing[0].name = PAGE_NAMES[0];
  await figma.setCurrentPageAsync(existing[0]);
  for (const name of PAGE_NAMES.slice(1)) {
    if (!figma.root.children.find((p) => p.type === 'PAGE' && p.name === name)) {
      const page = figma.createPage();
      page.name = name;
    }
  }
}

async function createPrimitives() {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  let coll = collections.find((c) => c.name === 'Color/Primitives');
  if (!coll) coll = figma.variables.createVariableCollection('Color/Primitives');
  coll.renameMode(coll.modes[0].modeId, 'Value');
  const modeId = coll.modes[0].modeId;
  const tokens = {
    'brand/50': '#eff6ff',
    'brand/100': '#dbeafe',
    'brand/200': '#bfdbfe',
    'brand/300': '#93c5fd',
    'brand/400': '#60a5fa',
    'brand/500': '#3b82f6',
    'brand/600': '#2563eb',
    'brand/700': '#1d4ed8',
    'brand/800': '#1e40af',
    'brand/900': '#1e3a8a',
    'brand/950': '#172554',
    'accent/50': '#ecfeff',
    'accent/400': '#22d3ee',
    'accent/500': '#06b6d4',
    'accent/600': '#0891b2',
    'success/50': '#f0fdf4',
    'success/400': '#4ade80',
    'success/500': '#10b981',
    'success/600': '#16a34a',
    'success/700': '#15803d',
    ink: '#0f172a',
    'ink-soft': '#1e293b',
    paper: '#f9fafb',
    'paper-elevated': '#ffffff',
    signal: '#e11d48',
    warning: '#d97706',
    white: '#ffffff',
    black: '#020617',
    'slate/50': '#f8fafc',
    'slate/200': '#e2e8f0',
    'slate/400': '#94a3b8',
    'slate/500': '#64748b',
    'slate/700': '#334155',
    'muted-dark': '#b8c2d4',
    'bg-primary-light': '#e9edf3',
    'bg-surface-light': '#eef1f6',
    'bg-surface-dark': '#070d1a',
    'bg-card-dark': '#131c31',
    'bg-soft-dark': '#172554',
    'sim-canvas': '#1e1e1e',
    'practice-rail': '#141820',
    'practice-active-text': '#adc6ff',
    'practice-idle-text': '#a8b0c3',
    'practice-active-bar': '#89ceff',
    'practice-active-bg': '#1e2636',
  };
  const css = {
    'brand/600': 'var(--color-brand-600)',
    'brand/500': 'var(--color-brand-500)',
    'accent/500': 'var(--color-accent-500)',
    'success/600': 'var(--color-success-600)',
    ink: 'var(--color-ink)',
    paper: 'var(--color-paper)',
    signal: 'var(--color-signal)',
    warning: 'var(--color-warning)',
  };
  const locals = await figma.variables.getLocalVariablesAsync();
  const byName = Object.fromEntries(locals.map((v) => [v.name, v]));
  for (const [name, hex] of Object.entries(tokens)) {
    let v = byName[name];
    if (!v) v = figma.variables.createVariable(name, coll, 'COLOR');
    v.scopes = [];
    v.setValueForMode(modeId, hexToRgba(hex));
    if (css[name]) v.setVariableCodeSyntax('WEB', css[name]);
    byName[name] = v;
  }
  return { coll, byName };
}

function alias(id) {
  return { type: 'VARIABLE_ALIAS', id };
}

async function createSemantic(primVars) {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  let sem = collections.find((c) => c.name === 'Color/Semantic');
  if (!sem) sem = figma.variables.createVariableCollection('Color/Semantic');
  sem.renameMode(sem.modes[0].modeId, 'Light');
  let darkId = sem.modes.find((m) => m.name === 'Dark')?.modeId;
  if (!darkId) {
    try {
      darkId = sem.addMode('Dark');
    } catch (e) {
      darkId = sem.modes[0].modeId;
    }
  }
  const lightId = sem.modes.find((m) => m.name === 'Light')?.modeId || sem.modes[0].modeId;
  const allVars = await figma.variables.getLocalVariablesAsync();
  const byName = Object.fromEntries(allVars.map((v) => [v.name, v]));
  function ensure(coll, name, type, scopes, web) {
    let v = byName[name];
    if (!v) {
      v = figma.variables.createVariable(name, coll, type);
      byName[name] = v;
    }
    v.scopes = scopes;
    if (web) v.setVariableCodeSyntax('WEB', web);
    return v;
  }
  const bgScopes = ['FRAME_FILL', 'SHAPE_FILL'];
  const textScopes = ['TEXT_FILL'];
  const strokeScopes = ['STROKE_COLOR'];
  const bgPrimary = ensure(sem, 'bg/primary', 'COLOR', bgScopes, 'var(--bg-primary)');
  bgPrimary.setValueForMode(lightId, alias(primVars['bg-primary-light'].id));
  bgPrimary.setValueForMode(darkId, alias(primVars.black.id));
  const bgSurface = ensure(sem, 'bg/surface', 'COLOR', bgScopes, 'var(--bg-surface)');
  bgSurface.setValueForMode(lightId, alias(primVars['bg-surface-light'].id));
  bgSurface.setValueForMode(darkId, alias(primVars['bg-surface-dark'].id));
  const bgElevated = ensure(sem, 'bg/elevated', 'COLOR', bgScopes, 'var(--bg-elevated)');
  bgElevated.setValueForMode(lightId, alias(primVars.white.id));
  bgElevated.setValueForMode(darkId, alias(primVars.ink.id));
  const bgCard = ensure(sem, 'bg/card', 'COLOR', bgScopes, 'var(--bg-card)');
  bgCard.setValueForMode(lightId, alias(primVars.white.id));
  bgCard.setValueForMode(darkId, alias(primVars['bg-card-dark'].id));
  const textPrimary = ensure(sem, 'text/primary', 'COLOR', textScopes, 'var(--text-primary)');
  textPrimary.setValueForMode(lightId, alias(primVars.ink.id));
  textPrimary.setValueForMode(darkId, alias(primVars['slate/50'].id));
  const textSecondary = ensure(sem, 'text/secondary', 'COLOR', textScopes, 'var(--text-secondary)');
  textSecondary.setValueForMode(lightId, alias(primVars['slate/700'].id));
  textSecondary.setValueForMode(darkId, alias(primVars['slate/200'].id));
  const textMuted = ensure(sem, 'text/muted', 'COLOR', textScopes, 'var(--text-muted)');
  textMuted.setValueForMode(lightId, alias(primVars['slate/500'].id));
  textMuted.setValueForMode(darkId, alias(primVars['muted-dark'].id));
  const accent = ensure(sem, 'accent', 'COLOR', ['ALL_FILLS', 'STROKE_COLOR'], 'var(--color-accent)');
  accent.setValueForMode(lightId, alias(primVars['brand/600'].id));
  accent.setValueForMode(darkId, alias(primVars['brand/500'].id));
  const success = ensure(sem, 'success', 'COLOR', ['ALL_FILLS'], 'var(--color-success)');
  success.setValueForMode(lightId, alias(primVars['success/600'].id));
  success.setValueForMode(darkId, alias(primVars['success/400'].id));
  const danger = ensure(sem, 'danger', 'COLOR', ['ALL_FILLS', 'STROKE_COLOR'], 'var(--color-danger)');
  danger.setValueForMode(lightId, alias(primVars.signal.id));
  danger.setValueForMode(darkId, alias(primVars.signal.id));
  const border = ensure(sem, 'border/default', 'COLOR', strokeScopes, 'var(--border-default)');
  border.setValueForMode(lightId, { r: 0.058824, g: 0.090196, b: 0.164706, a: 0.1 });
  border.setValueForMode(darkId, { r: 1, g: 1, b: 1, a: 0.1 });

  let space = collections.find((c) => c.name === 'Spacing') || figma.variables.createVariableCollection('Spacing');
  space.renameMode(space.modes[0].modeId, 'Value');
  const sMode = space.modes[0].modeId;
  const spaces = { 'space/1': 4, 'space/2': 8, 'space/3': 12, 'space/4': 16, 'space/5': 20, 'space/6': 24, 'space/8': 32, 'space/10': 40, 'space/12': 48, 'space/16': 64 };
  for (const [name, val] of Object.entries(spaces)) {
    const v = ensure(space, name, 'FLOAT', ['GAP', 'WIDTH_HEIGHT'], `var(--${name.replace('/', '-')})`);
    v.setValueForMode(sMode, val);
  }
  let radius = collections.find((c) => c.name === 'Radius') || figma.variables.createVariableCollection('Radius');
  radius.renameMode(radius.modes[0].modeId, 'Value');
  const rMode = radius.modes[0].modeId;
  const radii = { 'radius/sm': 8, 'radius/md': 12, 'radius/lg': 16, 'radius/xl': 20, 'radius/2xl': 24, 'radius/button': 16, 'radius/card': 24, 'radius/input': 16, 'radius/full': 9999 };
  for (const [name, val] of Object.entries(radii)) {
    const cssName = name === 'radius/2xl' ? 'var(--radius-2xl)' : `var(--${name.replace('/', '-')})`;
    const v = ensure(radius, name, 'FLOAT', ['CORNER_RADIUS'], cssName);
    v.setValueForMode(rMode, val);
  }
}

async function upsertTextStyle(name, fontName, size, lineHeightPx, letterSpacing, desc) {
  const styles = await figma.getLocalTextStylesAsync();
  let style = styles.find((s) => s.name === name);
  if (!style) style = figma.createTextStyle();
  style.name = name;
  style.fontName = fontName;
  style.fontSize = size;
  style.lineHeight = { unit: 'PIXELS', value: lineHeightPx };
  style.letterSpacing = { unit: 'PIXELS', value: letterSpacing };
  style.description = desc;
  return style;
}

async function upsertEffect(name, effects) {
  const styles = await figma.getLocalEffectStylesAsync();
  let s = styles.find((e) => e.name === name);
  if (!s) s = figma.createEffectStyle();
  s.name = name;
  s.effects = effects;
  return s;
}

async function createTextAndEffects() {
  await upsertTextStyle('Display/Hero', fraunces('Bold'), 56, 60, -1.68, 'text-display / Fraunces');
  await upsertTextStyle('Display/PageTitle', outfit('SemiBold'), 34, 40, -0.85, 'text-page-title');
  await upsertTextStyle('Heading/H2', outfit('SemiBold'), 20, 25, -0.4, 'text-h2');
  await upsertTextStyle('Heading/H3', outfit('SemiBold'), 17, 22, -0.255, 'text-h3');
  await upsertTextStyle('Body/Default', outfit('Regular'), 15, 24, -0.165, 'body 15/24');
  await upsertTextStyle('Body/Large', outfit('Regular'), 17, 26, -0.187, 'text-body-lg');
  await upsertTextStyle('Button/Label', outfit('SemiBold'), 14, 17, -0.14, 'text-button');
  await upsertTextStyle('Caption/Default', outfit('Medium'), 12, 17, 0.24, 'text-caption');
  await upsertTextStyle('Caption/Overline', outfit('Bold'), 10, 14, 0.8, 'status-chip');
  await upsertEffect('Elevation/SM', [
    { type: 'DROP_SHADOW', color: { ...INK, a: 0.05 }, offset: { x: 0, y: 1 }, radius: 2, spread: 0, visible: true, blendMode: 'NORMAL' },
  ]);
  await upsertEffect('Elevation/MD', [
    { type: 'DROP_SHADOW', color: { ...INK, a: 0.11 }, offset: { x: 0, y: 4 }, radius: 18, spread: -4, visible: true, blendMode: 'NORMAL' },
  ]);
  await upsertEffect('Elevation/LG', [
    { type: 'DROP_SHADOW', color: { ...INK, a: 0.14 }, offset: { x: 0, y: 14 }, radius: 44, spread: -18, visible: true, blendMode: 'NORMAL' },
  ]);
  await upsertEffect('Elevation/Float', [
    { type: 'DROP_SHADOW', color: { ...BRAND, a: 0.22 }, offset: { x: 0, y: 20 }, radius: 50, spread: -24, visible: true, blendMode: 'NORMAL' },
  ]);
}

async function buildProductMap() {
  const page = pageByName('01 — Product Map');
  await figma.setCurrentPageAsync(page);
  if (page.findOne((n) => n.name === 'KM Product Map — as-is')) return;
  const root = figma.createAutoLayout('VERTICAL');
  root.name = 'KM Product Map — as-is';
  root.itemSpacing = 24;
  root.paddingTop = root.paddingBottom = 48;
  root.paddingLeft = root.paddingRight = 48;
  root.fills = [solid(PAPER)];
  root.resize(1920, 200);
  root.layoutSizingHorizontal = 'FIXED';
  root.layoutSizingVertical = 'HUG';
  root.x = 80;
  root.y = 80;
  root.appendChild(txt('KeyMaster — Product Map (current UI)', fraunces('Bold'), 40, INK, 1800));
  root.appendChild(txt('Stage 1: no redesign. Group identical layouts. Do not duplicate 20 courses or every lesson.', outfit('Regular'), 16, MUTED, 1800));

  const layouts = figma.createAutoLayout('HORIZONTAL');
  layouts.name = 'Layouts';
  layouts.itemSpacing = 16;
  const layoutData = [
    ['MarketingShell', 'Navbar + main + footer (sm+) + BottomNav (lg:hidden)\nHome, Courses, Course, Lesson, Path, Leaderboard, Achievements, Dashboard, Stats, Admin, Auth'],
    ['AuthCard', 'max-w-md GlassCard inside MarketingShell\nLogin, Register (+ OTP), Verify email'],
    ['PracticeShell', 'Dark rail #141820 240px + mobile chips\nPractice, Typing, Training, Speed, Review, Quiz, Exam'],
    ['ImmersiveSimulator', 'No chrome, h-dvh #1e1e1e\nCode Lab /simulator and Desktop ?mode=desktop'],
  ];
  for (const [title, body] of layoutData) {
    layouts.appendChild(card(title, 430, [txt(title, outfit('Bold'), 18, BRAND, 380), txt(body, outfit('Regular'), 13, INK, 380)]));
  }
  root.appendChild(layouts);

  const pagesRow = figma.createAutoLayout('HORIZONTAL');
  pagesRow.name = 'Unique pages';
  pagesRow.itemSpacing = 16;
  const cols = [
    ['Public', '/  /login  /register  /verify-email  /auth/callback\n/courses  /courses/:slug (×20, 1 layout)\n/lessons/:id (hotkey | task | study-only | desktop-task)\n/leaderboard'],
    ['Protected', '/path  /practice  /typing  /training  /speed\n/review  /quiz  /exam\n/simulator  /simulator?mode=desktop\n/achievements  /dashboard  /stats  /admin'],
    ['Mobile-only', 'BottomNav: Courses / Path / Practice / Leaderboard\nHidden on login/register\nPracticeKeyboardGate when no physical keyboard'],
  ];
  for (const [title, body] of cols) {
    pagesRow.appendChild(card(title, 590, [txt(title, outfit('Bold'), 18, BRAND, 540), txt(body, outfit('Regular'), 13, INK, 540)]));
  }
  root.appendChild(pagesRow);
  root.appendChild(
    txt(
      'Do not mock every course or lesson. One Course Detail + two Lesson kinds cover the catalog. Course card statuses: start / in_progress / completed / required.',
      outfit('SemiBold'),
      14,
      MUTED,
      1800,
    ),
  );
  page.appendChild(root);
  await buildLayoutChrome(root);
}

async function buildLayoutChrome(parent) {
  if (parent.findOne && parent.findOne((n) => n.name === 'Shared layouts — chrome')) return;
  const board = figma.createAutoLayout('HORIZONTAL');
  board.name = 'Shared layouts — chrome';
  board.itemSpacing = 32;
  board.fills = [solid(WHITE)];
  board.paddingTop = board.paddingBottom = 32;
  board.paddingLeft = board.paddingRight = 32;
  board.cornerRadius = 16;

  function shell(name, w, h, build) {
    const col = figma.createAutoLayout('VERTICAL');
    col.itemSpacing = 8;
    col.appendChild(txt(name, outfit('Bold'), 14, BRAND, w));
    const frame = figma.createFrame();
    frame.name = name;
    frame.resize(w, h);
    frame.fills = [solid(WHITE)];
    frame.strokes = [solid(INK, 0.1)];
    build(frame);
    col.appendChild(frame);
    board.appendChild(col);
  }

  shell('MarketingShell', 420, 280, (frame) => {
    const nav = figma.createRectangle();
    nav.resize(420, 40);
    nav.fills = [solid(WHITE)];
    nav.strokes = [solid(INK, 0.08)];
    nav.y = 0;
    frame.appendChild(nav);
    const main = figma.createRectangle();
    main.resize(420, 200);
    main.y = 40;
    main.fills = [solid(PAPER)];
    frame.appendChild(main);
    const footer = figma.createRectangle();
    footer.resize(420, 40);
    footer.y = 240;
    footer.fills = [solid({ r: 0.976, g: 0.98, b: 0.984 })];
    frame.appendChild(footer);
    const n = txt('Navbar  Главная · Курсы · Мой путь · Практика · Рейтинг', outfit('Regular'), 9, MUTED, 400);
    n.x = 10;
    n.y = 12;
    frame.appendChild(n);
    const f = txt('Footer sm+ · BottomNav lg:hidden (hidden on /login /register)', outfit('Regular'), 9, MUTED, 400);
    f.x = 10;
    f.y = 252;
    frame.appendChild(f);
  });

  shell('PracticeShell', 420, 280, (frame) => {
    const nav = figma.createRectangle();
    nav.resize(420, 40);
    nav.fills = [solid(WHITE)];
    frame.appendChild(nav);
    const rail = figma.createRectangle();
    rail.resize(90, 240);
    rail.x = 0;
    rail.y = 40;
    rail.fills = [solid({ r: 0.078, g: 0.094, b: 0.125 })];
    frame.appendChild(rail);
    const body = figma.createRectangle();
    body.resize(330, 240);
    body.x = 90;
    body.y = 40;
    body.fills = [solid(PAPER)];
    frame.appendChild(body);
    const r = txt('Rail 240px #141820\nactive #89ceff', outfit('Regular'), 9, { r: 0.678, g: 0.776, b: 1 }, 80);
    r.x = 6;
    r.y = 50;
    frame.appendChild(r);
    const b = txt('Outlet: hub / typing / training / speed / review / quiz / exam', outfit('Regular'), 9, MUTED, 300);
    b.x = 100;
    b.y = 140;
    frame.appendChild(b);
  });

  shell('AuthCard', 280, 280, (frame) => {
    frame.fills = [solid(PAPER)];
    const card = figma.createRectangle();
    card.resize(200, 180);
    card.x = 40;
    card.y = 50;
    card.cornerRadius = 24;
    card.fills = [solid(WHITE)];
    card.strokes = [solid(INK, 0.1)];
    frame.appendChild(card);
    const t = txt('max-w-md GlassCard\nLogin / Register / OTP\nVerify email', outfit('Regular'), 10, INK, 180);
    t.x = 50;
    t.y = 90;
    frame.appendChild(t);
  });

  shell('ImmersiveSimulator', 280, 280, (frame) => {
    frame.fills = [solid({ r: 0.118, g: 0.118, b: 0.118 })];
    const t = txt('No Navbar / Footer / BottomNav\nh-dvh #1e1e1e\nCode Lab or Desktop ?mode=desktop', outfit('Regular'), 11, WHITE, 240);
    t.x = 20;
    t.y = 110;
    frame.appendChild(t);
  });

  parent.appendChild(board);
}

async function buildFlows() {
  const page = pageByName('02 — User Flows');
  await figma.setCurrentPageAsync(page);
  if (page.findOne((n) => n.name === 'User flows — as-is')) return;
  const flows = [
    ['F1 Guest discover', 'Home → Courses → Course detail → Lesson (read) → Register gate'],
    ['F2 Sign up', 'Register → OTP / verify-email → Dashboard'],
    ['F3 Sign in', 'Login → Dashboard (or return `from`); email-not-verified → OTP'],
    ['F4 Learning path', 'Path → Course → Lesson → next lesson (unlock 60%)'],
    ['F5 First laptop', 'Computer basics course → Desktop sim task → lesson complete'],
    ['F6 Hotkey learn', 'Lesson KeyboardTrainer → success flash → auto next'],
    ['F7 Practice hub', 'Practice → typing / simulator / training / speed'],
    ['F8 Reinforce', 'Review cards · Quiz · Exam (setup → run → done)'],
    ['F9 Social', 'Leaderboard periods · Achievements locked/unlocked'],
    ['F10 Progress', 'Dashboard daily + XP + streak · Stats'],
    ['F11 Admin', 'CRUD courses / lessons / users / achievements · forbidden for learner'],
    ['F12 Theme + locale', 'Navbar light/dark · RU / TJ'],
  ];
  const root = figma.createAutoLayout('VERTICAL');
  root.name = 'User flows — as-is';
  root.itemSpacing = 12;
  root.paddingTop = root.paddingBottom = 48;
  root.paddingLeft = root.paddingRight = 48;
  root.fills = [solid(PAPER)];
  root.resize(1440, 200);
  root.layoutSizingHorizontal = 'FIXED';
  root.layoutSizingVertical = 'HUG';
  root.x = 80;
  root.y = 80;
  root.appendChild(txt('User flows (current product)', fraunces('Bold'), 36, INK, 1340));
  root.appendChild(txt('Documented from router + page behavior. Not a proposed redesign.', outfit('Regular'), 15, MUTED, 1340));
  for (const [title, body] of flows) {
    const row = figma.createAutoLayout('HORIZONTAL');
    row.name = title;
    row.itemSpacing = 16;
    row.paddingTop = row.paddingBottom = 16;
    row.paddingLeft = row.paddingRight = 20;
    row.cornerRadius = 12;
    row.fills = [solid(WHITE)];
    row.resize(1344, 10);
    row.layoutSizingHorizontal = 'FIXED';
    row.layoutSizingVertical = 'HUG';
    row.appendChild(txt(title, outfit('Bold'), 14, BRAND, 220));
    row.appendChild(txt(body, outfit('Regular'), 14, INK, 1040));
    root.appendChild(row);
  }
  page.appendChild(root);
}

async function buildDesignSystemBoard() {
  const page = pageByName('04 — Design System');
  await figma.setCurrentPageAsync(page);
  if (page.findOne((n) => n.name === 'Foundations — as-is tokens')) return;
  const root = figma.createAutoLayout('VERTICAL');
  root.name = 'Foundations — as-is tokens';
  root.itemSpacing = 20;
  root.paddingTop = root.paddingBottom = 48;
  root.paddingLeft = root.paddingRight = 48;
  root.fills = [solid(PAPER)];
  root.resize(1440, 100);
  root.layoutSizingHorizontal = 'FIXED';
  root.layoutSizingVertical = 'HUG';
  root.x = 80;
  root.y = 80;
  root.appendChild(txt('KeyMaster tokens (from code)', fraunces('Bold'), 32, INK));
  root.appendChild(txt('No redesign. Values from index.css + tokens.css. Bind Color/Semantic Light|Dark on screens.', outfit('Regular'), 14, MUTED));
  const swatches = [
    ['brand/600', '#2563EB', BRAND],
    ['brand/500', '#3B82F6', BRAND500],
    ['accent/500', '#06B6D4', ACCENT],
    ['success/600', '#16A34A', SUCCESS],
    ['ink', '#0F172A', INK],
    ['signal', '#E11D48', SIGNAL],
    ['paper', '#F9FAFB', { r: 0.976, g: 0.98, b: 0.984 }],
    ['bg/primary L', '#E9EDF3', PAPER],
  ];
  const row = figma.createAutoLayout('HORIZONTAL');
  row.itemSpacing = 12;
  for (const [name, hex, color] of swatches) {
    const cell = figma.createAutoLayout('VERTICAL');
    cell.itemSpacing = 8;
    cell.paddingTop = cell.paddingBottom = 12;
    cell.paddingLeft = cell.paddingRight = 12;
    cell.cornerRadius = 12;
    cell.fills = [solid(WHITE)];
    const chip = figma.createRectangle();
    chip.resize(120, 64);
    chip.cornerRadius = 8;
    chip.fills = [solid(color)];
    cell.appendChild(chip);
    cell.appendChild(txt(name, outfit('SemiBold'), 11, INK));
    cell.appendChild(txt(hex, outfit('Regular'), 11, MUTED));
    row.appendChild(cell);
  }
  root.appendChild(row);
  const typeRow = figma.createAutoLayout('VERTICAL');
  typeRow.itemSpacing = 8;
  typeRow.paddingTop = typeRow.paddingBottom = 20;
  typeRow.paddingLeft = typeRow.paddingRight = 20;
  typeRow.cornerRadius = 16;
  typeRow.fills = [solid(WHITE)];
  typeRow.appendChild(txt('Fraunces — display / wordmark', fraunces('Bold'), 28, INK));
  typeRow.appendChild(txt('Outfit SemiBold — page titles and buttons', outfit('SemiBold'), 20, INK));
  typeRow.appendChild(txt('Outfit Regular — body 15/24. Letter-spacing -0.011em.', outfit('Regular'), 15, MUTED));
  root.appendChild(typeRow);
  page.appendChild(root);
}

function makeBtn(name, fill, textColor, opacity, label, padX, padY, size) {
  const c = figma.createComponent();
  c.name = name;
  c.layoutMode = 'HORIZONTAL';
  c.primaryAxisAlignItems = 'CENTER';
  c.counterAxisAlignItems = 'CENTER';
  c.paddingLeft = padX;
  c.paddingRight = padX;
  c.paddingTop = padY;
  c.paddingBottom = padY;
  c.itemSpacing = 8;
  c.cornerRadius = 16;
  c.fills = fill ? [solid(fill)] : [TRANSPARENT];
  c.opacity = opacity;
  c.minHeight = size >= 16 ? 48 : size <= 12 ? 36 : 44;
  const t = figma.createText();
  t.fontName = outfit('SemiBold');
  t.fontSize = size;
  t.fills = [solid(textColor)];
  t.characters = label;
  c.appendChild(t);
  c.layoutSizingHorizontal = 'HUG';
  c.layoutSizingVertical = 'HUG';
  return c;
}

async function buildComponents() {
  const page = pageByName('05 — Components');
  await figma.setCurrentPageAsync(page);
  const hasButton = page.findOne((n) => n.type === 'COMPONENT_SET' && n.name === 'Button');
  if (hasButton) {
    await buildProductComponents(page);
    return;
  }

  const primary = [
    makeBtn('Variant=Primary, State=Default, Size=MD', BRAND, WHITE, 1, 'Продолжить', 20, 10, 14),
    makeBtn('Variant=Primary, State=Hover, Size=MD', BRAND500, WHITE, 1, 'Продолжить', 20, 10, 14),
    makeBtn('Variant=Primary, State=Active, Size=MD', BRAND500, WHITE, 1, 'Продолжить', 20, 10, 14),
    makeBtn('Variant=Primary, State=Disabled, Size=MD', BRAND, WHITE, 0.55, 'Продолжить', 20, 10, 14),
    makeBtn('Variant=Primary, State=Loading, Size=MD', BRAND, WHITE, 0.85, 'Продолжить', 20, 10, 14),
    makeBtn('Variant=Primary, State=Focus, Size=MD', BRAND, WHITE, 1, 'Продолжить', 20, 10, 14),
    makeBtn('Variant=Primary, State=Default, Size=SM', BRAND, WHITE, 1, 'Дальше', 12, 6, 12),
    makeBtn('Variant=Primary, State=Default, Size=LG', BRAND, WHITE, 1, 'Начать экзамен', 24, 12, 16),
  ];
  const buttonSet = figma.combineAsVariants(primary, page);
  buttonSet.name = 'Button';
  buttonSet.x = 80;
  buttonSet.y = 80;
  buttonSet.layoutMode = 'HORIZONTAL';
  buttonSet.itemSpacing = 16;
  buttonSet.paddingLeft = buttonSet.paddingRight = buttonSet.paddingTop = buttonSet.paddingBottom = 24;
  buttonSet.description = 'KeyMaster .btn-primary — min-h-11, radius-button 16, focus-visible ring --focus-ring';
  const focusBtn = buttonSet.children.find((n) => n.name.includes('State=Focus'));
  if (focusBtn) {
    focusBtn.effects = [
      { type: 'DROP_SHADOW', color: { r: 0.145, g: 0.388, b: 0.922, a: 0.35 }, offset: { x: 0, y: 0 }, radius: 0, spread: 4, visible: true, blendMode: 'NORMAL' },
    ];
  }

  const rest = [
    makeBtn('Variant=Secondary, State=Default, Size=MD', WHITE, INK, 1, 'Отмена', 20, 10, 14),
    makeBtn('Variant=Ghost, State=Default, Size=MD', null, { r: 0.2, g: 0.255, b: 0.333 }, 1, 'Пропустить', 20, 10, 14),
    makeBtn('Variant=Outline, State=Default, Size=MD', null, { r: 0.114, g: 0.306, b: 0.847 }, 1, 'Подробнее', 20, 10, 14),
  ];
  rest[0].strokes = [solid(INK, 0.12)];
  rest[0].strokeWeight = 1;
  rest[2].strokes = [solid(BRAND)];
  rest[2].strokeWeight = 1.5;
  const restSet = figma.combineAsVariants(rest, page);
  restSet.name = 'Button/Rest';
  restSet.x = 80;
  restSet.y = 280;
  restSet.layoutMode = 'HORIZONTAL';
  restSet.itemSpacing = 16;
  restSet.paddingLeft = restSet.paddingRight = restSet.paddingTop = restSet.paddingBottom = 24;
  restSet.description = '.btn-secondary / .btn-ghost / .btn-outline';

  function inputVariant(name, border, shadow) {
    const c = figma.createComponent();
    c.name = name;
    c.layoutMode = 'VERTICAL';
    c.itemSpacing = 6;
    c.resize(280, 10);
    c.layoutSizingHorizontal = 'FIXED';
    c.layoutSizingVertical = 'HUG';
    const field = figma.createAutoLayout('HORIZONTAL');
    field.paddingLeft = field.paddingRight = 14;
    field.paddingTop = field.paddingBottom = 10;
    field.cornerRadius = 16;
    field.fills = [solid(WHITE)];
    field.strokes = [solid(border)];
    field.strokeWeight = 1;
    field.primaryAxisAlignItems = 'CENTER';
    field.resize(280, 44);
    if (shadow) {
      field.effects = [{ type: 'DROP_SHADOW', color: shadow, offset: { x: 0, y: 0 }, radius: 0, spread: 4, visible: true, blendMode: 'NORMAL' }];
    }
    field.appendChild(txt('email@example.com', outfit('Regular'), 14, INK));
    c.appendChild(field);
    field.layoutSizingHorizontal = 'FILL';
    field.layoutSizingVertical = 'FIXED';
    return c;
  }
  const inputs = [
    inputVariant('State=Default', { r: 0.059, g: 0.09, b: 0.165 }),
    inputVariant('State=Focus', BRAND, { r: 0.145, g: 0.388, b: 0.922, a: 0.35 }),
    inputVariant('State=Success', SUCCESS, { r: 0.086, g: 0.639, b: 0.29, a: 0.25 }),
    inputVariant('State=Error', SIGNAL),
    inputVariant('State=Disabled', { r: 0.059, g: 0.09, b: 0.165 }),
  ];
  inputs[4].opacity = 0.6;
  const inputSet = figma.combineAsVariants(inputs, page);
  inputSet.name = 'Input';
  inputSet.x = 80;
  inputSet.y = 480;
  inputSet.layoutMode = 'HORIZONTAL';
  inputSet.itemSpacing = 16;
  inputSet.paddingLeft = inputSet.paddingRight = inputSet.paddingTop = inputSet.paddingBottom = 24;
  inputSet.description = '.input-field states from index.css';

  function badge(name, fill, color, stroke, text) {
    const c = figma.createComponent();
    c.name = name;
    c.layoutMode = 'HORIZONTAL';
    c.paddingLeft = c.paddingRight = 8;
    c.paddingTop = c.paddingBottom = 2;
    c.cornerRadius = 6;
    c.fills = [solid(fill)];
    c.strokes = [solid(stroke)];
    c.strokeWeight = 1;
    const t = txt(text, outfit('Bold'), 10, color);
    t.textCase = 'UPPER';
    c.appendChild(t);
    c.layoutSizingHorizontal = 'HUG';
    c.layoutSizingVertical = 'HUG';
    return c;
  }
  const badges = [
    badge('Tone=Brand', { r: 0.114, g: 0.306, b: 0.847 }, WHITE, { r: 0.114, g: 0.306, b: 0.847 }, 'В процессе'),
    badge('Tone=Success', { r: 0.941, g: 0.992, b: 0.957 }, { r: 0.082, g: 0.502, b: 0.239 }, SUCCESS, 'Готово'),
    badge('Tone=Neutral', WHITE, { r: 0.2, g: 0.255, b: 0.333 }, INK, 'Нейтрально'),
    badge('Tone=Warning', { r: 0.961, g: 0.769, b: 0.157 }, { r: 0.471, g: 0.247, b: 0.027 }, { r: 0.961, g: 0.62, b: 0.043 }, 'Внимание'),
    badge('Tone=Locked', WHITE, MUTED, INK, 'Закрыто'),
  ];
  badges[2].fills = [solid(INK, 0.06)];
  badges[4].fills = [solid(INK, 0.06)];
  const badgeSet = figma.combineAsVariants(badges, page);
  badgeSet.name = 'StatusBadge';
  badgeSet.x = 80;
  badgeSet.y = 700;
  badgeSet.layoutMode = 'HORIZONTAL';
  badgeSet.itemSpacing = 12;
  badgeSet.paddingLeft = badgeSet.paddingRight = badgeSet.paddingTop = badgeSet.paddingBottom = 24;

  function keycap(name, fill, border, text) {
    const c = figma.createComponent();
    c.name = name;
    c.layoutMode = 'HORIZONTAL';
    c.primaryAxisAlignItems = 'CENTER';
    c.counterAxisAlignItems = 'CENTER';
    c.minWidth = 40;
    c.minHeight = 40;
    c.paddingLeft = c.paddingRight = 12;
    c.cornerRadius = 12;
    c.fills = [solid(fill)];
    c.strokes = [solid(border)];
    c.strokeWeight = 1;
    c.strokeBottomWeight = 4;
    c.appendChild(txt(text, outfit('SemiBold'), 14, INK));
    return c;
  }
  const keySet = figma.combineAsVariants(
    [
      keycap('State=Default', WHITE, INK, 'Ctrl'),
      keycap('State=Active', BRAND50, BRAND, 'Ctrl'),
      keycap('State=Learned', BRAND50, BRAND, 'Ctrl'),
      keycap('State=Mystery', WHITE, INK, '?'),
    ],
    page,
  );
  keySet.name = 'KeyCap';
  keySet.x = 80;
  keySet.y = 860;
  keySet.layoutMode = 'HORIZONTAL';
  keySet.itemSpacing = 16;
  keySet.paddingLeft = keySet.paddingRight = keySet.paddingTop = keySet.paddingBottom = 24;

  function nav(name, fill, color, underline) {
    const c = figma.createComponent();
    c.name = name;
    c.layoutMode = 'VERTICAL';
    c.itemSpacing = 4;
    c.paddingLeft = c.paddingRight = 12;
    c.paddingTop = c.paddingBottom = 8;
    c.cornerRadius = 8;
    c.fills = fill ? [solid(fill)] : [TRANSPARENT];
    c.appendChild(txt('Практика', outfit('SemiBold'), 15, color));
    if (underline) {
      const bar = figma.createRectangle();
      bar.resize(28, 2);
      bar.cornerRadius = 99;
      bar.fills = [solid(BRAND)];
      c.appendChild(bar);
    }
    c.layoutSizingHorizontal = 'HUG';
    c.layoutSizingVertical = 'HUG';
    return c;
  }
  const navs = [
    nav('State=Default', null, INK, false),
    nav('State=Hover', INK, INK, false),
    nav('State=Active', BRAND50, { r: 0.118, g: 0.251, b: 0.686 }, true),
    nav('State=Focus', null, INK, false),
  ];
  navs[1].fills = [solid(INK, 0.06)];
  navs[3].effects = [
    { type: 'DROP_SHADOW', color: { r: 0.145, g: 0.388, b: 0.922, a: 0.35 }, offset: { x: 0, y: 0 }, radius: 0, spread: 4, visible: true, blendMode: 'NORMAL' },
  ];
  const navSet = figma.combineAsVariants(navs, page);
  navSet.name = 'NavLink';
  navSet.x = 80;
  navSet.y = 1040;
  navSet.layoutMode = 'HORIZONTAL';
  navSet.itemSpacing = 16;
  navSet.paddingLeft = navSet.paddingRight = navSet.paddingTop = navSet.paddingBottom = 24;

  function bar(name, pct, fill) {
    const c = figma.createComponent();
    c.name = name;
    c.layoutMode = 'NONE';
    c.resize(220, 8);
    c.cornerRadius = 99;
    c.fills = [solid(INK, 0.06)];
    const inner = figma.createRectangle();
    inner.resize(Math.max(2, 220 * pct), 8);
    inner.cornerRadius = 99;
    inner.fills = [solid(fill)];
    inner.x = 0;
    inner.y = 0;
    c.appendChild(inner);
    return c;
  }
  const barSet = figma.combineAsVariants(
    [bar('Value=Empty', 0, BRAND), bar('Value=Partial', 0.42, BRAND), bar('Value=Complete', 1, SUCCESS)],
    page,
  );
  barSet.name = 'ProgressBar';
  barSet.x = 80;
  barSet.y = 1200;
  barSet.layoutMode = 'HORIZONTAL';
  barSet.itemSpacing = 16;
  barSet.paddingLeft = barSet.paddingRight = barSet.paddingTop = barSet.paddingBottom = 24;

  const empty = figma.createComponent();
  empty.name = 'EmptyState';
  empty.layoutMode = 'VERTICAL';
  empty.primaryAxisAlignItems = 'CENTER';
  empty.counterAxisAlignItems = 'CENTER';
  empty.itemSpacing = 12;
  empty.paddingTop = empty.paddingBottom = 64;
  empty.paddingLeft = empty.paddingRight = 16;
  empty.resize(360, 10);
  empty.layoutSizingHorizontal = 'FIXED';
  empty.layoutSizingVertical = 'HUG';
  const iconBox = figma.createFrame();
  iconBox.resize(56, 56);
  iconBox.cornerRadius = 16;
  iconBox.fills = [solid(BRAND50)];
  empty.appendChild(iconBox);
  empty.appendChild(txt('Пока пусто', outfit('SemiBold'), 17, INK));
  empty.appendChild(txt('Здесь появятся элементы, когда будет прогресс.', outfit('Regular'), 14, MUTED, 280));
  empty.x = 80;
  empty.y = 1340;
  page.appendChild(empty);

  const cardDef = figma.createComponent();
  cardDef.name = 'State=Default';
  cardDef.layoutMode = 'VERTICAL';
  cardDef.paddingTop = cardDef.paddingBottom = 24;
  cardDef.paddingLeft = cardDef.paddingRight = 24;
  cardDef.itemSpacing = 8;
  cardDef.cornerRadius = 24;
  cardDef.fills = [solid(WHITE)];
  cardDef.strokes = [solid(INK, 0.1)];
  cardDef.appendChild(txt('Карточка курса', outfit('SemiBold'), 17, INK));
  cardDef.appendChild(txt('GlassCard / .km-card', outfit('Regular'), 14, MUTED));
  cardDef.resize(280, 10);
  cardDef.layoutSizingHorizontal = 'FIXED';
  cardDef.layoutSizingVertical = 'HUG';
  const cardHover = cardDef.clone();
  cardHover.name = 'State=Hover';
  cardHover.strokes = [solid(BRAND, 0.22)];
  const cardSet = figma.combineAsVariants([cardDef, cardHover], page);
  cardSet.name = 'GlassCard';
  cardSet.x = 480;
  cardSet.y = 1340;
  cardSet.layoutMode = 'HORIZONTAL';
  cardSet.itemSpacing = 16;
  cardSet.paddingLeft = cardSet.paddingRight = cardSet.paddingTop = cardSet.paddingBottom = 24;

  function railItem(name, bg, color, showBar) {
    const c = figma.createComponent();
    c.name = name;
    c.layoutMode = 'HORIZONTAL';
    c.primaryAxisAlignItems = 'CENTER';
    c.itemSpacing = 12;
    c.paddingLeft = c.paddingRight = 12;
    c.paddingTop = c.paddingBottom = 10;
    c.cornerRadius = 8;
    c.fills = bg ? [solid(bg)] : [TRANSPARENT];
    c.resize(216, 10);
    c.layoutSizingHorizontal = 'FIXED';
    c.layoutSizingVertical = 'HUG';
    if (showBar) {
      const tick = figma.createRectangle();
      tick.resize(3, 16);
      tick.cornerRadius = 99;
      tick.fills = [solid({ r: 0.537, g: 0.808, b: 1 })];
      c.appendChild(tick);
    }
    c.appendChild(txt('Слепая печать', outfit('Medium'), 14, color));
    return c;
  }
  const rails = [
    railItem('State=Default', null, { r: 0.659, g: 0.69, b: 0.765 }, false),
    railItem('State=Hover', WHITE, WHITE, false),
    railItem('State=Active', { r: 0.118, g: 0.149, b: 0.212 }, { r: 0.678, g: 0.776, b: 1 }, true),
  ];
  rails[1].fills = [solid(WHITE, 0.04)];
  const railSet = figma.combineAsVariants(rails, page);
  railSet.name = 'PracticeRailItem';
  railSet.x = 80;
  railSet.y = 1680;
  railSet.fills = [solid({ r: 0.078, g: 0.094, b: 0.125 })];
  railSet.layoutMode = 'VERTICAL';
  railSet.itemSpacing = 8;
  railSet.paddingLeft = railSet.paddingRight = railSet.paddingTop = railSet.paddingBottom = 24;

  function otp(name, border, fill, char) {
    const c = figma.createComponent();
    c.name = name;
    c.layoutMode = 'HORIZONTAL';
    c.primaryAxisAlignItems = 'CENTER';
    c.counterAxisAlignItems = 'CENTER';
    c.resize(44, 52);
    c.layoutSizingHorizontal = 'FIXED';
    c.layoutSizingVertical = 'FIXED';
    c.cornerRadius = 12;
    c.fills = [solid(fill)];
    c.strokes = [solid(border)];
    c.strokeWeight = 1;
    c.appendChild(txt(char || ' ', outfit('SemiBold'), 18, INK));
    return c;
  }
  const otps = [
    otp('State=Empty', INK, WHITE, ' '),
    otp('State=Filling', BRAND, WHITE, '4'),
    otp('State=Error', SIGNAL, SIGNAL, '4'),
    otp('State=Disabled', INK, WHITE, ''),
  ];
  otps[2].fills = [solid(SIGNAL, 0.08)];
  otps[3].opacity = 0.55;
  const otpSet = figma.combineAsVariants(otps, page);
  otpSet.name = 'OtpDigit';
  otpSet.x = 80;
  otpSet.y = 1980;
  otpSet.layoutMode = 'HORIZONTAL';
  otpSet.itemSpacing = 12;
  otpSet.paddingLeft = otpSet.paddingRight = otpSet.paddingTop = otpSet.paddingBottom = 24;

  function lang(name, selected) {
    const c = figma.createComponent();
    c.name = name;
    c.layoutMode = 'HORIZONTAL';
    c.itemSpacing = 0;
    c.paddingLeft = c.paddingRight = c.paddingTop = c.paddingBottom = 2;
    c.cornerRadius = 8;
    c.strokes = [solid(INK, 0.1)];
    c.fills = [TRANSPARENT];
    const ru = figma.createAutoLayout('HORIZONTAL');
    ru.paddingLeft = ru.paddingRight = 10;
    ru.paddingTop = ru.paddingBottom = 4;
    ru.cornerRadius = 6;
    ru.fills = selected === 'RU' ? [solid({ r: 0.114, g: 0.306, b: 0.847 })] : [TRANSPARENT];
    ru.appendChild(txt('RU', outfit('Bold'), 12, selected === 'RU' ? WHITE : INK));
    const tj = figma.createAutoLayout('HORIZONTAL');
    tj.paddingLeft = tj.paddingRight = 10;
    tj.paddingTop = tj.paddingBottom = 4;
    tj.cornerRadius = 6;
    tj.fills = selected === 'TJ' ? [solid({ r: 0.114, g: 0.306, b: 0.847 })] : [TRANSPARENT];
    tj.appendChild(txt('TJ', outfit('Bold'), 12, selected === 'TJ' ? WHITE : INK));
    c.appendChild(ru);
    c.appendChild(tj);
    c.layoutSizingHorizontal = 'HUG';
    c.layoutSizingVertical = 'HUG';
    return c;
  }
  const langSet = figma.combineAsVariants([lang('Selected=RU', 'RU'), lang('Selected=TJ', 'TJ')], page);
  langSet.name = 'LanguageSwitcher';
  langSet.x = 400;
  langSet.y = 1680;
  langSet.layoutMode = 'HORIZONTAL';
  langSet.itemSpacing = 16;
  langSet.paddingLeft = langSet.paddingRight = langSet.paddingTop = langSet.paddingBottom = 24;

  function tab(name, color) {
    const c = figma.createComponent();
    c.name = name;
    c.layoutMode = 'VERTICAL';
    c.primaryAxisAlignItems = 'CENTER';
    c.counterAxisAlignItems = 'CENTER';
    c.itemSpacing = 2;
    c.paddingTop = c.paddingBottom = 6;
    c.resize(80, 44);
    c.layoutSizingHorizontal = 'FIXED';
    c.layoutSizingVertical = 'FIXED';
    c.appendChild(txt('•', outfit('Bold'), 16, color));
    c.appendChild(txt('Курсы', outfit('SemiBold'), 10, color));
    return c;
  }
  const tabSet = figma.combineAsVariants([tab('State=Default', MUTED), tab('State=Active', { r: 0.114, g: 0.306, b: 0.847 })], page);
  tabSet.name = 'BottomNavItem';
  tabSet.x = 720;
  tabSet.y = 1680;
  tabSet.layoutMode = 'HORIZONTAL';
  tabSet.itemSpacing = 12;
  tabSet.paddingLeft = tabSet.paddingRight = tabSet.paddingTop = tabSet.paddingBottom = 24;

  await buildProductComponents(page);
  await bindComponentTokens(page);
}

async function bindComponentTokens(page) {
  if (!figma.variables.setBoundVariableForPaint) return;
  const vars = await figma.variables.getLocalVariablesAsync();
  const byName = Object.fromEntries(vars.map((v) => [v.name, v]));
  const brand600 = byName['brand/600'];
  const brand500 = byName['brand/500'];
  if (!brand600) return;
  const set = page.findOne((n) => n.type === 'COMPONENT_SET' && n.name === 'Button');
  if (!set || !set.children) return;
  for (const child of set.children) {
    const paints = child.fills;
    if (!paints || !paints[0] || paints[0].type !== 'SOLID') continue;
    const token = child.name.includes('State=Hover') || child.name.includes('State=Active') ? brand500 || brand600 : brand600;
    child.fills = [figma.variables.setBoundVariableForPaint(paints[0], 'color', token)];
  }
}

async function buildPlaceholder() {
  const page = pageByName('06 — Improved Screens');
  await figma.setCurrentPageAsync(page);
  if (page.findOne((n) => n.name === 'Stage 2 placeholder')) return;
  const frame = figma.createAutoLayout('VERTICAL');
  frame.name = 'Stage 2 placeholder';
  frame.primaryAxisAlignItems = 'CENTER';
  frame.counterAxisAlignItems = 'CENTER';
  frame.itemSpacing = 12;
  frame.paddingTop = frame.paddingBottom = 80;
  frame.paddingLeft = frame.paddingRight = 80;
  frame.resize(1440, 900);
  frame.layoutSizingHorizontal = 'FIXED';
  frame.layoutSizingVertical = 'FIXED';
  frame.fills = [solid({ r: 0.976, g: 0.98, b: 0.984 })];
  frame.strokes = [solid(BRAND)];
  frame.dashPattern = [8, 8];
  frame.strokeWeight = 2;
  frame.cornerRadius = 24;
  frame.x = 80;
  frame.y = 80;
  const title = txt('Этап 2 — не улучшать на этапе 1', fraunces('Bold'), 32, INK);
  title.textAlignHorizontal = 'CENTER';
  const body = txt('Improved screens stay empty until stage 1 product map is accepted. Current UI lives on pages 03 and 07.', outfit('Regular'), 16, MUTED, 720);
  body.textAlignHorizontal = 'CENTER';
  frame.appendChild(title);
  frame.appendChild(body);
  page.appendChild(frame);
}

async function buildScreenHeaders() {
  for (const pageName of ['03 — Existing Screens', '07 — Mobile Screens']) {
    const page = pageByName(pageName);
    await figma.setCurrentPageAsync(page);
    if (page.findOne((n) => n.name === 'As-is header')) continue;
    const header = figma.createAutoLayout('VERTICAL');
    header.name = 'As-is header';
    header.itemSpacing = 8;
    header.x = 80;
    header.y = 40;
    header.appendChild(txt(pageName === '07 — Mobile Screens' ? 'Mobile screens (current UI, 390)' : 'Existing screens (current UI)', fraunces('Bold'), 32, INK));
    header.appendChild(
      txt(
        'As-is captures from the live KeyMaster app. Do not duplicate 20 courses or every lesson. Page 06 is stage 2 only.',
        outfit('Regular'),
        14,
        MUTED,
        1200,
      ),
    );
    page.appendChild(header);
  }
}

function jpegSizeFromBytes(bytes) {
  let i = 2;
  while (i < bytes.length - 8) {
    if (bytes[i] !== 0xff) break;
    const marker = bytes[i + 1];
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      return { w: (bytes[i + 7] << 8) | bytes[i + 8], h: (bytes[i + 5] << 8) | bytes[i + 6] };
    }
    const len = (bytes[i + 2] << 8) | bytes[i + 3];
    i += 2 + len;
  }
  return { w: 1440, h: 900 };
}

async function placeImage(msg) {
  const page = pageByName(msg.page);
  await figma.setCurrentPageAsync(page);
  const bytes = figma.base64Decode(msg.b64);
  const image = figma.createImage(bytes);
  const parsed = jpegSizeFromBytes(bytes);
  let fw = msg.w || parsed.w;
  let fh = msg.h || parsed.h;
  if (msg.page === '07 — Mobile Screens' && fw > 390) {
    const scale = 390 / fw;
    fw = 390;
    fh = Math.round(fh * scale);
  }
  const group = msg.group || 'Other';
  if (!groupCursors[msg.page]) groupCursors[msg.page] = { groups: [], x: 80, y: 160 };
  const state = groupCursors[msg.page];
  if (!state.groups.includes(group)) {
    state.groups.push(group);
    const col = state.groups.length - 1;
    state[group] = { x: 80 + col * (fw + 80), y: 160, maxW: fw };
  }
  const pos = state[group];
  const wrap = figma.createAutoLayout('VERTICAL');
  wrap.name = msg.name;
  wrap.itemSpacing = 8;
  wrap.x = pos.x;
  wrap.y = pos.y;
  wrap.appendChild(txt(msg.name, outfit('SemiBold'), 14, INK, Math.min(fw, 720)));
  wrap.appendChild(txt(msg.layout, outfit('Regular'), 11, MUTED, Math.min(fw, 720)));
  const frame = figma.createFrame();
  frame.name = msg.name + ' — capture';
  frame.resize(fw, fh);
  frame.fills = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: image.hash }];
  frame.strokes = [solid(INK, 0.08)];
  frame.strokeWeight = 1;
  wrap.appendChild(frame);
  page.appendChild(wrap);
  pos.y += fh + 72;
  screenIndex[msg.file] = frame.id;
  imageByFile[msg.file] = { hash: image.hash, w: fw, h: fh };
}

function flowThumb(file, label) {
  const col = figma.createAutoLayout('VERTICAL');
  col.itemSpacing = 6;
  col.primaryAxisAlignItems = 'CENTER';
  col.appendChild(txt(label, outfit('SemiBold'), 11, INK, 200));
  const frame = figma.createFrame();
  frame.name = label;
  frame.resize(200, 125);
  frame.cornerRadius = 8;
  frame.strokes = [solid(INK, 0.1)];
  const info = imageByFile[file];
  if (info) {
    frame.fills = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: info.hash }];
  } else {
    frame.fills = [solid(PAPER)];
  }
  col.appendChild(frame);
  return col;
}

function arrow() {
  const t = txt('→', outfit('Bold'), 18, BRAND);
  t.layoutAlign = 'CENTER';
  return t;
}

async function buildVisualFlows() {
  const page = pageByName('02 — User Flows');
  await figma.setCurrentPageAsync(page);
  if (page.findOne((n) => n.name === 'User flows — screens')) return;
  const flows = [
    ['F1 Guest discover', [
      ['desktop-guest-01-home.jpg', 'Home'],
      ['desktop-guest-04-courses.jpg', 'Courses'],
      ['desktop-guest-05-course-computer-basics.jpg', 'Course'],
      ['desktop-learner-17-lesson-hotkey.jpg', 'Lesson'],
      ['desktop-guest-03-register.jpg', 'Register gate'],
    ]],
    ['F2 Sign up', [
      ['desktop-guest-03-register.jpg', 'Register'],
      ['desktop-guest-verify-email-error.jpg', 'OTP / verify'],
      ['desktop-learner-08-dashboard.jpg', 'Dashboard'],
    ]],
    ['F3 Sign in', [
      ['desktop-guest-02-login.jpg', 'Login'],
      ['desktop-guest-login-error.jpg', 'Login error'],
      ['desktop-learner-08-dashboard.jpg', 'Dashboard'],
    ]],
    ['F4 Learning path', [
      ['desktop-learner-09-path-viewport.jpg', 'Path'],
      ['desktop-guest-05-course-computer-basics.jpg', 'Course'],
      ['desktop-learner-17-lesson-hotkey.jpg', 'Lesson'],
    ]],
    ['F5 First laptop', [
      ['desktop-guest-05-course-computer-basics.jpg', 'Computer basics'],
      ['desktop-learner-23-simulator-desktop.jpg', 'Desktop sim'],
      ['desktop-learner-18-lesson-task.jpg', 'Task lesson'],
    ]],
    ['F6 Hotkey learn', [
      ['desktop-learner-17-lesson-hotkey.jpg', 'KeyboardTrainer'],
    ]],
    ['F7 Practice hub', [
      ['desktop-learner-10-practice.jpg', 'Hub'],
      ['desktop-learner-11-typing.jpg', 'Typing'],
      ['desktop-learner-22-simulator-code.jpg', 'Code Lab'],
      ['desktop-learner-12-training.jpg', 'Training'],
      ['desktop-learner-13-speed.jpg', 'Speed'],
      ['desktop-learner-speed-done.jpg', 'Speed done'],
    ]],
    ['F8 Reinforce', [
      ['desktop-learner-14-review.jpg', 'Review'],
      ['desktop-learner-15-quiz.jpg', 'Quiz'],
      ['desktop-learner-16-exam.jpg', 'Exam setup'],
      ['desktop-learner-exam-run.jpg', 'Exam run'],
      ['desktop-learner-exam-feedback.jpg', 'Exam feedback'],
      ['desktop-learner-exam-done.jpg', 'Exam done'],
      ['desktop-learner-exam-empty.jpg', 'Exam empty'],
    ]],
    ['F9 Social', [
      ['desktop-guest-07-leaderboard.jpg', 'Leaderboard'],
      ['desktop-learner-19-achievements.jpg', 'Achievements'],
    ]],
    ['F10 Progress', [
      ['desktop-learner-08-dashboard.jpg', 'Dashboard'],
      ['desktop-learner-20-stats.jpg', 'Stats'],
    ]],
    ['F11 Admin', [
      ['desktop-admin-24-admin.jpg', 'Overview'],
      ['desktop-admin-courses.jpg', 'Courses'],
      ['desktop-admin-users.jpg', 'Users'],
      ['desktop-admin-achievements.jpg', 'Achievements'],
      ['desktop-learner-21-admin-forbidden.jpg', 'Forbidden'],
    ]],
    ['F12 Theme + locale', [
      ['desktop-guest-01-home.jpg', 'Light'],
      ['dark-01-home.jpg', 'Dark'],
      ['desktop-guest-02-login.jpg', 'RU / TJ in Navbar'],
    ]],
  ];
  const root = figma.createAutoLayout('VERTICAL');
  root.name = 'User flows — screens';
  root.itemSpacing = 20;
  root.paddingTop = root.paddingBottom = 32;
  root.paddingLeft = root.paddingRight = 32;
  root.fills = [solid(PAPER)];
  root.x = 80;
  root.y = 980;
  root.appendChild(txt('Flows with as-is captures (not a redesign)', outfit('SemiBold'), 16, INK, 1200));
  for (const [title, steps] of flows) {
    const row = figma.createAutoLayout('HORIZONTAL');
    row.name = title;
    row.itemSpacing = 8;
    row.counterAxisAlignItems = 'CENTER';
    row.paddingTop = row.paddingBottom = 12;
    row.paddingLeft = row.paddingRight = 12;
    row.cornerRadius = 12;
    row.fills = [solid(WHITE)];
    row.appendChild(txt(title, outfit('Bold'), 12, BRAND, 140));
    steps.forEach((step, i) => {
      row.appendChild(flowThumb(step[0], step[1]));
      if (i < steps.length - 1) row.appendChild(arrow());
    });
    root.appendChild(row);
  }
  page.appendChild(root);
}

function al(dir, name) {
  const f = figma.createAutoLayout(dir === 'VERTICAL' ? 'VERTICAL' : 'HORIZONTAL');
  f.name = name || 'Frame';
  return f;
}

function pill(label, fill, color) {
  const p = al('HORIZONTAL', label);
  p.paddingLeft = p.paddingRight = 8;
  p.paddingTop = p.paddingBottom = 3;
  p.cornerRadius = 6;
  p.fills = [solid(fill)];
  p.appendChild(txt(label, outfit('Bold'), 10, color));
  p.layoutSizingHorizontal = 'HUG';
  p.layoutSizingVertical = 'HUG';
  return p;
}

function routeNode(route, title, note) {
  const n = al('VERTICAL', route);
  n.itemSpacing = 4;
  n.paddingTop = n.paddingBottom = 10;
  n.paddingLeft = n.paddingRight = 12;
  n.cornerRadius = 10;
  n.fills = [solid(WHITE)];
  n.strokes = [solid(INK, 0.1)];
  n.strokeWeight = 1;
  n.resize(210, 10);
  n.layoutSizingHorizontal = 'FIXED';
  n.layoutSizingVertical = 'HUG';
  n.appendChild(txt(route, outfit('SemiBold'), 11, BRAND, 186));
  n.appendChild(txt(title, outfit('Regular'), 11, INK, 186));
  if (note) n.appendChild(txt(note, outfit('Regular'), 10, MUTED, 186));
  return n;
}

async function buildSitemap() {
  const page = pageByName('01 — Product Map');
  await figma.setCurrentPageAsync(page);
  if (page.findOne((n) => n.name === 'IA — unique pages by layout')) return;
  const board = al('VERTICAL', 'IA — unique pages by layout');
  board.itemSpacing = 16;
  board.paddingTop = board.paddingBottom = 32;
  board.paddingLeft = board.paddingRight = 32;
  board.fills = [solid(WHITE)];
  board.cornerRadius = 16;
  board.strokes = [solid(INK, 0.08)];
  board.appendChild(txt('Information architecture (current product)', fraunces('Bold'), 28, INK, 1720));
  board.appendChild(
    txt(
      'One node per unique page. /courses/:slug is one Course Detail layout × 20 slugs. /lessons/:id is three kinds, not N lessons.',
      outfit('Regular'),
      13,
      MUTED,
      1720,
    ),
  );
  const cols = al('HORIZONTAL', 'Layout columns');
  cols.itemSpacing = 16;
  const groups = [
    [
      'MarketingShell',
      [
        ['/', 'Home', 'Guest + learner'],
        ['/courses', 'Catalog', 'filters + 3 card statuses'],
        ['/courses/:slug', 'Course detail', '1 layout × 20 slugs'],
        ['/lessons/:id', 'Lesson', 'hotkey | task | study'],
        ['/path', 'Learning path', 'protected'],
        ['/leaderboard', 'Leaderboard', 'public'],
        ['/achievements', 'Achievements', 'locked / unlocked'],
        ['/dashboard', 'Dashboard', 'XP · streak'],
        ['/stats', 'Stats', 'protected'],
        ['/admin', 'Admin', 'overview · courses · users · achievements · forbidden'],
      ],
    ],
    [
      'AuthCard',
      [
        ['/login', 'Login', 'OTP if unverified'],
        ['/register', 'Register', 'OTP nested'],
        ['/verify-email', 'Verify email', 'link + error'],
        ['/auth/callback', 'OAuth callback', 'transient'],
      ],
    ],
    [
      'PracticeShell',
      [
        ['/practice', 'Practice hub', 'skills + reinforce'],
        ['/typing', 'Typing', 'train | path | progress'],
        ['/training', 'Hotkeys', 'keyboard gate on phone'],
        ['/speed', 'Speed', '60s'],
        ['/review', 'Review', 'front / flipped'],
        ['/quiz', 'Quiz', 'play + done'],
        ['/exam', 'Exam', 'setup | run | feedback | done | empty'],
      ],
    ],
    [
      'ImmersiveSimulator',
      [
        ['/simulator', 'Code Lab', 'no chrome · #1e1e1e'],
        ['/simulator?mode=desktop', 'Desktop sim', 'same layout'],
      ],
    ],
  ];
  for (const [layout, nodes] of groups) {
    const col = al('VERTICAL', layout);
    col.itemSpacing = 8;
    col.paddingTop = col.paddingBottom = 16;
    col.paddingLeft = col.paddingRight = 16;
    col.cornerRadius = 12;
    col.fills = [solid(layout === 'PracticeShell' || layout === 'ImmersiveSimulator' ? { r: 0.078, g: 0.094, b: 0.125 } : PAPER)];
    const titleColor = layout === 'PracticeShell' || layout === 'ImmersiveSimulator' ? WHITE : INK;
    col.appendChild(txt(layout, outfit('Bold'), 14, layout === 'ImmersiveSimulator' ? { r: 0.678, g: 0.776, b: 1 } : BRAND, 210));
    col.appendChild(txt(layout === 'MarketingShell' ? 'Navbar + footer + BottomNav' : layout === 'AuthCard' ? 'max-w-md GlassCard' : layout === 'PracticeShell' ? 'Rail 240px #141820' : 'No Navbar / BottomNav', outfit('Regular'), 11, titleColor, 210));
    for (const [route, title, note] of nodes) col.appendChild(routeNode(route, title, note));
    cols.appendChild(col);
  }
  board.appendChild(cols);
  const root = page.findOne((n) => n.name === 'KM Product Map — as-is');
  if (root) root.appendChild(board);
  else {
    board.x = 80;
    board.y = 980;
    page.appendChild(board);
  }
}

function field(label, value, border, hint, theme) {
  const dark = theme === 'dark';
  const wrap = al('VERTICAL', label);
  wrap.itemSpacing = 4;
  wrap.appendChild(txt(label, outfit('Medium'), 11, dark ? DARK_MUTED : MUTED));
  const box = al('HORIZONTAL', 'field');
  box.paddingLeft = box.paddingRight = 14;
  box.paddingTop = box.paddingBottom = 10;
  box.cornerRadius = 16;
  box.fills = [solid(dark ? DARK_ELEVATED : WHITE)];
  box.strokes = [solid(border || (dark ? WHITE : { r: 0.059, g: 0.09, b: 0.165 }), border ? 1 : dark ? 0.1 : 0.18)];
  box.strokeWeight = 1;
  box.resize(320, 44);
  box.layoutSizingHorizontal = 'FIXED';
  box.layoutSizingVertical = 'FIXED';
  const empty = value === label || !value;
  box.appendChild(txt(value, outfit('Regular'), 14, empty ? (dark ? DARK_MUTED : MUTED) : dark ? DARK_TEXT : INK));
  wrap.appendChild(box);
  if (hint) wrap.appendChild(txt(hint, outfit('Regular'), 11, dark ? DARK_MUTED : MUTED, 320));
  wrap.layoutSizingHorizontal = 'HUG';
  wrap.layoutSizingVertical = 'HUG';
  return wrap;
}

function iconEyeOff(color) {
  const wrap = figma.createFrame();
  wrap.name = 'EyeOff';
  wrap.resize(16, 16);
  wrap.fills = [TRANSPARENT];
  wrap.clipsContent = false;
  const eye = figma.createEllipse();
  eye.resize(14, 8);
  eye.x = 1;
  eye.y = 4;
  eye.fills = [TRANSPARENT];
  eye.strokes = [solid(color, 0.75)];
  eye.strokeWeight = 1.4;
  wrap.appendChild(eye);
  const pupil = figma.createEllipse();
  pupil.resize(4, 4);
  pupil.x = 6;
  pupil.y = 6;
  pupil.fills = [solid(color, 0.75)];
  wrap.appendChild(pupil);
  const slash = figma.createRectangle();
  slash.resize(16, 1.4);
  slash.cornerRadius = 1;
  slash.x = 0;
  slash.y = 7.3;
  slash.rotation = -38;
  slash.fills = [solid(color, 0.75)];
  wrap.appendChild(slash);
  return wrap;
}

function floatingField(label, value, opts) {
  opts = opts || {};
  const dark = !!(opts.dark || opts.theme === 'dark');
  const password = !!opts.password;
  const floated = !!(value && String(value).trim());
  const invalid = !!opts.error;
  const w = opts.width || 352;
  const wrap = al('VERTICAL', 'FloatingLabelInput');
  wrap.itemSpacing = 6;
  const box = al('HORIZONTAL', floated ? 'Floated' : 'Default');
  box.counterAxisAlignItems = 'CENTER';
  box.primaryAxisAlignItems = 'SPACE_BETWEEN';
  box.paddingLeft = 14;
  box.paddingRight = password ? 8 : 14;
  box.paddingTop = floated ? 8 : 14;
  box.paddingBottom = floated ? 8 : 14;
  box.cornerRadius = 16;
  box.fills = [solid(dark ? DARK_ELEVATED : WHITE)];
  box.strokes = [solid(invalid ? SIGNAL : dark ? WHITE : { r: 0.059, g: 0.09, b: 0.165 }, invalid ? 1 : dark ? 0.1 : 0.18)];
  box.strokeWeight = 1;
  box.resize(w, 48);
  box.layoutSizingHorizontal = 'FIXED';
  box.layoutSizingVertical = 'FIXED';
  const inner = al('VERTICAL', 'inner');
  inner.itemSpacing = 0;
  if (floated) {
    inner.appendChild(txt(label, outfit('Medium'), 10, invalid ? SIGNAL : dark ? BRAND500 : { r: 0.114, g: 0.306, b: 0.847 }));
    inner.appendChild(txt(value, outfit('Regular'), 14, dark ? DARK_TEXT : INK));
  } else {
    inner.appendChild(txt(label, outfit('Regular'), 14, dark ? DARK_MUTED : MUTED));
  }
  inner.layoutSizingHorizontal = 'FILL';
  box.appendChild(inner);
  if (password) box.appendChild(iconEyeOff(dark ? DARK_MUTED : MUTED));
  wrap.appendChild(box);
  if (opts.hint) wrap.appendChild(txt(opts.hint, outfit('Regular'), 11, dark ? DARK_MUTED : MUTED, w));
  wrap.layoutSizingHorizontal = 'HUG';
  wrap.layoutSizingVertical = 'HUG';
  return wrap;
}

function homeFeatureVisual(variant, dark) {
  const art = figma.createFrame();
  art.name = 'HomeFeatureVisual / ' + variant;
  art.resize(232, 132);
  art.fills = [TRANSPARENT];
  art.clipsContent = true;
  if (variant === 'path') {
    const pts = [
      [18, 88, true],
      [64, 30, true],
      [118, 62, true],
      [196, 26, false],
    ];
    for (const [x, y, done] of pts) {
      const d = figma.createEllipse();
      d.resize(done ? 22 : 18, done ? 22 : 18);
      d.x = x;
      d.y = y;
      d.fills = [solid(done ? BRAND : dark ? DARK_ELEVATED : WHITE)];
      d.strokes = [solid(done ? BRAND500 : dark ? WHITE : INK, done ? 1 : 0.18)];
      d.strokeWeight = 2;
      art.appendChild(d);
    }
    const xp = txt('XP', outfit('Regular'), 9, dark ? DARK_MUTED : MUTED);
    xp.x = 16;
    xp.y = 114;
    art.appendChild(xp);
    const track = figma.createRectangle();
    track.resize(48, 6);
    track.x = 36;
    track.y = 116;
    track.cornerRadius = 3;
    track.fills = [solid(dark ? WHITE : INK, 0.1)];
    art.appendChild(track);
    const fillN = figma.createRectangle();
    fillN.resize(32, 6);
    fillN.x = 36;
    fillN.y = 116;
    fillN.cornerRadius = 3;
    fillN.fills = [solid(BRAND500)];
    art.appendChild(fillN);
  } else if (variant === 'keyboard') {
    const board = figma.createRectangle();
    board.resize(200, 108);
    board.x = 16;
    board.y = 12;
    board.cornerRadius = 12;
    board.fills = [solid(dark ? WHITE : INK, 0.08)];
    art.appendChild(board);
    let x = 28;
    for (const hot of [false, false, true, true, false]) {
      const key = figma.createRectangle();
      key.resize(26, 24);
      key.x = x;
      key.y = 28;
      key.cornerRadius = 6;
      key.fills = [solid(hot ? BRAND : dark ? DARK_ELEVATED : WHITE)];
      key.strokes = [solid(hot ? BRAND500 : dark ? WHITE : INK, hot ? 1 : 0.12)];
      art.appendChild(key);
      x += 30;
    }
    const chip = al('HORIZONTAL', 'Ctrl+K');
    chip.paddingLeft = chip.paddingRight = 8;
    chip.paddingTop = chip.paddingBottom = 4;
    chip.cornerRadius = 6;
    chip.fills = [solid(BRAND50)];
    chip.appendChild(txt('Ctrl+K', outfit('Bold'), 8, BRAND800));
    chip.x = 160;
    chip.y = 8;
    art.appendChild(chip);
    const ev = txt('KeyboardEvent', outfit('Regular'), 8, dark ? DARK_MUTED : MUTED);
    ev.x = 24;
    ev.y = 118;
    art.appendChild(ev);
  } else {
    const win = figma.createRectangle();
    win.resize(192, 92);
    win.x = 20;
    win.y = 16;
    win.cornerRadius = 12;
    win.fills = [solid(dark ? DARK_ELEVATED : WHITE)];
    win.strokes = [solid(dark ? WHITE : INK, 0.1)];
    art.appendChild(win);
    const bar = figma.createRectangle();
    bar.resize(192, 22);
    bar.x = 20;
    bar.y = 16;
    bar.cornerRadius = 12;
    bar.fills = [solid(dark ? WHITE : INK, 0.08)];
    art.appendChild(bar);
    const lights = [
      [30, SIGNAL],
      [42, { r: 0.961, g: 0.62, b: 0.043 }],
      [54, SUCCESS],
    ];
    for (const [cx, col] of lights) {
      const c = figma.createEllipse();
      c.resize(8, 8);
      c.x = cx;
      c.y = 23;
      c.fills = [solid(col, 0.7)];
      art.appendChild(c);
    }
    const exam = txt('Exam · 12/15', outfit('SemiBold'), 8, dark ? DARK_MUTED : MUTED);
    exam.x = 70;
    exam.y = 24;
    art.appendChild(exam);
    const track = figma.createRectangle();
    track.resize(120, 6);
    track.x = 32;
    track.y = 48;
    track.cornerRadius = 3;
    track.fills = [solid(dark ? WHITE : INK, 0.1)];
    art.appendChild(track);
    const fillN = figma.createRectangle();
    fillN.resize(96, 6);
    fillN.x = 32;
    fillN.y = 48;
    fillN.cornerRadius = 3;
    fillN.fills = [solid(BRAND500)];
    art.appendChild(fillN);
    const pass = figma.createEllipse();
    pass.resize(44, 44);
    pass.x = 176;
    pass.y = 76;
    pass.fills = [solid(BRAND)];
    art.appendChild(pass);
    const passL = txt('PASS', outfit('Bold'), 7, dark ? DARK_MUTED : MUTED);
    passL.x = 186;
    passL.y = 122;
    art.appendChild(passL);
  }
  return art;
}

function featureTile(num, title, desc, variant, dark) {
  const tile = al('VERTICAL', title);
  tile.itemSpacing = 8;
  tile.paddingTop = tile.paddingBottom = 28;
  tile.paddingLeft = tile.paddingRight = 28;
  tile.cornerRadius = 20;
  tile.fills = [solid(dark ? DARK_CARD : WHITE)];
  tile.strokes = [solid(dark ? WHITE : INK, 0.08)];
  tile.resize(280, 10);
  tile.layoutSizingHorizontal = 'FIXED';
  tile.layoutSizingVertical = 'HUG';
  const chrome = al('VERTICAL', 'visual');
  chrome.paddingTop = chrome.paddingBottom = chrome.paddingLeft = chrome.paddingRight = 8;
  chrome.cornerRadius = 16;
  chrome.fills = [solid(dark ? DARK_ELEVATED : { r: 0.937, g: 0.965, b: 1 }, dark ? 0.6 : 0.8)];
  chrome.strokes = [solid(dark ? WHITE : INK, 0.06)];
  chrome.appendChild(homeFeatureVisual(variant, dark));
  chrome.layoutSizingHorizontal = 'FILL';
  chrome.layoutSizingVertical = 'HUG';
  tile.appendChild(chrome);
  tile.appendChild(txt(num, outfit('SemiBold'), 11, dark ? BRAND500 : BRAND800));
  tile.appendChild(txt(title, outfit('SemiBold'), 16, dark ? DARK_TEXT : INK, 224));
  tile.appendChild(txt(desc, outfit('Regular'), 12, dark ? DARK_MUTED : MUTED, 224));
  return tile;
}

function primaryBtn(label, compact) {
  const b = al('HORIZONTAL', 'Button');
  b.primaryAxisAlignItems = 'CENTER';
  b.counterAxisAlignItems = 'CENTER';
  b.paddingLeft = b.paddingRight = compact ? 14 : 20;
  b.paddingTop = b.paddingBottom = compact ? 6 : 10;
  b.minHeight = 44;
  b.cornerRadius = 16;
  b.fills = [solid(BRAND)];
  b.appendChild(txt(label, outfit('SemiBold'), 14, WHITE));
  b.layoutSizingHorizontal = 'HUG';
  b.layoutSizingVertical = 'HUG';
  return b;
}

function secondaryBtn(label, theme) {
  const dark = theme === 'dark';
  const b = al('HORIZONTAL', 'Button');
  b.primaryAxisAlignItems = 'CENTER';
  b.counterAxisAlignItems = 'CENTER';
  b.paddingLeft = b.paddingRight = 20;
  b.paddingTop = b.paddingBottom = 10;
  b.minHeight = 44;
  b.cornerRadius = 16;
  b.fills = [solid(dark ? DARK_ELEVATED : WHITE)];
  b.strokes = [solid(dark ? WHITE : INK, 0.12)];
  b.strokeWeight = 1;
  b.appendChild(txt(label, outfit('SemiBold'), 14, dark ? DARK_TEXT : INK));
  b.layoutSizingHorizontal = 'HUG';
  b.layoutSizingVertical = 'HUG';
  return b;
}

function instPrimary(label) {
  const n = inst('Button', 'Variant=Primary, State=Default, Size=MD');
  if (!n) return primaryBtn(label);
  const t = findAll(n, (x) => x.type === 'TEXT')[0];
  if (t) t.characters = label;
  n.name = 'Button instance';
  return n;
}

function instSecondary(label) {
  const n = inst('Button/Rest', 'Variant=Secondary, State=Default, Size=MD');
  if (!n) return secondaryBtn(label);
  const t = findAll(n, (x) => x.type === 'TEXT')[0];
  if (t) t.characters = label;
  n.name = 'Button instance';
  return n;
}

function instKeyCap(label) {
  const n = inst('KeyCap', 'State=Default');
  if (!n) return null;
  const t = findAll(n, (x) => x.type === 'TEXT')[0];
  if (t) t.characters = label;
  n.name = 'KeyCap instance';
  return n;
}

function instOtpDigit(filling) {
  const n = inst('OtpDigit', filling ? 'State=Filling' : 'State=Empty');
  if (!n) return null;
  n.name = 'OtpDigit instance';
  return n;
}

function instFloat(state, label, width) {
  const n = inst('FloatingLabelInput', state);
  if (!n) return null;
  n.name = 'FloatingLabelInput instance';
  n.resize(width || 352, 48);
  n.layoutSizingHorizontal = 'FIXED';
  n.layoutSizingVertical = 'FIXED';
  if (label) {
    const texts = findAll(n, (x) => x.type === 'TEXT');
    if (texts[0]) texts[0].characters = label;
  }
  return n;
}

function floatOrInst(state, label, opts) {
  opts = opts || {};
  if (!opts.dark) {
    const n = instFloat(state, label, opts.width);
    if (n) return n;
  }
  return floatingField(label, opts.value != null ? opts.value : '', opts);
}

function instStrength(level) {
  const n = inst('PasswordStrength', 'Level=' + String(level));
  if (!n) return null;
  n.name = 'PasswordStrength instance';
  n.resize(352, 3);
  n.layoutSizingHorizontal = 'FIXED';
  n.layoutSizingVertical = 'FIXED';
  return n;
}

function instProgress(kind) {
  const n = inst('ProgressBar', kind || 'Value=Empty');
  if (!n) return null;
  n.name = 'ProgressBar instance';
  return n;
}

function instEmpty(title, desc) {
  const page = pageByName('05 — Components');
  if (!page) return null;
  const c = page.findOne((n) => n.type === 'COMPONENT' && n.name === 'EmptyState');
  if (!c || typeof c.createInstance !== 'function') return null;
  const n = c.createInstance();
  n.name = 'EmptyState instance';
  const texts = findAll(n, (x) => x.type === 'TEXT');
  if (texts[0] && title) texts[0].characters = title;
  if (texts[1] && desc) texts[1].characters = desc;
  return n;
}

function instCourse(status) {
  const n = inst('CourseCard', status);
  if (!n) return null;
  n.name = 'CourseCard instance';
  return n;
}

function instPath(status) {
  const n = inst('PathNode', status);
  if (!n) return null;
  n.name = 'PathNode instance';
  return n;
}

function instAchievement(locked, label) {
  const n = inst('Achievement', locked ? 'State=Locked' : 'State=Unlocked');
  if (!n) return null;
  n.name = 'Achievement instance';
  const texts = findAll(n, (x) => x.type === 'TEXT');
  if (texts[0] && label) texts[0].characters = label;
  return n;
}

function instLearn(learned) {
  const n = inst('LearnStatus', learned ? 'Learned=True' : 'Learned=False');
  if (!n) return null;
  n.name = 'LearnStatus instance';
  return n;
}

function instRailItem(active, label) {
  const n = inst('PracticeRailItem', active ? 'State=Active' : 'State=Default');
  if (!n) return null;
  const t = findAll(n, (x) => x.type === 'TEXT')[0];
  if (t) t.characters = label;
  n.name = 'PracticeRailItem instance';
  n.resize(216, 40);
  n.layoutSizingHorizontal = 'FIXED';
  n.layoutSizingVertical = 'HUG';
  return n;
}

function instBottomNav(active, label) {
  const n = inst('BottomNavItem', active ? 'State=Active' : 'State=Default');
  if (!n) return null;
  const texts = findAll(n, (x) => x.type === 'TEXT');
  const labelN = texts.find((t) => t.characters && t.characters !== '•');
  if (labelN) labelN.characters = label;
  n.name = 'BottomNavItem instance';
  return n;
}

function instNavLink(active, label) {
  const n = inst('NavLink', active ? 'State=Active' : 'State=Default');
  if (!n) return null;
  const t = findAll(n, (x) => x.type === 'TEXT')[0];
  if (t) t.characters = label;
  n.name = 'NavLink instance';
  return n;
}

function componentFromFrame(frame, name) {
  const c = figma.createComponent();
  c.name = name;
  c.layoutMode = frame.layoutMode || 'HORIZONTAL';
  c.primaryAxisAlignItems = frame.primaryAxisAlignItems;
  c.counterAxisAlignItems = frame.counterAxisAlignItems;
  c.paddingLeft = frame.paddingLeft || 0;
  c.paddingRight = frame.paddingRight || 0;
  c.paddingTop = frame.paddingTop || 0;
  c.paddingBottom = frame.paddingBottom || 0;
  c.itemSpacing = frame.itemSpacing || 0;
  c.fills = frame.fills;
  c.strokes = frame.strokes;
  c.resize(960, 65);
  c.layoutSizingHorizontal = 'FIXED';
  c.layoutSizingVertical = 'FIXED';
  while (frame.children.length) c.appendChild(frame.children[0]);
  if (typeof frame.remove === 'function') frame.remove();
  return c;
}

function ghostBtn(label) {
  const b = al('HORIZONTAL', 'Button ghost');
  b.primaryAxisAlignItems = 'CENTER';
  b.counterAxisAlignItems = 'CENTER';
  b.paddingLeft = b.paddingRight = 12;
  b.paddingTop = b.paddingBottom = 6;
  b.minHeight = 36;
  b.cornerRadius = 12;
  b.fills = [TRANSPARENT];
  b.appendChild(txt(label, outfit('SemiBold'), 12, MUTED));
  b.layoutSizingHorizontal = 'HUG';
  b.layoutSizingVertical = 'HUG';
  return b;
}

function progressBar(width, pct, fill, height) {
  const h = height || 8;
  const track = al('HORIZONTAL', 'ProgressBar');
  track.resize(width, h);
  track.layoutSizingHorizontal = 'FIXED';
  track.layoutSizingVertical = 'FIXED';
  track.cornerRadius = 99;
  track.fills = [solid(INK, 0.08)];
  const fillN = figma.createRectangle();
  fillN.resize(Math.max(4, Math.round(width * pct)), h);
  fillN.cornerRadius = 99;
  fillN.fills = [solid(fill || BRAND)];
  track.appendChild(fillN);
  return track;
}

function navDivider() {
  const d = figma.createRectangle();
  d.name = 'divider';
  d.resize(1, 20);
  d.fills = [solid(INK, 0.1)];
  return d;
}

function themeToggle(dark) {
  const b = al('HORIZONTAL', 'Theme toggle');
  b.primaryAxisAlignItems = 'CENTER';
  b.counterAxisAlignItems = 'CENTER';
  b.paddingLeft = b.paddingRight = b.paddingTop = b.paddingBottom = 8;
  b.cornerRadius = 8;
  b.fills = [TRANSPARENT];
  const icon = figma.createFrame();
  icon.name = dark ? 'Moon' : 'Sun';
  icon.resize(20, 20);
  icon.fills = [TRANSPARENT];
  icon.clipsContent = false;
  if (dark) {
    const disc = figma.createEllipse();
    disc.resize(14, 14);
    disc.x = 4;
    disc.y = 3;
    disc.fills = [solid(DARK_TEXT, 0.9)];
    icon.appendChild(disc);
    const cut = figma.createEllipse();
    cut.resize(12, 12);
    cut.x = 8;
    cut.y = 2;
    cut.fills = [solid(DARK_ELEVATED)];
    icon.appendChild(cut);
  } else {
    const core = figma.createEllipse();
    core.resize(8, 8);
    core.x = 6;
    core.y = 6;
    core.fills = [solid(INK, 0.85)];
    icon.appendChild(core);
    const rays = [
      [9, 1],
      [14.5, 3.5],
      [17, 9],
      [14.5, 14.5],
      [9, 17],
      [3.5, 14.5],
      [1, 9],
      [3.5, 3.5],
    ];
    for (const [x, y] of rays) {
      const r = figma.createRectangle();
      r.resize(2, 2);
      r.cornerRadius = 1;
      r.x = x;
      r.y = y;
      r.fills = [solid(INK, 0.85)];
      icon.appendChild(r);
    }
  }
  b.appendChild(icon);
  b.layoutSizingHorizontal = 'HUG';
  b.layoutSizingVertical = 'HUG';
  return b;
}

function makeNavbar(active, guest, dark, admin) {
  const ink = dark ? DARK_TEXT : INK;
  const nav = al('HORIZONTAL', 'Navbar');
  nav.primaryAxisAlignItems = 'SPACE_BETWEEN';
  nav.counterAxisAlignItems = 'CENTER';
  nav.paddingLeft = nav.paddingRight = 16;
  nav.resize(960, 65);
  nav.layoutSizingHorizontal = 'FIXED';
  nav.layoutSizingVertical = 'FIXED';
  nav.fills = [solid(dark ? DARK_ELEVATED : WHITE, 0.78)];
  nav.strokes = [solid(dark ? WHITE : INK, 0.06)];
  const brand = al('HORIZONTAL', 'Brand');
  brand.itemSpacing = 10;
  brand.counterAxisAlignItems = 'CENTER';
  const mark = figma.createRectangle();
  mark.resize(36, 36);
  mark.cornerRadius = 10;
  mark.fills = [solid(BRAND)];
  brand.appendChild(mark);
  brand.appendChild(txt('KeyMaster', fraunces('SemiBold'), 22, ink));
  nav.appendChild(brand);
  const links = al('HORIZONTAL', 'Nav links');
  links.itemSpacing = 4;
  links.counterAxisAlignItems = 'CENTER';
  const groups = [
    ['Главная', 'Курсы', 'Мой путь'],
    ['Практика'],
    ['Рейтинг'],
  ];
  groups.forEach((group, gi) => {
    if (gi > 0) links.appendChild(navDivider());
    for (const item of group) {
      const on = item === active;
      if (!dark) {
        const linkInst = instNavLink(on, item);
        if (linkInst) {
          links.appendChild(linkInst);
          continue;
        }
      }
      const l = al('VERTICAL', item);
      l.itemSpacing = 0;
      l.paddingLeft = l.paddingRight = 12;
      l.paddingTop = l.paddingBottom = 8;
      l.cornerRadius = 8;
      l.fills = on ? [solid(dark ? BRAND : BRAND50, dark ? 0.22 : 1)] : [TRANSPARENT];
      const label = txt(item, outfit('SemiBold'), 15, on ? (dark ? BRAND500 : BRAND800) : ink);
      if (!on) label.fills = [solid(ink, 0.72)];
      l.appendChild(label);
      if (on) {
        const bar = figma.createRectangle();
        bar.resize(22, 2);
        bar.cornerRadius = 99;
        bar.fills = [solid(BRAND)];
        l.appendChild(bar);
      }
      l.layoutSizingHorizontal = 'HUG';
      l.layoutSizingVertical = 'HUG';
      links.appendChild(l);
    }
  });
  nav.appendChild(links);
  const actions = al('HORIZONTAL', 'Actions');
  actions.itemSpacing = 6;
  actions.counterAxisAlignItems = 'CENTER';
  const langInst = !dark ? inst('LanguageSwitcher', 'Selected=RU') : null;
  if (langInst) {
    langInst.name = 'LanguageSwitcher instance';
    actions.appendChild(langInst);
  } else {
    const lang = al('HORIZONTAL', 'LanguageSwitcher');
    lang.paddingLeft = lang.paddingRight = lang.paddingTop = lang.paddingBottom = 2;
    lang.cornerRadius = 8;
    lang.strokes = [solid(dark ? WHITE : INK, 0.1)];
    const ru = al('HORIZONTAL', 'RU');
    ru.paddingLeft = ru.paddingRight = 10;
    ru.paddingTop = ru.paddingBottom = 4;
    ru.cornerRadius = 6;
    ru.fills = [solid({ r: 0.114, g: 0.306, b: 0.847 })];
    ru.appendChild(txt('RU', outfit('Bold'), 12, WHITE));
    const tj = al('HORIZONTAL', 'TJ');
    tj.paddingLeft = tj.paddingRight = 10;
    tj.paddingTop = tj.paddingBottom = 4;
    tj.cornerRadius = 6;
    tj.fills = [TRANSPARENT];
    tj.appendChild(txt('TJ', outfit('Bold'), 12, dark ? DARK_TEXT : INK));
    lang.appendChild(ru);
    lang.appendChild(tj);
    actions.appendChild(lang);
  }
  actions.appendChild(themeToggle(dark));
  if (guest) {
    const login = al('HORIZONTAL', 'Вход');
    login.paddingLeft = login.paddingRight = 10;
    login.paddingTop = login.paddingBottom = 8;
    login.cornerRadius = 8;
    login.appendChild(txt('Вход', outfit('SemiBold'), 14, ink));
    actions.appendChild(login);
    actions.appendChild(primaryBtn('Регистрация', true));
  } else {
    const user = al('HORIZONTAL', 'User');
    user.itemSpacing = 8;
    user.counterAxisAlignItems = 'CENTER';
    user.paddingLeft = user.paddingRight = 10;
    user.paddingTop = user.paddingBottom = 8;
    user.cornerRadius = 8;
    user.appendChild(txt(admin ? 'KeyMaster Admin' : 'Анна', outfit('SemiBold'), 14, ink));
    const xp = al('HORIZONTAL', 'XP');
    xp.paddingLeft = xp.paddingRight = 6;
    xp.paddingTop = xp.paddingBottom = 2;
    xp.cornerRadius = 6;
    xp.fills = [solid({ r: 0.114, g: 0.306, b: 0.847 }, dark ? 0.22 : 0.12)];
    xp.appendChild(txt('0 XP', outfit('Bold'), 12, dark ? BRAND500 : BRAND800));
    user.appendChild(xp);
    actions.appendChild(user);
    if (admin) {
      const adm = al('HORIZONTAL', 'Админ');
      adm.paddingLeft = adm.paddingRight = 8;
      adm.paddingTop = adm.paddingBottom = 8;
      adm.appendChild(txt('Админ', outfit('SemiBold'), 14, dark ? BRAND500 : BRAND800));
      actions.appendChild(adm);
    }
    const logout = al('HORIZONTAL', 'Выйти');
    logout.paddingLeft = logout.paddingRight = 12;
    logout.paddingTop = logout.paddingBottom = 6;
    logout.minHeight = 44;
    logout.cornerRadius = 16;
    logout.fills = [solid(dark ? DARK_CARD : WHITE)];
    logout.strokes = [solid(dark ? WHITE : INK, 0.12)];
    logout.appendChild(txt('Выйти', outfit('SemiBold'), 14, ink));
    actions.appendChild(logout);
  }
  nav.appendChild(actions);
  brand.layoutSizingHorizontal = 'HUG';
  links.layoutSizingHorizontal = 'HUG';
  actions.layoutSizingHorizontal = 'HUG';
  return nav;
}

function makeFooter(dark) {
  const ink = dark ? DARK_TEXT : INK;
  const muted = dark ? DARK_MUTED : MUTED;
  const f = al('HORIZONTAL', 'Footer');
  f.primaryAxisAlignItems = 'CENTER';
  f.counterAxisAlignItems = 'CENTER';
  f.itemSpacing = 8;
  f.paddingTop = 36;
  f.paddingBottom = 48;
  f.resize(960, 105);
  f.layoutSizingHorizontal = 'FIXED';
  f.layoutSizingVertical = 'FIXED';
  f.fills = [TRANSPARENT];
  f.strokes = [solid(dark ? WHITE : INK, 0.06)];
  f.appendChild(txt('KeyMaster', fraunces('SemiBold'), 13, ink));
  f.appendChild(txt('·', outfit('Regular'), 13, { r: 0.8, g: 0.82, b: 0.84 }));
  f.appendChild(txt('© 2026', outfit('Regular'), 13, muted));
  f.appendChild(txt('·', outfit('Regular'), 13, { r: 0.8, g: 0.82, b: 0.84 }));
  f.appendChild(txt('от первого ноутбука до Shortcut Legend', outfit('Regular'), 13, muted));
  return f;
}

function marketingPage(name, active, guest, body, dark, admin) {
  const page = al('VERTICAL', name);
  page.itemSpacing = 0;
  page.fills = [solid(dark ? DARK_BG : PAPER)];
  page.strokes = [solid(dark ? WHITE : INK, 0.08)];
  page.strokeWeight = 1;
  page.resize(960, 10);
  page.layoutSizingHorizontal = 'FIXED';
  page.layoutSizingVertical = 'HUG';
  page.appendChild(makeNavbar(active, guest, dark, admin));
  const main = al('VERTICAL', 'main');
  main.itemSpacing = 16;
  main.paddingTop = main.paddingBottom = 32;
  main.paddingLeft = main.paddingRight = 40;
  main.fills = [solid(dark ? DARK_BG : PAPER)];
  main.resize(960, 10);
  main.layoutSizingHorizontal = 'FIXED';
  main.layoutSizingVertical = 'HUG';
  for (const child of body) main.appendChild(child);
  page.appendChild(main);
  page.appendChild(makeFooter(dark));
  return page;
}

function practicePage(name, active, body, dark) {
  const page = al('VERTICAL', name);
  page.itemSpacing = 0;
  page.fills = [solid(dark ? DARK_BG : PAPER)];
  page.strokes = [solid(dark ? WHITE : INK, 0.08)];
  page.resize(960, 10);
  page.layoutSizingHorizontal = 'FIXED';
  page.layoutSizingVertical = 'HUG';
  page.appendChild(makeNavbar('Практика', false, dark));
  const row = al('HORIZONTAL', 'PracticeShell');
  row.itemSpacing = 0;
  row.fills = [solid(SHELL_BG)];
  row.resize(960, 10);
  row.layoutSizingHorizontal = 'FIXED';
  row.layoutSizingVertical = 'HUG';
  const rail = al('VERTICAL', 'Rail');
  rail.itemSpacing = 0;
  rail.fills = [solid(RAIL_BG)];
  rail.strokes = [solid({ r: 0.165, g: 0.184, b: 0.227 })];
  rail.resize(240, 10);
  rail.layoutSizingHorizontal = 'FIXED';
  rail.layoutSizingVertical = 'HUG';
  const railHead = al('HORIZONTAL', 'Rail header');
  railHead.itemSpacing = 10;
  railHead.counterAxisAlignItems = 'CENTER';
  railHead.paddingLeft = railHead.paddingRight = 20;
  railHead.paddingTop = railHead.paddingBottom = 20;
  railHead.strokes = [solid({ r: 0.165, g: 0.184, b: 0.227 })];
  const railMark = figma.createRectangle();
  railMark.resize(36, 36);
  railMark.cornerRadius = 8;
  railMark.fills = [solid(BRAND, 0.25)];
  railHead.appendChild(railMark);
  const railBrand = al('VERTICAL', 'brand text');
  railBrand.itemSpacing = 2;
  railBrand.appendChild(txt('KeyMaster', outfit('SemiBold'), 14, WHITE));
  railBrand.appendChild(txt('Уровень 1', outfit('Regular'), 11, RAIL_MUTED));
  railHead.appendChild(railBrand);
  rail.appendChild(railHead);
  const nav = al('VERTICAL', 'Practice nav');
  nav.itemSpacing = 2;
  nav.paddingTop = nav.paddingBottom = nav.paddingLeft = nav.paddingRight = 12;
  const skills = ['Тренировочный зал', 'Слепая печать', 'Рабочий стол', 'VS Code симулятор', 'Hotkeys', 'Скорость'];
  const reinforce = ['Повторение', 'Основы hotkeys', 'Экзамен'];
  function railLink(item) {
    const on = item === active;
    const insted = instRailItem(on, item);
    if (insted) {
      nav.appendChild(insted);
      return;
    }
    const it = al('HORIZONTAL', item);
    it.itemSpacing = 12;
    it.paddingLeft = it.paddingRight = 12;
    it.paddingTop = it.paddingBottom = 10;
    it.cornerRadius = 8;
    it.fills = on ? [solid(RAIL_ACTIVE_BG)] : [TRANSPARENT];
    if (on) {
      const tick = figma.createRectangle();
      tick.resize(3, 16);
      tick.cornerRadius = 99;
      tick.fills = [solid(RAIL_TICK)];
      it.appendChild(tick);
    }
    it.appendChild(txt(item, outfit('Medium'), 14, on ? RAIL_ACTIVE_TEXT : RAIL_IDLE_TEXT));
    it.resize(216, 10);
    it.layoutSizingHorizontal = 'FIXED';
    it.layoutSizingVertical = 'HUG';
    nav.appendChild(it);
  }
  for (const item of skills) railLink(item);
  nav.appendChild(txt('Закрепление', outfit('Bold'), 10, RAIL_MUTED));
  for (const item of reinforce) railLink(item);
  rail.appendChild(nav);
  const railFoot = al('VERTICAL', 'Rail footer');
  railFoot.itemSpacing = 8;
  railFoot.paddingTop = railFoot.paddingBottom = 16;
  railFoot.paddingLeft = railFoot.paddingRight = 16;
  railFoot.strokes = [solid({ r: 0.165, g: 0.184, b: 0.227 })];
  railFoot.appendChild(txt('Печать → симулятор → hotkeys. Кабинет и рейтинг — в шапке сайта.', outfit('Regular'), 11, RAIL_MUTED, 208));
  railFoot.appendChild(txt('Кабинет →', outfit('SemiBold'), 11, RAIL_TICK));
  rail.appendChild(railFoot);
  const outlet = al('VERTICAL', 'Outlet');
  outlet.itemSpacing = 12;
  outlet.paddingTop = outlet.paddingBottom = 24;
  outlet.paddingLeft = outlet.paddingRight = 24;
  outlet.fills = [solid(dark ? DARK_BG : PAPER)];
  outlet.resize(720, 10);
  outlet.layoutSizingHorizontal = 'FIXED';
  outlet.layoutSizingVertical = 'HUG';
  for (const child of body) outlet.appendChild(child);
  row.appendChild(rail);
  row.appendChild(outlet);
  page.appendChild(row);
  page.appendChild(makeFooter(dark));
  return page;
}

function courseCard(title, statusLabel, tone, required) {
  const c = al('VERTICAL', title);
  c.itemSpacing = 8;
  c.paddingTop = c.paddingBottom = 20;
  c.paddingLeft = c.paddingRight = 20;
  c.cornerRadius = 24;
  c.fills = required ? [solid(BRAND50)] : [solid(WHITE)];
  c.strokes = [solid(required ? BRAND : INK, required ? 0.22 : 0.1)];
  c.resize(280, 10);
  c.layoutSizingHorizontal = 'FIXED';
  c.layoutSizingVertical = 'HUG';
  const top = al('HORIZONTAL', 'top');
  top.primaryAxisAlignItems = 'SPACE_BETWEEN';
  top.counterAxisAlignItems = 'CENTER';
  const icon = figma.createRectangle();
  icon.resize(42, 42);
  icon.cornerRadius = 12;
  icon.fills = [solid(BRAND50)];
  top.appendChild(icon);
  top.appendChild(
    pill(
      statusLabel,
      tone === 'brand' ? { r: 0.114, g: 0.306, b: 0.847 } : tone === 'success' ? { r: 0.941, g: 0.992, b: 0.957 } : { r: 0.941, g: 0.945, b: 0.953 },
      tone === 'brand' ? WHITE : tone === 'success' ? { r: 0.082, g: 0.502, b: 0.239 } : { r: 0.2, g: 0.255, b: 0.333 },
    ),
  );
  top.layoutSizingHorizontal = 'FILL';
  c.appendChild(top);
  c.appendChild(txt(title, outfit('SemiBold'), 16, INK, 240));
  c.appendChild(txt('Каталог · 1 layout на все курсы', outfit('Regular'), 12, MUTED, 240));
  return c;
}

function pathNode(title, status, locked) {
  const c = al('VERTICAL', title);
  c.itemSpacing = 8;
  c.paddingTop = c.paddingBottom = 16;
  c.paddingLeft = c.paddingRight = 16;
  c.cornerRadius = 16;
  c.fills = [solid(WHITE)];
  c.strokes = [solid(locked ? INK : BRAND, locked ? 0.1 : 0.35)];
  c.opacity = locked ? 0.7 : 1;
  c.resize(260, 10);
  c.layoutSizingHorizontal = 'FIXED';
  c.layoutSizingVertical = 'HUG';
  c.appendChild(pill(status, locked ? { r: 0.941, g: 0.945, b: 0.953 } : BRAND, locked ? MUTED : WHITE));
  c.appendChild(txt(title, outfit('SemiBold'), 14, INK, 228));
  c.appendChild(txt(locked ? 'Нужен прогресс предыдущего этапа' : 'Открыть курс', outfit('Regular'), 11, MUTED, 228));
  return c;
}

async function buildProductComponents(page) {
  if (page.findOne((n) => n.type === 'COMPONENT_SET' && n.name === 'CourseCard')) return;

  function cardVariant(name, title, status, tone, required) {
    const c = figma.createComponent();
    c.name = name;
    c.layoutMode = 'VERTICAL';
    c.itemSpacing = 8;
    c.paddingTop = c.paddingBottom = 20;
    c.paddingLeft = c.paddingRight = 20;
    c.cornerRadius = 24;
    c.fills = required ? [solid(BRAND50)] : [solid(WHITE)];
    c.strokes = [solid(required ? BRAND : INK, required ? 0.22 : 0.1)];
    c.resize(260, 10);
    c.layoutSizingHorizontal = 'FIXED';
    c.layoutSizingVertical = 'HUG';
    c.appendChild(txt(title, outfit('SemiBold'), 15, INK, 220));
    c.appendChild(pill(status, tone === 'brand' ? { r: 0.114, g: 0.306, b: 0.847 } : tone === 'success' ? { r: 0.941, g: 0.992, b: 0.957 } : { r: 0.941, g: 0.945, b: 0.953 }, tone === 'brand' ? WHITE : tone === 'success' ? SUCCESS : MUTED));
    return c;
  }
  const cards = [
    cardVariant('Status=Start', 'Первый ноутбук', 'Старт', 'brand', true),
    cardVariant('Status=InProgress', 'VS Code', 'В процессе', 'neutral', false),
    cardVariant('Status=Completed', 'Git', 'Готово', 'success', false),
    cardVariant('Status=Required', 'Основы программиста', 'Обязательный старт', 'brand', true),
  ];
  const cardSet = figma.combineAsVariants(cards, page);
  cardSet.name = 'CourseCard';
  cardSet.x = 80;
  cardSet.y = 2280;
  cardSet.layoutMode = 'HORIZONTAL';
  cardSet.itemSpacing = 16;
  cardSet.paddingLeft = cardSet.paddingRight = cardSet.paddingTop = cardSet.paddingBottom = 24;
  cardSet.description = 'CoursesPages GlassCard statuses from getCourseStatus — do not duplicate ×20 slugs';

  function nodeVariant(name, title, status, locked) {
    const c = figma.createComponent();
    c.name = name;
    c.layoutMode = 'VERTICAL';
    c.itemSpacing = 6;
    c.paddingTop = c.paddingBottom = 14;
    c.paddingLeft = c.paddingRight = 14;
    c.cornerRadius = 16;
    c.fills = [solid(WHITE)];
    c.strokes = [solid(locked ? INK : BRAND, locked ? 0.1 : 0.4)];
    c.opacity = locked ? 0.7 : 1;
    c.resize(200, 10);
    c.layoutSizingHorizontal = 'FIXED';
    c.layoutSizingVertical = 'HUG';
    c.appendChild(txt(status, outfit('Bold'), 10, locked ? MUTED : BRAND));
    c.appendChild(txt(title, outfit('SemiBold'), 13, INK, 172));
    return c;
  }
  const nodes = [
    nodeVariant('Status=Start', 'Developer Growth Path', 'Начать', false),
    nodeVariant('Status=Available', 'Первый ноутбук', 'Начать', false),
    nodeVariant('Status=Progress', 'VS Code', 'Продолжается', false),
    nodeVariant('Status=Done', 'Git', 'Завершено', false),
    nodeVariant('Status=Locked', 'Shortcut Legend', 'Заблокировано', true),
  ];
  const nodeSet = figma.combineAsVariants(nodes, page);
  nodeSet.name = 'PathNode';
  nodeSet.x = 80;
  nodeSet.y = 2580;
  nodeSet.layoutMode = 'HORIZONTAL';
  nodeSet.itemSpacing = 12;
  nodeSet.paddingLeft = nodeSet.paddingRight = nodeSet.paddingTop = nodeSet.paddingBottom = 24;
  nodeSet.description = 'LearningPathPage PathNodeCard — NodeStatus locked|start|progress|done';

  function ach(name, locked) {
    const c = figma.createComponent();
    c.name = name;
    c.layoutMode = 'VERTICAL';
    c.primaryAxisAlignItems = 'CENTER';
    c.itemSpacing = 8;
    c.paddingTop = c.paddingBottom = 16;
    c.paddingLeft = c.paddingRight = 16;
    c.cornerRadius = 16;
    c.fills = [solid(WHITE)];
    c.strokes = [solid(INK, 0.1)];
    c.opacity = locked ? 0.45 : 1;
    c.resize(140, 10);
    c.layoutSizingHorizontal = 'FIXED';
    c.layoutSizingVertical = 'HUG';
    const badge = figma.createRectangle();
    badge.resize(40, 40);
    badge.cornerRadius = 20;
    badge.fills = [solid(locked ? MUTED : { r: 0.961, g: 0.769, b: 0.157 })];
    c.appendChild(badge);
    c.appendChild(txt(locked ? 'Закрыто' : 'Первый урок', outfit('SemiBold'), 11, INK));
    return c;
  }
  const achSet = figma.combineAsVariants([ach('State=Unlocked', false), ach('State=Locked', true)], page);
  achSet.name = 'Achievement';
  achSet.x = 80;
  achSet.y = 2860;
  achSet.layoutMode = 'HORIZONTAL';
  achSet.itemSpacing = 16;
  achSet.paddingLeft = achSet.paddingRight = achSet.paddingTop = achSet.paddingBottom = 24;
  achSet.description = 'Achievements unlocked vs locked (grayscale)';

  function learn(name, learned) {
    const c = figma.createComponent();
    c.name = name;
    c.layoutMode = 'HORIZONTAL';
    c.itemSpacing = 4;
    c.paddingLeft = c.paddingRight = 8;
    c.paddingTop = c.paddingBottom = 3;
    c.cornerRadius = 6;
    c.fills = [solid(learned ? { r: 0.941, g: 0.992, b: 0.957 } : { r: 0.941, g: 0.945, b: 0.953 })];
    c.strokes = [solid(learned ? SUCCESS : INK, learned ? 0.25 : 0.1)];
    c.appendChild(txt(learned ? 'Изучено' : 'Не изучено', outfit('Bold'), 10, learned ? { r: 0.082, g: 0.502, b: 0.239 } : MUTED));
    c.layoutSizingHorizontal = 'HUG';
    c.layoutSizingVertical = 'HUG';
    return c;
  }
  const learnSet = figma.combineAsVariants([learn('Learned=True', true), learn('Learned=False', false)], page);
  learnSet.name = 'LearnStatus';
  learnSet.x = 480;
  learnSet.y = 2860;
  learnSet.layoutMode = 'HORIZONTAL';
  learnSet.itemSpacing = 12;
  learnSet.paddingLeft = learnSet.paddingRight = learnSet.paddingTop = learnSet.paddingBottom = 24;
  learnSet.description = 'LearnStatusBadge — frontend/src/shared/components/LearnStatus.tsx';

  function float(name, label, value, border, shadow, opacity, password) {
    const c = figma.createComponent();
    c.name = name;
    c.layoutMode = 'HORIZONTAL';
    c.counterAxisAlignItems = 'CENTER';
    c.primaryAxisAlignItems = 'SPACE_BETWEEN';
    c.paddingLeft = 14;
    c.paddingRight = password ? 8 : 14;
    c.paddingTop = 8;
    c.paddingBottom = 8;
    c.resize(280, 48);
    c.layoutSizingHorizontal = 'FIXED';
    c.layoutSizingVertical = 'FIXED';
    c.cornerRadius = 16;
    c.fills = [solid(WHITE)];
    c.strokes = [solid(border)];
    c.strokeWeight = 1;
    c.opacity = opacity == null ? 1 : opacity;
    if (shadow) {
      c.effects = [{ type: 'DROP_SHADOW', color: shadow, offset: { x: 0, y: 0 }, radius: 0, spread: 4, visible: true, blendMode: 'NORMAL' }];
    }
    const floated = !!(value && String(value).trim());
    const inner = al('VERTICAL', 'inner');
    inner.itemSpacing = 0;
    if (floated) {
      inner.appendChild(txt(label, outfit('Medium'), 10, MUTED));
      inner.appendChild(txt(value, outfit('Regular'), 14, INK));
    } else {
      inner.appendChild(txt(label, outfit('Regular'), 14, MUTED));
    }
    c.appendChild(inner);
    inner.layoutSizingHorizontal = 'FILL';
    if (password) c.appendChild(iconEyeOff(MUTED));
    return c;
  }
  const floats = [
    float('State=Default', 'Email', '', { r: 0.059, g: 0.09, b: 0.165 }),
    float('State=Floated', 'Email', 'learner@example.com', { r: 0.059, g: 0.09, b: 0.165 }),
    float('State=Focus', 'Email', 'learner@example.com', BRAND, { r: 0.145, g: 0.388, b: 0.922, a: 0.35 }),
    float('State=Error', 'Email', 'bad', SIGNAL),
    float('State=Success', 'Email', 'ok@example.com', SUCCESS, { r: 0.086, g: 0.639, b: 0.29, a: 0.25 }),
    float('State=Disabled', 'Email', 'locked', { r: 0.059, g: 0.09, b: 0.165 }, null, 0.6),
    float('State=Password', 'Пароль', '', { r: 0.059, g: 0.09, b: 0.165 }, null, 1, true),
    float('State=PasswordFilled', 'Пароль', '••••••••', { r: 0.059, g: 0.09, b: 0.165 }, null, 1, true),
  ];
  const floatSet = figma.combineAsVariants(floats, page);
  floatSet.name = 'FloatingLabelInput';
  floatSet.x = 80;
  floatSet.y = 3140;
  floatSet.layoutMode = 'HORIZONTAL';
  floatSet.itemSpacing = 12;
  floatSet.paddingLeft = floatSet.paddingRight = floatSet.paddingTop = floatSet.paddingBottom = 24;
  floatSet.description = 'FloatingLabelInput — empty placeholder, floated, focus, error, success, disabled, password+EyeOff';

  function skel(name, w, h) {
    const c = figma.createComponent();
    c.name = name;
    c.resize(w, h);
    c.cornerRadius = name.includes('Card') ? 24 : 8;
    c.fills = [solid(INK, 0.08)];
    return c;
  }
  const skelSet = figma.combineAsVariants([skel('Kind=Line', 220, 16), skel('Kind=Card', 220, 120)], page);
  skelSet.name = 'Skeleton';
  skelSet.x = 80;
  skelSet.y = 3380;
  skelSet.layoutMode = 'HORIZONTAL';
  skelSet.itemSpacing = 16;
  skelSet.paddingLeft = skelSet.paddingRight = skelSet.paddingTop = skelSet.paddingBottom = 24;
  skelSet.description = 'Skeleton / SkeletonCardGrid loading states';

  function examPhase(name, title, sub) {
    const c = figma.createComponent();
    c.name = name;
    c.layoutMode = 'VERTICAL';
    c.itemSpacing = 8;
    c.paddingTop = c.paddingBottom = 16;
    c.paddingLeft = c.paddingRight = 16;
    c.cornerRadius = 16;
    c.fills = [solid(WHITE)];
    c.strokes = [solid(INK, 0.1)];
    c.resize(200, 10);
    c.layoutSizingHorizontal = 'FIXED';
    c.layoutSizingVertical = 'HUG';
    c.appendChild(txt(title, outfit('SemiBold'), 14, INK, 168));
    c.appendChild(txt(sub, outfit('Regular'), 11, MUTED, 168));
    return c;
  }
  const examSet = figma.combineAsVariants(
    [
      examPhase('Phase=Setup', 'Начать экзамен', 'курс · вопросы · время'),
      examPhase('Phase=Run', 'Экзамен · 3/20', 'без подсказок · таймер'),
      examPhase('Phase=Done', 'Сессия завершена', 'оценка · XP · новый экзамен'),
    ],
    page,
  );
  examSet.name = 'Exam';
  examSet.x = 400;
  examSet.y = 3380;
  examSet.layoutMode = 'HORIZONTAL';
  examSet.itemSpacing = 12;
  examSet.paddingLeft = examSet.paddingRight = examSet.paddingTop = examSet.paddingBottom = 24;
  examSet.description = 'ExamPage phases setup | run | done — frontend/src/features/training/ExamPage.tsx';

  function navbarVariant(name, scrolled, mobile, authed) {
    if (!mobile) {
      const c = componentFromFrame(makeNavbar(authed ? 'Кабинет' : 'Главная', !authed, false), name);
      c.strokes = [solid(INK, scrolled ? 0.1 : 0.06)];
      if (scrolled) {
        c.effects = [
          { type: 'DROP_SHADOW', color: { ...INK, a: 0.11 }, offset: { x: 0, y: 4 }, radius: 18, spread: -4, visible: true, blendMode: 'NORMAL' },
        ];
      }
      return c;
    }
    const c = figma.createComponent();
    c.name = name;
    c.layoutMode = 'VERTICAL';
    c.itemSpacing = 0;
    c.resize(960, 280);
    c.layoutSizingHorizontal = 'FIXED';
    c.layoutSizingVertical = 'FIXED';
    c.fills = [solid(WHITE, 0.78)];
    c.strokes = [solid(INK, 0.06)];
    const bar = al('HORIZONTAL', 'bar');
    bar.primaryAxisAlignItems = 'SPACE_BETWEEN';
    bar.counterAxisAlignItems = 'CENTER';
    bar.paddingLeft = bar.paddingRight = 16;
    bar.resize(960, 65);
    bar.layoutSizingHorizontal = 'FIXED';
    bar.layoutSizingVertical = 'FIXED';
    bar.fills = [TRANSPARENT];
    bar.appendChild(txt('KeyMaster', fraunces('SemiBold'), 22, INK));
    bar.appendChild(txt('☰', outfit('Bold'), 18, INK));
    c.appendChild(bar);
    const menu = al('VERTICAL', 'km-mobile-nav');
    menu.itemSpacing = 8;
    menu.paddingTop = menu.paddingBottom = 16;
    menu.paddingLeft = menu.paddingRight = 16;
    menu.fills = [solid(WHITE)];
    menu.resize(960, 216);
    menu.layoutSizingHorizontal = 'FIXED';
    menu.layoutSizingVertical = 'FIXED';
    for (const group of ['Обучение', 'Практика', 'Сообщество']) {
      menu.appendChild(txt(group, outfit('Bold'), 11, MUTED));
      menu.appendChild(txt(group === 'Обучение' ? 'Главная · Курсы · Мой путь' : group === 'Практика' ? 'Тренировочный зал' : 'Рейтинг', outfit('SemiBold'), 14, INK));
    }
    c.appendChild(menu);
    return c;
  }
  const navBarSet = figma.combineAsVariants(
    [
      navbarVariant('State=Default', false, false, false),
      navbarVariant('State=Scrolled', true, false, false),
      navbarVariant('State=MobileOpen', false, true, false),
      navbarVariant('State=Authed', false, false, true),
    ],
    page,
  );
  navBarSet.name = 'Navbar';
  navBarSet.x = 80;
  navBarSet.y = 3680;
  navBarSet.layoutMode = 'VERTICAL';
  navBarSet.itemSpacing = 16;
  navBarSet.paddingLeft = navBarSet.paddingRight = navBarSet.paddingTop = navBarSet.paddingBottom = 24;
  navBarSet.description = 'km-nav-bar / km-nav-bar--scrolled / km-mobile-nav — frontend/src/shared/components/Navbar.tsx';

  function strength(name, level) {
    const c = figma.createComponent();
    c.name = name;
    c.layoutMode = 'HORIZONTAL';
    c.itemSpacing = 4;
    c.resize(200, 3);
    c.layoutSizingHorizontal = 'FIXED';
    c.layoutSizingVertical = 'FIXED';
    for (let i = 1; i <= 4; i++) {
      const seg = figma.createRectangle();
      seg.resize(47, 3);
      seg.cornerRadius = 99;
      const on = i <= level;
      seg.fills = [solid(level === 4 && on ? SUCCESS : on ? BRAND : INK, on ? 1 : 0.08)];
      c.appendChild(seg);
    }
    return c;
  }
  const strSet = figma.combineAsVariants(
    [strength('Level=0', 0), strength('Level=1', 1), strength('Level=2', 2), strength('Level=3', 3), strength('Level=4', 4)],
    page,
  );
  strSet.name = 'PasswordStrength';
  strSet.x = 80;
  strSet.y = 4300;
  strSet.layoutMode = 'VERTICAL';
  strSet.itemSpacing = 12;
  strSet.paddingLeft = strSet.paddingRight = strSet.paddingTop = strSet.paddingBottom = 24;
  strSet.description = 'km-password-strength levels 1–4 from FloatingLabelInput';
}

async function buildUniqueScreens() {
  const page = pageByName('01 — Product Map');
  await figma.setCurrentPageAsync(page);
  if (page.findOne((n) => n.name === 'Unique screens — editable as-is')) return;
  const board = al('VERTICAL', 'Unique screens — editable as-is');
  board.itemSpacing = 28;
  board.paddingTop = board.paddingBottom = 40;
  board.paddingLeft = board.paddingRight = 40;
  board.fills = [solid(PAPER)];
  board.cornerRadius = 16;
  board.appendChild(txt('Unique screens recreated from current UI (not a redesign)', fraunces('Bold'), 28, INK, 1720));
  board.appendChild(
    txt(
      'Grouped by shared layout. Pixel captures live on pages 03 and 07. Buttons, KeyCap, and OTP instance page 05. Do not duplicate 20 courses or every lesson.',
      outfit('Regular'),
      13,
      MUTED,
      1720,
    ),
  );

  function section(title, frames) {
    const s = al('VERTICAL', title);
    s.itemSpacing = 12;
    s.appendChild(txt(title, outfit('Bold'), 16, BRAND, 1720));
    const row = al('HORIZONTAL', title + ' row');
    row.itemSpacing = 24;
    row.layoutWrap = 'WRAP';
    for (const f of frames) row.appendChild(f);
    s.appendChild(row);
    return s;
  }

  const homeBody = [];
  const hero = al('VERTICAL', 'Hero');
  hero.itemSpacing = 12;
  hero.primaryAxisAlignItems = 'CENTER';
  hero.counterAxisAlignItems = 'CENTER';
  const logo = figma.createRectangle();
  logo.resize(72, 72);
  logo.cornerRadius = 16;
  logo.fills = [solid(BRAND)];
  hero.appendChild(logo);
  hero.appendChild(txt('KeyMaster', fraunces('SemiBold'), 72, INK));
  hero.appendChild(txt('От первого ноутбука — до мастерства клавиатуры', outfit('Medium'), 24, { r: 0.2, g: 0.255, b: 0.333 }, 640));
  hero.appendChild(
    txt(
      'Файлы и папки, слепая печать, горячие клавиши и симулятор рабочего стола — понятный путь без скуки, с нуля.',
      outfit('Regular'),
      16,
      MUTED,
      560,
    ),
  );
  const ctas = al('HORIZONTAL', 'CTAs');
  ctas.itemSpacing = 12;
  ctas.appendChild(instPrimary('Начать бесплатно'));
  ctas.appendChild(secondaryBtn('Каталог курсов'));
  hero.appendChild(ctas);
  homeBody.push(hero);
  const feats = al('HORIZONTAL', 'Features');
  feats.itemSpacing = 12;
  feats.appendChild(
    featureTile('01', 'С нуля до уверенности', 'Сначала проводник и папки, потом текст и шорткаты — как реальная дорога новичка.', 'path'),
  );
  feats.appendChild(
    featureTile('02', 'Симулятор и печать', 'Тренируйте создание файлов в безопасной песочнице и слепую печать с подсветкой клавиш.', 'keyboard'),
  );
  feats.appendChild(
    featureTile('03', 'Hotkeys до автоматизма', 'Windows, VS Code, браузеры и IDE — живой тренажёр, XP и экзамен под ваши цели.', 'exam'),
  );
  homeBody.push(feats);

  const homeAuthed = [];
  const heroAuthed = al('VERTICAL', 'Hero authed');
  heroAuthed.itemSpacing = 12;
  heroAuthed.primaryAxisAlignItems = 'CENTER';
  heroAuthed.counterAxisAlignItems = 'CENTER';
  const logoAuthed = figma.createRectangle();
  logoAuthed.resize(72, 72);
  logoAuthed.cornerRadius = 16;
  logoAuthed.fills = [solid(BRAND)];
  heroAuthed.appendChild(logoAuthed);
  heroAuthed.appendChild(txt('KeyMaster', fraunces('SemiBold'), 72, INK));
  heroAuthed.appendChild(txt('От первого ноутбука — до мастерства клавиатуры', outfit('Medium'), 24, { r: 0.2, g: 0.255, b: 0.333 }, 640));
  const ctasAuthed = al('HORIZONTAL', 'CTAs authed');
  ctasAuthed.itemSpacing = 12;
  ctasAuthed.appendChild(instPrimary('Мой путь развития'));
  ctasAuthed.appendChild(secondaryBtn('Практика'));
  heroAuthed.appendChild(ctasAuthed);
  homeAuthed.push(heroAuthed);
  const featsAuthed = al('HORIZONTAL', 'Features authed');
  featsAuthed.itemSpacing = 12;
  featsAuthed.appendChild(
    featureTile('01', 'С нуля до уверенности', 'Сначала проводник и папки, потом текст и шорткаты — как реальная дорога новичка.', 'path'),
  );
  featsAuthed.appendChild(
    featureTile('02', 'Симулятор и печать', 'Тренируйте создание файлов в безопасной песочнице и слепую печать с подсветкой клавиш.', 'keyboard'),
  );
  featsAuthed.appendChild(
    featureTile('03', 'Hotkeys до автоматизма', 'Windows, VS Code, браузеры и IDE — живой тренажёр, XP и экзамен под ваши цели.', 'exam'),
  );
  homeAuthed.push(featsAuthed);

  const coursesRow = al('HORIZONTAL', 'Course cards');
  coursesRow.itemSpacing = 12;
  coursesRow.appendChild(instCourse('Status=Start') || courseCard('Первый ноутбук', 'Старт', 'brand', true));
  coursesRow.appendChild(instCourse('Status=InProgress') || courseCard('VS Code', 'В процессе', 'neutral', false));
  coursesRow.appendChild(instCourse('Status=Completed') || courseCard('Git', 'Готово', 'success', false));
  const filterRow = al('HORIZONTAL', 'Filters');
  filterRow.itemSpacing = 8;
  for (const [label, on] of [
    ['Все', true],
    ['Старт', false],
    ['ОС', false],
    ['Редакторы', false],
    ['Браузеры', false],
    ['Офис', false],
    ['Git', false],
  ]) {
    const chip = al('HORIZONTAL', label);
    chip.paddingLeft = chip.paddingRight = 14;
    chip.paddingTop = chip.paddingBottom = 10;
    chip.minHeight = 44;
    chip.cornerRadius = 99;
    chip.fills = [solid(on ? { r: 0.114, g: 0.306, b: 0.847 } : WHITE)];
    chip.strokes = [solid(on ? { r: 0.114, g: 0.306, b: 0.847 } : INK, on ? 1 : 0.12)];
    chip.appendChild(txt(label, outfit('SemiBold'), 13, on ? WHITE : MUTED));
    filterRow.appendChild(chip);
  }

  const lessonHotkey = al('VERTICAL', 'KeyboardTrainer');
  lessonHotkey.itemSpacing = 12;
  lessonHotkey.primaryAxisAlignItems = 'CENTER';
  lessonHotkey.counterAxisAlignItems = 'CENTER';
  lessonHotkey.appendChild(txt('Сохраните файл', outfit('SemiBold'), 20, INK));
  const keys = al('HORIZONTAL', 'KeyCombo');
  keys.itemSpacing = 8;
  for (const k of ['Ctrl', 'S']) {
    const cap = instKeyCap(k);
    if (cap) {
      keys.appendChild(cap);
      continue;
    }
    const box = al('HORIZONTAL', k);
    box.primaryAxisAlignItems = 'CENTER';
    box.counterAxisAlignItems = 'CENTER';
    box.minWidth = 40;
    box.minHeight = 40;
    box.paddingLeft = box.paddingRight = 12;
    box.cornerRadius = 12;
    box.fills = [solid(WHITE)];
    box.strokes = [solid(INK)];
    box.strokeWeight = 1;
    box.strokeBottomWeight = 4;
    box.appendChild(txt(k, outfit('SemiBold'), 14, INK));
    keys.appendChild(box);
  }
  lessonHotkey.appendChild(keys);
  lessonHotkey.appendChild(txt('Изучено / Не изучено · flash ok/err', outfit('Regular'), 12, MUTED));

  const lessonTask = al('VERTICAL', 'Task lesson');
  lessonTask.itemSpacing = 10;
  lessonTask.appendChild(txt('Задание · симулятор', outfit('Bold'), 11, BRAND));
  lessonTask.appendChild(txt('Создайте папку Documents на рабочем столе', outfit('SemiBold'), 18, INK, 800));
  lessonTask.appendChild(instPrimary('Симулятор рабочего стола'));

  const lessonStudy = al('VERTICAL', 'Study-only lesson');
  lessonStudy.itemSpacing = 10;
  lessonStudy.appendChild(txt('Регистрация для практики', outfit('Bold'), 11, BRAND));
  lessonStudy.appendChild(txt('Переключение окон', outfit('SemiBold'), 20, INK));
  const studyKeys = al('HORIZONTAL', 'combo');
  studyKeys.itemSpacing = 8;
  for (const k of ['Alt', 'Tab']) {
    const cap = instKeyCap(k);
    if (cap) {
      studyKeys.appendChild(cap);
      continue;
    }
    const box = al('HORIZONTAL', k);
    box.paddingLeft = box.paddingRight = 12;
    box.paddingTop = box.paddingBottom = 8;
    box.cornerRadius = 12;
    box.fills = [solid(WHITE)];
    box.strokes = [solid(INK)];
    box.appendChild(txt(k, outfit('SemiBold'), 14, INK));
    studyKeys.appendChild(box);
  }
  lessonStudy.appendChild(studyKeys);
  lessonStudy.appendChild(
    txt(
      'Это системное сочетание браузер не принимает. Запомните его здесь и повторяйте в режиме «Повторение».',
      outfit('Regular'),
      13,
      MUTED,
      720,
    ),
  );
  const studyCta = al('VERTICAL', 'register gate');
  studyCta.itemSpacing = 8;
  studyCta.paddingTop = studyCta.paddingBottom = 16;
  studyCta.paddingLeft = studyCta.paddingRight = 16;
  studyCta.cornerRadius = 16;
  studyCta.strokes = [solid(INK, 0.12)];
  studyCta.appendChild(txt('ПРАКТИКА', outfit('Bold'), 11, BRAND800));
  studyCta.appendChild(txt('Создайте бесплатный аккаунт', outfit('SemiBold'), 16, INK));
  const studyBtns = al('HORIZONTAL', 'ctas');
  studyBtns.itemSpacing = 8;
  studyBtns.appendChild(instPrimary('Регистрация'));
  studyBtns.appendChild(instSecondary('Уже есть аккаунт'));
  studyCta.appendChild(studyBtns);
  lessonStudy.appendChild(studyCta);

  const pathRow = al('HORIZONTAL', 'Path nodes');
  pathRow.itemSpacing = 12;
  pathRow.appendChild(instPath('Status=Start') || pathNode('Start', 'Начать', false));
  pathRow.appendChild(instPath('Status=Available') || pathNode('Первый ноутбук', 'Начать', false));
  pathRow.appendChild(instPath('Status=Progress') || pathNode('VS Code', 'Продолжается', false));
  pathRow.appendChild(instPath('Status=Done') || pathNode('Git', 'Завершено', false));
  pathRow.appendChild(instPath('Status=Locked') || pathNode('Shortcut Legend', 'Заблокировано', true));

  const dash = al('VERTICAL', 'Dashboard body');
  dash.itemSpacing = 16;
  const dashHead = al('HORIZONTAL', 'header');
  dashHead.primaryAxisAlignItems = 'SPACE_BETWEEN';
  dashHead.counterAxisAlignItems = 'CENTER';
  dashHead.resize(880, 10);
  dashHead.layoutSizingHorizontal = 'FIXED';
  dashHead.layoutSizingVertical = 'HUG';
  const dashTitles = al('VERTICAL', 'titles');
  dashTitles.itemSpacing = 4;
  dashTitles.appendChild(txt('Привет, Анна!', fraunces('Bold'), 28, INK));
  dashTitles.appendChild(txt('Личный кабинет KeyMaster', outfit('Regular'), 14, MUTED));
  dashHead.appendChild(dashTitles);
  dashHead.appendChild(secondaryBtn('Мой путь развития'));
  dash.appendChild(dashHead);
  const nextCard = al('VERTICAL', 'NextStepCard');
  nextCard.itemSpacing = 10;
  nextCard.paddingTop = nextCard.paddingBottom = 24;
  nextCard.paddingLeft = nextCard.paddingRight = 24;
  nextCard.cornerRadius = 24;
  nextCard.fills = [solid(BRAND50, 0.8)];
  nextCard.strokes = [solid(BRAND, 0.25)];
  nextCard.appendChild(txt('СЕГОДНЯ', outfit('Bold'), 11, BRAND800));
  nextCard.appendChild(txt('Первый ноутбук: файлы и папки', fraunces('SemiBold'), 24, INK, 800));
  nextCard.appendChild(txt('XP 0 · пройдено 0/20 · дальше: First Laptop', outfit('Regular'), 13, MUTED, 800));
  const nextBtns = al('HORIZONTAL', 'next ctas');
  nextBtns.itemSpacing = 8;
  nextBtns.appendChild(instPrimary('Приступить'));
  nextBtns.appendChild(secondaryBtn('Открыть путь обучения'));
  nextCard.appendChild(nextBtns);
  nextCard.appendChild(txt('Novice Operator', outfit('Regular'), 12, MUTED));
  dash.appendChild(nextCard);
  dash.appendChild(txt('Ближайшие этапы', outfit('SemiBold'), 16, INK));
  const stageStrip = al('HORIZONTAL', 'PathStageStrip');
  stageStrip.itemSpacing = 12;
  for (const [num, title, status, locked] of [
    ['01', 'Первый ноутбук: файлы и папки', 'НАЧАТЬ', false],
    ['02', 'Основные горячие клавиши программиста', 'ЗАБЛОКИРОВАНО', true],
    ['03', 'Windows', 'ЗАБЛОКИРОВАНО', true],
    ['04', 'VS Code', 'ЗАБЛОКИРОВАНО', true],
  ]) {
    const c = al('VERTICAL', title);
    c.itemSpacing = 6;
    c.paddingTop = c.paddingBottom = 14;
    c.paddingLeft = c.paddingRight = 14;
    c.cornerRadius = 16;
    c.fills = [solid(locked ? WHITE : BRAND50)];
    c.strokes = [solid(locked ? INK : BRAND, locked ? 0.1 : 0.35)];
    c.opacity = locked ? 0.7 : 1;
    c.resize(210, 10);
    c.layoutSizingHorizontal = 'FIXED';
    c.layoutSizingVertical = 'HUG';
    const top = al('HORIZONTAL', 'stage top');
    top.primaryAxisAlignItems = 'SPACE_BETWEEN';
    top.counterAxisAlignItems = 'CENTER';
    top.appendChild(txt(num, outfit('Bold'), 11, MUTED));
    const chip = al('HORIZONTAL', status);
    chip.itemSpacing = 2;
    chip.paddingLeft = chip.paddingRight = 8;
    chip.paddingTop = chip.paddingBottom = 2;
    chip.cornerRadius = 6;
    chip.fills = [solid(locked ? { r: 0.941, g: 0.945, b: 0.953 } : INK)];
    chip.appendChild(txt(status, outfit('Bold'), 9, locked ? MUTED : WHITE));
    top.appendChild(chip);
    top.layoutSizingHorizontal = 'FILL';
    c.appendChild(top);
    c.appendChild(txt(title, outfit('SemiBold'), 12, INK, 182));
    stageStrip.appendChild(c);
  }
  dash.appendChild(stageStrip);
  const tiles = al('HORIZONTAL', 'Stat tiles');
  tiles.itemSpacing = 12;
  const levelTile = al('VERTICAL', 'Уровень');
  levelTile.itemSpacing = 8;
  levelTile.paddingTop = levelTile.paddingBottom = 16;
  levelTile.paddingLeft = levelTile.paddingRight = 16;
  levelTile.cornerRadius = 16;
  levelTile.fills = [solid(WHITE)];
  levelTile.resize(280, 10);
  levelTile.layoutSizingHorizontal = 'FIXED';
  levelTile.layoutSizingVertical = 'HUG';
  levelTile.appendChild(txt('Уровень', outfit('Regular'), 12, MUTED));
  levelTile.appendChild(txt('Новичок', outfit('SemiBold'), 22, INK));
  levelTile.appendChild(instProgress('Value=Empty') || progressBar(240, 0.02, BRAND, 8));
  tiles.appendChild(levelTile);
  for (const [k, v] of [
    ['XP', '0'],
    ['Ежедневная серия', '1 дн.'],
  ]) {
    const t = al('VERTICAL', k);
    t.itemSpacing = 4;
    t.paddingTop = t.paddingBottom = 16;
    t.paddingLeft = t.paddingRight = 16;
    t.cornerRadius = 16;
    t.fills = [solid(WHITE)];
    t.resize(280, 10);
    t.layoutSizingHorizontal = 'FIXED';
    t.layoutSizingVertical = 'HUG';
    t.appendChild(txt(k, outfit('Regular'), 12, MUTED));
    t.appendChild(txt(v, outfit('SemiBold'), 22, INK));
    tiles.appendChild(t);
  }
  dash.appendChild(tiles);
  const dailyCard = al('VERTICAL', 'Daily');
  dailyCard.itemSpacing = 8;
  dailyCard.paddingTop = dailyCard.paddingBottom = 16;
  dailyCard.paddingLeft = dailyCard.paddingRight = 16;
  dailyCard.cornerRadius = 24;
  dailyCard.fills = [solid(WHITE)];
  dailyCard.resize(420, 10);
  dailyCard.layoutSizingHorizontal = 'FIXED';
  dailyCard.layoutSizingVertical = 'HUG';
  dailyCard.appendChild(txt('Ежедневные задания', outfit('SemiBold'), 16, INK));
  for (const [title, prog] of [
    ['Получить XP', '0/200'],
    ['Закончить урок', '0/1'],
    ['Выучить новые комбинации', '0/10'],
    ['Пройти тренировку', '0/1'],
  ]) {
    const row = al('HORIZONTAL', title);
    row.primaryAxisAlignItems = 'SPACE_BETWEEN';
    row.paddingTop = row.paddingBottom = 10;
    row.paddingLeft = row.paddingRight = 12;
    row.cornerRadius = 12;
    row.strokes = [solid(INK, 0.1)];
    row.resize(388, 10);
    row.layoutSizingHorizontal = 'FIXED';
    row.layoutSizingVertical = 'HUG';
    row.appendChild(txt(title, outfit('Regular'), 13, MUTED, 260));
    row.appendChild(txt(prog, outfit('SemiBold'), 13, MUTED));
    dailyCard.appendChild(row);
  }
  const achCard = al('VERTICAL', 'Recent achievements');
  achCard.itemSpacing = 8;
  achCard.paddingTop = achCard.paddingBottom = 16;
  achCard.paddingLeft = achCard.paddingRight = 16;
  achCard.cornerRadius = 24;
  achCard.fills = [solid(WHITE)];
  achCard.resize(420, 10);
  achCard.layoutSizingHorizontal = 'FIXED';
  achCard.layoutSizingVertical = 'HUG';
  achCard.appendChild(txt('Последние достижения', outfit('SemiBold'), 16, INK));
  achCard.appendChild(
    instEmpty(
      'Пройдите первый урок, чтобы открыть достижения',
      'Учитесь и тренируйтесь — бейджи откроются автоматически.',
    ) ||
      txt('Пройдите первый урок, чтобы открыть достижения', outfit('Regular'), 13, MUTED, 380),
  );
  const dashCols = al('HORIZONTAL', 'dash cols');
  dashCols.itemSpacing = 12;
  dashCols.appendChild(dailyCard);
  dashCols.appendChild(achCard);
  dash.appendChild(dashCols);

  function authScreen(title, subtitle, bodyNodes, footerText, opts) {
    const compact = !!(opts && opts.compact);
    const dark = !!(opts && opts.dark);
    const padX = compact ? 20 : 24;
    const padY = compact ? 16 : 24;
    const card = al('VERTICAL', compact ? 'AuthCard compact' : 'AuthCard');
    card.itemSpacing = 0;
    card.cornerRadius = 24;
    card.fills = [solid(dark ? DARK_CARD : WHITE)];
    card.strokes = [solid(dark ? WHITE : INK, 0.1)];
    card.resize(400, 10);
    card.layoutSizingHorizontal = 'FIXED';
    card.layoutSizingVertical = 'HUG';
    const head = al('VERTICAL', 'header');
    head.itemSpacing = 8;
    head.paddingTop = head.paddingBottom = padY;
    head.paddingLeft = head.paddingRight = padX;
    head.fills = [solid(dark ? { r: 0.09, g: 0.145, b: 0.329 } : BRAND50)];
    const km = txt('KEYMASTER', outfit('Bold'), 10, dark ? BRAND500 : BRAND800);
    km.textCase = 'UPPER';
    head.appendChild(km);
    head.appendChild(txt(title, fraunces('Bold'), compact ? 20 : 26, dark ? DARK_TEXT : INK));
    if (subtitle) head.appendChild(txt(subtitle, outfit('Regular'), 13, dark ? DARK_MUTED : MUTED, 352));
    card.appendChild(head);
    const body = al('VERTICAL', 'body');
    body.itemSpacing = compact ? 10 : 12;
    body.paddingTop = body.paddingBottom = padY;
    body.paddingLeft = body.paddingRight = padX;
    for (const n of bodyNodes) body.appendChild(n);
    card.appendChild(body);
    if (footerText) {
      const foot = al('HORIZONTAL', 'footer');
      foot.primaryAxisAlignItems = 'CENTER';
      foot.paddingTop = foot.paddingBottom = compact ? 12 : 16;
      foot.paddingLeft = foot.paddingRight = padX;
      foot.fills = [solid(dark ? { r: 0.09, g: 0.145, b: 0.329 } : { r: 0.976, g: 0.98, b: 0.984 }, dark ? 0.55 : 1)];
      foot.appendChild(txt(footerText, outfit('Regular'), 13, dark ? DARK_MUTED : MUTED));
      card.appendChild(foot);
    }
    return card;
  }

  function otpRow() {
    const row = al('HORIZONTAL', 'OTP');
    row.itemSpacing = 8;
    for (let i = 0; i < 6; i++) {
      const d = instOtpDigit(i === 0);
      if (d) {
        row.appendChild(d);
        continue;
      }
      const box = al('HORIZONTAL', 'digit');
      box.primaryAxisAlignItems = 'CENTER';
      box.counterAxisAlignItems = 'CENTER';
      box.resize(44, 52);
      box.layoutSizingHorizontal = 'FIXED';
      box.layoutSizingVertical = 'FIXED';
      box.cornerRadius = 12;
      box.fills = [solid(WHITE)];
      box.strokes = [solid(i === 0 ? BRAND : INK, i === 0 ? 1 : 0.18)];
      box.appendChild(txt(i === 0 ? '4' : ' ', outfit('SemiBold'), 18, INK));
      row.appendChild(box);
    }
    return row;
  }

  const loginCard = authScreen(
    'Вход',
    'Добро пожаловать в KeyMaster',
    [floatOrInst('State=Default', 'Email'), floatOrInst('State=Password', 'Пароль', { password: true }), instPrimary('Войти')],
    'Нет аккаунта? Регистрация',
  );
  const loginError = authScreen(
    'Вход',
    'Добро пожаловать в KeyMaster',
    [
      floatOrInst('State=Floated', 'Email', { value: 'learner@example.com' }),
      floatOrInst('State=PasswordFilled', 'Пароль', { password: true, value: '••••••••' }),
      (() => {
        const alert = al('HORIZONTAL', 'error');
        alert.paddingLeft = alert.paddingRight = 12;
        alert.paddingTop = alert.paddingBottom = 8;
        alert.cornerRadius = 12;
        alert.fills = [solid(SIGNAL, 0.1)];
        alert.strokes = [solid(SIGNAL, 0.3)];
        alert.appendChild(txt('Неверный email или пароль', outfit('Medium'), 13, SIGNAL, 296));
        return alert;
      })(),
      instPrimary('Войти'),
    ],
    'Нет аккаунта? Регистрация',
  );
  const loginOtp = authScreen(
    'Вход',
    'Введите код из письма.',
    [
      txt('Код из письма', outfit('Medium'), 13, INK),
      otpRow(),
      txt('6 цифр из письма KeyMaster (можно скопировать с телефона)', outfit('Regular'), 11, MUTED, 352),
      instPrimary('Подтвердить код'),
      instSecondary('Отправить снова'),
    ],
    'Нет аккаунта? Регистрация',
  );
  const registerCard = authScreen(
    'Регистрация',
    'Добро пожаловать в KeyMaster',
    [
      floatOrInst('State=Default', 'Имя', { width: 360 }),
      floatOrInst('State=Default', 'username', { width: 360 }),
      floatOrInst('State=Default', 'Email', { width: 360 }),
      floatOrInst('State=Password', 'Пароль', { password: true, width: 360 }),
      instPrimary('Создать аккаунт'),
    ],
    'Уже есть аккаунт? Войти',
    { compact: true },
  );
  const registerPassword = authScreen(
    'Регистрация',
    'Добро пожаловать в KeyMaster',
    [
      floatOrInst('State=Default', 'Имя', { width: 360 }),
      floatOrInst('State=Default', 'username', { width: 360 }),
      floatOrInst('State=Default', 'Email', { width: 360 }),
      floatOrInst('State=PasswordFilled', 'Пароль', { password: true, width: 360, value: '••••••••' }),
      instStrength(1) || txt('km-password-strength', outfit('Regular'), 10, MUTED),
      instPrimary('Создать аккаунт'),
    ],
    'Уже есть аккаунт? Войти',
    { compact: true },
  );
  const registerOtp = authScreen(
    'Код из письма',
    'Код отправлен на anna@example.com.',
    [otpRow(), instPrimary('Подтвердить код'), instSecondary('Отправить снова')],
    'Уже есть аккаунт? Войти',
  );

  function modeCard(title, tag, tone, desc, width, dark) {
    const w = width || 328;
    const c = al('VERTICAL', title);
    c.itemSpacing = 8;
    c.paddingTop = c.paddingBottom = 24;
    c.paddingLeft = c.paddingRight = 24;
    c.cornerRadius = 24;
    c.minHeight = 168;
    c.fills = [solid(dark ? DARK_CARD : WHITE)];
    c.strokes = [solid(dark ? WHITE : INK, 0.08)];
    c.resize(w, 10);
    c.layoutSizingHorizontal = 'FIXED';
    c.layoutSizingVertical = 'HUG';
    const icon = figma.createRectangle();
    icon.resize(44, 44);
    icon.cornerRadius = 12;
    icon.fills = [solid(dark ? { r: 0.09, g: 0.145, b: 0.329 } : BRAND50)];
    const top = al('HORIZONTAL', 'top');
    top.primaryAxisAlignItems = 'SPACE_BETWEEN';
    top.counterAxisAlignItems = 'CENTER';
    top.appendChild(icon);
    top.appendChild(
      pill(
        tag,
        tone === 'brand' ? BRAND : dark ? DARK_ELEVATED : { r: 0.941, g: 0.945, b: 0.953 },
        tone === 'brand' ? WHITE : dark ? DARK_MUTED : MUTED,
      ),
    );
    top.layoutSizingHorizontal = 'FILL';
    c.appendChild(top);
    c.appendChild(txt(title, outfit('SemiBold'), 16, dark ? DARK_TEXT : INK, w - 48));
    c.appendChild(txt(desc, outfit('Regular'), 13, dark ? DARK_MUTED : MUTED, w - 48));
    c.appendChild(txt('↗', outfit('SemiBold'), 14, dark ? BRAND500 : BRAND800));
    return c;
  }
  function sectionIntro(title, desc) {
    const s = al('VERTICAL', title + ' intro');
    s.itemSpacing = 6;
    s.appendChild(txt(title, outfit('SemiBold'), 18, INK));
    s.appendChild(txt(desc, outfit('Regular'), 13, MUTED, 640));
    return s;
  }
  const skillCards = al('HORIZONTAL', 'Skills');
  skillCards.itemSpacing = 16;
  skillCards.layoutWrap = 'WRAP';
  skillCards.resize(672, 10);
  skillCards.layoutSizingHorizontal = 'FIXED';
  skillCards.layoutSizingVertical = 'HUG';
  skillCards.appendChild(modeCard('Слепая печать', 'Старт', 'neutral', 'Ряды клавиш, слова и фразы. WPM, точность и подсветка следующей клавиши.'));
  skillCards.appendChild(modeCard('Рабочий стол', 'Старт', 'neutral', 'Проводник Windows: папки, файлы и задания курса «Первый ноутбук» — без зубрёжки hotkeys.'));
  skillCards.appendChild(modeCard('VS Code симулятор', 'Ядро', 'brand', 'Explorer, миссии и проверка шагов — папки и файлы как в настоящем редакторе.'));
  skillCards.appendChild(modeCard('Hotkeys', 'Ядро', 'brand', 'Сочетания из курсов без подсказок — до мышечной памяти.'));
  const speedChallenge = al('HORIZONTAL', 'Speed challenge');
  speedChallenge.primaryAxisAlignItems = 'SPACE_BETWEEN';
  speedChallenge.counterAxisAlignItems = 'CENTER';
  speedChallenge.itemSpacing = 16;
  speedChallenge.paddingLeft = speedChallenge.paddingRight = 20;
  speedChallenge.paddingTop = speedChallenge.paddingBottom = 16;
  speedChallenge.cornerRadius = 16;
  speedChallenge.fills = [solid(WHITE)];
  speedChallenge.strokes = [solid(INK, 0.12)];
  speedChallenge.resize(672, 10);
  speedChallenge.layoutSizingHorizontal = 'FIXED';
  speedChallenge.layoutSizingVertical = 'HUG';
  const speedLeft = al('HORIZONTAL', 'speed label');
  speedLeft.itemSpacing = 12;
  speedLeft.counterAxisAlignItems = 'CENTER';
  const speedIcon = figma.createRectangle();
  speedIcon.resize(40, 40);
  speedIcon.cornerRadius = 12;
  speedIcon.fills = [solid(BRAND50)];
  speedLeft.appendChild(speedIcon);
  const speedCopy = al('VERTICAL', 'speed copy');
  speedCopy.itemSpacing = 2;
  speedCopy.appendChild(txt('Скорость', outfit('SemiBold'), 14, INK));
  speedCopy.appendChild(txt('60 секунд на реакцию: комбо, очки и точность под давлением.', outfit('Regular'), 13, MUTED, 380));
  speedLeft.appendChild(speedCopy);
  speedChallenge.appendChild(speedLeft);
  speedChallenge.appendChild(instSecondary('Начать испытание'));
  const reinforceCards = al('HORIZONTAL', 'Reinforce');
  reinforceCards.itemSpacing = 16;
  reinforceCards.layoutWrap = 'WRAP';
  reinforceCards.resize(672, 10);
  reinforceCards.layoutSizingHorizontal = 'FIXED';
  reinforceCards.layoutSizingVertical = 'HUG';
  reinforceCards.appendChild(modeCard('Повторение', 'Курс', 'neutral', 'Карточки одного курса: сочетание и программа, без давления.', 213));
  reinforceCards.appendChild(modeCard('Основы hotkeys', 'Курс', 'neutral', '25 вопросов: базовый уровень (1–19) и практика (20–25).', 213));
  reinforceCards.appendChild(modeCard('Экзамен', 'Курс', 'neutral', 'Вопросы по курсу на время, без подсказок — как финальная проверка.', 213));
  const journey = al('VERTICAL', 'Journey');
  journey.itemSpacing = 8;
  journey.paddingTop = journey.paddingBottom = 20;
  journey.paddingLeft = journey.paddingRight = 20;
  journey.cornerRadius = 24;
  journey.fills = [solid(WHITE)];
  journey.strokes = [solid(BRAND, 0.25)];
  journey.appendChild(txt('С чего начать сегодня', outfit('Bold'), 11, BRAND800));
  journey.appendChild(txt('Рекомендуемый маршрут', fraunces('SemiBold'), 20, INK));
  journey.appendChild(txt('Сначала печать и файлы, потом курс. Скорость — когда база уже есть.', outfit('Regular'), 13, MUTED, 680));
  for (const [n, step] of [
    ['1', 'Слепая печать — уверенность в пальцах'],
    ['2', 'Симулятор — папки и файлы без страха'],
    ['3', 'Курс «Первый ноутбук» — закрепить знания'],
    ['4', 'Hotkeys и путь разработчика — дальше по карте'],
  ]) {
    const row = al('HORIZONTAL', step);
    row.itemSpacing = 12;
    row.counterAxisAlignItems = 'CENTER';
    const num = al('HORIZONTAL', n);
    num.primaryAxisAlignItems = 'CENTER';
    num.counterAxisAlignItems = 'CENTER';
    num.resize(24, 24);
    num.layoutSizingHorizontal = 'FIXED';
    num.layoutSizingVertical = 'FIXED';
    num.cornerRadius = 99;
    num.fills = [solid(BRAND50)];
    num.appendChild(txt(n, outfit('Bold'), 11, BRAND800));
    row.appendChild(num);
    row.appendChild(txt(step, outfit('Regular'), 13, MUTED, 600));
    journey.appendChild(row);
  }
  journey.appendChild(instPrimary('Открыть «Первый ноутбук»'));

  const quiz = al('VERTICAL', 'Quiz');
  quiz.itemSpacing = 10;
  quiz.appendChild(txt('Основы hotkeys', outfit('SemiBold'), 18, INK));
  quiz.appendChild(txt('Какое сочетание сохраняет файл?', outfit('Regular'), 14, MUTED, 680));
  for (const [opt, on] of [
    ['Ctrl + S', true],
    ['Ctrl + P', false],
    ['Alt + F4', false],
  ]) {
    const row = al('HORIZONTAL', opt);
    row.paddingTop = row.paddingBottom = 10;
    row.paddingLeft = row.paddingRight = 12;
    row.cornerRadius = 12;
    row.fills = [solid(on ? BRAND50 : WHITE)];
    row.strokes = [solid(on ? BRAND : INK, on ? 1 : 0.1)];
    row.appendChild(txt(opt, outfit('Medium'), 14, INK));
    quiz.appendChild(row);
  }

  const quizPicked = al('VERTICAL', 'Quiz picked');
  quizPicked.itemSpacing = 10;
  quizPicked.appendChild(txt('Основы hotkeys', outfit('SemiBold'), 18, INK));
  quizPicked.appendChild(txt('Правильно!', outfit('SemiBold'), 14, SUCCESS));
  quizPicked.appendChild(txt('Ctrl + S — сохраняет текущий файл.', outfit('Regular'), 13, MUTED, 680));
  quizPicked.appendChild(instPrimary('Дальше'));

  const quizDone = al('VERTICAL', 'Quiz done');
  quizDone.itemSpacing = 10;
  quizDone.appendChild(txt('Основы hotkeys — готово', outfit('SemiBold'), 22, INK));
  quizDone.appendChild(txt('18 из 25', outfit('SemiBold'), 18, BRAND));
  quizDone.appendChild(txt('Лучшая серия: 7', outfit('Regular'), 13, MUTED));
  quizDone.appendChild(instPrimary('Ещё раз'));

  const exam = al('VERTICAL', 'Exam setup');
  exam.itemSpacing = 12;
  exam.appendChild(txt('ЭКЗАМЕН', outfit('Bold'), 11, BRAND800));
  exam.appendChild(txt('Настройка сессии', fraunces('Bold'), 32, INK));
  exam.appendChild(
    txt(
      'Выберите курс, объём и лимит времени. По истечении минут экзамен завершится автоматически.',
      outfit('Regular'),
      13,
      MUTED,
      680,
    ),
  );
  const examCard = al('VERTICAL', 'GlassCard');
  examCard.itemSpacing = 16;
  examCard.paddingTop = examCard.paddingBottom = 24;
  examCard.paddingLeft = examCard.paddingRight = 24;
  examCard.cornerRadius = 24;
  examCard.fills = [solid(WHITE)];
  examCard.appendChild(txt('Курс', outfit('SemiBold'), 13, INK));
  examCard.appendChild(field('Курс', 'Все курсы', INK));
  examCard.appendChild(txt('Число вопросов', outfit('SemiBold'), 13, INK));
  const qRow = al('HORIZONTAL', 'questions');
  qRow.itemSpacing = 8;
  for (const n of [10, 20, 30, 50]) {
    const chip = al('HORIZONTAL', String(n));
    chip.paddingLeft = chip.paddingRight = 14;
    chip.paddingTop = chip.paddingBottom = 10;
    chip.minHeight = 44;
    chip.cornerRadius = 12;
    chip.fills = [solid(n === 20 ? BRAND : WHITE)];
    chip.strokes = [solid(n === 20 ? BRAND : INK, n === 20 ? 1 : 0.12)];
    chip.appendChild(txt(String(n), outfit('SemiBold'), 13, n === 20 ? WHITE : INK));
    qRow.appendChild(chip);
  }
  examCard.appendChild(qRow);
  examCard.appendChild(txt('Лимит времени', outfit('SemiBold'), 13, INK));
  const mRow = al('HORIZONTAL', 'minutes');
  mRow.itemSpacing = 8;
  for (const n of [5, 10, 15, 20]) {
    const chip = al('HORIZONTAL', String(n));
    chip.paddingLeft = chip.paddingRight = 14;
    chip.paddingTop = chip.paddingBottom = 10;
    chip.minHeight = 44;
    chip.cornerRadius = 12;
    chip.fills = [solid(n === 10 ? BRAND : WHITE)];
    chip.strokes = [solid(n === 10 ? BRAND : INK, n === 10 ? 1 : 0.12)];
    chip.appendChild(txt(n + ' мин', outfit('SemiBold'), 13, n === 10 ? WHITE : INK));
    mRow.appendChild(chip);
  }
  examCard.appendChild(mRow);
  const summary = al('VERTICAL', 'Ваша сессия');
  summary.itemSpacing = 8;
  summary.paddingTop = summary.paddingBottom = 16;
  summary.paddingLeft = summary.paddingRight = 16;
  summary.cornerRadius = 16;
  summary.fills = [solid({ r: 0.976, g: 0.98, b: 0.984 })];
  summary.appendChild(txt('ВАША СЕССИЯ', outfit('Bold'), 10, MUTED));
  summary.appendChild(txt('20 вопросов · 10 мин · ~30 сек. · Все курсы', outfit('Regular'), 13, INK, 600));
  examCard.appendChild(summary);
  examCard.appendChild(instPrimary('Начать экзамен'));
  exam.appendChild(examCard);

  const examEmpty = al('VERTICAL', 'Exam empty');
  examEmpty.itemSpacing = 10;
  examEmpty.primaryAxisAlignItems = 'CENTER';
  examEmpty.appendChild(txt('Нет вопросов', outfit('SemiBold'), 22, INK));
  examEmpty.appendChild(txt('Выберите другой курс или запустите backend.', outfit('Regular'), 13, MUTED, 520));
  examEmpty.appendChild(instPrimary('Назад к настройке'));

  const review = al('VERTICAL', 'Review card');
  review.itemSpacing = 12;
  review.paddingTop = review.paddingBottom = 32;
  review.paddingLeft = review.paddingRight = 24;
  review.cornerRadius = 24;
  review.fills = [solid(WHITE)];
  review.resize(320, 10);
  review.layoutSizingHorizontal = 'FIXED';
  review.layoutSizingVertical = 'HUG';
  review.primaryAxisAlignItems = 'CENTER';
  review.appendChild(txt('Ctrl + S', outfit('SemiBold'), 28, INK));
  review.appendChild(txt('Нажмите, чтобы перевернуть', outfit('Regular'), 12, MUTED));

  const sim = al('VERTICAL', 'Code Lab');
  sim.fills = [solid({ r: 0.118, g: 0.118, b: 0.118 })];
  sim.paddingTop = sim.paddingBottom = 24;
  sim.paddingLeft = sim.paddingRight = 24;
  sim.itemSpacing = 12;
  sim.resize(960, 280);
  sim.layoutSizingHorizontal = 'FIXED';
  sim.layoutSizingVertical = 'FIXED';
  sim.appendChild(txt('VS Code Simulator  ·  no Navbar / Footer / BottomNav  ·  #1e1e1e', outfit('Regular'), 13, WHITE, 900));
  const panes = al('HORIZONTAL', 'panes');
  panes.itemSpacing = 8;
  const explorer = al('VERTICAL', 'Explorer');
  explorer.fills = [solid({ r: 0.145, g: 0.145, b: 0.145 })];
  explorer.paddingTop = explorer.paddingBottom = 12;
  explorer.paddingLeft = explorer.paddingRight = 12;
  explorer.resize(200, 180);
  explorer.layoutSizingHorizontal = 'FIXED';
  explorer.layoutSizingVertical = 'FIXED';
  explorer.appendChild(txt('EXPLORER', outfit('Bold'), 10, { r: 0.8, g: 0.8, b: 0.8 }));
  explorer.appendChild(txt('src\n  App.tsx', outfit('Regular'), 12, WHITE));
  const editor = al('VERTICAL', 'Editor');
  editor.fills = [solid({ r: 0.118, g: 0.118, b: 0.118 })];
  editor.paddingTop = editor.paddingBottom = 12;
  editor.paddingLeft = editor.paddingRight = 12;
  editor.resize(700, 180);
  editor.layoutSizingHorizontal = 'FIXED';
  editor.layoutSizingVertical = 'FIXED';
  editor.appendChild(txt('App.tsx', outfit('Regular'), 12, WHITE));
  panes.appendChild(explorer);
  panes.appendChild(editor);
  sim.appendChild(panes);

  const desk = al('VERTICAL', 'Desktop');
  desk.fills = [solid({ r: 0.05, g: 0.35, b: 0.55 })];
  desk.paddingTop = 24;
  desk.paddingLeft = desk.paddingRight = 24;
  desk.itemSpacing = 12;
  desk.resize(960, 280);
  desk.layoutSizingHorizontal = 'FIXED';
  desk.layoutSizingVertical = 'FIXED';
  desk.appendChild(txt('Рабочий стол · проводник  ·  ImmersiveSimulator', outfit('Regular'), 13, WHITE));
  const folder = al('VERTICAL', 'Folder');
  folder.itemSpacing = 4;
  folder.primaryAxisAlignItems = 'CENTER';
  const folderIcon = figma.createRectangle();
  folderIcon.resize(48, 36);
  folderIcon.cornerRadius = 4;
  folderIcon.fills = [solid({ r: 0.96, g: 0.78, b: 0.2 })];
  folder.appendChild(folderIcon);
  folder.appendChild(txt('Documents', outfit('Regular'), 11, WHITE));
  desk.appendChild(folder);

  const mobile = al('VERTICAL', 'Mobile Home 390');
  mobile.itemSpacing = 0;
  mobile.fills = [solid(PAPER)];
  mobile.strokes = [solid(INK, 0.1)];
  mobile.resize(390, 10);
  mobile.layoutSizingHorizontal = 'FIXED';
  mobile.layoutSizingVertical = 'HUG';
  const mnav = al('HORIZONTAL', 'Mobile header');
  mnav.primaryAxisAlignItems = 'SPACE_BETWEEN';
  mnav.counterAxisAlignItems = 'CENTER';
  mnav.paddingLeft = mnav.paddingRight = 16;
  mnav.resize(390, 56);
  mnav.layoutSizingHorizontal = 'FIXED';
  mnav.layoutSizingVertical = 'FIXED';
  mnav.fills = [solid(WHITE)];
  mnav.appendChild(txt('KeyMaster', fraunces('SemiBold'), 16, INK));
  mnav.appendChild(txt('☰', outfit('Bold'), 16, INK));
  const mbody = al('VERTICAL', 'body');
  mbody.paddingTop = mbody.paddingBottom = 24;
  mbody.paddingLeft = mbody.paddingRight = 16;
  mbody.itemSpacing = 10;
  mbody.appendChild(txt('KeyMaster', fraunces('Bold'), 32, INK));
  mbody.appendChild(txt('От первого ноутбука — до мастерства клавиатуры', outfit('Regular'), 13, MUTED, 358));
  mbody.appendChild(instPrimary('Начать бесплатно'));
  const bnav = al('HORIZONTAL', 'BottomNav');
  bnav.primaryAxisAlignItems = 'SPACE_BETWEEN';
  bnav.paddingLeft = bnav.paddingRight = 8;
  bnav.paddingTop = 6;
  bnav.paddingBottom = 10;
  bnav.resize(390, 56);
  bnav.layoutSizingHorizontal = 'FIXED';
  bnav.layoutSizingVertical = 'FIXED';
  bnav.fills = [solid(WHITE)];
  bnav.strokes = [solid(INK, 0.08)];
  for (const [label, on] of [
    ['Курсы', true],
    ['Мой путь', false],
    ['Практика', false],
    ['Рейтинг', false],
  ]) {
    const insted = instBottomNav(on, label);
    if (insted) {
      bnav.appendChild(insted);
      continue;
    }
    const it = al('VERTICAL', label);
    it.primaryAxisAlignItems = 'CENTER';
    it.itemSpacing = 2;
    it.resize(80, 44);
    it.layoutSizingHorizontal = 'FIXED';
    it.layoutSizingVertical = 'FIXED';
    it.appendChild(txt('•', outfit('Bold'), 14, on ? BRAND : MUTED));
    it.appendChild(txt(label, outfit('SemiBold'), 10, on ? BRAND : MUTED));
    bnav.appendChild(it);
  }
  mobile.appendChild(mnav);
  mobile.appendChild(mbody);
  mobile.appendChild(bnav);

  const podium = al('VERTICAL', 'Podium');
  podium.itemSpacing = 16;
  podium.primaryAxisAlignItems = 'CENTER';
  const solo = al('VERTICAL', '#1 Анна');
  solo.itemSpacing = 6;
  solo.primaryAxisAlignItems = 'CENTER';
  solo.paddingTop = solo.paddingBottom = 20;
  solo.paddingLeft = solo.paddingRight = 16;
  solo.cornerRadius = 16;
  solo.fills = [solid(WHITE)];
  solo.strokes = [solid(ACCENT, 0.5)];
  solo.resize(220, 10);
  solo.layoutSizingHorizontal = 'FIXED';
  solo.layoutSizingVertical = 'HUG';
  const crown = figma.createEllipse();
  crown.resize(40, 40);
  crown.fills = [solid({ r: 0.961, g: 0.769, b: 0.157 })];
  solo.appendChild(crown);
  solo.appendChild(txt('#1', outfit('Bold'), 11, MUTED));
  solo.appendChild(txt('Анна', outfit('SemiBold'), 16, INK));
  solo.appendChild(txt('@learner', outfit('Regular'), 12, MUTED));
  const xpPill = al('HORIZONTAL', '0 XP');
  xpPill.itemSpacing = 4;
  xpPill.paddingLeft = xpPill.paddingRight = 10;
  xpPill.paddingTop = xpPill.paddingBottom = 4;
  xpPill.cornerRadius = 8;
  xpPill.fills = [solid(SUCCESS, 0.12)];
  xpPill.appendChild(txt('0 XP', outfit('Bold'), 13, SUCCESS));
  solo.appendChild(xpPill);
  solo.appendChild(txt('Новичок', outfit('Medium'), 12, BRAND800));
  podium.appendChild(solo);
  podium.appendChild(
    txt('Пройдите ещё уроки — таблица расширится, когда появятся новые игроки.', outfit('Regular'), 13, MUTED, 640),
  );

  const achRow = al('HORIZONTAL', 'Achievements');
  achRow.itemSpacing = 12;
  for (const label of ['Первая победа', 'Первый ноутбук', '500 XP']) {
    const insted = instAchievement(true, label);
    if (insted) {
      achRow.appendChild(insted);
      continue;
    }
    const a = al('VERTICAL', label);
    a.itemSpacing = 8;
    a.primaryAxisAlignItems = 'CENTER';
    a.paddingTop = a.paddingBottom = 16;
    a.paddingLeft = a.paddingRight = 16;
    a.cornerRadius = 16;
    a.fills = [solid(WHITE)];
    a.opacity = 0.45;
    a.resize(160, 10);
    a.layoutSizingHorizontal = 'FIXED';
    a.layoutSizingVertical = 'HUG';
    const badge = figma.createRectangle();
    badge.resize(36, 36);
    badge.cornerRadius = 18;
    badge.fills = [solid(MUTED)];
    a.appendChild(badge);
    a.appendChild(txt(label, outfit('SemiBold'), 12, INK));
    a.appendChild(txt('Закрыто', outfit('Regular'), 11, MUTED));
    achRow.appendChild(a);
  }

  const statTiles = al('HORIZONTAL', 'Stats tiles');
  statTiles.itemSpacing = 12;
  statTiles.layoutWrap = 'WRAP';
  statTiles.resize(860, 10);
  statTiles.layoutSizingHorizontal = 'FIXED';
  statTiles.layoutSizingVertical = 'HUG';
  for (const [k, v] of [
    ['Изучено комбинаций', '0'],
    ['Средняя точность', '0%'],
    ['Серия дней', '1'],
    ['Среднее время ответа', '0 ms'],
    ['Лучший speed score', '0'],
    ['Лучший экзамен', '0%'],
  ]) {
    const t = al('VERTICAL', k);
    t.itemSpacing = 4;
    t.paddingTop = t.paddingBottom = 16;
    t.paddingLeft = t.paddingRight = 16;
    t.cornerRadius = 24;
    t.fills = [solid(WHITE)];
    t.resize(270, 10);
    t.layoutSizingHorizontal = 'FIXED';
    t.layoutSizingVertical = 'HUG';
    t.appendChild(txt(k, outfit('Regular'), 12, MUTED));
    t.appendChild(txt(v, outfit('SemiBold'), 22, INK));
    statTiles.appendChild(t);
  }
  const answersChart = al('VERTICAL', 'Ответы');
  answersChart.itemSpacing = 12;
  answersChart.paddingTop = answersChart.paddingBottom = 24;
  answersChart.paddingLeft = answersChart.paddingRight = 24;
  answersChart.cornerRadius = 24;
  answersChart.fills = [solid(WHITE)];
  answersChart.resize(860, 10);
  answersChart.layoutSizingHorizontal = 'FIXED';
  answersChart.layoutSizingVertical = 'HUG';
  answersChart.appendChild(txt('Ответы', outfit('SemiBold'), 16, INK));
  const bars = al('HORIZONTAL', 'chart');
  bars.itemSpacing = 48;
  bars.counterAxisAlignItems = 'MAX';
  for (const label of ['Верно', 'Ошибки']) {
    const col = al('VERTICAL', label);
    col.itemSpacing = 8;
    col.primaryAxisAlignItems = 'CENTER';
    const bar = figma.createRectangle();
    bar.resize(64, 8);
    bar.cornerRadius = 8;
    bar.fills = [solid({ r: 0.388, g: 0.4, b: 0.945 }, 0.35)];
    col.appendChild(bar);
    col.appendChild(txt(label, outfit('Regular'), 12, MUTED));
    bars.appendChild(col);
  }
  answersChart.appendChild(bars);

  function adminTabBar(active) {
    const tabs = al('HORIZONTAL', 'Admin tabs ' + active);
    tabs.itemSpacing = 8;
    for (const label of ['Обзор', 'Курсы', 'Пользователи', 'Достижения']) {
      const on = label === active;
      const tab = al('HORIZONTAL', label);
      tab.paddingLeft = tab.paddingRight = 14;
      tab.paddingTop = tab.paddingBottom = 8;
      tab.cornerRadius = 10;
      tab.fills = on ? [solid({ r: 0.114, g: 0.306, b: 0.847 })] : [solid(INK, 0.06)];
      tab.appendChild(txt(label, outfit('SemiBold'), 13, on ? WHITE : INK));
      tabs.appendChild(tab);
    }
    return tabs;
  }

  const adminTabs = adminTabBar('Обзор');

  const verifyCard = al('VERTICAL', 'Verify email');
  verifyCard.itemSpacing = 12;
  verifyCard.paddingTop = verifyCard.paddingBottom = 28;
  verifyCard.paddingLeft = verifyCard.paddingRight = 28;
  verifyCard.cornerRadius = 24;
  verifyCard.fills = [solid(WHITE)];
  verifyCard.strokes = [solid(INK, 0.1)];
  verifyCard.resize(400, 10);
  verifyCard.layoutSizingHorizontal = 'FIXED';
  verifyCard.layoutSizingVertical = 'HUG';
  verifyCard.appendChild(txt('Подтверждение email', fraunces('Bold'), 22, INK));
  verifyCard.appendChild(txt('В ссылке нет кода подтверждения', outfit('Regular'), 14, SIGNAL, 344));
  verifyCard.appendChild(secondaryBtn('Регистрация'));

  const callbackCard = al('VERTICAL', 'Auth callback');
  callbackCard.itemSpacing = 12;
  callbackCard.paddingTop = callbackCard.paddingBottom = 28;
  callbackCard.paddingLeft = callbackCard.paddingRight = 28;
  callbackCard.cornerRadius = 24;
  callbackCard.fills = [solid(WHITE)];
  callbackCard.strokes = [solid(INK, 0.1)];
  callbackCard.resize(400, 10);
  callbackCard.layoutSizingHorizontal = 'FIXED';
  callbackCard.layoutSizingVertical = 'HUG';
  callbackCard.appendChild(txt('Подтверждение email', fraunces('Bold'), 22, INK));
  const skel = figma.createRectangle();
  skel.resize(192, 40);
  skel.cornerRadius = 8;
  skel.fills = [solid(INK, 0.08)];
  callbackCard.appendChild(skel);
  callbackCard.appendChild(txt('Local auth: /auth/callback redirects to /login', outfit('Regular'), 11, MUTED, 344));

  const typingBody = al('VERTICAL', 'Typing');
  typingBody.itemSpacing = 12;
  const typingTabs = al('HORIZONTAL', 'views');
  typingTabs.itemSpacing = 8;
  for (const [label, on] of [
    ['Тренировка', true],
    ['Путь', false],
    ['Прогресс', false],
  ]) {
    const tab = al('HORIZONTAL', label);
    tab.paddingLeft = tab.paddingRight = 12;
    tab.paddingTop = tab.paddingBottom = 6;
    tab.cornerRadius = 8;
    tab.fills = on ? [solid(BRAND50)] : [TRANSPARENT];
    tab.appendChild(txt(label, outfit('SemiBold'), 12, on ? BRAND : MUTED));
    typingTabs.appendChild(tab);
  }
  typingBody.appendChild(txt('Тренажёр печати', outfit('SemiBold'), 22, INK));
  typingBody.appendChild(typingTabs);
  typingBody.appendChild(txt('the quick brown fox jumps over the lazy dog', outfit('Regular'), 18, INK, 680));
  const metrics = al('HORIZONTAL', 'metrics');
  metrics.itemSpacing = 16;
  for (const [k, v] of [
    ['WPM', '42'],
    ['Точность', '96%'],
    ['Ошибки', '2'],
  ]) {
    const m = al('VERTICAL', k);
    m.appendChild(txt(k, outfit('Regular'), 11, MUTED));
    m.appendChild(txt(v, outfit('SemiBold'), 18, INK));
    metrics.appendChild(m);
  }
  typingBody.appendChild(metrics);

  function typingSeg(active) {
    const tabs = al('HORIZONTAL', 'views');
    tabs.itemSpacing = 8;
    for (const [label, on] of [
      ['Тренировка', active === 'Тренировка'],
      ['Путь', active === 'Путь'],
      ['Прогресс', active === 'Прогресс'],
    ]) {
      const tab = al('HORIZONTAL', label);
      tab.paddingLeft = tab.paddingRight = 12;
      tab.paddingTop = tab.paddingBottom = 6;
      tab.cornerRadius = 8;
      tab.fills = on ? [solid(BRAND50)] : [TRANSPARENT];
      tab.appendChild(txt(label, outfit('SemiBold'), 12, on ? BRAND : MUTED));
      tabs.appendChild(tab);
    }
    return tabs;
  }
  const typingPath = al('VERTICAL', 'Typing path');
  typingPath.itemSpacing = 12;
  typingPath.appendChild(txt('Тренажёр печати', outfit('SemiBold'), 22, INK));
  typingPath.appendChild(typingSeg('Путь'));
  typingPath.appendChild(txt('Один шаг за раз. Откройте следующий уровень, пройдя текущий.', outfit('Regular'), 13, MUTED, 680));
  for (const [label, status] of [
    ['Домашний ряд', 'Открыто'],
    ['Слова', 'Заблокировано'],
  ]) {
    const n = al('HORIZONTAL', label);
    n.primaryAxisAlignItems = 'SPACE_BETWEEN';
    n.paddingTop = n.paddingBottom = 12;
    n.paddingLeft = n.paddingRight = 12;
    n.cornerRadius = 12;
    n.fills = [solid(WHITE)];
    n.resize(680, 10);
    n.layoutSizingHorizontal = 'FIXED';
    n.layoutSizingVertical = 'HUG';
    n.appendChild(txt(label, outfit('SemiBold'), 14, INK));
    n.appendChild(txt(status, outfit('Regular'), 12, MUTED));
    typingPath.appendChild(n);
  }
  const typingProgress = al('VERTICAL', 'Typing progress');
  typingProgress.itemSpacing = 12;
  typingProgress.appendChild(txt('Тренажёр печати', outfit('SemiBold'), 22, INK));
  typingProgress.appendChild(typingSeg('Прогресс'));
  const rec = al('HORIZONTAL', 'records');
  rec.itemSpacing = 16;
  for (const [k, v] of [
    ['Рекорд', '48 WPM'],
    ['Точность', '97%'],
    ['Подходы', '12'],
  ]) {
    const m = al('VERTICAL', k);
    m.appendChild(txt(k, outfit('Regular'), 11, MUTED));
    m.appendChild(txt(v, outfit('SemiBold'), 18, INK));
    rec.appendChild(m);
  }
  typingProgress.appendChild(rec);

  const trainBody = al('VERTICAL', 'Training');
  trainBody.itemSpacing = 10;
  trainBody.primaryAxisAlignItems = 'CENTER';
  trainBody.appendChild(txt('Тренировка горячих клавиш', outfit('SemiBold'), 20, INK));
  trainBody.appendChild(txt('Нажмите сочетание на клавиатуре', outfit('Regular'), 13, MUTED));
  const trainKeys = al('HORIZONTAL', 'combo');
  trainKeys.itemSpacing = 8;
  for (const k of ['Ctrl', 'C']) {
    const cap = instKeyCap(k);
    if (cap) {
      trainKeys.appendChild(cap);
      continue;
    }
    const box = al('HORIZONTAL', k);
    box.primaryAxisAlignItems = 'CENTER';
    box.counterAxisAlignItems = 'CENTER';
    box.minWidth = 40;
    box.minHeight = 40;
    box.paddingLeft = box.paddingRight = 12;
    box.cornerRadius = 12;
    box.fills = [solid(WHITE)];
    box.strokes = [solid(INK)];
    box.strokeWeight = 1;
    box.strokeBottomWeight = 4;
    box.appendChild(txt(k, outfit('SemiBold'), 14, INK));
    trainKeys.appendChild(box);
  }
  trainBody.appendChild(trainKeys);

  const speedBody = al('VERTICAL', 'Speed');
  speedBody.itemSpacing = 10;
  speedBody.appendChild(txt('Режим скорости', outfit('SemiBold'), 22, INK));
  speedBody.appendChild(txt('60 секунд на реакцию', outfit('Regular'), 13, MUTED));
  const speedRow = al('HORIZONTAL', 'score');
  speedRow.itemSpacing = 16;
  for (const [k, v] of [
    ['Осталось', '48'],
    ['Очки', '120'],
    ['Комбо', '4'],
  ]) {
    const m = al('VERTICAL', k);
    m.appendChild(txt(k, outfit('Regular'), 11, MUTED));
    m.appendChild(txt(v, outfit('SemiBold'), 20, INK));
    speedRow.appendChild(m);
  }
  speedBody.appendChild(speedRow);
  speedBody.appendChild(instPrimary('Старт 60 сек'));

  const speedDone = al('VERTICAL', 'Speed done');
  speedDone.itemSpacing = 12;
  speedDone.paddingTop = speedDone.paddingBottom = 24;
  speedDone.paddingLeft = speedDone.paddingRight = 24;
  speedDone.cornerRadius = 24;
  speedDone.fills = [solid(WHITE)];
  speedDone.primaryAxisAlignItems = 'CENTER';
  speedDone.resize(400, 10);
  speedDone.layoutSizingHorizontal = 'FIXED';
  speedDone.layoutSizingVertical = 'HUG';
  speedDone.appendChild(txt('Время вышло!', outfit('Bold'), 22, INK));
  const speedStats = al('HORIZONTAL', 'speed stats');
  speedStats.itemSpacing = 16;
  speedStats.layoutWrap = 'WRAP';
  for (const [k, v] of [
    ['Очки', '0'],
    ['Комбо (макс.)', '0'],
    ['Точность', '0%'],
    ['Правильно', '0/0'],
  ]) {
    const m = al('VERTICAL', k);
    m.itemSpacing = 4;
    m.resize(160, 10);
    m.layoutSizingHorizontal = 'FIXED';
    m.layoutSizingVertical = 'HUG';
    m.appendChild(txt(k, outfit('Regular'), 11, MUTED));
    m.appendChild(txt(v, outfit('Bold'), 20, INK));
    speedStats.appendChild(m);
  }
  speedDone.appendChild(speedStats);
  speedDone.appendChild(instPrimary('Ещё раз'));

  const examRun = al('VERTICAL', 'Exam run');
  examRun.itemSpacing = 12;
  const examRunHead = al('HORIZONTAL', 'run head');
  examRunHead.primaryAxisAlignItems = 'SPACE_BETWEEN';
  examRunHead.counterAxisAlignItems = 'CENTER';
  examRunHead.resize(680, 10);
  examRunHead.layoutSizingHorizontal = 'FIXED';
  examRunHead.layoutSizingVertical = 'HUG';
  const examRunMeta = al('HORIZONTAL', 'meta');
  examRunMeta.itemSpacing = 8;
  examRunMeta.counterAxisAlignItems = 'CENTER';
  examRunMeta.appendChild(txt('Экзамен · 3/20', outfit('Medium'), 13, MUTED));
  examRunMeta.appendChild(pill('Все курсы', { r: 0.976, g: 0.98, b: 0.984 }, MUTED));
  examRunHead.appendChild(examRunMeta);
  const timerChip = al('HORIZONTAL', 'timer');
  timerChip.paddingLeft = timerChip.paddingRight = 12;
  timerChip.paddingTop = timerChip.paddingBottom = 6;
  timerChip.cornerRadius = 12;
  timerChip.fills = [solid({ r: 0.976, g: 0.98, b: 0.984 })];
  timerChip.appendChild(txt('8:12', outfit('Bold'), 13, INK));
  examRunHead.appendChild(timerChip);
  examRun.appendChild(examRunHead);
  examRun.appendChild(progressBar(680, 0.82, BRAND, 4));
  examRun.appendChild(progressBar(680, 0.15, BRAND, 8));
  const scoreRow = al('HORIZONTAL', 'score');
  scoreRow.primaryAxisAlignItems = 'SPACE_BETWEEN';
  scoreRow.counterAxisAlignItems = 'CENTER';
  scoreRow.resize(680, 10);
  scoreRow.layoutSizingHorizontal = 'FIXED';
  scoreRow.layoutSizingVertical = 'HUG';
  const counts = al('HORIZONTAL', 'counts');
  counts.itemSpacing = 16;
  counts.appendChild(txt('2', outfit('SemiBold'), 14, SUCCESS));
  counts.appendChild(txt('1', outfit('SemiBold'), 14, SIGNAL));
  scoreRow.appendChild(counts);
  scoreRow.appendChild(ghostBtn('Завершить'));
  examRun.appendChild(scoreRow);
  examRun.appendChild(txt('Вопрос 3', outfit('Bold'), 11, BRAND800));
  examRun.appendChild(txt('Сохраните файл', outfit('SemiBold'), 20, INK));
  examRun.appendChild(txt('Вспомните сочетание сами — без подсказок.', outfit('Regular'), 13, MUTED, 680));

  const examFeedback = al('VERTICAL', 'Exam feedback');
  examFeedback.itemSpacing = 10;
  examFeedback.paddingTop = examFeedback.paddingBottom = 32;
  examFeedback.paddingLeft = examFeedback.paddingRight = 24;
  examFeedback.cornerRadius = 24;
  examFeedback.fills = [solid({ r: 0.925, g: 0.99, b: 0.961 })];
  examFeedback.strokes = [solid(SUCCESS, 0.4)];
  examFeedback.primaryAxisAlignItems = 'CENTER';
  examFeedback.resize(680, 10);
  examFeedback.layoutSizingHorizontal = 'FIXED';
  examFeedback.layoutSizingVertical = 'HUG';
  examFeedback.appendChild(txt('Верно!', outfit('Bold'), 24, SUCCESS));
  examFeedback.appendChild(txt('Сохраните файл', outfit('Regular'), 13, MUTED));
  examFeedback.appendChild(txt('Правильное сочетание', outfit('Medium'), 13, MUTED));
  const fbKeys = al('HORIZONTAL', 'combo');
  fbKeys.itemSpacing = 8;
  for (const k of ['Ctrl', 'S']) {
    const cap = instKeyCap(k);
    if (cap) {
      fbKeys.appendChild(cap);
      continue;
    }
    const box = al('HORIZONTAL', k);
    box.primaryAxisAlignItems = 'CENTER';
    box.counterAxisAlignItems = 'CENTER';
    box.minWidth = 40;
    box.minHeight = 40;
    box.paddingLeft = box.paddingRight = 12;
    box.cornerRadius = 12;
    box.fills = [solid(WHITE)];
    box.strokes = [solid(INK)];
    box.strokeWeight = 1;
    box.strokeBottomWeight = 4;
    box.appendChild(txt(k, outfit('SemiBold'), 14, INK));
    fbKeys.appendChild(box);
  }
  examFeedback.appendChild(fbKeys);
  examFeedback.appendChild(txt('Ctrl + S', outfit('SemiBold'), 18, INK));
  examFeedback.appendChild(txt('Следующий вопрос через 2…', outfit('Regular'), 13, MUTED));
  examFeedback.appendChild(txt('Перейти сразу', outfit('SemiBold'), 13, BRAND800));

  const examWrong = al('VERTICAL', 'Exam wrong');
  examWrong.itemSpacing = 10;
  examWrong.paddingTop = examWrong.paddingBottom = 32;
  examWrong.paddingLeft = examWrong.paddingRight = 24;
  examWrong.cornerRadius = 24;
  examWrong.fills = [solid(SIGNAL, 0.08)];
  examWrong.strokes = [solid(SIGNAL, 0.4)];
  examWrong.primaryAxisAlignItems = 'CENTER';
  examWrong.resize(680, 10);
  examWrong.layoutSizingHorizontal = 'FIXED';
  examWrong.layoutSizingVertical = 'HUG';
  examWrong.appendChild(txt('Неверно', outfit('Bold'), 24, SIGNAL));
  examWrong.appendChild(txt('К следующему слову', outfit('Regular'), 13, MUTED));
  examWrong.appendChild(txt('Правильное сочетание', outfit('Medium'), 13, MUTED));
  const wrongKeys = al('HORIZONTAL', 'combo');
  wrongKeys.itemSpacing = 8;
  for (const k of ['Ctrl', '→']) {
    const cap = instKeyCap(k);
    if (cap) {
      wrongKeys.appendChild(cap);
      continue;
    }
    const box = al('HORIZONTAL', k);
    box.primaryAxisAlignItems = 'CENTER';
    box.counterAxisAlignItems = 'CENTER';
    box.minWidth = 40;
    box.minHeight = 40;
    box.paddingLeft = box.paddingRight = 12;
    box.cornerRadius = 12;
    box.fills = [solid(WHITE)];
    box.strokes = [solid(INK)];
    box.appendChild(txt(k, outfit('SemiBold'), 14, INK));
    wrongKeys.appendChild(box);
  }
  examWrong.appendChild(wrongKeys);
  examWrong.appendChild(txt('Ctrl + →', outfit('SemiBold'), 18, INK));
  examWrong.appendChild(txt('Следующий вопрос через 3…', outfit('Regular'), 13, MUTED));
  examWrong.appendChild(txt('Перейти сразу', outfit('SemiBold'), 13, BRAND800));

  const examDone = al('VERTICAL', 'Exam done');
  examDone.itemSpacing = 12;
  examDone.paddingTop = examDone.paddingBottom = 24;
  examDone.paddingLeft = examDone.paddingRight = 24;
  examDone.cornerRadius = 24;
  examDone.fills = [solid(WHITE)];
  examDone.resize(520, 10);
  examDone.layoutSizingHorizontal = 'FIXED';
  examDone.layoutSizingVertical = 'HUG';
  examDone.appendChild(txt('ИТОГИ ЭКЗАМЕНА', outfit('Bold'), 11, BRAND800));
  examDone.appendChild(txt('Сессия завершена', fraunces('Bold'), 30, INK));
  const gradeRow = al('HORIZONTAL', 'grade');
  gradeRow.itemSpacing = 16;
  gradeRow.counterAxisAlignItems = 'CENTER';
  const gradeBox = al('HORIZONTAL', 'D');
  gradeBox.primaryAxisAlignItems = 'CENTER';
  gradeBox.counterAxisAlignItems = 'CENTER';
  gradeBox.resize(64, 64);
  gradeBox.layoutSizingHorizontal = 'FIXED';
  gradeBox.layoutSizingVertical = 'FIXED';
  gradeBox.cornerRadius = 16;
  gradeBox.strokes = [solid(INK, 0.16)];
  gradeBox.appendChild(txt('D', outfit('Bold'), 24, MUTED));
  gradeRow.appendChild(gradeBox);
  const gradeCopy = al('VERTICAL', 'pct');
  gradeCopy.itemSpacing = 4;
  gradeCopy.appendChild(txt('0%', outfit('Bold'), 30, INK));
  gradeCopy.appendChild(txt('Стоит повторить материал', outfit('Regular'), 13, MUTED));
  gradeRow.appendChild(gradeCopy);
  examDone.appendChild(gradeRow);
  examDone.appendChild(progressBar(472, 0.02, MUTED, 8));
  const statsGrid = al('HORIZONTAL', 'result stats');
  statsGrid.itemSpacing = 8;
  statsGrid.layoutWrap = 'WRAP';
  statsGrid.resize(472, 10);
  statsGrid.layoutSizingHorizontal = 'FIXED';
  statsGrid.layoutSizingVertical = 'HUG';
  for (const [k, v] of [
    ['Верно', '0'],
    ['Ошибок', '0'],
    ['Точность ответов', '0%'],
    ['Пройдено', '0/20'],
    ['Без ответа', '20'],
    ['Время', '0:08'],
  ]) {
    const st = al('VERTICAL', k);
    st.itemSpacing = 4;
    st.paddingTop = st.paddingBottom = 12;
    st.paddingLeft = st.paddingRight = 12;
    st.cornerRadius = 16;
    st.fills = [solid({ r: 0.976, g: 0.98, b: 0.984 })];
    st.resize(228, 10);
    st.layoutSizingHorizontal = 'FIXED';
    st.layoutSizingVertical = 'HUG';
    st.appendChild(txt(k, outfit('Bold'), 10, MUTED));
    st.appendChild(txt(v, outfit('Bold'), 20, INK));
    statsGrid.appendChild(st);
  }
  examDone.appendChild(statsGrid);
  const doneBtns = al('HORIZONTAL', 'done actions');
  doneBtns.itemSpacing = 8;
  doneBtns.appendChild(instPrimary('Новый экзамен'));
  doneBtns.appendChild(secondaryBtn('К пути'));
  examDone.appendChild(doneBtns);

  const reviewBack = al('VERTICAL', 'Review flipped');
  reviewBack.itemSpacing = 12;
  reviewBack.paddingTop = reviewBack.paddingBottom = 32;
  reviewBack.paddingLeft = reviewBack.paddingRight = 24;
  reviewBack.cornerRadius = 24;
  reviewBack.fills = [solid(BRAND50)];
  reviewBack.resize(320, 10);
  reviewBack.layoutSizingHorizontal = 'FIXED';
  reviewBack.layoutSizingVertical = 'HUG';
  reviewBack.appendChild(txt('Что делает', outfit('Bold'), 11, BRAND));
  reviewBack.appendChild(txt('Сохраняет текущий файл в редакторе.', outfit('Regular'), 14, INK, 272));
  reviewBack.appendChild(txt('На лицевую сторону', outfit('Regular'), 12, MUTED));

  const gate = al('VERTICAL', 'Keyboard gate');
  gate.itemSpacing = 0;
  gate.fills = [solid(PAPER)];
  gate.strokes = [solid(INK, 0.1)];
  gate.resize(390, 10);
  gate.layoutSizingHorizontal = 'FIXED';
  gate.layoutSizingVertical = 'HUG';
  const gnav = al('HORIZONTAL', 'header');
  gnav.paddingLeft = gnav.paddingRight = 16;
  gnav.counterAxisAlignItems = 'CENTER';
  gnav.resize(390, 56);
  gnav.layoutSizingHorizontal = 'FIXED';
  gnav.layoutSizingVertical = 'FIXED';
  gnav.fills = [solid(WHITE)];
  gnav.appendChild(txt('KeyMaster', fraunces('SemiBold'), 16, INK));
  const gbody = al('VERTICAL', 'gate body');
  gbody.paddingTop = gbody.paddingBottom = 24;
  gbody.paddingLeft = gbody.paddingRight = 16;
  gbody.itemSpacing = 10;
  gbody.primaryAxisAlignItems = 'CENTER';
  gbody.appendChild(txt('Практика требует физической клавиатуры', outfit('SemiBold'), 18, INK, 350));
  gbody.appendChild(
    txt(
      'Для тренировки необходимо использовать компьютер или подключить Bluetooth-клавиатуру к телефону.',
      outfit('Regular'),
      13,
      MUTED,
      350,
    ),
  );
  gbody.appendChild(
    txt(
      'Нажмите любую клавишу на внешней клавиатуре — практика включится автоматически.',
      outfit('Regular'),
      11,
      MUTED,
      350,
    ),
  );
  gbody.appendChild(instPrimary('Изучить комбинации'));
  gbody.appendChild(secondaryBtn('Основы hotkeys'));
  const gbnav = al('HORIZONTAL', 'BottomNav');
  gbnav.primaryAxisAlignItems = 'SPACE_BETWEEN';
  gbnav.paddingLeft = gbnav.paddingRight = 8;
  gbnav.paddingTop = 6;
  gbnav.paddingBottom = 10;
  gbnav.resize(390, 56);
  gbnav.layoutSizingHorizontal = 'FIXED';
  gbnav.layoutSizingVertical = 'FIXED';
  gbnav.fills = [solid(WHITE)];
  for (const [label, on] of [
    ['Курсы', false],
    ['Мой путь', false],
    ['Практика', true],
    ['Рейтинг', false],
  ]) {
    const insted = instBottomNav(on, label);
    if (insted) {
      gbnav.appendChild(insted);
      continue;
    }
    const it = al('VERTICAL', label);
    it.primaryAxisAlignItems = 'CENTER';
    it.itemSpacing = 2;
    it.resize(80, 44);
    it.layoutSizingHorizontal = 'FIXED';
    it.layoutSizingVertical = 'FIXED';
    it.appendChild(txt('•', outfit('Bold'), 14, on ? BRAND : MUTED));
    it.appendChild(txt(label, outfit('SemiBold'), 10, on ? BRAND : MUTED));
    gbnav.appendChild(it);
  }
  gate.appendChild(gnav);
  gate.appendChild(gbody);
  gate.appendChild(gbnav);

  const mobileLogin = al('VERTICAL', 'Mobile Login — BottomNav hidden');
  mobileLogin.itemSpacing = 0;
  mobileLogin.fills = [solid(PAPER)];
  mobileLogin.strokes = [solid(INK, 0.1)];
  mobileLogin.resize(390, 10);
  mobileLogin.layoutSizingHorizontal = 'FIXED';
  mobileLogin.layoutSizingVertical = 'HUG';
  const mlnav = al('HORIZONTAL', 'header');
  mlnav.paddingLeft = mlnav.paddingRight = 16;
  mlnav.counterAxisAlignItems = 'CENTER';
  mlnav.resize(390, 56);
  mlnav.layoutSizingHorizontal = 'FIXED';
  mlnav.layoutSizingVertical = 'FIXED';
  mlnav.fills = [solid(WHITE)];
  mlnav.appendChild(txt('KeyMaster', fraunces('SemiBold'), 16, INK));
  const mlbody = al('VERTICAL', 'login');
  mlbody.paddingTop = mlbody.paddingBottom = 24;
  mlbody.paddingLeft = mlbody.paddingRight = 16;
  mlbody.itemSpacing = 10;
  const mlcard = al('VERTICAL', 'AuthCard');
  mlcard.itemSpacing = 10;
  mlcard.paddingTop = mlcard.paddingBottom = 20;
  mlcard.paddingLeft = mlcard.paddingRight = 16;
  mlcard.cornerRadius = 24;
  mlcard.fills = [solid(WHITE)];
  mlcard.appendChild(txt('Вход', outfit('SemiBold'), 20, INK));
  mlcard.appendChild(floatOrInst('State=Default', 'Email', { width: 326 }));
  mlcard.appendChild(floatOrInst('State=Password', 'Пароль', { password: true, width: 326 }));
  mlcard.appendChild(instPrimary('Войти'));
  mlbody.appendChild(mlcard);
  mlbody.appendChild(txt('BottomNav hidden on /login /register', outfit('Regular'), 11, MUTED, 358));
  mobileLogin.appendChild(mlnav);
  mobileLogin.appendChild(mlbody);

  board.appendChild(
    section('MarketingShell', [
      marketingPage('Home /', 'Главная', true, homeBody),
      marketingPage('Home authed /', 'Главная', false, homeAuthed),
      marketingPage('Courses /courses', 'Курсы', true, [
        txt('КАТАЛОГ', outfit('Bold'), 11, BRAND800),
        txt('Каталог курсов', outfit('SemiBold'), 28, INK),
        txt('Выберите инструмент и изучайте сочетания. Прогресс сохраняется и отображается на карте пути.', outfit('Regular'), 13, MUTED, 860),
        field('Поиск', 'Название курса или инструмента', INK),
        filterRow,
        txt('Один layout карточки · статусы Старт / В процессе / Готово / Обязательный старт', outfit('Regular'), 13, MUTED, 860),
        coursesRow,
      ]),
      marketingPage('Course detail /courses/:slug', 'Курсы', true, [
        pill('Обязательный старт', { r: 0.114, g: 0.306, b: 0.847 }, WHITE),
        txt('Первый ноутбук: файлы и папки', outfit('SemiBold'), 28, INK),
        txt('1 layout × 20 slugs. Не дублировать каталог.', outfit('Regular'), 13, MUTED, 720),
        (() => {
          const row = al('HORIZONTAL', 'Lesson 1 status');
          row.itemSpacing = 8;
          row.counterAxisAlignItems = 'CENTER';
          row.appendChild(txt('Урок 1 · Горячие клавиши', outfit('Regular'), 14, INK));
          row.appendChild(instLearn(true) || txt('Изучено', outfit('Bold'), 10, SUCCESS));
          return row;
        })(),
        (() => {
          const row = al('HORIZONTAL', 'Lesson 2 status');
          row.itemSpacing = 8;
          row.counterAxisAlignItems = 'CENTER';
          row.appendChild(txt('Урок 2 · Задание · симулятор', outfit('Regular'), 14, INK));
          row.appendChild(instLearn(false) || txt('Не изучено', outfit('Bold'), 10, MUTED));
          return row;
        })(),
      ]),
      marketingPage('Lesson hotkey /lessons/:id', 'Курсы', false, [lessonHotkey]),
      marketingPage('Lesson task /lessons/:id', 'Курсы', false, [lessonTask]),
      marketingPage('Lesson study-only /lessons/:id', 'Курсы', false, [lessonStudy]),
      marketingPage('Path /path', 'Мой путь', false, [
        txt('МОЙ ПУТЬ РАЗВИТИЯ', outfit('Bold'), 11, BRAND800),
        txt('Developer Growth Path', fraunces('Bold'), 32, INK),
        txt('От первого ноутбука до инструментов профи: файлы → печать и hotkeys → VS Code и дальше. Курсы те же — путь понятнее.', outfit('Regular'), 13, MUTED, 800),
        txt('Не дублировать каждый узел курса — 5 статусов покрывают карту.', outfit('Regular'), 12, MUTED, 800),
        pathRow,
      ]),
      marketingPage('Dashboard /dashboard', '', false, [dash]),
      marketingPage('Leaderboard /leaderboard', 'Рейтинг', true, [
        txt('СОРЕВНОВАНИЕ', outfit('Bold'), 11, BRAND800),
        txt('Рейтинг', fraunces('Bold'), 32, INK),
        txt('Топ учеников KeyMaster по XP. Тренируйтесь, поднимайтесь выше и держите серию.', outfit('Regular'), 13, MUTED, 800),
        (() => {
          const periods = al('HORIZONTAL', 'Period filter');
          periods.itemSpacing = 4;
          periods.paddingTop = periods.paddingBottom = periods.paddingLeft = periods.paddingRight = 4;
          periods.cornerRadius = 12;
          periods.fills = [solid(WHITE)];
          periods.strokes = [solid(INK, 0.1)];
          for (const [label, on] of [
            ['Всё время', true],
            ['Неделя', false],
            ['Месяц', false],
          ]) {
            const chip = al('HORIZONTAL', label);
            chip.paddingLeft = chip.paddingRight = 14;
            chip.paddingTop = chip.paddingBottom = 6;
            chip.cornerRadius = 8;
            chip.fills = on ? [solid(BRAND)] : [TRANSPARENT];
            chip.appendChild(txt(label, outfit('SemiBold'), 13, on ? WHITE : MUTED));
            periods.appendChild(chip);
          }
          return periods;
        })(),
        podium,
      ]),
      marketingPage('Achievements /achievements', '', false, [
        txt('Достижения', fraunces('Bold'), 32, INK),
        txt('Locked = grayscale. Не дублировать каждый бейдж.', outfit('Regular'), 13, MUTED, 720),
        achRow,
      ]),
      marketingPage('Stats /stats', '', false, [
        txt('Статистика', outfit('Bold'), 30, INK),
        statTiles,
        answersChart,
      ]),
      marketingPage('Admin /admin', '', false, [
        txt('Админ-панель', outfit('SemiBold'), 28, INK),
        txt('Курсы, уроки, пользователи и достижения', outfit('Regular'), 13, MUTED, 800),
        adminTabs,
        (() => {
          const grid = al('HORIZONTAL', 'Overview tiles');
          grid.itemSpacing = 12;
          grid.layoutWrap = 'WRAP';
          grid.resize(860, 10);
          grid.layoutSizingHorizontal = 'FIXED';
          grid.layoutSizingVertical = 'HUG';
          for (const [k, v] of [
            ['Пользователи', '2'],
            ['Курсы', '20'],
            ['Уроки', '193'],
            ['Достижения', '13'],
            ['Уроков пройдено', '0'],
            ['Админы', '1'],
          ]) {
            const t = al('VERTICAL', k);
            t.itemSpacing = 4;
            t.paddingTop = t.paddingBottom = 20;
            t.paddingLeft = t.paddingRight = 16;
            t.cornerRadius = 24;
            t.fills = [solid(WHITE)];
            t.resize(270, 10);
            t.layoutSizingHorizontal = 'FIXED';
            t.layoutSizingVertical = 'HUG';
            t.appendChild(txt(k, outfit('Regular'), 13, MUTED));
            t.appendChild(txt(v, outfit('Bold'), 28, INK));
            grid.appendChild(t);
          }
          return grid;
        })(),
      ], false, true),
      marketingPage('Admin courses /admin', '', false, [
        txt('Админ-панель', outfit('SemiBold'), 28, INK),
        txt('Курсы, уроки, пользователи и достижения · вкладка Курсы, тот же layout.', outfit('Regular'), 13, MUTED, 800),
        adminTabBar('Курсы'),
        field('Поиск…', 'computer-basics', INK),
        txt('Slug                  Название                         Уроки', outfit('Regular'), 12, MUTED, 800),
        txt('computer-basics       Первый ноутбук: файлы и папки    12', outfit('Regular'), 13, INK, 800),
        txt('programmer-basics     Основы программиста              18', outfit('Regular'), 13, INK, 800),
        instPrimary('Создать'),
      ], false, true),
      marketingPage('Admin users /admin', '', false, [
        txt('Админ-панель', outfit('SemiBold'), 28, INK),
        txt('Курсы, уроки, пользователи и достижения · вкладка Пользователи.', outfit('Regular'), 13, MUTED, 800),
        adminTabBar('Пользователи'),
        field('Поиск…', 'Поиск…', INK),
        txt('EMAIL                 USERNAME     ИМЯ               XP   УРОВЕНЬ  АДМИН', outfit('Regular'), 11, MUTED, 860),
        txt('learner@example.com   learner      Анна              0    1        ☐', outfit('Regular'), 13, INK, 860),
        txt('admin@example.com     siteadmin    KeyMaster Admin   0    1        ☑', outfit('Regular'), 13, INK, 860),
      ], false, true),
      marketingPage('Admin achievements /admin', '', false, [
        txt('Админ-панель', outfit('SemiBold'), 28, INK),
        txt('Вкладка Достижения · тот же layout. Не дублировать каждый бейдж.', outfit('Regular'), 13, MUTED, 800),
        adminTabBar('Достижения'),
        instPrimary('Создать'),
        (() => {
          const list = al('VERTICAL', 'Achievement CRUD');
          list.itemSpacing = 8;
          for (const [title, meta, desc] of [
            ['Первый ноутбук', 'computer-basics-complete · course_complete >= 1 · +50 XP', 'Пройдите курс «Первый ноутбук: файлы и папки»'],
            ['Первая победа', 'first-win · correct_answers >= 1 · +50 XP', 'Первый правильный ответ'],
            ['Неделя подряд', 'week-streak · streak_days >= 7 · +50 XP', '7 дней серии'],
          ]) {
            const card = al('VERTICAL', title);
            card.itemSpacing = 4;
            card.paddingTop = card.paddingBottom = 16;
            card.paddingLeft = card.paddingRight = 16;
            card.cornerRadius = 16;
            card.fills = [solid(WHITE)];
            card.strokes = [solid(INK, 0.08)];
            card.resize(860, 10);
            card.layoutSizingHorizontal = 'FIXED';
            card.layoutSizingVertical = 'HUG';
            const top = al('HORIZONTAL', 'row');
            top.primaryAxisAlignItems = 'SPACE_BETWEEN';
            top.counterAxisAlignItems = 'CENTER';
            top.appendChild(txt(title, outfit('SemiBold'), 15, INK, 680));
            top.appendChild(txt('✎  ⌫', outfit('Regular'), 13, MUTED));
            top.layoutSizingHorizontal = 'FILL';
            card.appendChild(top);
            card.appendChild(txt(meta, outfit('Regular'), 11, MUTED, 800));
            card.appendChild(txt(desc, outfit('Regular'), 13, MUTED, 800));
            list.appendChild(card);
          }
          return list;
        })(),
      ], false, true),
      marketingPage('Admin forbidden', '', false, [
        txt('Доступ только для администраторов', outfit('SemiBold'), 22, INK, 800),
      ]),
    ]),
  );
  board.appendChild(
    section('AuthCard', [
      marketingPage('Login /login', '', true, [loginCard]),
      marketingPage('Login error /login', '', true, [
        (() => {
          const toast = al('HORIZONTAL', 'toast');
          toast.itemSpacing = 8;
          toast.counterAxisAlignItems = 'CENTER';
          toast.paddingLeft = toast.paddingRight = 14;
          toast.paddingTop = toast.paddingBottom = 8;
          toast.cornerRadius = 99;
          toast.fills = [solid(WHITE)];
          toast.strokes = [solid(SIGNAL, 0.45)];
          toast.appendChild(txt('×', outfit('Bold'), 12, SIGNAL));
          toast.appendChild(txt('Неверный email или пароль', outfit('Medium'), 12, SIGNAL));
          return toast;
        })(),
        loginError,
      ]),
      marketingPage('Login OTP /login', '', true, [loginOtp]),
      marketingPage('Register /register', '', true, [registerCard]),
      marketingPage('Register password /register', '', true, [registerPassword]),
      marketingPage('Register OTP /register', '', true, [registerOtp]),
      marketingPage('Verify email /verify-email', '', true, [verifyCard]),
      marketingPage('Auth callback /auth/callback', '', true, [callbackCard]),
    ]),
  );
  board.appendChild(
    section('PracticeShell', [
      practicePage('Practice hub /practice', 'Тренировочный зал', [
        txt('Практика', outfit('Bold'), 11, BRAND800),
        txt('Тренировочный зал', outfit('SemiBold'), 24, INK),
        txt('Один вход — все режимы. Сначала навыки (печать и файлы), затем закрепление из курсов. Идите по рекомендуемому маршруту.', outfit('Regular'), 13, MUTED, 680),
        journey,
        sectionIntro('Навыки', 'Тренируйте пальцы, проводник и горячие клавиши — основа перед экзаменами.'),
        skillCards,
        speedChallenge,
        sectionIntro('Закрепление', 'Повторение, основы hotkeys и экзамен по материалам курсов — когда база уже есть.'),
        reinforceCards,
      ]),
      practicePage('Typing /typing', 'Слепая печать', [typingBody]),
      practicePage('Typing path /typing', 'Слепая печать', [typingPath]),
      practicePage('Typing progress /typing', 'Слепая печать', [typingProgress]),
      practicePage('Training /training', 'Hotkeys', [trainBody]),
      practicePage('Speed /speed', 'Скорость', [speedBody]),
      practicePage('Speed done /speed', 'Скорость', [speedDone]),
      practicePage('Quiz /quiz', 'Основы hotkeys', [quiz]),
      practicePage('Quiz picked /quiz', 'Основы hotkeys', [quizPicked]),
      practicePage('Quiz done /quiz', 'Основы hotkeys', [quizDone]),
      practicePage('Exam setup /exam', 'Экзамен', [exam]),
      practicePage('Exam empty /exam', 'Экзамен', [examEmpty]),
      practicePage('Exam run /exam', 'Экзамен', [examRun]),
      practicePage('Exam feedback /exam', 'Экзамен', [examFeedback]),
      practicePage('Exam wrong /exam', 'Экзамен', [examWrong]),
      practicePage('Exam done /exam', 'Экзамен', [examDone]),
      practicePage('Review front /review', 'Повторение', [review]),
      practicePage('Review flipped /review', 'Повторение', [reviewBack]),
    ]),
  );
  const darkLogo = figma.createRectangle();
  darkLogo.resize(72, 72);
  darkLogo.cornerRadius = 16;
  darkLogo.fills = [solid(BRAND)];
  const darkHero = al('VERTICAL', 'Dark hero');
  darkHero.itemSpacing = 12;
  darkHero.primaryAxisAlignItems = 'CENTER';
  darkHero.counterAxisAlignItems = 'CENTER';
  darkHero.appendChild(darkLogo);
  darkHero.appendChild(txt('KeyMaster', fraunces('SemiBold'), 72, DARK_TEXT));
  darkHero.appendChild(txt('От первого ноутбука — до мастерства клавиатуры', outfit('Medium'), 24, DARK_SECONDARY, 640));
  const darkCtas = al('HORIZONTAL', 'CTAs');
  darkCtas.itemSpacing = 12;
  darkCtas.appendChild(instPrimary('Начать бесплатно'));
  darkCtas.appendChild(secondaryBtn('Каталог курсов', 'dark'));
  darkHero.appendChild(darkCtas);
  const darkFeats = al('HORIZONTAL', 'Dark features');
  darkFeats.itemSpacing = 12;
  darkFeats.appendChild(
    featureTile('01', 'С нуля до уверенности', 'Сначала проводник и папки, потом текст и шорткаты — как реальная дорога новичка.', 'path', true),
  );
  darkFeats.appendChild(
    featureTile('02', 'Симулятор и печать', 'Тренируйте создание файлов в безопасной песочнице и слепую печать с подсветкой клавиш.', 'keyboard', true),
  );
  darkFeats.appendChild(
    featureTile('03', 'Hotkeys до автоматизма', 'Windows, VS Code, браузеры и IDE — живой тренажёр, XP и экзамен под ваши цели.', 'exam', true),
  );

  const darkFilterRow = al('HORIZONTAL', 'Filters');
  darkFilterRow.itemSpacing = 8;
  for (const [label, on] of [
    ['Все', true],
    ['Старт', false],
    ['ОС', false],
    ['Редакторы', false],
  ]) {
    const chip = al('HORIZONTAL', label);
    chip.paddingLeft = chip.paddingRight = 14;
    chip.paddingTop = chip.paddingBottom = 10;
    chip.minHeight = 44;
    chip.cornerRadius = 99;
    chip.fills = [solid(on ? BRAND : DARK_CARD)];
    chip.strokes = [solid(on ? BRAND : WHITE, on ? 1 : 0.1)];
    chip.appendChild(txt(label, outfit('SemiBold'), 13, on ? WHITE : DARK_MUTED));
    darkFilterRow.appendChild(chip);
  }
  const darkCoursesRow = al('HORIZONTAL', 'Course cards');
  darkCoursesRow.itemSpacing = 12;
  for (const [title, tag] of [
    ['Первый ноутбук', 'Старт'],
    ['VS Code', 'В процессе'],
    ['Git', 'Готово'],
  ]) {
    const c = al('VERTICAL', title);
    c.itemSpacing = 8;
    c.paddingTop = c.paddingBottom = 16;
    c.paddingLeft = c.paddingRight = 16;
    c.cornerRadius = 24;
    c.fills = [solid(DARK_CARD)];
    c.strokes = [solid(WHITE, 0.1)];
    c.resize(220, 10);
    c.layoutSizingHorizontal = 'FIXED';
    c.layoutSizingVertical = 'HUG';
    c.appendChild(pill(tag, BRAND50, BRAND800));
    c.appendChild(txt(title, outfit('SemiBold'), 16, DARK_TEXT, 180));
    darkCoursesRow.appendChild(c);
  }

  const darkLoginCard = authScreen(
    'Вход',
    'Добро пожаловать в KeyMaster',
    [
      floatingField('Email', '', { dark: true }),
      floatingField('Пароль', '', { password: true, dark: true }),
      instPrimary('Войти'),
    ],
    'Нет аккаунта? Регистрация',
    { dark: true },
  );

  function bottomNav390(active) {
    const bnav = al('HORIZONTAL', 'BottomNav');
    bnav.primaryAxisAlignItems = 'SPACE_BETWEEN';
    bnav.paddingLeft = bnav.paddingRight = 8;
    bnav.paddingTop = 6;
    bnav.paddingBottom = 10;
    bnav.resize(390, 56);
    bnav.layoutSizingHorizontal = 'FIXED';
    bnav.layoutSizingVertical = 'FIXED';
    bnav.fills = [solid(WHITE)];
    bnav.strokes = [solid(INK, 0.08)];
    for (const [label, key] of [
      ['Курсы', 'Курсы'],
      ['Мой путь', 'Мой путь'],
      ['Практика', 'Практика'],
      ['Рейтинг', 'Рейтинг'],
    ]) {
      const on = key === active;
      const insted = instBottomNav(on, label);
      if (insted) {
        bnav.appendChild(insted);
        continue;
      }
      const it = al('VERTICAL', label);
      it.primaryAxisAlignItems = 'CENTER';
      it.itemSpacing = 2;
      it.resize(80, 44);
      it.layoutSizingHorizontal = 'FIXED';
      it.layoutSizingVertical = 'FIXED';
      it.appendChild(txt('•', outfit('Bold'), 14, on ? BRAND : MUTED));
      it.appendChild(txt(label, outfit('SemiBold'), 10, on ? BRAND : MUTED));
      bnav.appendChild(it);
    }
    return bnav;
  }

  function mobileHeader() {
    const mnav = al('HORIZONTAL', 'Mobile header');
    mnav.primaryAxisAlignItems = 'SPACE_BETWEEN';
    mnav.counterAxisAlignItems = 'CENTER';
    mnav.paddingLeft = mnav.paddingRight = 16;
    mnav.resize(390, 56);
    mnav.layoutSizingHorizontal = 'FIXED';
    mnav.layoutSizingVertical = 'FIXED';
    mnav.fills = [solid(WHITE)];
    mnav.appendChild(txt('KeyMaster', fraunces('SemiBold'), 16, INK));
    mnav.appendChild(txt('☰', outfit('Bold'), 16, INK));
    return mnav;
  }

  function mobileFrame(name, nodes, navActive, opts) {
    const frame = al('VERTICAL', name);
    frame.itemSpacing = 0;
    frame.fills = [solid(PAPER)];
    frame.strokes = [solid(INK, 0.1)];
    frame.resize(390, 10);
    frame.layoutSizingHorizontal = 'FIXED';
    frame.layoutSizingVertical = 'HUG';
    frame.appendChild(mobileHeader());
    if (opts && opts.chips) {
      const strip = al('HORIZONTAL', 'Practice chips');
      strip.itemSpacing = 8;
      strip.paddingLeft = strip.paddingRight = 12;
      strip.paddingTop = strip.paddingBottom = 8;
      strip.fills = [solid(RAIL_BG)];
      strip.resize(390, 10);
      strip.layoutSizingHorizontal = 'FIXED';
      strip.layoutSizingVertical = 'HUG';
      for (const label of [
        'Тренировочный зал',
        'Слепая печать',
        'Рабочий стол',
        'VS Code симулятор',
        'Hotkeys',
        'Скорость',
        'Повторение',
        'Основы hotkeys',
        'Экзамен',
      ]) {
        const on = label === opts.chips;
        const chip = al('HORIZONTAL', label);
        chip.paddingLeft = chip.paddingRight = 12;
        chip.paddingTop = chip.paddingBottom = 6;
        chip.cornerRadius = 99;
        chip.fills = on ? [solid(RAIL_ACTIVE_BG)] : [TRANSPARENT];
        chip.appendChild(txt(label, outfit('SemiBold'), 11, on ? RAIL_ACTIVE_TEXT : RAIL_IDLE_TEXT));
        strip.appendChild(chip);
      }
      frame.appendChild(strip);
    }
    const body = al('VERTICAL', 'body');
    body.paddingTop = body.paddingBottom = 20;
    body.paddingLeft = body.paddingRight = 16;
    body.itemSpacing = 10;
    for (const n of nodes) body.appendChild(n);
    frame.appendChild(body);
    if (!(opts && opts.hideNav)) frame.appendChild(bottomNav390(navActive));
    return frame;
  }

  const mobileCourses = mobileFrame(
    'Mobile Courses 390',
    [
      txt('Каталог курсов', outfit('SemiBold'), 22, INK, 358),
      field('Поиск', 'Название курса или инструмента', INK),
      txt('Все · Старт · ОС · Редакторы', outfit('Regular'), 12, MUTED, 358),
      instCourse('Status=Start') || courseCard('Первый ноутбук', 'Старт', 'brand', true),
    ],
    'Курсы',
  );
  const mobilePractice = mobileFrame(
    'Mobile Practice 390',
    [
      txt('Тренировочный зал', outfit('SemiBold'), 20, INK, 358),
      txt('Навыки и закрепление. Rail hidden; chips replace 240px rail.', outfit('Regular'), 12, MUTED, 358),
      txt('Рекомендуемый маршрут', fraunces('SemiBold'), 16, INK, 358),
    ],
    'Практика',
    { chips: 'Тренировочный зал' },
  );
  const mobilePath = mobileFrame(
    'Mobile Path 390',
    [
      txt('Developer Growth Path', outfit('SemiBold'), 20, INK, 358),
      instPath('Status=Start') || pathNode('Start', 'Начать', false),
      instPath('Status=Progress') || pathNode('Первый ноутбук', 'Продолжается', false),
    ],
    'Мой путь',
  );
  const mobileReview = mobileFrame(
    'Mobile Review 390',
    [review],
    'Практика',
    { chips: 'Повторение' },
  );
  const mobileQuiz = mobileFrame(
    'Mobile Quiz 390',
    [quiz],
    'Практика',
    { chips: 'Основы hotkeys' },
  );

  const darkRegisterCard = authScreen(
    'Регистрация',
    'Добро пожаловать в KeyMaster',
    [
      floatingField('Имя', '', { dark: true, width: 360 }),
      floatingField('username', '', { dark: true, width: 360 }),
      floatingField('Email', '', { dark: true, width: 360 }),
      floatingField('Пароль', '', { password: true, dark: true, width: 360 }),
      instPrimary('Создать аккаунт'),
    ],
    'Уже есть аккаунт? Войти',
    { compact: true, dark: true },
  );

  const darkDash = al('VERTICAL', 'Dark Dashboard body');
  darkDash.itemSpacing = 16;
  darkDash.appendChild(txt('Привет, Анна!', fraunces('Bold'), 28, DARK_TEXT));
  darkDash.appendChild(txt('Личный кабинет KeyMaster', outfit('Regular'), 14, DARK_MUTED));
  const darkNext = al('VERTICAL', 'Dark NextStepCard');
  darkNext.itemSpacing = 10;
  darkNext.paddingTop = darkNext.paddingBottom = 24;
  darkNext.paddingLeft = darkNext.paddingRight = 24;
  darkNext.cornerRadius = 24;
  darkNext.fills = [solid(DARK_CARD)];
  darkNext.strokes = [solid(BRAND, 0.35)];
  darkNext.appendChild(txt('СЕГОДНЯ', outfit('Bold'), 11, BRAND500));
  darkNext.appendChild(txt('Первый ноутбук: файлы и папки', fraunces('SemiBold'), 24, DARK_TEXT, 800));
  darkNext.appendChild(txt('XP 0 · пройдено 0/20 · дальше: First Laptop', outfit('Regular'), 13, DARK_MUTED, 800));
  const darkNextBtns = al('HORIZONTAL', 'dark next ctas');
  darkNextBtns.itemSpacing = 8;
  darkNextBtns.appendChild(instPrimary('Приступить'));
  darkNextBtns.appendChild(secondaryBtn('Открыть путь обучения', 'dark'));
  darkNext.appendChild(darkNextBtns);
  darkNext.appendChild(txt('Novice Operator', outfit('Regular'), 12, DARK_MUTED));
  darkDash.appendChild(darkNext);
  darkDash.appendChild(txt('Ближайшие этапы', outfit('SemiBold'), 16, DARK_TEXT));
  darkDash.appendChild(txt('01 Начать · 02–04 Заблокировано', outfit('Regular'), 13, DARK_MUTED, 800));
  const darkTiles = al('HORIZONTAL', 'Dark stat tiles');
  darkTiles.itemSpacing = 12;
  for (const [k, v] of [
    ['Уровень', 'Новичок'],
    ['XP', '0'],
    ['Ежедневная серия', '1 дн.'],
  ]) {
    const t = al('VERTICAL', k);
    t.itemSpacing = 4;
    t.paddingTop = t.paddingBottom = 16;
    t.paddingLeft = t.paddingRight = 16;
    t.cornerRadius = 16;
    t.fills = [solid(DARK_CARD)];
    t.resize(280, 10);
    t.layoutSizingHorizontal = 'FIXED';
    t.layoutSizingVertical = 'HUG';
    t.appendChild(txt(k, outfit('Regular'), 12, DARK_MUTED));
    t.appendChild(txt(v, outfit('SemiBold'), 22, DARK_TEXT));
    darkTiles.appendChild(t);
  }
  darkDash.appendChild(darkTiles);

  const darkPathRow = al('HORIZONTAL', 'Dark Path nodes');
  darkPathRow.itemSpacing = 12;
  for (const [title, status, locked] of [
    ['Start', 'Начать', false],
    ['Первый ноутбук', 'Продолжается', false],
    ['Shortcut Legend', 'Заблокировано', true],
  ]) {
    const c = al('VERTICAL', title);
    c.itemSpacing = 8;
    c.paddingTop = c.paddingBottom = 16;
    c.paddingLeft = c.paddingRight = 16;
    c.cornerRadius = 16;
    c.fills = [solid(DARK_CARD)];
    c.strokes = [solid(locked ? WHITE : BRAND, locked ? 0.12 : 0.4)];
    c.opacity = locked ? 0.7 : 1;
    c.resize(260, 10);
    c.layoutSizingHorizontal = 'FIXED';
    c.layoutSizingVertical = 'HUG';
    c.appendChild(txt(status, outfit('Bold'), 11, locked ? DARK_MUTED : BRAND500));
    c.appendChild(txt(title, outfit('SemiBold'), 14, DARK_TEXT, 228));
    darkPathRow.appendChild(c);
  }

  board.appendChild(section('ImmersiveSimulator', [sim, desk]));
  board.appendChild(
    section('Dark · html.dark (same layouts, semantic tokens)', [
      marketingPage('Dark Home / html.dark', 'Главная', true, [darkHero, darkFeats], true),
      marketingPage('Dark Login / html.dark', '', true, [darkLoginCard], true),
      marketingPage('Dark Register / html.dark', '', true, [darkRegisterCard], true),
      marketingPage('Dark Courses / html.dark', 'Курсы', true, [
        txt('Каталог курсов', outfit('SemiBold'), 28, DARK_TEXT),
        txt('Выберите инструмент и изучайте сочетания. Прогресс сохраняется и отображается на карте пути.', outfit('Regular'), 13, DARK_MUTED, 860),
        field('Поиск', 'Название курса или инструмента', null, null, 'dark'),
        darkFilterRow,
        darkCoursesRow,
      ], true),
      practicePage(
        'Dark Practice / html.dark',
        'Тренировочный зал',
        [
          txt('Практика', outfit('Bold'), 11, BRAND500),
          txt('Тренировочный зал', outfit('SemiBold'), 24, DARK_TEXT),
          txt('Rail stays #141820. Outlet uses --bg-primary #020617.', outfit('Regular'), 13, DARK_MUTED, 680),
          modeCard('Слепая печать', 'Старт', 'neutral', 'Ряды клавиш, слова и фразы. WPM, точность и подсветка следующей клавиши.', 328, true),
          modeCard('VS Code симулятор', 'Ядро', 'brand', 'Explorer, миссии и проверка шагов — папки и файлы как в настоящем редакторе.', 328, true),
        ],
        true,
      ),
      marketingPage('Dark Path / html.dark', 'Мой путь', false, [
        txt('МОЙ ПУТЬ РАЗВИТИЯ', outfit('Bold'), 11, BRAND500),
        txt('Developer Growth Path', fraunces('Bold'), 32, DARK_TEXT),
        txt('От первого ноутбука до инструментов профи: файлы → печать и hotkeys → VS Code и дальше.', outfit('Regular'), 13, DARK_MUTED, 800),
        darkPathRow,
      ], true),
      marketingPage('Dark Dashboard / html.dark', '', false, [darkDash], true),
    ]),
  );
  board.appendChild(
    section('Mobile 390 · BottomNav', [
      mobile,
      mobileCourses,
      mobileLogin,
      mobilePractice,
      mobilePath,
      mobileReview,
      mobileQuiz,
      gate,
      txt('BottomNav hidden on /login and /register. PracticeKeyboardGate when no physical keyboard. Practice rail becomes compact chips < lg.', outfit('Regular'), 12, MUTED, 390),
    ]),
  );
  const root = page.findOne((n) => n.name === 'KM Product Map — as-is');
  if (root) root.appendChild(board);
  else {
    board.x = 80;
    board.y = 2100;
    page.appendChild(board);
  }
}


async function buildAll() {
  figma.ui.postMessage({ type: 'status', text: 'Creating pages…' });
  await ensurePages();
  await loadType();
  figma.ui.postMessage({ type: 'status', text: 'Tokens…' });
  const { byName } = await createPrimitives();
  await createSemantic(byName);
  await createTextAndEffects();
  figma.ui.postMessage({ type: 'status', text: 'Product map…' });
  await buildProductMap();
  await buildSitemap();
  await buildDesignSystemBoard();
  await buildComponents();
  await buildUniqueScreens();
  await buildFlows();
  await buildPlaceholder();
  await buildScreenHeaders();
  figma.ui.postMessage({ type: 'ready' });
}

figma.showUI(__html__, { width: 360, height: 140 });
figma.ui.onmessage = async (msg) => {
  try {
    if (msg.type === 'image') {
      await placeImage(msg);
      figma.ui.postMessage({ type: 'ack' });
    } else if (msg.type === 'skip') {
      figma.ui.postMessage({ type: 'ack' });
    } else if (msg.type === 'done') {
      await buildVisualFlows();
      await figma.setCurrentPageAsync(pageByName('01 — Product Map'));
      figma.closePlugin('KeyMaster — Product Map (Current UI) built. Stage 1 as-is.');
    }
  } catch (e) {
    figma.closePlugin(String(e));
  }
};

buildAll().catch((e) => figma.closePlugin(String(e)));
