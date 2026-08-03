import { contentTg, type ContentLessonTg } from './contentTg'
import { useLocaleStore } from './localeStore'

export function lessonContentKey(courseSlug: string, categorySlug: string, keys: string[]) {
  return `${courseSlug}/${categorySlug}/${keys.join('+')}`
}

function findLessonTg(
  courseSlug: string | undefined,
  categorySlug: string | undefined,
  keys: string[],
): ContentLessonTg | undefined {
  const chord = keys.join('+')
  if (!chord) return undefined
  if (courseSlug && categorySlug) {
    const direct = contentTg.lessons[lessonContentKey(courseSlug, categorySlug, keys)]
    if (direct) return direct
  }
  if (courseSlug) {
    const prefix = `${courseSlug}/`
    const suffix = `/${chord}`
    for (const [key, value] of Object.entries(contentTg.lessons)) {
      if (key.startsWith(prefix) && key.endsWith(suffix)) return value
    }
  }
  const suffix = `/${chord}`
  for (const [key, value] of Object.entries(contentTg.lessons)) {
    if (key.endsWith(suffix)) return value
  }
  return undefined
}

export function localizeCourse(slug: string, title: string, description: string) {
  const locale = useLocaleStore.getState().locale
  if (locale !== 'tg') return { title, description }
  const hit = contentTg.courses[slug]
  return hit ? { title: hit.title, description: hit.description } : { title, description }
}

export function localizeCategory(courseSlug: string, categorySlug: string, title: string) {
  const locale = useLocaleStore.getState().locale
  if (locale !== 'tg') return title
  return contentTg.categories[`${courseSlug}/${categorySlug}`] ?? title
}

export function localizeLesson(
  courseSlug: string | undefined,
  categorySlug: string | undefined,
  keys: string[],
  fields: {
    title: string
    action_prompt?: string
    usage_example?: string
    description?: string
  },
) {
  const locale = useLocaleStore.getState().locale
  if (locale !== 'tg') return fields
  const hit = findLessonTg(courseSlug, categorySlug, keys)
  if (!hit) return fields
  return {
    title: hit.title,
    action_prompt: hit.action_prompt || fields.action_prompt,
    usage_example: hit.usage_example || fields.usage_example,
    description: hit.description || fields.description,
  }
}

export function useLocalizedContent() {
  const locale = useLocaleStore((s) => s.locale)
  return { locale, localizeCourse, localizeCategory, localizeLesson }
}
