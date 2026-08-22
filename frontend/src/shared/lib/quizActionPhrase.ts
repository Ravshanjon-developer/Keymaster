/** Turn lesson action_prompt into a natural quiz phrase (infinitive, no «действие»). */

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
  'переключение окон': 'переключить окно',
  'закрытие программы': 'закрыть программу',
  'показать рабочий стол': 'показать рабочий стол',
  'открыть проводник': 'открыть проводник',
  'снимок экрана': 'сделать снимок экрана',
  'снимок области': 'сделать снимок области',
  'откройте новую вкладку': 'открыть новую вкладку',
  'закройте вкладку': 'закрыть вкладку',
  'восстановите закрытую вкладку': 'восстановить закрытую вкладку',
  'фокус на адресной строке': 'перейти в адресную строку',
  'обновите страницу': 'обновить страницу',
  'обновите без кэша': 'обновить страницу без кэша',
  'откройте историю': 'открыть историю',
  'откройте загрузки': 'открыть загрузки',
  'откройте инструменты разработчика': 'открыть инструменты разработчика',
  'откройте консоль': 'открыть консоль',
  'откройте терминал': 'открыть терминал',
  'откройте встроенный терминал': 'открыть терминал',
  'создайте новый терминал': 'создать новый терминал',
  'очистите вывод терминала': 'очистить терминал',
}

const RU_PREFIX_RULES: Array<[RegExp, (rest: string) => string]> = [
  [/^откройте\s+/i, (r) => `открыть ${lowerRest(r)}`],
  [/^закройте\s+/i, (r) => `закрыть ${lowerRest(r)}`],
  [/^создайте\s+/i, (r) => `создать ${lowerRest(r)}`],
  [/^сохраните\s+/i, (r) => `сохранить ${lowerRest(r)}`],
  [/^обновите\s+/i, (r) => `обновить ${lowerRest(r)}`],
  [/^восстановите\s+/i, (r) => `восстановить ${lowerRest(r)}`],
  [/^очистите\s+/i, (r) => `очистить ${lowerRest(r)}`],
  [/^перейдите\s+/i, (r) => `перейти ${lowerRest(r)}`],
  [/^дублируйте\s+/i, (r) => `дублировать ${lowerRest(r)}`],
  [/^отмените\s+/i, (r) => `отменить ${lowerRest(r)}`],
  [/^выделите\s+/i, (r) => `выделить ${lowerRest(r)}`],
  [/^скопируйте\s+/i, (r) => `скопировать ${lowerRest(r)}`],
  [/^вставьте\s+/i, (r) => `вставить ${lowerRest(r)}`],
  [/^вырежьте\s+/i, (r) => `вырезать ${lowerRest(r)}`],
  [/^сделайте\s+/i, (r) => `сделать ${lowerRest(r)}`],
  [/^переключите\s+/i, (r) => `переключить ${lowerRest(r)}`],
  [/^сверните\s+/i, (r) => `свернуть ${lowerRest(r)}`],
  [/^заблокируйте\s+/i, (r) => `заблокировать ${lowerRest(r)}`],
  [/^фокус на\s+/i, (r) => `перейти в ${lowerRest(r)}`],
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

const TG_KUNED = /\s+кунед$/i
const TG_KUSH = /\s+кушоед$/i

function tgQuizAction(action: string): string {
  const trimmed = action.trim()
  if (TG_KUNED.test(trimmed)) {
    return trimmed.replace(TG_KUNED, ' кардан').replace(/^\s*/, '').toLowerCase()
  }
  if (TG_KUSH.test(trimmed)) {
    return trimmed.replace(TG_KUSH, ' кушодан').toLowerCase()
  }
  return lowerRest(trimmed)
}

export function quizActionPhrase(action: string, locale: string, title?: string): string {
  const trimmed = action.trim()
  if (!trimmed) return title?.toLowerCase() ?? ''
  if (locale === 'tg') return tgQuizAction(trimmed)
  return ruQuizAction(trimmed, title)
}
