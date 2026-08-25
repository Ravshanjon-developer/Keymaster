import { parseTaskSteps } from '@/shared/lib/taskSteps'

import { getComputerBasicsPack, type TeachPack } from './computerBasicsPlaybooks'
import {
  classifyLesson,
  splitFacts,
  terminalExample,
  type LessonKind,
  type TerminalLine,
} from './lessonView'

export type FeatureTone = 'blue' | 'amber' | 'green'

export type FeatureItem = {
  tone: FeatureTone
  title: string
  text: string
}

export type LessonCard = {
  summary: string
  whatIntro: string
  features: FeatureItem[]
  whenToUse: string[]
  steps: string[]
  terminal: TerminalLine[]
  showSyntax: boolean
  showExample: boolean
  teach?: TeachPack
}

const TONES: FeatureTone[] = ['blue', 'amber', 'green']

export function cmdSlug(keys: string[]): string {
  const raw = keys[0]
  return typeof raw === 'string' && raw.startsWith('cmd:') ? raw.slice(4) : ''
}

export function terminalPlain(lines: TerminalLine[]): string {
  return lines.map((line) => line.text).join('\n')
}

function splitTitle(text: string): { title: string; text: string } {
  const dash = text.split(/\s[—–-]\s/)
  if (dash.length >= 2) {
    return { title: dash[0]!.trim(), text: dash.slice(1).join(' — ').trim() }
  }
  return { title: '', text }
}

function unique(items: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of items) {
    const key = item.trim()
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(key)
  }
  return out
}

type Locale = 'ru' | 'tg'

type GitPack = {
  summary: string
  whatIntro: string
  features: FeatureItem[]
  whenToUse: string[]
  steps: string[]
  terminal: TerminalLine[]
}

const GIT_RU: Record<string, GitPack> = {
  intro: {
    summary: 'Git хранит историю проекта на компьютере. GitHub — отдельный онлайн-сервис для репозиториев и работы в команде.',
    whatIntro: 'Git — это система контроля версий. Она запоминает снимки проекта, чтобы можно было вернуться назад и работать вместе.',
    features: [
      { tone: 'blue', title: 'История', text: 'каждый commit — снимок файлов на компьютере.' },
      { tone: 'amber', title: 'Локально', text: 'Git работает у вас на диске, даже без интернета.' },
      { tone: 'green', title: 'GitHub', text: 'онлайн-копия репозитория для команды и бэкапа.' },
    ],
    whenToUse: [
      'Когда начинаете любой проект с кодом.',
      'Когда боитесь потерять рабочую версию файлов.',
      'Когда нужно понять, чем Git отличается от GitHub.',
    ],
    steps: [
      'Прочитайте, зачем нужен Git',
      'Запомните: Git — на компьютере, GitHub — в интернете',
      'Отметьте урок выполненным',
    ],
    terminal: [],
  },
  version: {
    summary: 'Проверяет, установлен ли Git, и показывает номер версии.',
    whatIntro: 'Первая команда после установки — убедиться, что Git отвечает:',
    features: [
      { tone: 'blue', title: 'Установка', text: 'если команда печатает git version 2.x.x, Git готов.' },
      { tone: 'amber', title: 'Ошибка', text: 'если «command not found» — Git ещё не установлен или не в PATH.' },
      { tone: 'green', title: 'Терминал', text: 'команду вводят в PowerShell, cmd или Terminal, не в браузере.' },
    ],
    whenToUse: [
      'Сразу после установки Git.',
      'На новом компьютере, прежде чем делать commit.',
      'Когда команда git вдруг «не находится».',
    ],
    steps: ['Откройте терминал', 'Введите команду:', 'Если видите номер версии — Git готов'],
    terminal: [
      { text: '$ git --version', tone: 'cmd' },
      { text: 'git version 2.45.1', tone: 'ok' },
    ],
  },
  config: {
    summary: 'Задаёт имя и email, которые попадут в каждый commit.',
    whatIntro: 'Git подписывает снимки автором. Без config commit может отказаться сохраняться:',
    features: [
      { tone: 'blue', title: 'user.name', text: 'ваше имя в истории проекта.' },
      { tone: 'amber', title: 'user.email', text: 'почта, по которой GitHub узнает автора.' },
      { tone: 'green', title: '--global', text: 'настройка для всех репозиториев на этом компьютере.' },
    ],
    whenToUse: [
      'Один раз после установки Git.',
      'Если commit пишет, что не задан identity.',
      'Когда сменили имя или почту.',
    ],
    steps: [
      'Задайте имя: git config --global user.name "Your Name"',
      'Задайте email: git config --global user.email "you@example.com"',
      'Проверьте: git config --list',
    ],
    terminal: [
      { text: '$ git config --global user.name "Ada"', tone: 'cmd' },
      { text: '$ git config --list', tone: 'cmd' },
      { text: 'user.name=Ada', tone: 'ok' },
      { text: 'user.email=ada@example.com', tone: 'muted' },
    ],
  },
  init: {
    summary: 'Превращает текущую папку в Git-репозиторий.',
    whatIntro: 'После init в папке появляется скрытый каталог .git — в нём живёт история:',
    features: [
      { tone: 'blue', title: '.git', text: 'служебная папка с историей. Не редактируйте её руками.' },
      { tone: 'amber', title: 'Пустой старт', text: 'файлы ещё не в истории, пока не будет commit.' },
      { tone: 'green', title: 'git status', text: 'сразу после init покажет ветку и untracked файлы.' },
    ],
    whenToUse: [
      'Когда проект ещё не под Git.',
      'Когда создаёте новую папку с нуля.',
      'Не нужен, если вы уже сделали git clone.',
    ],
    steps: ['Создайте папку my-project', 'Перейдите в неё: cd my-project', 'Выполните команду:'],
    terminal: [
      { text: '$ git init', tone: 'cmd' },
      { text: 'Initialized empty Git repository in /my-project/.git/', tone: 'ok' },
    ],
  },
  clone: {
    summary: 'Скачивает готовый репозиторий с историей на компьютер.',
    whatIntro: 'clone — это полная копия: файлы, commit, ветки и связь с GitHub:',
    features: [
      { tone: 'blue', title: 'Файлы', text: 'появляется папка с проектом.' },
      { tone: 'amber', title: 'История', text: 'все прошлые commit уже внутри.' },
      { tone: 'green', title: 'origin', text: 'ссылка на GitHub настраивается автоматически.' },
    ],
    whenToUse: [
      'Когда проект уже лежит на GitHub.',
      'Когда присоединяетесь к чужому репозиторию.',
      'Вместо git init, если история уже есть.',
    ],
    steps: [
      'Скопируйте URL репозитория с GitHub',
      'Выполните git clone <url>',
      'Откройте появившуюся папку в редакторе',
    ],
    terminal: [
      { text: '$ git clone https://github.com/user/project.git', tone: 'cmd' },
      { text: 'Cloning into \'project\'...', tone: 'muted' },
      { text: 'Receiving objects: 100% (42/42), done.', tone: 'ok' },
    ],
  },
  status: {
    summary: 'Показывает текущее состояние репозитория: какие файлы изменены, какие новые, а какие готовы к коммиту.',
    whatIntro: 'Показывает, что происходит в вашем рабочем каталоге и в репозитории:',
    features: [
      {
        tone: 'blue',
        title: 'Изменённые файлы',
        text: 'файлы, которые были изменены, но ещё не добавлены в staging (git add).',
      },
      {
        tone: 'amber',
        title: 'Новые файлы',
        text: 'файлы, которых ещё нет под контролем Git.',
      },
      {
        tone: 'green',
        title: 'Staged файлы',
        text: 'файлы, которые уже добавлены в staging и готовы к коммиту.',
      },
    ],
    whenToUse: [
      'Когда хотите узнать, какие файлы изменены.',
      'Перед добавлением файлов в staging.',
      'Перед созданием коммита.',
      'Когда не уверены, что происходит в репозитории.',
    ],
    steps: ['Создайте файл index.html', 'Измените его (добавьте любой текст)', 'Выполните команду:'],
    terminal: [
      { text: '$ git status', tone: 'cmd' },
      { text: 'On branch main', tone: 'muted' },
      { text: '', tone: 'muted' },
      { text: 'Changes not staged for commit:', tone: 'err' },
      { text: '  (use "git add <file>..." to update what will be committed)', tone: 'muted' },
      { text: '    modified:   index.html', tone: 'err' },
      { text: '', tone: 'muted' },
      { text: 'Untracked files:', tone: 'err' },
      { text: '    style.css', tone: 'err' },
    ],
  },
  add: {
    summary: 'Добавляет изменения в staging — черновик следующего commit.',
    whatIntro: 'Staging — шаг между правкой файла и снимком истории:',
    features: [
      { tone: 'blue', title: 'git add файл', text: 'помечает конкретный файл.' },
      { tone: 'amber', title: 'git add .', text: 'добавляет все изменения в текущей папке.' },
      { tone: 'green', title: 'Ещё не commit', text: 'снимок появится только после git commit.' },
    ],
    whenToUse: [
      'После правок, когда status показывает изменения.',
      'Когда хотите включить в commit не все файлы, а выбранные.',
      'Перед git commit.',
    ],
    steps: ['Создайте index.html и выполните git status', 'Добавьте файл: git add index.html', 'Снова git status — файл должен быть в staging'],
    terminal: [
      { text: '$ git add index.html', tone: 'cmd' },
      { text: '$ git status', tone: 'cmd' },
      { text: 'Changes to be committed:', tone: 'ok' },
      { text: '  (use "git restore --staged <file>..." to unstage)', tone: 'muted' },
      { text: '    new file:   index.html', tone: 'ok' },
    ],
  },
  commit: {
    summary: 'Сохраняет снимок проекта в истории с сообщением.',
    whatIntro: 'Commit — точка, к которой можно вернуться. Пишите, зачем изменение:',
    features: [
      { tone: 'blue', title: 'Снимок', text: 'в историю попадает то, что было в staging.' },
      { tone: 'amber', title: '-m', text: 'короткое сообщение: Add homepage, Fix navigation.' },
      { tone: 'green', title: 'Не пишите', text: 'fix, changes, aaa — из такого лога ничего не понять.' },
    ],
    whenToUse: [
      'Когда закончили логичный кусок работы.',
      'После git add, когда status показывает staged файлы.',
      'Перед push на GitHub.',
    ],
    steps: ['Проверьте git status', 'Выполните git add .', 'Создайте снимок: git commit -m "Add homepage"'],
    terminal: [
      { text: '$ git commit -m "Add homepage"', tone: 'cmd' },
      { text: '[main a81f2c1] Add homepage', tone: 'ok' },
      { text: ' 1 file changed, 12 insertions(+)', tone: 'muted' },
    ],
  },
  log: {
    summary: 'Показывает историю commit: автор, дата и сообщение.',
    whatIntro: 'log — журнал проекта. Так находят, когда и зачем меняли код:',
    features: [
      { tone: 'blue', title: 'git log', text: 'полный вид: хеш, автор, дата, сообщение.' },
      { tone: 'amber', title: '--oneline', text: 'короткая лента, по одной строке на commit.' },
      { tone: 'green', title: 'Хеш', text: 'идентификатор снимка, например a81f2c1.' },
    ],
    whenToUse: [
      'Когда нужно вспомнить последние изменения.',
      'Перед merge, чтобы увидеть чужие commit.',
      'Когда ищете, в каком снимке появился баг.',
    ],
    steps: ['Создайте несколько commit', 'Выполните git log', 'Затем git log --oneline'],
    terminal: [
      { text: '$ git log --oneline', tone: 'cmd' },
      { text: 'a81f2c1 Add login page', tone: 'ok' },
      { text: '91ab321 Fix navbar', tone: 'muted' },
      { text: '32cc871 Initial commit', tone: 'muted' },
    ],
  },
  diff: {
    summary: 'Показывает, какие именно строки изменились в файлах.',
    whatIntro: 'status говорит «что изменилось», diff — «какие строки»:',
    features: [
      { tone: 'blue', title: 'Минус', text: 'строка удалена из файла.' },
      { tone: 'amber', title: 'Плюс', text: 'строка добавлена.' },
      { tone: 'green', title: 'Staging', text: 'обычный git diff не показывает уже добавленное в staging.' },
    ],
    whenToUse: [
      'Перед commit, чтобы не сохранить лишнее.',
      'Когда status пишет modified, но вы не помните правку.',
      'При ревью своих изменений.',
    ],
    steps: ['Измените HTML-файл', 'Выполните git diff', 'После git add . обычный diff станет пустым'],
    terminal: [
      { text: '$ git diff', tone: 'cmd' },
      { text: 'diff --git a/index.html b/index.html', tone: 'muted' },
      { text: '- <h1>Home</h1>', tone: 'err' },
      { text: '+ <h1>Welcome</h1>', tone: 'ok' },
    ],
  },
  restore: {
    summary: 'Отменяет незакоммиченные правки или убирает файл из staging.',
    whatIntro: 'restore возвращает файл к последнему commit или снимает его со staging:',
    features: [
      { tone: 'blue', title: 'git restore файл', text: 'правки в рабочем файле пропадут.' },
      { tone: 'amber', title: '--staged', text: 'файл уходит из staging, но изменения в тексте остаются.' },
      { tone: 'green', title: 'Безопасность', text: 'уже сделанный commit restore не удаляет.' },
    ],
    whenToUse: [
      'Когда случайно испортили файл и commit ещё не было.',
      'Когда добавили в staging лишний файл.',
      'Не путайте с удалением истории.',
    ],
    steps: [
      'Измените файл и выполните git add .',
      'Уберите из staging: git restore --staged index.html',
      'Чтобы отменить правки: git restore index.html',
    ],
    terminal: [
      { text: '$ git restore --staged index.html', tone: 'cmd' },
      { text: '$ git status', tone: 'cmd' },
      { text: 'Changes not staged for commit:', tone: 'err' },
      { text: '    modified:   index.html', tone: 'err' },
    ],
  },
  remote: {
    summary: 'Показывает подключённые удалённые репозитории и их URL.',
    whatIntro: 'origin — обычное имя удалённого репозитория, не особая команда:',
    features: [
      { tone: 'blue', title: 'git remote -v', text: 'имена и адреса fetch/push.' },
      { tone: 'amber', title: 'origin', text: 'привычное имя ссылки на GitHub.' },
      { tone: 'green', title: 'Связь', text: 'без remote push не знает, куда отправлять.' },
    ],
    whenToUse: [
      'Когда проверяете, привязан ли проект к GitHub.',
      'После clone — чтобы увидеть origin.',
      'Если push вдруг идёт не туда.',
    ],
    steps: ['Откройте папку репозитория', 'Выполните git remote -v', 'Найдите origin и URL'],
    terminal: [
      { text: '$ git remote -v', tone: 'cmd' },
      { text: 'origin  https://github.com/user/project.git (fetch)', tone: 'ok' },
      { text: 'origin  https://github.com/user/project.git (push)', tone: 'muted' },
    ],
  },
  'remote-add': {
    summary: 'Подключает локальную папку к репозиторию на GitHub.',
    whatIntro: 'После remote add push и pull знают адрес сервера:',
    features: [
      { tone: 'blue', title: 'Пустой GitHub', text: 'сначала создайте репозиторий на сайте.' },
      { tone: 'amber', title: 'origin', text: 'стандартное имя, которое потом пишут в push.' },
      { tone: 'green', title: 'Проверка', text: 'git remote -v должен показать новый URL.' },
    ],
    whenToUse: [
      'Когда сделали git init локально и хотите выложить проект.',
      'Когда клонирования не было, а GitHub-репозиторий уже есть.',
    ],
    steps: [
      'Создайте пустой репозиторий на GitHub',
      'Выполните git remote add origin <url>',
      'Проверьте: git remote -v',
    ],
    terminal: [
      { text: '$ git remote add origin https://github.com/user/project.git', tone: 'cmd' },
      { text: '$ git remote -v', tone: 'cmd' },
      { text: 'origin  https://github.com/user/project.git (fetch)', tone: 'ok' },
    ],
  },
  push: {
    summary: 'Отправляет локальные commit на GitHub.',
    whatIntro: 'Без push снимки остаются только на вашем компьютере:',
    features: [
      { tone: 'blue', title: 'git push', text: 'отправляет новые commit в origin.' },
      { tone: 'amber', title: '-u origin main', text: 'первый раз запоминает ветку по умолчанию.' },
      { tone: 'green', title: 'Проверка', text: 'откройте GitHub — commit должен появиться.' },
    ],
    whenToUse: [
      'После локального commit, которым хотите поделиться.',
      'Перед тем как открыть pull request.',
      'Когда бэкапите работу в облако.',
    ],
    steps: ['Создайте commit', 'Подключите GitHub через remote add', 'Выполните git push -u origin main'],
    terminal: [
      { text: '$ git push -u origin main', tone: 'cmd' },
      { text: 'Enumerating objects: 5, done.', tone: 'muted' },
      { text: 'To https://github.com/user/project.git', tone: 'ok' },
      { text: '   32cc871..a81f2c1  main -> main', tone: 'ok' },
    ],
  },
  pull: {
    summary: 'Забирает изменения с GitHub и вливает их в текущую ветку.',
    whatIntro: 'Схема: GitHub → ваш компьютер. Нужен, когда коллега уже сделал push:',
    features: [
      { tone: 'blue', title: 'Скачать', text: 'новые commit приходят с сервера.' },
      { tone: 'amber', title: 'Слить', text: 'они сразу вливаются в вашу ветку.' },
      { tone: 'green', title: 'Конфликт', text: 'если одни строки меняли вдвоём, Git попросит выбрать версию.' },
    ],
    whenToUse: [
      'Перед началом работы, чтобы взять свежий код.',
      'Когда коллега написал «я запушил».',
      'Перед merge, если main на GitHub ушёл вперёд.',
    ],
    steps: ['Откройте вторую копию репозитория', 'Выполните git pull', 'Проверьте, что файлы обновились'],
    terminal: [
      { text: '$ git pull', tone: 'cmd' },
      { text: 'Updating 32cc871..a81f2c1', tone: 'muted' },
      { text: 'Fast-forward', tone: 'ok' },
      { text: ' index.html | 12 ++++++++++++', tone: 'ok' },
    ],
  },
  fetch: {
    summary: 'Скачивает информацию с GitHub, но не меняет ваши файлы.',
    whatIntro: 'fetch только подглядывает, что появилось на сервере. pull = fetch + слияние:',
    features: [
      { tone: 'blue', title: 'Безопасно', text: 'рабочие файлы не трогаются.' },
      { tone: 'amber', title: 'origin/main', text: 'обновляется снимок удалённой ветки.' },
      { tone: 'green', title: 'Дальше', text: 'чтобы влить изменения, нужен merge или pull.' },
    ],
    whenToUse: [
      'Когда хотите сначала посмотреть, что изменилось.',
      'Перед опасным слиянием.',
      'Когда pull кажется слишком резким.',
    ],
    steps: ['Выполните git fetch', 'Сравните свою ветку с origin', 'Помните: файлы пока не меняются'],
    terminal: [
      { text: '$ git fetch', tone: 'cmd' },
      { text: 'From https://github.com/user/project', tone: 'muted' },
      { text: '   32cc871..a81f2c1  main       -> origin/main', tone: 'ok' },
    ],
  },
  'what-is-branch': {
    summary: 'Ветка — отдельная линия разработки, чтобы не ломать main.',
    whatIntro: 'Новую функцию делают в feature-login, а основную линию оставляют стабильной:',
    features: [
      { tone: 'blue', title: 'main', text: 'основная линия проекта.' },
      { tone: 'amber', title: 'feature-*', text: 'ветка под задачу, эксперимент или фичу.' },
      { tone: 'green', title: 'Команда', text: 'двое могут работать параллельно, не мешая файлам друг друга.' },
    ],
    whenToUse: [
      'Перед тем как учить git branch и git switch.',
      'Когда боитесь сломать рабочий main.',
      'Когда в проекте больше одного человека.',
    ],
    steps: ['Запомните: main — стабильная линия', 'Новую работу ведите в отдельной ветке', 'Потом вольёте её через merge'],
    terminal: [],
  },
  branch: {
    summary: 'Показывает список веток и создаёт новую, не переключая на неё.',
    whatIntro: 'Звёздочка отмечает текущую ветку. git branch name только создаёт ветку:',
    features: [
      { tone: 'blue', title: 'Список', text: 'git branch печатает локальные ветки.' },
      { tone: 'amber', title: 'Создать', text: 'git branch feature-login добавляет ветку.' },
      { tone: 'green', title: 'Не переключает', text: 'чтобы перейти, нужен git switch.' },
    ],
    whenToUse: [
      'Когда хотите увидеть, где вы сейчас.',
      'Когда создаёте ветку заранее.',
      'Перед switch — чтобы имя не опечатать.',
    ],
    steps: ['Выполните git branch', 'Создайте ветку: git branch feature-login', 'Снова git branch — новая строка появится'],
    terminal: [
      { text: '$ git branch', tone: 'cmd' },
      { text: '* main', tone: 'ok' },
      { text: '  feature-login', tone: 'muted' },
    ],
  },
  switch: {
    summary: 'Переключает текущую ветку. -c сразу создаёт и переходит.',
    whatIntro: 'После switch рабочие файлы становятся такими, как в выбранной ветке:',
    features: [
      { tone: 'blue', title: 'git switch имя', text: 'делает ветку текущей.' },
      { tone: 'amber', title: '-c', text: 'создаёт ветку и сразу переходит на неё.' },
      { tone: 'green', title: 'Commit', text: 'несохранённые правки могут мешать переключению.' },
    ],
    whenToUse: [
      'Когда начинаете новую фичу.',
      'Когда возвращаетесь на main.',
      'Вместо устаревшего git checkout для веток.',
    ],
    steps: ['Создайте и перейдите: git switch -c feature-login', 'Измените файлы', 'Сделайте git add . и commit'],
    terminal: [
      { text: '$ git switch -c feature-login', tone: 'cmd' },
      { text: 'Switched to a new branch \'feature-login\'', tone: 'ok' },
    ],
  },
  merge: {
    summary: 'Вливает другую ветку в текущую, обычно в main.',
    whatIntro: 'Сначала перейдите на main, затем git merge feature-login:',
    features: [
      { tone: 'blue', title: 'Порядок', text: 'стоять нужно на ветке, КУДА вливаете.' },
      { tone: 'amber', title: 'Результат', text: 'main получает изменения feature-login.' },
      { tone: 'green', title: 'Конфликт', text: 'если строки пересеклись, Git попросит выбрать.' },
    ],
    whenToUse: [
      'Когда фича в ветке готова.',
      'После ревью или когда работаете один.',
      'Перед push обновлённого main.',
    ],
    steps: ['Закончите работу в feature-login', 'Перейдите: git switch main', 'Объедините: git merge feature-login'],
    terminal: [
      { text: '$ git switch main', tone: 'cmd' },
      { text: '$ git merge feature-login', tone: 'cmd' },
      { text: 'Updating 32cc871..a81f2c1', tone: 'ok' },
      { text: 'Fast-forward', tone: 'ok' },
    ],
  },
}

const GIT_TG: Record<string, GitPack> = {
  status: {
    summary: 'Ҳолати ҷории репозиториро нишон медиҳад: кадом файлҳо тағйир ёфтанд, кадомҳо нав ва кадомҳо барои commit тайёранд.',
    whatIntro: 'Нишон медиҳад, ки дар феҳристи корӣ ва репозиторий чӣ мегузарад:',
    features: [
      { tone: 'blue', title: 'Файлҳои тағйирёфта', text: 'тағйир ёфтаанд, вале ҳанӯз ба staging (git add) илова нашудаанд.' },
      { tone: 'amber', title: 'Файлҳои нав', text: 'ҳанӯз зери назорати Git нестанд.' },
      { tone: 'green', title: 'Staged', text: 'аллакай дар staging ҳастанд ва барои commit тайёранд.' },
    ],
    whenToUse: [
      'Вақте мехоҳед донед, кадом файлҳо тағйир ёфтанд.',
      'Пеш аз илова ба staging.',
      'Пеш аз сохтани commit.',
      'Вақте дар репозиторий чӣ шуд, равшан нест.',
    ],
    steps: ['Файли index.html созед', 'Онро тағйир диҳед (ягон матн илова кунед)', 'Фармонро иҷро кунед:'],
    terminal: GIT_RU.status!.terminal,
  },
}

function fromPack(pack: GitPack, kind: LessonKind): LessonCard {
  return {
    summary: pack.summary,
    whatIntro: pack.whatIntro,
    features: pack.features,
    whenToUse: pack.whenToUse,
    steps: pack.steps,
    terminal: pack.terminal,
    showSyntax: kind !== 'concept',
    showExample: kind !== 'concept' && pack.terminal.length > 0,
    teach: {
      summary: pack.summary,
      goals: pack.whenToUse.slice(0, 4),
      explain: pack.whatIntro ? [pack.whatIntro] : [],
      example:
        pack.terminal.length > 0
          ? { lines: pack.terminal.map((line) => line.text) }
          : undefined,
      howSteps: pack.steps,
      practice: pack.steps[0] ?? pack.summary,
      practiceSteps: pack.steps,
      success: '',
    },
  }
}

function fromTeach(pack: TeachPack, kind: LessonKind): LessonCard {
  const features: FeatureItem[] = pack.goals.slice(0, 4).map((goal, index) => ({
    tone: TONES[index % TONES.length]!,
    title: '',
    text: goal,
  }))
  return {
    summary: pack.summary,
    whatIntro: pack.explain[0] ?? pack.summary,
    features,
    whenToUse: pack.goals,
    steps: pack.practiceSteps,
    terminal: (pack.example?.lines ?? []).map((text) => ({ text, tone: 'muted' as const })),
    showSyntax: kind === 'command',
    showExample: false,
    teach: pack,
  }
}

function generatedCard(input: {
  kind: LessonKind
  title: string
  keys: string[]
  summary: string
  description: string
  actionPrompt: string
  usageExample: string
}): LessonCard {
  const skinny = (input.description || '').trim().length < 28
  const facts = splitFacts(input.description).length
    ? splitFacts(input.description)
    : splitFacts(input.summary || input.actionPrompt)
  const features: FeatureItem[] = facts.map((fact, index) => {
    const parts = splitTitle(fact)
    return {
      tone: TONES[index % TONES.length]!,
      title: parts.title,
      text: parts.text,
    }
  })
  if (!features.length && (input.description || input.summary || input.actionPrompt)) {
    features.push({
      tone: 'blue',
      title: '',
      text: skinny ? input.actionPrompt || input.description || input.summary : input.description || input.summary,
    })
  }
  const whenToUse = unique([input.actionPrompt, ...facts]).slice(0, 4)
  const steps = parseTaskSteps(input.usageExample)
  const cleanedSteps = steps.length ? steps : input.actionPrompt ? [input.actionPrompt] : []
  const showSyntax = input.kind !== 'concept'
  const terminal = input.kind === 'command'
    ? terminalExample(input.kind, input.title, input.keys, input.description || input.summary)
    : []
  const summary = skinny ? input.actionPrompt || input.summary : input.summary || input.description
  const whatIntro = skinny ? input.actionPrompt : input.description || input.actionPrompt || ''
  return {
    summary,
    whatIntro,
    features,
    whenToUse,
    steps: cleanedSteps,
    terminal,
    showSyntax,
    showExample: input.kind === 'command' && terminal.length > 0,
  }
}

export function buildLessonCard(input: {
  courseSlug: string
  locale: Locale
  title: string
  seedTitle?: string
  keys: string[]
  summary: string
  description: string
  actionPrompt: string
  usageExample: string
}): LessonCard {
  const kind = classifyLesson(input.courseSlug, input.keys, input.seedTitle || input.title)
  if (input.courseSlug === 'computer-basics') {
    const pack = getComputerBasicsPack(input.locale, input.keys, input.seedTitle || input.title)
    if (pack) return fromTeach(pack, kind)
  }
  const slug = cmdSlug(input.keys)
  if (input.courseSlug === 'git' && slug) {
    const pack = input.locale === 'tg' ? GIT_TG[slug] : GIT_RU[slug]
    if (pack) return fromPack(pack, kind)
  }
  return generatedCard({ kind, ...input })
}

export function featureGlyph(tone: FeatureTone): string {
  if (tone === 'amber') return '+'
  if (tone === 'green') return '✓'
  return '📄'
}
