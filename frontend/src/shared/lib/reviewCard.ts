import type { Locale } from '@/shared/i18n/types'
import { formatShortcut } from '@/shared/lib/hotkeys'
import { explainShortcut } from '@/shared/lib/shortcutExplain'

function compact(text: string): string {
  return text.replace(/\s+/g, '').toLowerCase()
}

function looksLikeChordLabel(text: string, keys: string[]): boolean {
  const t = text.trim()
  if (!t) return false
  const chord = compact(formatShortcut(keys))
  const c = compact(t)
  if (c === chord || c === `chrome${chord}`) return true
  if (/^((ctrl|control|alt|shift|win|meta|cmd)\s*\+\s*)+[a-z0-9]+$/i.test(t)) return true
  if (/^f\d+$/i.test(t)) return true
  return false
}

function looksLikePressInstruction(text: string, keys: string[]): boolean {
  const t = text.trim()
  if (!t) return false
  const chord = compact(formatShortcut(keys))
  const c = compact(t)
  if (/^(нажмите|press|hit|комбинация|клавиша|панель:)/i.test(t) && c.includes(chord)) return true
  if (c === `нажмите${chord}` || c === `press${chord}` || c === `комбинация${chord}`) return true
  return looksLikeChordLabel(t, keys)
}

function meaningful(text: string | null | undefined, keys: string[]): string | null {
  const t = (text ?? '').trim()
  if (!t) return null
  if (looksLikePressInstruction(t, keys) || looksLikeChordLabel(t, keys)) return null
  return t
}

/** One clear meaning for a review flashcard — never “press the keys again”. */
export function reviewCardMeaning(input: {
  keys: string[]
  title?: string | null
  action_prompt?: string | null
  usage_example?: string | null
  description?: string | null
}): string {
  const { keys } = input
  return (
    meaningful(input.title, keys) ??
    meaningful(input.action_prompt, keys) ??
    meaningful(input.description, keys) ??
    meaningful(input.usage_example, keys) ??
    ''
  )
}

/** Long plain explanation for the flip side of a review card. */
export function reviewCardExplain(
  input: {
    keys: string[]
    title?: string | null
    action_prompt?: string | null
    usage_example?: string | null
    description?: string | null
  },
  locale: Locale = 'ru',
): string {
  const meaning = reviewCardMeaning(input)
  return explainShortcut(input.keys, locale, {
    title: meaning || input.title,
    description: meaningful(input.description, input.keys) ?? input.description,
  })
}
