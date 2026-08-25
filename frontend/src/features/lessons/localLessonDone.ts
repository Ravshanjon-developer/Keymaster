const STORAGE_KEY = 'km_course_lesson_done_v1'

type Store = Record<string, string[]>

let memoryStore: Store = {}

function readStore(): Store {
  if (typeof localStorage === 'undefined') return { ...memoryStore }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...memoryStore }
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { ...memoryStore }
    const out: Store = {}
    for (const [slug, ids] of Object.entries(parsed as Record<string, unknown>)) {
      if (!Array.isArray(ids)) continue
      out[slug] = ids.filter((id): id is string => typeof id === 'string' && id.length > 0)
    }
    memoryStore = out
    return { ...out }
  } catch {
    return { ...memoryStore }
  }
}

function writeStore(store: Store): void {
  memoryStore = { ...store }
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // ignore quota / private mode
  }
}

export function clearLocalLessonDoneForTests(): void {
  memoryStore = {}
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function loadLocalLessonDone(courseSlug: string): string[] {
  if (!courseSlug) return []
  return readStore()[courseSlug] ?? []
}

export function addLocalLessonDone(courseSlug: string, lessonIds: string[]): string[] {
  if (!courseSlug || !lessonIds.length) return loadLocalLessonDone(courseSlug)
  const store = readStore()
  const next = [...new Set([...(store[courseSlug] ?? []), ...lessonIds])]
  store[courseSlug] = next
  writeStore(store)
  return next
}
