import { api, type RandomLessonDto } from '@/shared/lib/api'
import { isHotkeyLesson } from '@/shared/lib/lessonKind'

/** Simulator tasks belong on «Рабочий стол», not in the hotkey quiz. */
const QUIZ_BLOCKED_COURSES = new Set(['computer-basics'])

/** Default quiz flow: universal hotkeys first, then browser. */
const QUIZ_PHASES = [
  { course_slug: 'programmer-basics', limit: 20, ordered: true, browser_safe: true },
  { course_slug: 'chrome', limit: 15, ordered: true, browser_safe: false },
] as const

function filterQuizLessons(lessons: RandomLessonDto[]): RandomLessonDto[] {
  return lessons.filter((l) => isHotkeyLesson(l.keys))
}

export async function fetchQuizLessons(courseSlug?: string): Promise<RandomLessonDto[]> {
  const slug =
    courseSlug && !QUIZ_BLOCKED_COURSES.has(courseSlug) ? courseSlug : undefined

  if (slug) {
    const rows = await api.randomLessons({
      course_slug: slug,
      limit: 35,
      ordered: true,
      hotkeys_only: true,
    })
    return filterQuizLessons(rows)
  }

  const parts = await Promise.all(
    QUIZ_PHASES.map((phase) =>
      api.randomLessons({
        course_slug: phase.course_slug,
        limit: phase.limit,
        ordered: phase.ordered,
        browser_safe: phase.browser_safe,
        hotkeys_only: true,
      }),
    ),
  )

  const seen = new Set<string>()
  const merged: RandomLessonDto[] = []
  for (const part of parts) {
    for (const lesson of filterQuizLessons(part)) {
      if (seen.has(lesson.id)) continue
      seen.add(lesson.id)
      merged.push(lesson)
    }
  }
  return merged
}

const QUIZ_CONTEXT_SLUGS = {
  'programmer-basics': 'quizContextProgrammerBasics',
  chrome: 'quizContextChrome',
  edge: 'quizContextEdge',
  vscode: 'quizContextVscode',
  windows: 'quizContextWindows',
} as const

type QuizContextKey = (typeof QUIZ_CONTEXT_SLUGS)[keyof typeof QUIZ_CONTEXT_SLUGS]

export function quizContextKey(courseSlug?: string | null): QuizContextKey | 'quizContextDefault' {
  if (!courseSlug) return 'quizContextDefault'
  return QUIZ_CONTEXT_SLUGS[courseSlug as keyof typeof QUIZ_CONTEXT_SLUGS] ?? 'quizContextDefault'
}
