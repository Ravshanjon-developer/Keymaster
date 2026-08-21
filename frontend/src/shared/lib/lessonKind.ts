/** Lessons without hotkeys — hands-on tasks (e.g. «Первый ноутбук»). */
export function isTaskLesson(courseSlug: string | undefined, keys: string[] | undefined): boolean {
  if (courseSlug === 'computer-basics') return true
  return !keys || keys.length === 0
}
