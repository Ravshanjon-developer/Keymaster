import {
  PATH_STAGES,
  calcAccuracyPrecise,
  nextDifficulty,
  pathThreshold,
  type PathStage,
  type TrainMode,
  type WeakKey,
} from '@/features/typing/typingEngine'
import { loadTypingBest, saveTypingBest } from '@/shared/lib/simulatorProgress'

const STORE_KEY = 'km_typing_store_v2'
const SETTINGS_KEY = 'km_typing_settings_v1'

export type TypingSession = {
  at: number
  mode: TrainMode
  wpm: number
  accuracy: number
  errors: number
  durationMs: number
  correct: number
  incorrect: number
  stage?: PathStage
}

export type TypingSettings = {
  showKeyboard: boolean
  fingerHints: boolean
  layout: 'ru' | 'en'
}

export type PathProgress = Record<PathStage, { completed: number; bestWpm: number }>

export type TypingStore = {
  sessions: TypingSession[]
  difficulty: number
  keyStats: Record<string, { hits: number; misses: number }>
  path: PathProgress
  unlocked: string[]
  lastPracticeDate: string | null
  streak: number
}

const ACHIEVEMENTS: { id: string; test: (ctx: AchievementCtx) => boolean }[] = [
  { id: 'first_practice', test: (c) => c.totalSessions >= 1 },
  { id: 'wpm_20', test: (c) => c.session.wpm >= 20 },
  { id: 'wpm_40', test: (c) => c.session.wpm >= 40 },
  { id: 'wpm_60', test: (c) => c.session.wpm >= 60 },
  { id: 'wpm_80', test: (c) => c.session.wpm >= 80 },
  { id: 'wpm_100', test: (c) => c.session.wpm >= 100 },
  { id: 'acc_95', test: (c) => c.session.accuracy >= 95 },
  { id: 'acc_98', test: (c) => c.session.accuracy >= 98 },
  { id: 'personal_best', test: (c) => c.isPersonalBest },
  { id: 'streak_7', test: (c) => c.streak >= 7 },
  { id: 'streak_30', test: (c) => c.streak >= 30 },
  { id: 'code_typing', test: (c) => c.session.mode === 'code' || c.session.stage === 'code' },
]

type AchievementCtx = {
  session: TypingSession
  totalSessions: number
  streak: number
  isPersonalBest: boolean
}

function emptyPath(): PathProgress {
  return Object.fromEntries(PATH_STAGES.map((s) => [s, { completed: 0, bestWpm: 0 }])) as PathProgress
}

function defaultStore(): TypingStore {
  return {
    sessions: [],
    difficulty: 1,
    keyStats: {},
    path: emptyPath(),
    unlocked: [],
    lastPracticeDate: null,
    streak: 0,
  }
}

export function defaultTypingSettings(): TypingSettings {
  const wide = typeof window === 'undefined' ? true : window.matchMedia('(min-width: 768px)').matches
  return { showKeyboard: wide, fingerHints: false, layout: 'ru' }
}

export function loadTypingSettings(): TypingSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return defaultTypingSettings()
    const parsed = JSON.parse(raw) as Partial<TypingSettings>
    return {
      showKeyboard: parsed.showKeyboard !== false,
      fingerHints: parsed.fingerHints === true,
      layout: parsed.layout === 'en' ? 'en' : 'ru',
    }
  } catch {
    return defaultTypingSettings()
  }
}

export function saveTypingSettings(settings: TypingSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function loadTypingStore(): TypingStore {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return defaultStore()
    const parsed = JSON.parse(raw) as Partial<TypingStore>
    return {
      ...defaultStore(),
      ...parsed,
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions.slice(-120) : [],
      difficulty: typeof parsed.difficulty === 'number' ? parsed.difficulty : 1,
      keyStats: parsed.keyStats && typeof parsed.keyStats === 'object' ? parsed.keyStats : {},
      path: { ...emptyPath(), ...(parsed.path ?? {}) },
      unlocked: Array.isArray(parsed.unlocked) ? parsed.unlocked.filter((id) => typeof id === 'string') : [],
      lastPracticeDate: typeof parsed.lastPracticeDate === 'string' ? parsed.lastPracticeDate : null,
      streak: typeof parsed.streak === 'number' ? parsed.streak : 0,
    }
  } catch {
    return defaultStore()
  }
}

function saveStore(store: TypingStore) {
  localStorage.setItem(STORE_KEY, JSON.stringify(store))
}

export function todayStamp(now = Date.now()): string {
  const d = new Date(now)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function mergeKeyStats(
  base: Record<string, { hits: number; misses: number }>,
  session: Record<string, { hits: number; misses: number }>,
): Record<string, { hits: number; misses: number }> {
  const out: Record<string, { hits: number; misses: number }> = { ...base }
  for (const [key, row] of Object.entries(session)) {
    const prev = out[key] ?? { hits: 0, misses: 0 }
    out[key] = { hits: prev.hits + row.hits, misses: prev.misses + row.misses }
  }
  return out
}

export function nextStreak(prev: number, lastDate: string | null, now = Date.now()): number {
  const today = todayStamp(now)
  if (lastDate === today) return Math.max(1, prev)
  const y = new Date(now)
  y.setDate(y.getDate() - 1)
  const yesterday = todayStamp(y.getTime())
  if (lastDate === yesterday) return prev + 1
  return 1
}

export function commitTypingSession(
  session: TypingSession,
  keyStats: Record<string, { hits: number; misses: number }>,
): { store: TypingStore; newAchievements: string[]; previousWpm: number | null; isPersonalBest: boolean } {
  const store = loadTypingStore()
  const previousWpm = store.sessions.at(-1)?.wpm ?? null
  const last = store.sessions.at(-1)
  if (
    last &&
    session.at - last.at < 1500 &&
    last.wpm === session.wpm &&
    last.correct === session.correct &&
    last.mode === session.mode
  ) {
    return { store, newAchievements: [], previousWpm: store.sessions.at(-2)?.wpm ?? null, isPersonalBest: false }
  }
  const bestBefore = loadTypingBest()
  const isPersonalBest =
    !bestBefore ||
    session.wpm > bestBefore.wpm ||
    (session.wpm === bestBefore.wpm && session.accuracy > bestBefore.accuracy)
  saveTypingBest({ wpm: session.wpm, accuracy: session.accuracy })

  store.sessions = [...store.sessions, session].slice(-120)
  store.keyStats = keyStats
  store.difficulty = nextDifficulty(store.difficulty, session.wpm, session.accuracy)
  store.streak = nextStreak(store.streak, store.lastPracticeDate, session.at)
  store.lastPracticeDate = todayStamp(session.at)

  if (session.stage) {
    const need = pathThreshold(session.stage)
    if (session.wpm >= need.wpm && session.accuracy >= need.accuracy) {
      const row = store.path[session.stage]
      store.path[session.stage] = {
        completed: row.completed + 1,
        bestWpm: Math.max(row.bestWpm, session.wpm),
      }
    } else {
      store.path[session.stage] = {
        ...store.path[session.stage],
        bestWpm: Math.max(store.path[session.stage].bestWpm, session.wpm),
      }
    }
  }

  const ctx: AchievementCtx = {
    session,
    totalSessions: store.sessions.length,
    streak: store.streak,
    isPersonalBest,
  }
  const newAchievements: string[] = []
  for (const ach of ACHIEVEMENTS) {
    if (!store.unlocked.includes(ach.id) && ach.test(ctx)) {
      store.unlocked.push(ach.id)
      newAchievements.push(ach.id)
    }
  }

  saveStore(store)
  return { store, newAchievements, previousWpm, isPersonalBest }
}

export function weekSessions(sessions: TypingSession[], now = Date.now()): TypingSession[] {
  const from = now - 7 * 24 * 60 * 60 * 1000
  return sessions.filter((s) => s.at >= from)
}

export function weekDailyWpm(sessions: TypingSession[], now = Date.now()): { day: string; wpm: number }[] {
  const days: { day: string; wpm: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setHours(12, 0, 0, 0)
    d.setDate(d.getDate() - i)
    const stamp = todayStamp(d.getTime())
    const ofDay = sessions.filter((s) => todayStamp(s.at) === stamp)
    const wpm = ofDay.length ? Math.round(ofDay.reduce((a, s) => a + s.wpm, 0) / ofDay.length) : 0
    days.push({ day: stamp.slice(5), wpm })
  }
  return days
}

export function unlockedStage(path: PathProgress, stage: PathStage): boolean {
  const idx = PATH_STAGES.indexOf(stage)
  if (idx <= 0) return true
  const prev = PATH_STAGES[idx - 1]
  return path[prev].completed >= 1
}

export function pathPercent(path: PathProgress): number {
  const done = PATH_STAGES.filter((s) => path[s].completed >= 1).length
  return Math.round((done / PATH_STAGES.length) * 100)
}

export function summarizeAccuracy(sessions: TypingSession[]): number {
  if (!sessions.length) return 0
  return calcAccuracyPrecise(
    sessions.reduce((a, s) => a + s.correct, 0),
    sessions.reduce((a, s) => a + s.correct + s.incorrect, 0),
  )
}

export function totalPracticeMs(sessions: TypingSession[]): number {
  return sessions.reduce((a, s) => a + s.durationMs, 0)
}

export function bestSession(sessions: TypingSession[]): TypingSession | null {
  if (!sessions.length) return null
  return sessions.reduce((best, s) => (s.wpm > best.wpm ? s : best))
}

export function formatImproveDelta(current: number, previous: number | null): number | null {
  if (previous == null) return null
  return current - previous
}

export { type WeakKey }
