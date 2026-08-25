import { api } from '@/shared/lib/api'
import { listAllLocalLessonDone } from '@/features/lessons/localLessonDone'
import { loadSystemStudyTicks } from '@/features/lessons/systemStudy'
import {
  creditDesktopTask,
  isLessonId,
  loadDesktopLocalProgress,
} from '@/shared/lib/simulatorProgress'

let syncInFlight: Promise<number> | null = null

/**
 * Push browser-local completions (desktop sim, lesson marks, system-study ticks)
 * to the server so catalog % matches the in-course circle.
 */
export async function syncLocalProgressToServer(): Promise<number> {
  if (typeof localStorage === 'undefined' || !localStorage.getItem('km_token')) return 0
  if (syncInFlight) return syncInFlight

  syncInFlight = (async () => {
    let synced = 0
    const pending = new Set<string>()

    try {
      const desktop = loadDesktopLocalProgress()
      for (const taskId of desktop.completed) {
        try {
          const result = await creditDesktopTask(taskId)
          if (result) synced += 1
        } catch {
          /* keep local; retry next visit */
        }
      }

      for (const ids of Object.values(listAllLocalLessonDone())) {
        for (const id of ids) {
          if (isLessonId(id)) pending.add(id)
        }
      }

      for (const [id, on] of Object.entries(loadSystemStudyTicks())) {
        if (on && isLessonId(id)) pending.add(id)
      }

      if (pending.size === 0) return synced

      const rows = await api.lessonProgress()
      const already = new Set(rows.filter((r) => r.completed).map((r) => r.lesson_id))

      for (const lessonId of pending) {
        if (already.has(lessonId)) continue
        try {
          await api.submitTraining({
            lesson_id: lessonId,
            correct: true,
            response_time_ms: 0,
          })
          synced += 1
          already.add(lessonId)
        } catch {
          /* invalid id / network — leave for later */
        }
      }
    } finally {
      syncInFlight = null
    }

    return synced
  })()

  return syncInFlight
}

/** Sync a specific set of lesson UUIDs (e.g. newly ticked system-study rows). */
export async function syncLessonIdsToServer(lessonIds: string[]): Promise<number> {
  if (typeof localStorage === 'undefined' || !localStorage.getItem('km_token')) return 0
  const ids = [...new Set(lessonIds.filter(isLessonId))]
  if (!ids.length) return 0

  let synced = 0
  const rows = await api.lessonProgress()
  const already = new Set(rows.filter((r) => r.completed).map((r) => r.lesson_id))

  for (const lessonId of ids) {
    if (already.has(lessonId)) continue
    try {
      await api.submitTraining({
        lesson_id: lessonId,
        correct: true,
        response_time_ms: 0,
      })
      synced += 1
      already.add(lessonId)
    } catch {
      /* ignore */
    }
  }
  return synced
}
