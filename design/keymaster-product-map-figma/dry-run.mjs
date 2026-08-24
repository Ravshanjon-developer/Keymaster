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
      n.children.push(child);
      child.parent = n;
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
  createAutoLayout: (dir) => {
    const f = node('FRAME');
    f.layoutMode = dir || 'HORIZONTAL';
    return f;
  },
  createComponent: () => node('COMPONENT'),
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
  for (const c of n.children || []) walkNames(c);
}
for (const p of pages) walkNames(p);
if (!names.includes('IA — unique pages by layout')) fail.push('no IA sitemap');
if (!names.includes('Unique screens — editable as-is')) fail.push('no unique screen recreations');
if (!names.includes('User flows — screens')) fail.push('no visual flows');

console.log(JSON.stringify(report, null, 2));
if (fail.length) {
  console.error('DRY-RUN FAILED\n' + fail.join('\n'));
  process.exit(1);
}
console.log('DRY-RUN OK');
