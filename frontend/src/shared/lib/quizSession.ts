import { api, type RandomLessonDto } from '@/shared/lib/api'
import { isHotkeyLesson } from '@/shared/lib/lessonKind'

/** Quiz covers starter hotkeys only — not browser/IDE extras. */
const QUIZ_COURSE = 'programmer-basics'

function filterQuizLessons(lessons: RandomLessonDto[]): RandomLessonDto[] {
  return lessons.filter((l) => isHotkeyLesson(l.keys))
}

export async function fetchQuizLessons(_courseSlug?: string): Promise<RandomLessonDto[]> {
  const rows = await api.randomLessons({
    course_slug: QUIZ_COURSE,
    limit: 35,
    ordered: true,
    browser_safe: true,
    hotkeys_only: true,
  })
  return filterQuizLessons(rows)
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
