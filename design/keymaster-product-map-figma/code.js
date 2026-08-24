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
const TRANSPARENT = { type: 'SOLID', color: WHITE, opacity: 0 };

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
  if (page.findOne((n) => n.type === 'COMPONENT_SET' && n.name === 'Button')) return;

  const primary = [
    makeBtn('Variant=Primary, State=Default, Size=MD', BRAND, WHITE, 1, 'Продолжить', 20, 10, 14),
    makeBtn('Variant=Primary, State=Hover, Size=MD', BRAND500, WHITE, 1, 'Продолжить', 20, 10, 14),
    makeBtn('Variant=Primary, State=Active, Size=MD', BRAND500, WHITE, 1, 'Продолжить', 20, 10, 14),
    makeBtn('Variant=Primary, State=Disabled, Size=MD', BRAND, WHITE, 0.55, 'Продолжить', 20, 10, 14),
    makeBtn('Variant=Primary, State=Loading, Size=MD', BRAND, WHITE, 0.85, 'Продолжить', 20, 10, 14),
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
  buttonSet.description = 'KeyMaster .btn-primary — frontend/src/shared/components/ui.tsx';

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
  ];
  navs[1].fills = [solid(INK, 0.06)];
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
  const { w, h } = jpegSizeFromBytes(bytes);
  let fw = w;
  let fh = h;
  if (msg.page === '07 — Mobile Screens' && fw > 390) {
    const scale = 390 / fw;
    fw = 390;
    fh = Math.round(h * scale);
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
    ]],
    ['F8 Reinforce', [
      ['desktop-learner-14-review.jpg', 'Review'],
      ['desktop-learner-15-quiz.jpg', 'Quiz'],
      ['desktop-learner-16-exam.jpg', 'Exam setup'],
      ['desktop-learner-exam-run.jpg', 'Exam run'],
      ['desktop-learner-exam-done.jpg', 'Exam done'],
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
  await buildFlows();
  await buildDesignSystemBoard();
  await buildComponents();
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
