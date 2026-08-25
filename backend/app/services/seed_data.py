"""Seed catalog: meaningful shortcuts across courses (no filler chords)."""

from __future__ import annotations

from typing import TypedDict


class LessonSeed(TypedDict):
    title: str
    action_prompt: str
    keys: list[str]
    usage_example: str
    description: str


class CategorySeed(TypedDict):
    slug: str
    title: str
    lessons: list[LessonSeed]


class CourseSeed(TypedDict):
    slug: str
    title: str
    description: str
    icon: str
    categories: list[CategorySeed]


def _L(title: str, action: str, keys: list[str], example: str, desc: str = "") -> LessonSeed:
    return {
        "title": title,
        "action_prompt": action,
        "keys": keys,
        "usage_example": example,
        "description": desc or example,
    }


# --- Первый ноутбук: задания и симулятор (см. computer_basics_seed.py) ---------

from app.services.computer_basics_seed import COMPUTER_BASICS_CATEGORIES

# --- Обязательный курс горячих клавиш после базы ПК -----------------------------

PROGRAMMER_BASICS_CATEGORIES: list[CategorySeed] = [
    {
        "slug": "basics",
        "title": "Основы",
        "lessons": [
            _L("Копировать", "Скопируйте", ["Control", "C"], "Ctrl+C", "Копирование"),
            _L("Вставить", "Вставьте", ["Control", "V"], "Ctrl+V", "Вставка"),
            _L("Вырезать", "Вырежьте", ["Control", "X"], "Ctrl+X", "Вырезание"),
            _L("Отменить", "Отмените действие", ["Control", "Z"], "Ctrl+Z", "Отмена"),
            _L("Повторить", "Верните отмену", ["Control", "Y"], "Ctrl+Y", "Повтор"),
            _L("Выделить всё", "Выделите всё", ["Control", "A"], "Ctrl+A", "Выделить всё"),
            _L("Сохранить", "Сохраните файл", ["Control", "S"], "Ctrl+S", "Сохранение"),
            _L("Поиск", "Откройте поиск", ["Control", "F"], "Ctrl+F", "Поиск"),
            _L("Замена", "Откройте замену", ["Control", "H"], "Ctrl+H", "Замена"),
            _L("В начало строки", "В начало строки", ["Home"], "Home", "Начало строки"),
            _L("В конец строки", "В конец строки", ["End"], "End", "Конец строки"),
            _L("Слово влево", "К предыдущему слову", ["Control", "ArrowLeft"], "Ctrl+←", "По словам"),
            _L("Слово вправо", "К следующему слову", ["Control", "ArrowRight"], "Ctrl+→", "По словам"),
        ],
    },
    {
        "slug": "system",
        "title": "Система (изучение)",
        "lessons": [
            _L(
                "Окна",
                "Переключение окон",
                ["Alt", "Tab"],
                "В реальной системе: Alt+Tab",
                "Переключение между окнами",
            ),
            _L(
                "Закрыть окно",
                "Закрытие программы",
                ["Alt", "F4"],
                "В реальной системе: Alt+F4",
                "Закрыть программу",
            ),
            _L(
                "Рабочий стол",
                "Показать рабочий стол",
                ["Meta", "D"],
                "В реальной системе: Win+D",
                "Свернуть все окна",
            ),
            _L(
                "Проводник",
                "Открыть проводник",
                ["Meta", "E"],
                "В реальной системе: Win+E",
                "Файлы Windows",
            ),
            _L(
                "Скриншот",
                "Снимок экрана",
                ["PrintScreen"],
                "В реальной системе: PrtSc",
                "Скриншот",
            ),
            _L(
                "Область экрана",
                "Снимок области",
                ["Meta", "Shift", "S"],
                "В реальной системе: Win+Shift+S",
                "Ножницы Windows",
            ),
        ],
    },
]


VSCODE_CATEGORIES: list[CategorySeed] = [
    {
        "slug": "navigation",
        "title": "Навигация",
        "lessons": [
            _L("Быстрое открытие файла", "Откройте файл по имени", ["Control", "P"], "Ctrl+P — палитра файлов"),
            _L("Перейти к строке", "Перейдите к строке по номеру", ["Control", "G"], "Ctrl+G"),
            _L("Перейти к символу", "Откройте список символов в файле", ["Control", "Shift", "O"], "Ctrl+Shift+O"),
            _L("Перейти к определению", "Перейдите к определению символа", ["F12"], "F12"),
            _L("Назад", "Вернитесь к предыдущей позиции", ["Alt", "ArrowLeft"], "Alt+←"),
            _L("Вперёд", "Перейдите вперёд по истории", ["Alt", "ArrowRight"], "Alt+→"),
            _L("Переключить вкладку", "Следующая вкладка редактора", ["Control", "Tab"], "Ctrl+Tab"),
            _L("Закрыть вкладку", "Закройте активную вкладку", ["Control", "W"], "Ctrl+W"),
            _L("Проводник", "Откройте боковую панель проводника", ["Control", "Shift", "E"], "Ctrl+Shift+E"),
            _L("Поиск по проекту", "Откройте глобальный поиск", ["Control", "Shift", "F"], "Ctrl+Shift+F"),
        ],
    },
    {
        "slug": "editing",
        "title": "Редактирование",
        "lessons": [
            _L("Комментарий строки", "Закомментируйте строку", ["Control", "Slash"], "Ctrl+/"),
            _L("Блочный комментарий", "Блочный комментарий", ["Shift", "Alt", "A"], "Shift+Alt+A"),
            _L("Дублировать строку", "Дублируйте текущую строку", ["Shift", "Alt", "ArrowDown"], "Shift+Alt+↓"),
            _L("Удалить строку", "Удалите текущую строку", ["Control", "Shift", "K"], "Ctrl+Shift+K"),
            _L("Переместить строку вверх", "Переместите строку вверх", ["Alt", "ArrowUp"], "Alt+↑"),
            _L("Переместить строку вниз", "Переместите строку вниз", ["Alt", "ArrowDown"], "Alt+↓"),
            _L("Выделить следующее вхождение", "Добавьте следующее совпадение", ["Control", "D"], "Ctrl+D"),
            _L("Выделить все вхождения", "Выделите все совпадения", ["Control", "Shift", "L"], "Ctrl+Shift+L"),
            _L("Мультикурсор", "Добавьте курсор ниже", ["Control", "Alt", "ArrowDown"], "Ctrl+Alt+↓"),
            _L("Отменить", "Отмените последнее действие", ["Control", "Z"], "Ctrl+Z"),
            _L("Повторить", "Повторите отменённое", ["Control", "Y"], "Ctrl+Y"),
            _L("Форматировать документ", "Отформатируйте файл", ["Shift", "Alt", "F"], "Shift+Alt+F"),
        ],
    },
    {
        "slug": "files",
        "title": "Файлы",
        "lessons": [
            _L("Сохранить", "Сохраните файл", ["Control", "S"], "Ctrl+S"),
            _L("Сохранить все", "Сохраните все файлы", ["Control", "K", "S"], "Ctrl+K S"),
            _L("Новый файл", "Создайте новый файл", ["Control", "N"], "Ctrl+N"),
            _L("Закрыть редактор", "Закройте редактор", ["Control", "W"], "Ctrl+W"),
            _L("Переименовать", "Переименуйте символ/файл", ["F2"], "F2"),
        ],
    },
    {
        "slug": "search",
        "title": "Поиск",
        "lessons": [
            _L("Найти", "Откройте поиск в файле", ["Control", "F"], "Ctrl+F"),
            _L("Заменить", "Откройте замену", ["Control", "H"], "Ctrl+H"),
            _L("Найти в проекте", "Глобальный поиск", ["Control", "Shift", "F"], "Ctrl+Shift+F"),
            _L("Следующее совпадение", "Следующее совпадение", ["F3"], "F3"),
            _L("Предыдущее совпадение", "Предыдущее совпадение", ["Shift", "F3"], "Shift+F3"),
        ],
    },
    {
        "slug": "debug",
        "title": "Отладка",
        "lessons": [
            _L("Запуск отладки", "Запустите отладку", ["F5"], "F5"),
            _L("Шаг с обходом", "Step over", ["F10"], "F10"),
            _L("Шаг с заходом", "Step into", ["F11"], "F11"),
            _L("Продолжить", "Continue", ["F5"], "F5"),
            _L("Точка останова", "Переключите breakpoint", ["F9"], "F9"),
        ],
    },
    {
        "slug": "terminal",
        "title": "Терминал",
        "lessons": [
            _L("Терминал", "Откройте встроенный терминал", ["Control", "Backquote"], "Ctrl+`"),
            _L("Новый терминал", "Создайте новый терминал", ["Control", "Shift", "Backquote"], "Ctrl+Shift+`"),
            _L("Очистить терминал", "Очистите вывод терминала", ["Control", "K"], "Ctrl+K в терминале"),
        ],
    },
    {
        "slug": "git",
        "title": "Git",
        "lessons": [
            _L("Source Control", "Откройте панель Git", ["Control", "Shift", "G"], "Ctrl+Shift+G"),
            _L("Diff", "Откройте diff изменений", ["Control", "Shift", "G"], "Панель SCM"),
        ],
    },
]

WINDOWS_LESSONS = [
    _L("Копировать", "Скопируйте выделение", ["Control", "C"], "Win: Ctrl+C"),
    _L("Вставить", "Вставьте из буфера", ["Control", "V"], "Ctrl+V"),
    _L("Вырезать", "Вырежьте выделение", ["Control", "X"], "Ctrl+X"),
    _L("Отменить", "Отмените действие", ["Control", "Z"], "Ctrl+Z"),
    _L("Диспетчер задач", "Откройте диспетчер задач", ["Control", "Shift", "Escape"], "Ctrl+Shift+Esc"),
    _L("Блокировка", "Заблокируйте компьютер", ["Meta", "L"], "Win+L"),
    _L("Переключение окон", "Переключите окно", ["Alt", "Tab"], "Alt+Tab"),
    _L("Рабочий стол", "Сверните все окна", ["Meta", "D"], "Win+D"),
    _L("Проводник", "Откройте проводник", ["Meta", "E"], "Win+E"),
    _L("Параметры", "Откройте параметры", ["Meta", "I"], "Win+I"),
    _L("Снимок экрана", "Снимок области", ["Meta", "Shift", "S"], "Win+Shift+S"),
    _L("Поиск", "Откройте поиск Windows", ["Meta", "S"], "Win+S"),
]

CHROME_LESSONS = [
    _L("Новая вкладка", "Откройте новую вкладку", ["Control", "T"], "Ctrl+T"),
    _L("Закрыть вкладку", "Закройте вкладку", ["Control", "W"], "Ctrl+W"),
    _L("Восстановить вкладку", "Восстановите закрытую вкладку", ["Control", "Shift", "T"], "Ctrl+Shift+T"),
    _L("Адресная строка", "Фокус на адресной строке", ["Control", "L"], "Ctrl+L"),
    _L("Обновить", "Обновите страницу", ["Control", "R"], "Ctrl+R"),
    _L("Жёсткое обновление", "Обновите без кэша", ["Control", "Shift", "R"], "Ctrl+Shift+R"),
    _L("История", "Откройте историю", ["Control", "H"], "Ctrl+H"),
    _L("Загрузки", "Откройте загрузки", ["Control", "J"], "Ctrl+J"),
    _L("DevTools", "Откройте инструменты разработчика", ["F12"], "F12"),
    _L("Консоль", "Откройте консоль", ["Control", "Shift", "J"], "Ctrl+Shift+J"),
]

def _CMD(slug: str, title: str, action: str, example: str, desc: str = "") -> LessonSeed:
    """Concept / command lesson — not a hotkey chord."""
    return _L(title, action, [f"cmd:{slug}"], example, desc)


GIT_CATEGORIES: list[CategorySeed] = [
    {
        "slug": "basics",
        "title": "Основы Git",
        "lessons": [
            _CMD(
                "intro",
                "Что такое Git",
                "Поймите, зачем нужен Git",
                "Git сохраняет историю и позволяет вернуться к прошлым версиям; Git работает локально на компьютере; GitHub хранит удалённую копию для совместной работы; схема: компьютер → Git → локальный репозиторий → GitHub → удалённый репозиторий",
                "Git хранит историю проекта на компьютере. GitHub — отдельный онлайн-сервис для репозиториев и работы в команде.",
            ),
            _CMD(
                "version",
                "git --version",
                "Проверьте, установлен ли Git",
                "Откройте терминал; введите git --version; если видите номер версии, Git готов к работе",
                "Если Git установлен, команда показывает версию, например git version 2.x.x.",
            ),
            _CMD(
                "config",
                "git config",
                "Укажите имя и email для commit",
                'Задайте имя: git config --global user.name "Your Name"; задайте email: git config --global user.email "you@example.com"; проверьте настройки: git config --list',
                "Имя и email попадают в каждый commit. Флаг --global применяет настройку ко всем репозиториям на этом компьютере.",
            ),
        ],
    },
    {
        "slug": "repo",
        "title": "Создание репозитория",
        "lessons": [
            _CMD(
                "init",
                "git init",
                "Создайте Git-репозиторий в текущей папке",
                "Создайте папку my-project; перейдите в неё: cd my-project; выполните git init; проверьте состояние: git status",
                "Появляется скрытая папка .git — в ней хранится история. Не меняйте её вручную.",
            ),
            _CMD(
                "clone",
                "git clone",
                "Скопируйте существующий репозиторий на компьютер",
                "Выполните git clone https://github.com/user/project.git; откройте появившуюся папку в редакторе; это полная копия проекта с историей",
                "Скачиваются файлы, история commit, ветки и связь с удалённым репозиторием. Нужен, когда проект уже есть на GitHub.",
            ),
        ],
    },
    {
        "slug": "changes",
        "title": "Работа с изменениями",
        "lessons": [
            _CMD(
                "status",
                "git status",
                "Посмотрите текущее состояние репозитория",
                "Создайте index.html; выполните git status; измените файл; снова выполните git status; сравните, как изменилось состояние",
                "Команда показывает ветку, новые и изменённые файлы, staging и связь с remote. Если неясно, что происходит — начните со status.",
            ),
            _CMD(
                "add",
                "git add",
                "Добавьте изменения в staging",
                "Создайте index.html и выполните git status; добавьте файл: git add index.html; снова git status — файл должен быть в staging; git add . добавляет все изменения в папке",
                "Staging — шаг между правкой файла и commit. Команда не создаёт снимок, а помечает, что войдёт в следующий commit.",
            ),
            _CMD(
                "commit",
                "git commit",
                "Сохраните версию проекта в истории",
                'Сделайте изменение в HTML-файле; проверьте git status; выполните git add .; создайте снимок: git commit -m "Add homepage"; откройте историю: git log',
                "Commit — сохранённый снимок. Пишите, зачем изменение: Add homepage, Fix navigation. Не пишите fix, changes, aaa.",
            ),
            _CMD(
                "log",
                "git log",
                "Откройте историю commit",
                "Создайте несколько commit; выполните git log; затем git log --oneline; найдите свой первый commit",
                "Видны снимок, автор, дата и сообщение. git log --oneline показывает историю коротко, по одной строке.",
            ),
            _CMD(
                "diff",
                "git diff",
                "Посмотрите, что именно изменилось",
                "Измените HTML-файл; выполните git diff; затем git add .; снова git diff — staged-изменения уже не видны",
                "status говорит «что изменилось», diff — «какие строки». Обычный git diff не показывает уже добавленное в staging.",
            ),
            _CMD(
                "restore",
                "git restore",
                "Отмените незакоммиченные изменения",
                "Измените файл и выполните git add .; уберите из staging: git restore --staged index.html; проверьте git status; чтобы отменить правки в файле, используйте git restore index.html",
                "git restore возвращает файл к последнему commit — правки пропадут. git restore --staged убирает файл из staging, но изменения в файле остаются.",
            ),
        ],
    },
    {
        "slug": "github",
        "title": "GitHub",
        "lessons": [
            _CMD(
                "remote",
                "git remote",
                "Посмотрите подключённые удалённые репозитории",
                "Выполните git remote -v; если репозиторий связан с GitHub, увидите origin и URL; origin — это имя, а не особая команда",
                "origin — обычное имя удалённого репозитория, просто название. git remote -v показывает адреса.",
            ),
            _CMD(
                "remote-add",
                "git remote add",
                "Подключите локальный проект к GitHub",
                "Создайте пустой репозиторий на GitHub; выполните git remote add origin https://github.com/user/project.git; проверьте связь: git remote -v",
                "Команда связывает папку на компьютере с удалённым репозиторием. После этого push и pull знают, куда ходить.",
            ),
            _CMD(
                "push",
                "git push",
                "Отправьте локальные commit на GitHub",
                "Создайте commit; подключите GitHub через remote add; выполните git push -u origin main; откройте GitHub и проверьте, что commit появился",
                "Без push снимки остаются только на компьютере. Первый раз: git push -u origin main — дальше достаточно git push.",
            ),
            _CMD(
                "pull",
                "git pull",
                "Получите изменения с GitHub и обновите ветку",
                "Представьте две копии одного репозитория; в первой измените файл, сделайте commit и push; во второй выполните git pull; изменения появятся локально",
                "Если коллега отправил правки, git pull забирает их и вливает в текущую ветку. Схема: GitHub → ваш компьютер.",
            ),
            _CMD(
                "fetch",
                "git fetch",
                "Узнайте, что появилось на GitHub, без слияния",
                "Выполните git fetch, чтобы увидеть, что изменилось на GitHub; текущие файлы пока не трогаются; git pull уже вливает изменения в вашу ветку",
                "fetch только скачивает информацию о новых commit. pull = fetch плюс обновление текущей ветки.",
            ),
        ],
    },
    {
        "slug": "branch",
        "title": "Ветки",
        "lessons": [
            _CMD(
                "what-is-branch",
                "Что такое branch",
                "Поймите, зачем нужны ветки",
                "main — основная линия проекта; новую работу ведут в отдельной ветке, например feature-login; так можно экспериментировать и работать вдвоём, не ломая main",
                "Ветка — отдельная линия разработки. Новую функцию делают в feature-login, а не сразу в main.",
            ),
            _CMD(
                "branch",
                "git branch",
                "Посмотрите ветки и создайте новую",
                "Выполните git branch — увидите текущую ветку; создайте ветку: git branch feature-login; снова git branch; звёздочка стоит у текущей, новая ветка уже есть",
                "git branch feature-login создаёт ветку, но не переключает на неё. Звёздочка в списке отмечает текущую ветку.",
            ),
            _CMD(
                "switch",
                "git switch",
                "Переключитесь на другую ветку",
                'Создайте и сразу перейдите: git switch -c feature-login; измените файлы; выполните git add . и git commit -m "Add login"',
                "git switch feature-login делает ветку текущей. git switch -c сразу создаёт ветку и переходит на неё.",
            ),
            _CMD(
                "merge",
                "git merge",
                "Объедините ветку с main",
                "Закончите работу в feature-login; перейдите: git switch main; объедините: git merge feature-login; теперь main содержит изменения feature-login",
                "Сначала перейдите на main, затем git merge feature-login. Изменения из feature-login попадают в основную линию.",
            ),
        ],
    },
]

GITHUB_LESSONS = [
    _CMD(
        "repo",
        "Репозиторий",
        "Что такое репозиторий",
        "Репозиторий — проект с историей Git; на GitHub он лежит на сервере; у вас на диске — локальная копия.",
        "Один проект = один репозиторий. Там код, история коммитов и настройки.",
    ),
    _CMD(
        "remote",
        "origin",
        "Что такое origin",
        "origin — обычное имя удалённого репозитория на GitHub; git remote -v показывает адрес.",
        "push и pull ходят в origin, если вы не указали другой remote.",
    ),
    _CMD(
        "fork",
        "Fork",
        "Чем fork отличается от clone",
        "clone — копия к себе на компьютер; fork — копия репозитория на ваш аккаунт GitHub.",
        "Fork нужен, когда нет права писать в чужой репозиторий: меняете свою копию, затем открываете pull request.",
    ),
    _CMD(
        "pr",
        "Pull request",
        "Что такое pull request",
        "Пушите ветку; открываете pull request; коллеги смотрят diff; после approve ветку сливают в main.",
        "PR — просьба принять ваши коммиты. Так обсуждают код, не ломая основную ветку.",
    ),
    _CMD(
        "merge",
        "Merge",
        "Как принимают pull request",
        "После ревью нажимают Merge; коммиты ветки попадают в main; ветку можно удалить.",
        "Merge — слияние историй. Конфликт значит, что одни и те же строки меняли в двух ветках.",
    ),
    _CMD(
        "issues",
        "Issues",
        "Зачем нужны issues",
        "Issue — задача или баг в репозитории; в нём описывают проблему и обсуждают решение.",
        "Сначала issue, потом ветка и pull request — так команда не теряет контекст.",
    ),
]

CURSOR_LESSONS = [
    _L("Command Palette", "Откройте палитру команд", ["Control", "Shift", "P"], "Ctrl+Shift+P"),
    _L("AI Chat", "Откройте чат Cursor", ["Control", "L"], "Ctrl+L"),
    _L("Inline Edit", "Inline редактирование", ["Control", "K"], "Ctrl+K"),
    _L("Composer", "Composer", ["Control", "I"], "Ctrl+I"),
    _L("Terminal", "Терминал", ["Control", "Backquote"], "Ctrl+`"),
]


def _expand(prefix: str, templates: list[tuple[str, str, list[str]]]) -> list[LessonSeed]:
    return [_L(t, a, k, f"{prefix}: {a}") for t, a, k in templates]


OFFICE_TEMPLATES = [
    ("Сохранить", "Сохраните документ", ["Control", "S"]),
    ("Жирный", "Сделайте текст жирным", ["Control", "B"]),
    ("Курсив", "Сделайте текст курсивом", ["Control", "I"]),
    ("Подчёркнутый", "Подчеркните текст", ["Control", "U"]),
    ("Найти", "Откройте поиск", ["Control", "F"]),
    ("Заменить", "Откройте замену", ["Control", "H"]),
    ("Печать", "Откройте печать", ["Control", "P"]),
    ("Отменить", "Отмените действие", ["Control", "Z"]),
]

IDE_TEMPLATES = [
    ("Поиск класса", "Найдите класс", ["Control", "N"]),
    ("Рефакторинг", "Переименуйте", ["Shift", "F6"]),
    ("Форматировать", "Отформатируйте код", ["Control", "Alt", "L"]),
    ("Комментарий", "Закомментируйте строку", ["Control", "Slash"]),
    ("Запуск", "Запустите конфигурацию", ["Shift", "F10"]),
    ("Отладка", "Отладка", ["Shift", "F9"]),
]

MAC_TEMPLATES = [
    ("Копировать", "Скопируйте", ["Meta", "C"]),
    ("Вставить", "Вставьте", ["Meta", "V"]),
    ("Spotlight", "Spotlight", ["Meta", "Space"]),
    ("Quit", "Закройте приложение", ["Meta", "Q"]),
]

LINUX_TEMPLATES = [
    ("Терминал", "Откройте терминал", ["Control", "Alt", "T"]),
    ("Переключение", "Переключите окно", ["Alt", "Tab"]),
]

COURSES: list[CourseSeed] = [
    {
        "slug": "computer-basics",
        "title": "Первый ноутбук: файлы и папки",
        "description": (
            "Создание папок и файлов, проводник, корзина и ZIP. "
            "Выполняйте задания в симуляторе «Рабочий стол»."
        ),
        "icon": "folder",
        "categories": COMPUTER_BASICS_CATEGORIES,
    },
    {
        "slug": "programmer-basics",
        "title": "Основные горячие клавиши программиста",
        "description": (
            "Короткие уроки: копирование, сохранение, поиск и ещё несколько важных сочетаний. "
            "Системные клавиши (Alt+Tab, Win, F) — в разделе изучения и в режиме «Повторение»."
        ),
        "icon": "graduation-cap",
        "categories": PROGRAMMER_BASICS_CATEGORIES,
    },
    {
        "slug": "vscode",
        "title": "VS Code",
        "description": "Visual Studio Code — редактор кода от Microsoft.",
        "icon": "code",
        "categories": VSCODE_CATEGORIES,
    },
    {
        "slug": "windows",
        "title": "Windows",
        "description": "Горячие клавиши операционной системы Windows.",
        "icon": "monitor",
        "categories": [{"slug": "basics", "title": "Основы", "lessons": WINDOWS_LESSONS}],
    },
    {
        "slug": "chrome",
        "title": "Google Chrome",
        "description": "Браузер Google Chrome.",
        "icon": "globe",
        "categories": [{"slug": "tabs", "title": "Вкладки и навигация", "lessons": CHROME_LESSONS}],
    },
    {
        "slug": "edge",
        "title": "Microsoft Edge",
        "description": "Браузер Microsoft Edge.",
        "icon": "globe",
        "categories": [
            {
                "slug": "navigation",
                "title": "Навигация",
                "lessons": CHROME_LESSONS[:8],
            }
        ],
    },
    {
        "slug": "cursor",
        "title": "Cursor",
        "description": "AI-редактор Cursor на базе VS Code.",
        "icon": "sparkles",
        "categories": [
            {
                "slug": "ai",
                "title": "AI и редактор",
                "lessons": CURSOR_LESSONS + VSCODE_CATEGORIES[1]["lessons"][:5],
            }
        ],
    },
    {
        "slug": "git",
        "title": "Git",
        "description": (
            "Git с нуля: зачем нужен Git, репозиторий, commit, GitHub, ветки и merge. "
            "Не заучивайте команды — понимайте, что происходит с проектом."
        ),
        "icon": "git-branch",
        "categories": GIT_CATEGORIES,
    },
    {
        "slug": "visual-studio",
        "title": "Visual Studio",
        "description": "IDE Visual Studio для .NET.",
        "icon": "box",
        "categories": [{"slug": "ide", "title": "IDE", "lessons": _expand("VS", IDE_TEMPLATES)}],
    },
    {
        "slug": "word",
        "title": "Microsoft Word",
        "description": "Текстовый редактор Word.",
        "icon": "file-text",
        "categories": [
            {"slug": "formatting", "title": "Форматирование", "lessons": _expand("Word", OFFICE_TEMPLATES)}
        ],
    },
    {
        "slug": "excel",
        "title": "Microsoft Excel",
        "description": "Таблицы Excel.",
        "icon": "table",
        "categories": [
            {
                "slug": "sheets",
                "title": "Листы",
                "lessons": _expand(
                    "Excel",
                    OFFICE_TEMPLATES + [("Формула", "Вставьте формулу", ["Control", "Shift", "U"])],
                ),
            }
        ],
    },
    {
        "slug": "powerpoint",
        "title": "PowerPoint",
        "description": "Презентации PowerPoint.",
        "icon": "presentation",
        "categories": [{"slug": "slides", "title": "Слайды", "lessons": _expand("PowerPoint", OFFICE_TEMPLATES)}],
    },
    {
        "slug": "photoshop",
        "title": "Photoshop",
        "description": "Adobe Photoshop.",
        "icon": "image",
        "categories": [
            {
                "slug": "layers",
                "title": "Слои",
                "lessons": _expand(
                    "Photoshop",
                    [
                        ("Undo", "Отменить", ["Control", "Z"]),
                        ("Save", "Сохранить", ["Control", "S"]),
                        ("Free Transform", "Free Transform", ["Control", "T"]),
                        ("New Layer", "Новый слой", ["Control", "Shift", "N"]),
                    ],
                ),
            }
        ],
    },
    {
        "slug": "figma",
        "title": "Figma",
        "description": "Дизайн в Figma.",
        "icon": "figma",
        "categories": [
            {
                "slug": "design",
                "title": "Дизайн",
                "lessons": _expand(
                    "Figma",
                    [
                        ("Move", "Move tool", ["V"]),
                        ("Frame", "Frame tool", ["F"]),
                        ("Pen", "Pen tool", ["P"]),
                        ("Components", "Components", ["Control", "Alt", "K"]),
                    ],
                ),
            }
        ],
    },
    {
        "slug": "intellij",
        "title": "IntelliJ IDEA",
        "description": "JetBrains IntelliJ IDEA.",
        "icon": "coffee",
        "categories": [{"slug": "java", "title": "Java IDE", "lessons": _expand("IntelliJ", IDE_TEMPLATES)}],
    },
    {
        "slug": "pycharm",
        "title": "PyCharm",
        "description": "JetBrains PyCharm.",
        "icon": "snake",
        "categories": [{"slug": "python", "title": "Python IDE", "lessons": _expand("PyCharm", IDE_TEMPLATES)}],
    },
    {
        "slug": "github-desktop",
        "title": "GitHub",
        "description": "Репозиторий, origin, fork, pull request, merge и issues.",
        "icon": "github",
        "categories": [
            {
                "slug": "github",
                "title": "GitHub",
                "lessons": GITHUB_LESSONS,
            }
        ],
    },
    {
        "slug": "terminal",
        "title": "Terminal",
        "description": "Командная строка и shell.",
        "icon": "terminal",
        "categories": [
            {
                "slug": "shell",
                "title": "Shell",
                "lessons": _expand(
                    "Terminal",
                    LINUX_TEMPLATES + [("Clear", "Очистите экран", ["Control", "L"])],
                ),
            }
        ],
    },
    {
        "slug": "linux",
        "title": "Linux",
        "description": "Горячие клавиши Linux DE.",
        "icon": "penguin",
        "categories": [{"slug": "desktop", "title": "Рабочий стол", "lessons": _expand("Linux", LINUX_TEMPLATES)}],
    },
    {
        "slug": "macos",
        "title": "macOS",
        "description": "Горячие клавиши macOS.",
        "icon": "apple",
        "categories": [{"slug": "system", "title": "Система", "lessons": _expand("macOS", MAC_TEMPLATES)}],
    },
]


def _append_extra_shortcuts() -> None:
    """Только реальные полезные сочетания (без алфавитного спама)."""
    chrome = next(c for c in COURSES if c["slug"] == "chrome")
    tabs = chrome["categories"][0]["lessons"]
    existing = {tuple(lesson["keys"]) for lesson in tabs}
    for i in range(1, 10):
        keys = ["Control", str(i)]
        if tuple(keys) in existing:
            continue
        tabs.append(
            _L(
                f"Вкладка {i}",
                f"Перейдите на вкладку {i}",
                keys,
                f"Ctrl+{i} в Chrome",
            )
        )


_append_extra_shortcuts()


ACHIEVEMENTS = [
    ("first-win", "Первая победа", "Первый правильный ответ", "star", "correct_answers", 1),
    ("100-correct", "100 правильных", "100 правильных ответов", "target", "correct_answers", 100),
    ("500-xp", "500 XP", "Накопите 500 XP", "zap", "total_xp", 500),
    ("1000-xp", "1000 XP", "Накопите 1000 XP", "flame", "total_xp", 1000),
    ("week-streak", "Неделя подряд", "7 дней серии", "calendar", "streak_days", 7),
    ("month-streak", "Месяц подряд", "30 дней серии", "calendar-check", "streak_days", 30),
    ("perfect-session", "Без ошибок", "10 ответов подряд без ошибок", "shield", "combo", 10),
    ("vscode-complete", "VS Code мастер", "Пройдите все уроки VS Code", "code", "course_complete", 1),
    ("windows-complete", "Windows", "Пройдите Windows", "monitor", "course_complete", 1),
    ("git-complete", "Git", "Пройдите Git", "git-branch", "course_complete", 1),
    ("cursor-complete", "Cursor", "Пройдите Cursor", "sparkles", "course_complete", 1),
    (
        "computer-basics-complete",
        "Первый ноутбук",
        "Пройдите курс «Первый ноутбук: файлы и папки»",
        "folder",
        "course_complete",
        1,
    ),
    (
        "basics-complete",
        "База программиста",
        "Пройдите курс «Основные горячие клавиши программиста»",
        "graduation-cap",
        "course_complete",
        1,
    ),
]


def count_lessons() -> int:
    total = 0
    for c in COURSES:
        for cat in c["categories"]:
            total += len(cat["lessons"])
    return total
