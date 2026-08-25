import type { Locale } from '@/shared/i18n/types'

export type QuizLevel = 'basic' | 'practical'

export type QuizBankItem = {
  id: number
  level: QuizLevel
  question: Record<Locale, string>
  options: Record<Locale, string>[]
  correctIndex: number
  explanation: Record<Locale, string>
}

const o = (text: string): Record<Locale, string> => ({ ru: text, tg: text })

export const HOTKEYS_QUIZ_BANK: QuizBankItem[] = [
  {
    id: 1,
    level: 'basic',
    question: {
      ru: 'Какая комбинация клавиш используется для копирования текста или файла?',
      tg: 'Кадом комбинатсияи тугмаҳо барои нусхабардории матн ё файл истифода мешавад?',
    },
    options: [o('Ctrl + X'), o('Ctrl + C'), o('Ctrl + V'), o('Ctrl + Z')],
    correctIndex: 1,
    explanation: {
      ru: 'Ctrl+C копирует выделенное в буфер обмена.',
      tg: 'Ctrl+C маълумоти интихобшударо ба буфер нусхабардорӣ мекунад.',
    },
  },
  {
    id: 2,
    level: 'basic',
    question: {
      ru: 'Какая комбинация клавиш используется для вставки скопированной или вырезанной информации?',
      tg: 'Кадом комбинатсияи тугмаҳо барои гузоштани маълумоти нусхабардорӣ ё буридашуда истифода мешавад?',
    },
    options: [o('Ctrl + A'), o('Ctrl + S'), o('Ctrl + V'), o('Ctrl + F')],
    correctIndex: 2,
    explanation: {
      ru: 'Ctrl+V вставляет содержимое из буфера.',
      tg: 'Ctrl+V маълумоти буферро мегузорад.',
    },
  },
  {
    id: 3,
    level: 'basic',
    question: {
      ru: 'Какая комбинация используется для вырезания текста или файла?',
      tg: 'Кадом комбинатсия барои буридани матн ё файл истифода мешавад?',
    },
    options: [o('Ctrl + X'), o('Ctrl + C'), o('Ctrl + Z'), o('Ctrl + Y')],
    correctIndex: 0,
    explanation: {
      ru: 'Ctrl+X вырезает — объект исчезает и попадает в буфер.',
      tg: 'Ctrl+X мебурад — объект ба буфер мегузарад.',
    },
  },
  {
    id: 4,
    level: 'basic',
    question: {
      ru: 'Вы случайно выполнили неправильное действие и хотите его отменить. Какую комбинацию используете?',
      tg: 'Шумо тасодуфан амали нодуруст иҷро кардед ва мехоҳед онро бекор кунед. Кадом комбинатсияро истифода мебаред?',
    },
    options: [o('Ctrl + Y'), o('Ctrl + Z'), o('Ctrl + H'), o('Ctrl + S')],
    correctIndex: 1,
    explanation: {
      ru: 'Ctrl+Z отменяет последнее действие.',
      tg: 'Ctrl+Z амали охиринро бекор мекунад.',
    },
  },
  {
    id: 5,
    level: 'basic',
    question: {
      ru: 'Какая комбинация используется для восстановления отменённого действия?',
      tg: 'Кадом комбинатсия барои барқарор кардани амали бекоршуда истифода мешавад?',
    },
    options: [o('Ctrl + Y'), o('Ctrl + R'), o('Ctrl + A'), o('Ctrl + X')],
    correctIndex: 0,
    explanation: {
      ru: 'Ctrl+Y повторяет отменённое действие.',
      tg: 'Ctrl+Y амали бекоршударо такрор мекунад.',
    },
  },
  {
    id: 6,
    level: 'basic',
    question: {
      ru: 'Вы хотите сразу выделить весь текст или все доступные элементы. Какую комбинацию используете?',
      tg: 'Шумо мехоҳед тамоми матн ё ҳамаи элементҳои мавҷударо якбора интихоб кунед. Кадом комбинатсияро истифода мебаред?',
    },
    options: [o('Ctrl + F'), o('Ctrl + A'), o('Ctrl + S'), o('Ctrl + C')],
    correctIndex: 1,
    explanation: {
      ru: 'Ctrl+A выделяет всё в активном окне.',
      tg: 'Ctrl+A ҳамаро дар равзанаи фаъол интихоб мекунад.',
    },
  },
  {
    id: 7,
    level: 'basic',
    question: {
      ru: 'Вы изменили файл и хотите быстро сохранить изменения. Какая комбинация подходит?',
      tg: 'Шумо файлро тағйир додед ва мехоҳед тағйиротро зуд захира кунед. Кадом комбинатсия дуруст аст?',
    },
    options: [o('Ctrl + H'), o('Ctrl + F'), o('Ctrl + S'), o('Ctrl + V')],
    correctIndex: 2,
    explanation: {
      ru: 'Ctrl+S сохраняет файл.',
      tg: 'Ctrl+S файлро нигоҳ медорад.',
    },
  },
  {
    id: 8,
    level: 'basic',
    question: {
      ru: 'Какая комбинация используется для поиска слова или фразы в документе или на странице?',
      tg: 'Кадом комбинатсия барои ҷустуҷӯи калима ё ибораи муайян дар ҳуҷҷат ё саҳифа истифода мешавад?',
    },
    options: [o('Ctrl + F'), o('Ctrl + H'), o('Ctrl + S'), o('Ctrl + A')],
    correctIndex: 0,
    explanation: {
      ru: 'Ctrl+F открывает поле поиска.',
      tg: 'Ctrl+F майдони ҷустуҷӯро кушода медиҳад.',
    },
  },
  {
    id: 9,
    level: 'basic',
    question: {
      ru: 'Какая комбинация используется для поиска и замены текста?',
      tg: 'Кадом комбинатсия барои ҷустуҷӯ ва иваз кардани матн истифода мешавад?',
    },
    options: [o('Ctrl + H'), o('Ctrl + F'), o('Ctrl + Y'), o('Ctrl + E')],
    correctIndex: 0,
    explanation: {
      ru: 'Ctrl+H — поиск и замена.',
      tg: 'Ctrl+H — ҷустуҷӯ ва иваз.',
    },
  },
  {
    id: 10,
    level: 'basic',
    question: {
      ru: 'Какая клавиша перемещает курсор в начало текущей строки?',
      tg: 'Кадом тугма курсорро ба аввали сатри ҷорӣ мебарад?',
    },
    options: [o('End'), o('Home'), o('Page Up'), o('Insert')],
    correctIndex: 1,
    explanation: {
      ru: 'Home — начало строки.',
      tg: 'Home — оғози сатр.',
    },
  },
  {
    id: 11,
    level: 'basic',
    question: {
      ru: 'Какая клавиша перемещает курсор в конец текущей строки?',
      tg: 'Кадом тугма курсорро ба охири сатри ҷорӣ мебарад?',
    },
    options: [o('Home'), o('End'), o('Delete'), o('Page Down')],
    correctIndex: 1,
    explanation: {
      ru: 'End — конец строки.',
      tg: 'End — охири сатр.',
    },
  },
  {
    id: 12,
    level: 'basic',
    question: {
      ru: 'Какая комбинация перемещает курсор на одно слово назад?',
      tg: 'Кадом комбинатсия курсорро як калима ба қафо мегузаронад?',
    },
    options: [o('Ctrl + →'), o('Ctrl + ←'), o('Alt + ←'), o('Shift + ←')],
    correctIndex: 1,
    explanation: {
      ru: 'Ctrl+← — на слово назад.',
      tg: 'Ctrl+← — як калима ба қафо.',
    },
  },
  {
    id: 13,
    level: 'basic',
    question: {
      ru: 'Какая комбинация перемещает курсор на одно слово вперёд?',
      tg: 'Кадом комбинатсия курсорро як калима ба пеш мегузаронад?',
    },
    options: [o('Ctrl + →'), o('Ctrl + ←'), o('Alt + →'), o('Shift + →')],
    correctIndex: 0,
    explanation: {
      ru: 'Ctrl+→ — на слово вперёд.',
      tg: 'Ctrl+→ — як калима ба пеш.',
    },
  },
  {
    id: 14,
    level: 'basic',
    question: {
      ru: 'Вы работаете с несколькими программами и хотите быстро переключаться между ними без мыши. Какую комбинацию используете?',
      tg: 'Шумо якчанд барномаро ҳамзамон истифода мебаред ва мехоҳед байни онҳо бе муш зуд гузаред. Кадом комбинатсияро истифода мебаред?',
    },
    options: [o('Alt + F4'), o('Alt + Tab'), o('Win + D'), o('Ctrl + Tab')],
    correctIndex: 1,
    explanation: {
      ru: 'Alt+Tab переключает окна.',
      tg: 'Alt+Tab байни тирезаҳо мегузарад.',
    },
  },
  {
    id: 15,
    level: 'basic',
    question: {
      ru: 'Какая комбинация закрывает активное окно?',
      tg: 'Кадом комбинатсия равзанаи фаъолро мебандад?',
    },
    options: [o('Alt + F4'), o('Alt + Tab'), o('Win + E'), o('Ctrl + W')],
    correctIndex: 0,
    explanation: {
      ru: 'Alt+F4 закрывает активное окно.',
      tg: 'Alt+F4 равзанаи фаъолро мебандад.',
    },
  },
  {
    id: 16,
    level: 'basic',
    question: {
      ru: 'Какая комбинация показывает рабочий стол и скрывает открытые окна?',
      tg: 'Кадом комбинатсия рабочий столро зуд нишон медиҳад ва равзанаҳои кушодаро пинҳон мекунад?',
    },
    options: [o('Win + E'), o('Win + D'), o('Win + Tab'), o('Alt + D')],
    correctIndex: 1,
    explanation: {
      ru: 'Win+D — показать рабочий стол.',
      tg: 'Win+D — рабочий столро нишон медиҳад.',
    },
  },
  {
    id: 17,
    level: 'basic',
    question: {
      ru: 'Какая комбинация открывает File Explorer Windows?',
      tg: 'Кадом комбинатсия File Explorer-и Windows-ро мекушояд?',
    },
    options: [o('Win + E'), o('Win + F'), o('Win + D'), o('Alt + E')],
    correctIndex: 0,
    explanation: {
      ru: 'Win+E открывает проводник.',
      tg: 'Win+E File Explorer-ро кушода медиҳад.',
    },
  },
  {
    id: 18,
    level: 'basic',
    question: {
      ru: 'Какая клавиша используется для скриншота всего экрана?',
      tg: 'Кадом тугма барои гирифтани скриншоти тамоми экран истифода мешавад?',
    },
    options: [o('Delete'), o('Print Screen (PrtSc)'), o('Home'), o('Pause')],
    correctIndex: 1,
    explanation: {
      ru: 'PrtSc — снимок всего экрана.',
      tg: 'PrtSc — скриншоти тамоми экран.',
    },
  },
  {
    id: 19,
    level: 'basic',
    question: {
      ru: 'Какая комбинация позволяет выбрать область экрана для скриншота?',
      tg: 'Кадом комбинатсия имкон медиҳад, ки танҳо як қисми экранро барои скриншот интихоб кунед?',
    },
    options: [o('Win + Shift + S'), o('Win + S'), o('Ctrl + Shift + S'), o('Alt + Shift + S')],
    correctIndex: 0,
    explanation: {
      ru: 'Win+Shift+S — выбор области экрана.',
      tg: 'Win+Shift+S — интихоби қисми экран.',
    },
  },
  {
    id: 20,
    level: 'practical',
    question: {
      ru: 'Вы используете браузер и VS Code и хотите быстро переключаться между ними без мыши. Какую комбинацию выберете?',
      tg: 'Шумо ҳамзамон браузер ва VS Code-ро истифода мебаред. Мехоҳед бе муш зуд байни онҳо гузаред. Кадом комбинатсияро интихоб мекунед?',
    },
    options: [o('Win + E'), o('Ctrl + F'), o('Alt + Tab'), o('Win + Shift + S')],
    correctIndex: 2,
    explanation: {
      ru: 'Alt+Tab — переключение между открытыми программами.',
      tg: 'Alt+Tab — гузариш байни барномаҳои кушода.',
    },
  },
  {
    id: 21,
    level: 'practical',
    question: {
      ru: 'Вы случайно удалили текст и хотите вернуть последнее действие. Какую комбинацию используете?',
      tg: 'Шумо тасодуфан матнро нест кардед ва мехоҳед амали охиринро баргардонед. Кадом комбинатсияро истифода мебаред?',
    },
    options: [o('Ctrl + Y'), o('Ctrl + Z'), o('Ctrl + C'), o('Ctrl + S')],
    correctIndex: 1,
    explanation: {
      ru: 'Ctrl+Z отменяет последнее изменение.',
      tg: 'Ctrl+Z тағироти охиринро бекор мекунад.',
    },
  },
  {
    id: 22,
    level: 'practical',
    question: {
      ru: 'Вы хотите выделить весь текст документа и скопировать его. Какая последовательность правильная?',
      tg: 'Шумо мехоҳед тамоми матни ҳуҷҷатро интихоб карда, онро нусхабардорӣ кунед. Кадом пайдарпайии амалҳо дуруст аст?',
    },
    options: [
      { ru: 'Ctrl + C → Ctrl + A', tg: 'Ctrl + C → Ctrl + A' },
      { ru: 'Ctrl + A → Ctrl + C', tg: 'Ctrl + A → Ctrl + C' },
      { ru: 'Ctrl + V → Ctrl + A', tg: 'Ctrl + V → Ctrl + A' },
      { ru: 'Ctrl + X → Ctrl + C', tg: 'Ctrl + X → Ctrl + C' },
    ],
    correctIndex: 1,
    explanation: {
      ru: 'Сначала выделить всё (Ctrl+A), затем копировать (Ctrl+C).',
      tg: 'Аввал Ctrl+A (интихоб), баъд Ctrl+C (нусхабардорӣ).',
    },
  },
  {
    id: 23,
    level: 'practical',
    question: {
      ru: 'Вы хотите переместить файл из одной папки в другую. Какая последовательность правильная?',
      tg: 'Шумо мехоҳед файлро аз як папка ба папка дигар интиқол диҳед. Кадом пайдарпайии амалҳо дуруст аст?',
    },
    options: [
      { ru: 'Ctrl + C → Ctrl + V', tg: 'Ctrl + C → Ctrl + V' },
      { ru: 'Ctrl + X → Ctrl + V', tg: 'Ctrl + X → Ctrl + V' },
      { ru: 'Ctrl + Z → Ctrl + V', tg: 'Ctrl + Z → Ctrl + V' },
      { ru: 'Ctrl + A → Ctrl + S', tg: 'Ctrl + A → Ctrl + S' },
    ],
    correctIndex: 1,
    explanation: {
      ru: 'Ctrl+X вырезает, Ctrl+V вставляет — это перемещение.',
      tg: 'Ctrl+X мебурад, Ctrl+V мегузорад — ин интиқол аст.',
    },
  },
  {
    id: 24,
    level: 'practical',
    question: {
      ru: 'Вы хотите быстро закрыть активное приложение или окно. Какую комбинацию используете?',
      tg: 'Шумо мехоҳед барнома ё равзанаи фаъолро зуд пӯшед. Кадом комбинатсияро истифода мебаред?',
    },
    options: [o('Alt + Tab'), o('Win + D'), o('Alt + F4'), o('Ctrl + F4')],
    correctIndex: 2,
    explanation: {
      ru: 'Alt+F4 закрывает активное окно.',
      tg: 'Alt+F4 равзанаи фаъолро мебандад.',
    },
  },
  {
    id: 25,
    level: 'practical',
    question: {
      ru: 'Перед вами большой текст. Как быстро найти слово «function» без ручного просмотра?',
      tg: 'Пеши шумо матни калон аст. Чӣ тавр калимаи «function»-ро бе хондани тамоми матн зуд пайдо кунед?',
    },
    options: [
      {
        ru: 'Нажать Ctrl + H и ввести слово',
        tg: 'Ctrl + H-ро пахш карда, калимаро ворид кардан',
      },
      {
        ru: 'Нажать Ctrl + F, затем ввести слово в поле поиска',
        tg: 'Ctrl + F-ро пахш карда, калимаро дар майдони ҷустуҷӯ ворид кардан',
      },
      {
        ru: 'Нажать Ctrl + S и ввести слово',
        tg: 'Ctrl + S-ро пахш карда, калимаро ворид кардан',
      },
      {
        ru: 'Нажать Ctrl + Z и ввести слово',
        tg: 'Ctrl + Z-ро пахш карда, калимаро ворид кардан',
      },
    ],
    correctIndex: 1,
    explanation: {
      ru: 'Ctrl+F открывает поиск — введите слово и найдите его сразу.',
      tg: 'Ctrl+F ҷустуҷӯро кушода медиҳад — калимаро ворид кунед.',
    },
  },
]

export const QUIZ_XP_PER_CORRECT = 5

export function getHotkeysQuiz(locale: Locale): Array<{
  id: number
  level: QuizLevel
  question: string
  options: string[]
  correctIndex: number
  explanation: string
  correctAnswer: string
}> {
  return HOTKEYS_QUIZ_BANK.map((item) => ({
    id: item.id,
    level: item.level,
    question: item.question[locale],
    options: item.options.map((opt) => opt[locale]),
    correctIndex: item.correctIndex,
    explanation: item.explanation[locale],
    correctAnswer: item.options[item.correctIndex][locale],
  }))
}
