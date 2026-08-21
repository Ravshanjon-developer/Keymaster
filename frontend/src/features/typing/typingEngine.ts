/** Pure typing metrics, layouts, and adaptive helpers. */

export type LayoutId = 'ru' | 'en'
export type TrainMode =
  | 'practice'
  | 'time'
  | 'words'
  | 'sentences'
  | 'numbers'
  | 'symbols'
  | 'code'
  | 'weak'
export type PathStage =
  | 'home'
  | 'letters'
  | 'words'
  | 'sentences'
  | 'numbers'
  | 'symbols'
  | 'speed'
  | 'code'
  | 'advanced'
export type CodeLang = 'python' | 'javascript' | 'html' | 'css' | 'sql' | 'git'
export type TimeLimit = 15 | 30 | 60 | 120
export type FingerId =
  | 'lp'
  | 'lr'
  | 'lm'
  | 'li'
  | 'th'
  | 'ri'
  | 'rm'
  | 'rr'
  | 'rp'

export type KeyStat = { hits: number; misses: number }

export type WeakKey = { key: string; accuracy: number; samples: number }

export const PATH_STAGES: PathStage[] = [
  'home',
  'letters',
  'words',
  'sentences',
  'numbers',
  'symbols',
  'speed',
  'code',
  'advanced',
]

export const TIME_LIMITS: TimeLimit[] = [15, 30, 60, 120]

export const CODE_LANGS: CodeLang[] = ['python', 'javascript', 'html', 'css', 'sql', 'git']

const EN_SHIFT: Record<string, string> = {
  '~': '`',
  '!': '1',
  '@': '2',
  '#': '3',
  $: '4',
  '%': '5',
  '^': '6',
  '&': '7',
  '*': '8',
  '(': '9',
  ')': '0',
  _: '-',
  '+': '=',
  '{': '[',
  '}': ']',
  '|': '\\',
  ':': ';',
  '"': "'",
  '<': ',',
  '>': '.',
  '?': '/',
}

const RU_SHIFT: Record<string, string> = {
  '!': '1',
  '"': '2',
  '№': '3',
  ';': '4',
  '%': '5',
  ':': '6',
  '?': '7',
  '*': '8',
  '(': '9',
  ')': '0',
  _: '-',
  '+': '=',
  '/': '.',
  ',': 'б',
}

export type KbKey = {
  id: string
  label: string
  shift?: string
  width?: number
  spacer?: boolean
}

export const EN_ROWS: KbKey[][] = [
  [
    { id: '`', label: '`' },
    { id: '1', label: '1' },
    { id: '2', label: '2' },
    { id: '3', label: '3' },
    { id: '4', label: '4' },
    { id: '5', label: '5' },
    { id: '6', label: '6' },
    { id: '7', label: '7' },
    { id: '8', label: '8' },
    { id: '9', label: '9' },
    { id: '0', label: '0' },
    { id: '-', label: '-' },
    { id: '=', label: '=' },
    { id: 'Backspace', label: '⌫', width: 2 },
  ],
  [
    { id: 'Tab', label: 'Tab', width: 1.5 },
    { id: 'q', label: 'q' },
    { id: 'w', label: 'w' },
    { id: 'e', label: 'e' },
    { id: 'r', label: 'r' },
    { id: 't', label: 't' },
    { id: 'y', label: 'y' },
    { id: 'u', label: 'u' },
    { id: 'i', label: 'i' },
    { id: 'o', label: 'o' },
    { id: 'p', label: 'p' },
    { id: '[', label: '[' },
    { id: ']', label: ']' },
    { id: '\\', label: '\\', width: 1.5 },
  ],
  [
    { id: 'Caps', label: 'Caps', width: 1.75 },
    { id: 'a', label: 'a' },
    { id: 's', label: 's' },
    { id: 'd', label: 'd' },
    { id: 'f', label: 'f' },
    { id: 'g', label: 'g' },
    { id: 'h', label: 'h' },
    { id: 'j', label: 'j' },
    { id: 'k', label: 'k' },
    { id: 'l', label: 'l' },
    { id: ';', label: ';' },
    { id: "'", label: "'" },
    { id: 'Enter', label: 'Enter', width: 2.25 },
  ],
  [
    { id: 'Shift', label: 'Shift', width: 2.25 },
    { id: 'z', label: 'z' },
    { id: 'x', label: 'x' },
    { id: 'c', label: 'c' },
    { id: 'v', label: 'v' },
    { id: 'b', label: 'b' },
    { id: 'n', label: 'n' },
    { id: 'm', label: 'm' },
    { id: ',', label: ',' },
    { id: '.', label: '.' },
    { id: '/', label: '/' },
    { id: 'ShiftR', label: 'Shift', width: 2.75 },
  ],
  [
    { id: 'spacer-l', label: '', width: 3.75, spacer: true },
    { id: ' ', label: 'space', width: 6.25 },
    { id: 'spacer-r', label: '', width: 3.75, spacer: true },
  ],
]

export const RU_ROWS: KbKey[][] = [
  [
    { id: 'ё', label: 'ё' },
    { id: '1', label: '1' },
    { id: '2', label: '2' },
    { id: '3', label: '3' },
    { id: '4', label: '4' },
    { id: '5', label: '5' },
    { id: '6', label: '6' },
    { id: '7', label: '7' },
    { id: '8', label: '8' },
    { id: '9', label: '9' },
    { id: '0', label: '0' },
    { id: '-', label: '-' },
    { id: '=', label: '=' },
    { id: 'Backspace', label: '⌫', width: 2 },
  ],
  [
    { id: 'Tab', label: 'Tab', width: 1.5 },
    { id: 'й', label: 'й' },
    { id: 'ц', label: 'ц' },
    { id: 'у', label: 'у' },
    { id: 'к', label: 'к' },
    { id: 'е', label: 'е' },
    { id: 'н', label: 'н' },
    { id: 'г', label: 'г' },
    { id: 'ш', label: 'ш' },
    { id: 'щ', label: 'щ' },
    { id: 'з', label: 'з' },
    { id: 'х', label: 'х' },
    { id: 'ъ', label: 'ъ' },
    { id: '\\', label: '\\', width: 1.5 },
  ],
  [
    { id: 'Caps', label: 'Caps', width: 1.75 },
    { id: 'ф', label: 'ф' },
    { id: 'ы', label: 'ы' },
    { id: 'в', label: 'в' },
    { id: 'а', label: 'а' },
    { id: 'п', label: 'п' },
    { id: 'р', label: 'р' },
    { id: 'о', label: 'о' },
    { id: 'л', label: 'л' },
    { id: 'д', label: 'д' },
    { id: 'ж', label: 'ж' },
    { id: 'э', label: 'э' },
    { id: 'Enter', label: 'Enter', width: 2.25 },
  ],
  [
    { id: 'Shift', label: 'Shift', width: 2.25 },
    { id: 'я', label: 'я' },
    { id: 'ч', label: 'ч' },
    { id: 'с', label: 'с' },
    { id: 'м', label: 'м' },
    { id: 'и', label: 'и' },
    { id: 'т', label: 'т' },
    { id: 'ь', label: 'ь' },
    { id: 'б', label: 'б' },
    { id: 'ю', label: 'ю' },
    { id: '.', label: '.' },
    { id: 'ShiftR', label: 'Shift', width: 2.75 },
  ],
  [
    { id: 'spacer-l', label: '', width: 3.75, spacer: true },
    { id: ' ', label: 'space', width: 6.25 },
    { id: 'spacer-r', label: '', width: 3.75, spacer: true },
  ],
]

const EN_FINGER: Record<string, FingerId> = {
  '`': 'lp',
  '1': 'lp',
  q: 'lp',
  a: 'lp',
  z: 'lp',
  Tab: 'lp',
  '2': 'lr',
  w: 'lr',
  s: 'lr',
  x: 'lr',
  '3': 'lm',
  e: 'lm',
  d: 'lm',
  c: 'lm',
  '4': 'li',
  r: 'li',
  f: 'li',
  v: 'li',
  '5': 'li',
  t: 'li',
  g: 'li',
  b: 'li',
  '6': 'ri',
  y: 'ri',
  h: 'ri',
  n: 'ri',
  '7': 'ri',
  u: 'ri',
  j: 'ri',
  m: 'ri',
  '8': 'rm',
  i: 'rm',
  k: 'rm',
  ',': 'rm',
  '9': 'rr',
  o: 'rr',
  l: 'rr',
  '.': 'rr',
  '0': 'rp',
  p: 'rp',
  ';': 'rp',
  '/': 'rp',
  '-': 'rp',
  '=': 'rp',
  '[': 'rp',
  ']': 'rp',
  "'": 'rp',
  '\\': 'rp',
  ' ': 'th',
  Enter: 'rp',
  Backspace: 'rp',
  Caps: 'lp',
  Shift: 'lp',
  ShiftR: 'rp',
}

const RU_FINGER: Record<string, FingerId> = {
  ё: 'lp',
  '1': 'lp',
  й: 'lp',
  ф: 'lp',
  я: 'lp',
  '2': 'lr',
  ц: 'lr',
  ы: 'lr',
  ч: 'lr',
  '3': 'lm',
  у: 'lm',
  в: 'lm',
  с: 'lm',
  '4': 'li',
  к: 'li',
  а: 'li',
  м: 'li',
  '5': 'li',
  е: 'li',
  п: 'li',
  и: 'li',
  '6': 'ri',
  н: 'ri',
  р: 'ri',
  т: 'ri',
  '7': 'ri',
  г: 'ri',
  о: 'ri',
  ь: 'ri',
  '8': 'rm',
  ш: 'rm',
  л: 'rm',
  б: 'rm',
  '9': 'rr',
  щ: 'rr',
  д: 'rr',
  ю: 'rr',
  '0': 'rp',
  з: 'rp',
  ж: 'rp',
  '.': 'rp',
  х: 'rp',
  ъ: 'rp',
  э: 'rp',
  '-': 'rp',
  '=': 'rp',
  ' ': 'th',
  Enter: 'rp',
  Backspace: 'rp',
  Tab: 'lp',
  Caps: 'lp',
  '\\': 'rp',
  Shift: 'lp',
  ShiftR: 'rp',
}

export function layoutRows(layout: LayoutId): KbKey[][] {
  return layout === 'ru' ? RU_ROWS : EN_ROWS
}

export function calcWpm(correctChars: number, elapsedMs: number): number {
  if (elapsedMs < 400) return 0
  const minutes = elapsedMs / 60000
  return Math.max(0, Math.round(correctChars / 5 / minutes))
}

export function calcAccuracy(correct: number, total: number): number {
  if (total <= 0) return 100
  return Math.max(0, Math.min(100, Math.round((correct / total) * 100)))
}

export function calcAccuracyPrecise(correct: number, total: number): number {
  if (total <= 0) return 100
  return Math.max(0, Math.min(100, Math.round((correct / total) * 1000) / 10))
}

export function formatClock(ms: number): string {
  const safe = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(safe / 60)
  const s = safe % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function countCorrect(typed: string, target: string): number {
  const n = Math.min(typed.length, target.length)
  let ok = 0
  for (let i = 0; i < n; i++) if (typed[i] === target[i]) ok++
  return ok
}

export function keyIdForChar(ch: string, layout: LayoutId): string | null {
  if (!ch) return null
  if (ch === '\n') return 'Enter'
  if (ch === '\t') return 'Tab'
  if (ch === ' ') return ' '
  const map = layout === 'ru' ? RU_SHIFT : EN_SHIFT
  if (map[ch]) return map[ch]
  const lower = ch.toLowerCase()
  if (lower !== ch) return lower
  return ch
}

export function needsShift(ch: string, layout: LayoutId): boolean {
  if (!ch || ch === ' ' || ch === '\n' || ch === '\t') return false
  if (ch !== ch.toLowerCase() && ch === ch.toUpperCase() && /[a-zа-яё]/i.test(ch)) return true
  const map = layout === 'ru' ? RU_SHIFT : EN_SHIFT
  return Boolean(map[ch])
}

export function fingerForKey(keyId: string, layout: LayoutId): FingerId {
  const table = layout === 'ru' ? RU_FINGER : EN_FINGER
  return table[keyId] ?? 'th'
}

export function fingerForChar(ch: string, layout: LayoutId): FingerId {
  const id = keyIdForChar(ch, layout)
  return id ? fingerForKey(id, layout) : 'th'
}

export function consumeTypingKey(e: KeyboardEvent): { kind: 'char'; char: string } | { kind: 'backspace' } | { kind: 'pause' } | { kind: 'restart' } | { kind: 'ignore' } {
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'Enter') return { kind: 'restart' }
    return { kind: 'ignore' }
  }
  if (e.altKey) return { kind: 'ignore' }
  if (e.key === 'Escape') return { kind: 'pause' }
  if (e.key === 'Backspace') return { kind: 'backspace' }
  if (e.key === 'Enter') return { kind: 'char', char: '\n' }
  if (e.key === 'Tab') return { kind: 'char', char: '\t' }
  if (e.key === ' ') return { kind: 'char', char: ' ' }
  if (e.key.length === 1) return { kind: 'char', char: e.key }
  return { kind: 'ignore' }
}

export function recordKeyStroke(
  stats: Record<string, KeyStat>,
  expected: string,
  actual: string,
): Record<string, KeyStat> {
  const key = expected === ' ' ? '␣' : expected === '\n' ? '↵' : expected
  const prev = stats[key] ?? { hits: 0, misses: 0 }
  const next = { ...stats }
  next[key] = actual === expected
    ? { hits: prev.hits + 1, misses: prev.misses }
    : { hits: prev.hits, misses: prev.misses + 1 }
  return next
}

export function weakKeysFromStats(stats: Record<string, KeyStat>, minSamples = 4, limit = 5): WeakKey[] {
  return Object.entries(stats)
    .map(([key, s]) => {
      const samples = s.hits + s.misses
      const accuracy = samples <= 0 ? 100 : Math.round((s.hits / samples) * 100)
      return { key, accuracy, samples }
    })
    .filter((row) => row.samples >= minSamples && row.accuracy < 94)
    .sort((a, b) => a.accuracy - b.accuracy || b.samples - a.samples)
    .slice(0, limit)
}

export function nextDifficulty(current: number, wpm: number, accuracy: number): number {
  const clamped = Math.min(5, Math.max(1, Math.round(current)))
  if (accuracy >= 96 && wpm >= 28 + clamped * 6) return Math.min(5, clamped + 1)
  if (accuracy < 84 || wpm < 12) return Math.max(1, clamped - 1)
  return clamped
}

export function pathThreshold(stage: PathStage): { wpm: number; accuracy: number } {
  const map: Record<PathStage, { wpm: number; accuracy: number }> = {
    home: { wpm: 12, accuracy: 90 },
    letters: { wpm: 16, accuracy: 90 },
    words: { wpm: 20, accuracy: 90 },
    sentences: { wpm: 24, accuracy: 92 },
    numbers: { wpm: 18, accuracy: 90 },
    symbols: { wpm: 16, accuracy: 88 },
    speed: { wpm: 32, accuracy: 92 },
    code: { wpm: 20, accuracy: 90 },
    advanced: { wpm: 36, accuracy: 93 },
  }
  return map[stage]
}

export function improvementTips(input: {
  accuracy: number
  wpm: number
  weak: WeakKey[]
  errors: number
  shiftMisses: number
}): string[] {
  const tips: string[] = []
  if (input.accuracy < 94) tips.push('accuracy')
  if (input.wpm < 40 && input.accuracy >= 92) tips.push('speed')
  if (input.weak[0]) tips.push('weakKey')
  if (input.weak[1]) tips.push('weakKey2')
  if (input.shiftMisses >= 3) tips.push('shift')
  if (tips.length === 0) tips.push('consistency')
  return tips.slice(0, 4)
}
