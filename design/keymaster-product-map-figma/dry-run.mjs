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
if (!names.includes('Leaderboard authed /leaderboard')) fail.push('no authed leaderboard unique screen');
if (!names.includes('Leaderboard hero')) fail.push('no live leaderboard gradient hero unique screen');
if (!names.includes('ВЫ')) fail.push('no live authed leaderboard Вы badge unique screen');
if (!names.includes('Courses filter start /courses')) fail.push('no catalog start-filter unique screen');
if (!names.includes('Guest / Courses filter start')) fail.push('no catalog start-filter capture');
if (!names.includes('Learner / Leaderboard')) fail.push('no authed leaderboard capture');
if (!names.includes('Mobile / Home authed')) fail.push('no authed mobile home capture');
if (!names.includes('Mobile Leaderboard 390')) fail.push('no guest mobile leaderboard unique screen');
if (!names.includes('Mobile Leaderboard authed 390')) fail.push('no authed mobile leaderboard unique screen');
if (!names.includes('Mobile / Leaderboard')) fail.push('no guest mobile leaderboard capture');
if (!names.includes('Mobile / Leaderboard authed')) fail.push('no authed mobile leaderboard capture');
if (!names.includes('Mobile Register — BottomNav hidden')) fail.push('no mobile register unique screen');
if (!names.includes('Mobile Courses authed 390')) fail.push('no authed mobile catalog unique screen');
if (!names.includes('Mobile / Register')) fail.push('no mobile register capture');
if (!names.includes('Mobile / Courses authed')) fail.push('no authed mobile catalog capture');
if (!names.includes('Training empty /training')) fail.push('no training empty unique screen');
if (!names.includes('Training done /training')) fail.push('no training done unique screen');
if (!names.includes('Нет заданий')) fail.push('no live training empty title unique screen');
if (!names.includes('Тренировка завершена')) fail.push('no live training done title unique screen');
if (!names.includes('Все сочетания дались уверенно. Отличная работа!')) fail.push('no live training doneAllGood unique screen');
if (!names.includes('Пройти ещё раз')) fail.push('no live training restart unique screen');
if (!names.includes('Review empty /review')) fail.push('no review empty unique screen');
if (!names.includes('Нет карточек')) fail.push('no live review empty title unique screen');
if (!names.includes('Course detail loading /courses/:slug')) fail.push('no course-detail loading unique screen');
if (!names.includes('Mobile Course computer-basics 390')) fail.push('no mobile computer-basics course unique screen');
if (!names.includes('Learner / Training empty')) fail.push('no training empty capture');
if (!names.includes('Learner / Review empty')) fail.push('no review empty capture');
if (!names.includes('Guest / Course detail loading')) fail.push('no course-detail loading capture');
if (!names.includes('Mobile / Course detail (computer-basics)')) fail.push('no mobile computer-basics course capture');
if (!names.includes('Exam done /exam')) fail.push('no exam done unique screen');
if (!names.includes('Keyboard gate')) fail.push('no keyboard gate unique screen');
if (!names.includes('Lesson desktop-task /lessons/:id')) fail.push('no desktop-task lesson unique screen');
if (!names.includes('Симулятор сам засчитает урок и XP, когда шаг будет выполнен.')) {
  fail.push('no live desktop-task sim-only honesty unique screen');
}
if (!names.includes('Home TJ /')) fail.push('no TJ locale home unique screen');
if (!names.includes('Аз ноутбуки аввал — то устодии клавиатура')) fail.push('no live Tajik home headline unique screen');
if (!names.includes('Асосӣ')) fail.push('no live Tajik nav home unique screen');
if (!names.includes('аз ноутбуки аввал то Shortcut Legend')) fail.push('no live Tajik footer unique screen');
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
if (!names.some((n) => String(n).includes('Системные клавиши (Alt+Tab, Win, F)'))) {
  fail.push('no live programmer-basics catalog description unique screen');
}
if (!names.includes('empty bar')) fail.push('no live stats empty-chart unique screen');
if (!names.includes('chart y-axis')) fail.push('no live stats chart y-axis unique screen');
if (!names.includes('AuthCard compact')) fail.push('no compact AuthCard (register)');
if (!names.includes('Speed run /speed')) fail.push('no speed-run unique screen');
if (!names.includes('⏱ 1:00')) fail.push('no live speed-run timer unique screen');
if (!names.includes('🔥 x0')) fail.push('no live speed-run combo unique screen');
if (!names.includes('Desktop hint /simulator?mode=desktop')) fail.push('no desktop hint unique screen');
if (!names.includes('Скрыть подсказку')) fail.push('no live desktop hide-hint unique screen');
if (!names.includes('Learner / Speed run')) fail.push('no speed-run capture');
if (!names.includes('Learner / Desktop hint')) fail.push('no desktop hint capture');
if (!names.includes('Typing busy /typing')) fail.push('no typing-busy unique screen');
if (!names.includes('Typing paused /typing')) fail.push('no typing-paused unique screen');
if (!names.includes('Typing result /typing')) fail.push('no typing-result unique screen');
if (!names.includes('Learner / Typing busy')) fail.push('no typing-busy capture');
if (!names.includes('Learner / Typing paused')) fail.push('no typing-paused capture');
if (!names.includes('Learner / Typing result')) fail.push('no typing-result capture');
if (!names.includes('Desktop new folder /simulator?mode=desktop')) fail.push('no desktop new-folder unique screen');
if (!names.includes('Training hint /training')) fail.push('no training-hint unique screen');
if (!names.includes('Training hint 2 /training')) fail.push('no training-hint2 unique screen');
if (!names.includes('Learner / Training hint')) fail.push('no training-hint capture');
if (!names.includes('Learner / Training hint 2')) fail.push('no training-hint2 capture');
if (!names.includes('Desktop explorer file menu /simulator?mode=desktop')) fail.push('no explorer file-menu unique screen');
if (!names.includes('Learner / Desktop explorer file menu')) fail.push('no explorer file-menu capture');
if (!names.includes('Desktop recycle-bin restore /simulator?mode=desktop')) fail.push('no trash-restore unique screen');
if (!names.includes('Learner / Desktop recycle-bin restore')) fail.push('no trash-restore capture');
if (!names.includes('Quiz finished /quiz')) fail.push('no quiz-finished unique screen');
if (!names.includes('Learner / Quiz finished')) fail.push('no quiz-finished capture');
if (!names.includes('Desktop recycle-bin full /simulator?mode=desktop')) fail.push('no desktop trash-full unique screen');
if (!names.includes('Learner / Desktop recycle-bin full')) fail.push('no desktop trash-full capture');
if (!names.includes('Training correct /training')) fail.push('no training-correct unique screen');
if (!names.includes('Learner / Desktop new folder')) fail.push('no desktop new-folder capture');
if (!names.includes('Learner / Training explain')) fail.push('no training-explain capture');
if (!names.includes('Learner / Training correct')) fail.push('no training-correct capture');
if (!names.includes('Exam timeout /exam')) fail.push('no exam-timeout unique screen');
if (!names.includes('Learner / Exam timeout')) fail.push('no exam-timeout capture');
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
if (!names.includes('Папка Practice')) fail.push('no live desktop-task lesson title unique screen');
if (!names.includes('Имена латиницей проще для программ. В симуляторе шаг засчитается сам.')) {
  fail.push('no live desktop-task latin-names hint unique screen');
}
if (!names.includes('Создайте на рабочем столе папку Practice')) fail.push('no live desktop-task prompt unique screen');
if (!names.some((n) => String(n).includes('ПКМ по обоям → Новая папка → Practice'))) {
  fail.push('no live desktop-task steps unique screen');
}
if (!names.includes('Mobile Dashboard 390')) fail.push('no mobile dashboard unique screen');
if (!names.includes('Learner / Lesson desktop-task')) fail.push('no desktop-task lesson capture');
if (!names.includes('Mobile / Dashboard')) fail.push('no mobile dashboard capture');
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
if (!names.includes('С ЧЕГО НАЧАТЬ СЕГОДНЯ')) fail.push('no live practice start-today unique screen');
if (!names.includes('ПРАКТИКА')) fail.push('no live practice eyebrow unique screen');
if (!names.includes('СТАРТ')) fail.push('no live status-chip СТАРТ unique screen');
if (!names.includes('Exam empty card')) fail.push('no exam empty GlassCard unique screen');
if (!names.includes('Скриншот')) fail.push('no live mobile review PrtSc/Скриншот unique screen');
if (!names.includes('Dark Daily')) fail.push('no dark dashboard daily-tasks unique screen');
if (!names.includes('Dark First Laptop node')) fail.push('no dark path First Laptop unique screen');
if (!names.includes('Dark PathStageStrip')) fail.push('no dark dashboard stage strip unique screen');
if (!names.includes('quiz stats compact')) fail.push('no compact mobile quiz stats unique screen');
if (!names.includes('Сбалансированный темп: успеете вспомнить сочетание и нажать его.')) {
  fail.push('no live exam session pace unique screen');
}
if (!names.includes('Path guest /path')) fail.push('no guest path unique screen');
if (!names.includes('Войдите, чтобы видеть прогресс по существующим курсам на карьерной карте.')) {
  fail.push('no live guest path banner unique screen');
}
if (!names.includes('Mobile nav open guest 390')) fail.push('no guest mobile-nav-open unique screen');
if (!names.includes('Mobile nav open authed 390')) fail.push('no authed mobile-nav-open unique screen');
if (!names.includes('Кабинет · 0 XP')) fail.push('no live mobile drawer dashboard XP unique screen');
if (!names.includes('Обучение')) fail.push('no live mobile drawer learn-group unique screen');
if (!names.includes('Keyboard illustration')) fail.push('no live PracticeKeyboardGate keyboard illustration unique screen');
if (!names.includes('Path timeline line')) fail.push('no live path spine unique screen');
if (!names.includes('Следующий курс')) fail.push('no live path next-course CTA unique screen');
if (!names.includes('CourseBrandIcon')) fail.push('no live path course brand icon unique screen');
if (!names.includes('Courses authed /courses')) fail.push('no authed catalog unique screen');
if (!names.includes('Courses loading /courses')) fail.push('no catalog loading unique screen');
if (!names.includes('Courses API error /courses')) fail.push('no catalog API-error unique screen');
if (!names.includes('Course detail authed /courses/:slug')) fail.push('no authed course-detail unique screen');
if (!names.includes('Course detail authed computer-basics /courses/:slug')) fail.push('no authed computer-basics course-detail unique screen');
if (!names.includes('Course detail guest vscode /courses/:slug')) fail.push('no guest vscode course-detail unique screen');
if (!names.includes('Course detail guest programmer-basics /courses/:slug')) fail.push('no guest programmer-basics course-detail unique screen');
if (!names.includes('Course detail authed programmer-basics /courses/:slug')) fail.push('no authed programmer-basics course-detail unique screen');
if (!names.includes('Learner / Course detail (computer-basics)')) fail.push('no authed computer-basics course-detail capture');
if (!names.includes('Guest / Course detail (vscode)')) fail.push('no guest vscode course-detail capture');
if (!names.includes('Guest / Course detail (programmer-basics)')) fail.push('no guest programmer-basics course-detail capture');
if (!names.includes('Learner / Course detail (programmer-basics)')) fail.push('no authed programmer-basics course-detail capture');
if (!names.includes('0/3 изучено')) fail.push('no live computer-basics category learned-count unique screen');
if (!names.includes('0/19 сочетаний')) fail.push('no live programmer-basics 0/19 progress unique screen');
if (!names.includes('0/13 изучено')) fail.push('no live programmer-basics Основы learned-count unique screen');
if (!names.includes('Система (изучение)')) fail.push('no live programmer-basics system category unique screen');
if (!names.includes('Course not found /courses/:slug')) fail.push('no course-not-found unique screen');
if (!names.includes('Auth callback error /auth/callback')) fail.push('no auth-callback error unique screen');
if (!names.includes('SkeletonCardGrid')) fail.push('no SkeletonCardGrid unique screen');
if (!names.includes('API недоступен')) fail.push('no live catalog API-down unique screen');
if (!names.includes('Курс не найден')) fail.push('no live course-not-found unique screen');
if (!names.includes('Ссылка недействительна или устарела')) fail.push('no live auth-callback verifyFail unique screen');
if (!names.includes('Быстрое открытие файла')) fail.push('no live vscode lesson card unique screen');
if (!names.includes('0/10 изучено')) fail.push('no live authed course learned-count unique screen');
if (!names.includes('Ctrl + Shift + O')) fail.push('no live vscode chord unique screen');
if (!names.includes('+10 XP')) fail.push('no live vscode xp_reward unique screen');
if (!names.includes('ИЗУЧЕНО')) fail.push('no live status-chip ИЗУЧЕНО unique screen');
if (!names.includes('Authed course cards')) fail.push('no light authed catalog cards unique screen');
if (!names.includes('Learner / Courses')) fail.push('no authed catalog capture');
if (!names.includes('Learner / Course detail (vscode)')) fail.push('no authed vscode capture');
if (!names.includes('Guest / Course not found')) fail.push('no course-not-found capture');
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
if (!names.includes('Mobile Home authed 390')) fail.push('no authed mobile home unique screen');
if (!names.includes('Мой путь развития →')) fail.push('no live authed home CTA unique screen');
let mobileHomeAuthedUnique = null;
for (const p of pages) mobileHomeAuthedUnique = mobileHomeAuthedUnique || findByName(p, 'Mobile Home authed 390');
if (!mobileHomeAuthedUnique || !namesUnder(mobileHomeAuthedUnique).includes('Выйти') || namesUnder(mobileHomeAuthedUnique).includes('Регистрация')) {
  fail.push('authed mobile home unique should show Выйти without guest Регистрация');
}
if (mobileHomeAuthedUnique && namesUnder(mobileHomeAuthedUnique).includes('Начать бесплатно →')) {
  fail.push('authed mobile home unique still uses guest CTA');
}
let mobileLbGuestUnique = null;
let mobileLbAuthedUnique = null;
for (const p of pages) {
  mobileLbGuestUnique = mobileLbGuestUnique || findByName(p, 'Mobile Leaderboard 390');
  mobileLbAuthedUnique = mobileLbAuthedUnique || findByName(p, 'Mobile Leaderboard authed 390');
}
if (!mobileLbGuestUnique || !namesUnder(mobileLbGuestUnique).includes('Регистрация') || namesUnder(mobileLbGuestUnique).includes('ВЫ')) {
  fail.push('guest mobile leaderboard unique should show Регистрация without ВЫ');
}
if (!mobileLbAuthedUnique || !namesUnder(mobileLbAuthedUnique).includes('Выйти') || !namesUnder(mobileLbAuthedUnique).includes('ВЫ') || namesUnder(mobileLbAuthedUnique).includes('Регистрация')) {
  fail.push('authed mobile leaderboard unique should show Выйти + ВЫ without Регистрация');
}
if (!mobileLogin || !namesUnder(mobileLogin).includes('Добро пожаловать в KeyMaster')) {
  fail.push('mobile login unique screen missing AuthCard subtitle');
}
if (mobileLogin && namesUnder(mobileLogin).includes('BottomNav')) {
  fail.push('mobile login unique screen still has BottomNav');
}
let mobileRegisterUnique = null;
let mobileCoursesAuthedUnique = null;
for (const p of pages) {
  mobileRegisterUnique = mobileRegisterUnique || findByName(p, 'Mobile Register — BottomNav hidden');
  mobileCoursesAuthedUnique = mobileCoursesAuthedUnique || findByName(p, 'Mobile Courses authed 390');
}
if (!mobileRegisterUnique || !namesUnder(mobileRegisterUnique).includes('Создать аккаунт') || namesUnder(mobileRegisterUnique).includes('BottomNav')) {
  fail.push('mobile register unique should show Создать аккаунт without BottomNav');
}
if (!mobileRegisterUnique || !namesUnder(mobileRegisterUnique).includes('Уже есть аккаунт?')) {
  fail.push('mobile register unique missing live footer question');
}
if (!mobileCoursesAuthedUnique || !namesUnder(mobileCoursesAuthedUnique).includes('Выйти') || !namesUnder(mobileCoursesAuthedUnique).includes('0/16 сочетаний') || namesUnder(mobileCoursesAuthedUnique).includes('Регистрация')) {
  fail.push('authed mobile catalog unique should show Выйти + 0/16 without guest Регистрация');
}
let studyUnique = null;
for (const p of pages) studyUnique = studyUnique || findByName(p, 'Lesson study-only /lessons/:id');
if (!studyUnique || !namesUnder(studyUnique).some((n) => String(n).includes('без аккаунта'))) {
  fail.push('no live study-only practice-gate body unique screen');
}
if (!studyUnique || !namesUnder(studyUnique).includes('Вход') || namesUnder(studyUnique).includes('Анна')) {
  fail.push('study-only unique screen is not guest chrome like the live capture');
}
if (!studyUnique || !namesUnder(studyUnique).includes('Окна') || !namesUnder(studyUnique).includes('В реальной системе: Alt+Tab')) {
  fail.push('guest study-only unique missing live Окна / Alt+Tab copy');
}
if (!names.includes('wrong head')) fail.push('no live quiz-picked wrong-toast unique screen');
let examFbUnique = null;
let darkCoursesUnique = null;
let mobileCoursesUnique = null;
let mobilePracticeUnique = null;
let coursesAuthedUnique = null;
let guestCoursesUnique = null;
let courseDetailAuthed = null;
for (const p of pages) {
  examFbUnique = examFbUnique || findByName(p, 'Exam feedback /exam');
  darkCoursesUnique = darkCoursesUnique || findByName(p, 'Dark Courses / html.dark');
  mobileCoursesUnique = mobileCoursesUnique || findByName(p, 'Mobile Courses 390');
  mobilePracticeUnique = mobilePracticeUnique || findByName(p, 'Mobile Practice 390');
  coursesAuthedUnique = coursesAuthedUnique || findByName(p, 'Courses authed /courses');
  guestCoursesUnique = guestCoursesUnique || findByName(p, 'Courses /courses');
  courseDetailAuthed = courseDetailAuthed || findByName(p, 'Course detail authed /courses/:slug');
}
if (!examFbUnique || !namesUnder(examFbUnique).includes('9:59') || !namesUnder(examFbUnique).includes('Откройте замену')) {
  fail.push('exam-feedback unique screen does not match live Неверно capture');
}
if (!darkCoursesUnique || namesUnder(darkCoursesUnique).includes('В процессе') || namesUnder(darkCoursesUnique).includes('Готово') || namesUnder(darkCoursesUnique).includes('В ПРОЦЕССЕ') || namesUnder(darkCoursesUnique).includes('ГОТОВО')) {
  fail.push('dark catalog unique screen still uses InProgress/Done instead of live 0 XP СТАРТ cards');
}
if (!darkCoursesUnique || !namesUnder(darkCoursesUnique).includes('0/16 сочетаний') || !namesUnder(darkCoursesUnique).includes('Начните здесь')) {
  fail.push('dark catalog unique screen missing live 0 XP progress / start-here');
}
if (!mobileCoursesUnique || !namesUnder(mobileCoursesUnique).includes('Начните здесь') || !namesUnder(mobileCoursesUnique).includes('Регистрация')) {
  fail.push('mobile courses unique screen missing live guest chrome or start-here card');
}
if (!mobilePracticeUnique || !namesUnder(mobilePracticeUnique).includes('Выйти') || namesUnder(mobilePracticeUnique).includes('Анна')) {
  fail.push('mobile practice unique should show live Выйти (btn-secondary) without desktop Анна chip');
}
if (!coursesAuthedUnique || !namesUnder(coursesAuthedUnique).includes('0/16 сочетаний') || !namesUnder(coursesAuthedUnique).includes('0/42 сочетаний')) {
  fail.push('authed catalog unique screen missing live 0/N LearnProgressBar');
}
if (!guestCoursesUnique || namesUnder(guestCoursesUnique).includes('0/16 сочетаний')) {
  fail.push('guest catalog unique screen should not show authed LearnProgressBar');
}
if (!courseDetailAuthed || !namesUnder(courseDetailAuthed).includes('Тренировка') || !namesUnder(courseDetailAuthed).includes('Экзамен')) {
  fail.push('authed vscode course-detail unique missing Training/Exam CTAs');
}
if (!courseDetailAuthed || !namesUnder(courseDetailAuthed).includes('LearnStatus instance')) {
  fail.push('authed vscode course-detail unique missing LearnStatus instance');
}
let courseDetailBasicsAuthed = null;
for (const p of pages) courseDetailBasicsAuthed = courseDetailBasicsAuthed || findByName(p, 'Course detail authed computer-basics /courses/:slug');
if (!courseDetailBasicsAuthed || !namesUnder(courseDetailBasicsAuthed).includes('Рабочий стол') || namesUnder(courseDetailBasicsAuthed).includes('Тренировка') || namesUnder(courseDetailBasicsAuthed).includes('Экзамен')) {
  fail.push('authed computer-basics course-detail unique should use Desktop CTA without Training/Exam');
}
if (!courseDetailBasicsAuthed || !namesUnder(courseDetailBasicsAuthed).includes('0/16 сочетаний') || !namesUnder(courseDetailBasicsAuthed).includes('+15 XP') || !namesUnder(courseDetailBasicsAuthed).includes('Папка Practice')) {
  fail.push('authed computer-basics course-detail unique missing live 0/16, +15 XP, or Папка Practice');
}
if (courseDetailBasicsAuthed && namesUnder(courseDetailBasicsAuthed).includes('Ctrl + P')) {
  fail.push('authed computer-basics course-detail unique should not show vscode shortcut lines');
}
let courseDetailGuestVscode = null;
let courseDetailGuestProg = null;
let courseDetailAuthedProg = null;
for (const p of pages) {
  courseDetailGuestVscode = courseDetailGuestVscode || findByName(p, 'Course detail guest vscode /courses/:slug');
  courseDetailGuestProg = courseDetailGuestProg || findByName(p, 'Course detail guest programmer-basics /courses/:slug');
  courseDetailAuthedProg = courseDetailAuthedProg || findByName(p, 'Course detail authed programmer-basics /courses/:slug');
}
if (
  !courseDetailGuestVscode ||
  namesUnder(courseDetailGuestVscode).includes('ОБЯЗАТЕЛЬНЫЙ СТАРТ') ||
  !namesUnder(courseDetailGuestVscode).includes('Тренировка') ||
  !namesUnder(courseDetailGuestVscode).includes('Экзамен') ||
  !namesUnder(courseDetailGuestVscode).includes('Зарегистрируйтесь') ||
  !namesUnder(courseDetailGuestVscode).includes('Ctrl + P')
) {
  fail.push('guest vscode course-detail unique should be Training/Exam + register CTA without start badge');
}
if (
  !courseDetailGuestProg ||
  !namesUnder(courseDetailGuestProg).includes('ОБЯЗАТЕЛЬНЫЙ СТАРТ') ||
  !namesUnder(courseDetailGuestProg).includes('Тренировка') ||
  !namesUnder(courseDetailGuestProg).includes('Экзамен') ||
  !namesUnder(courseDetailGuestProg).includes('Зарегистрируйтесь') ||
  namesUnder(courseDetailGuestProg).includes('0/19 сочетаний')
) {
  fail.push('guest programmer-basics course-detail unique should be start badge + Training/Exam without authed 0/19');
}
if (
  !courseDetailAuthedProg ||
  !namesUnder(courseDetailAuthedProg).includes('ОБЯЗАТЕЛЬНЫЙ СТАРТ') ||
  !namesUnder(courseDetailAuthedProg).includes('0/19 сочетаний') ||
  !namesUnder(courseDetailAuthedProg).includes('Тренировка') ||
  !namesUnder(courseDetailAuthedProg).includes('Экзамен') ||
  !namesUnder(courseDetailAuthedProg).includes('LearnStatus instance') ||
  namesUnder(courseDetailAuthedProg).includes('Зарегистрируйтесь')
) {
  fail.push('authed programmer-basics course-detail unique should be start badge + 0/19 + Training/Exam without guest CTA');
}
let courseNotFoundUnique = null;
for (const p of pages) courseNotFoundUnique = courseNotFoundUnique || findByName(p, 'Course not found /courses/:slug');
if (!courseNotFoundUnique || !namesUnder(courseNotFoundUnique).includes('Курс не найден')) {
  fail.push('course-not-found unique missing live EmptyState title');
}
if (courseNotFoundUnique && namesUnder(courseNotFoundUnique).includes('Здесь появятся элементы, когда будет прогресс.')) {
  fail.push('course-not-found unique still shows default EmptyState description');
}
let trainEmptyUnique = null;
let trainDoneUnique = null;
let reviewEmptyUnique = null;
let courseLoadingUnique = null;
let mobileCourseBasicsUnique = null;
for (const p of pages) {
  trainEmptyUnique = trainEmptyUnique || findByName(p, 'Training empty /training');
  trainDoneUnique = trainDoneUnique || findByName(p, 'Training done /training');
  reviewEmptyUnique = reviewEmptyUnique || findByName(p, 'Review empty /review');
  courseLoadingUnique = courseLoadingUnique || findByName(p, 'Course detail loading /courses/:slug');
  mobileCourseBasicsUnique = mobileCourseBasicsUnique || findByName(p, 'Mobile Course computer-basics 390');
}
if (!trainEmptyUnique || !namesUnder(trainEmptyUnique).includes('Нет заданий') || !namesUnder(trainEmptyUnique).includes('Запустите backend и обновите страницу')) {
  fail.push('training empty unique missing live Нет заданий copy');
}
if (!trainDoneUnique || !namesUnder(trainDoneUnique).includes('Тренировка завершена') || !namesUnder(trainDoneUnique).includes('Пройти ещё раз')) {
  fail.push('training done unique missing live finished copy');
}
if (!reviewEmptyUnique || !namesUnder(reviewEmptyUnique).includes('Нет карточек')) {
  fail.push('review empty unique missing live Нет карточек copy');
}
if (!courseLoadingUnique || !namesUnder(courseLoadingUnique).includes('Skeleton instance')) {
  fail.push('course-detail loading unique missing Skeleton instance');
}
if (!mobileCourseBasicsUnique || !namesUnder(mobileCourseBasicsUnique).includes('Рабочий стол') || namesUnder(mobileCourseBasicsUnique).includes('Тренировка') || namesUnder(mobileCourseBasicsUnique).includes('Регистрация')) {
  fail.push('mobile computer-basics unique should show Desktop CTA without Training or guest Регистрация');
}
let gateUnique = null;
for (const p of pages) gateUnique = gateUnique || findByName(p, 'Keyboard gate');
if (!gateUnique || !namesUnder(gateUnique).includes('Выйти') || !namesUnder(gateUnique).includes('Keyboard illustration')) {
  fail.push('keyboard-gate unique screen missing live Выйти chrome or keyboard illustration');
}
if (!gateUnique || !namesUnder(gateUnique).includes('ВСЕ КУРСЫ') || !namesUnder(gateUnique).includes('Завершить')) {
  fail.push('keyboard-gate unique missing live exam-run chrome around PracticeKeyboardGate');
}
if (!names.includes('Начать бесплатно →')) fail.push('no live home CTA arrow unique screen');
if (!names.includes('Нет аккаунта?')) fail.push('no live auth footer question unique screen');
if (!names.includes('УРОВЕНЬ')) fail.push('no live dashboard level caption unique screen');
if (!names.includes('ЕЖЕДНЕВНАЯ СЕРИЯ')) fail.push('no live dashboard streak caption unique screen');
if (!names.includes('Courses empty /courses')) fail.push('no catalog empty unique screen');
if (!names.includes('Ничего не нашлось. Снимите фильтр или измените запрос.')) {
  fail.push('no live catalog no-matches unique screen');
}
let deskTaskUnique = null;
let mobileDashUnique = null;
for (const p of pages) {
  deskTaskUnique = deskTaskUnique || findByName(p, 'Lesson desktop-task /lessons/:id');
  mobileDashUnique = mobileDashUnique || findByName(p, 'Mobile Dashboard 390');
}
if (!deskTaskUnique || !namesUnder(deskTaskUnique).includes('Папка Practice') || !namesUnder(deskTaskUnique).some((n) => String(n).includes('ПКМ по обоям → Новая папка → Practice')) || namesUnder(deskTaskUnique).includes('Правый клик на рабочем столе')) {
  fail.push('desktop-task unique screen does not match live Папка Practice copy');
}
if (!mobileDashUnique || !namesUnder(mobileDashUnique).includes('Выйти') || !namesUnder(mobileDashUnique).includes('Привет, Анна!') || namesUnder(mobileDashUnique).includes('Регистрация')) {
  fail.push('mobile dashboard unique should show Выйти + Привет, Анна! without Регистрация');
}

if (!names.includes('Leaderboard empty /leaderboard')) fail.push('no leaderboard empty unique screen');
if (!names.includes('Leaderboard period empty /leaderboard')) fail.push('no leaderboard period-empty unique screen');
if (!names.includes('Leaderboard api down /leaderboard')) fail.push('no leaderboard API-down unique screen');
if (!names.includes('Leaderboard loading /leaderboard')) fail.push('no leaderboard loading unique screen');
if (!names.includes('Achievements empty /achievements')) fail.push('no achievements empty unique screen');
if (!names.includes('Lesson loading /lessons/:id')) fail.push('no lesson loading unique screen');
if (!names.includes('Lesson study-only authed /lessons/:id')) fail.push('no authed study-only unique screen');
if (!names.includes('Lesson study-only learned /lessons/:id')) fail.push('no learned study-only unique screen');
if (!names.includes('Lesson task done /lessons/:id')) fail.push('no task-done unique screen');
if (!names.includes('Lesson desktop-task done /lessons/:id')) fail.push('no desktop-task done unique screen');
if (!names.includes('Lesson hotkey done /lessons/:id')) fail.push('no hotkey-done unique screen');
if (!names.includes('Рейтинг пуст')) fail.push('no live leaderboard empty title unique screen');
if (!names.includes('За этот период пока никого')) fail.push('no live leaderboard period-empty title unique screen');
if (!names.includes('Пройдите первый урок, чтобы открыть достижения')) fail.push('no live achievements empty title unique screen');
if (!names.includes('Это сочетание уже в вашем арсенале')) fail.push('no live study-only inArsenal unique screen');
if (!names.includes('Запомнил')) fail.push('no live study-only markLearned unique screen');
if (!names.includes('Задание выполнено')) fail.push('no live task-done title unique screen');
if (!names.includes('Сочетание изучено')) fail.push('no live hotkey-done title unique screen');
if (!names.includes('Запомните: Ctrl + C — Скопируйте')) fail.push('no live hotkey-done rememberLine unique screen');
if (!names.includes('Guest / Leaderboard empty')) fail.push('no leaderboard empty capture');
if (!names.includes('Learner / Leaderboard period empty')) fail.push('no leaderboard period-empty capture');
if (!names.includes('Guest / Leaderboard API down')) fail.push('no leaderboard API-down capture');
if (!names.includes('Guest / Leaderboard loading')) fail.push('no leaderboard loading capture');
if (!names.includes('Learner / Achievements empty')) fail.push('no achievements empty capture');
if (!names.includes('Guest / Lesson loading')) fail.push('no lesson loading capture');
if (!names.includes('Learner / Lesson study-only')) fail.push('no authed study-only capture');
if (!names.includes('Learner / Lesson study-only learned')) fail.push('no learned study-only capture');
if (!names.includes('Learner / Lesson task done')) fail.push('no task-done capture');
if (!names.includes('Learner / Lesson desktop-task done')) fail.push('no desktop-task done capture');

let lbEmptyUnique = null;
let lbPeriodUnique = null;
let lbApiUnique = null;
let lbLoadUnique = null;
let achEmptyUnique = null;
let lessonLoadUnique = null;
let studyAuthedUnique = null;
let studyLearnedUnique = null;
let taskDoneUnique = null;
let deskDoneUnique = null;
let hotkeyDoneUnique = null;
for (const p of pages) {
  lbEmptyUnique = lbEmptyUnique || findByName(p, 'Leaderboard empty /leaderboard');
  lbPeriodUnique = lbPeriodUnique || findByName(p, 'Leaderboard period empty /leaderboard');
  lbApiUnique = lbApiUnique || findByName(p, 'Leaderboard api down /leaderboard');
  lbLoadUnique = lbLoadUnique || findByName(p, 'Leaderboard loading /leaderboard');
  achEmptyUnique = achEmptyUnique || findByName(p, 'Achievements empty /achievements');
  lessonLoadUnique = lessonLoadUnique || findByName(p, 'Lesson loading /lessons/:id');
  studyAuthedUnique = studyAuthedUnique || findByName(p, 'Lesson study-only authed /lessons/:id');
  studyLearnedUnique = studyLearnedUnique || findByName(p, 'Lesson study-only learned /lessons/:id');
  taskDoneUnique = taskDoneUnique || findByName(p, 'Lesson task done /lessons/:id');
  deskDoneUnique = deskDoneUnique || findByName(p, 'Lesson desktop-task done /lessons/:id');
  hotkeyDoneUnique = hotkeyDoneUnique || findByName(p, 'Lesson hotkey done /lessons/:id');
}
if (!lbEmptyUnique || !namesUnder(lbEmptyUnique).includes('Рейтинг пуст') || !namesUnder(lbEmptyUnique).includes('СОРЕВНОВАНИЕ')) {
  fail.push('leaderboard empty unique missing live Рейтинг пуст under competition hero');
}
if (!lbPeriodUnique || !namesUnder(lbPeriodUnique).includes('За этот период пока никого') || !namesUnder(lbPeriodUnique).includes('Выйти')) {
  fail.push('leaderboard period-empty unique should keep authed chrome + week empty copy');
}
if (!lbApiUnique || !namesUnder(lbApiUnique).includes('API недоступен') || !namesUnder(lbApiUnique).includes('СОРЕВНОВАНИЕ')) {
  fail.push('leaderboard API-down unique missing hero + API недоступен');
}
if (!lbLoadUnique || !namesUnder(lbLoadUnique).includes('ОСТАЛЬНЫЕ МЕСТА') || !namesUnder(lbLoadUnique).includes('Skeleton instance')) {
  fail.push('leaderboard loading unique missing podium/table skeletons');
}
if (!achEmptyUnique || !namesUnder(achEmptyUnique).includes('Пройдите первый урок, чтобы открыть достижения')) {
  fail.push('achievements empty unique missing live EmptyState title');
}
if (!lessonLoadUnique || !namesUnder(lessonLoadUnique).includes('Skeleton instance')) {
  fail.push('lesson loading unique missing Skeleton instance');
}
if (!studyAuthedUnique || !namesUnder(studyAuthedUnique).includes('Запомнил') || !namesUnder(studyAuthedUnique).includes('НЕ ИЗУЧЕНО') || namesUnder(studyAuthedUnique).includes('Регистрация для практики')) {
  fail.push('authed study-only unique should show Запомнил without guest register gate');
}
if (!studyLearnedUnique || !namesUnder(studyLearnedUnique).includes('Это сочетание уже в вашем арсенале') || namesUnder(studyLearnedUnique).includes('Запомнил')) {
  fail.push('learned study-only unique should show inArsenal without Запомнил');
}
if (!taskDoneUnique || !namesUnder(taskDoneUnique).includes('Задание выполнено') || !namesUnder(taskDoneUnique).includes('Выполнено') || !namesUnder(taskDoneUnique).includes('Следующий урок через 0…')) {
  fail.push('task-done unique missing live Задание выполнено / Выполнено / countdown copy');
}
if (!deskDoneUnique || !namesUnder(deskDoneUnique).includes('Запомните: Создайте на рабочем столе папку Practice') || !namesUnder(deskDoneUnique).includes('Выполнено')) {
  fail.push('desktop-task done unique missing live rememberTaskLine');
}
if (!hotkeyDoneUnique || !namesUnder(hotkeyDoneUnique).includes('Сочетание изучено') || !namesUnder(hotkeyDoneUnique).includes('Тренировка без подсказок')) {
  fail.push('hotkey-done unique missing live doneTitle / training CTA');
}

if (!names.includes('Verify email loading /verify-email')) fail.push('no verify-email loading unique screen');
if (!names.includes('Verify email ok /verify-email')) fail.push('no verify-email success unique screen');
if (!names.includes('Проверяем ссылку…')) fail.push('no live verify loading copy unique screen');
if (!names.includes('Email подтверждён. Теперь можно войти.')) fail.push('no live verify success API message unique screen');
if (!names.includes('Achievements loading /achievements')) fail.push('no achievements loading unique screen');
if (!names.includes('Achievements unlocked /achievements')) fail.push('no achievements unlocked unique screen');
if (!names.includes('Training loading /training')) fail.push('no training loading unique screen');
if (!names.includes('Speed loading /speed')) fail.push('no speed loading unique screen');
if (!names.includes('Review loading /review')) fail.push('no review loading unique screen');
if (!names.includes('Mobile Leaderboard period empty 390')) fail.push('no mobile leaderboard period-empty unique screen');
if (!names.includes('Guest / Verify email loading')) fail.push('no verify loading capture');
if (!names.includes('Guest / Verify email ok')) fail.push('no verify success capture');
if (!names.includes('Learner / Achievements loading')) fail.push('no achievements loading capture');
if (!names.includes('Learner / Achievements unlocked')) fail.push('no achievements unlocked capture');
if (!names.includes('Learner / Training loading')) fail.push('no training loading capture');
if (!names.includes('Learner / Speed loading')) fail.push('no speed loading capture');
if (!names.includes('Learner / Review loading')) fail.push('no review loading capture');
if (!names.includes('Mobile / Leaderboard period empty')) fail.push('no mobile leaderboard period-empty capture');

let verifyLoadUnique = null;
let verifyOkUnique = null;
let achLoadUnique = null;
let achUnlockUnique = null;
let trainLoadUnique = null;
let speedLoadUnique = null;
let reviewLoadUnique = null;
let mobileLbPeriodUnique = null;
for (const p of pages) {
  verifyLoadUnique = verifyLoadUnique || findByName(p, 'Verify email loading /verify-email');
  verifyOkUnique = verifyOkUnique || findByName(p, 'Verify email ok /verify-email');
  achLoadUnique = achLoadUnique || findByName(p, 'Achievements loading /achievements');
  achUnlockUnique = achUnlockUnique || findByName(p, 'Achievements unlocked /achievements');
  trainLoadUnique = trainLoadUnique || findByName(p, 'Training loading /training');
  speedLoadUnique = speedLoadUnique || findByName(p, 'Speed loading /speed');
  reviewLoadUnique = reviewLoadUnique || findByName(p, 'Review loading /review');
  mobileLbPeriodUnique = mobileLbPeriodUnique || findByName(p, 'Mobile Leaderboard period empty 390');
}
if (!verifyLoadUnique || !namesUnder(verifyLoadUnique).includes('Проверяем ссылку…') || namesUnder(verifyLoadUnique).includes('Выйти')) {
  fail.push('verify loading unique should show Проверяем ссылку… with guest chrome');
}
if (!verifyOkUnique || !namesUnder(verifyOkUnique).includes('Email подтверждён. Теперь можно войти.') || !namesUnder(verifyOkUnique).includes('Войти')) {
  fail.push('verify success unique missing live API message + Войти');
}
if (!achLoadUnique || !namesUnder(achLoadUnique).includes('Skeleton instance')) {
  fail.push('achievements loading unique missing Skeleton instance');
}
if (!achUnlockUnique || !namesUnder(achUnlockUnique).includes('Первая победа') || !namesUnder(achUnlockUnique).includes('Achievement instance')) {
  fail.push('achievements unlocked unique missing live Первая победа card');
}
if (!trainLoadUnique || !namesUnder(trainLoadUnique).includes('Skeleton instance') || !namesUnder(trainLoadUnique).includes('Rail')) {
  fail.push('training loading unique should keep PracticeShell rail');
}
if (!speedLoadUnique || !namesUnder(speedLoadUnique).includes('Скорость')) {
  fail.push('speed loading unique missing Speed rail active state');
}
if (!reviewLoadUnique || !namesUnder(reviewLoadUnique).includes('Повторение')) {
  fail.push('review loading unique missing Review rail active state');
}
if (!mobileLbPeriodUnique || !namesUnder(mobileLbPeriodUnique).includes('За этот период пока никого') || !namesUnder(mobileLbPeriodUnique).includes('Выйти')) {
  fail.push('mobile period-empty unique should keep authed chrome + week empty copy');
}

if (!names.includes('Admin course editor /admin')) fail.push('no admin course-editor unique screen');
if (!names.includes('Admin course create /admin')) fail.push('no admin course-create unique screen');
if (!names.includes('Admin courses empty /admin')) fail.push('no admin courses-empty unique screen');
if (!names.includes('Admin course editor loading /admin')) fail.push('no admin course-editor loading unique screen');
if (!names.includes('Exam loading /exam')) fail.push('no exam loading unique screen');
if (!names.includes('Leaderboard outside top /leaderboard')) fail.push('no leaderboard outside-top unique screen');
if (!names.includes('Назад к курсам')) fail.push('no live admin editor back unique screen');
if (!names.includes('Ваше место: #12 · 40 XP')) fail.push('no live leaderboard outside-top banner unique screen');
if (!names.includes('Пока пусто')) fail.push('no live admin empty copy unique screen');
if (!names.includes('Admin / Course editor')) fail.push('no admin course-editor capture');
if (!names.includes('Admin / Course create')) fail.push('no admin course-create capture');
if (!names.includes('Learner / Exam loading')) fail.push('no exam loading capture');
if (!names.includes('Learner / Leaderboard outside top')) fail.push('no leaderboard outside-top capture');

let adminEditorUnique = null;
let adminCreateUnique = null;
let adminEmptyUnique = null;
let adminEditorLoadUnique = null;
let examLoadUnique = null;
let lbOutsideUnique = null;
for (const p of pages) {
  adminEditorUnique = adminEditorUnique || findByName(p, 'Admin course editor /admin');
  adminCreateUnique = adminCreateUnique || findByName(p, 'Admin course create /admin');
  adminEmptyUnique = adminEmptyUnique || findByName(p, 'Admin courses empty /admin');
  adminEditorLoadUnique = adminEditorLoadUnique || findByName(p, 'Admin course editor loading /admin');
  examLoadUnique = examLoadUnique || findByName(p, 'Exam loading /exam');
  lbOutsideUnique = lbOutsideUnique || findByName(p, 'Leaderboard outside top /leaderboard');
}
if (!adminEditorUnique || !namesUnder(adminEditorUnique).includes('Назад к курсам') || !namesUnder(adminEditorUnique).includes('Файлы и папки') || !namesUnder(adminEditorUnique).includes('Файл и папка')) {
  fail.push('admin course-editor unique missing live back + first category/lessons');
}
if (adminEditorUnique && namesUnder(adminEditorUnique).includes('Папка Practice')) {
  fail.push('admin course-editor unique should not duplicate all 16 lessons');
}
if (!adminCreateUnique || !namesUnder(adminCreateUnique).includes('keyboard') || !namesUnder(adminCreateUnique).includes('Отмена') || !namesUnder(adminCreateUnique).includes('Сохранить')) {
  fail.push('admin course-create unique missing live default icon keyboard + save/cancel');
}
if (!adminEmptyUnique || !namesUnder(adminEmptyUnique).includes('Пока пусто') || namesUnder(adminEmptyUnique).includes('EmptyState instance')) {
  fail.push('admin courses empty unique should be a paragraph, not EmptyState');
}
if (!adminEditorLoadUnique || !namesUnder(adminEditorLoadUnique).includes('Skeleton instance') || namesUnder(adminEditorLoadUnique).includes('Назад к курсам')) {
  fail.push('admin course-editor loading unique should keep tabs + skeleton without back control');
}
if (!examLoadUnique || !namesUnder(examLoadUnique).includes('Skeleton instance') || !namesUnder(examLoadUnique).includes('Rail')) {
  fail.push('exam loading unique should keep PracticeShell rail + run-phase skeletons');
}
if (!lbOutsideUnique || !namesUnder(lbOutsideUnique).includes('Ваше место: #12 · 40 XP') || !namesUnder(lbOutsideUnique).includes('Алиса') || !namesUnder(lbOutsideUnique).includes('@alice')) {
  fail.push('leaderboard outside-top unique missing live #12 banner + 2-1-3 podium');
}

if (!names.includes('Path loading /path')) fail.push('no path loading unique screen');
if (!names.includes('Stats loading /stats')) fail.push('no stats loading unique screen');
if (!names.includes('Dashboard daily empty /dashboard')) fail.push('no dashboard daily-empty unique screen');
if (!names.includes('Dashboard loading /dashboard')) fail.push('no dashboard loading unique screen');
if (!names.includes('Route fallback')) fail.push('no App PageFallback unique screen');
if (!names.includes('Admin overview loading /admin')) fail.push('no admin overview-loading unique screen');
if (!names.includes('Admin users loading /admin')) fail.push('no admin users-loading unique screen');
if (!names.includes('Admin achievement create /admin')) fail.push('no admin achievement-create unique screen');
if (!names.includes('Задания на сегодня появятся после следующей активности.')) {
  fail.push('no live dashboard dailyEmptyDesc unique screen');
}
if (!names.includes('trophy')) fail.push('no live admin achievement default icon unique screen');
if (!names.includes('correct_answers')) fail.push('no live admin achievement condition_type unique screen');
if (!names.includes('Learner / Path loading')) fail.push('no path loading capture');
if (!names.includes('Learner / Stats loading')) fail.push('no stats loading capture');
if (!names.includes('Learner / Dashboard daily empty')) fail.push('no dashboard daily-empty capture');
if (!names.includes('Learner / Dashboard loading')) fail.push('no dashboard loading capture');
if (!names.includes('Admin / Overview loading')) fail.push('no admin overview-loading capture');
if (!names.includes('Admin / Users loading')) fail.push('no admin users-loading capture');
if (!names.includes('Admin / Achievement create')) fail.push('no admin achievement-create capture');

let pathLoadUnique = null;
let statsLoadUnique = null;
let dashEmptyUnique = null;
let dashLoadUnique = null;
let routeFallbackUnique = null;
let adminOvLoadUnique = null;
let adminUsersLoadUnique = null;
let adminAchCreateUnique = null;
for (const p of pages) {
  pathLoadUnique = pathLoadUnique || findByName(p, 'Path loading /path');
  statsLoadUnique = statsLoadUnique || findByName(p, 'Stats loading /stats');
  dashEmptyUnique = dashEmptyUnique || findByName(p, 'Dashboard daily empty /dashboard');
  dashLoadUnique = dashLoadUnique || findByName(p, 'Dashboard loading /dashboard');
  routeFallbackUnique = routeFallbackUnique || findByName(p, 'Route fallback');
  adminOvLoadUnique = adminOvLoadUnique || findByName(p, 'Admin overview loading /admin');
  adminUsersLoadUnique = adminUsersLoadUnique || findByName(p, 'Admin users loading /admin');
  adminAchCreateUnique = adminAchCreateUnique || findByName(p, 'Admin achievement create /admin');
}
if (!pathLoadUnique || !namesUnder(pathLoadUnique).includes('Developer Growth Path') || !namesUnder(pathLoadUnique).includes('Skeleton instance')) {
  fail.push('path loading unique should keep hero + 5 course skeletons');
}
if (!statsLoadUnique || !namesUnder(statsLoadUnique).includes('Статистика') || !namesUnder(statsLoadUnique).includes('Skeleton instance') || namesUnder(statsLoadUnique).includes('Ответы')) {
  fail.push('stats loading unique should be title + h-64 without the answers chart');
}
if (!dashEmptyUnique || !namesUnder(dashEmptyUnique).includes('Задания на сегодня появятся после следующей активности.') || namesUnder(dashEmptyUnique).includes('Получить XP')) {
  fail.push('dashboard daily-empty unique missing live paragraph or still shows filled daily rows');
}
if (!dashLoadUnique || !namesUnder(dashLoadUnique).includes('PathStageStrip loading') || namesUnder(dashLoadUnique).includes('Ближайшие этапы')) {
  fail.push('dashboard loading unique should use PathStageStrip skeletons without stages heading');
}
if (!routeFallbackUnique || !namesUnder(routeFallbackUnique).includes('Skeleton instance')) {
  fail.push('route fallback unique missing Skeleton instance');
}
if (!adminOvLoadUnique || !namesUnder(adminOvLoadUnique).includes('Skeleton instance') || namesUnder(adminOvLoadUnique).includes('Уроков пройдено')) {
  fail.push('admin overview loading unique should keep tabs without overview tiles');
}
if (!adminUsersLoadUnique || !namesUnder(adminUsersLoadUnique).includes('Skeleton instance') || namesUnder(adminUsersLoadUnique).includes('Поиск…')) {
  fail.push('admin users loading unique should be Skeleton h-48 without search');
}
if (!adminAchCreateUnique || !namesUnder(adminAchCreateUnique).includes('trophy') || !namesUnder(adminAchCreateUnique).includes('correct_answers') || !namesUnder(adminAchCreateUnique).includes('Отмена')) {
  fail.push('admin achievement-create unique missing live trophy / correct_answers defaults');
}

if (!names.includes('Этот компьютер')) fail.push('no live desktop Этот компьютер unique screen');
if (!names.includes('Desktop context menu /simulator?mode=desktop')) fail.push('no desktop context-menu unique screen');
if (!names.includes('Desktop explorer /simulator?mode=desktop')) fail.push('no desktop explorer unique screen');
if (!names.includes('Desktop recycle-bin /simulator?mode=desktop')) fail.push('no desktop recycle-bin unique screen');
if (!names.includes('Code Lab command palette /simulator')) fail.push('no code-lab command-palette unique screen');
if (!names.includes('Admin add lesson /admin')) fail.push('no admin add-lesson unique screen');
if (!names.includes('Открыть проводник')) fail.push('no live desktop wallpaper context-menu unique screen');
if (!names.includes('Эта папка пуста')) fail.push('no live recycle-bin empty unique screen');
if (!names.includes('Type a command...')) fail.push('no live command-palette placeholder unique screen');
if (!names.includes('File: New File')) fail.push('no live command-palette File: New File unique screen');
if (!names.includes('Через + , например Control+Shift+P')) fail.push('no live admin keysHint unique screen');
if (!names.includes('ТЕКУЩАЯ · 1/12')) fail.push('no live desktop currentTaskLine unique screen');
if (!names.includes('Заработано 0 XP')) fail.push('no live desktop xpEarned unique screen');
if (!names.includes('Learner / Desktop context menu')) fail.push('no desktop context-menu capture');
if (!names.includes('Learner / Desktop explorer')) fail.push('no desktop explorer capture');
if (!names.includes('Learner / Desktop recycle-bin')) fail.push('no desktop recycle-bin capture');
if (!names.includes('Learner / Code Lab command palette')) fail.push('no code-lab palette capture');
if (!names.includes('Admin / Add lesson')) fail.push('no admin add-lesson capture');

let deskUnique = null;
let deskMenuUnique = null;
let deskExplUnique = null;
let deskTrashUnique = null;
let palUnique = null;
let addLessonUnique = null;
for (const p of pages) {
  deskUnique = deskUnique || findByName(p, 'Desktop');
  deskMenuUnique = deskMenuUnique || findByName(p, 'Desktop context menu /simulator?mode=desktop');
  deskExplUnique = deskExplUnique || findByName(p, 'Desktop explorer /simulator?mode=desktop');
  deskTrashUnique = deskTrashUnique || findByName(p, 'Desktop recycle-bin /simulator?mode=desktop');
  palUnique = palUnique || findByName(p, 'Code Lab command palette /simulator');
  addLessonUnique = addLessonUnique || findByName(p, 'Admin add lesson /admin');
}
if (!deskUnique || !namesUnder(deskUnique).includes('Этот компьютер') || !namesUnder(deskUnique).includes('С чего начать')) {
  fail.push('desktop unique missing live Этот компьютер icon + first-run hint');
}
if (!deskMenuUnique || !namesUnder(deskMenuUnique).includes('Новый файл') || !namesUnder(deskMenuUnique).includes('Открыть проводник') || namesUnder(deskMenuUnique).includes('С чего начать')) {
  fail.push('desktop context-menu unique should show wallpaper menu without first-run');
}
if (!deskExplUnique || !namesUnder(deskExplUnique).includes('/Рабочий стол') || !namesUnder(deskExplUnique).includes('1 объектов')) {
  fail.push('desktop explorer unique missing live Проводник path + item count');
}
if (!deskTrashUnique || !namesUnder(deskTrashUnique).includes('Эта папка пуста') || !namesUnder(deskTrashUnique).includes('/Корзина')) {
  fail.push('desktop recycle-bin unique missing live empty trash');
}
if (!palUnique || !namesUnder(palUnique).includes('Type a command...') || !namesUnder(palUnique).includes('Ctrl+N')) {
  fail.push('code lab palette unique missing live command overlay');
}
if (!addLessonUnique || !namesUnder(addLessonUnique).includes('Через + , например Control+Shift+P') || !namesUnder(addLessonUnique).includes('Control+C') || namesUnder(addLessonUnique).includes('Папка Practice')) {
  fail.push('admin add-lesson unique missing live keysHint defaults or duplicates later lessons');
}

if (!names.includes('Code Lab quick open /simulator')) fail.push('no code-lab quick-open unique screen');
if (!names.includes('Desktop start menu /simulator?mode=desktop')) fail.push('no desktop start-menu unique screen');
if (!names.includes('Desktop editor /simulator?mode=desktop')) fail.push('no desktop editor unique screen');
if (!names.includes('Search files by name...')) fail.push('no live quick-open placeholder unique screen');
if (!names.includes('Закреплено')) fail.push('no live desktop Start pinned unique screen');
if (!names.includes('Welcome to Keymaster Desktop Simulator!')) fail.push('no live Welcome.txt editor unique screen');
if (!names.includes('184 симв. · 5 строк')) fail.push('no live editorStats unique screen');
if (!names.includes('Learner / Code Lab quick open')) fail.push('no code-lab quick-open capture');
if (!names.includes('Learner / Desktop start menu')) fail.push('no desktop start-menu capture');
if (!names.includes('Learner / Desktop editor')) fail.push('no desktop editor capture');

let simQuickUnique = null;
let deskStartUnique = null;
let deskEditorUnique = null;
for (const p of pages) {
  simQuickUnique = simQuickUnique || findByName(p, 'Code Lab quick open /simulator');
  deskStartUnique = deskStartUnique || findByName(p, 'Desktop start menu /simulator?mode=desktop');
  deskEditorUnique = deskEditorUnique || findByName(p, 'Desktop editor /simulator?mode=desktop');
}
if (!simQuickUnique || !namesUnder(simQuickUnique).includes('Search files by name...') || namesUnder(simQuickUnique).includes('File: New File')) {
  fail.push('code lab quick-open unique should list files, not command palette rows');
}
if (!deskStartUnique || !namesUnder(deskStartUnique).includes('Закреплено') || !namesUnder(deskStartUnique).includes('Клавиатура') || namesUnder(deskStartUnique).includes('С чего начать')) {
  fail.push('desktop start-menu unique missing live pinned apps without first-run');
}
if (!deskEditorUnique || !namesUnder(deskEditorUnique).includes('Сохранить') || !namesUnder(deskEditorUnique).includes('184 симв. · 5 строк')) {
  fail.push('desktop editor unique missing live Welcome.txt save + editorStats');
}

if (!names.includes('Code Lab terminal /simulator')) fail.push('no code-lab terminal unique screen');
if (!names.includes('Desktop keyboard /simulator?mode=desktop')) fail.push('no desktop keyboard unique screen');
if (!names.includes('Desktop properties /simulator?mode=desktop')) fail.push('no desktop properties unique screen');
if (!names.includes('python index.py · node app.js · run page.html · help')) fail.push('no live Code Lab terminal help unique screen');
if (!names.includes('184 байт')) fail.push('no live Welcome.txt properties size unique screen');
if (!names.includes('Расположение')) fail.push('no live properties location unique screen');
if (!names.includes('Learner / Code Lab terminal')) fail.push('no code-lab terminal capture');
if (!names.includes('Learner / Desktop keyboard')) fail.push('no desktop keyboard capture');
if (!names.includes('Learner / Desktop properties')) fail.push('no desktop properties capture');

let simTermUnique = null;
let deskKbUnique = null;
let deskPropsUnique = null;
for (const p of pages) {
  simTermUnique = simTermUnique || findByName(p, 'Code Lab terminal /simulator');
  deskKbUnique = deskKbUnique || findByName(p, 'Desktop keyboard /simulator?mode=desktop');
  deskPropsUnique = deskPropsUnique || findByName(p, 'Desktop properties /simulator?mode=desktop');
}
if (!simTermUnique || !namesUnder(simTermUnique).includes('$ ~') || !namesUnder(simTermUnique).includes('python index.py · node app.js · run page.html · help')) {
  fail.push('code lab terminal unique missing live Terminal help + prompt');
}
if (!deskKbUnique || !namesUnder(deskKbUnique).includes('Esc  F1  F2  F3  F4  F5  F6  F7  F8  F9  F10  F11  F12') || namesUnder(deskKbUnique).includes('С чего начать')) {
  fail.push('desktop keyboard unique missing expanded F-keys without first-run');
}
if (!deskPropsUnique || !namesUnder(deskPropsUnique).includes('184 байт') || !namesUnder(deskPropsUnique).includes('Закрыть') || namesUnder(deskPropsUnique).includes('С чего начать')) {
  fail.push('desktop properties unique missing live Welcome.txt size + close');
}

if (!names.includes('Code Lab find /simulator')) fail.push('no code-lab find unique screen');
if (!names.includes('Code Lab search /simulator')) fail.push('no code-lab search unique screen');
if (!names.includes('Code Lab source control /simulator')) fail.push('no code-lab scm unique screen');
if (!names.includes('Code Lab run /simulator')) fail.push('no code-lab run unique screen');
if (!names.includes('Code Lab extensions /simulator')) fail.push('no code-lab extensions unique screen');
if (!names.includes('Desktop file menu /simulator?mode=desktop')) fail.push('no desktop file-menu unique screen');
if (!names.includes('Search across files')) fail.push('no live Code Lab search placeholder unique screen');
if (!names.includes('Git не подключён')) fail.push('no live Code Lab SCM empty unique screen');
if (!names.includes('Run (F5)')) fail.push('no live Code Lab Run (F5) unique screen');
if (!names.includes('EXTENSIONS & LAB')) fail.push('no live Code Lab extensions header unique screen');
if (!names.includes('# Keymaster Project')) fail.push('no live README find unique screen');
if (!names.includes('Открыть с помощью Code')) fail.push('no live desktop file-menu unique screen');
if (!names.includes('Learner / Code Lab find')) fail.push('no code-lab find capture');
if (!names.includes('Learner / Code Lab search')) fail.push('no code-lab search capture');
if (!names.includes('Learner / Code Lab source control')) fail.push('no code-lab scm capture');
if (!names.includes('Learner / Code Lab run')) fail.push('no code-lab run capture');
if (!names.includes('Learner / Code Lab extensions')) fail.push('no code-lab extensions capture');
if (!names.includes('Learner / Desktop file menu')) fail.push('no desktop file-menu capture');

let simFindUnique = null;
let simSearchUnique = null;
let simScmUnique = null;
let simRunUnique = null;
let simExtUnique = null;
let deskFileMenuUnique = null;
for (const p of pages) {
  simFindUnique = simFindUnique || findByName(p, 'Code Lab find /simulator');
  simSearchUnique = simSearchUnique || findByName(p, 'Code Lab search /simulator');
  simScmUnique = simScmUnique || findByName(p, 'Code Lab source control /simulator');
  simRunUnique = simRunUnique || findByName(p, 'Code Lab run /simulator');
  simExtUnique = simExtUnique || findByName(p, 'Code Lab extensions /simulator');
  deskFileMenuUnique = deskFileMenuUnique || findByName(p, 'Desktop file menu /simulator?mode=desktop');
}
if (!simFindUnique || !namesUnder(simFindUnique).includes('Find') || !namesUnder(simFindUnique).includes('0 results') || !namesUnder(simFindUnique).includes('# Keymaster Project')) {
  fail.push('code lab find unique missing live Find bar + README');
}
if (!simSearchUnique || !namesUnder(simSearchUnique).includes('SEARCH') || !namesUnder(simSearchUnique).includes('Search across files') || !namesUnder(simSearchUnique).includes('Type to search across all files') || namesUnder(simSearchUnique).includes('EXPLORER')) {
  fail.push('code lab search unique missing live Search panel without Explorer tree');
}
if (!simScmUnique || !namesUnder(simScmUnique).includes('SOURCE CONTROL') || !namesUnder(simScmUnique).includes('Git не подключён')) {
  fail.push('code lab scm unique missing live Git empty copy');
}
if (!simRunUnique || !namesUnder(simRunUnique).includes('RUN AND DEBUG') || !namesUnder(simRunUnique).includes('Нет открытого файла. Откройте файл из Explorer.') || !namesUnder(simRunUnique).includes('run file.py')) {
  fail.push('code lab run unique missing live empty-file copy');
}
if (!simExtUnique || !namesUnder(simExtUnique).includes('EXTENSIONS & LAB') || !namesUnder(simExtUnique).includes('Показать клавиатуру') || !namesUnder(simExtUnique).includes('Папка с компьютера') || !namesUnder(simExtUnique).includes('Скрыть Tasks')) {
  fail.push('code lab extensions unique missing live Extensions & Lab copy');
}
if (!deskFileMenuUnique || !namesUnder(deskFileMenuUnique).includes('Открыть с помощью Code') || namesUnder(deskFileMenuUnique).includes('Открыть проводник') || namesUnder(deskFileMenuUnique).includes('С чего начать')) {
  fail.push('desktop file-menu unique should be Welcome.txt menu, not wallpaper');
}

if (!names.includes('Code Lab file menu /simulator')) fail.push('no code-lab file-menu unique screen');
if (!names.includes('Code Lab view menu /simulator')) fail.push('no code-lab view-menu unique screen');
if (!names.includes('Code Lab edit menu /simulator')) fail.push('no code-lab edit-menu unique screen');
if (!names.includes('Code Lab go menu /simulator')) fail.push('no code-lab go-menu unique screen');
if (!names.includes('Code Lab run menu /simulator')) fail.push('no code-lab run-menu unique screen');
if (!names.includes('Code Lab terminal menu /simulator')) fail.push('no code-lab terminal-menu unique screen');
if (!names.includes('Code Lab help menu /simulator')) fail.push('no code-lab help-menu unique screen');
if (!names.includes('Code Lab manage /simulator')) fail.push('no code-lab manage unique screen');
if (!names.includes('Code Lab light /simulator')) fail.push('no code-lab light unique screen');
if (!names.includes('Desktop light /simulator?mode=desktop')) fail.push('no desktop light unique screen');
if (!names.includes('Code Lab toast /simulator')) fail.push('no code-lab toast unique screen');
if (!names.includes('Desktop toast /simulator?mode=desktop')) fail.push('no desktop toast unique screen');
if (!names.includes('Desktop all complete /simulator?mode=desktop')) fail.push('no desktop all-complete unique screen');
if (!names.includes('Code Lab new file /simulator')) fail.push('no code-lab new-file unique screen');
if (!names.includes('Code Lab hint /simulator')) fail.push('no code-lab hint unique screen');
if (!names.includes('Desktop from lesson /simulator?mode=desktop')) fail.push('no desktop from-lesson unique screen');
if (!names.includes('File saved')) fail.push('no live Code Lab File saved toast unique screen');
if (!names.includes('Все задачи выполнены!')) fail.push('no live desktop all-complete unique screen');
if (!names.includes('Вы заработали 160 XP. Отличная работа!')) fail.push('no live desktop all-complete XP copy');
if (!names.includes('filename.js')) fail.push('no live Code Lab filename.js inline create unique screen');
if (!names.includes('Подсказка 1: Папку нужно создать на верхнем уровне проекта.')) fail.push('no live Code Lab hint-1 unique screen');
if (!names.includes('← К уроку')) fail.push('no live desktop from-lesson back link unique screen');
if (!names.includes('Code Lab current task /simulator')) fail.push('no code-lab current-task unique screen');
if (!names.includes('Code Lab task in progress /simulator')) fail.push('no code-lab in-progress task unique screen');
if (!names.includes('Задача выполнена!')) fail.push('no live Code Lab task-completed unique screen');
if (!names.includes('Следующая задача')) fail.push('no live Code Lab next-task unique screen');
if (!names.includes('Code Lab all tasks /simulator')) fail.push('no code-lab all-tasks unique screen');
if (!names.includes('Code Lab preview /simulator')) fail.push('no code-lab preview unique screen');
if (!names.includes('Code Lab keyboard /simulator')) fail.push('no code-lab keyboard unique screen');
if (!names.includes('Open Folder from Computer…')) fail.push('no live Code Lab File menu unique screen');
if (!names.includes('Создать новый файл')) fail.push('no live first Code Lab task unique screen');
if (!names.includes('Подсказка (0/3)')) fail.push('no live Code Lab hint counter unique screen');
if (!names.includes('PREVIEW — INDEX.HTML')) fail.push('no live Code Lab preview header unique screen');
if (!names.includes('KEYBOARD VISUALIZER')) fail.push('no live Code Lab keyboard visualizer unique screen');
if (!names.includes('Toggle Primary Side Bar')) fail.push('no live Code Lab View menu unique screen');
if (!names.includes('Replace')) fail.push('no live Code Lab Edit menu unique screen');
if (!names.includes('Reopen Closed Tab')) fail.push('no live Code Lab Go menu unique screen');
if (!names.includes('Start First Task')) fail.push('no live Code Lab Run menu unique screen');
if (!names.includes('Clear Terminal')) fail.push('no live Code Lab Terminal menu unique screen');
if (!names.includes('Show Hint')) fail.push('no live Code Lab Help menu unique screen');
if (!names.includes('Color Theme')) fail.push('no live Code Lab Manage menu unique screen');
if (!names.includes('Learner / Code Lab file menu')) fail.push('no code-lab file-menu capture');
if (!names.includes('Learner / Code Lab view menu')) fail.push('no code-lab view-menu capture');
if (!names.includes('Learner / Code Lab edit menu')) fail.push('no code-lab edit-menu capture');
if (!names.includes('Learner / Code Lab go menu')) fail.push('no code-lab go-menu capture');
if (!names.includes('Learner / Code Lab run menu')) fail.push('no code-lab run-menu capture');
if (!names.includes('Learner / Code Lab terminal menu')) fail.push('no code-lab terminal-menu capture');
if (!names.includes('Learner / Code Lab help menu')) fail.push('no code-lab help-menu capture');
if (!names.includes('Learner / Code Lab light')) fail.push('no code-lab light capture');
if (!names.includes('Learner / Desktop light')) fail.push('no desktop light capture');
if (!names.includes('Learner / Code Lab toast')) fail.push('no code-lab toast capture');
if (!names.includes('Learner / Desktop toast')) fail.push('no desktop toast capture');
if (!names.includes('Learner / Desktop all complete')) fail.push('no desktop all-complete capture');
if (!names.includes('Learner / Code Lab new file')) fail.push('no code-lab new-file capture');
if (!names.includes('Learner / Code Lab hint')) fail.push('no code-lab hint capture');
if (!names.includes('Learner / Desktop from lesson')) fail.push('no desktop from-lesson capture');
if (!names.includes('Learner / Code Lab current task')) fail.push('no code-lab current-task capture');
if (!names.includes('Learner / Code Lab task in progress')) fail.push('no code-lab in-progress task capture');
if (!names.includes('Learner / Code Lab all tasks')) fail.push('no code-lab all-tasks capture');
if (!names.includes('Learner / Code Lab preview')) fail.push('no code-lab preview capture');
if (!names.includes('Learner / Code Lab keyboard')) fail.push('no code-lab keyboard capture');
if (!names.includes('Learner / Code Lab manage')) fail.push('no code-lab manage capture');

let simFileMenuUnique = null;
let simViewMenuUnique = null;
let simTaskUnique = null;
let simTaskRunUnique = null;
let simTaskListUnique = null;
let simPreviewUnique = null;
let simKbVizUnique = null;
let simManageUnique = null;
let simEditMenuUnique = null;
let simGoMenuUnique = null;
let simRunMenuUnique = null;
let simTermMenuUnique = null;
let simHelpMenuUnique = null;
let simLightUnique = null;
let deskLightUnique = null;
let simToastUnique = null;
let deskTaskToastUnique = null;
let deskAllCompleteUnique = null;
let simNewFileUnique = null;
let simHintUnique = null;
let deskFromLessonUnique = null;
let deskHintUnique = null;
let speedRunUnique = null;
let typingBusyUnique = null;
let typingPausedUnique = null;
let typingResultUnique = null;
let deskNewFolderUnique = null;
let trainExplainUnique = null;
let trainHintUnique = null;
let trainHint2Unique = null;
let quizFinishedUnique = null;
let deskTrashFullUnique = null;
let deskExplorerFileMenuUnique = null;
let deskTrashRestoreUnique = null;
let trainCorrectUnique = null;
let examTimeoutUnique = null;
for (const p of pages) {
  simFileMenuUnique = simFileMenuUnique || findByName(p, 'Code Lab file menu /simulator');
  simViewMenuUnique = simViewMenuUnique || findByName(p, 'Code Lab view menu /simulator');
  simTaskUnique = simTaskUnique || findByName(p, 'Code Lab current task /simulator');
  simTaskRunUnique = simTaskRunUnique || findByName(p, 'Code Lab task in progress /simulator');
  simTaskListUnique = simTaskListUnique || findByName(p, 'Code Lab all tasks /simulator');
  simPreviewUnique = simPreviewUnique || findByName(p, 'Code Lab preview /simulator');
  simKbVizUnique = simKbVizUnique || findByName(p, 'Code Lab keyboard /simulator');
  simManageUnique = simManageUnique || findByName(p, 'Code Lab manage /simulator');
  simEditMenuUnique = simEditMenuUnique || findByName(p, 'Code Lab edit menu /simulator');
  simGoMenuUnique = simGoMenuUnique || findByName(p, 'Code Lab go menu /simulator');
  simRunMenuUnique = simRunMenuUnique || findByName(p, 'Code Lab run menu /simulator');
  simTermMenuUnique = simTermMenuUnique || findByName(p, 'Code Lab terminal menu /simulator');
  simHelpMenuUnique = simHelpMenuUnique || findByName(p, 'Code Lab help menu /simulator');
  simLightUnique = simLightUnique || findByName(p, 'Code Lab light /simulator');
  deskLightUnique = deskLightUnique || findByName(p, 'Desktop light /simulator?mode=desktop');
  simToastUnique = simToastUnique || findByName(p, 'Code Lab toast /simulator');
  deskTaskToastUnique = deskTaskToastUnique || findByName(p, 'Desktop toast /simulator?mode=desktop');
  deskAllCompleteUnique = deskAllCompleteUnique || findByName(p, 'Desktop all complete /simulator?mode=desktop');
  simNewFileUnique = simNewFileUnique || findByName(p, 'Code Lab new file /simulator');
  simHintUnique = simHintUnique || findByName(p, 'Code Lab hint /simulator');
  deskFromLessonUnique = deskFromLessonUnique || findByName(p, 'Desktop from lesson /simulator?mode=desktop');
  deskHintUnique = deskHintUnique || findByName(p, 'Desktop hint /simulator?mode=desktop');
  speedRunUnique = speedRunUnique || findByName(p, 'Speed run /speed');
  typingBusyUnique = typingBusyUnique || findByName(p, 'Typing busy /typing');
  typingPausedUnique = typingPausedUnique || findByName(p, 'Typing paused /typing');
  typingResultUnique = typingResultUnique || findByName(p, 'Typing result /typing');
  deskNewFolderUnique = deskNewFolderUnique || findByName(p, 'Desktop new folder /simulator?mode=desktop');
  trainExplainUnique = trainExplainUnique || findByName(p, 'Training explain /training');
  trainHintUnique = trainHintUnique || findByName(p, 'Training hint /training');
  trainHint2Unique = trainHint2Unique || findByName(p, 'Training hint 2 /training');
  quizFinishedUnique = quizFinishedUnique || findByName(p, 'Quiz finished /quiz');
  deskTrashFullUnique = deskTrashFullUnique || findByName(p, 'Desktop recycle-bin full /simulator?mode=desktop');
  deskExplorerFileMenuUnique = deskExplorerFileMenuUnique || findByName(p, 'Desktop explorer file menu /simulator?mode=desktop');
  deskTrashRestoreUnique = deskTrashRestoreUnique || findByName(p, 'Desktop recycle-bin restore /simulator?mode=desktop');
  trainCorrectUnique = trainCorrectUnique || findByName(p, 'Training correct /training');
  examTimeoutUnique = examTimeoutUnique || findByName(p, 'Exam timeout /exam');
}
if (!simFileMenuUnique || !namesUnder(simFileMenuUnique).includes('New File') || !namesUnder(simFileMenuUnique).includes('Open Folder from Computer…') || namesUnder(simFileMenuUnique).includes('File: New File')) {
  fail.push('code lab file-menu unique missing live File dropdown (not command palette)');
}
if (!simViewMenuUnique || !namesUnder(simViewMenuUnique).includes('Toggle Primary Side Bar') || !namesUnder(simViewMenuUnique).includes('Toggle Task Panel') || namesUnder(simViewMenuUnique).includes('Open Folder from Computer…')) {
  fail.push('code lab view-menu unique missing live View dropdown');
}
if (!simTaskUnique || !namesUnder(simTaskUnique).includes('Задача выполнена!') || !namesUnder(simTaskUnique).includes('Следующая задача') || namesUnder(simTaskUnique).includes('Готовы к практике?')) {
  fail.push('code lab current-task unique missing live auto-complete result');
}
if (!simTaskRunUnique || !namesUnder(simTaskRunUnique).includes('Создать папку') || !namesUnder(simTaskRunUnique).includes('В корне есть папка «assets»') || namesUnder(simTaskRunUnique).includes('Задача выполнена!')) {
  fail.push('code lab in-progress unique missing live Create Folder task at 0%');
}
if (!simTaskListUnique || !namesUnder(simTaskListUnique).includes('Все задачи') || !namesUnder(simTaskListUnique).includes('Создать папку') || namesUnder(simTaskListUnique).includes('Готовы к практике?')) {
  fail.push('code lab all-tasks unique missing live task list chrome');
}
if (!simPreviewUnique || !namesUnder(simPreviewUnique).includes('PREVIEW — INDEX.HTML') || !namesUnder(simPreviewUnique).includes('<!doctype html>')) {
  fail.push('code lab preview unique missing live Preview pane + index.html');
}
if (!simKbVizUnique || !namesUnder(simKbVizUnique).includes('KEYBOARD VISUALIZER') || !namesUnder(simKbVizUnique).includes('Bksp  Tab  Caps  Enter  Win  Space') || namesUnder(simKbVizUnique).includes('С чего начать')) {
  fail.push('code lab keyboard unique missing live Keyboard Visualizer chrome');
}
if (!simManageUnique || !namesUnder(simManageUnique).includes('Color Theme') || !namesUnder(simManageUnique).includes('Keyboard Visualizer') || !namesUnder(simManageUnique).includes('Extensions') || namesUnder(simManageUnique).includes('EXTENSIONS & LAB')) {
  fail.push('code lab manage unique missing live Manage menu copy');
}
if (!simEditMenuUnique || !namesUnder(simEditMenuUnique).includes('Undo') || !namesUnder(simEditMenuUnique).includes('Replace') || namesUnder(simEditMenuUnique).includes('Open Folder from Computer…')) {
  fail.push('code lab edit-menu unique missing live Edit dropdown');
}
if (!simGoMenuUnique || !namesUnder(simGoMenuUnique).includes('Go to File…') || !namesUnder(simGoMenuUnique).includes('Reopen Closed Tab')) {
  fail.push('code lab go-menu unique missing live Go dropdown');
}
if (!simRunMenuUnique || !namesUnder(simRunMenuUnique).includes('Run Code') || !namesUnder(simRunMenuUnique).includes('Start First Task') || namesUnder(simRunMenuUnique).includes('RUN AND DEBUG')) {
  fail.push('code lab run-menu unique missing live Run dropdown');
}
if (!simTermMenuUnique || !namesUnder(simTermMenuUnique).includes('Clear Terminal') || namesUnder(simTermMenuUnique).includes('python index.py · node app.js · run page.html · help')) {
  fail.push('code lab terminal-menu unique missing live Terminal dropdown');
}
if (!simHelpMenuUnique || !namesUnder(simHelpMenuUnique).includes('Show Hint') || !namesUnder(simHelpMenuUnique).includes('Skip Task')) {
  fail.push('code lab help-menu unique missing live Help dropdown');
}
if (!simLightUnique || !namesUnder(simLightUnique).includes('Готовы к практике?') || namesUnder(simLightUnique).includes('Color Theme') || namesUnder(simLightUnique).includes('С чего начать')) {
  fail.push('code lab light unique missing live light workbench');
}
if (!deskLightUnique || !namesUnder(deskLightUnique).includes('Этот компьютер') || namesUnder(deskLightUnique).includes('С чего начать') || namesUnder(deskLightUnique).includes('Закреплено')) {
  fail.push('desktop light unique should be light wallpaper without first-run tip or start menu');
}
if (!simToastUnique || !namesUnder(simToastUnique).includes('File saved') || !namesUnder(simToastUnique).includes('Готовы к практике?') || namesUnder(simToastUnique).includes('Color Theme')) {
  fail.push('code lab toast unique missing live File saved notification on idle workbench');
}
if (!deskTaskToastUnique || !namesUnder(deskTaskToastUnique).includes('Задача выполнена! +65 XP на счёт') || !namesUnder(deskTaskToastUnique).includes('ТЕКУЩАЯ · 1/12') || namesUnder(deskTaskToastUnique).includes('С чего начать') || namesUnder(deskTaskToastUnique).includes('Все задачи выполнены!')) {
  fail.push('desktop toast unique missing live task-complete pill on first-task chrome');
}
if (!deskAllCompleteUnique || !namesUnder(deskAllCompleteUnique).includes('Все задачи выполнены!') || !namesUnder(deskAllCompleteUnique).includes('Вы заработали 160 XP. Отличная работа!') || !namesUnder(deskAllCompleteUnique).includes('12/12') || namesUnder(deskAllCompleteUnique).includes('ТЕКУЩАЯ · 1/12') || namesUnder(deskAllCompleteUnique).includes('С чего начать')) {
  fail.push('desktop all-complete unique missing live 12/12 panel copy');
}
if (!simNewFileUnique || !namesUnder(simNewFileUnique).includes('filename.js') || !namesUnder(simNewFileUnique).includes('Готовы к практике?') || namesUnder(simNewFileUnique).includes('File: New File')) {
  fail.push('code lab new-file unique missing live filename.js inline create on idle workbench');
}
if (!simHintUnique || !namesUnder(simHintUnique).includes('Подсказка 1: Папку нужно создать на верхнем уровне проекта.') || !namesUnder(simHintUnique).includes('Подсказка (1/3)') || !namesUnder(simHintUnique).includes('Создать папку') || namesUnder(simHintUnique).includes('Готовы к практике?')) {
  fail.push('code lab hint unique missing live first Create Folder hint');
}
if (!deskFromLessonUnique || !namesUnder(deskFromLessonUnique).includes('← К уроку') || !namesUnder(deskFromLessonUnique).includes('Этот компьютер') || namesUnder(deskFromLessonUnique).includes('С чего начать')) {
  fail.push('desktop from-lesson unique missing live ← К уроку chrome');
}
if (!deskHintUnique || !namesUnder(deskHintUnique).includes('Скрыть подсказку') || !namesUnder(deskHintUnique).includes('Правый клик по пустому месту на обоях (не по панели браузера). Альтернатива: «Этот компьютер» → правый клик в пустой области → «Новая папка». Горячие клавиши: Ctrl+Shift+N.') || namesUnder(deskHintUnique).includes('С чего начать') || namesUnder(deskHintUnique).includes('Все задачи выполнены!')) {
  fail.push('desktop hint unique missing live expanded first-task hint');
}
if (!speedRunUnique || !namesUnder(speedRunUnique).includes('⏱ 1:00') || !namesUnder(speedRunUnique).includes('🔥 x0') || !namesUnder(speedRunUnique).includes('Нажмите сочетание на клавиатуре') || namesUnder(speedRunUnique).includes('Старт 60 сек') || namesUnder(speedRunUnique).includes('Время вышло!')) {
  fail.push('speed-run unique missing live running HUD without start/done chrome');
}
if (!typingBusyUnique || !namesUnder(typingBusyUnique).includes('Практика') || namesUnder(typingBusyUnique).includes('СЛЕПАЯ ПЕЧАТЬ') || namesUnder(typingBusyUnique).includes('Домашний ряд') || namesUnder(typingBusyUnique).includes('Тренажёр печати') || namesUnder(typingBusyUnique).includes('Пауза') || namesUnder(typingBusyUnique).includes('ПОДХОД ЗАВЕРШЁН')) {
  fail.push('typing-busy unique missing live in-session Практика chrome without idle eyebrow/chips');
}
if (!typingPausedUnique || !namesUnder(typingPausedUnique).includes('Пауза') || !namesUnder(typingPausedUnique).includes('Esc — продолжить') || !namesUnder(typingPausedUnique).includes('Продолжить') || namesUnder(typingPausedUnique).includes('СЛЕПАЯ ПЕЧАТЬ') || namesUnder(typingPausedUnique).includes('Тренажёр печати') || namesUnder(typingPausedUnique).includes('ПОДХОД ЗАВЕРШЁН')) {
  fail.push('typing-paused unique missing live Пауза overlay');
}
if (!typingResultUnique || !namesUnder(typingResultUnique).includes('ПОДХОД ЗАВЕРШЁН') || !namesUnder(typingResultUnique).includes('личный рекорд') || !namesUnder(typingResultUnique).includes('Новое достижение: Первая тренировка') || !namesUnder(typingResultUnique).includes('Точность уже хорошая — добавьте чуть темпа.') || !namesUnder(typingResultUnique).includes('Тренажёр печати') || namesUnder(typingResultUnique).includes('Пауза') || namesUnder(typingResultUnique).includes('Esc — продолжить')) {
  fail.push('typing-result unique missing live ResultCard copy');
}
if (!deskNewFolderUnique || !namesUnder(deskNewFolderUnique).includes('Новая папка') || !namesUnder(deskNewFolderUnique).includes('rename input') || namesUnder(deskNewFolderUnique).includes('С чего начать') || namesUnder(deskNewFolderUnique).includes('Открыть проводник')) {
  fail.push('desktop new-folder unique missing live inline rename without context menu or first-run');
}
if (!trainExplainUnique || !namesUnder(trainExplainUnique).includes('ЧТО ДЕЛАЕТ') || !namesUnder(trainExplainUnique).includes('К упражнению') || !namesUnder(trainExplainUnique).includes('Замена') || namesUnder(trainExplainUnique).includes('Нажмите сочетание на клавиатуре') || namesUnder(trainExplainUnique).includes('Подсказка')) {
  fail.push('training-explain unique missing live KeyboardTrainer back face');
}
if (!trainHintUnique || !namesUnder(trainHintUnique).includes('Начните с Ctrl') || !namesUnder(trainHintUnique).includes('Подсказка') || !namesUnder(trainHintUnique).includes('Слово вправо') || namesUnder(trainHintUnique).includes('К упражнению') || namesUnder(trainHintUnique).includes('Верно!')) {
  fail.push('training-hint unique missing live first-hint KeyboardTrainer front');
}
if (!trainHint2Unique || !namesUnder(trainHint2Unique).includes('Зажмите Ctrl, затем нажмите H') || !namesUnder(trainHint2Unique).includes('Показать ответ') || !namesUnder(trainHint2Unique).includes('Замена') || namesUnder(trainHint2Unique).includes('Начните с Ctrl') || namesUnder(trainHint2Unique).includes('К упражнению')) {
  fail.push('training-hint2 unique missing live second-hint KeyboardTrainer front');
}
if (!deskExplorerFileMenuUnique || !namesUnder(deskExplorerFileMenuUnique).includes('Сжать в ZIP') || !namesUnder(deskExplorerFileMenuUnique).includes('Свойства') || !namesUnder(deskExplorerFileMenuUnique).includes('Проводник') || namesUnder(deskExplorerFileMenuUnique).includes('Восстановить') || namesUnder(deskExplorerFileMenuUnique).includes('С чего начать')) {
  fail.push('explorer file-menu unique missing live Сжать в ZIP chrome');
}
if (!deskTrashRestoreUnique || !namesUnder(deskTrashRestoreUnique).includes('Восстановить') || !namesUnder(deskTrashRestoreUnique).includes('1 объектов') || !namesUnder(deskTrashRestoreUnique).includes('Welcome.txt') || namesUnder(deskTrashRestoreUnique).includes('Эта папка пуста') || namesUnder(deskTrashRestoreUnique).includes('С чего начать')) {
  fail.push('trash-restore unique missing live Восстановить menu on Корзина with file');
}
if (!quizFinishedUnique || !namesUnder(quizFinishedUnique).includes('Основы hotkeys — готово') || !namesUnder(quizFinishedUnique).includes('8 из 25') || !namesUnder(quizFinishedUnique).includes('Ещё раз') || namesUnder(quizFinishedUnique).includes('Дальше ›') || namesUnder(quizFinishedUnique).includes('Правильно!')) {
  fail.push('quiz-finished unique missing live end card Основы hotkeys — готово');
}
if (!deskTrashFullUnique || !namesUnder(deskTrashFullUnique).includes('1 объектов') || !namesUnder(deskTrashFullUnique).includes('Welcome.txt') || !namesUnder(deskTrashFullUnique).includes('TXT') || namesUnder(deskTrashFullUnique).includes('Эта папка пуста') || namesUnder(deskTrashFullUnique).includes('С чего начать')) {
  fail.push('desktop trash-full unique missing live Welcome.txt in Корзина');
}
if (!trainCorrectUnique || !namesUnder(trainCorrectUnique).includes('Верно!') || !namesUnder(trainCorrectUnique).includes('Далее →') || !namesUnder(trainCorrectUnique).includes('Автоматически через 2…') || !namesUnder(trainCorrectUnique).includes('Ctrl + H') || !namesUnder(trainCorrectUnique).includes('Серия: 1') || namesUnder(trainCorrectUnique).includes('Нажмите сочетание на клавиатуре') || namesUnder(trainCorrectUnique).includes('К упражнению') || namesUnder(trainCorrectUnique).includes('Тренировка завершена')) {
  fail.push('training-correct unique missing live waitingNext card');
}
if (!examTimeoutUnique || !namesUnder(examTimeoutUnique).includes('Время вышло') || !namesUnder(examTimeoutUnique).includes('10:02') || !namesUnder(examTimeoutUnique).includes('Без ответа') || namesUnder(examTimeoutUnique).includes('Сессия завершена')) {
  fail.push('exam-timeout unique missing live Время вышло result card');
}

console.log(JSON.stringify(report, null, 2));
if (fail.length) {
  console.error('DRY-RUN FAILED\n' + fail.join('\n'));
  process.exit(1);
}
console.log('DRY-RUN OK');
