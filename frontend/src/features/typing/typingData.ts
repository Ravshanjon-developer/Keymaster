import type { CodeLang, LayoutId, PathStage, TrainMode } from '@/features/typing/typingEngine'

export type TypingLesson = {
  id: string
  titleKey: 'homeRow' | 'topRow' | 'fullKeys' | 'words' | 'sentences'
  target: string
}

/** Kept for compatibility with older lesson chips. */
export const TYPING_LESSONS: TypingLesson[] = [
  {
    id: 'home',
    titleKey: 'homeRow',
    target: 'фыва олдж фыва олдж ваол джфы аовы лджф',
  },
  {
    id: 'top',
    titleKey: 'topRow',
    target: 'йцукен гшщзхъ йцук енгш щзхъ куен гшщз',
  },
  {
    id: 'full',
    titleKey: 'fullKeys',
    target: 'привет мир клавиатура учись быстро и точно каждый день',
  },
  {
    id: 'words',
    titleKey: 'words',
    target: 'файл папка документ сохранить открыть копировать вставить удалить найти',
  },
  {
    id: 'sentences',
    titleKey: 'sentences',
    target:
      'Я создаю папку для учёбы. Потом копирую файлы и сохраняю работу. Горячие клавиши помогают работать быстрее.',
  },
]

const RU_HOME = 'фывапролджэ'
const EN_HOME = 'asdfghjkl;'
const RU_LETTERS = 'йцукенгшщзхъфывапролджэячсмитьбю'
const EN_LETTERS = 'abcdefghijklmnopqrstuvwxyz'

const RU_WORDS_EASY = [
  'файл',
  'папка',
  'окно',
  'стол',
  'курс',
  'урок',
  'клавиша',
  'печать',
  'слово',
  'день',
  'работа',
  'школа',
  'мышь',
  'экран',
  'текст',
]
const RU_WORDS_HARD = [
  'документ',
  'сохранить',
  'копировать',
  'вставить',
  'удалить',
  'клавиатура',
  'приложение',
  'настройка',
  'производительность',
  'точность',
  'скорость',
  'сочетание',
]
const EN_WORDS_EASY = [
  'file',
  'open',
  'save',
  'copy',
  'paste',
  'type',
  'code',
  'word',
  'fast',
  'key',
  'home',
  'row',
  'shift',
  'space',
  'enter',
]
const EN_WORDS_HARD = [
  'document',
  'keyboard',
  'accuracy',
  'practice',
  'function',
  'variable',
  'shortcut',
  'terminal',
  'performance',
  'developer',
  'interface',
  'character',
]

const RU_SENTENCES = [
  'Смотрите на экран, а не на клавиши.',
  'Каждый день по десять минут быстрее, чем час раз в неделю.',
  'Сначала точность, потом скорость.',
  'Горячие клавиши экономят время в любой программе.',
  'Сохраните файл и откройте следующую папку.',
]
const EN_SENTENCES = [
  'Keep your eyes on the screen, not on the keys.',
  'Accuracy first, then speed will follow.',
  'Ten focused minutes every day beat one long session.',
  'Save the file and open the next folder.',
  'Shortcuts help you work without leaving the keyboard.',
]

export const CODE_SNIPPETS: Record<CodeLang, string[]> = {
  python: [
    'def greet(name):\n    return f"Hello, {name}!"\n',
    'items = [n * 2 for n in range(10) if n % 2 == 0]\nprint(items)\n',
    'def add(a, b):\n    return a + b\n',
  ],
  javascript: [
    'const total = items.reduce((sum, n) => sum + n, 0);\n',
    'function init(config) {\n  if (!config.isValid) return false;\n  return system.boot(config);\n}\n',
    'const user = { id: 1, name: "Ada" };\nconsole.log(user.name);\n',
  ],
  html: [
    '<div class="card">\n  <h1>Title</h1>\n</div>\n',
    '<button type="button" class="btn">Save</button>\n',
    '<input type="text" name="email" />\n',
  ],
  css: [
    '.btn { display: flex; gap: 8px; }\n',
    '.card { padding: 16px; border-radius: 12px; }\n',
    'a:hover { color: #2563eb; }\n',
  ],
  sql: [
    'SELECT id, name FROM users WHERE active = 1;\n',
    'UPDATE files SET name = "notes.txt" WHERE id = 4;\n',
    'INSERT INTO logs (user_id, action) VALUES (1, "save");\n',
  ],
  git: [
    'git commit -m "fix: handle empty list"\n',
    'git checkout -b feature/typing-trainer\n',
    'git add . && git status\n',
  ],
}

const SYMBOLS = '{}[]()<>:;/\\_=-+*|&^%$#@!?'
const NUMBERS = '0123456789'

function pick<T>(list: T[], rng: () => number): T {
  return list[Math.floor(rng() * list.length)] ?? list[0]
}

function shuffleJoin(chars: string, count: number, rng: () => number, group = 4): string {
  const out: string[] = []
  for (let i = 0; i < count; i++) {
    if (i > 0 && i % group === 0) out.push(' ')
    out.push(chars[Math.floor(rng() * chars.length)] ?? chars[0])
  }
  return out.join('')
}

function wordBank(layout: LayoutId, difficulty: number): string[] {
  if (layout === 'en') {
    return difficulty >= 3 ? [...EN_WORDS_EASY, ...EN_WORDS_HARD] : EN_WORDS_EASY
  }
  return difficulty >= 3 ? [...RU_WORDS_EASY, ...RU_WORDS_HARD] : RU_WORDS_EASY
}

export function generateWords(layout: LayoutId, count: number, difficulty: number, rng = Math.random): string {
  const bank = wordBank(layout, difficulty)
  const words: string[] = []
  for (let i = 0; i < count; i++) words.push(pick(bank, rng))
  return words.join(' ')
}

export function generateSentences(layout: LayoutId, count: number, rng = Math.random): string {
  const bank = layout === 'en' ? EN_SENTENCES : RU_SENTENCES
  const parts: string[] = []
  for (let i = 0; i < count; i++) parts.push(pick(bank, rng))
  return parts.join(' ')
}

export function generateCode(lang: CodeLang, rng = Math.random): string {
  return pick(CODE_SNIPPETS[lang], rng)
}

export function generateWeakDrill(keys: string[], layout: LayoutId, difficulty: number, rng = Math.random): string {
  const usable = keys.map((k) => (k === '␣' ? ' ' : k === '↵' ? '' : k)).filter((k) => k.length === 1)
  const base = layout === 'en' ? EN_HOME : RU_HOME
  const pool = (usable.join('') + base).replace(/\s+/g, '')
  const count = 48 + difficulty * 8
  return shuffleJoin(pool || base, count, rng, 5)
}

export function generateTarget(opts: {
  mode: TrainMode
  layout: LayoutId
  difficulty: number
  stage?: PathStage
  timeLimit?: number
  codeLang?: CodeLang
  weakKeys?: string[]
  rng?: () => number
}): string {
  const rng = opts.rng ?? Math.random
  const d = Math.min(5, Math.max(1, opts.difficulty))
  const layout = opts.layout

  if (opts.mode === 'weak') {
    return generateWeakDrill(opts.weakKeys ?? [], layout, d, rng)
  }
  if (opts.mode === 'time') {
    const extra = (opts.timeLimit ?? 30) >= 60 ? 40 : 24
    return generateWords(layout, 18 + d * 4 + extra, d, rng)
  }
  if (opts.mode === 'words') return generateWords(layout, 16 + d * 4, d, rng)
  if (opts.mode === 'sentences') return generateSentences(layout, 2 + Math.min(3, d), rng)
  if (opts.mode === 'numbers') return shuffleJoin(NUMBERS, 40 + d * 10, rng, 4)
  if (opts.mode === 'symbols') return shuffleJoin(SYMBOLS, 36 + d * 8, rng, 4)
  if (opts.mode === 'code') return generateCode(opts.codeLang ?? 'javascript', rng)

  const stage = opts.stage ?? 'home'
  if (stage === 'home') {
    const home = layout === 'en' ? EN_HOME : RU_HOME
    return shuffleJoin(home, 36 + d * 6, rng, 4)
  }
  if (stage === 'letters') {
    const letters = layout === 'en' ? EN_LETTERS : RU_LETTERS
    return shuffleJoin(letters, 40 + d * 8, rng, 5)
  }
  if (stage === 'words') return generateWords(layout, 14 + d * 3, d, rng)
  if (stage === 'sentences') return generateSentences(layout, 2 + Math.min(2, d), rng)
  if (stage === 'numbers') return shuffleJoin(NUMBERS, 36 + d * 8, rng, 4)
  if (stage === 'symbols') return shuffleJoin(SYMBOLS, 32 + d * 8, rng, 4)
  if (stage === 'speed') return generateWords(layout, 28 + d * 6, Math.max(3, d), rng)
  if (stage === 'code') return generateCode(opts.codeLang ?? 'python', rng)
  return `${generateSentences(layout, 2, rng)} ${shuffleJoin(NUMBERS, 12, rng, 3)} ${shuffleJoin(SYMBOLS, 10, rng, 5)}`
}

export function appendMoreWords(layout: LayoutId, difficulty: number, rng = Math.random): string {
  return ` ${generateWords(layout, 12 + difficulty * 2, difficulty, rng)}`
}

export function syntaxClass(ch: string, inCode: boolean): string {
  if (!inCode) return ''
  if ('{}[]()<>'.includes(ch)) return 'text-sky-700 dark:text-sky-300'
  if (';:=/*\\_+-'.includes(ch)) return 'text-amber-700 dark:text-amber-300'
  if ('0123456789'.includes(ch)) return 'text-violet-700 dark:text-violet-300'
  return ''
}

/** @deprecated use generateTarget; kept for existing imports */
export const KEYBOARD_ROWS: string[][] = [
  ['й', 'ц', 'у', 'к', 'е', 'н', 'г', 'ш', 'щ', 'з', 'х', 'ъ'],
  ['ф', 'ы', 'в', 'а', 'п', 'р', 'о', 'л', 'д', 'ж', 'э'],
  ['я', 'ч', 'с', 'м', 'и', 'т', 'ь', 'б', 'ю'],
  [' '],
]

export function normalizeTypedChar(raw: string): string {
  if (raw === 'Space' || raw === ' ') return ' '
  return raw.length === 1 ? raw : ''
}
