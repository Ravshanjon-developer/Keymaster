const TASK_COURSES = new Set(['computer-basics', 'git', 'github-desktop'])

/** Lessons without hotkeys — hands-on tasks and command/concept cards. */
export function isTaskLesson(courseSlug: string | undefined, keys: string[] | undefined): boolean {
  if (courseSlug && TASK_COURSES.has(courseSlug)) return true
  const raw = keys?.[0]
  if (typeof raw === 'string' && (raw.startsWith('desktop:') || raw.startsWith('cmd:'))) return true
  return !keys || keys.length === 0
}

/** Quiz/training pickers: real keyboard chords only (not simulator or command cards). */
export function isHotkeyLesson(keys: string[] | undefined): boolean {
  if (!keys?.length) return false
  const raw = keys[0]
  if (typeof raw === 'string' && (raw.startsWith('desktop:') || raw.startsWith('cmd:'))) return false
  return true
}
