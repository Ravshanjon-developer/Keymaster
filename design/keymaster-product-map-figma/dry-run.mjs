/**
 * Dry-run the product-map plugin against a Plugin API stub.
 * Proves pages 01–07, tokens, components, and screenshot slots are created.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
let id = 1;
const nid = () => String(id++);

function node(type, extra = {}) {
  const n = {
    id: nid(),
    type,
    name: extra.name || type,
    children: [],
    x: 0,
    y: 0,
    fills: [],
    strokes: [],
    effects: [],
    findOne(fn) {
      if (fn(n)) return n;
      for (const c of n.children) {
        const hit = c.findOne ? c.findOne(fn) : fn(c) ? c : null;
        if (hit) return hit;
      }
      return null;
    },
    appendChild(child) {
      if (child.parent && Array.isArray(child.parent.children)) {
        const i = child.parent.children.indexOf(child);
        if (i >= 0) child.parent.children.splice(i, 1);
      }
      n.children.push(child);
      child.parent = n;
    },
    remove() {
      if (n.parent && Array.isArray(n.parent.children)) {
        const i = n.parent.children.indexOf(n);
        if (i >= 0) n.parent.children.splice(i, 1);
      }
      n.parent = null;
    },
    clone() {
      const c = node(n.type, { name: n.name });
      Object.assign(c, {
        fills: JSON.parse(JSON.stringify(n.fills || [])),
        strokes: JSON.parse(JSON.stringify(n.strokes || [])),
        characters: n.characters,
        fontName: n.fontName,
        fontSize: n.fontSize,
        layoutMode: n.layoutMode,
        paddingTop: n.paddingTop,
        paddingBottom: n.paddingBottom,
        paddingLeft: n.paddingLeft,
        paddingRight: n.paddingRight,
        itemSpacing: n.itemSpacing,
        cornerRadius: n.cornerRadius,
      });
      for (const child of n.children) c.appendChild(child.clone());
      return c;
    },
    resize() {},
  };
  return Object.assign(n, extra);
}

const pages = [node('PAGE', { name: 'Page 1' })];
let currentPage = pages[0];
const collections = [];
const variables = [];
const textStyles = [];
const effectStyles = [];
const uiHandlers = { onmessage: null, posts: [] };

const figma = {
  root: { children: pages },
  currentPage,
  listAvailableFontsAsync: async () => [
    { fontName: { family: 'Outfit', style: 'Regular' } },
    { fontName: { family: 'Outfit', style: 'Medium' } },
    { fontName: { family: 'Outfit', style: 'SemiBold' } },
    { fontName: { family: 'Outfit', style: 'Bold' } },
    { fontName: { family: 'Fraunces', style: 'Medium' } },
    { fontName: { family: 'Fraunces', style: 'SemiBold' } },
    { fontName: { family: 'Fraunces', style: 'Bold' } },
    { fontName: { family: 'Inter', style: 'Regular' } },
    { fontName: { family: 'Inter', style: 'Medium' } },
    { fontName: { family: 'Inter', style: 'Semi Bold' } },
    { fontName: { family: 'Inter', style: 'Bold' } },
  ],
  loadFontAsync: async () => {},
  setCurrentPageAsync: async (p) => {
    currentPage = p;
    figma.currentPage = p;
  },
  createPage() {
    const p = node('PAGE', { name: 'Page' });
    pages.push(p);
    return p;
  },
  createText: () => node('TEXT'),
  createFrame: () => node('FRAME'),
  createRectangle: () => node('RECTANGLE'),
  createEllipse: () => node('ELLIPSE'),
  createAutoLayout: (dir) => {
    const f = node('FRAME');
    f.layoutMode = dir || 'HORIZONTAL';
    return f;
  },
  createComponent: () => {
    const n = node('COMPONENT');
    n.createInstance = function createInstance() {
      const inst = node('INSTANCE', { name: n.name });
      for (const child of n.children) inst.appendChild(child.clone());
      return inst;
    };
    currentPage.appendChild(n);
    return n;
  },
  createTextStyle: () => {
    const s = { id: nid(), name: '', description: '' };
    textStyles.push(s);
    return s;
  },
  createEffectStyle: () => {
    const s = { id: nid(), name: '', effects: [] };
    effectStyles.push(s);
    return s;
  },
  getLocalTextStylesAsync: async () => textStyles,
  getLocalEffectStylesAsync: async () => effectStyles,
  combineAsVariants(variants, parent) {
    const set = node('COMPONENT_SET', { name: 'Set' });
    for (const v of variants) set.appendChild(v);
    parent.appendChild(set);
    return set;
  },
  base64Decode: (b64) => Buffer.from(b64, 'base64'),
  createImage: () => ({ hash: nid() }),
  showUI() {},
  closePlugin(msg) {
    figma._closed = msg;
  },
  ui: {
    postMessage(msg) {
      uiHandlers.posts.push(msg);
    },
    set onmessage(fn) {
      uiHandlers.onmessage = fn;
    },
    get onmessage() {
      return uiHandlers.onmessage;
    },
  },
  variables: {
    getLocalVariableCollectionsAsync: async () => collections,
    getLocalVariablesAsync: async () => variables,
    createVariableCollection(name) {
      const coll = {
        id: nid(),
        name,
        modes: [{ modeId: nid(), name: 'Mode 1' }],
        variableIds: [],
        renameMode(id, name) {
          const m = coll.modes.find((x) => x.modeId === id);
          if (m) m.name = name;
        },
        addMode(name) {
          const modeId = nid();
          coll.modes.push({ modeId, name });
          return modeId;
        },
      };
      collections.push(coll);
      return coll;
    },
    createVariable(name, coll, type) {
      const v = {
        id: nid(),
        name,
        resolvedType: type,
        scopes: [],
        setValueForMode() {},
        setVariableCodeSyntax() {},
      };
      variables.push(v);
      coll.variableIds.push(v.id);
      return v;
    },
    setBoundVariableForPaint(paint, _field, variable) {
      return { ...paint, boundVariables: { color: { type: 'VARIABLE_ALIAS', id: variable.id } } };
    },
  },
};

const code = fs.readFileSync(path.join(here, 'code.js'), 'utf8');
const context = vm.createContext({
  figma,
  __html__: '',
  console,
  Object,
  Array,
  String,
  Math,
  Error,
  parseInt,
  Uint8Array,
  Buffer,
});
vm.runInContext(code, context);

await new Promise((r) => setTimeout(r, 50));
const ready = uiHandlers.posts.some((p) => p.type === 'ready');
if (!ready) {
  const closed = figma._closed;
  throw new Error('plugin did not reach ready: ' + closed);
}

const shots = JSON.parse(fs.readFileSync(path.join(here, 'shots-manifest.json'), 'utf8'));
const tinyJpeg = Buffer.from(
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wAAAAD/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGdA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8Af//Z',
  'base64',
).toString('base64');

for (const item of shots) {
  await uiHandlers.onmessage({
    type: 'image',
    file: item.file,
    name: item.name,
    page: item.page,
    layout: item.layout,
    group: item.group,
    w: item.page.startsWith('07') ? 390 : 1440,
    h: item.page.startsWith('07') ? 844 : 900,
    b64: tinyJpeg,
  });
}
await uiHandlers.onmessage({ type: 'done' });

const pageNames = pages.map((p) => p.name);
const expected = [
  '01 — Product Map',
  '02 — User Flows',
  '03 — Existing Screens',
  '04 — Design System',
  '05 — Components',
  '06 — Improved Screens',
  '07 — Mobile Screens',
];
const missingPages = expected.filter((n) => !pageNames.includes(n));
const collNames = collections.map((c) => c.name);
const sets = [];
function walk(n) {
  if (n.type === 'COMPONENT_SET') sets.push(n.name);
  for (const c of n.children || []) walk(c);
}
for (const p of pages) walk(p);

const report = {
  pages: pageNames,
  missingPages,
  collections: collNames,
  textStyles: textStyles.map((s) => s.name),
  effectStyles: effectStyles.map((s) => s.name),
  componentSets: sets,
  variables: variables.length,
  closed: figma._closed,
  shotCount: shots.length,
};

const fail = [];
if (missingPages.length) fail.push('missing pages: ' + missingPages.join(', '));
if (!collNames.includes('Color/Primitives')) fail.push('no Color/Primitives');
if (!collNames.includes('Color/Semantic')) fail.push('no Color/Semantic');
if (!sets.includes('Button')) fail.push('no Button set');
if (!sets.includes('Input')) fail.push('no Input set');
if (!sets.includes('CourseCard')) fail.push('no CourseCard set');
if (!sets.includes('PathNode')) fail.push('no PathNode set');
if (!sets.includes('FloatingLabelInput')) fail.push('no FloatingLabelInput set');
if (!sets.includes('LearnStatus')) fail.push('no LearnStatus set');
if (!pageNames.includes('06 — Improved Screens')) fail.push('no page 06');
if (!String(figma._closed || '').includes('KeyMaster')) fail.push('did not close successfully: ' + figma._closed);

const names = [];
function walkNames(n) {
  names.push(n.name);
  if (n.characters) names.push(n.characters);
  for (const c of n.children || []) walkNames(c);
}
for (const p of pages) walkNames(p);
if (!names.includes('IA — unique pages by layout')) fail.push('no IA sitemap');
if (!names.includes('Unique screens — editable as-is')) fail.push('no unique screen recreations');
if (!names.includes('User flows — screens')) fail.push('no visual flows');
if (!names.includes('Leaderboard /leaderboard')) fail.push('no leaderboard unique screen');
if (!names.includes('Exam done /exam')) fail.push('no exam done unique screen');
if (!names.includes('Keyboard gate')) fail.push('no keyboard gate unique screen');
if (!names.includes('Lesson study-only /lessons/:id')) fail.push('no study-only lesson unique screen');
if (!names.includes('Auth callback /auth/callback')) fail.push('no auth callback unique screen');
if (!names.includes('Typing path /typing')) fail.push('no typing path unique screen');
if (!names.includes('Typing progress /typing')) fail.push('no typing progress unique screen');
if (!names.includes('Quiz done /quiz')) fail.push('no quiz done unique screen');
if (!names.includes('Login error /login')) fail.push('no login error unique screen');
if (!names.includes('Register OTP /register')) fail.push('no register OTP unique screen');
if (!names.includes('Exam empty /exam')) fail.push('no exam empty unique screen');
if (!sets.includes('Exam')) fail.push('no Exam set');
if (!sets.includes('Navbar')) fail.push('no Navbar set');
if (!sets.includes('PasswordStrength')) fail.push('no PasswordStrength set');
if (!names.includes('Dark Home / html.dark')) fail.push('no dark home unique screen');
if (!names.includes('Dark Login / html.dark')) fail.push('no dark login unique screen');
if (!names.includes('Dark Courses / html.dark')) fail.push('no dark courses unique screen');
if (!names.includes('Mobile Practice 390')) fail.push('no mobile practice unique screen');
if (!names.includes('Mobile Courses 390')) fail.push('no mobile courses unique screen');
if (!names.includes('Exam wrong /exam')) fail.push('no exam wrong unique screen');
if (!names.includes('Exam correct /exam')) fail.push('no exam correct unique screen');
if (!names.includes('9:59')) fail.push('no live exam-feedback timer unique screen');
if (!names.includes('Начните здесь')) fail.push('no live catalog start-here unique screen');
if (!names.includes('0/16 сочетаний')) fail.push('no live authed catalog progress unique screen');
if (!names.includes('16 уроков · 4 категории')) fail.push('no live catalog lesson-count unique screen');
if (!names.includes('Основные горячие клавиши программиста')) fail.push('no live programmer-basics catalog card unique screen');
if (!names.includes('empty bar')) fail.push('no live stats empty-chart unique screen');
if (!names.includes('chart y-axis')) fail.push('no live stats chart y-axis unique screen');
if (!names.includes('AuthCard compact')) fail.push('no compact AuthCard (register)');
if (!names.includes('Speed done /speed')) fail.push('no speed done unique screen');
if (!names.includes('Admin courses /admin')) fail.push('no admin courses unique screen');
if (!names.includes('Admin users /admin')) fail.push('no admin users unique screen');
if (!names.includes('Admin achievements /admin')) fail.push('no admin achievements unique screen');
if (!names.includes('Админ')) fail.push('no admin navbar link on unique screens');
if (!names.includes('Dark Register / html.dark')) fail.push('no dark register unique screen');
if (!names.includes('Dark Practice / html.dark')) fail.push('no dark practice unique screen');
if (!names.includes('Dark Path / html.dark')) fail.push('no dark path unique screen');
if (!names.includes('Dark Dashboard / html.dark')) fail.push('no dark dashboard unique screen');
if (!names.includes('Speed challenge')) fail.push('no practice speed challenge row');
if (!names.includes('HomeFeatureVisual / path')) fail.push('no home path feature visual');
if (!names.includes('HomeFeatureVisual / keyboard')) fail.push('no home keyboard feature visual');
if (!names.includes('HomeFeatureVisual / exam')) fail.push('no home exam feature visual');
if (!names.includes('Sun')) fail.push('no light-mode Sun theme toggle');
if (!names.includes('Moon')) fail.push('no dark-mode Moon theme toggle');
if (!names.includes('EyeOff')) fail.push('no password EyeOff on FloatingLabelInput');
if (!names.includes('Button instance')) fail.push('no Button instances on unique screens');
if (!names.includes('KeyCap instance')) fail.push('no KeyCap instances on unique screens');
if (!names.includes('OtpDigit instance')) fail.push('no OTP instances on unique screens');
if (!names.includes('FloatingLabelInput instance')) fail.push('no FloatingLabelInput instances on unique screens');
if (!names.includes('CourseCard instance')) fail.push('no CourseCard instances on unique screens');
if (!names.includes('PracticeRailItem instance')) fail.push('no PracticeRailItem instances on unique screens');
if (!names.includes('BottomNavItem instance')) fail.push('no BottomNavItem instances on unique screens');
if (!names.includes('NavLink instance')) fail.push('no NavLink instances on unique screens');
if (!names.includes('LanguageSwitcher instance')) fail.push('no LanguageSwitcher instances on unique screens');
if (!names.includes('PathNode instance')) fail.push('no PathNode instances on unique screens');
if (!names.includes('Achievement instance')) fail.push('no Achievement instances on unique screens');
if (!names.includes('LearnStatus instance')) fail.push('no LearnStatus instances on unique screens');
if (!names.includes('PasswordStrength instance')) fail.push('no PasswordStrength instances on unique screens');
if (!names.includes('ProgressBar instance')) fail.push('no ProgressBar instances on unique screens');
if (!names.includes('EmptyState instance')) fail.push('no EmptyState instances on unique screens');
if (!names.includes('Register password /register')) fail.push('no register password-strength unique screen');
if (!names.includes('NextStepCard')) fail.push('no dashboard NextStepCard unique screen');
if (!names.includes('Ответы')) fail.push('no stats answers chart unique screen');
if (!names.includes('Home authed /')) fail.push('no authed home unique screen');
if (!names.includes('@learner')) fail.push('no live leaderboard @learner unique screen');
if (!names.includes('Пройдите ещё уроки — таблица расширится, когда появятся новые игроки.')) {
  fail.push('no live leaderboard climb-hint unique screen');
}
if (!names.includes('193')) fail.push('admin overview lessons count does not match live capture');
if (!names.includes('First Laptop')) fail.push('no live path First Laptop unique screen');
if (!names.includes('0/20 курсов')) fail.push('no live path 0/20 courses unique screen');
if (!names.includes('Готовы к практике?')) fail.push('no live code-lab empty unique screen');
if (!names.includes('Welcome.txt')) fail.push('no live desktop Welcome.txt unique screen');
if (!names.includes('Создайте папку «Practice»')) fail.push('no live desktop first-task unique screen');
if (!names.includes('Копировать')) fail.push('no live lesson hotkey title unique screen');
if (!names.includes('Учебное поле')) fail.push('no live lesson hotkey demo unique screen');
if (!names.includes('Задание 1 из 13')) fail.push('no live training progress unique screen');
if (!names.includes('В начало строки')) fail.push('no live training prompt unique screen');
if (!names.includes('Путь обучения')) fail.push('no live catalog path CTA unique screen');
if (!names.includes('ОБЯЗАТЕЛЬНЫЙ СТАРТ')) fail.push('no live course-detail start badge unique screen');
if (!names.includes('Отметить выполненным')) fail.push('no live task-lesson complete CTA unique screen');
if (!names.includes('Поймите разницу между файлом и папкой')) fail.push('no live task-lesson hint unique screen');
if (!names.includes('Какая комбинация клавиш используется для копирования текста или файла?')) {
  fail.push('no live quiz question unique screen');
}
if (!names.includes('Неправильно!')) fail.push('no live quiz wrong toast unique screen');
if (!names.includes('+5 XP')) fail.push('no live quiz correct XP unique screen');
if (!names.includes('Вырезать')) fail.push('no live review front unique screen');
if (!names.includes('На лицевую сторону')) fail.push('no live review flipped unique screen');
if (!names.includes('Экзамен · 1/20')) fail.push('no live exam-run 1/20 unique screen');
if (!names.includes('10:00')) fail.push('no live exam-run timer unique screen');
if (!names.includes('Откройте замену')) fail.push('no live exam-wrong combo unique screen');
if (!names.includes('фыва олдж фыва олдж ваол джфы аовы лджф')) fail.push('no live typing home-row unique screen');
if (!names.includes('Ваш прогресс')) fail.push('no live typing progress unique screen');
if (!names.includes('Уроки пути: 0%')) fail.push('no live typing path unique screen');
if (!names.includes('Старт 60 сек')) fail.push('no live speed start unique screen');
if (!names.includes('Время практики: 0:00')) fail.push('no live typing practice-time unique screen');
if (!names.includes('nobody@example.com')) fail.push('no live login-error email unique screen');
if (!names.includes('Mobile Training 390')) fail.push('no mobile training unique screen');
if (!names.includes('Отменить')) fail.push('no live mobile training prompt unique screen');
if (!names.includes('МОЙ ПУТЬ РАЗВИТИЯ')) fail.push('no live mobile path eyebrow unique screen');
if (!names.some((n) => String(n).includes('siteadmin'))) fail.push('no live admin users unique screen');
if (!names.some((n) => String(n).includes('16 Уроки · 4 Категории'))) {
  fail.push('no live admin courses computer-basics unique screen');
}
if (!names.some((n) => String(n).includes('42 Уроки · 7 Категории'))) {
  fail.push('no live admin courses vscode unique screen');
}
if (!names.includes('+ Создать')) fail.push('no live admin create CTA unique screen');
if (!names.some((n) => String(n).includes('100-correct'))) fail.push('no live admin achievements unique screen');
if (!names.includes('С чего начать сегодня')) fail.push('no live practice start-today unique screen');
if (!names.includes('Exam empty card')) fail.push('no exam empty GlassCard unique screen');
if (!names.includes('Скриншот')) fail.push('no live mobile review PrtSc/Скриншот unique screen');
if (!names.includes('Dark Daily')) fail.push('no dark dashboard daily-tasks unique screen');
if (!names.includes('Dark First Laptop node')) fail.push('no dark path First Laptop unique screen');
if (!names.includes('Dark PathStageStrip')) fail.push('no dark dashboard stage strip unique screen');
if (!names.includes('quiz stats compact')) fail.push('no compact mobile quiz stats unique screen');
if (!names.includes('Сбалансированный темп: успеете вспомнить сочетание и нажать его.')) {
  fail.push('no live exam session pace unique screen');
}
if (!names.includes('Keyboard gate card')) fail.push('no keyboard-gate GlassCard unique screen');
if (!names.includes('Мы отправили ссылку на anna@example.com. Перейдите по ней, затем войдите в аккаунт.')) {
  fail.push('no live register OTP check-email unique screen');
}
if (!names.some((n) => String(n).includes('понятный путь без скуки, с нуля.'))) {
  fail.push('no live mobile home body unique screen');
}

function findByName(root, name) {
  if (root.name === name) return root;
  for (const c of root.children || []) {
    const hit = findByName(c, name);
    if (hit) return hit;
  }
  return null;
}
function namesUnder(root) {
  const out = [];
  function walk(n) {
    out.push(n.name);
    if (n.characters) out.push(n.characters);
    for (const c of n.children || []) walk(c);
  }
  walk(root);
  return out;
}
let quizUnique = null;
let reviewUnique = null;
let mobileHome = null;
let mobileLogin = null;
for (const p of pages) {
  quizUnique = quizUnique || findByName(p, 'Quiz /quiz');
  reviewUnique = reviewUnique || findByName(p, 'Review front /review');
  mobileHome = mobileHome || findByName(p, 'Mobile Home 390');
  mobileLogin = mobileLogin || findByName(p, 'Mobile Login — BottomNav hidden');
}
if (!quizUnique || !namesUnder(quizUnique).includes('Какая комбинация клавиш используется для копирования текста или файла?')) {
  fail.push('desktop quiz unique screen lost question (appendChild steal)');
}
if (!reviewUnique || !namesUnder(reviewUnique).includes('Вырезать')) {
  fail.push('desktop review unique screen lost Вырезать (appendChild steal)');
}
if (!mobileHome || !namesUnder(mobileHome).includes('Каталог курсов')) {
  fail.push('mobile home unique screen missing catalog CTA');
}
if (!mobileLogin || !namesUnder(mobileLogin).includes('Добро пожаловать в KeyMaster')) {
  fail.push('mobile login unique screen missing AuthCard subtitle');
}
if (mobileLogin && namesUnder(mobileLogin).includes('BottomNav')) {
  fail.push('mobile login unique screen still has BottomNav');
}
let studyUnique = null;
for (const p of pages) studyUnique = studyUnique || findByName(p, 'Lesson study-only /lessons/:id');
if (!studyUnique || !namesUnder(studyUnique).some((n) => String(n).includes('без аккаунта'))) {
  fail.push('no live study-only practice-gate body unique screen');
}
if (!studyUnique || !namesUnder(studyUnique).includes('Вход') || namesUnder(studyUnique).includes('Анна')) {
  fail.push('study-only unique screen is not guest chrome like the live capture');
}
if (!names.includes('wrong head')) fail.push('no live quiz-picked wrong-toast unique screen');
let examFbUnique = null;
let darkCoursesUnique = null;
let mobileCoursesUnique = null;
let mobilePracticeUnique = null;
for (const p of pages) {
  examFbUnique = examFbUnique || findByName(p, 'Exam feedback /exam');
  darkCoursesUnique = darkCoursesUnique || findByName(p, 'Dark Courses / html.dark');
  mobileCoursesUnique = mobileCoursesUnique || findByName(p, 'Mobile Courses 390');
  mobilePracticeUnique = mobilePracticeUnique || findByName(p, 'Mobile Practice 390');
}
if (!examFbUnique || !namesUnder(examFbUnique).includes('9:59') || !namesUnder(examFbUnique).includes('Откройте замену')) {
  fail.push('exam-feedback unique screen does not match live Неверно capture');
}
if (!darkCoursesUnique || namesUnder(darkCoursesUnique).includes('В процессе') || namesUnder(darkCoursesUnique).includes('Готово')) {
  fail.push('dark catalog unique screen still uses InProgress/Done instead of live 0 XP СТАРТ cards');
}
if (!darkCoursesUnique || !namesUnder(darkCoursesUnique).includes('0/16 сочетаний') || !namesUnder(darkCoursesUnique).includes('Начните здесь')) {
  fail.push('dark catalog unique screen missing live 0 XP progress / start-here');
}
if (!mobileCoursesUnique || !namesUnder(mobileCoursesUnique).includes('Начните здесь') || !namesUnder(mobileCoursesUnique).includes('Регистрация')) {
  fail.push('mobile courses unique screen missing live guest chrome or start-here card');
}
if (!mobilePracticeUnique || !namesUnder(mobilePracticeUnique).includes('Выйти')) {
  fail.push('mobile practice unique screen is not authed chrome like the live capture');
}
if (shots.length < 59) fail.push('expected at least 59 shots, got ' + shots.length);

console.log(JSON.stringify(report, null, 2));
if (fail.length) {
  console.error('DRY-RUN FAILED\n' + fail.join('\n'));
  process.exit(1);
}
console.log('DRY-RUN OK');
