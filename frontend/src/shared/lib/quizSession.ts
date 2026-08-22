import { api, type RandomLessonDto } from '@/shared/lib/api'
import { isHotkeyLesson } from '@/shared/lib/lessonKind'

export const QUIZ_COURSE = 'programmer-basics'
export const QUIZ_CATEGORY = 'basics'
export const QUIZ_CONTEXT_LABEL = 'основные hotkeys'

/** Always Russian — even when site UI is TJ. */
export function formatQuizQuestion(action: string): string {
  const phrase = action.trim()
  return phrase ? `Какая комбинация, чтобы ${phrase}?` : 'Какая комбинация?'
}

function isQuizBasicsLesson(categorySlug: string, keys: string[] | undefined): boolean {
  if (categorySlug !== QUIZ_CATEGORY) return false
  if (!isHotkeyLesson(keys)) return false
  const parts = keys ?? []
  if (parts.includes('Shift') && parts.includes('Alt')) return false
  if (parts.includes('Meta')) return false
  if (parts.some((p) => /^F\d{1,2}$/i.test(p))) return false
  return true
}

function lessonToDto(
  lesson: {
    id: string
    title: string
    action_prompt: string
    usage_example: string
    description: string
    keys: string[]
  },
  categorySlug: string,
): RandomLessonDto {
  return {
    id: lesson.id,
    title: lesson.title,
    action_prompt: lesson.action_prompt,
    usage_example: lesson.usage_example,
    description: lesson.description,
    keys: lesson.keys,
    course_slug: QUIZ_COURSE,
    category_slug: categorySlug,
  }
}

/** Curated quiz: only «Основы» from programmer-basics (Ctrl+C, Ctrl+V, …). */
export async function fetchQuizLessons(_courseSlug?: string): Promise<RandomLessonDto[]> {
  const course = await api.course(QUIZ_COURSE)
  const categories = [...course.categories].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  )

  const lessons: RandomLessonDto[] = []
  for (const cat of categories) {
    if (cat.slug !== QUIZ_CATEGORY) continue
    const sorted = [...cat.lessons].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    for (const lesson of sorted) {
      if (!isQuizBasicsLesson(cat.slug, lesson.keys)) continue
      lessons.push(lessonToDto(lesson, cat.slug))
    }
  }
  return lessons
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
