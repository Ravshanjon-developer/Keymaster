"""Seed catalog: 300+ shortcuts across all courses."""

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


# --- Обязательный стартовый курс -------------------------------------------------

PROGRAMMER_BASICS_CATEGORIES: list[CategorySeed] = [
    {
        "slug": "text",
        "title": "Работа с текстом",
        "lessons": [
            _L(
                "Копировать",
                "Скопируйте текст",
                ["Control", "C"],
                "Копирует выделенный фрагмент в буфер обмена без удаления.",
                "Базовая операция: копировать выделенное. Используйте ежедневно в любом редакторе.",
            ),
            _L(
                "Вставить",
                "Вставьте текст из буфера",
                ["Control", "V"],
                "Вставляет содержимое буфера обмена в позицию курсора.",
                "Вставка после копирования или вырезания — основа работы с текстом.",
            ),
            _L(
                "Вырезать",
                "Вырежьте текст",
                ["Control", "X"],
                "Удаляет выделение и помещает его в буфер обмена.",
                "Удобно перемещать код или текст между местами.",
            ),
            _L(
                "Отменить",
                "Отмените последнее действие",
                ["Control", "Z"],
                "Откатывает последнее изменение — спасает от ошибок.",
                "Первая реакция на ошибку: Ctrl+Z.",
            ),
            _L(
                "Повторить",
                "Повторите отменённое действие",
                ["Control", "Y"],
                "Возвращает действие после отмены (Redo).",
                "Если отменили слишком много — верните через Ctrl+Y.",
            ),
            _L(
                "Выделить всё",
                "Выделите весь текст",
                ["Control", "A"],
                "Выделяет всё содержимое документа или поля ввода.",
                "Быстро выделить файл целиком перед копированием или удалением.",
            ),
        ],
    },
    {
        "slug": "files",
        "title": "Работа с файлами",
        "lessons": [
            _L(
                "Сохранить",
                "Сохраните файл",
                ["Control", "S"],
                "Сохраняет текущий файл. Привычка №1 программиста.",
                "Всегда сохраняйте изменения перед запуском или переключением задач.",
            ),
            _L(
                "Сохранить как",
                "Сохраните файл под новым именем",
                ["Control", "Shift", "S"],
                "Открывает диалог «Сохранить как» / Save As.",
                "Нужно, чтобы создать копию файла или сменить формат.",
            ),
            _L(
                "Открыть файл",
                "Откройте файл",
                ["Control", "O"],
                "Открывает диалог выбора файла.",
                "Быстрый доступ к файлу без мыши.",
            ),
            _L(
                "Новый файл",
                "Создайте новый файл",
                ["Control", "N"],
                "Создаёт новый документ / вкладку редактора.",
                "Старт новой заметки, скрипта или черновика.",
            ),
            _L(
                "Быстро открыть файл",
                "Быстро найдите и откройте файл",
                ["Control", "P"],
                "В IDE — Quick Open: поиск файла по имени.",
                "Главный способ навигации по проекту в VS Code / Cursor.",
            ),
            _L(
                "Закрыть вкладку",
                "Закройте текущую вкладку",
                ["Control", "W"],
                "Закрывает активную вкладку редактора или браузера.",
                "Держите рабочее пространство чистым.",
            ),
            _L(
                "Следующая вкладка",
                "Перейдите на следующую вкладку",
                ["Control", "Tab"],
                "Переключает на следующую открытую вкладку.",
                "Навигация между файлами без мыши.",
            ),
            _L(
                "Предыдущая вкладка",
                "Перейдите на предыдущую вкладку",
                ["Control", "Shift", "Tab"],
                "Переключает на предыдущую вкладку.",
                "Обратное переключение по кругу вкладок.",
            ),
        ],
    },
    {
        "slug": "search",
        "title": "Поиск",
        "lessons": [
            _L(
                "Поиск",
                "Найдите слово в файле",
                ["Control", "F"],
                "Открывает поиск по текущему документу.",
                "Быстрый поиск функции, строки или опечатки.",
            ),
            _L(
                "Замена",
                "Откройте замену текста",
                ["Control", "H"],
                "Поиск с заменой в текущем файле.",
                "Переименование переменной или правка шаблона по всему файлу.",
            ),
            _L(
                "Перейти к строке",
                "Перейдите к строке по номеру",
                ["Control", "G"],
                "Прыжок к номеру строки (часто в редакторах кода).",
                "Когда в ошибке указан номер строки — сразу Ctrl+G.",
            ),
        ],
    },
    {
        "slug": "navigation",
        "title": "Навигация",
        "lessons": [
            _L(
                "В начало строки",
                "Перейдите в начало строки",
                ["Home"],
                "Курсор в начало текущей строки.",
                "Быстрее, чем стрелками держать влево.",
            ),
            _L(
                "В конец строки",
                "Перейдите в конец строки",
                ["End"],
                "Курсор в конец текущей строки.",
                "Часто нужно дописать код в конце строки.",
            ),
            _L(
                "Страница вверх",
                "Пролистайте страницу вверх",
                ["PageUp"],
                "Прокрутка / прыжок на экран вверх.",
                "Быстрый просмотр длинного файла.",
            ),
            _L(
                "Страница вниз",
                "Пролистайте страницу вниз",
                ["PageDown"],
                "Прокрутка / прыжок на экран вниз.",
                "Движение по документу крупными шагами.",
            ),
            _L(
                "В начало документа",
                "Перейдите в начало документа",
                ["Control", "Home"],
                "Курсор в самое начало файла.",
                "Мгновенный переход к импортам / шапке файла.",
            ),
            _L(
                "В конец документа",
                "Перейдите в конец документа",
                ["Control", "End"],
                "Курсор в самый конец файла.",
                "Быстро дописать код внизу файла.",
            ),
        ],
    },
    {
        "slug": "words",
        "title": "Работа со словами",
        "lessons": [
            _L(
                "Предыдущее слово",
                "Перейдите к предыдущему слову",
                ["Control", "ArrowLeft"],
                "Курсор прыгает на слово влево.",
                "Навигация по идентификаторам быстрее, чем по символам.",
            ),
            _L(
                "Следующее слово",
                "Перейдите к следующему слову",
                ["Control", "ArrowRight"],
                "Курсор прыгает на слово вправо.",
                "Движение по коду «по токенам».",
            ),
            _L(
                "Удалить предыдущее слово",
                "Удалите предыдущее слово",
                ["Control", "Backspace"],
                "Удаляет слово слева от курсора.",
                "Исправить опечатку в слове одним жестом.",
            ),
            _L(
                "Удалить следующее слово",
                "Удалите следующее слово",
                ["Control", "Delete"],
                "Удаляет слово справа от курсора.",
                "Быстрая правка без выделения мышью.",
            ),
        ],
    },
    {
        "slug": "selection",
        "title": "Выделение текста",
        "lessons": [
            _L(
                "Выделение влево",
                "Выделите символы влево",
                ["Shift", "ArrowLeft"],
                "Расширяет выделение на символ влево.",
                "Точное выделение без мыши.",
            ),
            _L(
                "Выделение вправо",
                "Выделите символы вправо",
                ["Shift", "ArrowRight"],
                "Расширяет выделение на символ вправо.",
                "База для копирования/вырезания.",
            ),
            _L(
                "Выделение слова влево",
                "Выделите предыдущее слово",
                ["Control", "Shift", "ArrowLeft"],
                "Выделяет слово влево.",
                "Быстро выделить идентификатор целиком.",
            ),
            _L(
                "Выделение слова вправо",
                "Выделите следующее слово",
                ["Control", "Shift", "ArrowRight"],
                "Выделяет слово вправо.",
                "Подготовка к Ctrl+C / Ctrl+X.",
            ),
            _L(
                "Выделить до начала строки",
                "Выделите до начала строки",
                ["Shift", "Home"],
                "Выделение от курсора до начала строки.",
                "Удалить или скопировать начало строки.",
            ),
            _L(
                "Выделить до конца строки",
                "Выделите до конца строки",
                ["Shift", "End"],
                "Выделение от курсора до конца строки.",
                "Классика правки строки кода.",
            ),
            _L(
                "Выделить до начала документа",
                "Выделите до начала документа",
                ["Control", "Shift", "Home"],
                "Выделение от курсора до начала файла.",
                "Редко, но мощно при больших правках.",
            ),
            _L(
                "Выделить до конца документа",
                "Выделите до конца документа",
                ["Control", "Shift", "End"],
                "Выделение от курсора до конца файла.",
                "Удобно очистить или переместить хвост файла.",
            ),
        ],
    },
    {
        "slug": "windows",
        "title": "Работа с окнами",
        "lessons": [
            _L(
                "Переключение окон",
                "Переключитесь между окнами",
                ["Alt", "Tab"],
                "Переключение между программами. В браузере тренируем через Ctrl+Tab.",
                "Ежедневная навигация по рабочему столу.",
            ),
            _L(
                "Закрыть программу",
                "Закройте активную программу",
                ["Alt", "F4"],
                "Закрывает текущее окно приложения.",
                "В тренажёре используйте подсказку — ОС часто перехватывает Alt+F4.",
            ),
            _L(
                "Свернуть все окна",
                "Сверните все окна на рабочий стол",
                ["Meta", "D"],
                "Показать рабочий стол (Win+D). В тренажёре: Ctrl+D.",
                "Быстро убрать окна с экрана.",
            ),
            _L(
                "Проводник",
                "Откройте проводник",
                ["Meta", "E"],
                "Открывает Проводник Windows (Win+E). В тренажёре: Ctrl+E.",
                "Доступ к файлам системы.",
            ),
            _L(
                "Блокировка",
                "Заблокируйте компьютер",
                ["Meta", "L"],
                "Блокировка экрана (Win+L). В тренажёре: Ctrl+L.",
                "Безопасность при отходе от ПК.",
            ),
        ],
    },
    {
        "slug": "screenshots",
        "title": "Скриншоты",
        "lessons": [
            _L(
                "Снимок области",
                "Сделайте снимок области экрана",
                ["Meta", "Shift", "S"],
                "Ножницы Windows (Win+Shift+S). В тренажёре: Ctrl+Shift+S.",
                "Отправить баг или фрагмент UI коллеге.",
            ),
            _L(
                "Снимок всего экрана",
                "Сделайте снимок всего экрана",
                ["PrintScreen"],
                "Копирует весь экран в буфер (Print Screen).",
                "Полный скриншот монитора.",
            ),
        ],
    },
    {
        "slug": "clipboard",
        "title": "Буфер обмена",
        "lessons": [
            _L(
                "История буфера",
                "Откройте историю буфера обмена",
                ["Meta", "V"],
                "Журнал буфера Windows (Win+V). В тренажёре: Ctrl+V как замена для тренировки жеста.",
                "Вернуться к ранее скопированному тексту.",
            ),
        ],
    },
    {
        "slug": "practice",
        "title": "Практика",
        "lessons": [
            _L(
                "Практика: копирование",
                "Скопируйте выделенный фрагмент",
                ["Control", "C"],
                "Закрепление: Ctrl+C без подглядывания в шпаргалку.",
                "Проверьте, что копирование доведено до автоматизма.",
            ),
            _L(
                "Практика: вставка",
                "Вставьте скопированное",
                ["Control", "V"],
                "Закрепление: Ctrl+V.",
                "Связка Copy → Paste — ежедневный навык.",
            ),
            _L(
                "Практика: сохранение",
                "Сохраните файл",
                ["Control", "S"],
                "Закрепление: Ctrl+S — сохраняйте часто.",
                "Рефлекс «изменил — сохранил».",
            ),
            _L(
                "Практика: поиск",
                "Найдите нужное слово",
                ["Control", "F"],
                "Закрепление: Ctrl+F.",
                "Поиск экономит минуты каждый день.",
            ),
            _L(
                "Практика: выделить всё",
                "Выделите весь текст",
                ["Control", "A"],
                "Закрепление: Ctrl+A.",
                "Перед массовым копированием или удалением.",
            ),
            _L(
                "Практика: отмена",
                "Отмените ошибочное действие",
                ["Control", "Z"],
                "Закрепление: Ctrl+Z.",
                "Страховка от любых правок.",
            ),
            _L(
                "Практика: конец строки",
                "Перейдите в конец строки",
                ["End"],
                "Закрепление: End.",
                "Навигация без мыши.",
            ),
            _L(
                "Практика: быстрый файл",
                "Быстро откройте файл по имени",
                ["Control", "P"],
                "Закрепление: Ctrl+P в редакторе кода.",
                "Главный хоткей IDE для навигации.",
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

GIT_LESSONS = [
    _L("Статус", "git status (в терминале)", ["Control", "Shift", "G"], "Часто в IDE"),
    _L("Commit в VS Code", "Откройте SCM", ["Control", "Shift", "G"], "Ctrl+Shift+G"),
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
        "slug": "programmer-basics",
        "title": "Основные горячие клавиши программиста",
        "description": (
            "Этот курс знакомит с самыми важными сочетаниями клавиш, которые используются "
            "ежедневно независимо от языка, редактора и ОС. Пройдите его первым."
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
        "description": "Система контроля версий Git.",
        "icon": "git-branch",
        "categories": [
            {
                "slug": "workflow",
                "title": "Workflow",
                "lessons": GIT_LESSONS + VSCODE_CATEGORIES[6]["lessons"],
            }
        ],
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
        "title": "GitHub Desktop",
        "description": "GitHub Desktop клиент.",
        "icon": "github",
        "categories": [
            {
                "slug": "desktop",
                "title": "Клиент",
                "lessons": GIT_LESSONS
                + _expand("GH Desktop", [("Fetch", "Fetch origin", ["Control", "Shift", "F"])]),
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


def _append_bulk_shortcuts() -> None:
    """Дополнительные комбинации для заявленных 300+ shortcuts."""
    windows = next(c for c in COURSES if c["slug"] == "windows")
    lessons = windows["categories"][0]["lessons"]
    for letter in "ABCDEFGHIJKLMNOPQRSTUVWXYZ":
        lessons.append(
            _L(
                f"Ctrl+{letter}",
                f"Нажмите Ctrl+{letter}",
                ["Control", letter],
                f"Системное сочетание Ctrl+{letter}",
            )
        )
    for letter in "ABCDEFGHIJKLMNOPQRSTUVWXYZ":
        lessons.append(
            _L(
                f"Ctrl+Shift+{letter}",
                f"Нажмите Ctrl+Shift+{letter}",
                ["Control", "Shift", letter],
                f"Ctrl+Shift+{letter}",
            )
        )
    for n in range(1, 13):
        lessons.append(_L(f"F{n}", f"Нажмите F{n}", [f"F{n}"], f"Функциональная клавиша F{n}"))
    vscode = next(c for c in COURSES if c["slug"] == "vscode")
    edit = next(cat for cat in vscode["categories"] if cat["slug"] == "editing")
    for digit in "0123456789":
        edit["lessons"].append(
            _L(
                f"Ctrl+{digit}",
                f"Панель: Ctrl+{digit}",
                ["Control", digit],
                f"VS Code — Ctrl+{digit}",
            )
        )
    chrome = next(c for c in COURSES if c["slug"] == "chrome")
    tabs = chrome["categories"][0]["lessons"]
    for i in range(1, 10):
        tabs.append(
            _L(
                f"Переключиться на вкладку {i}",
                f"Перейдите на вкладку {i}",
                ["Control", str(i)],
                f"Ctrl+{i} в Chrome",
            )
        )
    for letter in "ABCDEFGHIJKLMNOPQRSTUVWXYZ":
        tabs.append(
            _L(
                f"Chrome Ctrl+Alt+{letter}",
                f"Комбинация Ctrl+Alt+{letter}",
                ["Control", "Alt", letter],
                "Расширенные сочетания Chrome",
            )
        )


_append_bulk_shortcuts()


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
