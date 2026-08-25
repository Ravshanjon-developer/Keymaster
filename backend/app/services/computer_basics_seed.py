"""Task-based content for «Первый ноутбук» — aligned with desktop simulator missions."""

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


def _T(title: str, action: str, example: str, desc: str = "", *, keys: list[str] | None = None) -> LessonSeed:
    return {
        "title": title,
        "action_prompt": action,
        "keys": keys or [],
        "usage_example": example,
        "description": desc or action,
    }


def _P(task_id: int, title: str, action: str, example: str, desc: str = "") -> LessonSeed:
    """Practice lesson verified by desktop simulator task `task_id`."""
    return _T(title, action, example, desc, keys=[f"desktop:{task_id}"])


COMPUTER_BASICS_CATEGORIES: list[CategorySeed] = [
    {
        "slug": "basics",
        "title": "Файлы и папки",
        "lessons": [
            _T(
                "Файл и папка",
                "Поймите разницу между файлом и папкой",
                "Папка — «конверт»; файл — одна заметка, фото или программа",
                "Папки помогают не искать всё на рабочем столе. У файла есть имя и расширение: report.docx, photo.jpg.",
            ),
            _T(
                "Расширение файла",
                "Узнайте, зачем нужно .txt, .jpg, .zip",
                ".txt — текст; .jpg — фото; .zip — архив (много файлов в одном)",
                "Windows может скрывать расширения — важно видеть полное имя, чтобы не перепутать тип.",
            ),
            _T(
                "Где хранить",
                "Решите, что на рабочем столе, а что в папках",
                "На столе — ярлыки; документы и учёба — в папках",
                "Чистый рабочий стол = меньше стресса и быстрее найти нужное.",
            ),
        ],
    },
    {
        "slug": "explorer",
        "title": "Практика в проводнике",
        "lessons": [
            _P(
                1,
                "Папка Practice",
                "Создайте на рабочем столе папку Practice",
                "ПКМ по обоям → Новая папка → Practice; или Ctrl+Shift+N",
                "Имена латиницей проще для программ. В симуляторе шаг засчитается сам.",
            ),
            _P(
                2,
                "Файл notes.txt",
                "Создайте на рабочем столе файл notes.txt",
                "ПКМ → Новый файл → notes.txt",
                "Расширение .txt сразу говорит: это простой текст.",
            ),
            _P(
                3,
                "Переименование",
                "Переименуйте notes.txt в my-notes.txt",
                "Выделите файл → F2 или ПКМ → Переименовать → my-notes.txt",
                "Имя должно подсказывать содержимое, а не «новый123».",
            ),
            _P(
                4,
                "Папка Projects",
                "Создайте папку Projects на рабочем столе",
                "ПКМ → Новая папка → Projects (или найдите её в «Файлах»)",
                "Отдельная папка для проектов — базовый порядок на диске.",
            ),
            _P(
                5,
                "Переместить файл",
                "Переместите my-notes.txt в папку Projects",
                "ПКМ по файлу → Вырезать; откройте Projects → Вставить",
                "Вырезать+вставить переносит файл, копировать — оставляет копию.",
            ),
            _P(
                6,
                "Копия файла",
                "Скопируйте любой файл и вставьте дубликат",
                "ПКМ → Копировать, затем ПКМ по пустому месту → Вставить",
                "Копия нужна перед правкой или отправкой, оригинал остаётся.",
            ),
        ],
    },
    {
        "slug": "trash-zip",
        "title": "Корзина и ZIP",
        "lessons": [
            _P(
                7,
                "Удалить в корзину",
                "Удалите любой файл — он должен попасть в корзину",
                "Выделите файл → Delete или ПКМ → Удалить",
                "Обычный Delete не уничтожает навсегда — файл можно вернуть.",
            ),
            _P(
                8,
                "Восстановить из корзины",
                "Откройте корзину и восстановите удалённый файл",
                "Файлы → Корзина → ПКМ по файлу → Восстановить",
                "Полное удаление без корзины — Shift+Delete; новичкам лучше обычное.",
            ),
            _P(
                9,
                "Сжать в ZIP",
                "Создайте ZIP из любого файла",
                "ПКМ по файлу → Сжать в ZIP",
                "ZIP — один «пакет» с файлами внутри. Удобно отправить по почте.",
            ),
            _P(
                10,
                "Распаковать ZIP",
                "Распакуйте созданный архив",
                "ПКМ по .zip → Извлечь сюда",
                "После распаковки рядом появляется папка или файл с исходным именем.",
            ),
        ],
    },
    {
        "slug": "project",
        "title": "Структура проекта",
        "lessons": [
            _P(
                11,
                "Папки Website",
                "На рабочем столе создайте Website с папками html, css и js",
                "Создайте Website → внутри html, css, js",
                "Так обычно раскладывают простой сайт: разметка, стили, скрипты.",
            ),
            _P(
                12,
                "Файл index.html",
                "В Website/html создайте файл index.html",
                "Откройте Website → html → Новый файл → index.html",
                "index.html — стартовая страница, которую открывает браузер.",
            ),
        ],
    },
]
