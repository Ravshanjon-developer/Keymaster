/** Lessons without hotkeys — hands-on tasks (e.g. «Первый ноутбук»). */
export function isTaskLesson(courseSlug: string | undefined, keys: string[] | undefined): boolean {
  if (courseSlug === 'computer-basics') return true
  return !keys || keys.length === 0
}

/** Quiz/training pickers: real keyboard chords only (not desktop simulator missions). */
export function isHotkeyLesson(keys: string[] | undefined): boolean {
  if (!keys?.length) return false
  const raw = keys[0]
  if (typeof raw === 'string' && raw.startsWith('desktop:')) return false
  return true
}
