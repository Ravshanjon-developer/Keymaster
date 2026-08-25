/** Turn lesson action_prompt into a natural quiz phrase (infinitive, no «действие»). */

/** IT terms stay in Russian/English in TJ quiz copy (per product copy rules). */
const LOANWORD_FIXES: Array<[RegExp, string]> = [
  [/муҳаррир/gi, 'редактор'],
  [/мизи кориро/gi, 'рабочий стол'],
  [/мизи кории/gi, 'рабочий стол'],
  [/мизи корӣ/gi, 'рабочий стол'],
  [/мизи корро/gi, 'рабочий стол'],
  [/мизи кор/gi, 'рабочий стол'],
  [/лоиҳа/gi, 'проект'],
  [/папкаҳо/gi, 'папки'],
  [/папкаи/gi, 'папка'],
  [/Папка-и/g, 'Папка'],
]

export function preserveQuizLoanwords(text: string): string {
  let out = text
  for (const [re, replacement] of LOANWORD_FIXES) {
    out = out.replace(re, replacement)
  }
  return out
}

const RU_PHRASE: Record<string, string> = {
  скопируйте: 'скопировать',
  вставьте: 'вставить',
  вырежьте: 'вырезать',
  'отмените действие': 'отменить действие',
  'верните отмену': 'повторить отмену',
  'выделите всё': 'выделить всё',
  'сохраните файл': 'сохранить файл',
  'откройте поиск': 'открыть поиск',
  'откройте замену': 'открыть замену',
  'в начало строки': 'перейти в начало строки',
  'в конец строки': 'перейти в конец строки',
  'к предыдущему слову': 'перейти к предыдущему слову',
  'к следующему слову': 'перейти к следующему слову',
  'откройте терминал': 'открыть терминал',
  'откройте встроенный терминал': 'открыть терминал',
}

const RU_PREFIX_RULES: Array<[RegExp, (rest: string) => string]> = [
  [/^откройте\s+/i, (r) => `открыть ${lowerRest(r)}`],
  [/^закройте\s+/i, (r) => `закрыть ${lowerRest(r)}`],
  [/^сохраните\s+/i, (r) => `сохранить ${lowerRest(r)}`],
  [/^отмените\s+/i, (r) => `отменить ${lowerRest(r)}`],
  [/^выделите\s+/i, (r) => `выделить ${lowerRest(r)}`],
  [/^скопируйте\s+/i, (r) => `скопировать ${lowerRest(r)}`],
  [/^вставьте\s+/i, (r) => `вставить ${lowerRest(r)}`],
  [/^вырежьте\s+/i, (r) => `вырезать ${lowerRest(r)}`],
]

function lowerRest(text: string): string {
  const t = text.trim()
  if (!t) return t
  return t.charAt(0).toLowerCase() + t.slice(1)
}

function ruQuizAction(action: string, title?: string): string {
  const trimmed = action.trim()
  const key = trimmed.toLowerCase()
  if (RU_PHRASE[key]) return RU_PHRASE[key]

  for (const [re, build] of RU_PREFIX_RULES) {
    const m = trimmed.match(re)
    if (m) return build(trimmed.slice(m[0].length))
  }

  if (title && /^откройте/i.test(trimmed)) {
    return `открыть ${title.toLowerCase()}`
  }

  return lowerRest(trimmed)
}

function tgQuizAction(action: string): string {
  return lowerRest(action.trim())
}

export function quizActionPhrase(action: string, locale: string, title?: string): string {
  const trimmed = action.trim()
  if (!trimmed) return title ? lowerRest(title) : ''
  const phrase =
    locale === 'tg' ? tgQuizAction(trimmed) : ruQuizAction(trimmed, title)
  return preserveQuizLoanwords(phrase)
}
