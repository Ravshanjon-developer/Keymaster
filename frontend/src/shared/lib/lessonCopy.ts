import type { Locale } from '@/shared/i18n/types'
import { formatShortcut } from '@/shared/lib/hotkeys'
import { resolveShortcutDetail } from '@/shared/lib/shortcutExplain'

export type LessonCopySource = {
  keys: string[]
  title?: string | null
  action_prompt?: string | null
  usage_example?: string | null
  description?: string | null
  /** Used for the card-back explanation (defaults to ru). */
  locale?: Locale
}

export type TrainerCopy = {
  /** Big action name shown as the task question. */
  headline: string
  /** One short line explaining the point. Empty when it would repeat the headline. */
  why: string
  /** Plain detailed explanation for the card back. */
  detail: string
}

function squash(text: string): string {
  return text
    .toLowerCase()
    .replace(/[«»"'`.,:;!?()[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const STEM_LEN = 5

/** Crude Russian/Tajik stem so «Сохранить» ≈ «Сохранение», «Выделить» ≈ «Выделите». */
function stem(word: string): string {
  return word.length <= STEM_LEN ? word : word.slice(0, STEM_LEN)
}

function stems(text: string): string[] {
  return squash(text)
    .split(' ')
    .filter((w) => w.length > 1)
    .map(stem)
}

/** True when two strings say the same thing for a learner. */
export function saysTheSame(a: string, b: string): boolean {
  const sa = squash(a)
  const sb = squash(b)
  if (!sa || !sb) return false
  if (sa === sb || sa.includes(sb) || sb.includes(sa)) return true

  const wa = new Set(stems(a))
  const wb = new Set(stems(b))
  if (!wa.size || !wb.size) return false

  let shared = 0
  for (const w of wa) if (wb.has(w)) shared += 1
  const smaller = Math.min(wa.size, wb.size)
  return shared / smaller >= 0.7
}

/** True when the text is just the chord itself («Ctrl+H», «F12», «Нажмите Ctrl+H»). */
export function isChordEcho(text: string, keys: string[]): boolean {
  const value = text.trim()
  if (!value) return false
  const chord = squash(formatShortcut(keys)).replace(/\s/g, '')
  const compact = squash(value).replace(/\s/g, '')
  if (!chord) return false
  if (compact === chord) return true
  if (/^(нажмите|пахш|press|hit|комбинация|клавиша|панель)/i.test(value) && compact.includes(chord)) {
    return true
  }
  if (/^((ctrl|control|alt|shift|win|meta|cmd)\s*\+\s*)+[a-zа-я0-9]+$/i.test(value)) return true
  if (/^f\d{1,2}$/i.test(value)) return true
  return false
}

function pick(candidates: Array<string | null | undefined>, keys: string[], taken: string[]): string {
  for (const raw of candidates) {
    const value = (raw ?? '').trim()
    if (!value) continue
    if (isChordEcho(value, keys)) continue
    if (taken.some((t) => saysTheSame(t, value))) continue
    return value
  }
  return ''
}

/**
 * Build non-repeating trainer copy: one action name, one reason, one card-back note.
 * Seed data often repeats itself («Выделить всё» / «Выделите всё» / «Ctrl+A»).
 * Detail always prefers a plain human explanation (library + locale).
 */
export function deriveTrainerCopy(source: LessonCopySource): TrainerCopy {
  const { keys } = source
  const locale = source.locale ?? 'ru'
  // action_prompt is only a headline fallback: as a second line it just rephrases the
  // title («Копировать» → «Скопируйте») and doubles the reading load.
  const headline = pick([source.title, source.action_prompt, source.description], keys, [])
  const why = pick([source.description, source.usage_example], keys, [headline])
  const seedDetail = pick([source.usage_example, source.description], keys, [headline, why])
  const detail = resolveShortcutDetail(keys, locale, seedDetail, {
    title: headline || source.title,
    description: source.description,
  })
  return { headline, why, detail }
}
