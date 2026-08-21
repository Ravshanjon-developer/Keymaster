import { api, type TrainingResultDto } from '@/shared/lib/api'

export const DESKTOP_COURSE_SLUG = 'computer-basics'
export const DESKTOP_TASK_PREFIX = 'desktop:'
const DESKTOP_LOCAL_KEY = 'km_desktop_tasks_v1'
const CODELAB_LOCAL_KEY = 'km_codelab_completed_v1'
const TYPING_BEST_KEY = 'km_typing_best_v1'

export function parseDesktopTaskId(keys: string[] | undefined): number | null {
  const raw = keys?.[0]
  if (!raw?.startsWith(DESKTOP_TASK_PREFIX)) return null
  const n = Number(raw.slice(DESKTOP_TASK_PREFIX.length))
  if (!Number.isInteger(n) || n < 1) return null
  return n
}

const LESSON_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isLessonId(value: string | null | undefined): value is string {
  return Boolean(value && LESSON_ID_RE.test(value))
}

export function desktopSimulatorHref(taskId?: number | null, lessonId?: string) {
  const q = new URLSearchParams({ mode: 'desktop' })
  if (taskId) q.set('task', String(taskId))
  if (lessonId && isLessonId(lessonId)) q.set('fromLesson', lessonId)
  return `/simulator?${q.toString()}`
}

type DesktopLocal = { completed: number[]; xp: number }

function readDesktopLocal(): DesktopLocal {
  try {
    const raw = localStorage.getItem(DESKTOP_LOCAL_KEY)
    if (!raw) return { completed: [], xp: 0 }
    const parsed = JSON.parse(raw) as Partial<DesktopLocal>
    const completed = Array.isArray(parsed.completed)
      ? parsed.completed.filter((n) => Number.isInteger(n) && n > 0)
      : []
    const xp = typeof parsed.xp === 'number' && parsed.xp >= 0 ? parsed.xp : 0
    return { completed, xp }
  } catch {
    return { completed: [], xp: 0 }
  }
}

export function loadDesktopLocalProgress(): { completed: Set<number>; xp: number } {
  const data = readDesktopLocal()
  return { completed: new Set(data.completed), xp: data.xp }
}

export function saveDesktopLocalProgress(completed: Set<number>, xp: number) {
  const payload: DesktopLocal = { completed: [...completed].sort((a, b) => a - b), xp }
  localStorage.setItem(DESKTOP_LOCAL_KEY, JSON.stringify(payload))
}

export async function creditDesktopTask(taskId: number): Promise<TrainingResultDto | null> {
  if (!localStorage.getItem('km_token')) return null
  const rows = await api.lessonProgress({ courseSlug: DESKTOP_COURSE_SLUG })
  const lesson = rows.find((row) => parseDesktopTaskId(row.keys) === taskId)
  if (!lesson || lesson.completed) return null
  return api.submitTraining({ lesson_id: lesson.lesson_id, correct: true, response_time_ms: 0 })
}

export async function loadDesktopCompletedFromServer(): Promise<Set<number>> {
  const ids = new Set<number>()
  if (!localStorage.getItem('km_token')) return ids
  const rows = await api.lessonProgress({ courseSlug: DESKTOP_COURSE_SLUG })
  for (const row of rows) {
    const taskId = parseDesktopTaskId(row.keys)
    if (taskId && row.completed) ids.add(taskId)
  }
  return ids
}

export function loadCodeLabCompletedIds(): string[] {
  try {
    const raw = localStorage.getItem(CODELAB_LOCAL_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

export function saveCodeLabCompletedIds(ids: string[]) {
  localStorage.setItem(CODELAB_LOCAL_KEY, JSON.stringify([...new Set(ids)]))
}

export type TypingBest = { wpm: number; accuracy: number }

export function loadTypingBest(): TypingBest | null {
  try {
    const raw = localStorage.getItem(TYPING_BEST_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<TypingBest>
    if (typeof parsed.wpm !== 'number' || typeof parsed.accuracy !== 'number') return null
    return { wpm: parsed.wpm, accuracy: parsed.accuracy }
  } catch {
    return null
  }
}

export function saveTypingBest(current: TypingBest): TypingBest {
  const prev = loadTypingBest()
  const next: TypingBest =
    !prev || current.wpm > prev.wpm || (current.wpm === prev.wpm && current.accuracy > prev.accuracy)
      ? current
      : prev
  localStorage.setItem(TYPING_BEST_KEY, JSON.stringify(next))
  return next
}
