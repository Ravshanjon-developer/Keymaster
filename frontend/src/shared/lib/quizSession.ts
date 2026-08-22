import { api, type RandomLessonDto } from '@/shared/lib/api'

/** Default quiz flow: universal hotkeys first, then browser. */
const QUIZ_PHASES = [
  { course_slug: 'programmer-basics', limit: 20, ordered: true, browser_safe: true },
  { course_slug: 'chrome', limit: 15, ordered: true, browser_safe: false },
] as const

export async function fetchQuizLessons(courseSlug?: string): Promise<RandomLessonDto[]> {
  if (courseSlug) {
    return api.randomLessons({
      course_slug: courseSlug,
      limit: 35,
      ordered: true,
    })
  }

  const parts = await Promise.all(
    QUIZ_PHASES.map((phase) =>
      api.randomLessons({
        course_slug: phase.course_slug,
        limit: phase.limit,
        ordered: phase.ordered,
        browser_safe: phase.browser_safe,
      }),
    ),
  )

  const seen = new Set<string>()
  const merged: RandomLessonDto[] = []
  for (const part of parts) {
    for (const lesson of part) {
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
