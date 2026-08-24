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
      ['desktop-guest-courses-filter-start.jpg', 'Filter start'],
      ['desktop-guest-05-course-computer-basics.jpg', 'Course'],
      ['desktop-learner-17-lesson-hotkey.jpg', 'Lesson'],
      ['desktop-guest-03-register.jpg', 'Register gate'],
    ]],
    ['F2 Sign up', [
      ['desktop-guest-03-register.jpg', 'Register'],
      ['desktop-guest-verify-email-loading.jpg', 'Verify loading'],
      ['desktop-guest-verify-email-ok.jpg', 'Verify ok'],
      ['desktop-guest-verify-email-error.jpg', 'Verify error'],
      ['desktop-learner-08-dashboard.jpg', 'Dashboard'],
    ]],
    ['F3 Sign in', [
      ['desktop-guest-02-login.jpg', 'Login'],
      ['desktop-guest-login-error.jpg', 'Login error'],
      ['desktop-learner-08-dashboard.jpg', 'Dashboard'],
    ]],
    ['F4 Learning path', [
      ['desktop-learner-09-path-viewport.jpg', 'Path'],
      ['desktop-learner-path-loading.jpg', 'Path loading'],
      ['desktop-learner-09-path.jpg', 'Path full scroll'],
      ['desktop-learner-courses.jpg', 'Authed catalog'],
      ['desktop-learner-course-vscode.jpg', 'Authed vscode'],
      ['desktop-learner-course-programmer-basics.jpg', 'Authed programmer-basics'],
      ['desktop-learner-course-computer-basics.jpg', 'Authed computer-basics'],
      ['desktop-learner-17-lesson-hotkey.jpg', 'Lesson'],
      ['desktop-guest-course-not-found.jpg', 'Not found'],
    ]],
    ['F5 First laptop', [
      ['desktop-guest-05-course-computer-basics.jpg', 'Computer basics'],
      ['desktop-learner-23-simulator-desktop.jpg', 'Desktop sim'],
      ['desktop-learner-simulator-desktop-menu.jpg', 'Desktop context menu'],
      ['desktop-learner-simulator-desktop-explorer.jpg', 'Explorer'],
      ['desktop-learner-simulator-desktop-trash.jpg', 'Recycle bin'],
      ['desktop-learner-simulator-desktop-start.jpg', 'Start menu'],
      ['desktop-learner-simulator-desktop-editor.jpg', 'Welcome.txt'],
      ['desktop-learner-simulator-desktop-keyboard.jpg', 'Keyboard'],
      ['desktop-learner-simulator-desktop-filemenu.jpg', 'File menu'],
      ['desktop-learner-simulator-desktop-properties.jpg', 'Properties'],
      ['desktop-learner-simulator-desktop-light.jpg', 'Light theme'],
      ['desktop-learner-18-lesson-task.jpg', 'Task lesson'],
    ]],
    ['F6 Hotkey learn', [
      ['desktop-learner-17-lesson-hotkey.jpg', 'KeyboardTrainer'],
    ]],
    ['F7 Practice hub', [
      ['desktop-learner-10-practice.jpg', 'Hub'],
      ['desktop-learner-11-typing.jpg', 'Typing'],
      ['desktop-learner-22-simulator-code.jpg', 'Code Lab'],
      ['desktop-learner-simulator-code-palette.jpg', 'Command palette'],
      ['desktop-learner-simulator-code-quickopen.jpg', 'Quick Open'],
      ['desktop-learner-simulator-code-terminal.jpg', 'Terminal'],
      ['desktop-learner-simulator-code-find.jpg', 'Find'],
      ['desktop-learner-simulator-code-search.jpg', 'Search'],
      ['desktop-learner-simulator-code-scm.jpg', 'Source Control'],
      ['desktop-learner-simulator-code-run.jpg', 'Run and Debug'],
      ['desktop-learner-simulator-code-extensions.jpg', 'Extensions'],
      ['desktop-learner-simulator-code-filemenu.jpg', 'File menu'],
      ['desktop-learner-simulator-code-viewmenu.jpg', 'View menu'],
      ['desktop-learner-simulator-code-editmenu.jpg', 'Edit menu'],
      ['desktop-learner-simulator-code-gomenu.jpg', 'Go menu'],
      ['desktop-learner-simulator-code-runmenu.jpg', 'Run menu'],
      ['desktop-learner-simulator-code-termmenu.jpg', 'Terminal menu'],
      ['desktop-learner-simulator-code-helpmenu.jpg', 'Help menu'],
      ['desktop-learner-simulator-code-manage.jpg', 'Manage'],
      ['desktop-learner-simulator-code-light.jpg', 'Light theme'],
      ['desktop-learner-simulator-code-task.jpg', 'Current task done'],
      ['desktop-learner-simulator-code-taskrun.jpg', 'Task in progress'],
      ['desktop-learner-simulator-code-tasklist.jpg', 'All tasks'],
      ['desktop-learner-simulator-code-preview.jpg', 'Preview'],
      ['desktop-learner-simulator-code-keyboard.jpg', 'Keyboard visualizer'],
      ['desktop-learner-12-training.jpg', 'Training'],
      ['desktop-learner-13-speed.jpg', 'Speed'],
      ['desktop-learner-speed-done.jpg', 'Speed done'],
    ]],
    ['F8 Reinforce', [
      ['desktop-learner-14-review.jpg', 'Review'],
      ['desktop-learner-15-quiz.jpg', 'Quiz'],
      ['desktop-learner-16-exam.jpg', 'Exam setup'],
      ['desktop-learner-exam-loading.jpg', 'Exam loading'],
      ['desktop-learner-exam-run.jpg', 'Exam run'],
      ['desktop-learner-exam-feedback.jpg', 'Exam feedback'],
      ['desktop-learner-exam-done.jpg', 'Exam done'],
      ['desktop-learner-exam-empty.jpg', 'Exam empty'],
    ]],
    ['F9 Social', [
      ['desktop-guest-07-leaderboard.jpg', 'Leaderboard guest'],
      ['desktop-learner-leaderboard.jpg', 'Leaderboard authed Вы'],
      ['desktop-learner-leaderboard-outside-top.jpg', 'Outside top #12'],
      ['desktop-guest-leaderboard-empty.jpg', 'Leaderboard empty'],
      ['desktop-learner-leaderboard-period-empty.jpg', 'Period empty'],
      ['desktop-guest-leaderboard-api-down.jpg', 'Leaderboard API down'],
      ['desktop-learner-19-achievements.jpg', 'Achievements locked'],
      ['desktop-learner-achievements-empty.jpg', 'Achievements empty'],
      ['desktop-learner-achievements-unlocked.jpg', 'Achievements unlocked'],
      ['desktop-learner-achievements-loading.jpg', 'Achievements loading'],
    ]],
    ['F10 Progress', [
      ['desktop-learner-08-dashboard.jpg', 'Dashboard'],
      ['desktop-learner-dashboard-daily-empty.jpg', 'Daily empty'],
      ['desktop-learner-dashboard-loading.jpg', 'Dashboard loading'],
      ['desktop-learner-20-stats.jpg', 'Stats'],
      ['desktop-learner-stats-loading.jpg', 'Stats loading'],
    ]],
    ['F11 Admin', [
      ['desktop-admin-24-admin.jpg', 'Overview'],
      ['desktop-admin-overview-loading.jpg', 'Overview loading'],
      ['desktop-admin-courses.jpg', 'Courses'],
      ['desktop-admin-course-create.jpg', 'Create course'],
      ['desktop-admin-course-editor.jpg', 'Course editor'],
      ['desktop-admin-add-lesson.jpg', 'Add lesson'],
      ['desktop-admin-users.jpg', 'Users'],
      ['desktop-admin-achievements.jpg', 'Achievements'],
      ['desktop-admin-achievement-create.jpg', 'Create achievement'],
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
      'One node per unique page. /courses/:slug is six unique layouts (guest/authed × computer-basics Desktop vs programmer-basics start+Training vs vscode Training) plus not-found and loading. /lessons/:id is four kinds plus loading, study-only authed/learned, and task/desktop done — not N lessons.',
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
        ['/courses', 'Catalog', 'guest spacer · authed 0/N · loading · api down · empty · filter start'],
        ['/courses/:slug', 'Course detail', 'guest/authed × Desktop vs start+Training vs vscode Training · not found'],
        ['/lessons/:id', 'Lesson', 'hotkey | task | study guest/authed/learned | desktop-task · loading · done'],
        ['/path', 'Learning path', 'protected · loading 5×h-36'],
        ['/leaderboard', 'Leaderboard', 'public · authed Вы · empty · period empty · api down · loading · outside top'],
        ['/achievements', 'Achievements', 'locked / empty / loading / unlocked mix'],
        ['/dashboard', 'Dashboard', 'XP · streak · daily empty · stages loading'],
        ['/stats', 'Stats', 'protected · loading h-64'],
        ['/admin', 'Admin', 'overview · courses · create · editor · add-lesson · empty · loadings · users · achievements create · forbidden'],
      ],
    ],
    [
      'AuthCard',
      [
        ['/login', 'Login', 'OTP if unverified'],
        ['/register', 'Register', 'OTP nested'],
        ['/verify-email', 'Verify email', 'loading · error · ok'],
        ['/auth/callback', 'OAuth callback', 'skeleton · error'],
      ],
    ],
    [
      'PracticeShell',
      [
        ['/practice', 'Practice hub', 'skills + reinforce'],
        ['/typing', 'Typing', 'train | path | progress'],
        ['/training', 'Hotkeys', 'run | empty | done | loading'],
        ['/speed', 'Speed', '60s | done | loading'],
        ['/review', 'Review', 'front / flipped / empty / loading'],
        ['/quiz', 'Quiz', 'play + done'],
        ['/exam', 'Exam', 'setup | loading | run | feedback | done | empty'],
      ],
    ],
    [
      'ImmersiveSimulator',
      [
        ['/simulator', 'Code Lab', 'no chrome · #1e1e1e · light theme · File/Edit/View/Go/Run/Terminal/Help · Manage · find · search · SCM · run · extensions · preview · current/all tasks · keyboard'],
        ['/simulator?mode=desktop', 'Desktop sim', 'Этот компьютер · wallpaper menu · file menu · explorer · recycle-bin · Пуск · Welcome.txt · keyboard · properties · light theme'],
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
  box.appendChild(inner);
  inner.layoutSizingHorizontal = 'FILL';
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
  tile.appendChild(chrome);
  chrome.layoutSizingHorizontal = 'FILL';
  chrome.layoutSizingVertical = 'HUG';
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

function instPrimaryDisabled(label) {
  const n = inst('Button', 'Variant=Primary, State=Disabled, Size=MD');
  if (!n) {
    const b = instPrimary(label);
    b.opacity = 0.55;
    return b;
  }
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

function comboKeys(keys) {
  const row = al('HORIZONTAL', 'KeyCombo');
  row.itemSpacing = 8;
  row.counterAxisAlignItems = 'CENTER';
  row.primaryAxisAlignItems = 'CENTER';
  keys.forEach((k, i) => {
    if (i) row.appendChild(txt('+', outfit('Medium'), 14, MUTED));
    const cap = instKeyCap(k);
    if (cap) {
      row.appendChild(cap);
      return;
    }
    const box = al('HORIZONTAL', k);
    box.primaryAxisAlignItems = 'CENTER';
    box.counterAxisAlignItems = 'CENTER';
    box.paddingLeft = box.paddingRight = 12;
    box.paddingTop = box.paddingBottom = 8;
    box.cornerRadius = 12;
    box.fills = [solid(WHITE)];
    box.strokes = [solid(INK)];
    box.appendChild(txt(k, outfit('SemiBold'), 14, INK));
    row.appendChild(box);
  });
  return row;
}

function learnChip(learned) {
  const row = al('HORIZONTAL', learned ? 'ИЗУЧЕНО' : 'НЕ ИЗУЧЕНО');
  row.itemSpacing = 6;
  row.paddingLeft = row.paddingRight = 10;
  row.paddingTop = row.paddingBottom = 4;
  row.cornerRadius = 99;
  row.fills = [solid(learned ? { r: 0.86, g: 0.98, b: 0.9 } : { r: 0.941, g: 0.945, b: 0.953 })];
  row.appendChild(instLearn(learned) || txt(learned ? 'ИЗУЧЕНО' : 'НЕ ИЗУЧЕНО', outfit('Bold'), 10, learned ? SUCCESS : MUTED));
  return row;
}

function studyOnlyBody(mode) {
  const root = al('VERTICAL', 'Study-only lesson ' + mode);
  root.itemSpacing = 16;
  const card = al('VERTICAL', 'study card ' + mode);
  card.itemSpacing = 12;
  card.paddingTop = card.paddingBottom = 28;
  card.paddingLeft = card.paddingRight = 28;
  card.cornerRadius = 24;
  card.fills = [solid(WHITE)];
  card.resize(720, 10);
  card.layoutSizingHorizontal = 'FIXED';
  card.layoutSizingVertical = 'HUG';
  if (mode === 'guest') {
    card.appendChild(txt('Регистрация для практики', outfit('Bold'), 11, BRAND));
  } else {
    card.appendChild(learnChip(mode === 'learned'));
  }
  card.appendChild(txt('Окна', fraunces('Bold'), 28, INK));
  card.appendChild(txt('В реальной системе: Alt+Tab', outfit('Regular'), 14, MUTED, 664));
  card.appendChild(comboKeys(['Alt', 'Tab']));
  if (mode === 'learned') {
    card.appendChild(txt('Это сочетание уже в вашем арсенале', outfit('Medium'), 13, BRAND800));
  }
  card.appendChild(
    txt(
      'Это системное сочетание браузер не принимает. Запомните его здесь и повторяйте в режиме «Повторение».',
      outfit('Regular'),
      13,
      MUTED,
      664,
    ),
  );
  if (mode === 'guest') {
    const studyCta = al('VERTICAL', 'register gate');
    studyCta.itemSpacing = 8;
    studyCta.paddingTop = studyCta.paddingBottom = 16;
    studyCta.paddingLeft = studyCta.paddingRight = 16;
    studyCta.cornerRadius = 16;
    studyCta.fills = [solid({ r: 0.941, g: 0.945, b: 0.953 })];
    studyCta.appendChild(txt('ПРАКТИКА', outfit('Bold'), 11, BRAND800));
    studyCta.appendChild(txt('Создайте бесплатный аккаунт', outfit('SemiBold'), 16, INK));
    studyCta.appendChild(
      txt(
        'Тренажёр клавиш, XP и путь обучения доступны после регистрации. Каталог и теория уроков — без аккаунта.',
        outfit('Regular'),
        13,
        MUTED,
        560,
      ),
    );
    const studyBtns = al('HORIZONTAL', 'ctas');
    studyBtns.itemSpacing = 8;
    studyBtns.appendChild(instPrimary('Регистрация'));
    studyBtns.appendChild(instSecondary('Уже есть аккаунт'));
    studyCta.appendChild(studyBtns);
    card.appendChild(studyCta);
  } else {
    const actions = al('VERTICAL', 'study actions');
    actions.itemSpacing = 8;
    if (mode !== 'learned') actions.appendChild(instPrimary('Запомнил'));
    actions.appendChild(instSecondary('Открыть повторение'));
    card.appendChild(actions);
  }
  root.appendChild(card);
  root.appendChild(txt('← К каталогу', outfit('SemiBold'), 13, BRAND800));
  return root;
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

function instSkeleton(kind) {
  const n = inst('Skeleton', kind || 'Kind=Card');
  if (!n) return null;
  n.name = 'Skeleton instance';
  return n;
}

function skelBlock(w, h, kind) {
  const n = instSkeleton(kind || (h > 80 ? 'Kind=Card' : 'Kind=Line'));
  if (n) {
    n.resize(w, h);
    n.layoutSizingHorizontal = 'FIXED';
    return n;
  }
  const r = figma.createRectangle();
  r.name = 'Skeleton instance';
  r.resize(w, h);
  r.cornerRadius = h > 80 ? 24 : 8;
  r.fills = [solid(INK, 0.08)];
  return r;
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
  if (texts[1] && typeof desc === 'string') texts[1].characters = desc;
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

function chordLessonCard(title, chord, xp, learned) {
  const c = al('VERTICAL', title);
  c.itemSpacing = 6;
  c.paddingTop = c.paddingBottom = 16;
  c.paddingLeft = c.paddingRight = 16;
  c.cornerRadius = 16;
  c.fills = [solid(WHITE)];
  c.strokes = [solid(INK, 0.1)];
  c.resize(280, 10);
  c.layoutSizingHorizontal = 'FIXED';
  c.layoutSizingVertical = 'HUG';
  const top = al('HORIZONTAL', 'lesson top');
  top.primaryAxisAlignItems = 'SPACE_BETWEEN';
  top.counterAxisAlignItems = 'MIN';
  const left = al('VERTICAL', 'lesson copy');
  left.itemSpacing = 4;
  left.appendChild(txt(title, outfit('SemiBold'), 14, INK, 180));
  left.appendChild(txt(chord, outfit('Medium'), 13, BRAND800));
  top.appendChild(left);
  const right = al('VERTICAL', 'lesson meta');
  right.itemSpacing = 6;
  right.primaryAxisAlignItems = 'MAX';
  if (learned != null) {
    right.appendChild(instLearn(learned) || txt(learned ? 'ИЗУЧЕНО' : 'НЕ ИЗУЧЕНО', outfit('Bold'), 10, MUTED));
  }
  right.appendChild(txt(xp, outfit('Regular'), 11, MUTED));
  top.appendChild(right);
  c.appendChild(top);
  top.layoutSizingHorizontal = 'FILL';
  return c;
}

function guestRegisterLine() {
  const line = al('HORIZONTAL', 'guest course CTA');
  line.itemSpacing = 0;
  line.layoutWrap = 'WRAP';
  line.appendChild(txt('Зарегистрируйтесь', outfit('SemiBold'), 14, BRAND800));
  line.appendChild(txt(', чтобы открыть тренажёр и сохранять прогресс.', outfit('Regular'), 14, MUTED, 520));
  return line;
}

function courseDetailCtas(kind) {
  const row = al('HORIZONTAL', 'course ctas');
  row.itemSpacing = 8;
  row.layoutWrap = 'WRAP';
  row.appendChild(secondaryBtn('Мой путь'));
  if (kind === 'desktop') {
    row.appendChild(instPrimary('Рабочий стол'));
  } else {
    row.appendChild(instPrimary('Тренировка'));
    row.appendChild(secondaryBtn('Экзамен'));
  }
  return row;
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
  if (pct > 0) {
    const fillN = figma.createRectangle();
    fillN.resize(Math.max(4, Math.round(width * pct)), h);
    fillN.cornerRadius = 99;
    fillN.fills = [solid(fill || BRAND)];
    track.appendChild(fillN);
  }
  return track;
}

function searchField(width, theme) {
  const dark = theme === 'dark';
  const box = al('HORIZONTAL', 'search');
  box.itemSpacing = 8;
  box.counterAxisAlignItems = 'CENTER';
  box.paddingLeft = box.paddingRight = 14;
  box.cornerRadius = 16;
  box.fills = [solid(dark ? DARK_ELEVATED : WHITE)];
  box.strokes = [solid(dark ? WHITE : INK, dark ? 0.1 : 0.12)];
  box.resize(width, 44);
  box.layoutSizingHorizontal = 'FIXED';
  box.layoutSizingVertical = 'FIXED';
  const mag = figma.createEllipse();
  mag.resize(14, 14);
  mag.fills = [TRANSPARENT];
  mag.strokes = [solid(dark ? DARK_MUTED : MUTED)];
  mag.strokeWeight = 1.5;
  box.appendChild(mag);
  box.appendChild(txt('Название курса или инструмента', outfit('Regular'), 14, dark ? DARK_MUTED : MUTED));
  return box;
}

function catalogCard(opts) {
  const dark = !!opts.dark;
  const w = opts.width || 280;
  const inner = w - 40;
  const c = al('VERTICAL', opts.title);
  c.itemSpacing = 8;
  c.paddingTop = c.paddingBottom = 20;
  c.paddingLeft = c.paddingRight = 20;
  c.cornerRadius = 24;
  c.fills = opts.start ? (dark ? [solid(BRAND, 0.14)] : [solid(BRAND50)]) : [solid(dark ? DARK_CARD : WHITE)];
  c.strokes = [solid(opts.start ? BRAND : dark ? WHITE : INK, opts.start ? 0.22 : 0.1)];
  c.resize(w, 10);
  c.layoutSizingHorizontal = 'FIXED';
  c.layoutSizingVertical = 'HUG';
  const top = al('HORIZONTAL', 'top');
  top.primaryAxisAlignItems = 'SPACE_BETWEEN';
  top.counterAxisAlignItems = 'MIN';
  const icon = figma.createRectangle();
  icon.resize(42, 42);
  icon.cornerRadius = 12;
  icon.fills = [solid(opts.iconFill || BRAND50)];
  top.appendChild(icon);
  if (opts.start) top.appendChild(pill('СТАРТ', { r: 0.114, g: 0.306, b: 0.847 }, WHITE));
  c.appendChild(top);
  top.layoutSizingHorizontal = 'FILL';
  c.appendChild(txt(opts.title, outfit('SemiBold'), 16, dark ? DARK_TEXT : INK, inner));
  c.appendChild(txt(opts.desc, outfit('Regular'), 13, dark ? DARK_MUTED : MUTED, inner));
  if (opts.progress) {
    const prog = al('VERTICAL', 'progress');
    prog.itemSpacing = 6;
    const meta = al('HORIZONTAL', 'progress meta');
    meta.primaryAxisAlignItems = 'SPACE_BETWEEN';
    meta.appendChild(txt(opts.progress, outfit('Regular'), 12, dark ? DARK_MUTED : MUTED));
    meta.appendChild(txt(opts.percent || '0%', outfit('SemiBold'), 12, dark ? BRAND500 : BRAND800));
    prog.appendChild(meta);
    meta.layoutSizingHorizontal = 'FILL';
    const bar = progressBar(inner, 0, BRAND, 8);
    if (dark) bar.fills = [solid(WHITE, 0.1)];
    prog.appendChild(bar);
    c.appendChild(prog);
    prog.layoutSizingHorizontal = 'FILL';
  } else {
    const spacer = figma.createRectangle();
    spacer.resize(inner, 8);
    spacer.fills = [TRANSPARENT];
    c.appendChild(spacer);
  }
  const foot = al('HORIZONTAL', 'footer');
  foot.primaryAxisAlignItems = 'SPACE_BETWEEN';
  foot.counterAxisAlignItems = 'CENTER';
  foot.paddingTop = 12;
  foot.appendChild(txt(opts.meta, outfit('Medium'), 12, dark ? DARK_MUTED : MUTED, inner - 110));
  const cta = al('HORIZONTAL', opts.start ? 'Начните здесь' : 'open');
  cta.itemSpacing = 4;
  cta.paddingLeft = cta.paddingRight = 10;
  cta.paddingTop = cta.paddingBottom = 4;
  cta.cornerRadius = 8;
  cta.fills = [solid(dark ? BRAND : { r: 0.88, g: 0.93, b: 1 })];
  if (opts.start) cta.appendChild(txt('Начните здесь', outfit('SemiBold'), 11, dark ? WHITE : BRAND800));
  cta.appendChild(txt('↗', outfit('SemiBold'), 11, dark ? WHITE : BRAND800));
  foot.appendChild(cta);
  c.appendChild(foot);
  foot.layoutSizingHorizontal = 'FILL';
  return c;
}

function navDivider() {
  const d = figma.createRectangle();
  d.name = 'divider';
  d.resize(1, 20);
  d.fills = [solid(INK, 0.1)];
  return d;
}

/** Live KeyboardIllustration from PracticeKeyboardGate (SVG rows, not a stock icon). */
function keyboardIllustration() {
  const frame = figma.createFrame();
  frame.name = 'Keyboard illustration';
  frame.resize(280, 148);
  frame.cornerRadius = 16;
  frame.fills = [solid({ r: 0.859, g: 0.914, b: 0.988 })];
  frame.strokes = [solid({ r: 0.58, g: 0.73, b: 0.96 })];
  frame.strokeWeight = 2;
  frame.clipsContent = false;
  function key(x, y, w, fill, stroke) {
    const r = figma.createRectangle();
    frame.appendChild(r);
    r.resize(w, 16);
    r.x = x;
    r.y = y;
    r.cornerRadius = 4;
    r.fills = [solid(fill)];
    r.strokes = [solid(stroke)];
    r.strokeWeight = 1;
  }
  const whiteKey = WHITE;
  const slate = { r: 0.796, g: 0.835, b: 0.882 };
  for (let i = 0; i < 10; i++) key(12 + i * 26, 16, 20, whiteKey, slate);
  for (let i = 0; i < 9; i++) key(25 + i * 26, 38, 20, whiteKey, slate);
  key(12, 60, 32, { r: 0.773, g: 0.937, b: 0.969 }, ACCENT);
  key(48, 60, 176, whiteKey, slate);
  key(228, 60, 32, { r: 0.773, g: 0.937, b: 0.969 }, ACCENT);
  key(12, 82, 248, { r: 0.78, g: 0.86, b: 0.98 }, BRAND500);
  key(12, 104, 42, whiteKey, slate);
  key(58, 104, 42, whiteKey, slate);
  key(104, 104, 108, { r: 0.82, g: 0.94, b: 0.86 }, SUCCESS);
  key(216, 104, 44, whiteKey, slate);
  return frame;
}

/** Live path spine: center w-px gradient between START and the first course node. */
function pathTimeline(nodes, dark) {
  const wrap = al('VERTICAL', 'Path timeline');
  wrap.itemSpacing = 0;
  wrap.primaryAxisAlignItems = 'CENTER';
  wrap.counterAxisAlignItems = 'CENTER';
  wrap.resize(880, 10);
  wrap.layoutSizingHorizontal = 'FIXED';
  wrap.layoutSizingVertical = 'HUG';
  nodes.forEach((child, i) => {
    wrap.appendChild(child);
    if (i < nodes.length - 1) {
      const line = figma.createRectangle();
      line.name = 'Path timeline line';
      wrap.appendChild(line);
      line.resize(2, 32);
      line.fills = [solid(BRAND, dark ? 0.45 : 0.35)];
    }
  });
  return wrap;
}

function pathCtas(dark) {
  const row = al('HORIZONTAL', 'path CTAs');
  row.itemSpacing = 12;
  row.primaryAxisAlignItems = 'CENTER';
  row.appendChild(dark ? secondaryBtn('Каталог курсов', 'dark') : secondaryBtn('Каталог курсов'));
  row.appendChild(instPrimary('Следующий курс'));
  return row;
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

function makeNavbar(active, guest, dark, admin, locale) {
  const tg = locale === 'tg';
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
  const groups = tg
    ? [
        ['Асосӣ', 'Курсҳо', 'Роҳи ман'],
        ['Машқ'],
        ['Рейтинг'],
      ]
    : [
        ['Главная', 'Курсы', 'Мой путь'],
        ['Практика'],
        ['Рейтинг'],
      ];
  groups.forEach((group, gi) => {
    if (gi > 0) links.appendChild(navDivider());
    for (const item of group) {
      const on = item === active;
      if (!dark && !tg) {
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
  const langInst = !dark ? inst('LanguageSwitcher', tg ? 'Selected=TJ' : 'Selected=RU') : null;
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
    ru.fills = tg ? [TRANSPARENT] : [solid({ r: 0.114, g: 0.306, b: 0.847 })];
    ru.appendChild(txt('RU', outfit('Bold'), 12, tg ? (dark ? DARK_TEXT : INK) : WHITE));
    const tjChip = al('HORIZONTAL', 'TJ');
    tjChip.paddingLeft = tjChip.paddingRight = 10;
    tjChip.paddingTop = tjChip.paddingBottom = 4;
    tjChip.cornerRadius = 6;
    tjChip.fills = tg ? [solid({ r: 0.114, g: 0.306, b: 0.847 })] : [TRANSPARENT];
    tjChip.appendChild(txt('TJ', outfit('Bold'), 12, tg ? WHITE : dark ? DARK_TEXT : INK));
    lang.appendChild(ru);
    lang.appendChild(tjChip);
    actions.appendChild(lang);
  }
  actions.appendChild(themeToggle(dark));
  if (guest) {
    const login = al('HORIZONTAL', tg ? 'Даромадан' : 'Вход');
    login.paddingLeft = login.paddingRight = 10;
    login.paddingTop = login.paddingBottom = 8;
    login.cornerRadius = 8;
    login.appendChild(txt(tg ? 'Даромадан' : 'Вход', outfit('SemiBold'), 14, ink));
    actions.appendChild(login);
    actions.appendChild(primaryBtn(tg ? 'Сабти ном' : 'Регистрация', true));
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
    const logout = al('HORIZONTAL', tg ? 'Баромадан' : 'Выйти');
    logout.paddingLeft = logout.paddingRight = 12;
    logout.paddingTop = logout.paddingBottom = 6;
    logout.minHeight = 44;
    logout.cornerRadius = 16;
    logout.fills = [solid(dark ? DARK_CARD : WHITE)];
    logout.strokes = [solid(dark ? WHITE : INK, 0.12)];
    logout.appendChild(txt(tg ? 'Баромадан' : 'Выйти', outfit('SemiBold'), 14, ink));
    actions.appendChild(logout);
  }
  nav.appendChild(actions);
  brand.layoutSizingHorizontal = 'HUG';
  links.layoutSizingHorizontal = 'HUG';
  actions.layoutSizingHorizontal = 'HUG';
  return nav;
}

function makeFooter(dark, locale) {
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
  f.appendChild(
    txt(
      locale === 'tg' ? 'аз ноутбуки аввал то Shortcut Legend' : 'от первого ноутбука до Shortcut Legend',
      outfit('Regular'),
      13,
      muted,
    ),
  );
  return f;
}

function makeLbHero(name, period) {
  const hero = al('VERTICAL', name);
  hero.itemSpacing = 8;
  hero.paddingTop = hero.paddingBottom = 32;
  hero.paddingLeft = hero.paddingRight = 32;
  hero.cornerRadius = 24;
  hero.fills = [solid({ r: 0.941, g: 0.961, b: 1 })];
  hero.strokes = [solid(BRAND, 0.2)];
  hero.resize(880, 10);
  hero.layoutSizingHorizontal = 'FIXED';
  hero.layoutSizingVertical = 'HUG';
  hero.appendChild(txt('СОРЕВНОВАНИЕ', outfit('Bold'), 11, BRAND800));
  hero.appendChild(txt('Рейтинг', fraunces('Bold'), 32, INK));
  hero.appendChild(
    txt(
      'Топ учеников KeyMaster по XP. Тренируйтесь, поднимайтесь выше и держите серию.',
      outfit('Regular'),
      13,
      MUTED,
      720,
    ),
  );
  const periods = al('HORIZONTAL', name + ' periods');
  periods.itemSpacing = 4;
  periods.paddingTop = periods.paddingBottom = periods.paddingLeft = periods.paddingRight = 4;
  periods.cornerRadius = 12;
  periods.fills = [solid(WHITE)];
  periods.strokes = [solid(INK, 0.1)];
  for (const [label, key] of [
    ['Всё время', 'all'],
    ['Неделя', 'week'],
    ['Месяц', 'month'],
  ]) {
    const on = period === key;
    const chip = al('HORIZONTAL', label);
    chip.paddingLeft = chip.paddingRight = 14;
    chip.paddingTop = chip.paddingBottom = 6;
    chip.cornerRadius = 8;
    chip.fills = on ? [solid(BRAND)] : [TRANSPARENT];
    chip.appendChild(txt(label, outfit('SemiBold'), 13, on ? WHITE : MUTED));
    periods.appendChild(chip);
  }
  hero.appendChild(periods);
  return hero;
}

function marketingPage(name, active, guest, body, dark, admin, locale) {
  const page = al('VERTICAL', name);
  page.itemSpacing = 0;
  page.fills = [solid(dark ? DARK_BG : PAPER)];
  page.strokes = [solid(dark ? WHITE : INK, 0.08)];
  page.strokeWeight = 1;
  page.resize(960, 10);
  page.layoutSizingHorizontal = 'FIXED';
  page.layoutSizingVertical = 'HUG';
  page.appendChild(makeNavbar(active, guest, dark, admin, locale));
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
  page.appendChild(makeFooter(dark, locale));
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
  c.appendChild(top);
  top.layoutSizingHorizontal = 'FILL';
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
    const top = al('HORIZONTAL', 'top');
    top.primaryAxisAlignItems = 'SPACE_BETWEEN';
    top.counterAxisAlignItems = 'MIN';
    const icon = figma.createRectangle();
    icon.resize(42, 42);
    icon.cornerRadius = 12;
    icon.fills = [solid(tone === 'success' ? { r: 0.941, g: 0.992, b: 0.957 } : BRAND50)];
    top.appendChild(icon);
    top.appendChild(
      pill(
        status,
        tone === 'brand' ? { r: 0.114, g: 0.306, b: 0.847 } : tone === 'success' ? { r: 0.941, g: 0.992, b: 0.957 } : { r: 0.941, g: 0.945, b: 0.953 },
        tone === 'brand' ? WHITE : tone === 'success' ? SUCCESS : MUTED,
      ),
    );
    c.appendChild(top);
    top.layoutSizingHorizontal = 'FILL';
    c.appendChild(txt(title, outfit('SemiBold'), 16, INK, 220));
    c.appendChild(txt('Каталог · 1 layout на все курсы', outfit('Regular'), 13, MUTED, 220));
    const foot = al('HORIZONTAL', 'footer');
    foot.primaryAxisAlignItems = 'SPACE_BETWEEN';
    foot.counterAxisAlignItems = 'CENTER';
    foot.paddingTop = 12;
    foot.appendChild(txt(required ? '16 уроков · 4 категории' : '42 урока · 7 категорий', outfit('Medium'), 12, MUTED));
    const cta = al('HORIZONTAL', required ? 'Начните здесь' : 'open');
    cta.itemSpacing = 4;
    cta.paddingLeft = cta.paddingRight = 10;
    cta.paddingTop = cta.paddingBottom = 4;
    cta.cornerRadius = 8;
    cta.fills = [solid({ r: 0.88, g: 0.93, b: 1 })];
    if (required) cta.appendChild(txt('Начните здесь', outfit('SemiBold'), 11, BRAND800));
    cta.appendChild(txt('↗', outfit('SemiBold'), 11, BRAND800));
    foot.appendChild(cta);
    c.appendChild(foot);
    foot.layoutSizingHorizontal = 'FILL';
    return c;
  }
  const cards = [
    cardVariant('Status=Start', 'Первый ноутбук', 'СТАРТ', 'brand', true),
    cardVariant('Status=InProgress', 'VS Code', 'В ПРОЦЕССЕ', 'neutral', false),
    cardVariant('Status=Completed', 'Git', 'ГОТОВО', 'success', false),
    cardVariant('Status=Required', 'Основы программиста', 'ОБЯЗАТЕЛЬНЫЙ СТАРТ', 'brand', true),
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
    c.appendChild(txt(learned ? 'ИЗУЧЕНО' : 'НЕ ИЗУЧЕНО', outfit('Bold'), 10, learned ? { r: 0.082, g: 0.502, b: 0.239 } : MUTED));
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
    const guestCtas = al('VERTICAL', 'drawer auth');
    guestCtas.itemSpacing = 8;
    guestCtas.appendChild(instPrimary('Регистрация') || primaryBtn('Регистрация'));
    guestCtas.appendChild(secondaryBtn('Вход'));
    menu.appendChild(guestCtas);
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
  ctas.appendChild(instPrimary('Начать бесплатно →'));
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
  ctasAuthed.appendChild(instPrimary('Мой путь развития →'));
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
  coursesRow.appendChild(
    catalogCard({
      title: 'Первый ноутбук: файлы и папки',
      desc: 'Создание папок и файлов, проводник, корзина и ZIP. Выполняйте задания в симуляторе «Рабочий стол».',
      meta: '16 уроков · 4 категории',
      start: true,
      iconFill: { r: 0.96, g: 0.55, b: 0.2 },
    }),
  );
  coursesRow.appendChild(
    catalogCard({
      title: 'Основные горячие клавиши программиста',
      desc: 'Короткие уроки: копирование, сохранение, поиск и ещё несколько важных сочетаний. Системные клавиши (Alt+Tab, Win, F) — в разделе изучения и в режиме «Повторение».',
      meta: '19 уроков · 2 категории',
      start: true,
      iconFill: { r: 0.35, g: 0.42, b: 0.55 },
    }),
  );
  coursesRow.appendChild(
    catalogCard({
      title: 'VS Code',
      desc: 'Visual Studio Code — редактор кода от Microsoft.',
      meta: '42 урока · 7 категорий',
      start: false,
      iconFill: { r: 0.13, g: 0.48, b: 0.78 },
    }),
  );
  const statusStrip = al('HORIZONTAL', 'CourseCard statuses');
  statusStrip.itemSpacing = 12;
  statusStrip.appendChild(instCourse('Status=Start') || courseCard('Первый ноутбук', 'СТАРТ', 'brand', true));
  statusStrip.appendChild(instCourse('Status=InProgress') || courseCard('VS Code', 'В ПРОЦЕССЕ', 'neutral', false));
  statusStrip.appendChild(instCourse('Status=Completed') || courseCard('Git', 'ГОТОВО', 'success', false));
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
  const notLearned = al('HORIZONTAL', 'НЕ ИЗУЧЕНО');
  notLearned.itemSpacing = 6;
  notLearned.paddingLeft = notLearned.paddingRight = 10;
  notLearned.paddingTop = notLearned.paddingBottom = 4;
  notLearned.cornerRadius = 99;
  notLearned.fills = [solid({ r: 0.941, g: 0.945, b: 0.953 })];
  notLearned.appendChild(instLearn(false) || txt('НЕ ИЗУЧЕНО', outfit('Bold'), 10, MUTED));
  lessonHotkey.appendChild(notLearned);
  const trainerCard = al('VERTICAL', 'trainer card');
  trainerCard.itemSpacing = 16;
  trainerCard.paddingTop = trainerCard.paddingBottom = 24;
  trainerCard.paddingLeft = trainerCard.paddingRight = 24;
  trainerCard.cornerRadius = 24;
  trainerCard.fills = [solid(WHITE)];
  trainerCard.strokes = [solid(BRAND, 0.18)];
  trainerCard.resize(640, 10);
  trainerCard.layoutSizingHorizontal = 'FIXED';
  trainerCard.layoutSizingVertical = 'HUG';
  trainerCard.appendChild(txt('Копировать', outfit('SemiBold'), 22, INK));
  const demo = al('VERTICAL', 'Учебное поле');
  demo.itemSpacing = 8;
  demo.paddingTop = demo.paddingBottom = 16;
  demo.paddingLeft = demo.paddingRight = 16;
  demo.cornerRadius = 16;
  demo.fills = [solid({ r: 0.941, g: 0.945, b: 0.953 })];
  demo.appendChild(txt('Учебное поле', outfit('Bold'), 11, MUTED));
  const demoText = al('HORIZONTAL', 'selection');
  demoText.paddingLeft = demoText.paddingRight = 8;
  demoText.paddingTop = demoText.paddingBottom = 4;
  demoText.cornerRadius = 6;
  demoText.fills = [solid(BRAND, 0.18)];
  demoText.appendChild(txt('Выделенный текст для тренировки', outfit('Regular'), 14, INK));
  demo.appendChild(demoText);
  trainerCard.appendChild(demo);
  const keys = al('HORIZONTAL', 'KeyCombo');
  keys.itemSpacing = 8;
  keys.counterAxisAlignItems = 'CENTER';
  for (const k of ['Ctrl', 'C']) {
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
  trainerCard.appendChild(keys);
  trainerCard.appendChild(txt('Зажмите Ctrl, затем вторую клавишу', outfit('Regular'), 12, MUTED));
  const trainerBtns = al('HORIZONTAL', 'trainer actions');
  trainerBtns.itemSpacing = 8;
  trainerBtns.appendChild(instSecondary('Показать ответ'));
  trainerBtns.appendChild(ghostBtn('Объяснение'));
  trainerCard.appendChild(trainerBtns);
  lessonHotkey.appendChild(trainerCard);
  lessonHotkey.appendChild(txt('← К каталогу', outfit('SemiBold'), 13, BRAND800));

  const lessonTask = al('VERTICAL', 'Task lesson');
  lessonTask.itemSpacing = 12;
  const taskNotLearned = al('HORIZONTAL', 'НЕ ИЗУЧЕНО');
  taskNotLearned.itemSpacing = 6;
  taskNotLearned.paddingLeft = taskNotLearned.paddingRight = 10;
  taskNotLearned.paddingTop = taskNotLearned.paddingBottom = 4;
  taskNotLearned.cornerRadius = 99;
  taskNotLearned.fills = [solid({ r: 0.941, g: 0.945, b: 0.953 })];
  taskNotLearned.appendChild(instLearn(false) || txt('НЕ ИЗУЧЕНО', outfit('Bold'), 10, MUTED));
  lessonTask.appendChild(taskNotLearned);
  const taskCard = al('VERTICAL', 'task card');
  taskCard.itemSpacing = 16;
  taskCard.paddingTop = taskCard.paddingBottom = 24;
  taskCard.paddingLeft = taskCard.paddingRight = 24;
  taskCard.cornerRadius = 24;
  taskCard.fills = [solid(WHITE)];
  taskCard.strokes = [solid(INK, 0.08)];
  taskCard.resize(720, 10);
  taskCard.layoutSizingHorizontal = 'FIXED';
  taskCard.layoutSizingVertical = 'HUG';
  taskCard.appendChild(txt('Файл и папка', fraunces('Bold'), 28, INK));
  taskCard.appendChild(
    txt(
      'Папки помогают не искать всё на рабочем столе. У файла есть имя и расширение: report.docx, photo.jpg.',
      outfit('Regular'),
      14,
      MUTED,
      672,
    ),
  );
  const taskHint = al('VERTICAL', 'hint');
  taskHint.paddingTop = taskHint.paddingBottom = 14;
  taskHint.paddingLeft = taskHint.paddingRight = 16;
  taskHint.cornerRadius = 16;
  taskHint.fills = [solid({ r: 0.941, g: 0.945, b: 0.953 })];
  taskHint.appendChild(txt('Поймите разницу между файлом и папкой', outfit('SemiBold'), 14, BRAND800, 640));
  taskCard.appendChild(taskHint);
  const taskPanel = al('VERTICAL', 'ЗАДАНИЕ');
  taskPanel.itemSpacing = 12;
  taskPanel.paddingTop = taskPanel.paddingBottom = 20;
  taskPanel.paddingLeft = taskPanel.paddingRight = 20;
  taskPanel.cornerRadius = 16;
  taskPanel.fills = [solid(WHITE)];
  taskPanel.strokes = [solid(INK, 0.1)];
  taskPanel.appendChild(txt('ЗАДАНИЕ', outfit('Bold'), 11, BRAND800));
  taskPanel.appendChild(txt('Файл и папка', outfit('SemiBold'), 16, INK));
  taskPanel.appendChild(txt('Поймите разницу между файлом и папкой', outfit('Regular'), 13, MUTED, 640));
  const steps = al('VERTICAL', 'Шаги');
  steps.itemSpacing = 6;
  steps.paddingTop = steps.paddingBottom = 12;
  steps.paddingLeft = steps.paddingRight = 14;
  steps.cornerRadius = 12;
  steps.fills = [solid({ r: 0.941, g: 0.945, b: 0.953 })];
  steps.appendChild(txt('Шаги', outfit('SemiBold'), 13, INK));
  steps.appendChild(txt('• Папка — «конверт»', outfit('Regular'), 13, MUTED, 600));
  steps.appendChild(txt('• Файл — одна заметка, фото или программа', outfit('Regular'), 13, MUTED, 600));
  taskPanel.appendChild(steps);
  const taskBtns = al('HORIZONTAL', 'task actions');
  taskBtns.itemSpacing = 8;
  taskBtns.appendChild(instSecondary('Открыть симулятор рабочего стола'));
  taskBtns.appendChild(instPrimary('Отметить выполненным'));
  taskPanel.appendChild(taskBtns);
  taskPanel.appendChild(txt('Честно отметьте, когда прочитали шаги.', outfit('Regular'), 12, MUTED, 600));
  taskCard.appendChild(taskPanel);
  lessonTask.appendChild(taskCard);
  lessonTask.appendChild(txt('← К каталогу', outfit('SemiBold'), 13, BRAND800));

  const lessonDesktop = al('VERTICAL', 'Desktop-task lesson');
  lessonDesktop.itemSpacing = 12;
  const deskNotLearned = al('HORIZONTAL', 'НЕ ИЗУЧЕНО');
  deskNotLearned.itemSpacing = 6;
  deskNotLearned.paddingLeft = deskNotLearned.paddingRight = 10;
  deskNotLearned.paddingTop = deskNotLearned.paddingBottom = 4;
  deskNotLearned.cornerRadius = 99;
  deskNotLearned.fills = [solid({ r: 0.941, g: 0.945, b: 0.953 })];
  deskNotLearned.appendChild(instLearn(false) || txt('НЕ ИЗУЧЕНО', outfit('Bold'), 10, MUTED));
  lessonDesktop.appendChild(deskNotLearned);
  const deskCard = al('VERTICAL', 'desktop-task card');
  deskCard.itemSpacing = 16;
  deskCard.paddingTop = deskCard.paddingBottom = 24;
  deskCard.paddingLeft = deskCard.paddingRight = 24;
  deskCard.cornerRadius = 24;
  deskCard.fills = [solid(WHITE)];
  deskCard.strokes = [solid(INK, 0.08)];
  deskCard.resize(720, 10);
  deskCard.layoutSizingHorizontal = 'FIXED';
  deskCard.layoutSizingVertical = 'HUG';
  deskCard.appendChild(txt('Папка Practice', fraunces('Bold'), 28, INK, 672));
  deskCard.appendChild(
    txt('Имена латиницей проще для программ. В симуляторе шаг засчитается сам.', outfit('Regular'), 13, MUTED, 672),
  );
  const deskPrompt = al('VERTICAL', 'prompt');
  deskPrompt.paddingTop = deskPrompt.paddingBottom = 14;
  deskPrompt.paddingLeft = deskPrompt.paddingRight = 16;
  deskPrompt.cornerRadius = 16;
  deskPrompt.fills = [solid({ r: 0.941, g: 0.945, b: 0.953 })];
  deskPrompt.appendChild(txt('Создайте на рабочем столе папку Practice', outfit('SemiBold'), 14, BRAND800, 640));
  deskCard.appendChild(deskPrompt);
  const deskPanel = al('VERTICAL', 'ЗАДАНИЕ');
  deskPanel.itemSpacing = 12;
  deskPanel.paddingTop = deskPanel.paddingBottom = 20;
  deskPanel.paddingLeft = deskPanel.paddingRight = 20;
  deskPanel.cornerRadius = 16;
  deskPanel.fills = [solid(WHITE)];
  deskPanel.strokes = [solid(BRAND, 0.2)];
  deskPanel.appendChild(txt('ЗАДАНИЕ', outfit('Bold'), 11, BRAND800));
  deskPanel.appendChild(txt('Папка Practice', outfit('SemiBold'), 16, INK));
  deskPanel.appendChild(txt('Создайте на рабочем столе папку Practice', outfit('Regular'), 13, MUTED, 640));
  const deskSteps = al('VERTICAL', 'Шаги');
  deskSteps.itemSpacing = 6;
  deskSteps.paddingTop = deskSteps.paddingBottom = 12;
  deskSteps.paddingLeft = deskSteps.paddingRight = 14;
  deskSteps.cornerRadius = 12;
  deskSteps.fills = [solid({ r: 0.941, g: 0.945, b: 0.953 })];
  deskSteps.appendChild(txt('Шаги', outfit('SemiBold'), 13, INK));
  deskSteps.appendChild(txt('• ПКМ по обоям → Новая папка → Practice', outfit('Regular'), 13, MUTED, 600));
  deskSteps.appendChild(txt('• или Ctrl+Shift+N', outfit('Regular'), 13, MUTED, 600));
  deskPanel.appendChild(deskSteps);
  deskPanel.appendChild(instSecondary('Открыть симулятор рабочего стола'));
  deskPanel.appendChild(txt('Симулятор сам засчитает урок и XP, когда шаг будет выполнен.', outfit('Regular'), 12, MUTED, 600));
  deskCard.appendChild(deskPanel);
  lessonDesktop.appendChild(deskCard);
  lessonDesktop.appendChild(txt('← К каталогу', outfit('SemiBold'), 13, BRAND800));

  const lessonStudy = studyOnlyBody('guest');
  const lessonStudyAuthed = studyOnlyBody('authed');
  const lessonStudyLearned = studyOnlyBody('learned');

  const lessonLoading = al('VERTICAL', 'Lesson loading');
  lessonLoading.itemSpacing = 24;
  lessonLoading.appendChild(skelBlock(224, 32, 'Kind=Line'));
  lessonLoading.appendChild(skelBlock(720, 384, 'Kind=Card'));
  lessonLoading.appendChild(
    txt('Lesson loading — PageShell SkeletonBlock h-8 + h-96, not course-detail h-10 + h-64.', outfit('Regular'), 12, MUTED, 720),
  );

  const lessonTaskDone = al('VERTICAL', 'Task lesson done');
  lessonTaskDone.itemSpacing = 12;
  lessonTaskDone.appendChild(learnChip(true));
  const taskDoneCard = al('VERTICAL', 'task done card');
  taskDoneCard.itemSpacing = 16;
  taskDoneCard.paddingTop = taskDoneCard.paddingBottom = 24;
  taskDoneCard.paddingLeft = taskDoneCard.paddingRight = 24;
  taskDoneCard.cornerRadius = 24;
  taskDoneCard.fills = [solid(WHITE)];
  taskDoneCard.strokes = [solid(BRAND, 0.3)];
  taskDoneCard.resize(720, 10);
  taskDoneCard.layoutSizingHorizontal = 'FIXED';
  taskDoneCard.layoutSizingVertical = 'HUG';
  taskDoneCard.appendChild(txt('Файл и папка', fraunces('Bold'), 28, INK));
  taskDoneCard.appendChild(
    txt(
      'Папки помогают не искать всё на рабочем столе. У файла есть имя и расширение: report.docx, photo.jpg.',
      outfit('Regular'),
      14,
      MUTED,
      672,
    ),
  );
  const taskDoneHint = al('VERTICAL', 'hint');
  taskDoneHint.paddingTop = taskDoneHint.paddingBottom = 14;
  taskDoneHint.paddingLeft = taskDoneHint.paddingRight = 16;
  taskDoneHint.cornerRadius = 16;
  taskDoneHint.fills = [solid({ r: 0.941, g: 0.945, b: 0.953 })];
  taskDoneHint.appendChild(txt('Поймите разницу между файлом и папкой', outfit('SemiBold'), 14, BRAND800, 640));
  taskDoneCard.appendChild(taskDoneHint);
  const taskDonePanel = al('VERTICAL', 'ЗАДАНИЕ');
  taskDonePanel.itemSpacing = 12;
  taskDonePanel.paddingTop = taskDonePanel.paddingBottom = 20;
  taskDonePanel.paddingLeft = taskDonePanel.paddingRight = 20;
  taskDonePanel.cornerRadius = 16;
  taskDonePanel.fills = [solid(WHITE)];
  taskDonePanel.strokes = [solid(BRAND, 0.2)];
  taskDonePanel.appendChild(txt('ЗАДАНИЕ', outfit('Bold'), 11, BRAND800));
  taskDonePanel.appendChild(txt('Файл и папка', outfit('SemiBold'), 16, INK));
  taskDonePanel.appendChild(txt('Поймите разницу между файлом и папкой', outfit('Regular'), 13, MUTED, 640));
  const taskDoneSteps = al('VERTICAL', 'Шаги');
  taskDoneSteps.itemSpacing = 6;
  taskDoneSteps.paddingTop = taskDoneSteps.paddingBottom = 12;
  taskDoneSteps.paddingLeft = taskDoneSteps.paddingRight = 14;
  taskDoneSteps.cornerRadius = 12;
  taskDoneSteps.fills = [solid({ r: 0.941, g: 0.945, b: 0.953 })];
  taskDoneSteps.appendChild(txt('Шаги', outfit('SemiBold'), 13, INK));
  taskDoneSteps.appendChild(txt('• Папка — «конверт»', outfit('Regular'), 13, MUTED, 600));
  taskDoneSteps.appendChild(txt('• файл — одна заметка, фото или программа', outfit('Regular'), 13, MUTED, 600));
  taskDonePanel.appendChild(taskDoneSteps);
  const taskDoneBtns = al('HORIZONTAL', 'task done actions');
  taskDoneBtns.itemSpacing = 8;
  taskDoneBtns.appendChild(instSecondary('Открыть симулятор рабочего стола'));
  taskDoneBtns.appendChild(instPrimaryDisabled('Выполнено'));
  taskDonePanel.appendChild(taskDoneBtns);
  taskDonePanel.appendChild(txt('Честно отметьте, когда прочитали шаги.', outfit('Regular'), 12, MUTED, 600));
  taskDoneCard.appendChild(taskDonePanel);
  lessonTaskDone.appendChild(taskDoneCard);
  const taskDoneBanner = al('VERTICAL', 'done task banner');
  taskDoneBanner.itemSpacing = 8;
  taskDoneBanner.paddingTop = taskDoneBanner.paddingBottom = 20;
  taskDoneBanner.paddingLeft = taskDoneBanner.paddingRight = 20;
  taskDoneBanner.cornerRadius = 24;
  taskDoneBanner.fills = [solid({ r: 0.941, g: 0.961, b: 1 })];
  taskDoneBanner.strokes = [solid(BRAND, 0.3)];
  taskDoneBanner.resize(720, 10);
  taskDoneBanner.layoutSizingHorizontal = 'FIXED';
  taskDoneBanner.layoutSizingVertical = 'HUG';
  const taskDoneHead = al('HORIZONTAL', 'done task head');
  taskDoneHead.itemSpacing = 8;
  taskDoneHead.counterAxisAlignItems = 'CENTER';
  taskDoneHead.appendChild(txt('Задание выполнено', outfit('Bold'), 18, BRAND800));
  taskDoneHead.appendChild(learnChip(true));
  taskDoneBanner.appendChild(taskDoneHead);
  taskDoneBanner.appendChild(txt('Запомните: Поймите разницу между файлом и папкой', outfit('Regular'), 13, MUTED, 672));
  taskDoneBanner.appendChild(txt('Следующий урок через 0…', outfit('Regular'), 13, MUTED));
  const taskDoneNext = al('HORIZONTAL', 'done task ctas');
  taskDoneNext.itemSpacing = 8;
  taskDoneNext.appendChild(instPrimary('Следующий урок'));
  taskDoneNext.appendChild(instSecondary('Открыть симулятор рабочего стола'));
  taskDoneBanner.appendChild(taskDoneNext);
  lessonTaskDone.appendChild(taskDoneBanner);
  lessonTaskDone.appendChild(txt('← К каталогу', outfit('SemiBold'), 13, BRAND800));

  const lessonDesktopDone = al('VERTICAL', 'Desktop-task lesson done');
  lessonDesktopDone.itemSpacing = 12;
  lessonDesktopDone.appendChild(learnChip(true));
  const deskDoneCard = al('VERTICAL', 'desktop-task done card');
  deskDoneCard.itemSpacing = 16;
  deskDoneCard.paddingTop = deskDoneCard.paddingBottom = 24;
  deskDoneCard.paddingLeft = deskDoneCard.paddingRight = 24;
  deskDoneCard.cornerRadius = 24;
  deskDoneCard.fills = [solid(WHITE)];
  deskDoneCard.strokes = [solid(BRAND, 0.3)];
  deskDoneCard.resize(720, 10);
  deskDoneCard.layoutSizingHorizontal = 'FIXED';
  deskDoneCard.layoutSizingVertical = 'HUG';
  deskDoneCard.appendChild(txt('Папка Practice', fraunces('Bold'), 28, INK, 672));
  deskDoneCard.appendChild(
    txt('Имена латиницей проще для программ. В симуляторе шаг засчитается сам.', outfit('Regular'), 13, MUTED, 672),
  );
  const deskDonePrompt = al('VERTICAL', 'prompt');
  deskDonePrompt.paddingTop = deskDonePrompt.paddingBottom = 14;
  deskDonePrompt.paddingLeft = deskDonePrompt.paddingRight = 16;
  deskDonePrompt.cornerRadius = 16;
  deskDonePrompt.fills = [solid({ r: 0.941, g: 0.945, b: 0.953 })];
  deskDonePrompt.appendChild(txt('Создайте на рабочем столе папку Practice', outfit('SemiBold'), 14, BRAND800, 640));
  deskDoneCard.appendChild(deskDonePrompt);
  const deskDonePanel = al('VERTICAL', 'ЗАДАНИЕ');
  deskDonePanel.itemSpacing = 12;
  deskDonePanel.paddingTop = deskDonePanel.paddingBottom = 20;
  deskDonePanel.paddingLeft = deskDonePanel.paddingRight = 20;
  deskDonePanel.cornerRadius = 16;
  deskDonePanel.fills = [solid(WHITE)];
  deskDonePanel.strokes = [solid(BRAND, 0.2)];
  deskDonePanel.appendChild(txt('ЗАДАНИЕ', outfit('Bold'), 11, BRAND800));
  deskDonePanel.appendChild(txt('Папка Practice', outfit('SemiBold'), 16, INK));
  deskDonePanel.appendChild(txt('Создайте на рабочем столе папку Practice', outfit('Regular'), 13, MUTED, 640));
  const deskDoneSteps = al('VERTICAL', 'Шаги');
  deskDoneSteps.itemSpacing = 6;
  deskDoneSteps.paddingTop = deskDoneSteps.paddingBottom = 12;
  deskDoneSteps.paddingLeft = deskDoneSteps.paddingRight = 14;
  deskDoneSteps.cornerRadius = 12;
  deskDoneSteps.fills = [solid({ r: 0.941, g: 0.945, b: 0.953 })];
  deskDoneSteps.appendChild(txt('Шаги', outfit('SemiBold'), 13, INK));
  deskDoneSteps.appendChild(txt('• ПКМ по обоям → Новая папка → Practice', outfit('Regular'), 13, MUTED, 600));
  deskDoneSteps.appendChild(txt('• или Ctrl+Shift+N', outfit('Regular'), 13, MUTED, 600));
  deskDonePanel.appendChild(deskDoneSteps);
  const deskDoneBtns = al('HORIZONTAL', 'desktop done actions');
  deskDoneBtns.itemSpacing = 8;
  deskDoneBtns.appendChild(instSecondary('Открыть симулятор рабочего стола'));
  const deskDoneBadge = instPrimary('Выполнено');
  deskDoneBadge.opacity = 0.8;
  deskDoneBtns.appendChild(deskDoneBadge);
  deskDonePanel.appendChild(deskDoneBtns);
  deskDonePanel.appendChild(txt('Симулятор сам засчитает урок и XP, когда шаг будет выполнен.', outfit('Regular'), 12, MUTED, 600));
  deskDoneCard.appendChild(deskDonePanel);
  lessonDesktopDone.appendChild(deskDoneCard);
  const deskDoneBanner = al('VERTICAL', 'done desktop banner');
  deskDoneBanner.itemSpacing = 8;
  deskDoneBanner.paddingTop = deskDoneBanner.paddingBottom = 20;
  deskDoneBanner.paddingLeft = deskDoneBanner.paddingRight = 20;
  deskDoneBanner.cornerRadius = 24;
  deskDoneBanner.fills = [solid({ r: 0.941, g: 0.961, b: 1 })];
  deskDoneBanner.strokes = [solid(BRAND, 0.3)];
  deskDoneBanner.resize(720, 10);
  deskDoneBanner.layoutSizingHorizontal = 'FIXED';
  deskDoneBanner.layoutSizingVertical = 'HUG';
  const deskDoneHead = al('HORIZONTAL', 'done desktop head');
  deskDoneHead.itemSpacing = 8;
  deskDoneHead.counterAxisAlignItems = 'CENTER';
  deskDoneHead.appendChild(txt('Задание выполнено', outfit('Bold'), 18, BRAND800));
  deskDoneHead.appendChild(learnChip(true));
  deskDoneBanner.appendChild(deskDoneHead);
  deskDoneBanner.appendChild(txt('Запомните: Создайте на рабочем столе папку Practice', outfit('Regular'), 13, MUTED, 672));
  deskDoneBanner.appendChild(txt('Следующий урок через 0…', outfit('Regular'), 13, MUTED));
  const deskDoneNext = al('HORIZONTAL', 'done desktop ctas');
  deskDoneNext.itemSpacing = 8;
  deskDoneNext.appendChild(instPrimary('Следующий урок'));
  deskDoneNext.appendChild(instSecondary('Открыть симулятор рабочего стола'));
  deskDoneBanner.appendChild(deskDoneNext);
  lessonDesktopDone.appendChild(deskDoneBanner);
  lessonDesktopDone.appendChild(txt('← К каталогу', outfit('SemiBold'), 13, BRAND800));

  const lessonHotkeyDone = al('VERTICAL', 'Hotkey lesson done');
  lessonHotkeyDone.itemSpacing = 12;
  lessonHotkeyDone.appendChild(learnChip(true));
  const hotkeyDoneCard = al('VERTICAL', 'hotkey done trainer');
  hotkeyDoneCard.itemSpacing = 12;
  hotkeyDoneCard.paddingTop = hotkeyDoneCard.paddingBottom = 24;
  hotkeyDoneCard.paddingLeft = hotkeyDoneCard.paddingRight = 24;
  hotkeyDoneCard.cornerRadius = 24;
  hotkeyDoneCard.fills = [solid(WHITE)];
  hotkeyDoneCard.strokes = [solid(BRAND, 0.18)];
  hotkeyDoneCard.resize(640, 10);
  hotkeyDoneCard.layoutSizingHorizontal = 'FIXED';
  hotkeyDoneCard.layoutSizingVertical = 'HUG';
  hotkeyDoneCard.appendChild(txt('Копировать', outfit('SemiBold'), 22, INK));
  hotkeyDoneCard.appendChild(comboKeys(['Ctrl', 'C']));
  hotkeyDoneCard.appendChild(txt('Зажмите Ctrl, затем вторую клавишу', outfit('Regular'), 12, MUTED));
  lessonHotkeyDone.appendChild(hotkeyDoneCard);
  const hotkeyDoneBanner = al('VERTICAL', 'done hotkey banner');
  hotkeyDoneBanner.itemSpacing = 8;
  hotkeyDoneBanner.paddingTop = hotkeyDoneBanner.paddingBottom = 20;
  hotkeyDoneBanner.paddingLeft = hotkeyDoneBanner.paddingRight = 20;
  hotkeyDoneBanner.cornerRadius = 24;
  hotkeyDoneBanner.fills = [solid({ r: 0.941, g: 0.961, b: 1 })];
  hotkeyDoneBanner.strokes = [solid(BRAND, 0.3)];
  hotkeyDoneBanner.resize(640, 10);
  hotkeyDoneBanner.layoutSizingHorizontal = 'FIXED';
  hotkeyDoneBanner.layoutSizingVertical = 'HUG';
  const hotkeyDoneHead = al('HORIZONTAL', 'done hotkey head');
  hotkeyDoneHead.itemSpacing = 8;
  hotkeyDoneHead.counterAxisAlignItems = 'CENTER';
  hotkeyDoneHead.appendChild(txt('Сочетание изучено', outfit('Bold'), 18, BRAND800));
  hotkeyDoneHead.appendChild(learnChip(true));
  hotkeyDoneBanner.appendChild(hotkeyDoneHead);
  hotkeyDoneBanner.appendChild(txt('Запомните: Ctrl + C — Скопируйте', outfit('Regular'), 13, MUTED, 600));
  hotkeyDoneBanner.appendChild(txt('Следующий урок через 0…', outfit('Regular'), 13, MUTED));
  const hotkeyDoneNext = al('HORIZONTAL', 'done hotkey ctas');
  hotkeyDoneNext.itemSpacing = 8;
  hotkeyDoneNext.appendChild(instPrimary('Следующий урок'));
  hotkeyDoneNext.appendChild(instSecondary('Тренировка без подсказок'));
  hotkeyDoneBanner.appendChild(hotkeyDoneNext);
  lessonHotkeyDone.appendChild(hotkeyDoneBanner);
  lessonHotkeyDone.appendChild(txt('← К каталогу', outfit('SemiBold'), 13, BRAND800));

  const pathRow = al('HORIZONTAL', 'Path nodes');
  pathRow.itemSpacing = 12;
  pathRow.appendChild(instPath('Status=Start') || pathNode('Start', 'Начать', false));
  pathRow.appendChild(instPath('Status=Available') || pathNode('Первый ноутбук', 'Начать', false));
  pathRow.appendChild(instPath('Status=Progress') || pathNode('VS Code', 'Продолжается', false));
  pathRow.appendChild(instPath('Status=Done') || pathNode('Git', 'Завершено', false));
  pathRow.appendChild(instPath('Status=Locked') || pathNode('Shortcut Legend', 'Заблокировано', true));

  const pathStats = al('HORIZONTAL', 'Path stats');
  pathStats.itemSpacing = 12;
  pathStats.layoutWrap = 'WRAP';
  pathStats.resize(880, 10);
  pathStats.layoutSizingHorizontal = 'FIXED';
  pathStats.layoutSizingVertical = 'HUG';
  for (const [label, value, accent] of [
    ['ТЕКУЩИЙ УРОВЕНЬ', 'Novice Operator', false],
    ['ВСЕГО XP', '0', false],
    ['ПРОЙДЕНО', '0/20 курсов', false],
    ['СЛЕДУЮЩИЙ ЭТАП', 'First Laptop', true],
  ]) {
    const c = al('VERTICAL', label);
    c.itemSpacing = 6;
    c.paddingTop = c.paddingBottom = 16;
    c.paddingLeft = c.paddingRight = 16;
    c.cornerRadius = 24;
    c.fills = [solid(accent ? BRAND50 : WHITE)];
    c.strokes = [solid(accent ? BRAND : INK, accent ? 0.3 : 0.1)];
    c.resize(208, 10);
    c.layoutSizingHorizontal = 'FIXED';
    c.layoutSizingVertical = 'HUG';
    c.appendChild(txt(label, outfit('Bold'), 10, accent ? BRAND800 : MUTED));
    c.appendChild(txt(value, fraunces('Bold'), 20, INK, 176));
    if (accent) c.appendChild(txt('Продолжить →', outfit('SemiBold'), 13, BRAND800));
    pathStats.appendChild(c);
  }

  const pathStart = al('VERTICAL', 'START node');
  pathStart.itemSpacing = 8;
  pathStart.primaryAxisAlignItems = 'CENTER';
  pathStart.paddingTop = pathStart.paddingBottom = 20;
  pathStart.paddingLeft = pathStart.paddingRight = 24;
  pathStart.cornerRadius = 20;
  pathStart.fills = [solid(WHITE)];
  pathStart.strokes = [solid(BRAND, 0.45)];
  pathStart.resize(360, 10);
  pathStart.layoutSizingHorizontal = 'FIXED';
  pathStart.layoutSizingVertical = 'HUG';
  pathStart.appendChild(txt('START', outfit('Bold'), 11, BRAND800));
  pathStart.appendChild(txt('Developer Growth Path', fraunces('Bold'), 22, INK));
  pathStart.appendChild(txt('От новичка к Keyboard Master', outfit('Regular'), 13, MUTED));

  const pathCourse = al('VERTICAL', 'First Laptop node');
  pathCourse.itemSpacing = 10;
  pathCourse.paddingTop = pathCourse.paddingBottom = 16;
  pathCourse.paddingLeft = pathCourse.paddingRight = 16;
  pathCourse.cornerRadius = 16;
  pathCourse.fills = [solid(WHITE)];
  pathCourse.strokes = [solid(INK, 0.15)];
  pathCourse.resize(360, 10);
  pathCourse.layoutSizingHorizontal = 'FIXED';
  pathCourse.layoutSizingVertical = 'HUG';
  const pathCourseRow = al('HORIZONTAL', 'course row');
  pathCourseRow.itemSpacing = 12;
  pathCourseRow.counterAxisAlignItems = 'MIN';
  const pathIcon = figma.createRectangle();
  pathIcon.name = 'CourseBrandIcon';
  pathIcon.resize(42, 42);
  pathIcon.cornerRadius = 12;
  pathCourseRow.appendChild(pathIcon);
  pathIcon.fills = [solid({ r: 0.96, g: 0.55, b: 0.2 })];
  const pathCourseCol = al('VERTICAL', 'course copy');
  pathCourseCol.itemSpacing = 6;
  const pathCourseHead = al('HORIZONTAL', 'course head');
  pathCourseHead.itemSpacing = 8;
  pathCourseHead.counterAxisAlignItems = 'CENTER';
  const startChip = al('HORIZONTAL', 'НАЧАТЬ');
  startChip.paddingLeft = startChip.paddingRight = 8;
  startChip.paddingTop = startChip.paddingBottom = 2;
  startChip.cornerRadius = 6;
  startChip.fills = [solid(INK)];
  startChip.appendChild(txt('НАЧАТЬ', outfit('Bold'), 9, WHITE));
  pathCourseHead.appendChild(startChip);
  pathCourseHead.appendChild(txt('NOVICE · L1', outfit('Bold'), 10, MUTED));
  pathCourseCol.appendChild(pathCourseHead);
  pathCourseCol.appendChild(txt('First Laptop', fraunces('SemiBold'), 18, INK));
  pathCourseCol.appendChild(txt('Первый ноутбук: файлы и папки', outfit('Regular'), 13, MUTED, 270));
  pathCourseRow.appendChild(pathCourseCol);
  pathCourse.appendChild(pathCourseRow);
  const pathMeta = al('HORIZONTAL', 'course meta');
  pathMeta.itemSpacing = 8;
  for (const [k, v] of [
    ['Уроки', '0/16'],
    ['XP курса', '0/240'],
    ['Прогресс', '0%'],
  ]) {
    const m = al('VERTICAL', k);
    m.itemSpacing = 2;
    m.primaryAxisAlignItems = 'CENTER';
    m.paddingTop = m.paddingBottom = 8;
    m.paddingLeft = m.paddingRight = 8;
    m.cornerRadius = 8;
    m.fills = [solid({ r: 0.941, g: 0.945, b: 0.953 })];
    m.resize(104, 10);
    m.layoutSizingHorizontal = 'FIXED';
    m.layoutSizingVertical = 'HUG';
    m.appendChild(txt(k, outfit('Regular'), 10, MUTED));
    m.appendChild(txt(v, outfit('SemiBold'), 12, INK));
    pathMeta.appendChild(m);
  }
  pathCourse.appendChild(pathMeta);
  pathCourse.appendChild(instProgress('Value=Empty') || progressBar(320, 0, BRAND, 8));
  const pathOpen = al('HORIZONTAL', 'open course');
  pathOpen.primaryAxisAlignItems = 'SPACE_BETWEEN';
  pathOpen.counterAxisAlignItems = 'CENTER';
  pathOpen.appendChild(txt('Открыть курс', outfit('SemiBold'), 13, BRAND800));
  pathOpen.appendChild(txt('↗', outfit('SemiBold'), 14, BRAND800));
  pathCourse.appendChild(pathOpen);
  pathOpen.layoutSizingHorizontal = 'FILL';

  const pathBody = [
    txt('МОЙ ПУТЬ РАЗВИТИЯ', outfit('Bold'), 11, BRAND800),
    txt('Developer Growth Path', fraunces('Bold'), 32, INK),
    txt(
      'От первого ноутбука до инструментов профи: файлы → печать и hotkeys → VS Code и дальше. Курсы те же — путь понятнее.',
      outfit('Regular'),
      13,
      MUTED,
      800,
    ),
    pathStats,
    pathTimeline([pathStart, pathCourse]),
    pathCtas(),
    txt('Не дублировать каждый узел курса — 5 статусов покрывают остальную карту.', outfit('Regular'), 12, MUTED, 800),
    pathRow,
  ];

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
    c.appendChild(top);
    top.layoutSizingHorizontal = 'FILL';
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
  levelTile.appendChild(txt('УРОВЕНЬ', outfit('SemiBold'), 11, MUTED));
  levelTile.appendChild(txt('Новичок', outfit('SemiBold'), 22, INK));
  levelTile.appendChild(instProgress('Value=Empty') || progressBar(240, 0.02, BRAND, 8));
  tiles.appendChild(levelTile);
  for (const [k, v] of [
    ['XP', '0'],
    ['ЕЖЕДНЕВНАЯ СЕРИЯ', '1 дн.'],
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
      foot.itemSpacing = 4;
      foot.primaryAxisAlignItems = 'CENTER';
      foot.paddingTop = foot.paddingBottom = compact ? 12 : 16;
      foot.paddingLeft = foot.paddingRight = padX;
      foot.fills = [solid(dark ? { r: 0.09, g: 0.145, b: 0.329 } : { r: 0.976, g: 0.98, b: 0.984 }, dark ? 0.55 : 1)];
      const split = footerText.split('?');
      if (split.length === 2) {
        foot.appendChild(txt(split[0].trim() + '?', outfit('Regular'), 13, dark ? DARK_MUTED : MUTED));
        foot.appendChild(txt(split[1].trim(), outfit('SemiBold'), 13, dark ? BRAND500 : BRAND800));
      } else {
        foot.appendChild(txt(footerText, outfit('Regular'), 13, dark ? DARK_MUTED : MUTED));
      }
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
      floatingField('Email', 'nobody@example.com'),
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
    'Мы отправили ссылку на anna@example.com. Перейдите по ней, затем войдите в аккаунт.',
    [
      txt('Письмо не пришло? Подождите 2–5 минут и проверьте папку «Спам».', outfit('Regular'), 11, MUTED, 352),
      otpRow(),
      instPrimary('Подтвердить код'),
      instSecondary('Отправить снова'),
    ],
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
    c.appendChild(top);
    top.layoutSizingHorizontal = 'FILL';
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
  skillCards.appendChild(modeCard('Слепая печать', 'СТАРТ', 'neutral', 'Ряды клавиш, слова и фразы. WPM, точность и подсветка следующей клавиши.'));
  skillCards.appendChild(modeCard('Рабочий стол', 'СТАРТ', 'neutral', 'Проводник Windows: папки, файлы и задания курса «Первый ноутбук» — без зубрёжки hotkeys.'));
  skillCards.appendChild(modeCard('VS Code симулятор', 'ЯДРО', 'brand', 'Explorer, миссии и проверка шагов — папки и файлы как в настоящем редакторе.'));
  skillCards.appendChild(modeCard('Hotkeys', 'ЯДРО', 'brand', 'Сочетания из курсов без подсказок — до мышечной памяти.'));
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
  reinforceCards.appendChild(modeCard('Повторение', 'КУРС', 'neutral', 'Карточки одного курса: сочетание и программа, без давления.', 213));
  reinforceCards.appendChild(modeCard('Основы hotkeys', 'КУРС', 'neutral', '25 вопросов: базовый уровень (1–19) и практика (20–25).', 213));
  reinforceCards.appendChild(modeCard('Экзамен', 'КУРС', 'neutral', 'Вопросы по курсу на время, без подсказок — как финальная проверка.', 213));
  const journey = al('VERTICAL', 'Journey');
  journey.itemSpacing = 8;
  journey.paddingTop = journey.paddingBottom = 20;
  journey.paddingLeft = journey.paddingRight = 20;
  journey.cornerRadius = 24;
  journey.fills = [solid(WHITE)];
  journey.strokes = [solid(BRAND, 0.25)];
  journey.appendChild(txt('С ЧЕГО НАЧАТЬ СЕГОДНЯ', outfit('Bold'), 11, BRAND800));
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

  const quizQ = 'Какая комбинация клавиш используется для копирования текста или файла?';
  const quizOpts = ['Ctrl + X', 'Ctrl + C', 'Ctrl + V', 'Ctrl + Z'];

  function quizStats(question, correct, xp, compact) {
    const row = al('HORIZONTAL', compact ? 'quiz stats compact' : 'quiz stats');
    row.itemSpacing = compact ? 8 : 12;
    if (compact) {
      row.layoutWrap = 'WRAP';
      row.resize(358, 10);
      row.layoutSizingHorizontal = 'FIXED';
      row.layoutSizingVertical = 'HUG';
    }
    for (const [k, v] of [
      ['ВОПРОС', question],
      ['ВЕРНО', correct],
      ['XP', xp],
    ]) {
      const c = al('VERTICAL', k);
      c.itemSpacing = 4;
      c.paddingTop = c.paddingBottom = compact ? 12 : 16;
      c.paddingLeft = c.paddingRight = compact ? 12 : 16;
      c.cornerRadius = 24;
      c.fills = [solid(WHITE)];
      c.resize(compact ? 110 : 155, 10);
      c.layoutSizingHorizontal = 'FIXED';
      c.layoutSizingVertical = 'HUG';
      c.appendChild(txt(k, outfit('Bold'), 10, MUTED));
      c.appendChild(txt(v, outfit('SemiBold'), compact ? 16 : 20, INK));
      row.appendChild(c);
    }
    return row;
  }

  function quizOption(label, state) {
    const row = al('HORIZONTAL', label);
    row.itemSpacing = 10;
    row.counterAxisAlignItems = 'CENTER';
    row.paddingTop = row.paddingBottom = 12;
    row.paddingLeft = row.paddingRight = 14;
    row.cornerRadius = 16;
    row.fills = [
      solid(state === 'correct' ? { r: 0.925, g: 0.99, b: 0.961 } : state === 'wrong' ? { r: 1, g: 0.941, b: 0.945 } : WHITE),
    ];
    row.strokes = [
      solid(
        state === 'correct' ? SUCCESS : state === 'wrong' ? SIGNAL : INK,
        state === 'idle' ? 0.12 : 0.45,
      ),
    ];
    row.appendChild(txt(state === 'correct' ? '✓' : state === 'wrong' ? '×' : '○', outfit('Bold'), 14, state === 'correct' ? SUCCESS : state === 'wrong' ? SIGNAL : MUTED));
    row.appendChild(txt(label, outfit('Medium'), 14, INK));
    return row;
  }

  const quiz = al('VERTICAL', 'Quiz');
  quiz.itemSpacing = 12;
  quiz.appendChild(txt('ОСНОВЫ HOTKEYS', outfit('Bold'), 11, BRAND800));
  quiz.appendChild(txt('Основы hotkeys', fraunces('Bold'), 32, INK));
  quiz.appendChild(txt('25 вопросов о горячих клавишах: копирование, навигация, окна и практика.', outfit('Regular'), 13, MUTED, 680));
  quiz.appendChild(quizStats('1/25', '0', '0'));
  const quizCard = al('VERTICAL', 'question');
  quizCard.itemSpacing = 12;
  quizCard.paddingTop = quizCard.paddingBottom = 24;
  quizCard.paddingLeft = quizCard.paddingRight = 24;
  quizCard.cornerRadius = 24;
  quizCard.fills = [solid(WHITE)];
  const qHead = al('HORIZONTAL', 'q head');
  qHead.itemSpacing = 8;
  qHead.counterAxisAlignItems = 'CENTER';
  qHead.appendChild(txt('Вопрос 1', outfit('SemiBold'), 14, INK));
  qHead.appendChild(pill('базовый', BRAND50, BRAND800));
  quizCard.appendChild(qHead);
  quizCard.appendChild(txt(quizQ, outfit('SemiBold'), 16, INK, 640));
  for (const opt of quizOpts) quizCard.appendChild(quizOption(opt, 'idle'));
  quiz.appendChild(quizCard);

  const quizPicked = al('VERTICAL', 'Quiz picked');
  quizPicked.itemSpacing = 12;
  quizPicked.appendChild(txt('ОСНОВЫ HOTKEYS', outfit('Bold'), 11, BRAND800));
  quizPicked.appendChild(txt('Основы hotkeys', fraunces('Bold'), 32, INK));
  quizPicked.appendChild(txt('25 вопросов о горячих клавишах: копирование, навигация, окна и практика.', outfit('Regular'), 13, MUTED, 680));
  quizPicked.appendChild(quizStats('1/25', '0', '0'));
  const pickedCard = al('VERTICAL', 'question');
  pickedCard.itemSpacing = 12;
  pickedCard.paddingTop = pickedCard.paddingBottom = 24;
  pickedCard.paddingLeft = pickedCard.paddingRight = 24;
  pickedCard.cornerRadius = 24;
  pickedCard.fills = [solid(WHITE)];
  const pickedHead = al('HORIZONTAL', 'q head');
  pickedHead.itemSpacing = 8;
  pickedHead.counterAxisAlignItems = 'CENTER';
  pickedHead.appendChild(txt('Вопрос 1', outfit('SemiBold'), 14, INK));
  pickedHead.appendChild(pill('базовый', BRAND50, BRAND800));
  pickedCard.appendChild(pickedHead);
  pickedCard.appendChild(txt(quizQ, outfit('SemiBold'), 16, INK, 640));
  pickedCard.appendChild(quizOption('Ctrl + X', 'wrong'));
  pickedCard.appendChild(quizOption('Ctrl + C', 'correct'));
  pickedCard.appendChild(quizOption('Ctrl + V', 'idle'));
  pickedCard.appendChild(quizOption('Ctrl + Z', 'idle'));
  quizPicked.appendChild(pickedCard);
  const wrongToast = al('VERTICAL', 'Неправильно!');
  wrongToast.itemSpacing = 8;
  wrongToast.paddingTop = wrongToast.paddingBottom = 16;
  wrongToast.paddingLeft = wrongToast.paddingRight = 16;
  wrongToast.cornerRadius = 16;
  wrongToast.fills = [solid(WHITE)];
  wrongToast.strokes = [solid(SIGNAL, 0.4)];
  const wrongHead = al('HORIZONTAL', 'wrong head');
  wrongHead.itemSpacing = 8;
  wrongHead.counterAxisAlignItems = 'CENTER';
  wrongHead.appendChild(txt('Неправильно!', outfit('Bold'), 16, SIGNAL));
  wrongHead.appendChild(txt('Ctrl + C', outfit('Bold'), 14, INK));
  wrongToast.appendChild(wrongHead);
  wrongToast.appendChild(txt('Ctrl+C копирует выделенное в буфер обмена.', outfit('Regular'), 13, MUTED, 360));
  wrongToast.appendChild(instPrimary('Дальше ›'));
  quizPicked.appendChild(wrongToast);

  const quizDone = al('VERTICAL', 'Quiz done');
  quizDone.itemSpacing = 12;
  quizDone.appendChild(txt('ОСНОВЫ HOTKEYS', outfit('Bold'), 11, BRAND800));
  quizDone.appendChild(txt('Основы hotkeys', fraunces('Bold'), 32, INK));
  quizDone.appendChild(quizStats('1/25', '1', '5'));
  const doneCard = al('VERTICAL', 'question');
  doneCard.itemSpacing = 12;
  doneCard.paddingTop = doneCard.paddingBottom = 24;
  doneCard.paddingLeft = doneCard.paddingRight = 24;
  doneCard.cornerRadius = 24;
  doneCard.fills = [solid(WHITE)];
  doneCard.appendChild(txt('Вопрос 1', outfit('SemiBold'), 14, INK));
  doneCard.appendChild(txt(quizQ, outfit('SemiBold'), 16, INK, 640));
  doneCard.appendChild(quizOption('Ctrl + X', 'idle'));
  doneCard.appendChild(quizOption('Ctrl + C', 'correct'));
  doneCard.appendChild(quizOption('Ctrl + V', 'idle'));
  doneCard.appendChild(quizOption('Ctrl + Z', 'idle'));
  quizDone.appendChild(doneCard);
  const okToast = al('VERTICAL', 'Правильно!');
  okToast.itemSpacing = 8;
  okToast.paddingTop = okToast.paddingBottom = 16;
  okToast.paddingLeft = okToast.paddingRight = 16;
  okToast.cornerRadius = 16;
  okToast.fills = [solid(WHITE)];
  okToast.strokes = [solid(SUCCESS, 0.4)];
  okToast.appendChild(txt('Правильно!', outfit('Bold'), 16, SUCCESS));
  okToast.appendChild(txt('+5 XP', outfit('SemiBold'), 13, SUCCESS));
  okToast.appendChild(instPrimary('Дальше ›'));
  quizDone.appendChild(okToast);

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
  summary.itemSpacing = 12;
  summary.paddingTop = summary.paddingBottom = 16;
  summary.paddingLeft = summary.paddingRight = 16;
  summary.cornerRadius = 16;
  summary.fills = [solid({ r: 0.976, g: 0.98, b: 0.984 })];
  summary.appendChild(txt('ВАША СЕССИЯ', outfit('Bold'), 11, MUTED));
  const summaryMetrics = al('HORIZONTAL', 'session metrics');
  summaryMetrics.itemSpacing = 8;
  for (const [k, v] of [
    ['Число вопросов', '20'],
    ['Лимит времени', '10 мин'],
    ['Темп', '~30 сек.'],
  ]) {
    const m = al('VERTICAL', k);
    m.itemSpacing = 4;
    m.paddingTop = m.paddingBottom = 8;
    m.paddingLeft = m.paddingRight = 8;
    m.cornerRadius = 12;
    m.fills = [solid(WHITE)];
    m.resize(196, 10);
    m.layoutSizingHorizontal = 'FIXED';
    m.layoutSizingVertical = 'HUG';
    m.appendChild(txt(k, outfit('Bold'), 10, MUTED));
    m.appendChild(txt(v, outfit('SemiBold'), 16, INK));
    summaryMetrics.appendChild(m);
  }
  summary.appendChild(summaryMetrics);
  summary.appendChild(pill('Все курсы', { r: 0.941, g: 0.945, b: 0.953 }, MUTED));
  summary.appendChild(
    txt('Сбалансированный темп: успеете вспомнить сочетание и нажать его.', outfit('Regular'), 12, MUTED, 600),
  );
  examCard.appendChild(summary);
  examCard.appendChild(instPrimary('Начать экзамен'));
  exam.appendChild(examCard);

  const examEmpty = al('VERTICAL', 'Exam empty');
  examEmpty.itemSpacing = 16;
  examEmpty.primaryAxisAlignItems = 'CENTER';
  examEmpty.counterAxisAlignItems = 'CENTER';
  examEmpty.resize(680, 10);
  examEmpty.layoutSizingHorizontal = 'FIXED';
  examEmpty.layoutSizingVertical = 'HUG';
  const examEmptyCard = al('VERTICAL', 'Exam empty card');
  examEmptyCard.itemSpacing = 10;
  examEmptyCard.primaryAxisAlignItems = 'CENTER';
  examEmptyCard.paddingTop = examEmptyCard.paddingBottom = 40;
  examEmptyCard.paddingLeft = examEmptyCard.paddingRight = 32;
  examEmptyCard.cornerRadius = 24;
  examEmptyCard.fills = [solid(WHITE)];
  examEmptyCard.resize(420, 10);
  examEmptyCard.layoutSizingHorizontal = 'FIXED';
  examEmptyCard.layoutSizingVertical = 'HUG';
  examEmptyCard.appendChild(txt('Нет вопросов', outfit('SemiBold'), 22, INK));
  examEmptyCard.appendChild(txt('Выберите другой курс или запустите backend.', outfit('Regular'), 13, MUTED, 340));
  examEmptyCard.appendChild(instPrimary('Назад к настройке'));
  examEmpty.appendChild(examEmptyCard);

  const trainEmpty = instEmpty('Нет заданий', 'Запустите backend и обновите страницу') || (() => {
    const c = al('VERTICAL', 'Training empty');
    c.itemSpacing = 8;
    c.primaryAxisAlignItems = 'CENTER';
    c.appendChild(txt('Нет заданий', outfit('SemiBold'), 22, INK));
    c.appendChild(txt('Запустите backend и обновите страницу', outfit('Regular'), 13, MUTED, 340));
    return c;
  })();
  const trainDone = al('VERTICAL', 'Training done card');
  trainDone.itemSpacing = 10;
  trainDone.primaryAxisAlignItems = 'CENTER';
  trainDone.paddingTop = trainDone.paddingBottom = 40;
  trainDone.paddingLeft = trainDone.paddingRight = 32;
  trainDone.cornerRadius = 24;
  trainDone.fills = [solid(WHITE)];
  trainDone.resize(420, 10);
  trainDone.layoutSizingHorizontal = 'FIXED';
  trainDone.layoutSizingVertical = 'HUG';
  trainDone.appendChild(txt('Тренировка завершена', outfit('SemiBold'), 22, INK));
  trainDone.appendChild(txt('Выполнено 13 из 13 заданий', outfit('Regular'), 13, MUTED));
  trainDone.appendChild(txt('Все сочетания дались уверенно. Отличная работа!', outfit('Regular'), 13, SUCCESS, 340));
  trainDone.appendChild(instPrimary('Пройти ещё раз'));
  const reviewEmpty = instEmpty(
    'Нет карточек',
    'Сначала загрузите курсы или выберите другой курс в параметрах.',
  ) || (() => {
    const c = al('VERTICAL', 'Review empty');
    c.itemSpacing = 8;
    c.primaryAxisAlignItems = 'CENTER';
    c.appendChild(txt('Нет карточек', outfit('SemiBold'), 22, INK));
    c.appendChild(txt('Сначала загрузите курсы или выберите другой курс в параметрах.', outfit('Regular'), 13, MUTED, 340));
    return c;
  })();

  const review = al('VERTICAL', 'Review card');
  review.itemSpacing = 12;
  review.appendChild(txt('Повторение', fraunces('Bold'), 32, INK));
  review.appendChild(txt('Выберите курс. На карточке видно, для какой программы сочетание.', outfit('Regular'), 13, MUTED, 520));
  review.appendChild(field('КУРС', 'Основные горячие клавиши программиста', INK));
  review.appendChild(txt('1 / 19', outfit('SemiBold'), 13, MUTED));
  const reviewFace = al('VERTICAL', 'face');
  reviewFace.itemSpacing = 12;
  reviewFace.paddingTop = reviewFace.paddingBottom = 32;
  reviewFace.paddingLeft = reviewFace.paddingRight = 24;
  reviewFace.cornerRadius = 24;
  reviewFace.fills = [solid(WHITE)];
  reviewFace.resize(416, 10);
  reviewFace.layoutSizingHorizontal = 'FIXED';
  reviewFace.layoutSizingVertical = 'HUG';
  reviewFace.primaryAxisAlignItems = 'CENTER';
  reviewFace.appendChild(txt('ОСНОВНЫЕ ГОРЯЧИЕ КЛАВИШИ ПРОГРАММИСТА', outfit('Bold'), 11, BRAND800));
  const reviewKeys = al('HORIZONTAL', 'combo');
  reviewKeys.itemSpacing = 8;
  reviewKeys.counterAxisAlignItems = 'CENTER';
  for (const k of ['Ctrl', 'X']) {
    const cap = instKeyCap(k);
    if (cap) {
      reviewKeys.appendChild(cap);
      continue;
    }
    const box = al('HORIZONTAL', k);
    box.paddingLeft = box.paddingRight = 12;
    box.paddingTop = box.paddingBottom = 8;
    box.cornerRadius = 12;
    box.fills = [solid(WHITE)];
    box.strokes = [solid(BRAND)];
    box.appendChild(txt(k, outfit('SemiBold'), 14, INK));
    reviewKeys.appendChild(box);
  }
  reviewFace.appendChild(reviewKeys);
  reviewFace.appendChild(txt('Вырезать', outfit('SemiBold'), 22, INK));
  reviewFace.appendChild(txt('Нажмите карточку — подробное объяснение на обороте', outfit('Regular'), 12, MUTED, 360));
  reviewFace.appendChild(instSecondary('Объяснение'));
  review.appendChild(reviewFace);
  review.appendChild(txt('Свайп влево или вправо — следующая карточка', outfit('Regular'), 12, MUTED, 400));

  const VSCODE_BG = { r: 0.118, g: 0.118, b: 0.118 };
  const VSCODE_SIDE = { r: 0.145, g: 0.145, b: 0.145 };
  const VSCODE_MUTED = { r: 0.63, g: 0.63, b: 0.63 };
  const VSCODE_STATUS = { r: 0, g: 0.478, b: 0.8 };
  const DESK_BG = { r: 0.04, g: 0.04, b: 0.1 };
  const PALETTE_SEL = { r: 0.035, g: 0.278, b: 0.443 };

  function makeCodeLab(name, overlay) {
    const isLight = overlay === 'light';
    const bg = isLight ? { r: 1, g: 1, b: 1 } : VSCODE_BG;
    const side = isLight ? { r: 0.953, g: 0.953, b: 0.953 } : VSCODE_SIDE;
    const inkC = isLight ? { r: 0.227, g: 0.227, b: 0.227 } : WHITE;
    const mutedC = isLight ? { r: 0.38, g: 0.38, b: 0.38 } : VSCODE_MUTED;
    const sim = al('VERTICAL', name);
    sim.fills = [solid(bg)];
    sim.itemSpacing = 0;
    sim.resize(960, 10);
    sim.layoutSizingHorizontal = 'FIXED';
    sim.layoutSizingVertical = 'HUG';
    const simBar = al('HORIZONTAL', 'menubar');
    simBar.primaryAxisAlignItems = 'SPACE_BETWEEN';
    simBar.counterAxisAlignItems = 'CENTER';
    simBar.paddingLeft = simBar.paddingRight = 12;
    simBar.paddingTop = simBar.paddingBottom = 8;
    simBar.fills = [solid(side)];
    simBar.resize(960, 36);
    simBar.layoutSizingHorizontal = 'FIXED';
    simBar.layoutSizingVertical = 'FIXED';
    simBar.appendChild(txt('File  Edit  View  Go  Run  Terminal  Help', outfit('Regular'), 11, mutedC, 420));
    simBar.appendChild(txt('keymaster-project', outfit('Regular'), 11, inkC));
    simBar.appendChild(txt('Рабочий стол · VS Code симулятор · К практике', outfit('Regular'), 11, inkC, 280));
    sim.appendChild(simBar);
    if (overlay === 'palette') {
      const palette = al('VERTICAL', 'Command palette');
      palette.itemSpacing = 0;
      palette.paddingTop = 12;
      palette.paddingLeft = palette.paddingRight = 180;
      palette.resize(960, 10);
      palette.layoutSizingHorizontal = 'FIXED';
      palette.layoutSizingVertical = 'HUG';
      const search = al('HORIZONTAL', 'palette search');
      search.counterAxisAlignItems = 'CENTER';
      search.itemSpacing = 8;
      search.paddingLeft = search.paddingRight = 12;
      search.paddingTop = search.paddingBottom = 10;
      search.fills = [solid(bg)];
      search.strokes = [solid(inkC, 0.12)];
      search.resize(600, 10);
      search.layoutSizingHorizontal = 'FIXED';
      search.layoutSizingVertical = 'HUG';
      search.appendChild(txt('Type a command...', outfit('Regular'), 13, mutedC, 480));
      const esc = al('HORIZONTAL', 'Esc');
      esc.paddingLeft = esc.paddingRight = 6;
      esc.paddingTop = esc.paddingBottom = 2;
      esc.cornerRadius = 4;
      esc.fills = [solid(side)];
      esc.appendChild(txt('Esc', outfit('Regular'), 10, mutedC));
      search.appendChild(esc);
      palette.appendChild(search);
      const list = al('VERTICAL', 'palette list');
      list.itemSpacing = 0;
      list.fills = [solid(side)];
      list.strokes = [solid(inkC, 0.12)];
      list.resize(600, 10);
      list.layoutSizingHorizontal = 'FIXED';
      list.layoutSizingVertical = 'HUG';
      const rows = [
        ['File', 'File: New File', 'Ctrl+N', true],
        ['File', 'File: New Folder', '', false],
        ['File', 'File: Save', 'Ctrl+S', false],
        ['File', 'File: Save All', 'Ctrl+Shift+S', false],
        ['File', 'File: Open File', 'Ctrl+O', false],
      ];
      for (const [cat, label, chord, on] of rows) {
        const row = al('HORIZONTAL', label);
        row.counterAxisAlignItems = 'CENTER';
        row.itemSpacing = 8;
        row.paddingLeft = row.paddingRight = 12;
        row.paddingTop = row.paddingBottom = 8;
        row.fills = [solid(on ? PALETTE_SEL : side)];
        row.resize(598, 10);
        row.layoutSizingHorizontal = 'FIXED';
        row.layoutSizingVertical = 'HUG';
        row.appendChild(txt(cat, outfit('Regular'), 10, on ? inkC : mutedC, 48));
        row.appendChild(txt(label, outfit('Regular'), 13, on ? inkC : { r: 0.8, g: 0.8, b: 0.82 }, 320));
        if (chord) row.appendChild(txt(chord, outfit('Regular'), 10, mutedC));
        list.appendChild(row);
      }
      palette.appendChild(list);
      sim.appendChild(palette);
    } else if (overlay === 'quickopen') {
      const palette = al('VERTICAL', 'Quick Open');
      palette.itemSpacing = 0;
      palette.paddingTop = 12;
      palette.paddingLeft = palette.paddingRight = 180;
      palette.resize(960, 10);
      palette.layoutSizingHorizontal = 'FIXED';
      palette.layoutSizingVertical = 'HUG';
      const search = al('HORIZONTAL', 'quickopen search');
      search.counterAxisAlignItems = 'CENTER';
      search.itemSpacing = 8;
      search.paddingLeft = search.paddingRight = 12;
      search.paddingTop = search.paddingBottom = 10;
      search.fills = [solid(bg)];
      search.strokes = [solid(inkC, 0.12)];
      search.resize(600, 10);
      search.layoutSizingHorizontal = 'FIXED';
      search.layoutSizingVertical = 'HUG';
      search.appendChild(txt('Search files by name...', outfit('Regular'), 13, mutedC, 480));
      const esc = al('HORIZONTAL', 'Esc');
      esc.paddingLeft = esc.paddingRight = 6;
      esc.paddingTop = esc.paddingBottom = 2;
      esc.cornerRadius = 4;
      esc.fills = [solid(side)];
      esc.appendChild(txt('Esc', outfit('Regular'), 10, mutedC));
      search.appendChild(esc);
      palette.appendChild(search);
      const list = al('VERTICAL', 'quickopen list');
      list.itemSpacing = 0;
      list.fills = [solid(side)];
      list.strokes = [solid(inkC, 0.12)];
      list.resize(600, 10);
      list.layoutSizingHorizontal = 'FIXED';
      list.layoutSizingVertical = 'HUG';
      const files = [
        ['README.md', true],
        ['package.json', false],
        ['index.html', false],
      ];
      for (const [label, on] of files) {
        const row = al('HORIZONTAL', label);
        row.counterAxisAlignItems = 'CENTER';
        row.itemSpacing = 8;
        row.paddingLeft = row.paddingRight = 12;
        row.paddingTop = row.paddingBottom = 8;
        row.fills = [solid(on ? PALETTE_SEL : side)];
        row.resize(598, 10);
        row.layoutSizingHorizontal = 'FIXED';
        row.layoutSizingVertical = 'HUG';
        row.appendChild(txt(label, outfit('Regular'), 13, on ? inkC : { r: 0.8, g: 0.8, b: 0.82 }, 520));
        list.appendChild(row);
      }
      palette.appendChild(list);
      sim.appendChild(palette);
    } else if (overlay === 'menufile') {
      const menu = al('VERTICAL', 'File menu');
      menu.itemSpacing = 0;
      menu.paddingTop = menu.paddingBottom = 4;
      menu.paddingLeft = 12;
      menu.fills = [solid(side)];
      menu.strokes = [solid(inkC, 0.12)];
      menu.resize(280, 10);
      menu.layoutSizingHorizontal = 'FIXED';
      menu.layoutSizingVertical = 'HUG';
      for (const [label, chord] of [
        ['New File', 'Ctrl+N'],
        ['New Folder', ''],
        ['Open Folder from Computer…', ''],
        ['Open Files from Computer…', ''],
        ['Save', 'Ctrl+S'],
        ['Save All', 'Ctrl+Shift+S'],
        ['Open File', 'Ctrl+O'],
      ]) {
        const row = al('HORIZONTAL', label);
        row.primaryAxisAlignItems = 'SPACE_BETWEEN';
        row.counterAxisAlignItems = 'CENTER';
        row.paddingLeft = row.paddingRight = 12;
        row.paddingTop = row.paddingBottom = 6;
        row.resize(276, 10);
        row.layoutSizingHorizontal = 'FIXED';
        row.layoutSizingVertical = 'HUG';
        row.appendChild(txt(label, outfit('Regular'), 13, inkC, 180));
        if (chord) row.appendChild(txt(chord, outfit('Regular'), 11, mutedC));
        menu.appendChild(row);
      }
      sim.appendChild(menu);
    } else if (overlay === 'menuview') {
      const menu = al('VERTICAL', 'View menu');
      menu.itemSpacing = 0;
      menu.paddingTop = menu.paddingBottom = 4;
      menu.paddingLeft = 12;
      menu.fills = [solid(side)];
      menu.strokes = [solid(inkC, 0.12)];
      menu.resize(280, 10);
      menu.layoutSizingHorizontal = 'FIXED';
      menu.layoutSizingVertical = 'HUG';
      for (const [label, chord] of [
        ['Toggle Primary Side Bar', 'Ctrl+B'],
        ['Toggle Panel', 'Ctrl+`'],
        ['Toggle Keyboard Visualizer', ''],
        ['Command Palette', 'Ctrl+Shift+P'],
        ['Toggle Task Panel', ''],
      ]) {
        const row = al('HORIZONTAL', label);
        row.primaryAxisAlignItems = 'SPACE_BETWEEN';
        row.counterAxisAlignItems = 'CENTER';
        row.paddingLeft = row.paddingRight = 12;
        row.paddingTop = row.paddingBottom = 6;
        row.resize(276, 10);
        row.layoutSizingHorizontal = 'FIXED';
        row.layoutSizingVertical = 'HUG';
        row.appendChild(txt(label, outfit('Regular'), 13, inkC, 180));
        if (chord) row.appendChild(txt(chord, outfit('Regular'), 11, mutedC));
        menu.appendChild(row);
      }
      sim.appendChild(menu);
    } else if (overlay === 'manage') {
      const menu = al('VERTICAL', 'Manage menu');
      menu.itemSpacing = 0;
      menu.paddingTop = menu.paddingBottom = 4;
      menu.paddingLeft = 12;
      menu.fills = [solid(side)];
      menu.strokes = [solid(inkC, 0.12)];
      menu.resize(240, 10);
      menu.layoutSizingHorizontal = 'FIXED';
      menu.layoutSizingVertical = 'HUG';
      for (const label of ['Color Theme', 'Keyboard Visualizer', 'Extensions']) {
        const row = al('HORIZONTAL', label);
        row.paddingLeft = row.paddingRight = 12;
        row.paddingTop = row.paddingBottom = 6;
        row.appendChild(txt(label, outfit('Regular'), 13, inkC));
        menu.appendChild(row);
      }
      sim.appendChild(menu);
    } else if (overlay === 'menuedit' || overlay === 'menugo' || overlay === 'menurun' || overlay === 'menuterm' || overlay === 'menuhelp') {
      const spec = {
        menuedit: ['Edit menu', [['Undo', 'Ctrl+Z'], ['Redo', 'Ctrl+Y'], ['Find', 'Ctrl+F'], ['Replace', 'Ctrl+H']]],
        menugo: ['Go menu', [['Go to File…', 'Ctrl+P'], ['Next Tab', 'Ctrl+Tab'], ['Close Tab', 'Ctrl+W'], ['Reopen Closed Tab', 'Ctrl+Shift+T']]],
        menurun: ['Run menu', [['Run Code', 'F5'], ['Start First Task', '']]],
        menuterm: ['Terminal menu', [['Toggle Terminal', 'Ctrl+`'], ['Clear Terminal', '']]],
        menuhelp: ['Help menu', [['Command Palette', 'Ctrl+Shift+P'], ['Show Hint', ''], ['Skip Task', '']]],
      }[overlay];
      const menu = al('VERTICAL', spec[0]);
      menu.itemSpacing = 0;
      menu.paddingTop = menu.paddingBottom = 4;
      menu.paddingLeft = 12;
      menu.fills = [solid(side)];
      menu.strokes = [solid(inkC, 0.12)];
      menu.resize(280, 10);
      menu.layoutSizingHorizontal = 'FIXED';
      menu.layoutSizingVertical = 'HUG';
      for (const [label, chord] of spec[1]) {
        const row = al('HORIZONTAL', label);
        row.primaryAxisAlignItems = 'SPACE_BETWEEN';
        row.counterAxisAlignItems = 'CENTER';
        row.paddingLeft = row.paddingRight = 12;
        row.paddingTop = row.paddingBottom = 6;
        row.resize(276, 10);
        row.layoutSizingHorizontal = 'FIXED';
        row.layoutSizingVertical = 'HUG';
        row.appendChild(txt(label, outfit('Regular'), 13, inkC, 180));
        if (chord) row.appendChild(txt(chord, outfit('Regular'), 11, mutedC));
        menu.appendChild(row);
      }
      sim.appendChild(menu);
    }
    const simBody = al('HORIZONTAL', 'panes');
    simBody.itemSpacing = 0;
    const explorer = al('VERTICAL', overlay === 'search' ? 'Search' : overlay === 'scm' ? 'Source Control' : overlay === 'run' ? 'Run and Debug' : overlay === 'extensions' ? 'Extensions' : 'Explorer');
    explorer.fills = [solid(side)];
    explorer.paddingTop = explorer.paddingBottom = 12;
    explorer.paddingLeft = explorer.paddingRight = 12;
    explorer.itemSpacing = 6;
    explorer.resize(220, 10);
    explorer.layoutSizingHorizontal = 'FIXED';
    explorer.layoutSizingVertical = 'HUG';
    if (overlay === 'search') {
      explorer.appendChild(txt('SEARCH', outfit('Bold'), 10, mutedC));
      explorer.appendChild(txt('Search across files', outfit('Regular'), 12, mutedC, 196));
      explorer.appendChild(txt('Aa', outfit('Regular'), 11, mutedC));
      explorer.appendChild(txt('Type to search across all files', outfit('Regular'), 12, mutedC, 196));
    } else if (overlay === 'scm') {
      explorer.appendChild(txt('SOURCE CONTROL', outfit('Bold'), 10, mutedC));
      explorer.appendChild(txt('Git не подключён', outfit('SemiBold'), 13, inkC, 196));
      explorer.appendChild(
        txt(
          'В учебном симуляторе нет связи с Git на ноутбуке. Импортируйте папку через Explorer и работайте с файлами локально в редакторе.',
          outfit('Regular'),
          11,
          mutedC,
          196,
        ),
      );
    } else if (overlay === 'run') {
      explorer.appendChild(txt('RUN AND DEBUG', outfit('Bold'), 10, mutedC));
      explorer.appendChild(txt('Run (F5)', outfit('SemiBold'), 13, inkC));
      explorer.appendChild(txt('Нет открытого файла. Откройте файл из Explorer.', outfit('Regular'), 11, mutedC, 196));
      explorer.appendChild(txt('Терминал', outfit('SemiBold'), 12, inkC));
      explorer.appendChild(txt('run file.py', outfit('Regular'), 11, mutedC));
      explorer.appendChild(txt('python file.py', outfit('Regular'), 11, mutedC));
      explorer.appendChild(txt('preview index.html', outfit('Regular'), 11, mutedC));
      explorer.appendChild(txt('Показать терминал', outfit('Regular'), 12, { r: 0.53, g: 0.81, b: 1 }));
    } else if (overlay === 'extensions') {
      explorer.appendChild(txt('EXTENSIONS & LAB', outfit('Bold'), 10, mutedC));
      explorer.appendChild(
        txt(
          'Магазин расширений VS Code здесь не подключён. Ниже — настройки и импорт проекта с вашего компьютера.',
          outfit('Regular'),
          11,
          mutedC,
          196,
        ),
      );
      explorer.appendChild(txt('Папка с компьютера', outfit('Regular'), 12, inkC));
      explorer.appendChild(txt('Файлы с компьютера', outfit('Regular'), 12, inkC));
      explorer.appendChild(txt('Светлая тема', outfit('Regular'), 12, inkC));
      explorer.appendChild(txt('Показать клавиатуру', outfit('Regular'), 12, inkC, 196));
      explorer.appendChild(txt('Скрыть Tasks', outfit('Regular'), 12, inkC));
    } else {
      explorer.appendChild(txt('EXPLORER', outfit('Bold'), 10, mutedC));
      explorer.appendChild(txt('KEYMASTER-PROJECT', outfit('Bold'), 10, inkC));
      if (overlay === 'newfile') explorer.appendChild(txt('filename.js', outfit('Regular'), 12, mutedC));
      explorer.appendChild(txt('src', outfit('Regular'), 12, inkC));
      explorer.appendChild(txt('README.md', outfit('Regular'), 12, inkC));
      explorer.appendChild(txt('package.json', outfit('Regular'), 12, inkC));
      explorer.appendChild(txt('index.html', outfit('Regular'), 12, inkC));
    }
    const editor = al('VERTICAL', 'Editor');
    editor.fills = [solid(bg)];
    editor.paddingTop = editor.paddingBottom = overlay === 'find' ? 8 : 32;
    editor.paddingLeft = editor.paddingRight = 24;
    editor.itemSpacing = 8;
    editor.primaryAxisAlignItems = overlay === 'find' ? 'MIN' : 'CENTER';
    editor.resize(460, 10);
    editor.layoutSizingHorizontal = 'FIXED';
    editor.layoutSizingVertical = 'HUG';
    if (overlay === 'find') {
      const findBar = al('HORIZONTAL', 'Find bar');
      findBar.counterAxisAlignItems = 'CENTER';
      findBar.itemSpacing = 8;
      findBar.paddingLeft = findBar.paddingRight = 8;
      findBar.paddingTop = findBar.paddingBottom = 6;
      findBar.fills = [solid(side)];
      findBar.resize(412, 10);
      findBar.layoutSizingHorizontal = 'FIXED';
      findBar.layoutSizingVertical = 'HUG';
      findBar.appendChild(txt('Find', outfit('Regular'), 12, mutedC, 200));
      findBar.appendChild(txt('0 results', outfit('Regular'), 11, mutedC));
      findBar.appendChild(txt('Esc', outfit('Regular'), 11, mutedC));
      editor.appendChild(findBar);
      editor.appendChild(txt('# Keymaster Project', outfit('Regular'), 13, inkC, 400));
    } else if (overlay === 'preview') {
      editor.appendChild(txt('<!doctype html>', outfit('Regular'), 13, inkC, 400));
    } else {
      for (const [label, chord] of [
        ['Show All Commands', 'Ctrl+Shift+P'],
        ['Go to File', 'Ctrl+P'],
        ['Find in Files', 'Ctrl+Shift+F'],
        ['Toggle Terminal', 'Ctrl+`'],
        ['Toggle Primary Side Bar', 'Ctrl+B'],
      ]) {
        editor.appendChild(txt(label + '  ' + chord, outfit('Regular'), 12, mutedC, 400));
      }
    }
    const tasks = al('VERTICAL', 'Задачи');
    tasks.fills = [solid(side)];
    tasks.paddingTop = tasks.paddingBottom = overlay === 'task' || overlay === 'tasklist' ? 10 : 16;
    tasks.paddingLeft = tasks.paddingRight = 16;
    tasks.itemSpacing = 8;
    tasks.primaryAxisAlignItems = overlay === 'task' || overlay === 'tasklist' ? 'MIN' : 'CENTER';
    tasks.resize(280, 10);
    tasks.layoutSizingHorizontal = 'FIXED';
    tasks.layoutSizingVertical = 'HUG';
    tasks.appendChild(txt(overlay === 'task' || overlay === 'taskrun' || overlay === 'hint' ? 'ЗАДАЧИ · 15 XP' : 'ЗАДАЧИ · 0 XP', outfit('Bold'), 11, inkC));
    if (overlay === 'task') {
      tasks.appendChild(txt('Текущая', outfit('SemiBold'), 12, { r: 0.53, g: 0.81, b: 1 }));
      tasks.appendChild(txt('Задача выполнена!', outfit('SemiBold'), 14, { r: 0.086, g: 0.639, b: 0.29 }));
      tasks.appendChild(txt('+15 XP', outfit('SemiBold'), 12, { r: 0.53, g: 0.81, b: 1 }));
      tasks.appendChild(txt('Следующая задача', outfit('SemiBold'), 13, inkC));
      tasks.appendChild(txt('НАЧАЛЬНЫЙ', outfit('Bold'), 10, { r: 0.086, g: 0.639, b: 0.29 }));
      tasks.appendChild(txt('проводник', outfit('Regular'), 11, mutedC));
      tasks.appendChild(txt('Создать новый файл', outfit('SemiBold'), 14, inkC, 248));
      tasks.appendChild(
        txt('Создайте новый файл в проекте — через сочетание клавиш или контекстное меню.', outfit('Regular'), 11, mutedC, 248),
      );
      tasks.appendChild(txt('Прогресс', outfit('Regular'), 11, mutedC));
      tasks.appendChild(txt('100%', outfit('Regular'), 11, mutedC));
      tasks.appendChild(txt('ШАГИ', outfit('Bold'), 10, mutedC));
      tasks.appendChild(txt('В проекте появился новый файл', outfit('Regular'), 12, inkC, 248));
      tasks.appendChild(txt('Сочетание', outfit('Regular'), 11, mutedC));
      tasks.appendChild(txt('Ctrl+N', outfit('Regular'), 12, inkC));
      tasks.appendChild(txt('Подсказка (0/3)', outfit('Regular'), 12, inkC));
      tasks.appendChild(txt('Пропустить задачу', outfit('Regular'), 12, mutedC));
      tasks.appendChild(txt('Задача выполнена: Создать новый файл', outfit('Regular'), 12, inkC, 248));
    } else if (overlay === 'taskrun' || overlay === 'hint') {
      tasks.appendChild(txt('Текущая', outfit('SemiBold'), 12, { r: 0.53, g: 0.81, b: 1 }));
      tasks.appendChild(txt('НАЧАЛЬНЫЙ', outfit('Bold'), 10, { r: 0.086, g: 0.639, b: 0.29 }));
      tasks.appendChild(txt('проводник', outfit('Regular'), 11, mutedC));
      tasks.appendChild(txt('Создать папку', outfit('SemiBold'), 14, inkC, 248));
      tasks.appendChild(txt('Создайте в корне проекта папку с именем «assets».', outfit('Regular'), 11, mutedC, 248));
      tasks.appendChild(txt('Прогресс', outfit('Regular'), 11, mutedC));
      tasks.appendChild(txt('0%', outfit('Regular'), 11, mutedC));
      tasks.appendChild(txt('ШАГИ', outfit('Bold'), 10, mutedC));
      tasks.appendChild(txt('В корне есть папка «assets»', outfit('Regular'), 12, inkC, 248));
      tasks.appendChild(txt(overlay === 'hint' ? 'Подсказка (1/3)' : 'Подсказка (0/3)', outfit('Regular'), 12, inkC));
      if (overlay === 'hint') {
        tasks.appendChild(
          txt('Подсказка 1: Папку нужно создать на верхнем уровне проекта.', outfit('Regular'), 11, mutedC, 248),
        );
      }
      tasks.appendChild(txt('Пропустить задачу', outfit('Regular'), 12, mutedC));
    } else if (overlay === 'tasklist') {
      tasks.appendChild(txt('Все задачи', outfit('SemiBold'), 12, { r: 0.53, g: 0.81, b: 1 }));
      for (const [title, meta] of [
        ['Создать новый файл', '+15 XP · Начальный'],
        ['Создать папку', '+20 XP · Начальный'],
        ['Переименовать файл', '+15 XP · Начальный'],
      ]) {
        tasks.appendChild(txt(title, outfit('SemiBold'), 13, inkC, 248));
        tasks.appendChild(txt(meta, outfit('Regular'), 11, mutedC));
      }
    } else {
      tasks.appendChild(txt('Текущая', outfit('SemiBold'), 12, { r: 0.53, g: 0.81, b: 1 }));
      tasks.appendChild(txt('Готовы к практике?', outfit('SemiBold'), 16, inkC, 240));
      tasks.appendChild(
        txt('Выберите задачу и отработайте сочетания клавиш на реальных действиях в симуляторе.', outfit('Regular'), 12, mutedC, 240),
      );
      tasks.appendChild(instPrimary('Начать первую задачу'));
    }
    simBody.appendChild(explorer);
    simBody.appendChild(editor);
    if (overlay === 'preview') {
      const preview = al('VERTICAL', 'Preview');
      preview.fills = [solid(WHITE)];
      preview.paddingTop = preview.paddingBottom = 12;
      preview.paddingLeft = preview.paddingRight = 12;
      preview.itemSpacing = 8;
      preview.resize(220, 10);
      preview.layoutSizingHorizontal = 'FIXED';
      preview.layoutSizingVertical = 'HUG';
      preview.appendChild(txt('PREVIEW — INDEX.HTML', outfit('Bold'), 10, MUTED));
      preview.appendChild(txt('index.html', outfit('Regular'), 12, INK));
      simBody.appendChild(preview);
    }
    simBody.appendChild(tasks);
    sim.appendChild(simBody);
    if (overlay === 'terminal') {
      const term = al('VERTICAL', 'Terminal');
      term.itemSpacing = 6;
      term.paddingTop = term.paddingBottom = 10;
      term.paddingLeft = term.paddingRight = 12;
      term.fills = [solid(bg)];
      term.strokes = [solid(inkC, 0.08)];
      term.resize(960, 10);
      term.layoutSizingHorizontal = 'FIXED';
      term.layoutSizingVertical = 'HUG';
      term.appendChild(txt('Terminal', outfit('Medium'), 13, inkC));
      term.appendChild(txt('python index.py · node app.js · run page.html · help', outfit('Regular'), 12, mutedC, 720));
      term.appendChild(txt('$ ~', outfit('Regular'), 13, { r: 0.53, g: 0.81, b: 1 }));
      sim.appendChild(term);
    }
    if (overlay === 'kbviz') {
      const kb = al('VERTICAL', 'Keyboard Visualizer');
      kb.itemSpacing = 6;
      kb.paddingTop = kb.paddingBottom = 8;
      kb.paddingLeft = kb.paddingRight = 12;
      kb.fills = [solid(side)];
      kb.resize(960, 10);
      kb.layoutSizingHorizontal = 'FIXED';
      kb.layoutSizingVertical = 'HUG';
      kb.appendChild(txt('KEYBOARD VISUALIZER', outfit('Bold'), 10, mutedC));
      kb.appendChild(txt('Esc  F1  F2  F3  F4  F5  F6  F7  F8', outfit('Regular'), 11, inkC, 720));
      kb.appendChild(txt('Bksp  Tab  Caps  Enter  Win  Space', outfit('Regular'), 11, inkC, 720));
      sim.appendChild(kb);
    }
    const status = al('HORIZONTAL', 'status bar');
    status.primaryAxisAlignItems = 'SPACE_BETWEEN';
    status.paddingLeft = status.paddingRight = 12;
    status.paddingTop = status.paddingBottom = 6;
    status.fills = [solid(VSCODE_STATUS)];
    status.resize(960, 28);
    status.layoutSizingHorizontal = 'FIXED';
    status.layoutSizingVertical = 'FIXED';
    status.appendChild(txt('main  ·  Tasks', outfit('Regular'), 11, WHITE));
    status.appendChild(txt('Ln 1, Col 1  ·  UTF-8  ·  Plain Text', outfit('Regular'), 11, WHITE));
    sim.appendChild(status);
    if (overlay === 'toast') {
      const toastRow = al('HORIZONTAL', 'notification row');
      toastRow.primaryAxisAlignItems = 'MAX';
      toastRow.paddingRight = 12;
      toastRow.paddingTop = 8;
      toastRow.resize(960, 10);
      toastRow.layoutSizingHorizontal = 'FIXED';
      toastRow.layoutSizingVertical = 'HUG';
      const toast = al('HORIZONTAL', 'File saved toast');
      toast.counterAxisAlignItems = 'CENTER';
      toast.itemSpacing = 8;
      toast.paddingTop = toast.paddingBottom = 12;
      toast.paddingLeft = toast.paddingRight = 12;
      toast.cornerRadius = 8;
      toast.fills = [solid(side)];
      toast.strokes = [solid(SUCCESS, 0.3)];
      toast.resize(320, 10);
      toast.layoutSizingHorizontal = 'FIXED';
      toast.layoutSizingVertical = 'HUG';
      toast.appendChild(txt('File saved', outfit('Medium'), 14, inkC, 260));
      toastRow.appendChild(toast);
      sim.appendChild(toastRow);
    }
    return sim;
  }

  function deskWin(title, pathLabel, countLabel, empty) {
    const win = al('VERTICAL', title + ' window');
    win.itemSpacing = 0;
    win.cornerRadius = 8;
    win.fills = [solid({ r: 0.12, g: 0.13, b: 0.16 })];
    win.strokes = [solid(WHITE, 0.18)];
    win.resize(600, 10);
    win.layoutSizingHorizontal = 'FIXED';
    win.layoutSizingVertical = 'HUG';
    const bar = al('HORIZONTAL', title);
    bar.primaryAxisAlignItems = 'SPACE_BETWEEN';
    bar.counterAxisAlignItems = 'CENTER';
    bar.paddingLeft = 12;
    bar.paddingRight = 8;
    bar.paddingTop = bar.paddingBottom = 6;
    bar.fills = [solid({ r: 0.16, g: 0.17, b: 0.2 })];
    bar.resize(598, 32);
    bar.layoutSizingHorizontal = 'FIXED';
    bar.layoutSizingVertical = 'FIXED';
    bar.appendChild(txt(title, outfit('Regular'), 12, WHITE));
    bar.appendChild(txt('−  □  ×', outfit('Regular'), 12, WHITE));
    win.appendChild(bar);
    const body = al('HORIZONTAL', title + ' body');
    body.itemSpacing = 0;
    const side = al('VERTICAL', 'sidebar');
    side.itemSpacing = 6;
    side.paddingTop = side.paddingBottom = 8;
    side.paddingLeft = side.paddingRight = 8;
    side.fills = [solid({ r: 0.14, g: 0.15, b: 0.18 })];
    side.resize(160, 10);
    side.layoutSizingHorizontal = 'FIXED';
    side.layoutSizingVertical = 'HUG';
    for (const label of ['Рабочий стол', 'Документы', 'Загрузки', 'Projects', 'Корзина']) {
      const on = (title === 'Проводник' && label === 'Рабочий стол') || (title === 'Корзина' && label === 'Корзина');
      side.appendChild(txt(label, outfit(on ? 'SemiBold' : 'Regular'), 12, on ? WHITE : VSCODE_MUTED));
    }
    side.appendChild(txt('Текущая папка: ' + pathLabel, outfit('Regular'), 10, VSCODE_MUTED, 140));
    const main = al('VERTICAL', 'files');
    main.itemSpacing = 8;
    main.paddingTop = main.paddingBottom = 8;
    main.paddingLeft = main.paddingRight = 10;
    main.resize(438, 10);
    main.layoutSizingHorizontal = 'FIXED';
    main.layoutSizingVertical = 'HUG';
    const tool = al('HORIZONTAL', 'toolbar');
    tool.primaryAxisAlignItems = 'SPACE_BETWEEN';
    tool.counterAxisAlignItems = 'CENTER';
    tool.resize(418, 10);
    tool.layoutSizingHorizontal = 'FIXED';
    tool.layoutSizingVertical = 'HUG';
    tool.appendChild(txt(pathLabel, outfit('Regular'), 12, WHITE, 260));
    tool.appendChild(txt(countLabel, outfit('Regular'), 11, VSCODE_MUTED));
    main.appendChild(tool);
    if (empty) main.appendChild(txt('Эта папка пуста', outfit('Regular'), 13, VSCODE_MUTED, 400));
    else main.appendChild(txt('Welcome.txt', outfit('Regular'), 12, WHITE));
    body.appendChild(side);
    body.appendChild(main);
    win.appendChild(body);
    return win;
  }

  function makeDesktopSim(name, overlay) {
    const isLight = overlay === 'light';
    const deskBg = isLight ? { r: 0.91, g: 0.91, b: 0.91 } : DESK_BG;
    const deskInk = isLight ? { r: 0.102, g: 0.102, b: 0.102 } : WHITE;
    const desk = al('VERTICAL', name);
    desk.fills = [solid(deskBg)];
    desk.itemSpacing = 0;
    desk.resize(960, 10);
    desk.layoutSizingHorizontal = 'FIXED';
    desk.layoutSizingVertical = 'HUG';
    const deskBody = al('HORIZONTAL', 'desktop body');
    deskBody.itemSpacing = 0;
    const deskWork = al('VERTICAL', 'workspace');
    deskWork.itemSpacing = 12;
    deskWork.paddingTop = 20;
    deskWork.paddingLeft = deskWork.paddingRight = 20;
    deskWork.paddingBottom = 20;
    deskWork.resize(640, 10);
    deskWork.layoutSizingHorizontal = 'FIXED';
    deskWork.layoutSizingVertical = 'HUG';
    const icons = al('VERTICAL', 'icons');
    icons.itemSpacing = 12;
    const iconFill = {
      'Этот компьютер': { r: 0.22, g: 0.48, b: 0.72 },
      Корзина: { r: 0.4, g: 0.55, b: 0.65 },
      'Visual Studio Code': BRAND,
      'Welcome.txt': WHITE,
    };
    for (const label of ['Этот компьютер', 'Корзина', 'Visual Studio Code', 'Welcome.txt']) {
      const ic = al('VERTICAL', label);
      ic.itemSpacing = 4;
      ic.primaryAxisAlignItems = 'CENTER';
      const box = figma.createRectangle();
      box.resize(36, 36);
      box.cornerRadius = 8;
      box.fills = [solid(iconFill[label])];
      ic.appendChild(box);
      ic.appendChild(txt(label, outfit('Regular'), 11, deskInk, 120));
      icons.appendChild(ic);
    }
    if (overlay === 'fromlesson') {
      const back = al('HORIZONTAL', '← К уроку');
      back.paddingTop = back.paddingBottom = 6;
      back.paddingLeft = back.paddingRight = 12;
      back.cornerRadius = 8;
      back.fills = [solid({ r: 0, g: 0, b: 0 }, 0.55)];
      back.appendChild(txt('← К уроку', outfit('SemiBold'), 12, WHITE));
      deskWork.appendChild(back);
    }
    deskWork.appendChild(icons);
    if (!overlay) {
      const tip = al('VERTICAL', 'С чего начать');
      tip.itemSpacing = 8;
      tip.paddingTop = tip.paddingBottom = 14;
      tip.paddingLeft = tip.paddingRight = 14;
      tip.cornerRadius = 12;
      tip.fills = [solid({ r: 0.08, g: 0.1, b: 0.16 }, 0.92)];
      tip.resize(320, 10);
      tip.layoutSizingHorizontal = 'FIXED';
      tip.layoutSizingVertical = 'HUG';
      tip.appendChild(txt('С чего начать', outfit('SemiBold'), 14, WHITE));
      tip.appendChild(
        txt(
          'Перетащите папку на VS Code — откроется в редакторе. На корзину — удалить. Можно двигать иконки по столу. Справа — задачи.',
          outfit('Regular'),
          12,
          { r: 0.8, g: 0.84, b: 0.9 },
          292,
        ),
      );
      tip.appendChild(instPrimary('Понятно'));
      deskWork.appendChild(tip);
    } else if (overlay === 'menu') {
      const menu = al('VERTICAL', 'Desktop context menu');
      menu.itemSpacing = 0;
      menu.paddingTop = menu.paddingBottom = 6;
      menu.paddingLeft = menu.paddingRight = 6;
      menu.cornerRadius = 10;
      menu.fills = [solid({ r: 0.14, g: 0.15, b: 0.18 }, 0.96)];
      menu.strokes = [solid(WHITE, 0.16)];
      menu.resize(200, 10);
      menu.layoutSizingHorizontal = 'FIXED';
      menu.layoutSizingVertical = 'HUG';
      for (const label of ['Новый файл', 'Новая папка', 'Открыть проводник']) {
        const row = al('HORIZONTAL', label);
        row.paddingLeft = row.paddingRight = 12;
        row.paddingTop = row.paddingBottom = 7;
        row.appendChild(txt(label, outfit('Regular'), 13, WHITE));
        menu.appendChild(row);
      }
      deskWork.appendChild(menu);
    } else if (overlay === 'explorer') {
      deskWork.appendChild(deskWin('Проводник', '/Рабочий стол', '1 объектов', false));
    } else if (overlay === 'trash') {
      deskWork.appendChild(deskWin('Корзина', '/Корзина', '0 объектов', true));
    } else if (overlay === 'start') {
      const start = al('VERTICAL', 'Start menu');
      start.itemSpacing = 10;
      start.paddingTop = start.paddingBottom = 16;
      start.paddingLeft = start.paddingRight = 16;
      start.cornerRadius = 16;
      start.fills = [solid({ r: 0.125, g: 0.125, b: 0.125 }, 0.94)];
      start.strokes = [solid(WHITE, 0.16)];
      start.resize(360, 10);
      start.layoutSizingHorizontal = 'FIXED';
      start.layoutSizingVertical = 'HUG';
      start.appendChild(txt('Закреплено', outfit('SemiBold'), 13, VSCODE_MUTED));
      const pins = al('HORIZONTAL', 'pinned');
      pins.itemSpacing = 12;
      for (const label of ['Проводник', 'Корзина', 'VS Code', 'Клавиатура']) {
        const pin = al('VERTICAL', label);
        pin.itemSpacing = 6;
        pin.primaryAxisAlignItems = 'CENTER';
        pin.appendChild(txt(label, outfit('Medium'), 12, WHITE, 80));
        pins.appendChild(pin);
      }
      start.appendChild(pins);
      const foot = al('HORIZONTAL', 'start footer');
      foot.primaryAxisAlignItems = 'SPACE_BETWEEN';
      foot.resize(328, 10);
      foot.layoutSizingHorizontal = 'FIXED';
      foot.layoutSizingVertical = 'HUG';
      foot.appendChild(txt('Тема', outfit('Regular'), 12, WHITE));
      foot.appendChild(txt('К практике', outfit('Regular'), 12, WHITE));
      start.appendChild(foot);
      deskWork.appendChild(start);
    } else if (overlay === 'editor') {
      const win = al('VERTICAL', 'Welcome.txt window');
      win.itemSpacing = 0;
      win.cornerRadius = 8;
      win.fills = [solid({ r: 0.12, g: 0.13, b: 0.16 })];
      win.strokes = [solid(WHITE, 0.18)];
      win.resize(560, 10);
      win.layoutSizingHorizontal = 'FIXED';
      win.layoutSizingVertical = 'HUG';
      const bar = al('HORIZONTAL', 'Welcome.txt');
      bar.primaryAxisAlignItems = 'SPACE_BETWEEN';
      bar.counterAxisAlignItems = 'CENTER';
      bar.paddingLeft = 12;
      bar.paddingRight = 8;
      bar.paddingTop = bar.paddingBottom = 6;
      bar.fills = [solid({ r: 0.16, g: 0.17, b: 0.2 })];
      bar.resize(558, 32);
      bar.layoutSizingHorizontal = 'FIXED';
      bar.layoutSizingVertical = 'FIXED';
      bar.appendChild(txt('Welcome.txt', outfit('Regular'), 12, WHITE));
      bar.appendChild(txt('−  □  ×', outfit('Regular'), 12, WHITE));
      win.appendChild(bar);
      const tool = al('HORIZONTAL', 'editor toolbar');
      tool.counterAxisAlignItems = 'CENTER';
      tool.itemSpacing = 8;
      tool.paddingLeft = tool.paddingRight = 10;
      tool.paddingTop = tool.paddingBottom = 6;
      tool.fills = [solid({ r: 0.14, g: 0.15, b: 0.18 })];
      tool.resize(558, 10);
      tool.layoutSizingHorizontal = 'FIXED';
      tool.layoutSizingVertical = 'HUG';
      tool.appendChild(txt('Сохранить', outfit('SemiBold'), 12, WHITE));
      tool.appendChild(txt('Welcome.txt', outfit('Regular'), 12, VSCODE_MUTED));
      tool.appendChild(txt('184 симв. · 5 строк', outfit('Regular'), 11, VSCODE_MUTED));
      win.appendChild(tool);
      const body = al('VERTICAL', 'editor body');
      body.paddingTop = body.paddingBottom = 12;
      body.paddingLeft = body.paddingRight = 12;
      body.appendChild(txt('Welcome to Keymaster Desktop Simulator!', outfit('Regular'), 13, WHITE, 520));
      win.appendChild(body);
      deskWork.appendChild(win);
    } else if (overlay === 'keyboard') {
      const kb = al('VERTICAL', 'Virtual keyboard');
      kb.itemSpacing = 6;
      kb.paddingTop = kb.paddingBottom = 10;
      kb.paddingLeft = kb.paddingRight = 12;
      kb.fills = [solid({ r: 0.12, g: 0.13, b: 0.16 })];
      kb.strokes = [solid(WHITE, 0.12)];
      kb.resize(600, 10);
      kb.layoutSizingHorizontal = 'FIXED';
      kb.layoutSizingVertical = 'HUG';
      kb.appendChild(txt('Клавиатура', outfit('SemiBold'), 12, VSCODE_MUTED));
      for (const row of [
        ['Esc', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'],
        ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
        ['Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
        ['Caps', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", 'Enter'],
        ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'Shift'],
        ['Ctrl', 'Alt', 'Space', 'Alt', 'Ctrl'],
      ]) {
        kb.appendChild(txt(row.join('  '), outfit('Regular'), 11, WHITE, 560));
      }
      deskWork.appendChild(kb);
    } else if (overlay === 'filemenu') {
      const menu = al('VERTICAL', 'File context menu');
      menu.itemSpacing = 0;
      menu.paddingTop = menu.paddingBottom = 6;
      menu.paddingLeft = menu.paddingRight = 6;
      menu.cornerRadius = 10;
      menu.fills = [solid({ r: 0.14, g: 0.15, b: 0.18 }, 0.96)];
      menu.strokes = [solid(WHITE, 0.16)];
      menu.resize(240, 10);
      menu.layoutSizingHorizontal = 'FIXED';
      menu.layoutSizingVertical = 'HUG';
      for (const label of ['Открыть', 'Открыть с помощью Code', 'Переименовать', 'Копировать', 'Вырезать', 'Удалить']) {
        const row = al('HORIZONTAL', label);
        row.paddingLeft = row.paddingRight = 12;
        row.paddingTop = row.paddingBottom = 7;
        row.appendChild(txt(label, outfit('Regular'), 13, label === 'Удалить' ? SIGNAL : WHITE));
        menu.appendChild(row);
      }
      deskWork.appendChild(menu);
    } else if (overlay === 'props') {
      deskWork.appendChild(deskWin('Проводник', '/Рабочий стол', '1 объектов', false));
      const modal = al('VERTICAL', 'Свойства');
      modal.itemSpacing = 8;
      modal.paddingTop = modal.paddingBottom = 16;
      modal.paddingLeft = modal.paddingRight = 16;
      modal.cornerRadius = 12;
      modal.fills = [solid({ r: 0.14, g: 0.15, b: 0.18 })];
      modal.strokes = [solid(WHITE, 0.16)];
      modal.resize(280, 10);
      modal.layoutSizingHorizontal = 'FIXED';
      modal.layoutSizingVertical = 'HUG';
      modal.appendChild(txt('Welcome.txt', outfit('SemiBold'), 15, WHITE));
      for (const [k, v] of [
        ['Тип', 'Файл'],
        ['Расположение', '/Рабочий стол'],
        ['Размер', '184 байт'],
        ['Создан', ''],
        ['Изменён', ''],
      ]) {
        const row = al('HORIZONTAL', k);
        row.primaryAxisAlignItems = 'SPACE_BETWEEN';
        row.resize(248, 10);
        row.layoutSizingHorizontal = 'FIXED';
        row.layoutSizingVertical = 'HUG';
        row.appendChild(txt(k, outfit('Regular'), 12, VSCODE_MUTED));
        if (v) row.appendChild(txt(v, outfit('Regular'), 12, WHITE));
        modal.appendChild(row);
      }
      modal.appendChild(txt('Закрыть', outfit('SemiBold'), 13, WHITE));
      deskWork.appendChild(modal);
    }
    const deskTasks = al('VERTICAL', 'desktop tasks');
    deskTasks.fills = [solid({ r: 0.12, g: 0.13, b: 0.16 })];
    deskTasks.paddingTop = deskTasks.paddingBottom = 16;
    deskTasks.paddingLeft = deskTasks.paddingRight = 14;
    deskTasks.itemSpacing = 8;
    deskTasks.resize(320, 10);
    deskTasks.layoutSizingHorizontal = 'FIXED';
    deskTasks.layoutSizingVertical = 'HUG';
    const taskHead = al('HORIZONTAL', 'task head');
    taskHead.primaryAxisAlignItems = 'SPACE_BETWEEN';
    taskHead.counterAxisAlignItems = 'CENTER';
    taskHead.resize(292, 10);
    taskHead.layoutSizingHorizontal = 'FIXED';
    taskHead.layoutSizingVertical = 'HUG';
    taskHead.appendChild(txt('ЗАДАЧИ', outfit('Bold'), 11, WHITE));
    taskHead.appendChild(txt('К практике', outfit('SemiBold'), 12, { r: 0.53, g: 0.81, b: 1 }));
    deskTasks.appendChild(taskHead);
    if (overlay === 'done') {
      deskTasks.appendChild(txt('Все задачи выполнены!', outfit('SemiBold'), 14, WHITE, 280));
      deskTasks.appendChild(txt('Вы заработали 160 XP. Отличная работа!', outfit('Regular'), 12, VSCODE_MUTED, 280));
      deskTasks.appendChild(txt('Прогресс', outfit('Regular'), 11, VSCODE_MUTED));
      deskTasks.appendChild(txt('12/12', outfit('Regular'), 11, VSCODE_MUTED));
      deskTasks.appendChild(txt('Заработано 160 XP', outfit('SemiBold'), 12, { r: 0.53, g: 0.81, b: 1 }));
      deskTasks.appendChild(txt('Создайте папку «Practice»  +10', outfit('Regular'), 12, VSCODE_MUTED, 280));
      deskTasks.appendChild(txt('Создайте файл «notes.txt»  +10', outfit('Regular'), 12, VSCODE_MUTED, 280));
      deskTasks.appendChild(txt('Переименуйте notes.txt в my-notes.txt  +10', outfit('Regular'), 12, VSCODE_MUTED, 280));
    } else {
      deskTasks.appendChild(txt('ТЕКУЩАЯ · 1/12', outfit('Bold'), 10, { r: 0.53, g: 0.81, b: 1 }));
      deskTasks.appendChild(txt('Создайте папку «Practice»', outfit('SemiBold'), 14, WHITE, 280));
      deskTasks.appendChild(txt('Прогресс', outfit('Regular'), 11, VSCODE_MUTED));
      deskTasks.appendChild(txt('0/12', outfit('Regular'), 11, VSCODE_MUTED));
      deskTasks.appendChild(txt('Заработано 0 XP', outfit('SemiBold'), 12, { r: 0.53, g: 0.81, b: 1 }));
      deskTasks.appendChild(txt('Создайте папку «Practice»  +10', outfit('Regular'), 12, WHITE, 280));
      deskTasks.appendChild(txt('Создайте файл «notes.txt»  +10', outfit('Regular'), 12, VSCODE_MUTED, 280));
      deskTasks.appendChild(txt('Переименуйте notes.txt в my-notes.txt  +10', outfit('Regular'), 12, VSCODE_MUTED, 280));
    }
    deskBody.appendChild(deskWork);
    deskBody.appendChild(deskTasks);
    desk.appendChild(deskBody);
    if (overlay === 'toast') {
      const toastRow = al('HORIZONTAL', 'desktop toast row');
      toastRow.primaryAxisAlignItems = 'CENTER';
      toastRow.paddingBottom = 8;
      toastRow.resize(960, 10);
      toastRow.layoutSizingHorizontal = 'FIXED';
      toastRow.layoutSizingVertical = 'HUG';
      const toast = al('HORIZONTAL', 'task toast');
      toast.paddingTop = toast.paddingBottom = 10;
      toast.paddingLeft = toast.paddingRight = 20;
      toast.cornerRadius = 10;
      toast.fills = [solid({ r: 0.424, g: 0.796, b: 0.373 })];
      toast.appendChild(txt('Задача выполнена! +65 XP на счёт', outfit('SemiBold'), 13, WHITE));
      toastRow.appendChild(toast);
      desk.appendChild(toastRow);
    }
    const taskbar = al('HORIZONTAL', 'taskbar');
    taskbar.primaryAxisAlignItems = 'SPACE_BETWEEN';
    taskbar.counterAxisAlignItems = 'CENTER';
    taskbar.paddingLeft = taskbar.paddingRight = 16;
    taskbar.paddingTop = taskbar.paddingBottom = 8;
    taskbar.fills = [solid(isLight ? { r: 0.953, g: 0.953, b: 0.953 } : { r: 0.06, g: 0.07, b: 0.1 }, isLight ? 0.94 : 0.92)];
    taskbar.resize(960, 40);
    taskbar.layoutSizingHorizontal = 'FIXED';
    taskbar.layoutSizingVertical = 'FIXED';
    taskbar.appendChild(txt('Пуск  ·  Поиск  ·  Проводник  ·  VS Code', outfit('Regular'), 11, deskInk, 420));
    taskbar.appendChild(txt('РУС  ·  11:04  24.08.2026', outfit('Regular'), 11, deskInk));
    desk.appendChild(taskbar);
    return desk;
  }

  const sim = makeCodeLab('Code Lab');
  const simPalette = makeCodeLab('Code Lab command palette /simulator', 'palette');
  const simQuick = makeCodeLab('Code Lab quick open /simulator', 'quickopen');
  const simTerm = makeCodeLab('Code Lab terminal /simulator', 'terminal');
  const simFind = makeCodeLab('Code Lab find /simulator', 'find');
  const simSearch = makeCodeLab('Code Lab search /simulator', 'search');
  const simScm = makeCodeLab('Code Lab source control /simulator', 'scm');
  const simRun = makeCodeLab('Code Lab run /simulator', 'run');
  const simExt = makeCodeLab('Code Lab extensions /simulator', 'extensions');
  const simFileMenu = makeCodeLab('Code Lab file menu /simulator', 'menufile');
  const simViewMenu = makeCodeLab('Code Lab view menu /simulator', 'menuview');
  const simEditMenu = makeCodeLab('Code Lab edit menu /simulator', 'menuedit');
  const simGoMenu = makeCodeLab('Code Lab go menu /simulator', 'menugo');
  const simRunMenu = makeCodeLab('Code Lab run menu /simulator', 'menurun');
  const simTermMenu = makeCodeLab('Code Lab terminal menu /simulator', 'menuterm');
  const simHelpMenu = makeCodeLab('Code Lab help menu /simulator', 'menuhelp');
  const simManage = makeCodeLab('Code Lab manage /simulator', 'manage');
  const simLight = makeCodeLab('Code Lab light /simulator', 'light');
  const simTask = makeCodeLab('Code Lab current task /simulator', 'task');
  const simTaskRun = makeCodeLab('Code Lab task in progress /simulator', 'taskrun');
  const simTaskList = makeCodeLab('Code Lab all tasks /simulator', 'tasklist');
  const simPreview = makeCodeLab('Code Lab preview /simulator', 'preview');
  const simKbViz = makeCodeLab('Code Lab keyboard /simulator', 'kbviz');
  const simToast = makeCodeLab('Code Lab toast /simulator', 'toast');
  const simNewFile = makeCodeLab('Code Lab new file /simulator', 'newfile');
  const simHint = makeCodeLab('Code Lab hint /simulator', 'hint');
  const desk = makeDesktopSim('Desktop');
  const deskMenu = makeDesktopSim('Desktop context menu /simulator?mode=desktop', 'menu');
  const deskExplorer = makeDesktopSim('Desktop explorer /simulator?mode=desktop', 'explorer');
  const deskTrash = makeDesktopSim('Desktop recycle-bin /simulator?mode=desktop', 'trash');
  const deskStart = makeDesktopSim('Desktop start menu /simulator?mode=desktop', 'start');
  const deskEditor = makeDesktopSim('Desktop editor /simulator?mode=desktop', 'editor');
  const deskKeyboard = makeDesktopSim('Desktop keyboard /simulator?mode=desktop', 'keyboard');
  const deskFileMenu = makeDesktopSim('Desktop file menu /simulator?mode=desktop', 'filemenu');
  const deskProps = makeDesktopSim('Desktop properties /simulator?mode=desktop', 'props');
  const deskLight = makeDesktopSim('Desktop light /simulator?mode=desktop', 'light');
  const deskDone = makeDesktopSim('Desktop all complete /simulator?mode=desktop', 'done');
  const deskToast = makeDesktopSim('Desktop toast /simulator?mode=desktop', 'toast');
  const deskFromLesson = makeDesktopSim('Desktop from lesson /simulator?mode=desktop', 'fromlesson');

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
  mnav.paddingLeft = mnav.paddingRight = 12;
  mnav.resize(390, 56);
  mnav.layoutSizingHorizontal = 'FIXED';
  mnav.layoutSizingVertical = 'FIXED';
  mnav.fills = [solid(WHITE)];
  mnav.appendChild(txt('KeyMaster', fraunces('SemiBold'), 16, INK));
  const mnavRight = al('HORIZONTAL', 'mobile home actions');
  mnavRight.itemSpacing = 6;
  mnavRight.counterAxisAlignItems = 'CENTER';
  mnavRight.appendChild(themeToggle(false));
  mnavRight.appendChild(txt('Вход', outfit('SemiBold'), 13, INK));
  mnavRight.appendChild(primaryBtn('Регистрация', true));
  mnavRight.appendChild(txt('☰', outfit('Bold'), 16, INK));
  mnav.appendChild(mnavRight);
  const mbody = al('VERTICAL', 'body');
  mbody.paddingTop = mbody.paddingBottom = 24;
  mbody.paddingLeft = mbody.paddingRight = 16;
  mbody.itemSpacing = 10;
  mbody.primaryAxisAlignItems = 'CENTER';
  const mlogo = figma.createRectangle();
  mlogo.resize(56, 56);
  mlogo.cornerRadius = 16;
  mlogo.fills = [solid(BRAND)];
  mbody.appendChild(mlogo);
  mbody.appendChild(txt('KeyMaster', fraunces('Bold'), 32, INK));
  mbody.appendChild(txt('От первого ноутбука — до мастерства клавиатуры', outfit('Regular'), 13, MUTED, 358));
  mbody.appendChild(
    txt(
      'Файлы и папки, слепая печать, горячие клавиши и симулятор рабочего стола — понятный путь без скуки, с нуля.',
      outfit('Regular'),
      13,
      MUTED,
      358,
    ),
  );
  const mctas = al('VERTICAL', 'mobile home CTAs');
  mctas.itemSpacing = 8;
  mctas.counterAxisAlignItems = 'CENTER';
  mctas.appendChild(instPrimary('Начать бесплатно →'));
  mctas.appendChild(secondaryBtn('Каталог курсов'));
  mbody.appendChild(mctas);
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
    ['Курсы', false],
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
  achRow.layoutWrap = 'WRAP';
  achRow.resize(860, 10);
  achRow.layoutSizingHorizontal = 'FIXED';
  achRow.layoutSizingVertical = 'HUG';
  for (const [label, desc] of [
    ['Первая победа', 'Первый правильный ответ'],
    ['100 правильных', '100 правильных ответов'],
    ['500 XP', 'Накопите 500 XP'],
    ['1000 XP', 'Накопите 1000 XP'],
  ]) {
    const insted = instAchievement(true, label);
    if (insted) {
      achRow.appendChild(insted);
      continue;
    }
    const a = al('VERTICAL', label);
    a.itemSpacing = 8;
    a.paddingTop = a.paddingBottom = 16;
    a.paddingLeft = a.paddingRight = 16;
    a.cornerRadius = 16;
    a.fills = [solid(WHITE)];
    a.opacity = 0.55;
    a.resize(416, 10);
    a.layoutSizingHorizontal = 'FIXED';
    a.layoutSizingVertical = 'HUG';
    a.appendChild(txt(label, outfit('SemiBold'), 16, INK, 380));
    a.appendChild(txt(desc, outfit('Regular'), 13, MUTED, 380));
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
  answersChart.resize(860, 288);
  answersChart.layoutSizingHorizontal = 'FIXED';
  answersChart.layoutSizingVertical = 'FIXED';
  answersChart.appendChild(txt('Ответы', outfit('Medium'), 16, INK));
  const chart = al('HORIZONTAL', 'empty chart');
  chart.itemSpacing = 24;
  chart.counterAxisAlignItems = 'MAX';
  chart.resize(812, 200);
  chart.layoutSizingHorizontal = 'FIXED';
  chart.layoutSizingVertical = 'FIXED';
  const yAxis = al('VERTICAL', 'chart y-axis');
  yAxis.primaryAxisAlignItems = 'SPACE_BETWEEN';
  yAxis.resize(16, 176);
  yAxis.layoutSizingHorizontal = 'FIXED';
  yAxis.layoutSizingVertical = 'FIXED';
  for (const n of ['4', '3', '2', '1', '0']) yAxis.appendChild(txt(n, outfit('Regular'), 11, MUTED));
  chart.appendChild(yAxis);
  for (const label of ['Верно', 'Ошибки']) {
    const col = al('VERTICAL', label);
    col.itemSpacing = 8;
    col.primaryAxisAlignItems = 'CENTER';
    const plot = figma.createRectangle();
    plot.name = 'empty bar';
    plot.resize(72, 160);
    plot.fills = [TRANSPARENT];
    plot.strokes = [solid(INK, 0.08)];
    col.appendChild(plot);
    col.appendChild(txt(label, outfit('Regular'), 12, MUTED));
    chart.appendChild(col);
  }
  answersChart.appendChild(chart);

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

  function adminHeader(active) {
    return [
      txt('Админ-панель', fraunces('Bold'), 32, INK),
      txt('Курсы, уроки, пользователи и достижения', outfit('Regular'), 13, MUTED, 800),
      adminTabBar(active),
    ];
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

  const verifyLoading = al('VERTICAL', 'Verify email loading');
  verifyLoading.itemSpacing = 12;
  verifyLoading.paddingTop = verifyLoading.paddingBottom = 28;
  verifyLoading.paddingLeft = verifyLoading.paddingRight = 28;
  verifyLoading.cornerRadius = 24;
  verifyLoading.fills = [solid(WHITE)];
  verifyLoading.strokes = [solid(INK, 0.1)];
  verifyLoading.resize(400, 10);
  verifyLoading.layoutSizingHorizontal = 'FIXED';
  verifyLoading.layoutSizingVertical = 'HUG';
  verifyLoading.appendChild(txt('Подтверждение email', fraunces('Bold'), 22, INK));
  verifyLoading.appendChild(txt('Проверяем ссылку…', outfit('Regular'), 14, MUTED, 344));

  const verifyOk = al('VERTICAL', 'Verify email ok');
  verifyOk.itemSpacing = 12;
  verifyOk.paddingTop = verifyOk.paddingBottom = 28;
  verifyOk.paddingLeft = verifyOk.paddingRight = 28;
  verifyOk.cornerRadius = 24;
  verifyOk.fills = [solid(WHITE)];
  verifyOk.strokes = [solid(INK, 0.1)];
  verifyOk.resize(400, 10);
  verifyOk.layoutSizingHorizontal = 'FIXED';
  verifyOk.layoutSizingVertical = 'HUG';
  verifyOk.appendChild(txt('Подтверждение email', fraunces('Bold'), 22, INK));
  verifyOk.appendChild(txt('Email подтверждён. Теперь можно войти.', outfit('Regular'), 14, SUCCESS, 344));
  verifyOk.appendChild(instPrimary('Войти'));

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

  const callbackError = al('VERTICAL', 'Auth callback error');
  callbackError.itemSpacing = 12;
  callbackError.paddingTop = callbackError.paddingBottom = 28;
  callbackError.paddingLeft = callbackError.paddingRight = 28;
  callbackError.cornerRadius = 24;
  callbackError.fills = [solid(WHITE)];
  callbackError.strokes = [solid(INK, 0.1)];
  callbackError.resize(400, 10);
  callbackError.layoutSizingHorizontal = 'FIXED';
  callbackError.layoutSizingVertical = 'HUG';
  callbackError.appendChild(txt('Подтверждение email', fraunces('Bold'), 22, INK));
  callbackError.appendChild(txt('Ссылка недействительна или устарела', outfit('Regular'), 14, SIGNAL, 344));
  callbackError.appendChild(instPrimary('Войти'));

  function typingSeg(active) {
    const wrap = al('HORIZONTAL', 'views');
    wrap.itemSpacing = 12;
    wrap.counterAxisAlignItems = 'CENTER';
    const tabs = al('HORIZONTAL', 'seg');
    tabs.itemSpacing = 4;
    tabs.paddingTop = tabs.paddingBottom = tabs.paddingLeft = tabs.paddingRight = 4;
    tabs.cornerRadius = 12;
    tabs.fills = [solid(WHITE)];
    for (const [label, on] of [
      ['Тренировка', active === 'Тренировка'],
      ['Путь', active === 'Путь'],
      ['Прогресс', active === 'Прогресс'],
    ]) {
      const tab = al('HORIZONTAL', label);
      tab.paddingLeft = tab.paddingRight = 12;
      tab.paddingTop = tab.paddingBottom = 6;
      tab.cornerRadius = 8;
      tab.fills = on ? [solid(BRAND)] : [TRANSPARENT];
      tab.appendChild(txt(label, outfit('SemiBold'), 12, on ? WHITE : MUTED));
      tabs.appendChild(tab);
    }
    wrap.appendChild(tabs);
    const lang = al('HORIZONTAL', 'RU/EN');
    lang.itemSpacing = 4;
    lang.paddingTop = lang.paddingBottom = lang.paddingLeft = lang.paddingRight = 4;
    lang.cornerRadius = 12;
    lang.fills = [solid(WHITE)];
    for (const [label, on] of [
      ['RU', true],
      ['EN', false],
    ]) {
      const chip = al('HORIZONTAL', label);
      chip.paddingLeft = chip.paddingRight = 10;
      chip.paddingTop = chip.paddingBottom = 4;
      chip.cornerRadius = 8;
      chip.fills = on ? [solid(BRAND)] : [TRANSPARENT];
      chip.appendChild(txt(label, outfit('Bold'), 11, on ? WHITE : MUTED));
      lang.appendChild(chip);
    }
    wrap.appendChild(lang);
    return wrap;
  }

  function typingHead(active) {
    const head = al('VERTICAL', 'typing head');
    head.itemSpacing = 8;
    head.appendChild(txt('СЛЕПАЯ ПЕЧАТЬ', outfit('Bold'), 11, BRAND800));
    head.appendChild(txt('Тренажёр печати', fraunces('Bold'), 32, INK));
    head.appendChild(txt('Смотрите на экран. Печатайте. После подхода увидите, что улучшить.', outfit('Regular'), 13, MUTED, 680));
    head.appendChild(typingSeg(active));
    return head;
  }

  const typingBody = al('VERTICAL', 'Typing');
  typingBody.itemSpacing = 12;
  typingBody.appendChild(typingHead('Тренировка'));
  const modeRow = al('HORIZONTAL', 'modes');
  modeRow.itemSpacing = 8;
  for (const [label, on] of [
    ['Домашний ряд', true],
    ['Все буквы', false],
    ['Слова', false],
    ['Фразы', false],
    ['Код', false],
  ]) {
    const chip = al('HORIZONTAL', label);
    chip.paddingLeft = chip.paddingRight = 14;
    chip.paddingTop = chip.paddingBottom = 8;
    chip.cornerRadius = 99;
    chip.fills = on ? [solid(BRAND)] : [solid(WHITE)];
    chip.strokes = [solid(on ? BRAND : INK, on ? 1 : 0.12)];
    chip.appendChild(txt(label, outfit('SemiBold'), 13, on ? WHITE : INK));
    modeRow.appendChild(chip);
  }
  typingBody.appendChild(modeRow);
  const metrics = al('HORIZONTAL', 'metrics');
  metrics.itemSpacing = 12;
  for (const [k, v] of [
    ['WPM', '0'],
    ['ТОЧНОСТЬ', '100%'],
    ['ОШИБКИ', '0'],
    ['РЕКОРД', '—'],
  ]) {
    const m = al('VERTICAL', k);
    m.itemSpacing = 4;
    m.paddingTop = m.paddingBottom = 16;
    m.paddingLeft = m.paddingRight = 16;
    m.cornerRadius = 16;
    m.fills = [solid(WHITE)];
    m.resize(155, 10);
    m.layoutSizingHorizontal = 'FIXED';
    m.layoutSizingVertical = 'HUG';
    m.appendChild(txt(k, outfit('Bold'), 10, MUTED));
    m.appendChild(txt(v, outfit('SemiBold'), 20, INK));
    metrics.appendChild(m);
  }
  typingBody.appendChild(metrics);
  const typeBox = al('VERTICAL', 'prompt');
  typeBox.itemSpacing = 8;
  typeBox.paddingTop = typeBox.paddingBottom = 20;
  typeBox.paddingLeft = typeBox.paddingRight = 20;
  typeBox.cornerRadius = 24;
  typeBox.fills = [solid(WHITE)];
  typeBox.appendChild(txt('фыва олдж фыва олдж ваол джфы аовы лджф', outfit('Regular'), 18, INK, 640));
  typingBody.appendChild(typeBox);
  const typeCtl = al('HORIZONTAL', 'typing controls');
  typeCtl.primaryAxisAlignItems = 'SPACE_BETWEEN';
  typeCtl.resize(680, 10);
  typeCtl.layoutSizingHorizontal = 'FIXED';
  typeCtl.layoutSizingVertical = 'HUG';
  typeCtl.appendChild(instSecondary('Ещё раз'));
  typeCtl.appendChild(txt('Скрыть клавиатуру', outfit('SemiBold'), 13, BRAND800));
  typingBody.appendChild(typeCtl);
  typingBody.appendChild(txt('СЛЕДУЮЩАЯ КЛАВИША', outfit('Bold'), 10, MUTED));

  const typingPath = al('VERTICAL', 'Typing path');
  typingPath.itemSpacing = 12;
  typingPath.appendChild(typingHead('Путь'));
  const pathCard = al('VERTICAL', 'Путь обучения');
  pathCard.itemSpacing = 12;
  pathCard.paddingTop = pathCard.paddingBottom = 20;
  pathCard.paddingLeft = pathCard.paddingRight = 20;
  pathCard.cornerRadius = 24;
  pathCard.fills = [solid(WHITE)];
  pathCard.appendChild(txt('Путь обучения', outfit('SemiBold'), 18, INK));
  pathCard.appendChild(txt('Один шаг за раз. Откройте следующий уровень, пройдя текущий.', outfit('Regular'), 13, MUTED, 640));
  pathCard.appendChild(txt('Уроки пути: 0%', outfit('Regular'), 12, MUTED));
  for (const [label, desc, locked] of [
    ['Домашний ряд', 'Основа: пальцы на ФЫВА ОЛДЖ.', false],
    ['Буквы', 'Все буквы без спешки.', true],
    ['Слова', 'Короткие рабочие слова.', true],
    ['Предложения', 'Ритм и пробелы.', true],
    ['Цифры', 'Верхний ряд без взгляда вниз.', true],
  ]) {
    const n = al('HORIZONTAL', label);
    n.primaryAxisAlignItems = 'SPACE_BETWEEN';
    n.counterAxisAlignItems = 'CENTER';
    n.paddingTop = n.paddingBottom = 12;
    n.paddingLeft = n.paddingRight = 12;
    n.cornerRadius = 12;
    n.fills = [solid({ r: 0.976, g: 0.98, b: 0.984 })];
    n.resize(640, 10);
    n.layoutSizingHorizontal = 'FIXED';
    n.layoutSizingVertical = 'HUG';
    const copy = al('VERTICAL', 'copy');
    copy.itemSpacing = 2;
    copy.appendChild(txt(label, outfit('SemiBold'), 14, INK));
    copy.appendChild(txt(desc + (locked ? ' Закрыто' : ''), outfit('Regular'), 12, MUTED, 420));
    n.appendChild(copy);
    n.appendChild(locked ? txt('Закрыто', outfit('Regular'), 12, MUTED) : instPrimary('Начать'));
    pathCard.appendChild(n);
  }
  typingPath.appendChild(pathCard);

  const typingProgress = al('VERTICAL', 'Typing progress');
  typingProgress.itemSpacing = 12;
  typingProgress.appendChild(typingHead('Прогресс'));
  const progCard = al('VERTICAL', 'Ваш прогресс');
  progCard.itemSpacing = 12;
  progCard.paddingTop = progCard.paddingBottom = 20;
  progCard.paddingLeft = progCard.paddingRight = 20;
  progCard.cornerRadius = 24;
  progCard.fills = [solid(WHITE)];
  progCard.appendChild(txt('Ваш прогресс', outfit('SemiBold'), 18, INK));
  const rec = al('HORIZONTAL', 'records');
  rec.itemSpacing = 12;
  for (const [k, v] of [
    ['РЕКОРД', '—'],
    ['ТОЧНОСТЬ', '—'],
    ['ПОДХОДЫ', '0'],
    ['СЕРИЯ ДНЕЙ', '0'],
  ]) {
    const m = al('VERTICAL', k);
    m.itemSpacing = 4;
    m.paddingTop = m.paddingBottom = 12;
    m.paddingLeft = m.paddingRight = 12;
    m.cornerRadius = 12;
    m.fills = [solid({ r: 0.976, g: 0.98, b: 0.984 })];
    m.resize(140, 10);
    m.layoutSizingHorizontal = 'FIXED';
    m.layoutSizingVertical = 'HUG';
    m.appendChild(txt(k, outfit('Bold'), 10, MUTED));
    m.appendChild(txt(v, outfit('SemiBold'), 18, INK));
    rec.appendChild(m);
  }
  progCard.appendChild(rec);
  progCard.appendChild(txt('Время практики: 0:00', outfit('Regular'), 13, MUTED));
  progCard.appendChild(txt('WPM ЗА НЕДЕЛЮ', outfit('Bold'), 10, MUTED));
  typingProgress.appendChild(progCard);

  const trainBody = al('VERTICAL', 'Training');
  trainBody.itemSpacing = 12;
  trainBody.appendChild(txt('Тренировка горячих клавиш', outfit('SemiBold'), 24, INK));
  const trainMeta = al('HORIZONTAL', 'train meta');
  trainMeta.primaryAxisAlignItems = 'SPACE_BETWEEN';
  trainMeta.counterAxisAlignItems = 'CENTER';
  trainMeta.resize(640, 10);
  trainMeta.layoutSizingHorizontal = 'FIXED';
  trainMeta.layoutSizingVertical = 'HUG';
  const trainProg = al('VERTICAL', 'progress');
  trainProg.itemSpacing = 6;
  trainProg.appendChild(txt('Задание 1 из 13', outfit('Regular'), 13, MUTED));
  trainProg.appendChild(instProgress('Value=Partial') || progressBar(220, 0.08, BRAND, 6));
  trainMeta.appendChild(trainProg);
  const trainStats = al('HORIZONTAL', 'train stats');
  trainStats.itemSpacing = 16;
  trainStats.appendChild(txt('Серия: 0', outfit('SemiBold'), 13, MUTED));
  trainStats.appendChild(txt('Верно: 0', outfit('SemiBold'), 13, MUTED));
  trainMeta.appendChild(trainStats);
  trainBody.appendChild(trainMeta);
  const trainCard = al('VERTICAL', 'train card');
  trainCard.itemSpacing = 16;
  trainCard.paddingTop = trainCard.paddingBottom = 24;
  trainCard.paddingLeft = trainCard.paddingRight = 24;
  trainCard.cornerRadius = 24;
  trainCard.fills = [solid(WHITE)];
  trainCard.strokes = [solid(BRAND, 0.18)];
  trainCard.primaryAxisAlignItems = 'CENTER';
  trainCard.resize(640, 10);
  trainCard.layoutSizingHorizontal = 'FIXED';
  trainCard.layoutSizingVertical = 'HUG';
  trainCard.appendChild(txt('В начало строки', outfit('SemiBold'), 20, INK));
  const qBox = al('VERTICAL', 'prompt');
  qBox.itemSpacing = 8;
  qBox.primaryAxisAlignItems = 'CENTER';
  qBox.paddingTop = qBox.paddingBottom = 24;
  qBox.paddingLeft = qBox.paddingRight = 24;
  qBox.cornerRadius = 16;
  qBox.fills = [solid({ r: 0.941, g: 0.945, b: 0.953 })];
  qBox.appendChild(txt('?', outfit('Bold'), 28, INK));
  qBox.appendChild(txt('Нажмите сочетание на клавиатуре', outfit('Regular'), 13, MUTED));
  trainCard.appendChild(qBox);
  const trainBtns = al('HORIZONTAL', 'train actions');
  trainBtns.itemSpacing = 8;
  trainBtns.appendChild(instSecondary('Подсказка'));
  trainBtns.appendChild(ghostBtn('Объяснение'));
  trainBtns.appendChild(ghostBtn('Пропустить'));
  trainCard.appendChild(trainBtns);
  trainBody.appendChild(trainCard);

  const speedBody = al('VERTICAL', 'Speed');
  speedBody.itemSpacing = 16;
  const speedHead = al('HORIZONTAL', 'speed head');
  speedHead.primaryAxisAlignItems = 'SPACE_BETWEEN';
  speedHead.counterAxisAlignItems = 'CENTER';
  speedHead.resize(680, 10);
  speedHead.layoutSizingHorizontal = 'FIXED';
  speedHead.layoutSizingVertical = 'HUG';
  speedHead.appendChild(txt('Режим скорости', fraunces('Bold'), 32, INK));
  speedHead.appendChild(instPrimary('Старт 60 сек'));
  speedBody.appendChild(speedHead);

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
  examRunMeta.appendChild(txt('Экзамен · 1/20', outfit('Medium'), 13, MUTED));
  examRunMeta.appendChild(pill('ВСЕ КУРСЫ', { r: 0.976, g: 0.98, b: 0.984 }, MUTED));
  examRunHead.appendChild(examRunMeta);
  const timerChip = al('HORIZONTAL', 'timer');
  timerChip.paddingLeft = timerChip.paddingRight = 12;
  timerChip.paddingTop = timerChip.paddingBottom = 6;
  timerChip.cornerRadius = 12;
  timerChip.fills = [solid({ r: 0.976, g: 0.98, b: 0.984 })];
  timerChip.appendChild(txt('10:00', outfit('Bold'), 13, INK));
  examRunHead.appendChild(timerChip);
  examRun.appendChild(examRunHead);
  examRun.appendChild(instProgress('Value=Partial') || progressBar(680, 0.05, BRAND, 8));
  const scoreRow = al('HORIZONTAL', 'score');
  scoreRow.primaryAxisAlignItems = 'SPACE_BETWEEN';
  scoreRow.counterAxisAlignItems = 'CENTER';
  scoreRow.resize(680, 10);
  scoreRow.layoutSizingHorizontal = 'FIXED';
  scoreRow.layoutSizingVertical = 'HUG';
  const counts = al('HORIZONTAL', 'counts');
  counts.itemSpacing = 16;
  counts.appendChild(txt('0', outfit('SemiBold'), 14, SUCCESS));
  counts.appendChild(txt('0', outfit('SemiBold'), 14, SIGNAL));
  scoreRow.appendChild(counts);
  scoreRow.appendChild(ghostBtn('Завершить'));
  examRun.appendChild(scoreRow);
  const examQ = al('VERTICAL', 'question');
  examQ.itemSpacing = 12;
  examQ.paddingTop = examQ.paddingBottom = 24;
  examQ.paddingLeft = examQ.paddingRight = 24;
  examQ.cornerRadius = 24;
  examQ.fills = [solid(WHITE)];
  examQ.strokes = [solid(BRAND, 0.18)];
  examQ.appendChild(txt('ВОПРОС 1', outfit('Bold'), 11, BRAND800));
  examQ.appendChild(txt('В начало строки', outfit('SemiBold'), 22, INK));
  const examPrompt = al('VERTICAL', 'prompt');
  examPrompt.itemSpacing = 8;
  examPrompt.primaryAxisAlignItems = 'CENTER';
  examPrompt.paddingTop = examPrompt.paddingBottom = 24;
  examPrompt.paddingLeft = examPrompt.paddingRight = 24;
  examPrompt.cornerRadius = 16;
  examPrompt.fills = [solid({ r: 0.941, g: 0.945, b: 0.953 })];
  examPrompt.appendChild(txt('?', outfit('Bold'), 28, INK));
  examPrompt.appendChild(txt('Вспомните сочетание сами — без подсказок.', outfit('Regular'), 13, MUTED));
  examQ.appendChild(examPrompt);
  examRun.appendChild(examQ);

  function keyCaps(keys) {
    const row = al('HORIZONTAL', 'combo');
    row.itemSpacing = 8;
    row.counterAxisAlignItems = 'CENTER';
    keys.forEach((k, i) => {
      if (i) row.appendChild(txt('+', outfit('Regular'), 16, MUTED));
      const cap = instKeyCap(k);
      if (cap) {
        row.appendChild(cap);
        return;
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
      row.appendChild(box);
    });
    return row;
  }

  function examOverlay(ok, prompt, keys, countdown) {
    const card = al('VERTICAL', ok ? 'Exam correct overlay' : 'Exam wrong overlay');
    card.itemSpacing = 10;
    card.paddingTop = card.paddingBottom = 32;
    card.paddingLeft = card.paddingRight = 24;
    card.cornerRadius = 24;
    card.fills = [solid(ok ? { r: 0.925, g: 0.99, b: 0.961 } : SIGNAL, ok ? 1 : 0.08)];
    card.strokes = [solid(ok ? SUCCESS : SIGNAL, 0.4)];
    card.primaryAxisAlignItems = 'CENTER';
    card.resize(680, 10);
    card.layoutSizingHorizontal = 'FIXED';
    card.layoutSizingVertical = 'HUG';
    card.appendChild(txt(ok ? 'Верно!' : 'Неверно', outfit('Bold'), 24, ok ? SUCCESS : SIGNAL));
    card.appendChild(txt(prompt, outfit('Regular'), 13, MUTED));
    card.appendChild(txt('Правильное сочетание', outfit('Medium'), 13, MUTED));
    card.appendChild(keyCaps(keys));
    card.appendChild(txt(keys.join(' + '), outfit('SemiBold'), 18, INK));
    card.appendChild(txt('Следующий вопрос через ' + countdown + '…', outfit('Regular'), 13, MUTED));
    card.appendChild(txt('Перейти сразу', outfit('SemiBold'), 13, BRAND800));
    return card;
  }

  function examChrome(timer, right, wrong) {
    const wrap = al('VERTICAL', 'exam chrome');
    wrap.itemSpacing = 12;
    const head = al('HORIZONTAL', 'run head');
    head.primaryAxisAlignItems = 'SPACE_BETWEEN';
    head.counterAxisAlignItems = 'CENTER';
    head.resize(680, 10);
    head.layoutSizingHorizontal = 'FIXED';
    head.layoutSizingVertical = 'HUG';
    const meta = al('HORIZONTAL', 'meta');
    meta.itemSpacing = 8;
    meta.counterAxisAlignItems = 'CENTER';
    meta.appendChild(txt('Экзамен · 1/20', outfit('Medium'), 13, MUTED));
    meta.appendChild(pill('ВСЕ КУРСЫ', { r: 0.976, g: 0.98, b: 0.984 }, MUTED));
    head.appendChild(meta);
    const timerChip = al('HORIZONTAL', 'timer');
    timerChip.paddingLeft = timerChip.paddingRight = 12;
    timerChip.paddingTop = timerChip.paddingBottom = 6;
    timerChip.cornerRadius = 12;
    timerChip.fills = [solid({ r: 0.976, g: 0.98, b: 0.984 })];
    timerChip.appendChild(txt(timer, outfit('Bold'), 13, INK));
    head.appendChild(timerChip);
    wrap.appendChild(head);
    wrap.appendChild(instProgress('Value=Partial') || progressBar(680, 0.05, BRAND, 8));
    const scoreRow = al('HORIZONTAL', 'score');
    scoreRow.primaryAxisAlignItems = 'SPACE_BETWEEN';
    scoreRow.counterAxisAlignItems = 'CENTER';
    scoreRow.resize(680, 10);
    scoreRow.layoutSizingHorizontal = 'FIXED';
    scoreRow.layoutSizingVertical = 'HUG';
    const counts = al('HORIZONTAL', 'counts');
    counts.itemSpacing = 16;
    counts.appendChild(txt(String(right), outfit('SemiBold'), 14, SUCCESS));
    counts.appendChild(txt(String(wrong), outfit('SemiBold'), 14, SIGNAL));
    scoreRow.appendChild(counts);
    scoreRow.appendChild(ghostBtn('Завершить'));
    wrap.appendChild(scoreRow);
    return wrap;
  }

  const examFeedback = al('VERTICAL', 'Exam feedback');
  examFeedback.itemSpacing = 12;
  examFeedback.appendChild(examChrome('9:59', 0, 1));
  examFeedback.appendChild(examOverlay(false, 'Откройте замену', ['Ctrl', 'H'], 3));

  const examWrong = examOverlay(false, 'Откройте замену', ['Ctrl', 'H'], 3);
  examWrong.name = 'Exam wrong';

  const examCorrect = al('VERTICAL', 'Exam correct');
  examCorrect.itemSpacing = 12;
  examCorrect.appendChild(examChrome('9:59', 1, 0));
  examCorrect.appendChild(examOverlay(true, 'В начало строки', ['Home'], 2));

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
    ['Время', '0:00'],
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
  reviewBack.appendChild(txt('Повторение', fraunces('Bold'), 32, INK));
  reviewBack.appendChild(txt('1 / 19', outfit('SemiBold'), 13, MUTED));
  const reviewFlip = al('VERTICAL', 'back');
  reviewFlip.itemSpacing = 12;
  reviewFlip.paddingTop = reviewFlip.paddingBottom = 32;
  reviewFlip.paddingLeft = reviewFlip.paddingRight = 24;
  reviewFlip.cornerRadius = 24;
  reviewFlip.fills = [solid(WHITE)];
  reviewFlip.resize(416, 10);
  reviewFlip.layoutSizingHorizontal = 'FIXED';
  reviewFlip.layoutSizingVertical = 'HUG';
  reviewFlip.primaryAxisAlignItems = 'CENTER';
  reviewFlip.appendChild(txt('ОСНОВНЫЕ ГОРЯЧИЕ КЛАВИШИ ПРОГРАММИСТА', outfit('Bold'), 11, BRAND800));
  reviewFlip.appendChild(txt('ЧТО ДЕЛАЕТ', outfit('Bold'), 11, MUTED));
  const flipKeys = al('HORIZONTAL', 'combo');
  flipKeys.itemSpacing = 8;
  flipKeys.counterAxisAlignItems = 'CENTER';
  for (const k of ['Alt', 'Tab']) {
    const cap = instKeyCap(k);
    if (cap) {
      flipKeys.appendChild(cap);
      continue;
    }
    const box = al('HORIZONTAL', k);
    box.paddingLeft = box.paddingRight = 12;
    box.paddingTop = box.paddingBottom = 8;
    box.cornerRadius = 12;
    box.fills = [solid(WHITE)];
    box.strokes = [solid(BRAND)];
    box.appendChild(txt(k, outfit('SemiBold'), 14, INK));
    flipKeys.appendChild(box);
  }
  reviewFlip.appendChild(flipKeys);
  reviewFlip.appendChild(txt('Окна', outfit('SemiBold'), 22, INK));
  reviewFlip.appendChild(
    txt(
      'Переключает между открытыми окнами программ. Удерживайте Alt и нажимайте Tab, пока не выберете нужное окно.',
      outfit('Regular'),
      13,
      MUTED,
      360,
    ),
  );
  reviewFlip.appendChild(instSecondary('На лицевую сторону'));
  reviewBack.appendChild(reviewFlip);

  const mobileLogin = al('VERTICAL', 'Mobile Login — BottomNav hidden');
  mobileLogin.itemSpacing = 0;
  mobileLogin.fills = [solid(PAPER)];
  mobileLogin.strokes = [solid(INK, 0.1)];
  mobileLogin.resize(390, 10);
  mobileLogin.layoutSizingHorizontal = 'FIXED';
  mobileLogin.layoutSizingVertical = 'HUG';
  const mlnav = al('HORIZONTAL', 'header');
  mlnav.primaryAxisAlignItems = 'SPACE_BETWEEN';
  mlnav.counterAxisAlignItems = 'CENTER';
  mlnav.paddingLeft = mlnav.paddingRight = 12;
  mlnav.resize(390, 56);
  mlnav.layoutSizingHorizontal = 'FIXED';
  mlnav.layoutSizingVertical = 'FIXED';
  mlnav.fills = [solid(WHITE)];
  mlnav.appendChild(txt('KeyMaster', fraunces('SemiBold'), 16, INK));
  const mlright = al('HORIZONTAL', 'mobile login actions');
  mlright.itemSpacing = 6;
  mlright.counterAxisAlignItems = 'CENTER';
  mlright.appendChild(themeToggle(false));
  mlright.appendChild(txt('Вход', outfit('SemiBold'), 13, INK));
  mlright.appendChild(primaryBtn('Регистрация', true));
  mlright.appendChild(txt('☰', outfit('Bold'), 16, INK));
  mlnav.appendChild(mlright);
  const mlbody = al('VERTICAL', 'login');
  mlbody.paddingTop = mlbody.paddingBottom = 24;
  mlbody.paddingLeft = mlbody.paddingRight = 16;
  mlbody.itemSpacing = 10;
  const mlcard = al('VERTICAL', 'AuthCard');
  mlcard.itemSpacing = 0;
  mlcard.cornerRadius = 24;
  mlcard.fills = [solid(WHITE)];
  mlcard.resize(358, 10);
  mlcard.layoutSizingHorizontal = 'FIXED';
  mlcard.layoutSizingVertical = 'HUG';
  const mlhead = al('VERTICAL', 'header');
  mlhead.itemSpacing = 6;
  mlhead.paddingTop = mlhead.paddingBottom = 16;
  mlhead.paddingLeft = mlhead.paddingRight = 16;
  mlhead.fills = [solid(BRAND50)];
  mlhead.appendChild(txt('KEYMASTER', outfit('Bold'), 10, BRAND800));
  mlhead.appendChild(txt('Вход', fraunces('Bold'), 22, INK));
  mlhead.appendChild(txt('Добро пожаловать в KeyMaster', outfit('Regular'), 13, MUTED, 326));
  mlcard.appendChild(mlhead);
  const mlform = al('VERTICAL', 'form');
  mlform.itemSpacing = 10;
  mlform.paddingTop = mlform.paddingBottom = 16;
  mlform.paddingLeft = mlform.paddingRight = 16;
  mlform.appendChild(floatOrInst('State=Default', 'Email', { width: 326 }));
  mlform.appendChild(floatOrInst('State=Password', 'Пароль', { password: true, width: 326 }));
  mlform.appendChild(instPrimary('Войти'));
  mlcard.appendChild(mlform);
  const mlfoot = al('HORIZONTAL', 'footer');
  mlfoot.itemSpacing = 4;
  mlfoot.primaryAxisAlignItems = 'CENTER';
  mlfoot.paddingTop = mlfoot.paddingBottom = 12;
  mlfoot.paddingLeft = mlfoot.paddingRight = 16;
  mlfoot.fills = [solid({ r: 0.976, g: 0.98, b: 0.984 })];
  mlfoot.appendChild(txt('Нет аккаунта?', outfit('Regular'), 13, MUTED));
  mlfoot.appendChild(txt('Регистрация', outfit('SemiBold'), 13, BRAND800));
  mlcard.appendChild(mlfoot);
  mlbody.appendChild(mlcard);
  mobileLogin.appendChild(mlnav);
  mobileLogin.appendChild(mlbody);

  board.appendChild(
    section('MarketingShell', [
      marketingPage('Home /', 'Главная', true, homeBody),
      marketingPage('Home authed /', 'Главная', false, homeAuthed),
      marketingPage(
        'Home TJ /',
        'Асосӣ',
        true,
        [
          txt('Аз ноутбуки аввал — то устодии клавиатура', fraunces('Bold'), 40, INK, 800),
          txt(
            'Файлҳо ва папкаҳо, чопи ноаён, тугмаҳои тез ва симулятори мизи корӣ — роҳи фаҳмо аз сифр.',
            outfit('Regular'),
            16,
            MUTED,
            720,
          ),
          (() => {
            const row = al('HORIZONTAL', 'TJ CTAs');
            row.itemSpacing = 8;
            row.appendChild(instPrimary('Ройгон оғоз кунед →'));
            row.appendChild(secondaryBtn('Феҳристи курсҳо'));
            return row;
          })(),
          txt('F12 locale tg — chrome from frontend/src/shared/i18n/tg.ts. One Home covers the switcher; do not duplicate every Tajik string.', outfit('Regular'), 12, MUTED, 800),
        ],
        false,
        false,
        'tg',
      ),
      marketingPage('Courses /courses', 'Курсы', true, [
        (() => {
          const head = al('HORIZONTAL', 'catalog head');
          head.primaryAxisAlignItems = 'SPACE_BETWEEN';
          head.counterAxisAlignItems = 'MAX';
          head.resize(880, 10);
          head.layoutSizingHorizontal = 'FIXED';
          head.layoutSizingVertical = 'HUG';
          const titles = al('VERTICAL', 'titles');
          titles.itemSpacing = 6;
          titles.appendChild(txt('КАТАЛОГ', outfit('Bold'), 11, BRAND800));
          titles.appendChild(txt('Каталог курсов', fraunces('Bold'), 32, INK));
          titles.appendChild(txt('Выберите инструмент и изучайте сочетания. Прогресс сохраняется и отображается на карте пути.', outfit('Regular'), 13, MUTED, 640));
          head.appendChild(titles);
          head.appendChild(secondaryBtn('Путь обучения'));
          return head;
        })(),
        searchField(880),
        filterRow,
        txt('0 XP live catalog · 3 of 20 cards. Do not duplicate remaining slugs. InProgress/Completed live on page 05 when percent > 0.', outfit('Regular'), 13, MUTED, 860),
        coursesRow,
        txt('getCourseStatus variants (not the empty learner catalog)', outfit('Regular'), 12, MUTED, 860),
        statusStrip,
      ]),
      marketingPage('Courses empty /courses', 'Курсы', true, [
        txt('КАТАЛОГ', outfit('Bold'), 11, BRAND800),
        txt('Каталог курсов', fraunces('Bold'), 32, INK),
        searchField(880),
        instEmpty('Ничего не нашлось. Снимите фильтр или измените запрос.', '') ||
          txt('Ничего не нашлось. Снимите фильтр или измените запрос.', outfit('SemiBold'), 17, INK, 640),
      ]),
      marketingPage('Courses loading /courses', 'Курсы', true, [
        txt('КАТАЛОГ', outfit('Bold'), 11, BRAND800),
        txt('Каталог курсов', fraunces('Bold'), 32, INK),
        txt('Выберите инструмент и изучайте сочетания. Прогресс сохраняется и отображается на карте пути.', outfit('Regular'), 13, MUTED, 640),
        (() => {
          const grid = al('HORIZONTAL', 'SkeletonCardGrid');
          grid.itemSpacing = 16;
          grid.layoutWrap = 'WRAP';
          grid.resize(880, 10);
          grid.layoutSizingHorizontal = 'FIXED';
          grid.layoutSizingVertical = 'HUG';
          for (let i = 0; i < 6; i++) {
            const card = instSkeleton('Kind=Card');
            if (card) {
              card.resize(280, 192);
              grid.appendChild(card);
            } else {
              const r = figma.createRectangle();
              r.name = 'Skeleton instance';
              r.resize(280, 192);
              r.cornerRadius = 24;
              r.fills = [solid(INK, 0.08)];
              grid.appendChild(r);
            }
          }
          return grid;
        })(),
        txt('live SkeletonCardGrid count={9} — 6 cards cover the 3-col loading grid.', outfit('Regular'), 12, MUTED, 860),
      ]),
      marketingPage('Courses API error /courses', 'Курсы', true, [
        txt('КАТАЛОГ', outfit('Bold'), 11, BRAND800),
        txt('Каталог курсов', fraunces('Bold'), 32, INK),
        instEmpty('API недоступен', 'Запустите backend: uvicorn app.main:app --reload --port 8000') ||
          txt('API недоступен', outfit('SemiBold'), 17, INK, 640),
      ]),
      marketingPage('Courses authed /courses', 'Курсы', false, [
        (() => {
          const head = al('HORIZONTAL', 'catalog head authed');
          head.primaryAxisAlignItems = 'SPACE_BETWEEN';
          head.counterAxisAlignItems = 'MAX';
          head.resize(880, 10);
          head.layoutSizingHorizontal = 'FIXED';
          head.layoutSizingVertical = 'HUG';
          const titles = al('VERTICAL', 'titles authed');
          titles.itemSpacing = 6;
          titles.appendChild(txt('КАТАЛОГ', outfit('Bold'), 11, BRAND800));
          titles.appendChild(txt('Каталог курсов', fraunces('Bold'), 32, INK));
          titles.appendChild(txt('Выберите инструмент и изучайте сочетания. Прогресс сохраняется и отображается на карте пути.', outfit('Regular'), 13, MUTED, 640));
          head.appendChild(titles);
          head.appendChild(secondaryBtn('Путь обучения'));
          return head;
        })(),
        searchField(880),
        (() => {
          const row = al('HORIZONTAL', 'Filters authed');
          row.itemSpacing = 8;
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
            row.appendChild(chip);
          }
          return row;
        })(),
        txt('Authed 0 XP · LearnProgressBar compact. Guest catalog uses a spacer instead of 0/N.', outfit('Regular'), 13, MUTED, 860),
        (() => {
          const row = al('HORIZONTAL', 'Authed course cards');
          row.itemSpacing = 12;
          row.appendChild(
            catalogCard({
              title: 'Первый ноутбук: файлы и папки',
              desc: 'Создание папок и файлов, проводник, корзина и ZIP. Выполняйте задания в симуляторе «Рабочий стол».',
              meta: '16 уроков · 4 категории',
              start: true,
              progress: '0/16 сочетаний',
              percent: '0%',
              iconFill: { r: 0.96, g: 0.55, b: 0.2 },
            }),
          );
          row.appendChild(
            catalogCard({
              title: 'Основные горячие клавиши программиста',
              desc: 'Короткие уроки: копирование, сохранение, поиск и ещё несколько важных сочетаний. Системные клавиши (Alt+Tab, Win, F) — в разделе изучения и в режиме «Повторение».',
              meta: '19 уроков · 2 категории',
              start: true,
              progress: '0/19 сочетаний',
              percent: '0%',
              iconFill: { r: 0.35, g: 0.42, b: 0.55 },
            }),
          );
          row.appendChild(
            catalogCard({
              title: 'VS Code',
              desc: 'Visual Studio Code — редактор кода от Microsoft.',
              meta: '42 урока · 7 категорий',
              start: false,
              progress: '0/42 сочетаний',
              percent: '0%',
              iconFill: { r: 0.13, g: 0.48, b: 0.78 },
            }),
          );
          return row;
        })(),
      ]),
      marketingPage('Courses filter start /courses', 'Курсы', true, [
        (() => {
          const head = al('HORIZONTAL', 'catalog head start');
          head.primaryAxisAlignItems = 'SPACE_BETWEEN';
          head.counterAxisAlignItems = 'MAX';
          head.resize(880, 10);
          head.layoutSizingHorizontal = 'FIXED';
          head.layoutSizingVertical = 'HUG';
          const titles = al('VERTICAL', 'titles start');
          titles.itemSpacing = 6;
          titles.appendChild(txt('КАТАЛОГ', outfit('Bold'), 11, BRAND800));
          titles.appendChild(txt('Каталог курсов', fraunces('Bold'), 32, INK));
          titles.appendChild(txt('Выберите инструмент и изучайте сочетания. Прогресс сохраняется и отображается на карте пути.', outfit('Regular'), 13, MUTED, 640));
          head.appendChild(titles);
          head.appendChild(secondaryBtn('Путь обучения'));
          return head;
        })(),
        searchField(880),
        (() => {
          const row = al('HORIZONTAL', 'Filters start');
          row.itemSpacing = 8;
          for (const [label, on] of [
            ['Все', false],
            ['Старт', true],
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
            row.appendChild(chip);
          }
          return row;
        })(),
        txt('COURSE_GROUPS.start — computer-basics + programmer-basics only. Not a third layout.', outfit('Regular'), 12, MUTED, 860),
        (() => {
          const row = al('HORIZONTAL', 'Start filter cards');
          row.itemSpacing = 12;
          row.appendChild(
            catalogCard({
              title: 'Первый ноутбук: файлы и папки',
              desc: 'Создание папок и файлов, проводник, корзина и ZIP. Выполняйте задания в симуляторе «Рабочий стол».',
              meta: '16 уроков · 4 категории',
              start: true,
              iconFill: { r: 0.96, g: 0.55, b: 0.2 },
            }),
          );
          row.appendChild(
            catalogCard({
              title: 'Основные горячие клавиши программиста',
              desc: 'Короткие уроки: копирование, сохранение, поиск и ещё несколько важных сочетаний. Системные клавиши (Alt+Tab, Win, F) — в разделе изучения и в режиме «Повторение».',
              meta: '19 уроков · 2 категории',
              start: true,
              iconFill: { r: 0.35, g: 0.42, b: 0.55 },
            }),
          );
          return row;
        })(),
      ]),
      marketingPage('Course detail /courses/:slug', 'Курсы', true, [
        pill('ОБЯЗАТЕЛЬНЫЙ СТАРТ', { r: 0.114, g: 0.306, b: 0.847 }, WHITE),
        txt('Первый ноутбук: файлы и папки', fraunces('Bold'), 32, INK, 800),
        txt('Создание папок и файлов, проводник, корзина и ZIP. Выполняйте задания в симуляторе «Рабочий стол».', outfit('Regular'), 14, MUTED, 720),
        (() => {
          const line = al('HORIZONTAL', 'guest course CTA');
          line.itemSpacing = 0;
          line.layoutWrap = 'WRAP';
          line.appendChild(txt('Зарегистрируйтесь', outfit('SemiBold'), 14, BRAND800));
          line.appendChild(txt(', чтобы открыть тренажёр и сохранять прогресс.', outfit('Regular'), 14, MUTED, 520));
          return line;
        })(),
        txt('Файлы и папки', outfit('SemiBold'), 18, INK),
        (() => {
          const row = al('HORIZONTAL', 'Lesson cards');
          row.itemSpacing = 12;
          for (const title of ['Файл и папка', 'Расширение файла', 'Где хранить']) {
            const c = al('HORIZONTAL', title);
            c.primaryAxisAlignItems = 'SPACE_BETWEEN';
            c.counterAxisAlignItems = 'CENTER';
            c.paddingTop = c.paddingBottom = 16;
            c.paddingLeft = c.paddingRight = 16;
            c.cornerRadius = 16;
            c.fills = [solid(WHITE)];
            c.strokes = [solid(INK, 0.1)];
            c.resize(280, 10);
            c.layoutSizingHorizontal = 'FIXED';
            c.layoutSizingVertical = 'HUG';
            c.appendChild(txt(title, outfit('SemiBold'), 14, INK, 180));
            c.appendChild(txt('+15XP', outfit('Regular'), 12, MUTED));
            row.appendChild(c);
          }
          return row;
        })(),
        txt('Не дублировать все 16 уроков — 1 секция покрывает layout карточки.', outfit('Regular'), 12, MUTED, 720),
        (() => {
          const row = al('HORIZONTAL', 'course ctas');
          row.itemSpacing = 8;
          row.appendChild(secondaryBtn('Мой путь'));
          row.appendChild(instPrimary('Рабочий стол'));
          return row;
        })(),
      ]),
      marketingPage('Course detail guest vscode /courses/:slug', 'Курсы', true, [
        txt('VS Code', fraunces('Bold'), 32, INK, 800),
        txt('Visual Studio Code — редактор кода от Microsoft.', outfit('Regular'), 14, MUTED, 720),
        guestRegisterLine(),
        txt('Навигация', outfit('SemiBold'), 18, INK),
        (() => {
          const row = al('HORIZONTAL', 'Guest vscode lesson cards');
          row.itemSpacing = 12;
          for (const [title, chord] of [
            ['Быстрое открытие файла', 'Ctrl + P'],
            ['Перейти к строке', 'Ctrl + G'],
            ['Перейти к символу', 'Ctrl + Shift + O'],
          ]) {
            row.appendChild(chordLessonCard(title, chord, '+10 XP', null));
          }
          return row;
        })(),
        txt('Guest vscode — no start badge, register CTA, Training/Exam, +10 XP chords.', outfit('Regular'), 12, MUTED, 860),
        courseDetailCtas('training'),
      ]),
      marketingPage('Course detail guest programmer-basics /courses/:slug', 'Курсы', true, [
        pill('ОБЯЗАТЕЛЬНЫЙ СТАРТ', { r: 0.114, g: 0.306, b: 0.847 }, WHITE),
        txt('Основные горячие клавиши программиста', fraunces('Bold'), 32, INK, 800),
        txt(
          'Короткие уроки: копирование, сохранение, поиск и ещё несколько важных сочетаний. Системные клавиши (Alt+Tab, Win, F) — в разделе изучения и в режиме «Повторение».',
          outfit('Regular'),
          14,
          MUTED,
          720,
        ),
        guestRegisterLine(),
        txt('Основы', outfit('SemiBold'), 18, INK),
        (() => {
          const row = al('HORIZONTAL', 'Guest programmer-basics lesson cards');
          row.itemSpacing = 12;
          for (const [title, chord] of [
            ['Копировать', 'Ctrl + C'],
            ['Вставить', 'Ctrl + V'],
            ['Вырезать', 'Ctrl + X'],
          ]) {
            row.appendChild(chordLessonCard(title, chord, '+15 XP', null));
          }
          return row;
        })(),
        txt('Система (изучение)', outfit('SemiBold'), 18, INK),
        chordLessonCard('Окна', 'Alt + Tab', '+15 XP', null),
        txt('Guest programmer-basics — start badge + Training/Exam +15 XP (not Desktop CTA).', outfit('Regular'), 12, MUTED, 860),
        courseDetailCtas('training'),
      ]),
      marketingPage('Course detail authed /courses/:slug', 'Курсы', false, [
        (() => {
          const head = al('HORIZONTAL', 'vscode detail head');
          head.itemSpacing = 20;
          head.counterAxisAlignItems = 'MIN';
          const icon = figma.createRectangle();
          icon.name = 'CourseBrandIcon';
          icon.resize(56, 56);
          icon.cornerRadius = 14;
          icon.fills = [solid({ r: 0.13, g: 0.48, b: 0.78 })];
          head.appendChild(icon);
          const copy = al('VERTICAL', 'vscode copy');
          copy.itemSpacing = 8;
          copy.appendChild(txt('VS Code', fraunces('Bold'), 32, INK, 720));
          copy.appendChild(txt('Visual Studio Code — редактор кода от Microsoft.', outfit('Regular'), 14, MUTED, 640));
          const prog = al('VERTICAL', 'course progress');
          prog.itemSpacing = 6;
          const meta = al('HORIZONTAL', 'progress meta');
          meta.primaryAxisAlignItems = 'SPACE_BETWEEN';
          meta.resize(400, 10);
          meta.layoutSizingHorizontal = 'FIXED';
          meta.layoutSizingVertical = 'HUG';
          meta.appendChild(txt('0/42 сочетаний', outfit('Regular'), 13, MUTED));
          meta.appendChild(txt('0%', outfit('SemiBold'), 13, BRAND800));
          prog.appendChild(meta);
          prog.appendChild(instProgress('Value=Empty') || progressBar(400, 0, BRAND, 10));
          copy.appendChild(prog);
          head.appendChild(copy);
          return head;
        })(),
        (() => {
          const sec = al('HORIZONTAL', 'Навигация head');
          sec.primaryAxisAlignItems = 'SPACE_BETWEEN';
          sec.counterAxisAlignItems = 'MAX';
          sec.resize(880, 10);
          sec.layoutSizingHorizontal = 'FIXED';
          sec.layoutSizingVertical = 'HUG';
          sec.appendChild(txt('Навигация', outfit('SemiBold'), 18, INK));
          sec.appendChild(txt('0/10 изучено', outfit('Medium'), 12, MUTED));
          return sec;
        })(),
        (() => {
          const row = al('HORIZONTAL', 'Authed lesson cards');
          row.itemSpacing = 12;
          for (const [title, chord] of [
            ['Быстрое открытие файла', 'Ctrl + P'],
            ['Перейти к строке', 'Ctrl + G'],
            ['Перейти к символу', 'Ctrl + Shift + O'],
          ]) {
            const c = al('VERTICAL', title);
            c.itemSpacing = 6;
            c.paddingTop = c.paddingBottom = 16;
            c.paddingLeft = c.paddingRight = 16;
            c.cornerRadius = 16;
            c.fills = [solid(WHITE)];
            c.strokes = [solid(INK, 0.1)];
            c.resize(280, 10);
            c.layoutSizingHorizontal = 'FIXED';
            c.layoutSizingVertical = 'HUG';
            const top = al('HORIZONTAL', 'lesson top');
            top.primaryAxisAlignItems = 'SPACE_BETWEEN';
            top.counterAxisAlignItems = 'MIN';
            const left = al('VERTICAL', 'lesson copy');
            left.itemSpacing = 4;
            left.appendChild(txt(title, outfit('SemiBold'), 14, INK, 180));
            left.appendChild(txt(chord, outfit('Medium'), 13, BRAND800));
            top.appendChild(left);
            const right = al('VERTICAL', 'lesson meta');
            right.itemSpacing = 6;
            right.primaryAxisAlignItems = 'MAX';
            right.appendChild(instLearn(false) || txt('НЕ ИЗУЧЕНО', outfit('Bold'), 10, MUTED));
            right.appendChild(txt('+10 XP', outfit('Regular'), 11, MUTED));
            top.appendChild(right);
            c.appendChild(top);
            top.layoutSizingHorizontal = 'FILL';
            row.appendChild(c);
          }
          return row;
        })(),
        txt('Authed vscode — LearnStatus + Training/Exam. Authed computer-basics is a separate unique (Desktop CTA, no Training/Exam, no shortcut on desktop-task cards).', outfit('Regular'), 12, MUTED, 860),
        (() => {
          const row = al('HORIZONTAL', 'vscode ctas');
          row.itemSpacing = 8;
          row.appendChild(secondaryBtn('Мой путь'));
          row.appendChild(instPrimary('Тренировка'));
          row.appendChild(secondaryBtn('Экзамен'));
          return row;
        })(),
      ]),
      marketingPage('Course detail authed computer-basics /courses/:slug', 'Курсы', false, [
        pill('ОБЯЗАТЕЛЬНЫЙ СТАРТ', { r: 0.114, g: 0.306, b: 0.847 }, WHITE),
        txt('Первый ноутбук: файлы и папки', fraunces('Bold'), 32, INK, 800),
        txt('Создание папок и файлов, проводник, корзина и ZIP. Выполняйте задания в симуляторе «Рабочий стол».', outfit('Regular'), 14, MUTED, 720),
        (() => {
          const prog = al('VERTICAL', 'computer-basics progress');
          prog.itemSpacing = 6;
          const meta = al('HORIZONTAL', 'progress meta basics');
          meta.primaryAxisAlignItems = 'SPACE_BETWEEN';
          meta.resize(400, 10);
          meta.layoutSizingHorizontal = 'FIXED';
          meta.layoutSizingVertical = 'HUG';
          meta.appendChild(txt('0/16 сочетаний', outfit('Regular'), 13, MUTED));
          meta.appendChild(txt('0%', outfit('SemiBold'), 13, BRAND800));
          prog.appendChild(meta);
          prog.appendChild(instProgress('Value=Empty') || progressBar(400, 0, BRAND, 10));
          return prog;
        })(),
        (() => {
          const sec = al('HORIZONTAL', 'Файлы и папки head');
          sec.primaryAxisAlignItems = 'SPACE_BETWEEN';
          sec.counterAxisAlignItems = 'MAX';
          sec.resize(880, 10);
          sec.layoutSizingHorizontal = 'FIXED';
          sec.layoutSizingVertical = 'HUG';
          sec.appendChild(txt('Файлы и папки', outfit('SemiBold'), 18, INK));
          sec.appendChild(txt('0/3 изучено', outfit('Medium'), 12, MUTED));
          return sec;
        })(),
        (() => {
          const row = al('HORIZONTAL', 'Authed basics lesson cards');
          row.itemSpacing = 12;
          for (const title of ['Файл и папка', 'Расширение файла', 'Где хранить']) {
            const c = al('HORIZONTAL', title);
            c.primaryAxisAlignItems = 'SPACE_BETWEEN';
            c.counterAxisAlignItems = 'CENTER';
            c.paddingTop = c.paddingBottom = 16;
            c.paddingLeft = c.paddingRight = 16;
            c.cornerRadius = 16;
            c.fills = [solid(WHITE)];
            c.strokes = [solid(INK, 0.1)];
            c.resize(280, 10);
            c.layoutSizingHorizontal = 'FIXED';
            c.layoutSizingVertical = 'HUG';
            c.appendChild(txt(title, outfit('SemiBold'), 14, INK, 140));
            const right = al('VERTICAL', 'basics lesson meta');
            right.itemSpacing = 4;
            right.primaryAxisAlignItems = 'MAX';
            right.appendChild(instLearn(false) || txt('НЕ ИЗУЧЕНО', outfit('Bold'), 10, MUTED));
            right.appendChild(txt('+15 XP', outfit('Regular'), 11, MUTED));
            c.appendChild(right);
            row.appendChild(c);
          }
          return row;
        })(),
        (() => {
          const sec = al('HORIZONTAL', 'Практика в проводнике head');
          sec.primaryAxisAlignItems = 'SPACE_BETWEEN';
          sec.counterAxisAlignItems = 'MAX';
          sec.resize(880, 10);
          sec.layoutSizingHorizontal = 'FIXED';
          sec.layoutSizingVertical = 'HUG';
          sec.appendChild(txt('Практика в проводнике', outfit('SemiBold'), 18, INK));
          sec.appendChild(txt('0/6 изучено', outfit('Medium'), 12, MUTED));
          return sec;
        })(),
        (() => {
          const c = al('HORIZONTAL', 'Папка Practice card');
          c.primaryAxisAlignItems = 'SPACE_BETWEEN';
          c.counterAxisAlignItems = 'CENTER';
          c.paddingTop = c.paddingBottom = 16;
          c.paddingLeft = c.paddingRight = 16;
          c.cornerRadius = 16;
          c.fills = [solid(WHITE)];
          c.strokes = [solid(INK, 0.1)];
          c.resize(280, 10);
          c.layoutSizingHorizontal = 'FIXED';
          c.layoutSizingVertical = 'HUG';
          c.appendChild(txt('Папка Practice', outfit('SemiBold'), 14, INK, 140));
          const right = al('VERTICAL', 'practice lesson meta');
          right.itemSpacing = 4;
          right.primaryAxisAlignItems = 'MAX';
          right.appendChild(instLearn(false) || txt('НЕ ИЗУЧЕНО', outfit('Bold'), 10, MUTED));
          right.appendChild(txt('+15 XP', outfit('Regular'), 11, MUTED));
          c.appendChild(right);
          return c;
        })(),
        txt('Authed computer-basics — LearnStatus +15 XP, no shortcut line on desktop-task cards, Desktop CTA (not Training/Exam).', outfit('Regular'), 12, MUTED, 860),
        (() => {
          const row = al('HORIZONTAL', 'basics authed ctas');
          row.itemSpacing = 8;
          row.appendChild(secondaryBtn('Мой путь'));
          row.appendChild(instPrimary('Рабочий стол'));
          return row;
        })(),
      ]),
      marketingPage('Course detail authed programmer-basics /courses/:slug', 'Курсы', false, [
        pill('ОБЯЗАТЕЛЬНЫЙ СТАРТ', { r: 0.114, g: 0.306, b: 0.847 }, WHITE),
        txt('Основные горячие клавиши программиста', fraunces('Bold'), 32, INK, 800),
        txt(
          'Короткие уроки: копирование, сохранение, поиск и ещё несколько важных сочетаний. Системные клавиши (Alt+Tab, Win, F) — в разделе изучения и в режиме «Повторение».',
          outfit('Regular'),
          14,
          MUTED,
          720,
        ),
        (() => {
          const prog = al('VERTICAL', 'programmer-basics progress');
          prog.itemSpacing = 6;
          const meta = al('HORIZONTAL', 'progress meta programmer-basics');
          meta.primaryAxisAlignItems = 'SPACE_BETWEEN';
          meta.resize(400, 10);
          meta.layoutSizingHorizontal = 'FIXED';
          meta.layoutSizingVertical = 'HUG';
          meta.appendChild(txt('0/19 сочетаний', outfit('Regular'), 13, MUTED));
          meta.appendChild(txt('0%', outfit('SemiBold'), 13, BRAND800));
          prog.appendChild(meta);
          prog.appendChild(instProgress('Value=Empty') || progressBar(400, 0, BRAND, 10));
          return prog;
        })(),
        (() => {
          const sec = al('HORIZONTAL', 'Основы head');
          sec.primaryAxisAlignItems = 'SPACE_BETWEEN';
          sec.counterAxisAlignItems = 'MAX';
          sec.resize(880, 10);
          sec.layoutSizingHorizontal = 'FIXED';
          sec.layoutSizingVertical = 'HUG';
          sec.appendChild(txt('Основы', outfit('SemiBold'), 18, INK));
          sec.appendChild(txt('0/13 изучено', outfit('Medium'), 12, MUTED));
          return sec;
        })(),
        (() => {
          const row = al('HORIZONTAL', 'Authed programmer-basics lesson cards');
          row.itemSpacing = 12;
          for (const [title, chord] of [
            ['Копировать', 'Ctrl + C'],
            ['Вставить', 'Ctrl + V'],
            ['Вырезать', 'Ctrl + X'],
          ]) {
            row.appendChild(chordLessonCard(title, chord, '+15 XP', false));
          }
          return row;
        })(),
        (() => {
          const sec = al('HORIZONTAL', 'Система (изучение) head');
          sec.primaryAxisAlignItems = 'SPACE_BETWEEN';
          sec.counterAxisAlignItems = 'MAX';
          sec.resize(880, 10);
          sec.layoutSizingHorizontal = 'FIXED';
          sec.layoutSizingVertical = 'HUG';
          sec.appendChild(txt('Система (изучение)', outfit('SemiBold'), 18, INK));
          sec.appendChild(txt('0/6 изучено', outfit('Medium'), 12, MUTED));
          return sec;
        })(),
        chordLessonCard('Окна', 'Alt + Tab', '+15 XP', false),
        txt('Authed programmer-basics — start badge + LearnStatus + Training/Exam +15 XP (not Desktop CTA).', outfit('Regular'), 12, MUTED, 860),
        courseDetailCtas('training'),
      ]),
      marketingPage('Course not found /courses/:slug', 'Курсы', true, [
        instEmpty('Курс не найден', '') || txt('Курс не найден', fraunces('Bold'), 32, INK, 640),
      ]),
      marketingPage('Course detail loading /courses/:slug', 'Курсы', true, [
        (() => {
          const line = instSkeleton('Kind=Line');
          if (line) {
            line.resize(400, 40);
            line.layoutSizingHorizontal = 'FIXED';
            return line;
          }
          const r = figma.createRectangle();
          r.name = 'Skeleton instance';
          r.resize(400, 40);
          r.cornerRadius = 8;
          r.fills = [solid(INK, 0.08)];
          return r;
        })(),
        (() => {
          const card = instSkeleton('Kind=Card');
          if (card) {
            card.resize(880, 256);
            card.layoutSizingHorizontal = 'FIXED';
            return card;
          }
          const r = figma.createRectangle();
          r.name = 'Skeleton instance';
          r.resize(880, 256);
          r.cornerRadius = 24;
          r.fills = [solid(INK, 0.08)];
          return r;
        })(),
        txt('Course detail loading — PageShell Skeleton h-10 + h-64, not catalog SkeletonCardGrid.', outfit('Regular'), 12, MUTED, 860),
      ]),
      marketingPage('Lesson hotkey /lessons/:id', 'Курсы', false, [lessonHotkey]),
      marketingPage('Lesson hotkey done /lessons/:id', 'Курсы', false, [lessonHotkeyDone]),
      marketingPage('Lesson task /lessons/:id', 'Курсы', false, [lessonTask]),
      marketingPage('Lesson task done /lessons/:id', 'Курсы', false, [lessonTaskDone]),
      marketingPage('Lesson study-only /lessons/:id', 'Курсы', true, [lessonStudy]),
      marketingPage('Lesson study-only authed /lessons/:id', 'Курсы', false, [lessonStudyAuthed]),
      marketingPage('Lesson study-only learned /lessons/:id', 'Курсы', false, [lessonStudyLearned]),
      marketingPage('Lesson desktop-task /lessons/:id', 'Курсы', false, [lessonDesktop]),
      marketingPage('Lesson desktop-task done /lessons/:id', 'Курсы', false, [lessonDesktopDone]),
      marketingPage('Lesson loading /lessons/:id', 'Курсы', true, [lessonLoading]),
      marketingPage('Path /path', 'Мой путь', false, pathBody),
      marketingPage('Path loading /path', 'Мой путь', false, [
        txt('МОЙ ПУТЬ РАЗВИТИЯ', outfit('Bold'), 11, BRAND800),
        txt('Developer Growth Path', fraunces('Bold'), 32, INK),
        txt(
          'От первого ноутбука до инструментов профи: файлы → печать и hotkeys → VS Code и дальше. Курсы те же — путь понятнее.',
          outfit('Regular'),
          13,
          MUTED,
          800,
        ),
        (() => {
          const col = al('VERTICAL', 'Path skeletons');
          col.itemSpacing = 24;
          col.primaryAxisAlignItems = 'CENTER';
          for (let i = 0; i < 5; i++) col.appendChild(skelBlock(384, 144, 'Kind=Card'));
          col.appendChild(
            txt('Path loading — hero stays, 5× Skeleton h-36 max-w-sm. Not dashboard PathStageStrip h-24.', outfit('Regular'), 12, MUTED, 720),
          );
          return col;
        })(),
      ]),
      marketingPage('Path guest /path', 'Мой путь', true, [
        txt('МОЙ ПУТЬ РАЗВИТИЯ', outfit('Bold'), 11, BRAND800),
        txt('Developer Growth Path', fraunces('Bold'), 32, INK),
        txt(
          'От первого ноутбука до инструментов профи: файлы → печать и hotkeys → VS Code и дальше. Курсы те же — путь понятнее.',
          outfit('Regular'),
          13,
          MUTED,
          800,
        ),
        (() => {
          const banner = al('VERTICAL', 'path guest banner');
          banner.itemSpacing = 6;
          banner.paddingTop = banner.paddingBottom = 12;
          banner.paddingLeft = banner.paddingRight = 16;
          banner.cornerRadius = 16;
          banner.fills = [solid(WHITE)];
          banner.strokes = [solid(INK, 0.1)];
          banner.resize(880, 10);
          banner.layoutSizingHorizontal = 'FIXED';
          banner.layoutSizingVertical = 'HUG';
          const line = al('HORIZONTAL', 'guest line');
          line.itemSpacing = 4;
          line.layoutWrap = 'WRAP';
          line.appendChild(
            txt(
              'Войдите, чтобы видеть прогресс по существующим курсам на карьерной карте.',
              outfit('Regular'),
              13,
              MUTED,
              720,
            ),
          );
          line.appendChild(txt('Регистрация', outfit('SemiBold'), 13, BRAND800));
          banner.appendChild(line);
          return banner;
        })(),
        instPath('Status=Start') || pathNode('Start', 'Начать', false),
        txt('Гостевой /path — те же курсы, прогресс только после входа. Не дублировать всю карту.', outfit('Regular'), 12, MUTED, 800),
      ]),
      marketingPage('Dashboard /dashboard', '', false, [dash]),
      marketingPage('Dashboard daily empty /dashboard', '', false, [
        txt('Привет, Анна!', fraunces('Bold'), 28, INK),
        txt('Личный кабинет KeyMaster', outfit('Regular'), 14, MUTED),
        (() => {
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
          return nextCard;
        })(),
        (() => {
          const dailyCard = al('VERTICAL', 'Daily empty');
          dailyCard.itemSpacing = 8;
          dailyCard.paddingTop = dailyCard.paddingBottom = 16;
          dailyCard.paddingLeft = dailyCard.paddingRight = 16;
          dailyCard.cornerRadius = 24;
          dailyCard.fills = [solid(WHITE)];
          dailyCard.resize(420, 10);
          dailyCard.layoutSizingHorizontal = 'FIXED';
          dailyCard.layoutSizingVertical = 'HUG';
          dailyCard.appendChild(txt('Ежедневные задания', outfit('SemiBold'), 16, INK));
          dailyCard.appendChild(
            txt(
              'Задания на сегодня появятся после следующей активности.',
              outfit('Regular'),
              13,
              MUTED,
              380,
            ),
          );
          dailyCard.appendChild(
            txt('Dashboard daily empty — paragraph, not EmptyState. Stages stay filled.', outfit('Regular'), 12, MUTED, 380),
          );
          return dailyCard;
        })(),
      ]),
      marketingPage('Dashboard loading /dashboard', '', false, [
        txt('Привет, Анна!', fraunces('Bold'), 28, INK),
        txt('Личный кабинет KeyMaster', outfit('Regular'), 14, MUTED),
        (() => {
          const row = al('HORIZONTAL', 'PathStageStrip loading');
          row.itemSpacing = 12;
          for (let i = 0; i < 4; i++) row.appendChild(skelBlock(200, 96, 'Kind=Card'));
          return row;
        })(),
        (() => {
          const daily = al('VERTICAL', 'Daily loading');
          daily.itemSpacing = 8;
          daily.paddingTop = daily.paddingBottom = 16;
          daily.paddingLeft = daily.paddingRight = 16;
          daily.cornerRadius = 24;
          daily.fills = [solid(WHITE)];
          daily.resize(420, 10);
          daily.layoutSizingHorizontal = 'FIXED';
          daily.layoutSizingVertical = 'HUG';
          daily.appendChild(txt('Ежедневные задания', outfit('SemiBold'), 16, INK));
          for (let i = 0; i < 4; i++) daily.appendChild(skelBlock(380, 40, 'Kind=Line'));
          daily.appendChild(
            txt('Dashboard loading — PathStageStrip 4×h-24, no stages heading; daily 4×h-10.', outfit('Regular'), 12, MUTED, 380),
          );
          return daily;
        })(),
      ]),
      marketingPage('Leaderboard /leaderboard', 'Рейтинг', true, [
        makeLbHero('Leaderboard hero', 'all'),
        podium,
      ]),
      marketingPage('Leaderboard authed /leaderboard', 'Рейтинг', false, [
        makeLbHero('Leaderboard hero authed', 'all'),
        (() => {
          const wrap = al('VERTICAL', 'Podium authed');
          wrap.itemSpacing = 16;
          wrap.primaryAxisAlignItems = 'CENTER';
          const card = al('VERTICAL', '#1 Анна you');
          card.itemSpacing = 6;
          card.primaryAxisAlignItems = 'CENTER';
          card.paddingTop = card.paddingBottom = 20;
          card.paddingLeft = card.paddingRight = 16;
          card.cornerRadius = 16;
          card.fills = [solid(WHITE)];
          card.strokes = [solid(BRAND, 0.5)];
          card.resize(220, 10);
          card.layoutSizingHorizontal = 'FIXED';
          card.layoutSizingVertical = 'HUG';
          const crown = figma.createEllipse();
          crown.resize(40, 40);
          crown.fills = [solid({ r: 0.961, g: 0.769, b: 0.157 })];
          card.appendChild(crown);
          card.appendChild(txt('#1', outfit('Bold'), 11, MUTED));
          card.appendChild(txt('Анна', outfit('SemiBold'), 16, INK));
          card.appendChild(txt('@learner', outfit('Regular'), 12, MUTED));
          const xpPill = al('HORIZONTAL', '0 XP you');
          xpPill.itemSpacing = 4;
          xpPill.paddingLeft = xpPill.paddingRight = 10;
          xpPill.paddingTop = xpPill.paddingBottom = 4;
          xpPill.cornerRadius = 8;
          xpPill.fills = [solid(SUCCESS, 0.12)];
          xpPill.appendChild(txt('0 XP', outfit('Bold'), 13, SUCCESS));
          card.appendChild(xpPill);
          card.appendChild(txt('Новичок', outfit('Medium'), 12, BRAND800));
          const you = al('HORIZONTAL', 'ВЫ');
          you.paddingLeft = you.paddingRight = 8;
          you.paddingTop = you.paddingBottom = 2;
          you.cornerRadius = 6;
          you.fills = [solid(BRAND)];
          you.appendChild(txt('ВЫ', outfit('Bold'), 10, WHITE));
          card.appendChild(you);
          wrap.appendChild(card);
          wrap.appendChild(
            txt(
              'Пройдите ещё уроки — таблица расширится, когда появятся новые игроки.',
              outfit('Regular'),
              13,
              MUTED,
              640,
            ),
          );
          return wrap;
        })(),
      ]),
      marketingPage('Leaderboard outside top /leaderboard', 'Рейтинг', false, [
        makeLbHero('Leaderboard hero outside top', 'all'),
        (() => {
          const banner = al('HORIZONTAL', 'outside top');
          banner.paddingTop = banner.paddingBottom = 12;
          banner.paddingLeft = banner.paddingRight = 16;
          banner.cornerRadius = 16;
          banner.fills = [solid(BRAND50)];
          banner.strokes = [solid(BRAND, 0.25)];
          banner.resize(880, 10);
          banner.layoutSizingHorizontal = 'FIXED';
          banner.layoutSizingVertical = 'HUG';
          banner.appendChild(txt('Ваше место: #12 · 40 XP', outfit('SemiBold'), 13, BRAND800));
          return banner;
        })(),
        (() => {
          const wrap = al('VERTICAL', 'Podium outside top');
          wrap.itemSpacing = 16;
          wrap.primaryAxisAlignItems = 'CENTER';
          const row = al('HORIZONTAL', 'Podium 2-1-3');
          row.itemSpacing = 12;
          row.counterAxisAlignItems = 'MAX';
          for (const [rank, name, handle, xp, title, tall] of [
            ['#2', 'Боб', '@bob', '700 XP', 'Junior+', false],
            ['#1', 'Алиса', '@alice', '900 XP', 'Middle', true],
            ['#3', 'Кара', '@cara', '500 XP', 'Junior', false],
          ]) {
            const card = al('VERTICAL', rank + ' ' + name);
            card.itemSpacing = 6;
            card.primaryAxisAlignItems = 'CENTER';
            card.paddingTop = card.paddingBottom = tall ? 28 : 20;
            card.paddingLeft = card.paddingRight = 16;
            card.cornerRadius = 16;
            card.fills = [solid(WHITE)];
            card.strokes = [solid(tall ? BRAND : INK, tall ? 0.5 : 0.08)];
            card.resize(200, 10);
            card.layoutSizingHorizontal = 'FIXED';
            card.layoutSizingVertical = 'HUG';
            if (tall) {
              const crown = figma.createEllipse();
              crown.resize(40, 40);
              crown.fills = [solid({ r: 0.961, g: 0.769, b: 0.157 })];
              card.appendChild(crown);
            }
            card.appendChild(txt(rank, outfit('Bold'), 11, MUTED));
            card.appendChild(txt(name, outfit('SemiBold'), 16, INK));
            card.appendChild(txt(handle, outfit('Regular'), 12, MUTED));
            const xpPill = al('HORIZONTAL', xp);
            xpPill.itemSpacing = 4;
            xpPill.paddingLeft = xpPill.paddingRight = 10;
            xpPill.paddingTop = xpPill.paddingBottom = 4;
            xpPill.cornerRadius = 8;
            xpPill.fills = [solid(SUCCESS, 0.12)];
            xpPill.appendChild(txt(xp, outfit('Bold'), 13, SUCCESS));
            card.appendChild(xpPill);
            card.appendChild(txt(title, outfit('Medium'), 12, BRAND800));
            row.appendChild(card);
          }
          wrap.appendChild(row);
          wrap.appendChild(
            txt(
              'Пройдите ещё уроки — таблица расширится, когда появятся новые игроки.',
              outfit('Regular'),
              13,
              MUTED,
              640,
            ),
          );
          return wrap;
        })(),
      ]),
      marketingPage('Leaderboard empty /leaderboard', 'Рейтинг', true, [
        makeLbHero('Leaderboard hero empty', 'all'),
        instEmpty('Рейтинг пуст', 'Пройдите уроки и наберите XP — вы появитесь в таблице') ||
          txt('Рейтинг пуст', outfit('SemiBold'), 22, INK),
      ]),
      marketingPage('Leaderboard period empty /leaderboard', 'Рейтинг', false, [
        makeLbHero('Leaderboard hero period empty', 'week'),
        instEmpty(
          'За этот период пока никого',
          'Завершите уроки на этой неделе или в этом месяце — XP попадёт в таблицу.',
        ) || txt('За этот период пока никого', outfit('SemiBold'), 22, INK),
      ]),
      marketingPage('Leaderboard api down /leaderboard', 'Рейтинг', true, [
        makeLbHero('Leaderboard hero api down', 'all'),
        instEmpty('API недоступен', 'Запустите backend: uvicorn app.main:app --reload --port 8000') ||
          txt('API недоступен', outfit('SemiBold'), 22, INK),
      ]),
      marketingPage('Leaderboard loading /leaderboard', 'Рейтинг', true, [
        makeLbHero('Leaderboard hero loading', 'all'),
        (() => {
          const row = al('HORIZONTAL', 'Leaderboard skeleton podium');
          row.itemSpacing = 12;
          row.appendChild(skelBlock(280, 160, 'Kind=Card'));
          row.appendChild(skelBlock(280, 160, 'Kind=Card'));
          row.appendChild(skelBlock(280, 160, 'Kind=Card'));
          return row;
        })(),
        (() => {
          const table = al('VERTICAL', 'ОСТАЛЬНЫЕ МЕСТА');
          table.itemSpacing = 0;
          table.cornerRadius = 24;
          table.fills = [solid(WHITE)];
          table.strokes = [solid(INK, 0.08)];
          table.resize(880, 10);
          table.layoutSizingHorizontal = 'FIXED';
          table.layoutSizingVertical = 'HUG';
          const head = al('HORIZONTAL', 'table head');
          head.paddingTop = head.paddingBottom = 12;
          head.paddingLeft = head.paddingRight = 16;
          head.fills = [solid({ r: 0.976, g: 0.98, b: 0.984 })];
          head.appendChild(txt('ОСТАЛЬНЫЕ МЕСТА', outfit('Bold'), 11, BRAND800));
          table.appendChild(head);
          for (let i = 0; i < 5; i++) {
            const row = al('VERTICAL', 'skeleton row');
            row.paddingTop = row.paddingBottom = 16;
            row.paddingLeft = row.paddingRight = 16;
            row.appendChild(skelBlock(820, 40, 'Kind=Line'));
            table.appendChild(row);
          }
          return table;
        })(),
      ]),
      marketingPage('Achievements /achievements', '', false, [
        txt('Достижения', fraunces('Bold'), 32, INK),
        txt('2 колонки, все бейджи закрыты при 0 XP. Не дублировать все 13 — 4 карточки покрывают layout.', outfit('Regular'), 13, MUTED, 720),
        achRow,
      ]),
      marketingPage('Achievements empty /achievements', '', false, [
        txt('Достижения', fraunces('Bold'), 32, INK),
        instEmpty(
          'Пройдите первый урок, чтобы открыть достижения',
          'Учитесь и тренируйтесь — бейджи откроются автоматически.',
        ) ||
          txt('Пройдите первый урок, чтобы открыть достижения', outfit('SemiBold'), 22, INK),
      ]),
      marketingPage('Achievements loading /achievements', '', false, [
        txt('Достижения', fraunces('Bold'), 32, INK),
        (() => {
          const grid = al('HORIZONTAL', 'Achievements skeleton');
          grid.itemSpacing = 16;
          grid.layoutWrap = 'WRAP';
          grid.resize(860, 10);
          grid.layoutSizingHorizontal = 'FIXED';
          grid.layoutSizingVertical = 'HUG';
          for (let i = 0; i < 4; i++) grid.appendChild(skelBlock(420, 192, 'Kind=Card'));
          return grid;
        })(),
        txt('Achievements loading — SkeletonCardGrid count=4 sm:grid-cols-2, not catalog 9-card grid.', outfit('Regular'), 12, MUTED, 720),
      ]),
      marketingPage('Achievements unlocked /achievements', '', false, [
        txt('Достижения', fraunces('Bold'), 32, INK),
        txt('2 колонки: открытые цветные + закрытые grayscale. Не дублировать все 13.', outfit('Regular'), 13, MUTED, 720),
        (() => {
          const row = al('HORIZONTAL', 'Achievements mixed');
          row.itemSpacing = 12;
          row.layoutWrap = 'WRAP';
          row.resize(860, 10);
          row.layoutSizingHorizontal = 'FIXED';
          row.layoutSizingVertical = 'HUG';
          row.appendChild(instAchievement(false, 'Первая победа') || txt('Первая победа', outfit('SemiBold'), 16, INK));
          row.appendChild(instAchievement(false, '100 правильных') || txt('100 правильных', outfit('SemiBold'), 16, INK));
          row.appendChild(instAchievement(true, '500 XP') || txt('500 XP', outfit('SemiBold'), 16, MUTED));
          row.appendChild(instAchievement(true, '1000 XP') || txt('1000 XP', outfit('SemiBold'), 16, MUTED));
          return row;
        })(),
      ]),
      marketingPage('Stats /stats', '', false, [
        txt('Статистика', outfit('Bold'), 30, INK),
        statTiles,
        answersChart,
      ]),
      marketingPage('Stats loading /stats', '', false, [
        txt('Статистика', outfit('Bold'), 30, INK),
        skelBlock(800, 256, 'Kind=Card'),
        txt('Stats loading — title + Skeleton h-64. Tiles and chart are not shown yet.', outfit('Regular'), 12, MUTED, 800),
      ]),
      marketingPage('Route fallback', '', true, [
        skelBlock(320, 40, 'Kind=Line'),
        (() => {
          const grid = al('HORIZONTAL', 'Fallback skeleton grid');
          grid.itemSpacing = 16;
          grid.layoutWrap = 'WRAP';
          grid.resize(860, 10);
          grid.layoutSizingHorizontal = 'FIXED';
          grid.layoutSizingVertical = 'HUG';
          for (let i = 0; i < 3; i++) grid.appendChild(skelBlock(276, 192, 'Kind=Card'));
          return grid;
        })(),
        txt('Route fallback — PageFallback Skeleton h-10 + SkeletonCardGrid count=3, not catalog 9.', outfit('Regular'), 12, MUTED, 800),
      ]),
      marketingPage('Admin /admin', '', false, [
        txt('Админ-панель', fraunces('Bold'), 32, INK),
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
      marketingPage('Admin overview loading /admin', '', false, [
        ...adminHeader('Обзор'),
        skelBlock(860, 160, 'Kind=Card'),
        txt('Admin overview loading — tabs stay, Skeleton h-40, no tiles.', outfit('Regular'), 12, MUTED, 800),
      ], false, true),
      marketingPage('Admin courses /admin', '', false, [
        txt('Админ-панель', fraunces('Bold'), 32, INK),
        txt('Курсы, уроки, пользователи и достижения', outfit('Regular'), 13, MUTED, 800),
        adminTabBar('Курсы'),
        (() => {
          const row = al('HORIZONTAL', 'search row');
          row.itemSpacing = 8;
          row.counterAxisAlignItems = 'CENTER';
          row.appendChild(field('Поиск…', 'Поиск…', INK));
          row.appendChild(instPrimary('+ Создать'));
          return row;
        })(),
        (() => {
          const list = al('VERTICAL', 'Course CRUD');
          list.itemSpacing = 8;
          for (const [title, meta] of [
            ['Первый ноутбук: файлы и папки', 'computer-basics · 16 Уроки · 4 Категории'],
            ['Основные горячие клавиши программиста', 'programmer-basics · 19 Уроки · 2 Категории'],
            ['VS Code', 'vscode · 42 Уроки · 7 Категории'],
          ]) {
            const card = al('HORIZONTAL', title);
            card.primaryAxisAlignItems = 'SPACE_BETWEEN';
            card.counterAxisAlignItems = 'CENTER';
            card.paddingTop = card.paddingBottom = 16;
            card.paddingLeft = card.paddingRight = 16;
            card.cornerRadius = 16;
            card.fills = [solid(WHITE)];
            card.strokes = [solid(INK, 0.08)];
            card.resize(860, 10);
            card.layoutSizingHorizontal = 'FIXED';
            card.layoutSizingVertical = 'HUG';
            const copy = al('VERTICAL', 'copy');
            copy.itemSpacing = 4;
            copy.appendChild(txt(title, outfit('SemiBold'), 15, INK, 560));
            copy.appendChild(txt(meta, outfit('Regular'), 12, MUTED, 560));
            card.appendChild(copy);
            const actions = al('HORIZONTAL', 'actions');
            actions.itemSpacing = 8;
            actions.appendChild(instSecondary('Открыть'));
            actions.appendChild(txt('⌫', outfit('Bold'), 14, SIGNAL));
            card.appendChild(actions);
            list.appendChild(card);
          }
          list.appendChild(txt('Не дублировать все 20 курсов — 3 строки покрывают CRUD layout.', outfit('Regular'), 12, MUTED, 800));
          return list;
        })(),
      ], false, true),
      marketingPage('Admin users /admin', '', false, [
        txt('Админ-панель', fraunces('Bold'), 32, INK),
        txt('Курсы, уроки, пользователи и достижения', outfit('Regular'), 13, MUTED, 800),
        adminTabBar('Пользователи'),
        field('Поиск…', 'Поиск…', INK),
        txt('EMAIL · USERNAME · ИМЯ · XP · УРОВЕНЬ · АДМИН', outfit('Bold'), 10, MUTED, 860),
        txt('learner@example.com  ·  learner  ·  Анна  ·  0  ·  1  ·  ☐', outfit('Regular'), 13, INK, 860),
        txt('admin@example.com  ·  siteadmin  ·  KeyMaster Admin  ·  0  ·  1  ·  ☑', outfit('Regular'), 13, INK, 860),
        txt('Имя и XP редактируются на месте. Админ не удаляет сам себя.', outfit('Regular'), 12, MUTED, 860),
      ], false, true),
      marketingPage('Admin users loading /admin', '', false, [
        ...adminHeader('Пользователи'),
        skelBlock(860, 192, 'Kind=Card'),
        txt('Admin users loading — early return Skeleton h-48, no search field.', outfit('Regular'), 12, MUTED, 800),
      ], false, true),
      marketingPage('Admin achievements /admin', '', false, [
        txt('Админ-панель', fraunces('Bold'), 32, INK),
        txt('Курсы, уроки, пользователи и достижения', outfit('Regular'), 13, MUTED, 800),
        adminTabBar('Достижения'),
        instPrimary('+ Создать'),
        (() => {
          const list = al('VERTICAL', 'Achievement CRUD');
          list.itemSpacing = 8;
          for (const [title, meta, desc] of [
            ['100 правильных', '100-correct · correct_answers >= 100 · +50 XP', '100 правильных ответов'],
            ['1000 XP', '1000-xp · total_xp >= 1000 · +50 XP', 'Накопите 1000 XP'],
            ['500 XP', '500-xp · total_xp >= 500 · +50 XP', 'Накопите 500 XP'],
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
            card.appendChild(top);
            top.layoutSizingHorizontal = 'FILL';
            card.appendChild(txt(meta, outfit('Regular'), 11, MUTED, 800));
            card.appendChild(txt(desc, outfit('Regular'), 13, MUTED, 800));
            list.appendChild(card);
          }
          list.appendChild(txt('Не дублировать все 13 бейджей — 3 строки покрывают CRUD layout.', outfit('Regular'), 12, MUTED, 800));
          return list;
        })(),
      ], false, true),
      marketingPage('Admin achievement create /admin', '', false, [
        ...adminHeader('Достижения'),
        instPrimary('+ Создать'),
        (() => {
          const form = al('VERTICAL', 'Achievement create form');
          form.itemSpacing = 12;
          form.paddingTop = form.paddingBottom = 20;
          form.paddingLeft = form.paddingRight = 20;
          form.cornerRadius = 16;
          form.fills = [solid(WHITE)];
          form.strokes = [solid(INK, 0.08)];
          form.resize(860, 10);
          form.layoutSizingHorizontal = 'FIXED';
          form.layoutSizingVertical = 'HUG';
          const grid = al('HORIZONTAL', 'ach create grid');
          grid.itemSpacing = 12;
          grid.layoutWrap = 'WRAP';
          grid.resize(820, 10);
          grid.layoutSizingHorizontal = 'FIXED';
          grid.layoutSizingVertical = 'HUG';
          grid.appendChild(field('Slug', '', INK));
          grid.appendChild(field('Название', '', INK));
          grid.appendChild(field('Иконка', 'trophy', INK));
          grid.appendChild(field('Бонус XP', '50', INK));
          grid.appendChild(field('Тип условия', 'correct_answers', INK));
          grid.appendChild(field('Значение', '1', INK));
          form.appendChild(grid);
          form.appendChild(field('Описание', '', INK));
          form.appendChild(
            txt(
              'correct_answers · total_xp · streak_days · combo · course_complete',
              outfit('Regular'),
              11,
              MUTED,
              800,
            ),
          );
          const actions = al('HORIZONTAL', 'ach create actions');
          actions.itemSpacing = 8;
          actions.appendChild(instPrimary('Сохранить'));
          actions.appendChild(instSecondary('Отмена'));
          form.appendChild(actions);
          return form;
        })(),
        txt('Форма создания достижения. Список бейджей не дублировать.', outfit('Regular'), 12, MUTED, 800),
      ], false, true),
      marketingPage('Admin course editor /admin', '', false, [
        ...adminHeader('Курсы'),
        (() => {
          const back = al('HORIZONTAL', 'back');
          back.itemSpacing = 8;
          back.counterAxisAlignItems = 'CENTER';
          back.appendChild(txt('←', outfit('SemiBold'), 13, BRAND800));
          back.appendChild(txt('Назад к курсам', outfit('SemiBold'), 13, BRAND800));
          return back;
        })(),
        (() => {
          const form = al('VERTICAL', 'Course editor form');
          form.itemSpacing = 12;
          form.paddingTop = form.paddingBottom = 20;
          form.paddingLeft = form.paddingRight = 20;
          form.cornerRadius = 16;
          form.fills = [solid(WHITE)];
          form.strokes = [solid(INK, 0.08)];
          form.resize(860, 10);
          form.layoutSizingHorizontal = 'FIXED';
          form.layoutSizingVertical = 'HUG';
          const row = al('HORIZONTAL', 'slug title');
          row.itemSpacing = 12;
          row.appendChild(field('Slug', 'computer-basics', INK));
          row.appendChild(field('Название', 'Первый ноутбук: файлы и папки', INK));
          form.appendChild(row);
          form.appendChild(field('Иконка', 'folder', INK));
          form.appendChild(
            field(
              'Описание',
              'Создание папок и файлов, проводник, корзина и ZIP. Выполняйте задания в симуляторе «Рабочий стол».',
              INK,
            ),
          );
          form.appendChild(instPrimary('Сохранить'));
          return form;
        })(),
        txt('Категории', outfit('SemiBold'), 18, INK),
        (() => {
          const add = al('HORIZONTAL', 'Add category');
          add.itemSpacing = 8;
          add.counterAxisAlignItems = 'MAX';
          add.paddingTop = add.paddingBottom = 16;
          add.paddingLeft = add.paddingRight = 16;
          add.cornerRadius = 16;
          add.fills = [solid(WHITE)];
          add.strokes = [solid(INK, 0.08)];
          add.appendChild(field('Slug', '', INK));
          add.appendChild(field('Название', '', INK));
          add.appendChild(field('Порядок', '0', INK));
          add.appendChild(instSecondary('Категория'));
          return add;
        })(),
        (() => {
          const cat = al('VERTICAL', 'Category card');
          cat.itemSpacing = 10;
          cat.paddingTop = cat.paddingBottom = 16;
          cat.paddingLeft = cat.paddingRight = 16;
          cat.cornerRadius = 16;
          cat.fills = [solid(WHITE)];
          cat.strokes = [solid(INK, 0.08)];
          cat.resize(860, 10);
          cat.layoutSizingHorizontal = 'FIXED';
          cat.layoutSizingVertical = 'HUG';
          const head = al('HORIZONTAL', 'cat head');
          head.primaryAxisAlignItems = 'SPACE_BETWEEN';
          head.counterAxisAlignItems = 'CENTER';
          const copy = al('VERTICAL', 'cat copy');
          copy.itemSpacing = 4;
          copy.appendChild(txt('Файлы и папки', outfit('SemiBold'), 15, INK));
          copy.appendChild(txt('basics · 3 Уроки', outfit('Regular'), 12, MUTED));
          head.appendChild(copy);
          head.appendChild(instSecondary('Урок'));
          cat.appendChild(head);
          head.layoutSizingHorizontal = 'FILL';
          for (const [title, prompt] of [
            ['Файл и папка', 'Поймите разницу между файлом и папкой'],
            ['Расширение файла', 'Узнайте, зачем нужно .txt, .jpg, .zip'],
            ['Где хранить', 'Решите, что на рабочем столе, а что в папках'],
          ]) {
            const lesson = al('VERTICAL', title);
            lesson.itemSpacing = 2;
            lesson.paddingTop = lesson.paddingBottom = 8;
            lesson.paddingLeft = lesson.paddingRight = 12;
            lesson.cornerRadius = 8;
            lesson.strokes = [solid(INK, 0.08)];
            lesson.appendChild(txt(title, outfit('Medium'), 14, INK));
            lesson.appendChild(txt('· +15 XP', outfit('Regular'), 11, BRAND800));
            lesson.appendChild(txt(prompt, outfit('Regular'), 11, MUTED, 720));
            cat.appendChild(lesson);
          }
          cat.appendChild(
            txt(
              'Не дублировать все 16 уроков — 1 категория + 3 урока покрывают CourseEditor layout.',
              outfit('Regular'),
              12,
              MUTED,
              800,
            ),
          );
          return cat;
        })(),
      ], false, true),
      marketingPage('Admin add lesson /admin', '', false, [
        ...adminHeader('Курсы'),
        (() => {
          const back = al('HORIZONTAL', 'back add lesson');
          back.itemSpacing = 8;
          back.counterAxisAlignItems = 'CENTER';
          back.appendChild(txt('←', outfit('SemiBold'), 13, BRAND800));
          back.appendChild(txt('Назад к курсам', outfit('SemiBold'), 13, BRAND800));
          return back;
        })(),
        txt('Категории', outfit('SemiBold'), 18, INK),
        (() => {
          const cat = al('VERTICAL', 'Add lesson category');
          cat.itemSpacing = 10;
          cat.paddingTop = cat.paddingBottom = 16;
          cat.paddingLeft = cat.paddingRight = 16;
          cat.cornerRadius = 16;
          cat.fills = [solid(WHITE)];
          cat.strokes = [solid(INK, 0.08)];
          cat.resize(860, 10);
          cat.layoutSizingHorizontal = 'FIXED';
          cat.layoutSizingVertical = 'HUG';
          const head = al('HORIZONTAL', 'add lesson cat head');
          head.primaryAxisAlignItems = 'SPACE_BETWEEN';
          head.counterAxisAlignItems = 'CENTER';
          const copy = al('VERTICAL', 'add lesson cat copy');
          copy.itemSpacing = 4;
          copy.appendChild(txt('Файлы и папки', outfit('SemiBold'), 15, INK));
          copy.appendChild(txt('basics · 3 Уроки', outfit('Regular'), 12, MUTED));
          head.appendChild(copy);
          head.appendChild(instSecondary('Урок'));
          cat.appendChild(head);
          head.layoutSizingHorizontal = 'FILL';
          const form = al('VERTICAL', 'Add lesson form');
          form.itemSpacing = 8;
          form.paddingTop = form.paddingBottom = 12;
          form.paddingLeft = form.paddingRight = 12;
          form.cornerRadius = 12;
          form.fills = [solid(BRAND50)];
          form.strokes = [solid(BRAND, 0.2)];
          const grid = al('HORIZONTAL', 'add lesson grid');
          grid.itemSpacing = 12;
          grid.layoutWrap = 'WRAP';
          grid.resize(800, 10);
          grid.layoutSizingHorizontal = 'FIXED';
          grid.layoutSizingVertical = 'HUG';
          grid.appendChild(field('Название', '', INK));
          grid.appendChild(field('Клавиши', 'Control+C', INK, 'Через + , например Control+Shift+P'));
          grid.appendChild(field('Задание', '', INK));
          grid.appendChild(field('XP за урок', '10', INK));
          form.appendChild(grid);
          form.appendChild(field('Описание', '', INK));
          form.appendChild(field('Зачем нужно', '', INK));
          const actions = al('HORIZONTAL', 'add lesson actions');
          actions.itemSpacing = 8;
          actions.appendChild(instPrimary('Сохранить'));
          actions.appendChild(instSecondary('Отмена'));
          form.appendChild(actions);
          cat.appendChild(form);
          const lesson = al('VERTICAL', 'Файл и папка add-lesson');
          lesson.itemSpacing = 2;
          lesson.paddingTop = lesson.paddingBottom = 8;
          lesson.paddingLeft = lesson.paddingRight = 12;
          lesson.cornerRadius = 8;
          lesson.strokes = [solid(INK, 0.08)];
          lesson.appendChild(txt('Файл и папка', outfit('Medium'), 14, INK));
          lesson.appendChild(txt('· +15 XP', outfit('Regular'), 11, BRAND800));
          cat.appendChild(lesson);
          cat.appendChild(
            txt(
              'Форма Урок внутри категории. Не дублировать остальные 15 уроков.',
              outfit('Regular'),
              12,
              MUTED,
              800,
            ),
          );
          return cat;
        })(),
      ], false, true),
      marketingPage('Admin course create /admin', '', false, [
        ...adminHeader('Курсы'),
        (() => {
          const row = al('HORIZONTAL', 'search row create');
          row.itemSpacing = 8;
          row.counterAxisAlignItems = 'CENTER';
          row.appendChild(field('Поиск…', 'Поиск…', INK));
          row.appendChild(instPrimary('+ Создать'));
          return row;
        })(),
        (() => {
          const form = al('VERTICAL', 'Course create form');
          form.itemSpacing = 12;
          form.paddingTop = form.paddingBottom = 20;
          form.paddingLeft = form.paddingRight = 20;
          form.cornerRadius = 16;
          form.fills = [solid(WHITE)];
          form.strokes = [solid(INK, 0.08)];
          form.resize(860, 10);
          form.layoutSizingHorizontal = 'FIXED';
          form.layoutSizingVertical = 'HUG';
          const grid = al('HORIZONTAL', 'create grid');
          grid.itemSpacing = 12;
          grid.layoutWrap = 'WRAP';
          grid.resize(820, 10);
          grid.layoutSizingHorizontal = 'FIXED';
          grid.layoutSizingVertical = 'HUG';
          grid.appendChild(field('Slug', '', INK));
          grid.appendChild(field('Название', '', INK));
          grid.appendChild(field('Иконка', 'keyboard', INK));
          grid.appendChild(field('Порядок', '0', INK));
          form.appendChild(grid);
          form.appendChild(field('Описание', '', INK));
          const actions = al('HORIZONTAL', 'create actions');
          actions.itemSpacing = 8;
          actions.appendChild(instPrimary('Сохранить'));
          actions.appendChild(instSecondary('Отмена'));
          form.appendChild(actions);
          return form;
        })(),
        txt('Форма создания поверх списка. Не дублировать все 20 курсов.', outfit('Regular'), 12, MUTED, 800),
      ], false, true),
      marketingPage('Admin courses empty /admin', '', false, [
        ...adminHeader('Курсы'),
        (() => {
          const row = al('HORIZONTAL', 'search row empty');
          row.itemSpacing = 8;
          row.counterAxisAlignItems = 'CENTER';
          row.appendChild(field('Поиск…', 'Поиск…', INK));
          row.appendChild(instPrimary('+ Создать'));
          return row;
        })(),
        txt('Пока пусто', outfit('Regular'), 13, MUTED),
        txt('Admin courses empty — paragraph t(admin.empty), not EmptyState.', outfit('Regular'), 12, MUTED, 800),
      ], false, true),
      marketingPage('Admin course editor loading /admin', '', false, [
        ...adminHeader('Курсы'),
        skelBlock(860, 256, 'Kind=Card'),
        txt('Admin course-editor loading — tabs stay, Skeleton h-64, no back control until course loads.', outfit('Regular'), 12, MUTED, 800),
      ], false, true),
      marketingPage('Admin forbidden', '', false, [
        txt('Доступ только для администраторов', fraunces('Bold'), 32, INK, 800),
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
      marketingPage('Verify email loading /verify-email', '', true, [verifyLoading]),
      marketingPage('Verify email ok /verify-email', '', true, [verifyOk]),
      marketingPage('Auth callback /auth/callback', '', true, [callbackCard]),
      marketingPage('Auth callback error /auth/callback', '', true, [callbackError]),
    ]),
  );
  board.appendChild(
    section('PracticeShell', [
      practicePage('Practice hub /practice', 'Тренировочный зал', [
        txt('ПРАКТИКА', outfit('Bold'), 11, BRAND800),
        txt('Тренировочный зал', fraunces('Bold'), 32, INK),
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
      practicePage('Training empty /training', 'Hotkeys', [trainEmpty]),
      practicePage('Training done /training', 'Hotkeys', [trainDone]),
      practicePage('Training loading /training', 'Hotkeys', [
        skelBlock(224, 40, 'Kind=Line'),
        skelBlock(680, 288, 'Kind=Card'),
        txt('Training loading — PracticeShell + SkeletonBlock h-10 w-56 + h-72.', outfit('Regular'), 12, MUTED, 680),
      ]),
      practicePage('Speed /speed', 'Скорость', [speedBody]),
      practicePage('Speed done /speed', 'Скорость', [speedDone]),
      practicePage('Speed loading /speed', 'Скорость', [
        skelBlock(192, 40, 'Kind=Line'),
        skelBlock(680, 256, 'Kind=Card'),
        txt('Speed loading — PracticeShell + SkeletonBlock h-10 w-48 + h-64.', outfit('Regular'), 12, MUTED, 680),
      ]),
      practicePage('Quiz /quiz', 'Основы hotkeys', [quiz]),
      practicePage('Quiz picked /quiz', 'Основы hotkeys', [quizPicked]),
      practicePage('Quiz done /quiz', 'Основы hotkeys', [quizDone]),
      practicePage('Exam setup /exam', 'Экзамен', [exam]),
      practicePage('Exam empty /exam', 'Экзамен', [examEmpty]),
      practicePage('Exam loading /exam', 'Экзамен', [
        skelBlock(160, 24, 'Kind=Line'),
        skelBlock(680, 8, 'Kind=Line'),
        skelBlock(680, 256, 'Kind=Card'),
        txt('Exam loading — PracticeShell + Skeleton h-6 w-40 + h-2 bar + h-64 card.', outfit('Regular'), 12, MUTED, 680),
      ]),
      practicePage('Exam run /exam', 'Экзамен', [examRun]),
      practicePage('Exam feedback /exam', 'Экзамен', [examFeedback]),
      practicePage('Exam wrong /exam', 'Экзамен', [examWrong]),
      practicePage('Exam correct /exam', 'Экзамен', [examCorrect]),
      practicePage('Exam done /exam', 'Экзамен', [examDone]),
      practicePage('Review front /review', 'Повторение', [review]),
      practicePage('Review flipped /review', 'Повторение', [reviewBack]),
      practicePage('Review empty /review', 'Повторение', [reviewEmpty]),
      practicePage('Review loading /review', 'Повторение', [
        skelBlock(160, 32, 'Kind=Line'),
        skelBlock(448, 320, 'Kind=Card'),
        txt('Review loading — PracticeShell + SkeletonBlock h-8 w-40 + h-80 max-w-md.', outfit('Regular'), 12, MUTED, 680),
      ]),
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
  darkCtas.appendChild(instPrimary('Мой путь развития →'));
  darkCtas.appendChild(secondaryBtn('Практика', 'dark'));
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
    ['Браузеры', false],
    ['Офис', false],
    ['Git', false],
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
  darkCoursesRow.appendChild(
    catalogCard({
      title: 'Первый ноутбук: файлы и папки',
      desc: 'Создание папок и файлов, проводник, корзина и ZIP. Выполняйте задания в симуляторе «Рабочий стол».',
      meta: '16 уроков · 4 категории',
      start: true,
      dark: true,
      progress: '0/16 сочетаний',
      percent: '0%',
      iconFill: { r: 0.96, g: 0.55, b: 0.2 },
    }),
  );
  darkCoursesRow.appendChild(
    catalogCard({
      title: 'Основные горячие клавиши программиста',
      desc: 'Короткие уроки: копирование, сохранение, поиск и ещё несколько важных сочетаний. Системные клавиши (Alt+Tab, Win, F) — в разделе изучения и в режиме «Повторение».',
      meta: '19 уроков · 2 категории',
      start: true,
      dark: true,
      progress: '0/19 сочетаний',
      percent: '0%',
      iconFill: { r: 0.35, g: 0.42, b: 0.55 },
    }),
  );
  darkCoursesRow.appendChild(
    catalogCard({
      title: 'VS Code',
      desc: 'Visual Studio Code — редактор кода от Microsoft.',
      meta: '42 урока · 7 категорий',
      start: false,
      dark: true,
      progress: '0/42 сочетаний',
      percent: '0%',
      iconFill: { r: 0.13, g: 0.48, b: 0.78 },
    }),
  );

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

  function mobileHeader(guest) {
    const mnav = al('HORIZONTAL', 'Mobile header');
    mnav.primaryAxisAlignItems = 'SPACE_BETWEEN';
    mnav.counterAxisAlignItems = 'CENTER';
    mnav.paddingLeft = mnav.paddingRight = 12;
    mnav.resize(390, 56);
    mnav.layoutSizingHorizontal = 'FIXED';
    mnav.layoutSizingVertical = 'FIXED';
    mnav.fills = [solid(WHITE)];
    mnav.appendChild(txt('KeyMaster', fraunces('SemiBold'), 16, INK));
    const right = al('HORIZONTAL', 'mobile actions');
    right.itemSpacing = 6;
    right.counterAxisAlignItems = 'CENTER';
    right.appendChild(themeToggle(false));
    if (guest) {
      right.appendChild(txt('Вход', outfit('SemiBold'), 13, INK));
      right.appendChild(primaryBtn('Регистрация', true));
    } else {
      right.appendChild(secondaryBtn('Выйти'));
    }
    right.appendChild(txt('☰', outfit('Bold'), 16, INK));
    mnav.appendChild(right);
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
    frame.appendChild(mobileHeader(!(opts && opts.authed)));
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

  function mobileLbHero(period) {
    period = period || 'all';
    const hero = al('VERTICAL', 'Leaderboard hero 390');
    hero.itemSpacing = 8;
    hero.paddingTop = hero.paddingBottom = 20;
    hero.paddingLeft = hero.paddingRight = 16;
    hero.cornerRadius = 24;
    hero.fills = [solid({ r: 0.941, g: 0.961, b: 1 })];
    hero.strokes = [solid(BRAND, 0.2)];
    hero.resize(358, 10);
    hero.layoutSizingHorizontal = 'FIXED';
    hero.layoutSizingVertical = 'HUG';
    hero.appendChild(txt('СОРЕВНОВАНИЕ', outfit('Bold'), 11, BRAND800));
    hero.appendChild(txt('Рейтинг', fraunces('Bold'), 28, INK, 326));
    hero.appendChild(
      txt(
        'Топ учеников KeyMaster по XP. Тренируйтесь, поднимайтесь выше и держите серию.',
        outfit('Regular'),
        13,
        MUTED,
        326,
      ),
    );
    const periods = al('HORIZONTAL', 'Period filter 390');
    periods.itemSpacing = 4;
    periods.layoutWrap = 'WRAP';
    periods.paddingTop = periods.paddingBottom = periods.paddingLeft = periods.paddingRight = 4;
    periods.cornerRadius = 12;
    periods.fills = [solid(WHITE)];
    periods.strokes = [solid(INK, 0.1)];
    for (const [label, key] of [
      ['Всё время', 'all'],
      ['Неделя', 'week'],
      ['Месяц', 'month'],
    ]) {
      const on = period === key;
      const chip = al('HORIZONTAL', label);
      chip.paddingLeft = chip.paddingRight = 14;
      chip.paddingTop = chip.paddingBottom = 6;
      chip.cornerRadius = 8;
      chip.fills = on ? [solid(BRAND)] : [TRANSPARENT];
      chip.appendChild(txt(label, outfit('SemiBold'), 13, on ? WHITE : MUTED));
      periods.appendChild(chip);
    }
    hero.appendChild(periods);
    return hero;
  }

  function mobilePodiumCard(isYou) {
    const card = al('VERTICAL', isYou ? '#1 Анна you 390' : '#1 Анна guest 390');
    card.itemSpacing = 6;
    card.primaryAxisAlignItems = 'CENTER';
    card.paddingTop = card.paddingBottom = 20;
    card.paddingLeft = card.paddingRight = 16;
    card.cornerRadius = 16;
    card.fills = [solid(WHITE)];
    card.strokes = [solid(isYou ? BRAND : ACCENT, 0.5)];
    card.resize(220, 10);
    card.layoutSizingHorizontal = 'FIXED';
    card.layoutSizingVertical = 'HUG';
    const crown = figma.createEllipse();
    crown.resize(40, 40);
    crown.fills = [solid({ r: 0.961, g: 0.769, b: 0.157 })];
    card.appendChild(crown);
    card.appendChild(txt('#1', outfit('Bold'), 11, MUTED));
    card.appendChild(txt('Анна', outfit('SemiBold'), 16, INK));
    card.appendChild(txt('@learner', outfit('Regular'), 12, MUTED));
    const xpPill = al('HORIZONTAL', isYou ? '0 XP you 390' : '0 XP guest 390');
    xpPill.itemSpacing = 4;
    xpPill.paddingLeft = xpPill.paddingRight = 10;
    xpPill.paddingTop = xpPill.paddingBottom = 4;
    xpPill.cornerRadius = 8;
    xpPill.fills = [solid(SUCCESS, 0.12)];
    xpPill.appendChild(txt('0 XP', outfit('Bold'), 13, SUCCESS));
    card.appendChild(xpPill);
    card.appendChild(txt('Новичок', outfit('Medium'), 12, BRAND800));
    if (isYou) {
      const you = al('HORIZONTAL', 'ВЫ');
      you.paddingLeft = you.paddingRight = 8;
      you.paddingTop = you.paddingBottom = 2;
      you.cornerRadius = 6;
      you.fills = [solid(BRAND)];
      you.appendChild(txt('ВЫ', outfit('Bold'), 10, WHITE));
      card.appendChild(you);
    }
    return card;
  }

  const mobileCourses = mobileFrame(
    'Mobile Courses 390',
    [
      txt('КАТАЛОГ', outfit('Bold'), 11, BRAND800),
      txt('Каталог курсов', fraunces('Bold'), 28, INK, 358),
      txt('Выберите инструмент и изучайте сочетания. Прогресс сохраняется и отображается на карте пути.', outfit('Regular'), 13, MUTED, 358),
      secondaryBtn('Путь обучения'),
      searchField(358),
      (() => {
        const chips = al('HORIZONTAL', 'Filters');
        chips.itemSpacing = 8;
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
          chips.appendChild(chip);
        }
        return chips;
      })(),
      catalogCard({
        title: 'Первый ноутбук: файлы и папки',
        desc: 'Создание папок и файлов, проводник, корзина и ZIP. Выполняйте задания в симуляторе «Рабочий стол».',
        meta: '16 уроков · 4 категории',
        start: true,
        width: 358,
        iconFill: { r: 0.96, g: 0.55, b: 0.2 },
      }),
    ],
    'Курсы',
  );
  const mobileCoursesAuthed = mobileFrame(
    'Mobile Courses authed 390',
    [
      txt('КАТАЛОГ', outfit('Bold'), 11, BRAND800),
      txt('Каталог курсов', fraunces('Bold'), 28, INK, 358),
      txt('Выберите инструмент и изучайте сочетания. Прогресс сохраняется и отображается на карте пути.', outfit('Regular'), 13, MUTED, 358),
      secondaryBtn('Путь обучения'),
      searchField(358),
      (() => {
        const chips = al('HORIZONTAL', 'Filters authed 390');
        chips.itemSpacing = 8;
        chips.layoutWrap = 'WRAP';
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
          chips.appendChild(chip);
        }
        return chips;
      })(),
      catalogCard({
        title: 'Первый ноутбук: файлы и папки',
        desc: 'Создание папок и файлов, проводник, корзина и ZIP. Выполняйте задания в симуляторе «Рабочий стол».',
        meta: '16 уроков · 4 категории',
        start: true,
        width: 358,
        progress: '0/16 сочетаний',
        percent: '0%',
        iconFill: { r: 0.96, g: 0.55, b: 0.2 },
      }),
    ],
    'Курсы',
    { authed: true },
  );
  const mobileCourseBasics = mobileFrame(
    'Mobile Course computer-basics 390',
    [
      pill('ОБЯЗАТЕЛЬНЫЙ СТАРТ', { r: 0.114, g: 0.306, b: 0.847 }, WHITE),
      txt('Первый ноутбук: файлы и папки', fraunces('Bold'), 28, INK, 358),
      txt('Создание папок и файлов, проводник, корзина и ZIP. Выполняйте задания в симуляторе «Рабочий стол».', outfit('Regular'), 13, MUTED, 358),
      txt('0/16 сочетаний', outfit('Regular'), 13, MUTED),
      txt('Файлы и папки', outfit('SemiBold'), 16, INK),
      txt('0/3 изучено', outfit('Medium'), 12, MUTED),
      txt('Файл и папка', outfit('SemiBold'), 14, INK, 358),
      txt('НЕ ИЗУЧЕНО', outfit('Bold'), 10, MUTED),
      txt('+15 XP', outfit('Regular'), 11, MUTED),
      txt('Папка Practice', outfit('SemiBold'), 14, INK, 358),
      courseDetailCtas('desktop'),
      txt('Mobile authed computer-basics — Desktop CTA, no Training/Exam.', outfit('Regular'), 11, MUTED, 358),
    ],
    'Курсы',
    { authed: true },
  );
  const mobileRegister = mobileFrame(
    'Mobile Register — BottomNav hidden',
    [
      (() => {
        const card = al('VERTICAL', 'AuthCard compact 390');
        card.itemSpacing = 0;
        card.cornerRadius = 24;
        card.fills = [solid(WHITE)];
        card.resize(358, 10);
        card.layoutSizingHorizontal = 'FIXED';
        card.layoutSizingVertical = 'HUG';
        const head = al('VERTICAL', 'header');
        head.itemSpacing = 6;
        head.paddingTop = head.paddingBottom = 16;
        head.paddingLeft = head.paddingRight = 16;
        head.fills = [solid(BRAND50)];
        head.appendChild(txt('KEYMASTER', outfit('Bold'), 10, BRAND800));
        head.appendChild(txt('Регистрация', fraunces('Bold'), 22, INK));
        head.appendChild(txt('Добро пожаловать в KeyMaster', outfit('Regular'), 13, MUTED, 326));
        card.appendChild(head);
        const form = al('VERTICAL', 'form');
        form.itemSpacing = 10;
        form.paddingTop = form.paddingBottom = 16;
        form.paddingLeft = form.paddingRight = 16;
        form.appendChild(floatOrInst('State=Default', 'Имя', { width: 326 }));
        form.appendChild(floatOrInst('State=Default', 'username', { width: 326 }));
        form.appendChild(floatOrInst('State=Default', 'Email', { width: 326 }));
        form.appendChild(floatOrInst('State=Password', 'Пароль', { password: true, width: 326 }));
        form.appendChild(instPrimary('Создать аккаунт'));
        card.appendChild(form);
        const foot = al('HORIZONTAL', 'footer');
        foot.itemSpacing = 4;
        foot.primaryAxisAlignItems = 'CENTER';
        foot.paddingTop = foot.paddingBottom = 12;
        foot.paddingLeft = foot.paddingRight = 16;
        foot.fills = [solid({ r: 0.976, g: 0.98, b: 0.984 })];
        foot.appendChild(txt('Уже есть аккаунт?', outfit('Regular'), 13, MUTED));
        foot.appendChild(txt('Войти', outfit('SemiBold'), 13, BRAND800));
        card.appendChild(foot);
        return card;
      })(),
      txt('Guest /path and /practice redirect here (ProtectedRoute → /register). BottomNav hidden.', outfit('Regular'), 11, MUTED, 358),
    ],
    '',
    { hideNav: true },
  );
  const mobileHomeAuthed = mobileFrame(
    'Mobile Home authed 390',
    [
      txt('KeyMaster', fraunces('Bold'), 32, INK),
      txt('От первого ноутбука — до мастерства клавиатуры', outfit('Regular'), 13, MUTED, 358),
      txt(
        'Файлы и папки, слепая печать, горячие клавиши и симулятор рабочего стола — понятный путь без скуки, с нуля.',
        outfit('Regular'),
        13,
        MUTED,
        358,
      ),
      (() => {
        const row = al('HORIZONTAL', 'mobile authed CTAs');
        row.itemSpacing = 8;
        row.layoutWrap = 'WRAP';
        row.primaryAxisAlignItems = 'CENTER';
        row.counterAxisAlignItems = 'CENTER';
        row.appendChild(instPrimary('Мой путь развития →'));
        row.appendChild(secondaryBtn('Практика'));
        return row;
      })(),
      txt('Home / — BottomNav all inactive. Authed header shows Выйти (btn-secondary vs hidden).', outfit('Regular'), 11, MUTED, 358),
    ],
    '',
    { authed: true },
  );
  const mobileLeaderboard = mobileFrame(
    'Mobile Leaderboard 390',
    [
      mobileLbHero(),
      mobilePodiumCard(false),
      txt(
        'Пройдите ещё уроки — таблица расширится, когда появятся новые игроки.',
        outfit('Regular'),
        12,
        MUTED,
        358,
      ),
    ],
    'Рейтинг',
  );
  const mobileLeaderboardAuthed = mobileFrame(
    'Mobile Leaderboard authed 390',
    [
      mobileLbHero(),
      mobilePodiumCard(true),
      txt(
        'Пройдите ещё уроки — таблица расширится, когда появятся новые игроки.',
        outfit('Regular'),
        12,
        MUTED,
        358,
      ),
    ],
    'Рейтинг',
    { authed: true },
  );
  const mobileLeaderboardPeriodEmpty = mobileFrame(
    'Mobile Leaderboard period empty 390',
    [
      mobileLbHero('week'),
      instEmpty(
        'За этот период пока никого',
        'Завершите уроки на этой неделе или в этом месяце — XP попадёт в таблицу.',
      ) || txt('За этот период пока никого', outfit('SemiBold'), 18, INK, 326),
    ],
    'Рейтинг',
    { authed: true },
  );
  const mobileDashboard = mobileFrame(
    'Mobile Dashboard 390',
    [
      txt('Привет, Анна!', fraunces('Bold'), 28, INK, 358),
      txt('Личный кабинет KeyMaster', outfit('Regular'), 14, MUTED, 358),
      secondaryBtn('Мой путь развития'),
      (() => {
        const card = al('VERTICAL', 'NextStepCard 390');
        card.itemSpacing = 8;
        card.paddingTop = card.paddingBottom = 16;
        card.paddingLeft = card.paddingRight = 16;
        card.cornerRadius = 24;
        card.fills = [solid(BRAND50, 0.8)];
        card.strokes = [solid(BRAND, 0.25)];
        card.resize(358, 10);
        card.layoutSizingHorizontal = 'FIXED';
        card.layoutSizingVertical = 'HUG';
        card.appendChild(txt('СЕГОДНЯ', outfit('Bold'), 11, BRAND800));
        card.appendChild(txt('Первый ноутбук: файлы и папки', fraunces('SemiBold'), 20, INK, 326));
        card.appendChild(txt('XP 0 · пройдено 0/20 · дальше: First Laptop', outfit('Regular'), 13, MUTED, 326));
        const btns = al('VERTICAL', 'next ctas 390');
        btns.itemSpacing = 8;
        btns.appendChild(instPrimary('Приступить'));
        btns.appendChild(secondaryBtn('Открыть путь обучения'));
        card.appendChild(btns);
        card.appendChild(txt('Novice Operator', outfit('Regular'), 12, MUTED));
        return card;
      })(),
      txt('Ближайшие этапы', outfit('SemiBold'), 16, INK),
      (() => {
        const row = al('VERTICAL', 'PathStageStrip 390');
        row.itemSpacing = 8;
        for (const [num, title, status, locked] of [
          ['01', 'Первый ноутбук: файлы и папки', 'НАЧАТЬ', false],
          ['02', 'Основные горячие клавиши программиста', 'ЗАБЛОКИРОВАНО', true],
        ]) {
          const c = al('HORIZONTAL', 'stage ' + num);
          c.primaryAxisAlignItems = 'SPACE_BETWEEN';
          c.counterAxisAlignItems = 'CENTER';
          c.paddingTop = c.paddingBottom = 12;
          c.paddingLeft = c.paddingRight = 12;
          c.cornerRadius = 16;
          c.fills = [solid(locked ? WHITE : BRAND50)];
          c.strokes = [solid(locked ? INK : BRAND, locked ? 0.1 : 0.35)];
          c.resize(358, 10);
          c.layoutSizingHorizontal = 'FIXED';
          c.layoutSizingVertical = 'HUG';
          const left = al('VERTICAL', 'stage copy');
          left.itemSpacing = 4;
          left.appendChild(txt(num, outfit('Bold'), 11, MUTED));
          left.appendChild(txt(title, outfit('SemiBold'), 13, INK, 220));
          c.appendChild(left);
          const chip = al('HORIZONTAL', status);
          chip.paddingLeft = chip.paddingRight = 8;
          chip.paddingTop = chip.paddingBottom = 2;
          chip.cornerRadius = 6;
          chip.fills = [solid(locked ? { r: 0.941, g: 0.945, b: 0.953 } : INK)];
          chip.appendChild(txt(status, outfit('Bold'), 9, locked ? MUTED : WHITE));
          c.appendChild(chip);
          row.appendChild(c);
        }
        return row;
      })(),
      txt('УРОВЕНЬ', outfit('SemiBold'), 11, MUTED),
      txt('Новичок', outfit('SemiBold'), 22, INK),
    ],
    '',
    { authed: true },
  );
  const mobilePractice = mobileFrame(
    'Mobile Practice 390',
    [
      txt('ПРАКТИКА', outfit('Bold'), 11, BRAND800),
      txt('Тренировочный зал', fraunces('Bold'), 28, INK, 358),
      txt('Один вход — все режимы. Сначала навыки (печать и файлы), затем закрепление из курсов. Идите по рекомендуемому маршруту.', outfit('Regular'), 13, MUTED, 358),
      (() => {
        const card = al('VERTICAL', 'Рекомендуемый маршрут');
        card.itemSpacing = 8;
        card.paddingTop = card.paddingBottom = 16;
        card.paddingLeft = card.paddingRight = 16;
        card.cornerRadius = 24;
        card.fills = [solid(WHITE)];
        card.strokes = [solid(BRAND, 0.25)];
        card.resize(358, 10);
        card.layoutSizingHorizontal = 'FIXED';
        card.layoutSizingVertical = 'HUG';
        card.appendChild(txt('С ЧЕГО НАЧАТЬ СЕГОДНЯ', outfit('Bold'), 11, BRAND800));
        card.appendChild(txt('Рекомендуемый маршрут', fraunces('SemiBold'), 18, INK, 326));
        card.appendChild(txt('1. Слепая печать — уверенность в пальцах', outfit('Regular'), 13, MUTED, 326));
        card.appendChild(txt('2. Симулятор — папки и файлы без страха', outfit('Regular'), 13, MUTED, 326));
        card.appendChild(txt('3. Курс «Первый ноутбук» — закрепить знания', outfit('Regular'), 13, MUTED, 326));
        card.appendChild(txt('4. Hotkeys и путь разработчика — дальше по карте', outfit('Regular'), 13, MUTED, 326));
        card.appendChild(instPrimary('Открыть «Первый ноутбук»'));
        return card;
      })(),
      txt('Навыки', outfit('SemiBold'), 16, INK),
    ],
    'Практика',
    { chips: 'Тренировочный зал', authed: true },
  );
  function mobileNavOpen(name, guest) {
    const frame = al('VERTICAL', name);
    frame.itemSpacing = 0;
    frame.fills = [solid(PAPER)];
    frame.strokes = [solid(INK, 0.1)];
    frame.resize(390, 10);
    frame.layoutSizingHorizontal = 'FIXED';
    frame.layoutSizingVertical = 'HUG';
    const mnav = al('HORIZONTAL', 'Mobile header');
    mnav.primaryAxisAlignItems = 'SPACE_BETWEEN';
    mnav.counterAxisAlignItems = 'CENTER';
    mnav.paddingLeft = mnav.paddingRight = 12;
    mnav.resize(390, 56);
    mnav.layoutSizingHorizontal = 'FIXED';
    mnav.layoutSizingVertical = 'FIXED';
    mnav.fills = [solid(WHITE)];
    mnav.appendChild(txt('KeyMaster', fraunces('SemiBold'), 16, INK));
    const right = al('HORIZONTAL', 'mobile actions');
    right.itemSpacing = 6;
    right.counterAxisAlignItems = 'CENTER';
    right.appendChild(themeToggle(false));
    right.appendChild(txt('✕', outfit('Bold'), 16, INK));
    mnav.appendChild(right);
    frame.appendChild(mnav);
    const menu = al('VERTICAL', 'km-mobile-nav');
    menu.itemSpacing = 12;
    menu.paddingTop = menu.paddingBottom = 16;
    menu.paddingLeft = menu.paddingRight = 16;
    menu.fills = [solid(WHITE)];
    menu.resize(390, 10);
    menu.layoutSizingHorizontal = 'FIXED';
    menu.layoutSizingVertical = 'HUG';
    const lang = al('HORIZONTAL', 'LanguageSwitcher compact');
    lang.itemSpacing = 0;
    lang.paddingLeft = lang.paddingRight = lang.paddingTop = lang.paddingBottom = 2;
    lang.cornerRadius = 8;
    lang.strokes = [solid(INK, 0.1)];
    lang.resize(358, 44);
    lang.layoutSizingHorizontal = 'FIXED';
    lang.layoutSizingVertical = 'FIXED';
    const ru = al('HORIZONTAL', 'RU');
    ru.primaryAxisAlignItems = 'CENTER';
    ru.counterAxisAlignItems = 'CENTER';
    ru.paddingLeft = ru.paddingRight = 10;
    ru.cornerRadius = 6;
    ru.fills = [solid({ r: 0.114, g: 0.306, b: 0.847 })];
    ru.resize(177, 40);
    ru.layoutSizingHorizontal = 'FIXED';
    ru.layoutSizingVertical = 'FIXED';
    ru.appendChild(txt('RU', outfit('Bold'), 13, WHITE));
    const tj = al('HORIZONTAL', 'TJ');
    tj.primaryAxisAlignItems = 'CENTER';
    tj.counterAxisAlignItems = 'CENTER';
    tj.paddingLeft = tj.paddingRight = 10;
    tj.cornerRadius = 6;
    tj.fills = [TRANSPARENT];
    tj.resize(177, 40);
    tj.layoutSizingHorizontal = 'FIXED';
    tj.layoutSizingVertical = 'FIXED';
    tj.appendChild(txt('TJ', outfit('Bold'), 13, INK));
    lang.appendChild(ru);
    lang.appendChild(tj);
    menu.appendChild(lang);
    for (const [group, items] of [
      ['Обучение', ['Главная', 'Курсы', 'Мой путь']],
      ['Практика', ['Тренировочный зал']],
      ['Сообщество', ['Рейтинг']],
    ]) {
      const g = al('VERTICAL', group);
      g.itemSpacing = 4;
      g.appendChild(txt(group, outfit('Bold'), 11, MUTED));
      for (const item of items) g.appendChild(txt(item, outfit('SemiBold'), 15, INK));
      menu.appendChild(g);
    }
    const auth = al('VERTICAL', 'drawer auth');
    auth.itemSpacing = 8;
    auth.paddingTop = 12;
    if (guest) {
      auth.appendChild(instPrimary('Регистрация'));
      auth.appendChild(secondaryBtn('Вход'));
    } else {
      auth.appendChild(txt('Кабинет · 0 XP', outfit('SemiBold'), 15, INK));
      const logout = al('HORIZONTAL', 'Выйти');
      logout.appendChild(txt('Выйти', outfit('SemiBold'), 15, SIGNAL));
      auth.appendChild(logout);
    }
    menu.appendChild(auth);
    frame.appendChild(menu);
    frame.appendChild(bottomNav390(''));
    return frame;
  }
  const mobileNavGuest = mobileNavOpen('Mobile nav open guest 390', true);
  const mobileNavAuthed = mobileNavOpen('Mobile nav open authed 390', false);
  const mobilePath = mobileFrame(
    'Mobile Path 390',
    [
      txt('МОЙ ПУТЬ РАЗВИТИЯ', outfit('Bold'), 11, BRAND800),
      txt('Developer Growth Path', fraunces('Bold'), 28, INK, 358),
      txt('От первого ноутбука до инструментов профи: файлы → печать и hotkeys → VS Code и дальше. Курсы те же — путь понятнее.', outfit('Regular'), 13, MUTED, 358),
      txt('ТЕКУЩИЙ УРОВЕНЬ', outfit('Bold'), 10, MUTED),
      txt('Novice Operator', fraunces('SemiBold'), 18, INK),
      txt('0/20 курсов', outfit('SemiBold'), 16, INK),
      txt('First Laptop', fraunces('SemiBold'), 16, INK),
      instPath('Status=Start') || pathNode('Start', 'Начать', false),
    ],
    'Мой путь',
    { authed: true },
  );
  const mobileTraining = mobileFrame(
    'Mobile Training 390',
    [
      txt('Тренировка горячих клавиш', outfit('SemiBold'), 20, INK, 358),
      txt('Задание 1 из 13', outfit('Regular'), 13, MUTED),
      instProgress('Value=Partial') || progressBar(358, 0.08, BRAND, 6),
      txt('Серия: 0  ·  Верно: 0', outfit('SemiBold'), 13, MUTED),
      (() => {
        const card = al('VERTICAL', 'train card');
        card.itemSpacing = 12;
        card.paddingTop = card.paddingBottom = 20;
        card.paddingLeft = card.paddingRight = 16;
        card.cornerRadius = 24;
        card.fills = [solid(WHITE)];
        card.strokes = [solid(BRAND, 0.18)];
        card.resize(358, 10);
        card.layoutSizingHorizontal = 'FIXED';
        card.layoutSizingVertical = 'HUG';
        card.appendChild(txt('Отменить', outfit('SemiBold'), 18, INK));
        const demo = al('VERTICAL', 'Учебное поле');
        demo.itemSpacing = 8;
        demo.paddingTop = demo.paddingBottom = 12;
        demo.paddingLeft = demo.paddingRight = 12;
        demo.cornerRadius = 16;
        demo.fills = [solid({ r: 0.941, g: 0.945, b: 0.953 })];
        demo.appendChild(txt('Учебное поле', outfit('Bold'), 11, MUTED));
        demo.appendChild(txt('Выделенный текст для тренировки', outfit('Regular'), 13, INK, 310));
        card.appendChild(demo);
        const qRow = al('HORIZONTAL', 'prompt');
        qRow.itemSpacing = 8;
        qRow.primaryAxisAlignItems = 'CENTER';
        qRow.appendChild(txt('?', outfit('Bold'), 22, INK));
        qRow.appendChild(txt('+', outfit('Regular'), 16, MUTED));
        qRow.appendChild(txt('?', outfit('Bold'), 22, INK));
        card.appendChild(qRow);
        card.appendChild(txt('Нажмите сочетание на клавиатуре', outfit('Regular'), 12, MUTED, 310));
        const btns = al('HORIZONTAL', 'actions');
        btns.itemSpacing = 8;
        btns.appendChild(instSecondary('Подсказка'));
        btns.appendChild(ghostBtn('Объяснение'));
        card.appendChild(btns);
        card.appendChild(txt('Пропустить', outfit('SemiBold'), 13, MUTED));
        return card;
      })(),
    ],
    'Практика',
    { chips: 'Hotkeys', authed: true },
  );
  const gate = mobileFrame(
    'Keyboard gate',
    [
      (() => {
        const chrome = al('VERTICAL', 'exam run chrome');
        chrome.itemSpacing = 8;
        const top = al('HORIZONTAL', 'exam top');
        top.primaryAxisAlignItems = 'SPACE_BETWEEN';
        top.counterAxisAlignItems = 'CENTER';
        top.resize(358, 10);
        top.layoutSizingHorizontal = 'FIXED';
        top.layoutSizingVertical = 'HUG';
        top.appendChild(txt('Экзамен · 1/20', outfit('Medium'), 13, MUTED));
        const badge = al('HORIZONTAL', 'ВСЕ КУРСЫ');
        badge.paddingLeft = badge.paddingRight = 10;
        badge.paddingTop = badge.paddingBottom = 4;
        badge.cornerRadius = 99;
        badge.fills = [solid({ r: 0.941, g: 0.945, b: 0.953 })];
        badge.appendChild(txt('ВСЕ КУРСЫ', outfit('Bold'), 10, INK));
        top.appendChild(badge);
        top.appendChild(txt('10:00', outfit('Bold'), 13, INK));
        chrome.appendChild(top);
        chrome.appendChild(instProgress('Value=Empty') || progressBar(358, 0, BRAND, 4));
        const stats = al('HORIZONTAL', 'exam stats');
        stats.primaryAxisAlignItems = 'SPACE_BETWEEN';
        stats.counterAxisAlignItems = 'CENTER';
        stats.resize(358, 10);
        stats.layoutSizingHorizontal = 'FIXED';
        stats.layoutSizingVertical = 'HUG';
        stats.appendChild(txt('0  ·  0', outfit('SemiBold'), 13, MUTED));
        stats.appendChild(txt('Завершить', outfit('SemiBold'), 13, BRAND800));
        chrome.appendChild(stats);
        return chrome;
      })(),
      (() => {
        const gcard = al('VERTICAL', 'Keyboard gate card');
        gcard.itemSpacing = 12;
        gcard.primaryAxisAlignItems = 'CENTER';
        gcard.paddingTop = gcard.paddingBottom = 24;
        gcard.paddingLeft = gcard.paddingRight = 16;
        gcard.cornerRadius = 24;
        gcard.fills = [solid(WHITE)];
        gcard.resize(358, 10);
        gcard.layoutSizingHorizontal = 'FIXED';
        gcard.layoutSizingVertical = 'HUG';
        gcard.appendChild(keyboardIllustration());
        gcard.appendChild(txt('Практика требует физической клавиатуры', outfit('SemiBold'), 22, INK, 326));
        gcard.appendChild(
          txt(
            'Для тренировки необходимо использовать компьютер или подключить Bluetooth-клавиатуру к телефону.',
            outfit('Regular'),
            13,
            MUTED,
            326,
          ),
        );
        gcard.appendChild(
          txt(
            'Нажмите любую клавишу на внешней клавиатуре — практика включится автоматически.',
            outfit('Regular'),
            11,
            MUTED,
            326,
          ),
        );
        const gctas = al('VERTICAL', 'gate CTAs');
        gctas.itemSpacing = 10;
        gctas.layoutSizingHorizontal = 'FILL';
        gctas.appendChild(instPrimary('Изучить комбинации'));
        gctas.appendChild(secondaryBtn('Основы hotkeys'));
        gcard.appendChild(gctas);
        gctas.layoutSizingHorizontal = 'FILL';
        return gcard;
      })(),
    ],
    'Практика',
    { chips: 'Экзамен', authed: true },
  );
  const mobileReview = mobileFrame(
    'Mobile Review 390',
    [
      txt('Повторение', fraunces('Bold'), 28, INK, 358),
      txt('Выберите курс. На карточке видно, для какой программы сочетание.', outfit('Regular'), 13, MUTED, 358),
      field('КУРС', 'Основные горячие клавиши программиста', INK),
      txt('1 / 19', outfit('SemiBold'), 13, MUTED),
      (() => {
        const card = al('VERTICAL', 'mobile review face');
        card.itemSpacing = 12;
        card.paddingTop = card.paddingBottom = 28;
        card.paddingLeft = card.paddingRight = 16;
        card.cornerRadius = 24;
        card.fills = [solid(WHITE)];
        card.resize(358, 10);
        card.layoutSizingHorizontal = 'FIXED';
        card.layoutSizingVertical = 'HUG';
        card.primaryAxisAlignItems = 'CENTER';
        card.appendChild(txt('ОСНОВНЫЕ ГОРЯЧИЕ КЛАВИШИ ПРОГРАММИСТА', outfit('Bold'), 11, BRAND800));
        const cap = instKeyCap('PrtSc');
        if (cap) card.appendChild(cap);
        else {
          const box = al('HORIZONTAL', 'PrtSc');
          box.paddingLeft = box.paddingRight = 14;
          box.paddingTop = box.paddingBottom = 10;
          box.cornerRadius = 12;
          box.fills = [solid(WHITE)];
          box.strokes = [solid(BRAND)];
          box.appendChild(txt('PrtSc', outfit('SemiBold'), 14, INK));
          card.appendChild(box);
        }
        card.appendChild(txt('Скриншот', outfit('SemiBold'), 22, INK));
        card.appendChild(txt('Нажмите карточку — подробное объяснение на обороте', outfit('Regular'), 12, MUTED, 310));
        card.appendChild(instSecondary('Объяснение'));
        return card;
      })(),
    ],
    'Практика',
    { chips: 'Повторение', authed: true },
  );
  const mobileQuiz = mobileFrame(
    'Mobile Quiz 390',
    [
      txt('ОСНОВЫ HOTKEYS', outfit('Bold'), 11, BRAND800),
      txt('Основы hotkeys', fraunces('Bold'), 24, INK, 358),
      txt('25 вопросов о горячих клавишах: копирование, навигация, окна и практика.', outfit('Regular'), 13, MUTED, 358),
      quizStats('1/25', '0', '0', true),
      (() => {
        const card = al('VERTICAL', 'mobile question');
        card.itemSpacing = 10;
        card.paddingTop = card.paddingBottom = 20;
        card.paddingLeft = card.paddingRight = 16;
        card.cornerRadius = 24;
        card.fills = [solid(WHITE)];
        card.resize(358, 10);
        card.layoutSizingHorizontal = 'FIXED';
        card.layoutSizingVertical = 'HUG';
        const qHead = al('HORIZONTAL', 'q head');
        qHead.itemSpacing = 8;
        qHead.counterAxisAlignItems = 'CENTER';
        qHead.appendChild(txt('Вопрос 1', outfit('SemiBold'), 14, INK));
        qHead.appendChild(pill('базовый', BRAND50, BRAND800));
        card.appendChild(qHead);
        card.appendChild(txt(quizQ, outfit('SemiBold'), 15, INK, 326));
        for (const opt of quizOpts) card.appendChild(quizOption(opt, 'idle'));
        return card;
      })(),
    ],
    'Практика',
    { chips: 'Основы hotkeys', authed: true },
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
  const darkDashHead = al('HORIZONTAL', 'dark header');
  darkDashHead.primaryAxisAlignItems = 'SPACE_BETWEEN';
  darkDashHead.counterAxisAlignItems = 'CENTER';
  darkDashHead.resize(880, 10);
  darkDashHead.layoutSizingHorizontal = 'FIXED';
  darkDashHead.layoutSizingVertical = 'HUG';
  const darkDashTitles = al('VERTICAL', 'dark titles');
  darkDashTitles.itemSpacing = 4;
  darkDashTitles.appendChild(txt('Привет, Анна!', fraunces('Bold'), 28, DARK_TEXT));
  darkDashTitles.appendChild(txt('Личный кабинет KeyMaster', outfit('Regular'), 14, DARK_MUTED));
  darkDashHead.appendChild(darkDashTitles);
  darkDashHead.appendChild(secondaryBtn('Мой путь развития', 'dark'));
  darkDash.appendChild(darkDashHead);
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
  const darkStageStrip = al('HORIZONTAL', 'Dark PathStageStrip');
  darkStageStrip.itemSpacing = 12;
  for (const [num, title, status, locked] of [
    ['01', 'Первый ноутбук: файлы и папки', 'НАЧАТЬ', false],
    ['02', 'Основные горячие клавиши программиста', 'ЗАБЛОКИРОВАНО', true],
    ['03', 'Windows', 'ЗАБЛОКИРОВАНО', true],
    ['04', 'VS Code', 'ЗАБЛОКИРОВАНО', true],
  ]) {
    const c = al('VERTICAL', 'dark ' + title);
    c.itemSpacing = 6;
    c.paddingTop = c.paddingBottom = 14;
    c.paddingLeft = c.paddingRight = 14;
    c.cornerRadius = 16;
    c.fills = [solid(DARK_CARD)];
    c.strokes = [solid(locked ? WHITE : BRAND, locked ? 0.12 : 0.4)];
    c.opacity = locked ? 0.7 : 1;
    c.resize(210, 10);
    c.layoutSizingHorizontal = 'FIXED';
    c.layoutSizingVertical = 'HUG';
    const top = al('HORIZONTAL', 'dark stage top');
    top.primaryAxisAlignItems = 'SPACE_BETWEEN';
    top.counterAxisAlignItems = 'CENTER';
    top.appendChild(txt(num, outfit('Bold'), 11, DARK_MUTED));
    top.appendChild(txt(status, outfit('Bold'), 9, locked ? DARK_MUTED : BRAND500));
    c.appendChild(top);
    top.layoutSizingHorizontal = 'FILL';
    c.appendChild(txt(title, outfit('SemiBold'), 12, DARK_TEXT, 182));
    darkStageStrip.appendChild(c);
  }
  darkDash.appendChild(darkStageStrip);
  const darkTiles = al('HORIZONTAL', 'Dark stat tiles');
  darkTiles.itemSpacing = 12;
  const darkLevel = al('VERTICAL', 'Уровень dark');
  darkLevel.itemSpacing = 8;
  darkLevel.paddingTop = darkLevel.paddingBottom = 16;
  darkLevel.paddingLeft = darkLevel.paddingRight = 16;
  darkLevel.cornerRadius = 16;
  darkLevel.fills = [solid(DARK_CARD)];
  darkLevel.resize(280, 10);
  darkLevel.layoutSizingHorizontal = 'FIXED';
  darkLevel.layoutSizingVertical = 'HUG';
  darkLevel.appendChild(txt('УРОВЕНЬ', outfit('SemiBold'), 11, DARK_MUTED));
  darkLevel.appendChild(txt('Новичок', outfit('SemiBold'), 22, DARK_TEXT));
  darkLevel.appendChild(instProgress('Value=Empty') || progressBar(240, 0.02, BRAND, 8));
  darkTiles.appendChild(darkLevel);
  for (const [k, v] of [
    ['XP', '0'],
    ['ЕЖЕДНЕВНАЯ СЕРИЯ', '1 дн.'],
  ]) {
    const t = al('VERTICAL', k + ' dark');
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
  const darkDaily = al('VERTICAL', 'Dark Daily');
  darkDaily.itemSpacing = 8;
  darkDaily.paddingTop = darkDaily.paddingBottom = 16;
  darkDaily.paddingLeft = darkDaily.paddingRight = 16;
  darkDaily.cornerRadius = 24;
  darkDaily.fills = [solid(DARK_CARD)];
  darkDaily.resize(420, 10);
  darkDaily.layoutSizingHorizontal = 'FIXED';
  darkDaily.layoutSizingVertical = 'HUG';
  darkDaily.appendChild(txt('Ежедневные задания', outfit('SemiBold'), 16, DARK_TEXT));
  for (const [title, prog] of [
    ['Получить XP', '0/200'],
    ['Закончить урок', '0/1'],
    ['Выучить новые комбинации', '0/10'],
    ['Пройти тренировку', '0/1'],
  ]) {
    const row = al('HORIZONTAL', title + ' dark');
    row.primaryAxisAlignItems = 'SPACE_BETWEEN';
    row.paddingTop = row.paddingBottom = 10;
    row.paddingLeft = row.paddingRight = 12;
    row.cornerRadius = 12;
    row.strokes = [solid(WHITE, 0.1)];
    row.resize(388, 10);
    row.layoutSizingHorizontal = 'FIXED';
    row.layoutSizingVertical = 'HUG';
    row.appendChild(txt(title, outfit('Regular'), 13, DARK_MUTED, 260));
    row.appendChild(txt(prog, outfit('SemiBold'), 13, DARK_MUTED));
    darkDaily.appendChild(row);
  }
  const darkAchCard = al('VERTICAL', 'Dark recent achievements');
  darkAchCard.itemSpacing = 8;
  darkAchCard.paddingTop = darkAchCard.paddingBottom = 16;
  darkAchCard.paddingLeft = darkAchCard.paddingRight = 16;
  darkAchCard.cornerRadius = 24;
  darkAchCard.fills = [solid(DARK_CARD)];
  darkAchCard.resize(420, 10);
  darkAchCard.layoutSizingHorizontal = 'FIXED';
  darkAchCard.layoutSizingVertical = 'HUG';
  darkAchCard.appendChild(txt('Последние достижения', outfit('SemiBold'), 16, DARK_TEXT));
  darkAchCard.appendChild(
    instEmpty(
      'Пройдите первый урок, чтобы открыть достижения',
      'Учитесь и тренируйтесь — бейджи откроются автоматически.',
    ) || txt('Пройдите первый урок, чтобы открыть достижения', outfit('Regular'), 13, DARK_MUTED, 380),
  );
  const darkDashCols = al('HORIZONTAL', 'dark dash cols');
  darkDashCols.itemSpacing = 12;
  darkDashCols.appendChild(darkDaily);
  darkDashCols.appendChild(darkAchCard);
  darkDash.appendChild(darkDashCols);

  const darkPathStats = al('HORIZONTAL', 'Dark Path stats');
  darkPathStats.itemSpacing = 12;
  darkPathStats.resize(880, 10);
  darkPathStats.layoutSizingHorizontal = 'FIXED';
  darkPathStats.layoutSizingVertical = 'HUG';
  for (const [label, value, accent] of [
    ['ТЕКУЩИЙ УРОВЕНЬ', 'Novice Operator', false],
    ['ВСЕГО XP', '0', false],
    ['ПРОЙДЕНО', '0/20 курсов', false],
    ['СЛЕДУЮЩИЙ ЭТАП', 'First Laptop', true],
  ]) {
    const c = al('VERTICAL', 'dark ' + label);
    c.itemSpacing = 6;
    c.paddingTop = c.paddingBottom = 16;
    c.paddingLeft = c.paddingRight = 16;
    c.cornerRadius = 24;
    c.fills = [solid(DARK_CARD)];
    c.strokes = [solid(accent ? BRAND : WHITE, accent ? 0.4 : 0.1)];
    c.resize(208, 10);
    c.layoutSizingHorizontal = 'FIXED';
    c.layoutSizingVertical = 'HUG';
    c.appendChild(txt(label, outfit('Bold'), 10, accent ? BRAND500 : DARK_MUTED));
    c.appendChild(txt(value, fraunces('Bold'), 20, DARK_TEXT, 176));
    if (accent) c.appendChild(txt('Продолжить →', outfit('SemiBold'), 13, BRAND500));
    darkPathStats.appendChild(c);
  }
  const darkPathStart = al('VERTICAL', 'Dark START node');
  darkPathStart.itemSpacing = 8;
  darkPathStart.primaryAxisAlignItems = 'CENTER';
  darkPathStart.paddingTop = darkPathStart.paddingBottom = 20;
  darkPathStart.paddingLeft = darkPathStart.paddingRight = 24;
  darkPathStart.cornerRadius = 20;
  darkPathStart.fills = [solid(DARK_CARD)];
  darkPathStart.strokes = [solid(BRAND, 0.45)];
  darkPathStart.resize(360, 10);
  darkPathStart.layoutSizingHorizontal = 'FIXED';
  darkPathStart.layoutSizingVertical = 'HUG';
  darkPathStart.appendChild(txt('START', outfit('Bold'), 11, BRAND500));
  darkPathStart.appendChild(txt('Developer Growth Path', fraunces('Bold'), 22, DARK_TEXT));
  darkPathStart.appendChild(txt('От новичка к Keyboard Master', outfit('Regular'), 13, DARK_MUTED));
  const darkPathCourse = al('VERTICAL', 'Dark First Laptop node');
  darkPathCourse.itemSpacing = 10;
  darkPathCourse.paddingTop = darkPathCourse.paddingBottom = 16;
  darkPathCourse.paddingLeft = darkPathCourse.paddingRight = 16;
  darkPathCourse.cornerRadius = 16;
  darkPathCourse.fills = [solid(DARK_CARD)];
  darkPathCourse.strokes = [solid(WHITE, 0.15)];
  darkPathCourse.resize(360, 10);
  darkPathCourse.layoutSizingHorizontal = 'FIXED';
  darkPathCourse.layoutSizingVertical = 'HUG';
  const darkPathCourseRow = al('HORIZONTAL', 'dark course row');
  darkPathCourseRow.itemSpacing = 12;
  darkPathCourseRow.counterAxisAlignItems = 'MIN';
  const darkPathIcon = figma.createRectangle();
  darkPathIcon.name = 'CourseBrandIcon';
  darkPathIcon.resize(42, 42);
  darkPathIcon.cornerRadius = 12;
  darkPathCourseRow.appendChild(darkPathIcon);
  darkPathIcon.fills = [solid({ r: 0.96, g: 0.55, b: 0.2 })];
  const darkPathCourseCol = al('VERTICAL', 'dark course copy');
  darkPathCourseCol.itemSpacing = 6;
  const darkStartChip = al('HORIZONTAL', 'НАЧАТЬ');
  darkStartChip.paddingLeft = darkStartChip.paddingRight = 8;
  darkStartChip.paddingTop = darkStartChip.paddingBottom = 2;
  darkStartChip.cornerRadius = 6;
  darkStartChip.fills = [solid(WHITE)];
  darkStartChip.appendChild(txt('НАЧАТЬ', outfit('Bold'), 9, INK));
  const darkPathHead = al('HORIZONTAL', 'dark course head');
  darkPathHead.itemSpacing = 8;
  darkPathHead.counterAxisAlignItems = 'CENTER';
  darkPathHead.appendChild(darkStartChip);
  darkPathHead.appendChild(txt('NOVICE · L1', outfit('Bold'), 10, DARK_MUTED));
  darkPathCourseCol.appendChild(darkPathHead);
  darkPathCourseCol.appendChild(txt('First Laptop', fraunces('SemiBold'), 18, DARK_TEXT));
  darkPathCourseCol.appendChild(txt('Первый ноутбук: файлы и папки', outfit('Regular'), 13, DARK_MUTED, 270));
  darkPathCourseRow.appendChild(darkPathCourseCol);
  darkPathCourse.appendChild(darkPathCourseRow);
  const darkPathMeta = al('HORIZONTAL', 'dark course meta');
  darkPathMeta.itemSpacing = 8;
  for (const [k, v] of [
    ['Уроки', '0/16'],
    ['XP курса', '0/240'],
    ['Прогресс', '0%'],
  ]) {
    const m = al('VERTICAL', 'dark ' + k);
    m.itemSpacing = 2;
    m.primaryAxisAlignItems = 'CENTER';
    m.paddingTop = m.paddingBottom = 8;
    m.paddingLeft = m.paddingRight = 8;
    m.cornerRadius = 8;
    m.fills = [solid(DARK_ELEVATED)];
    m.resize(104, 10);
    m.layoutSizingHorizontal = 'FIXED';
    m.layoutSizingVertical = 'HUG';
    m.appendChild(txt(k, outfit('Regular'), 10, DARK_MUTED));
    m.appendChild(txt(v, outfit('SemiBold'), 12, DARK_TEXT));
    darkPathMeta.appendChild(m);
  }
  darkPathCourse.appendChild(darkPathMeta);
  darkPathCourse.appendChild(instProgress('Value=Empty') || progressBar(320, 0, BRAND, 8));
  const darkPathOpen = al('HORIZONTAL', 'dark open course');
  darkPathOpen.primaryAxisAlignItems = 'SPACE_BETWEEN';
  darkPathOpen.counterAxisAlignItems = 'CENTER';
  darkPathOpen.appendChild(txt('Открыть курс', outfit('SemiBold'), 13, BRAND500));
  darkPathOpen.appendChild(txt('↗', outfit('SemiBold'), 14, BRAND500));
  darkPathCourse.appendChild(darkPathOpen);
  darkPathOpen.layoutSizingHorizontal = 'FILL';

  const darkPathRow = al('HORIZONTAL', 'Dark Path nodes');
  darkPathRow.itemSpacing = 12;
  darkPathRow.appendChild(instPath('Status=Start') || pathNode('Start', 'Начать', false));
  darkPathRow.appendChild(instPath('Status=Locked') || pathNode('Shortcut Legend', 'Заблокировано', true));

  board.appendChild(section('ImmersiveSimulator', [sim, simPalette, simQuick, simTerm, simFind, simSearch, simScm, simRun, simExt, simFileMenu, simViewMenu, simEditMenu, simGoMenu, simRunMenu, simTermMenu, simHelpMenu, simTask, simTaskRun, simTaskList, simPreview, simKbViz, simManage, simLight, simToast, simNewFile, simHint, desk, deskMenu, deskExplorer, deskTrash, deskStart, deskEditor, deskKeyboard, deskFileMenu, deskProps, deskLight, deskDone, deskToast, deskFromLesson]));
  board.appendChild(
    section('Dark · html.dark (same layouts, semantic tokens)', [
      marketingPage('Dark Home / html.dark', 'Главная', false, [darkHero, darkFeats], true),
      marketingPage('Dark Login / html.dark', '', false, [darkLoginCard], true),
      marketingPage('Dark Register / html.dark', '', false, [darkRegisterCard], true),
      marketingPage('Dark Courses / html.dark', 'Курсы', false, [
        (() => {
          const head = al('HORIZONTAL', 'catalog head');
          head.primaryAxisAlignItems = 'SPACE_BETWEEN';
          head.counterAxisAlignItems = 'MAX';
          head.resize(880, 10);
          head.layoutSizingHorizontal = 'FIXED';
          head.layoutSizingVertical = 'HUG';
          const titles = al('VERTICAL', 'titles');
          titles.itemSpacing = 6;
          titles.appendChild(txt('КАТАЛОГ', outfit('Bold'), 11, BRAND500));
          titles.appendChild(txt('Каталог курсов', fraunces('Bold'), 32, DARK_TEXT));
          titles.appendChild(txt('Выберите инструмент и изучайте сочетания. Прогресс сохраняется и отображается на карте пути.', outfit('Regular'), 13, DARK_MUTED, 640));
          head.appendChild(titles);
          head.appendChild(secondaryBtn('Путь обучения', 'dark'));
          return head;
        })(),
        searchField(880, 'dark'),
        darkFilterRow,
        txt('0 XP live catalog · 3 of 20. СТАРТ on computer-basics + programmer-basics; VS Code has no badge.', outfit('Regular'), 12, DARK_MUTED, 860),
        darkCoursesRow,
      ], true),
      practicePage(
        'Dark Practice / html.dark',
        'Тренировочный зал',
        [
          txt('ПРАКТИКА', outfit('Bold'), 11, BRAND500),
          txt('Тренировочный зал', fraunces('Bold'), 32, DARK_TEXT),
          txt('Один вход — все режимы. Сначала навыки (печать и файлы), затем закрепление из курсов. Идите по рекомендуемому маршруту.', outfit('Regular'), 13, DARK_MUTED, 680),
          (() => {
            const card = al('VERTICAL', 'Dark Journey');
            card.itemSpacing = 8;
            card.paddingTop = card.paddingBottom = 20;
            card.paddingLeft = card.paddingRight = 20;
            card.cornerRadius = 24;
            card.fills = [solid(DARK_CARD)];
            card.strokes = [solid(BRAND, 0.35)];
            card.appendChild(txt('С ЧЕГО НАЧАТЬ СЕГОДНЯ', outfit('Bold'), 11, BRAND500));
            card.appendChild(txt('Рекомендуемый маршрут', fraunces('SemiBold'), 20, DARK_TEXT));
            card.appendChild(txt('Сначала печать и файлы, потом курс. Скорость — когда база уже есть.', outfit('Regular'), 13, DARK_MUTED, 640));
            for (const step of [
              '1. Слепая печать — уверенность в пальцах',
              '2. Симулятор — папки и файлы без страха',
              '3. Курс «Первый ноутбук» — закрепить знания',
              '4. Hotkeys и путь разработчика — дальше по карте',
            ]) {
              card.appendChild(txt(step, outfit('Regular'), 13, DARK_MUTED, 640));
            }
            card.appendChild(instPrimary('Открыть «Первый ноутбук»'));
            return card;
          })(),
          txt('Навыки', outfit('SemiBold'), 16, DARK_TEXT),
          modeCard('Слепая печать', 'СТАРТ', 'neutral', 'Ряды клавиш, слова и фразы. WPM, точность и подсветка следующей клавиши.', 328, true),
          modeCard('Рабочий стол', 'СТАРТ', 'neutral', 'Проводник, папки и файлы без страха — как на настоящем столе.', 328, true),
        ],
        true,
      ),
      marketingPage('Dark Path / html.dark', 'Мой путь', false, [
        txt('МОЙ ПУТЬ РАЗВИТИЯ', outfit('Bold'), 11, BRAND500),
        txt('Developer Growth Path', fraunces('Bold'), 32, DARK_TEXT),
        txt('От первого ноутбука до инструментов профи: файлы → печать и hotkeys → VS Code и дальше. Курсы те же — путь понятнее.', outfit('Regular'), 13, DARK_MUTED, 800),
        darkPathStats,
        pathTimeline([darkPathStart, darkPathCourse], true),
        pathCtas(true),
        txt('Не дублировать каждый узел курса — 5 статусов покрывают остальную карту.', outfit('Regular'), 12, DARK_MUTED, 800),
        darkPathRow,
      ], true),
      marketingPage('Dark Dashboard / html.dark', '', false, [darkDash], true),
    ]),
  );
  board.appendChild(
    section('Mobile 390 · BottomNav', [
      mobile,
      mobileHomeAuthed,
      mobileLeaderboard,
      mobileLeaderboardAuthed,
      mobileLeaderboardPeriodEmpty,
      mobileDashboard,
      mobileCourses,
      mobileCoursesAuthed,
      mobileCourseBasics,
      mobileLogin,
      mobileRegister,
      mobilePractice,
      mobileNavGuest,
      mobileNavAuthed,
      mobilePath,
      mobileReview,
      mobileQuiz,
      mobileTraining,
      gate,
      txt('BottomNav hidden on /login and /register. PracticeKeyboardGate when no physical keyboard. Practice rail becomes compact chips < lg. Hamburger opens km-mobile-nav (guest: Регистрация/Вход; authed: Кабинет · 0 XP).', outfit('Regular'), 12, MUTED, 390),
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
