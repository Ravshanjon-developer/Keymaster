import { useMemo } from 'react'

import { ru } from '@/shared/i18n/ru'
import { tg } from '@/shared/i18n/tg'
import { useLocaleStore } from '@/shared/i18n/localeStore'
import type { Locale, Messages, TranslateFn, TranslateParams, TranslationKey } from '@/shared/i18n/types'

export type { Locale, Messages, TranslateFn, TranslateParams, TranslationKey }
export { useLocaleStore, initLocale } from '@/shared/i18n/localeStore'
export {
  useLocalizedContent,
  localizeCourse,
  localizeCategory,
  localizeLesson,
} from '@/shared/i18n/contentLocalize'

const catalogs: Record<Locale, Messages> = { ru, tg }

function resolve(messages: Messages, key: TranslationKey): string {
  const [group, leaf] = key.split('.') as [keyof Messages, string]
  const section = messages[group] as Record<string, string> | undefined
  const value = section?.[leaf]
  return typeof value === 'string' ? value : key
}

function interpolate(template: string, params?: TranslateParams): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    params[name] !== undefined ? String(params[name]) : `{${name}}`,
  )
}

export function createT(locale: Locale): TranslateFn {
  const messages = catalogs[locale] ?? ru
  return (key, params) => interpolate(resolve(messages, key), params)
}

export function getT(): TranslateFn {
  return createT(useLocaleStore.getState().locale)
}

export function useT(): TranslateFn {
  const locale = useLocaleStore((s) => s.locale)
  return useMemo(() => createT(locale), [locale])
}

export function levelTitleKey(level: number): TranslationKey {
  const clamped = Math.min(11, Math.max(1, level))
  return `levels.${clamped}` as TranslationKey
}
