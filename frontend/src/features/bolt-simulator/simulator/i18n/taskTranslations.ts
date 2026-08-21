import type { Locale } from '@/shared/i18n/types';
import type { Task } from '@/features/bolt-simulator/simulator/types/tasks';

export type TaskCopy = {
  title: string;
  description: string;
  hints: string[];
  steps: Record<string, string>;
};

const ru: Record<string, TaskCopy> = {
  'task.create-file': {
    title: 'Создать новый файл',
    description: 'Создайте новый файл в проекте — через сочетание клавиш или контекстное меню.',
    hints: [
      'Щёлкните правой кнопкой в Explorer и выберите создание файла.',
      'Команду «New File» можно вызвать из палитры команд (Ctrl+Shift+P).',
      'Быстрее всего — Ctrl+N.',
    ],
    steps: { 'file-created': 'В проекте появился новый файл' },
  },
  'task.create-folder': {
    title: 'Создать папку',
    description: 'Создайте в корне проекта папку с именем «assets».',
    hints: [
      'Папку нужно создать на верхнем уровне проекта.',
      'Щёлкните правой кнопкой по корню или используйте кнопку New Folder на панели Explorer.',
      'Имя папки должно быть точно «assets».',
    ],
    steps: { 'folder-exists': 'В корне есть папка «assets»' },
  },
  'task.rename-file': {
    title: 'Переименовать файл',
    description: 'Переименуйте «index.html» в «index2.html».',
    hints: [
      'Щёлкните правой кнопкой по файлу в Explorer — пункт Rename.',
      'Можно нажать F2, когда файл выделен.',
      'Новое имя: «index2.html».',
    ],
    steps: { renamed: 'Файл index.html переименован в index2.html' },
  },
  'task.delete-file': {
    title: 'Удалить файл',
    description: 'Удалите файл «package.json» из корня проекта.',
    hints: [
      'Щёлкните правой кнопкой по файлу и выберите Delete.',
      'Или выделите файл и нажмите Delete на клавиатуре.',
      'Файл «package.json» должен исчезнуть из проекта.',
    ],
    steps: { deleted: 'Файл package.json удалён' },
  },
  'task.open-file': {
    title: 'Открыть файл',
    description: 'Откройте в редакторе файл «main.py».',
    hints: [
      'Нажмите на файл в Explorer.',
      'Или Quick Open (Ctrl+P) и введите имя файла.',
      '«main.py» должен появиться вкладкой редактора.',
    ],
    steps: { opened: 'main.py открыт во вкладке' },
  },
  'task.save-file': {
    title: 'Сохранить файл',
    description: 'Откройте файл, измените текст и сохраните сочетанием Ctrl+S.',
    hints: [
      'Сначала откройте файл и внесите любое изменение.',
      'Сохранение — Ctrl+S.',
      'После сохранения индикатор изменений (точка на вкладке) исчезнет.',
    ],
    steps: { saved: 'Выполнено сохранение файла' },
  },
  'task.toggle-sidebar': {
    title: 'Показать или скрыть боковую панель',
    description: 'Скройте и снова откройте боковую панель с помощью Ctrl+B.',
    hints: [
      'Есть сочетание клавиш для левой боковой панели.',
      'Это Ctrl+B.',
      'Нажмите Ctrl+B, чтобы переключить видимость панели.',
    ],
    steps: { toggled: 'Боковая панель переключена' },
  },
  'task.toggle-terminal': {
    title: 'Открыть терминал',
    description: 'Покажите или скройте панель терминала сочетанием Ctrl+` (клавиша «ё»).',
    hints: [
      'Терминал открывается сочетанием Ctrl+` (backtick).',
      'Панель появится внизу окна редактора.',
      'Нажмите Ctrl+`, чтобы открыть терминал.',
    ],
    steps: { opened: 'Терминал отображается' },
  },
  'task.create-components-folder': {
    title: 'Папка components в src',
    description: 'Создайте папку «components» внутри каталога «src».',
    hints: [
      'Папку нужно создать внутри src, а не в корне проекта.',
      'Сначала разверните src, затем создайте вложенную папку.',
      'Имя папки — «components», родитель — src.',
    ],
    steps: { 'folder-in-src': 'Существует путь src/components/' },
  },
  'task.create-button-jsx': {
    title: 'Создать Button.jsx',
    description: 'Создайте файл «Button.jsx» внутри папки «components».',
    hints: [
      'Файл должен лежать в components, а не в корне.',
      'Щёлкните правой кнопкой по components → New File.',
      'Имя файла: «Button.jsx».',
    ],
    steps: { 'file-exists': 'Существует components/Button.jsx' },
  },
  'task.command-palette': {
    title: 'Палитра команд',
    description: 'Откройте палитру команд сочетанием Ctrl+Shift+P.',
    hints: [
      'Палитра — центральный способ вызова команд редактора.',
      'Сочетание: Ctrl+Shift+P.',
      'После открытия можно искать команды по названию.',
    ],
    steps: { opened: 'Палитра команд открыта' },
  },
  'task.global-search': {
    title: 'Поиск по проекту',
    description: 'Откройте глобальный поиск сочетанием Ctrl+Shift+F.',
    hints: [
      'Ищет текст во всех файлах проекта.',
      'Сочетание: Ctrl+Shift+F.',
      'Откроется панель Search слева.',
    ],
    steps: { 'search-opened': 'Глобальный поиск открыт' },
  },
  'task.find-in-file': {
    title: 'Поиск в файле',
    description: 'Откройте строку поиска в редакторе сочетанием Ctrl+F.',
    hints: [
      'Поиск только в текущем открытом файле.',
      'Сочетание: Ctrl+F.',
      'Панель поиска появится над текстом редактора.',
    ],
    steps: { 'find-opened': 'Строка поиска открыта' },
  },
  'task.close-tab': {
    title: 'Закрыть вкладку',
    description: 'Откройте файл и закройте его вкладку сочетанием Ctrl+W.',
    hints: [
      'Сначала откройте любой файл — появится вкладка.',
      'Закрытие активной вкладки: Ctrl+W.',
      'Нажмите Ctrl+W при активной вкладке.',
    ],
    steps: { closed: 'Вкладка закрыта' },
  },
  'task.reopen-tab': {
    title: 'Открыть закрытую вкладку',
    description: 'Закройте вкладку, затем верните её сочетанием Ctrl+Shift+T.',
    hints: [
      'Сначала закройте вкладку (Ctrl+W).',
      'Восстановление: Ctrl+Shift+T.',
      'Последняя закрытая вкладка откроется снова.',
    ],
    steps: { reopened: 'Закрытая вкладка восстановлена' },
  },
  'task.toggle-comment': {
    title: 'Комментарий к строке',
    description: 'Откройте файл, установите курсор на строку и переключите комментарий (Ctrl+/).',
    hints: [
      'Откройте файл и щёлкните по строке кода.',
      'Сочетание: Ctrl+/ (комментировать / раскомментировать).',
      'Строка будет закомментирована или восстановлена.',
    ],
    steps: { commented: 'Комментарий строки переключён' },
  },
  'task.move-line-down': {
    title: 'Переместить строку вниз',
    description: 'Откройте файл и переместите текущую строку вниз: Alt+Стрелка вниз.',
    hints: [
      'Курсор должен быть на перемещаемой строке.',
      'Сочетание: Alt+ArrowDown.',
      'Строка опустится на одну позицию.',
    ],
    steps: { moved: 'Строка перемещена' },
  },
  'task.duplicate-line': {
    title: 'Дублировать строку',
    description: 'Продублируйте текущую строку вниз: Shift+Alt+Стрелка вниз.',
    hints: [
      'Установите курсор на нужную строку.',
      'Сочетание: Shift+Alt+ArrowDown.',
      'Под исходной строкой появится её копия.',
    ],
    steps: { duplicated: 'Строка продублирована' },
  },
  'task.undo': {
    title: 'Отменить действие',
    description: 'Измените файл и отмените правку сочетанием Ctrl+Z.',
    hints: [
      'Сначала внесите любое изменение в текст.',
      'Отмена: Ctrl+Z.',
      'Последнее изменение будет отменено.',
    ],
    steps: { undone: 'Выполнена отмена (Undo)' },
  },
  'task.select-next': {
    title: 'Выделить следующее вхождение',
    description: 'Выделите слово и добавьте следующее совпадение: Ctrl+D.',
    hints: [
      'Дважды щёлкните по слову или выделите его.',
      'Сочетание: Ctrl+D.',
      'Каждое нажатие добавляет следующее такое же слово в выделение.',
    ],
    steps: { selected: 'Использовано «Select next occurrence»' },
  },
  'task.create-structure': {
    title: 'Структура проекта',
    description: 'Создайте в корне папку «styles», затем файл «main.css» внутри неё.',
    hints: [
      'Нужны и папка, и файл внутри неё.',
      'Сначала создайте «styles» в корне проекта.',
      'Затем «main.css» внутри «styles».',
    ],
    steps: {
      'styles-folder': 'В корне есть папка styles/',
      'main-css': 'Существует styles/main.css',
    },
  },
  'task.terminal-mkdir': {
    title: 'Папка через терминал',
    description: 'Откройте терминал и выполните команду: mkdir lib',
    hints: [
      'Используйте терминал, а не Explorer.',
      'Команда создания каталога: mkdir.',
      'Введите mkdir lib и нажмите Enter.',
    ],
    steps: { 'lib-created': 'В корне есть папка lib/' },
  },
  'task.terminal-touch': {
    title: 'Файл через терминал',
    description: 'В терминале выполните: touch config.json',
    hints: [
      'Работаем в панели терминала.',
      'Пустой файл создаётся командой touch.',
      'Введите touch config.json и нажмите Enter.',
    ],
    steps: { 'config-created': 'В корне есть config.json' },
  },
};

const tg: Record<string, TaskCopy> = {
  'task.create-file': {
    title: 'Эҷоди файли нав',
    description: 'Дар лоиҳа файли нав эҷод кунед — бо миёнбур ё менюи контекстӣ.',
    hints: [
      'Дар Explorer бо тугмаи рост клик кунед ва файли нав созед.',
      'Амали «New File»-ро аз палитраи фармон (Ctrl+Shift+P) низ метавонед фарохонид.',
      'Зудтарин роҳ — Ctrl+N.',
    ],
    steps: { 'file-created': 'Файли нав дар кори лоиҳа мавҷуд аст' },
  },
  'task.create-folder': {
    title: 'Эҷоди папка',
    description: 'Дар решаи лоиҳа папка бо номи «assets» эҷод кунед.',
    hints: [
      'Папкаро дар сатҳи болои лоиҳа созед.',
      'Ба реша клики рост кунед ё тугмаи New Folder дар Explorer-ро истифода баред.',
      'Номи папка бояд дақиқ «assets» бошад.',
    ],
    steps: { 'folder-exists': 'Дар реша папкаи «assets» ҳаст' },
  },
  'task.rename-file': {
    title: 'Тағйири номи файл',
    description: '«index.html»-ро ба «index2.html» иваз ном кунед.',
    hints: [
      'Дар Explorer ба файл клики рост кунед — гузинаи Rename.',
      'Ҳангоми интихоби файл F2-ро пахш кардан мумкин аст.',
      'Номи нав: «index2.html».',
    ],
    steps: { renamed: 'index.html ба index2.html иваз ном шуд' },
  },
  'task.delete-file': {
    title: 'Нест кардани файл',
    description: 'Файли «package.json»-ро аз решаи лоиҳа нест кунед.',
    hints: [
      'Ба файл клики рост кунед ва Delete-ро интихоб кунед.',
      'Ё файлро интихоб карда тугмаи Delete-ро пахш кунед.',
      '«package.json» бояд аз лоиҳа нест шавад.',
    ],
    steps: { deleted: 'package.json нест карда шуд' },
  },
  'task.open-file': {
    title: 'Кушодани файл',
    description: 'Файли «main.py»-ро дар муҳаррир кушоед.',
    hints: [
      'Дар Explorer ба файл клик кунед.',
      'Ё Quick Open (Ctrl+P) ва номи файлро нависед.',
      '«main.py» бояд ҳамчун вкладка намоён шавад.',
    ],
    steps: { opened: 'main.py дар вкладка кушода аст' },
  },
  'task.save-file': {
    title: 'Захира кардани файл',
    description: 'Файлро кушоед, тағирот диҳед ва бо Ctrl+S захира кунед.',
    hints: [
      'Аввал файлро кушоед ва як тағирот ворид кунед.',
      'Захира — Ctrl+S.',
      'Баъд аз захира нишонаи тағирот (нуқта дар вкладка) нест мешавад.',
    ],
    steps: { saved: 'Захираи файл иҷро шуд' },
  },
  'task.toggle-sidebar': {
    title: 'Панели бокавӣ',
    description: 'Панели чапро бо Ctrl+B пинҳон ё намоиш диҳед.',
    hints: [
      'Барои панели чап миёнбур мавҷуд аст.',
      'Ин Ctrl+B мебошад.',
      'Ctrl+B-ро пахш кунед, то намоиши панел иваз шавад.',
    ],
    steps: { toggled: 'Панели бокавӣ иваз шуд' },
  },
  'task.toggle-terminal': {
    title: 'Кушодани терминал',
    description: 'Панели терминалро бо Ctrl+` намоиш диҳед ё пинҳон кунед.',
    hints: [
      'Терминал бо миёнбури Ctrl+` (backtick) кушода мешавад.',
      'Панел дар поёни муҳаррир пайдо мешавад.',
      'Ctrl+`-ро пахш кунед, то терминал кушода шавад.',
    ],
    steps: { opened: 'Терминал намоиш дода мешавад' },
  },
  'task.create-components-folder': {
    title: 'Папкаи components дар src',
    description: 'Дар дохили «src» папка бо номи «components» эҷод кунед.',
    hints: [
      'Папкаро дар дохили src созед, на дар реша.',
      'Аввал src-ро кушоед, сипас папкаи тарафдор.',
      'Ном — «components», волидай — src.',
    ],
    steps: { 'folder-in-src': 'src/components/ мавҷуд аст' },
  },
  'task.create-button-jsx': {
    title: 'Эҷоди Button.jsx',
    description: 'Дар дохили «components» файл «Button.jsx» эҷод кунед.',
    hints: [
      'Файл бояд дар components бошад, на дар реша.',
      'Ба components клики рост → New File.',
      'Номи файл: «Button.jsx».',
    ],
    steps: { 'file-exists': 'components/Button.jsx мавҷуд аст' },
  },
  'task.command-palette': {
    title: 'Палитраи фармон',
    description: 'Палитраи фармонро бо Ctrl+Shift+P кушоед.',
    hints: [
      'Палитра — роҳи асосии фарохонидани фармонҳо.',
      'Миёнбур: Ctrl+Shift+P.',
      'Пас аз кушодан фармонҳоро ҷустуҷӯ кунед.',
    ],
    steps: { opened: 'Палитраи фармон кушода шуд' },
  },
  'task.global-search': {
    title: 'Ҷустуҷӯ дар лоиҳа',
    description: 'Ҷустуҷӯи умумиро бо Ctrl+Shift+F кушоед.',
    hints: [
      'Матнро дар ҳамаи файлҳои лоиҳа меҷӯяд.',
      'Миёнбур: Ctrl+Shift+F.',
      'Панели Search чап кушода мешавад.',
    ],
    steps: { 'search-opened': 'Ҷустуҷӯи умумӣ кушода аст' },
  },
  'task.find-in-file': {
    title: 'Ҷустуҷӯ дар файл',
    description: 'Сатри ҷустуҷӯ дар муҳаррирро бо Ctrl+F кушоед.',
    hints: [
      'Танҳо дар файли кушодашуда меҷӯяд.',
      'Миёнбур: Ctrl+F.',
      'Сатри ҷустуҷӯ болои матн намоён мешавад.',
    ],
    steps: { 'find-opened': 'Сатри ҷустуҷӯ кушода шуд' },
  },
  'task.close-tab': {
    title: 'Пӯшидани вкладка',
    description: 'Файлро кушоед ва вкладкаро бо Ctrl+W пӯшед.',
    hints: [
      'Аввал файле кушоед — вкладка пайдо мешавад.',
      'Пӯшидани вкладкаи фаъол: Ctrl+W.',
      'Ctrl+W-ро ҳангоми вкладкаи фаъол пахш кунед.',
    ],
    steps: { closed: 'Вкладка пӯшида шуд' },
  },
  'task.reopen-tab': {
    title: 'Бозкунии вкладкаи пӯшида',
    description: 'Вкладкаро пӯшед, сипас бо Ctrl+Shift+T баргардонед.',
    hints: [
      'Аввал вкладкаро пӯшед (Ctrl+W).',
      'Барқарорсозӣ: Ctrl+Shift+T.',
      'Охирин вкладкаи пӯшида боз кушода мешавад.',
    ],
    steps: { reopened: 'Вкладкаи пӯшида баргардонида шуд' },
  },
  'task.toggle-comment': {
    title: 'Комментарии сатр',
    description: 'Файлро кушоед, курсорро дар сатр гузоред ва бо Ctrl+/ комментариро иваз кунед.',
    hints: [
      'Файлро кушоед ва ба сатри код клик кунед.',
      'Миёнбур: Ctrl+/ (комментарий / бекомментарий).',
      'Сатр комментарий ё бармегардад.',
    ],
    steps: { commented: 'Комментарии сатр иваз шуд' },
  },
  'task.move-line-down': {
    title: 'Бурдани сатр ба поён',
    description: 'Сатри ҷориро бо Alt+Тирчаи поён ба поён бибаред.',
    hints: [
      'Курсор бояд дар сатре бошад, ки мехоҳед бибаред.',
      'Миёнбур: Alt+ArrowDown.',
      'Сатр як мавқеъ ба поён меравад.',
    ],
    steps: { moved: 'Сатр кӯчонида шуд' },
  },
  'task.duplicate-line': {
    title: 'Такрори сатр',
    description: 'Сатри ҷориро ба поён такрор кунед: Shift+Alt+Тирчаи поён.',
    hints: [
      'Курсорро дар сатр гузоред.',
      'Миёнбур: Shift+Alt+ArrowDown.',
      'Зери сатр нусха пайдо мешавад.',
    ],
    steps: { duplicated: 'Сатр такрор шуд' },
  },
  'task.undo': {
    title: 'Бекор кардан',
    description: 'Файлро тағир диҳед ва бо Ctrl+Z бекор кунед.',
    hints: [
      'Аввал дар матн тағирот ворид кунед.',
      'Бекор: Ctrl+Z.',
      'Охирин тағирот бекор мешавад.',
    ],
    steps: { undone: 'Undo иҷро шуд' },
  },
  'task.select-next': {
    title: 'Интихоби такрори навбатӣ',
    description: 'Калимаро интихоб кунед ва такрори навбатиро бо Ctrl+D илова кунед.',
    hints: [
      'Ду бор клик кунед ё калимаро интихоб кунед.',
      'Миёнбур: Ctrl+D.',
      'Ҳар пахш такрори навбатиро ба интихоб илова мекунад.',
    ],
    steps: { selected: '«Select next occurrence» истифода шуд' },
  },
  'task.create-structure': {
    title: 'Сохтори лоиҳа',
    description: 'Дар реша «styles» созед, сипас «main.css» дар дохили он.',
    hints: [
      'Ҳам папка ва ҳам файл дар дохили он лозим аст.',
      'Аввал «styles»-ро дар реша эҷод кунед.',
      'Сипас «main.css» дар «styles».',
    ],
    steps: {
      'styles-folder': 'Дар реша папкаи styles/ ҳаст',
      'main-css': 'styles/main.css мавҷуд аст',
    },
  },
  'task.terminal-mkdir': {
    title: 'Папка тавассути терминал',
    description: 'Терминалро кушоед ва фармонро иҷро кунед: mkdir lib',
    hints: [
      'Аз терминал истифода баред, на Explorer.',
      'Фармони эҷоди папка: mkdir.',
      'mkdir lib навишед ва Enter пахш кунед.',
    ],
    steps: { 'lib-created': 'Дар реша папкаи lib/ ҳаст' },
  },
  'task.terminal-touch': {
    title: 'Файл тавассути терминал',
    description: 'Дар терминал иҷро кунед: touch config.json',
    hints: [
      'Дар панели терминал кор кунед.',
      'Файли холӣ бо touch эҷод мешавад.',
      'touch config.json навишед ва Enter пахш кунед.',
    ],
    steps: { 'config-created': 'Дар реша config.json мавҷуд аст' },
  },
};

const catalogs: Record<Locale, Record<string, TaskCopy>> = { ru, tg };

export function getTaskCopy(task: Task, locale: Locale): Task {
  const copy = catalogs[locale][task.id];
  if (!copy) return task;
  return {
    ...task,
    title: copy.title,
    description: copy.description,
    hints: copy.hints,
    steps: task.steps.map((s) => ({
      ...s,
      label: copy.steps[s.id] ?? s.label,
    })),
  };
}

export function localizeCategory(category: string, locale: Locale): string {
  const map: Record<Locale, Record<string, string>> = {
    ru: {
      explorer: 'проводник',
      editor: 'редактор',
      navigation: 'навигация',
      terminal: 'терминал',
      layout: 'интерфейс',
      search: 'поиск',
      command: 'команды',
      files: 'файлы',
    },
    tg: {
      explorer: 'проводник',
      editor: 'муҳаррир',
      navigation: 'навигация',
      terminal: 'терминал',
      layout: 'интерфейс',
      search: 'ҷустуҷӯ',
      command: 'фармонҳо',
      files: 'файлҳо',
    },
  };
  return map[locale][category] ?? category;
}

export function localizeDifficulty(difficulty: string, locale: Locale): string {
  const map: Record<Locale, Record<string, string>> = {
    ru: {
      beginner: 'Начальный',
      intermediate: 'Средний',
      advanced: 'Продвинутый',
      expert: 'Эксперт',
    },
    tg: {
      beginner: 'Оғозин',
      intermediate: 'Миёна',
      advanced: 'Пешрафта',
      expert: 'Устод',
    },
  };
  return map[locale][difficulty] ?? difficulty;
}
