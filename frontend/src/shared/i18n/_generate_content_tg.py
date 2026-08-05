# -*- coding: utf-8 -*-
"""Generate contentTg.ts from content_ru_dump.json (Tajik Cyrillic)."""
from __future__ import annotations

import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
DUMP = HERE / "content_ru_dump.json"
OUT = HERE / "contentTg.ts"

COURSES = {
    "programmer-basics": {
        "title": "Омезишҳои асосии барномасоз",
        "description": "Ин курс бо муҳимтарин омезишҳои тугмаҳо шинос мекунад, ки ҳар рӯз новобаста аз забон, муҳаррир ва ОС истифода мешаванд. Аввал инро гузаред.",
    },
    "vscode": {
        "title": "VS Code",
        "description": "Visual Studio Code — муҳаррири код аз Microsoft.",
    },
    "windows": {
        "title": "Windows",
        "description": "Тугмаҳои тезӣ барои системаи амалии Windows.",
    },
    "chrome": {
        "title": "Google Chrome",
        "description": "Браузери Google Chrome.",
    },
    "edge": {
        "title": "Microsoft Edge",
        "description": "Браузери Microsoft Edge.",
    },
    "cursor": {
        "title": "Cursor",
        "description": "Муҳаррири AI-и Cursor дар асоси VS Code.",
    },
    "git": {
        "title": "Git",
        "description": "Системаи назорати версияҳо Git.",
    },
    "visual-studio": {
        "title": "Visual Studio",
        "description": "IDE Visual Studio барои .NET.",
    },
    "word": {
        "title": "Microsoft Word",
        "description": "Муҳаррири матнии Word.",
    },
    "excel": {
        "title": "Microsoft Excel",
        "description": "Ҷадвалҳои Excel.",
    },
    "powerpoint": {
        "title": "PowerPoint",
        "description": "Презентатсияҳои PowerPoint.",
    },
    "photoshop": {
        "title": "Photoshop",
        "description": "Adobe Photoshop.",
    },
    "figma": {
        "title": "Figma",
        "description": "Тарроҳӣ дар Figma.",
    },
    "intellij": {
        "title": "IntelliJ IDEA",
        "description": "JetBrains IntelliJ IDEA.",
    },
    "pycharm": {
        "title": "PyCharm",
        "description": "JetBrains PyCharm.",
    },
    "github-desktop": {
        "title": "GitHub Desktop",
        "description": "Клиенти GitHub Desktop.",
    },
    "terminal": {
        "title": "Terminal",
        "description": "Сатри фармон ва shell.",
    },
    "linux": {
        "title": "Linux",
        "description": "Тугмаҳои тезӣ барои Linux DE.",
    },
    "macos": {
        "title": "macOS",
        "description": "Тугмаҳои тезӣ барои macOS.",
    },
}

CATEGORIES = {
    "programmer-basics/text": "Кор бо матн",
    "programmer-basics/files": "Кор бо файлҳо",
    "programmer-basics/search": "Ҷустуҷӯ",
    "programmer-basics/navigation": "Навигатсия",
    "programmer-basics/words": "Кор бо калимаҳо",
    "programmer-basics/selection": "Интихоби матн",
    "programmer-basics/windows": "Кор бо тирезаҳо",
    "programmer-basics/screenshots": "Скриншотҳо",
    "programmer-basics/clipboard": "Буфери мубодила",
    "programmer-basics/practice": "Машқ",
    "vscode/navigation": "Навигатсия",
    "vscode/editing": "Таҳрир",
    "vscode/files": "Файлҳо",
    "vscode/search": "Ҷустуҷӯ",
    "vscode/debug": "Отладка",
    "vscode/terminal": "Терминал",
    "vscode/git": "Git",
    "windows/basics": "Асосҳо",
    "chrome/tabs": "Варақаҳо ва навигатсия",
    "edge/navigation": "Навигатсия",
    "cursor/ai": "AI ва муҳаррир",
    "git/workflow": "Workflow",
    "visual-studio/ide": "IDE",
    "word/formatting": "Форматбандӣ",
    "excel/sheets": "Варақҳо",
    "powerpoint/slides": "Слайдҳо",
    "photoshop/layers": "Қабатҳо",
    "figma/design": "Тарроҳӣ",
    "intellij/java": "Java IDE",
    "pycharm/python": "Python IDE",
    "github-desktop/desktop": "Клиент",
    "terminal/shell": "Shell",
    "linux/desktop": "Мизи корӣ",
    "macos/system": "Система",
}

# Explicit lesson translations keyed by full lesson key.
# For duplicate keys, first (more meaningful) entry wins when generating.
LESSONS: dict[str, dict[str, str]] = {
    # ---- programmer-basics/text ----
    "programmer-basics/text/Control+C": {
        "title": "Нусхабардорӣ",
        "action_prompt": "Матнро нусхабардорӣ кунед",
        "usage_example": "Қисми интихобшударо бе нест кардан ба буфери мубодила нусха мекунад.",
        "description": "Амали асосӣ: интихобро нусхабардорӣ кунед. Ҳар рӯз дар ҳар муҳаррир истифода баред.",
    },
    "programmer-basics/text/Control+V": {
        "title": "Гузоштан",
        "action_prompt": "Матнро аз буфер гузоред",
        "usage_example": "Мундариҷаи буфери мубодиларо ба мавқеи курсор мегузорад.",
        "description": "Гузоштан пас аз нусхабардорӣ ё буридан — асоси кор бо матн.",
    },
    "programmer-basics/text/Control+X": {
        "title": "Буридан",
        "action_prompt": "Матнро буред",
        "usage_example": "Интихобро нест карда, онро ба буфери мубодила мегузорад.",
        "description": "Барои кӯчонидани код ё матн байни ҷойҳо қулай аст.",
    },
    "programmer-basics/text/Control+Z": {
        "title": "Бекор кардан",
        "action_prompt": "Амали охиринро бекор кунед",
        "usage_example": "Тағйироти охиринро бармегардонад — аз хатоҳо наҷот медиҳад.",
        "description": "Реаксияи аввал ба хато: Ctrl+Z.",
    },
    "programmer-basics/text/Control+Y": {
        "title": "Такрор кардан",
        "action_prompt": "Амали бекоршударо такрор кунед",
        "usage_example": "Амалро пас аз бекор кардан бармегардонад (Redo).",
        "description": "Агар аз ҳад зиёд бекор кардед — тавассути Ctrl+Y баргардонед.",
    },
    "programmer-basics/text/Control+A": {
        "title": "Ҳамаро интихоб кардан",
        "action_prompt": "Тамоми матнро интихоб кунед",
        "usage_example": "Тамоми мундариҷаи ҳуҷҷат ё майдони вурудро интихоб мекунад.",
        "description": "Файлро пурра пеш аз нусхабардорӣ ё нест кардан зуд интихоб кунед.",
    },
    # ---- programmer-basics/files ----
    "programmer-basics/files/Control+S": {
        "title": "Захира кардан",
        "action_prompt": "Файлро захира кунед",
        "usage_example": "Файли ҷориро захира мекунад. Одати №1-и барномасоз.",
        "description": "Пеш аз иҷро ё иваз кардани вазифаҳо ҳамеша тағйиротро захира кунед.",
    },
    "programmer-basics/files/Control+Shift+S": {
        "title": "Захира кардан ҳамчун",
        "action_prompt": "Файлро бо номи нав захира кунед",
        "usage_example": "Диалоги «Захира кардан ҳамчун» / Save As-ро мекушояд.",
        "description": "Барои нусхаи файл сохтан ё форматро иваз кардан лозим аст.",
    },
    "programmer-basics/files/Control+O": {
        "title": "Кушодани файл",
        "action_prompt": "Файлро кушоед",
        "usage_example": "Диалоги интихоби файлро мекушояд.",
        "description": "Дастрасии зуд ба файл бе муш.",
    },
    "programmer-basics/files/Control+N": {
        "title": "Файли нав",
        "action_prompt": "Файли нав эҷод кунед",
        "usage_example": "Ҳуҷҷат / варақаи нави муҳаррир месозад.",
        "description": "Оғози ёддошт, скрипт ё сиёҳнависи нав.",
    },
    "programmer-basics/files/Control+P": {
        "title": "Зуд кушодани файл",
        "action_prompt": "Файлро зуд ёфта кушоед",
        "usage_example": "Дар IDE — Quick Open: ҷустуҷӯи файл аз рӯи ном.",
        "description": "Тарзи асосии навигатсия дар лоиҳа дар VS Code / Cursor.",
    },
    "programmer-basics/files/Control+W": {
        "title": "Пӯшидани варақа",
        "action_prompt": "Варақаи ҷориро пӯшед",
        "usage_example": "Варақаи фаъоли муҳаррир ё браузерро мепӯшад.",
        "description": "Фазои кориро тоза нигоҳ доред.",
    },
    "programmer-basics/files/Control+Tab": {
        "title": "Варақаи навбатӣ",
        "action_prompt": "Ба варақаи навбатӣ гузаред",
        "usage_example": "Ба варақаи кушодаи навбатӣ мегузарад.",
        "description": "Навигатсия байни файлҳо бе муш.",
    },
    "programmer-basics/files/Control+Shift+Tab": {
        "title": "Варақаи қаблӣ",
        "action_prompt": "Ба варақаи қаблӣ гузаред",
        "usage_example": "Ба варақаи қаблӣ мегузарад.",
        "description": "Гузариши баръакс дар доираи варақаҳо.",
    },
    # ---- programmer-basics/search ----
    "programmer-basics/search/Control+F": {
        "title": "Ҷустуҷӯ",
        "action_prompt": "Калимаро дар файл ёбед",
        "usage_example": "Ҷустуҷӯро дар ҳуҷҷати ҷорӣ мекушояд.",
        "description": "Ҷустуҷӯи зуди функсия, сатр ё хатои имло.",
    },
    "programmer-basics/search/Control+H": {
        "title": "Ивазкунӣ",
        "action_prompt": "Ивазкунии матнро кушоед",
        "usage_example": "Ҷустуҷӯ бо ивазкунӣ дар файли ҷорӣ.",
        "description": "Номивазкунии тағйирёбанда ё таҳрири шаблон дар тамоми файл.",
    },
    "programmer-basics/search/Control+G": {
        "title": "Гузаштан ба сатр",
        "action_prompt": "Аз рӯи рақам ба сатр гузаред",
        "usage_example": "Паридан ба рақами сатр (аксар дар муҳаррирҳои код).",
        "description": "Вақте дар хато рақами сатр нишон дода шудааст — фавран Ctrl+G.",
    },
    # ---- programmer-basics/navigation ----
    "programmer-basics/navigation/Home": {
        "title": "Ба ибтидои сатр",
        "action_prompt": "Ба ибтидои сатр гузаред",
        "usage_example": "Курсор ба ибтидои сатри ҷорӣ.",
        "description": "Зудтар аз нигоҳ доштани тирчаи чап.",
    },
    "programmer-basics/navigation/End": {
        "title": "Ба охири сатр",
        "action_prompt": "Ба охири сатр гузаред",
        "usage_example": "Курсор ба охири сатри ҷорӣ.",
        "description": "Аксар вақт код дар охири сатр илова кардан лозим аст.",
    },
    "programmer-basics/navigation/PageUp": {
        "title": "Саҳифа боло",
        "action_prompt": "Саҳифаро боло варақ занед",
        "usage_example": "Ҳаракат / паридан як экран боло.",
        "description": "Дидани зуди файли дароз.",
    },
    "programmer-basics/navigation/PageDown": {
        "title": "Саҳифа поён",
        "action_prompt": "Саҳифаро поён варақ занед",
        "usage_example": "Ҳаракат / паридан як экран поён.",
        "description": "Ҳаракат дар ҳуҷҷат бо қадамҳои калон.",
    },
    "programmer-basics/navigation/Control+Home": {
        "title": "Ба ибтидои ҳуҷҷат",
        "action_prompt": "Ба ибтидои ҳуҷҷат гузаред",
        "usage_example": "Курсор ба худи ибтидои файл.",
        "description": "Гузариши фаврӣ ба import-ҳо / сарлавҳаи файл.",
    },
    "programmer-basics/navigation/Control+End": {
        "title": "Ба охири ҳуҷҷат",
        "action_prompt": "Ба охири ҳуҷҷат гузаред",
        "usage_example": "Курсор ба худи охири файл.",
        "description": "Кодро зуд дар поёни файл илова кунед.",
    },
    # ---- programmer-basics/words ----
    "programmer-basics/words/Control+ArrowLeft": {
        "title": "Калимаи қаблӣ",
        "action_prompt": "Ба калимаи қаблӣ гузаред",
        "usage_example": "Курсор ба калима чап мепарад.",
        "description": "Навигатсия аз рӯи идентификаторҳо зудтар аз аломатҳо.",
    },
    "programmer-basics/words/Control+ArrowRight": {
        "title": "Калимаи навбатӣ",
        "action_prompt": "Ба калимаи навбатӣ гузаред",
        "usage_example": "Курсор ба калима рост мепарад.",
        "description": "Ҳаракат дар код «аз рӯи токенҳо».",
    },
    "programmer-basics/words/Control+Backspace": {
        "title": "Нест кардани калимаи қаблӣ",
        "action_prompt": "Калимаи қаблиро нест кунед",
        "usage_example": "Калимаи чапи курсорро нест мекунад.",
        "description": "Хатои имлоро дар калима бо як ишора ислоҳ кунед.",
    },
    "programmer-basics/words/Control+Delete": {
        "title": "Нест кардани калимаи навбатӣ",
        "action_prompt": "Калимаи навбатиро нест кунед",
        "usage_example": "Калимаи рости курсорро нест мекунад.",
        "description": "Таҳрири зуд бе интихоб бо муш.",
    },
    # ---- programmer-basics/selection ----
    "programmer-basics/selection/Shift+ArrowLeft": {
        "title": "Интихоб ба чап",
        "action_prompt": "Аломатҳоро ба чап интихоб кунед",
        "usage_example": "Интихобро як аломат ба чап васеъ мекунад.",
        "description": "Интихоби дақиқ бе муш.",
    },
    "programmer-basics/selection/Shift+ArrowRight": {
        "title": "Интихоб ба рост",
        "action_prompt": "Аломатҳоро ба рост интихоб кунед",
        "usage_example": "Интихобро як аломат ба рост васеъ мекунад.",
        "description": "Асос барои нусхабардорӣ/буридан.",
    },
    "programmer-basics/selection/Control+Shift+ArrowLeft": {
        "title": "Интихоби калима ба чап",
        "action_prompt": "Калимаи қаблиро интихоб кунед",
        "usage_example": "Калимаро ба чап интихоб мекунад.",
        "description": "Идентификаторро пурра зуд интихоб кунед.",
    },
    "programmer-basics/selection/Control+Shift+ArrowRight": {
        "title": "Интихоби калима ба рост",
        "action_prompt": "Калимаи навбатиро интихоб кунед",
        "usage_example": "Калимаро ба рост интихоб мекунад.",
        "description": "Омодагӣ ба Ctrl+C / Ctrl+X.",
    },
    "programmer-basics/selection/Shift+Home": {
        "title": "То ибтидои сатр интихоб",
        "action_prompt": "То ибтидои сатр интихоб кунед",
        "usage_example": "Интихоб аз курсор то ибтидои сатр.",
        "description": "Ибтидои сатрро нест ё нусхабардорӣ кунед.",
    },
    "programmer-basics/selection/Shift+End": {
        "title": "То охири сатр интихоб",
        "action_prompt": "То охири сатр интихоб кунед",
        "usage_example": "Интихоб аз курсор то охири сатр.",
        "description": "Классикаи таҳрири сатри код.",
    },
    "programmer-basics/selection/Control+Shift+Home": {
        "title": "То ибтидои ҳуҷҷат интихоб",
        "action_prompt": "То ибтидои ҳуҷҷат интихоб кунед",
        "usage_example": "Интихоб аз курсор то ибтидои файл.",
        "description": "Кам истифода мешавад, аммо дар таҳрирҳои калон қавӣ аст.",
    },
    "programmer-basics/selection/Control+Shift+End": {
        "title": "То охири ҳуҷҷат интихоб",
        "action_prompt": "То охири ҳуҷҷат интихоб кунед",
        "usage_example": "Интихоб аз курсор то охири файл.",
        "description": "Барои тоза кардан ё кӯчонидани думи файл қулай аст.",
    },
    # ---- programmer-basics/windows ----
    "programmer-basics/windows/Alt+Tab": {
        "title": "Гузариш байни тирезаҳо",
        "action_prompt": "Байни тирезаҳо гузаред",
        "usage_example": "Гузариш байни барномаҳо. Дар браузер тавассути Ctrl+Tab машқ мекунем.",
        "description": "Навигатсияи ҳаррӯза дар мизи корӣ.",
    },
    "programmer-basics/windows/Alt+F4": {
        "title": "Пӯшидани барнома",
        "action_prompt": "Барномаи фаъолро пӯшед",
        "usage_example": "Тирезаи ҷории барномаро мепӯшад.",
        "description": "Дар тренажёр аз ишора истифода баред — ОС аксар Alt+F4-ро мегирад.",
    },
    "programmer-basics/windows/Meta+D": {
        "title": "Печондани ҳамаи тирезаҳо",
        "action_prompt": "Ҳамаи тирезаҳоро ба мизи корӣ печонед",
        "usage_example": "Нишон додани мизи корӣ (Win+D). Дар тренажёр: Ctrl+D.",
        "description": "Тирезаҳоро аз экран зуд пинҳон кунед.",
    },
    "programmer-basics/windows/Meta+E": {
        "title": "Гузаранда",
        "action_prompt": "Гузарандаро кушоед",
        "usage_example": "Гузарандаи Windows-ро мекушояд (Win+E). Дар тренажёр: Ctrl+E.",
        "description": "Дастрасӣ ба файлҳои система.",
    },
    "programmer-basics/windows/Meta+L": {
        "title": "Қулфкунӣ",
        "action_prompt": "Компютерро қулф кунед",
        "usage_example": "Қулфи экран (Win+L). Дар тренажёр: Ctrl+L.",
        "description": "Амният ҳангоми дур шудан аз ПК.",
    },
    # ---- programmer-basics/screenshots ----
    "programmer-basics/screenshots/Meta+Shift+S": {
        "title": "Акси қисми экран",
        "action_prompt": "Акси қисми экранро гиред",
        "usage_example": "Қайчҳои Windows (Win+Shift+S). Дар тренажёр: Ctrl+Shift+S.",
        "description": "Хато ё қисми UI-ро ба ҳамкор фиристед.",
    },
    "programmer-basics/screenshots/PrintScreen": {
        "title": "Акси тамоми экран",
        "action_prompt": "Акси тамоми экранро гиред",
        "usage_example": "Тамоми экранро ба буфер нусха мекунад (Print Screen).",
        "description": "Скриншоти пурраи монитор.",
    },
    # ---- programmer-basics/clipboard ----
    "programmer-basics/clipboard/Meta+V": {
        "title": "Таърихи буфер",
        "action_prompt": "Таърихи буфери мубодиларо кушоед",
        "usage_example": "Журнали буфери Windows (Win+V). Дар тренажёр: Ctrl+V ҳамчун иваз барои машқи ишора.",
        "description": "Ба матни қаблан нусхабардоришуда баргардед.",
    },
    # ---- programmer-basics/practice ----
    "programmer-basics/practice/Control+C": {
        "title": "Машқ: нусхабардорӣ",
        "action_prompt": "Қисми интихобшударо нусхабардорӣ кунед",
        "usage_example": "Мустаҳкамкунӣ: Ctrl+C бе нигоҳ ба шпаргалка.",
        "description": "Санҷед, ки нусхабардорӣ то автоматизм расидааст.",
    },
    "programmer-basics/practice/Control+V": {
        "title": "Машқ: гузоштан",
        "action_prompt": "Нусхабардоришударо гузоред",
        "usage_example": "Мустаҳкамкунӣ: Ctrl+V.",
        "description": "Занҷираи Copy → Paste — маҳорати ҳаррӯза.",
    },
    "programmer-basics/practice/Control+S": {
        "title": "Машқ: захиракунӣ",
        "action_prompt": "Файлро захира кунед",
        "usage_example": "Мустаҳкамкунӣ: Ctrl+S — зуд-зуд захира кунед.",
        "description": "Рефлекс «тағйир додӣ — захира кардӣ».",
    },
    "programmer-basics/practice/Control+F": {
        "title": "Машқ: ҷустуҷӯ",
        "action_prompt": "Калимаи лозимиро ёбед",
        "usage_example": "Мустаҳкамкунӣ: Ctrl+F.",
        "description": "Ҷустуҷӯ ҳар рӯз дақиқаҳоро сарфа мекунад.",
    },
    "programmer-basics/practice/Control+A": {
        "title": "Машқ: ҳамаро интихоб",
        "action_prompt": "Тамоми матнро интихоб кунед",
        "usage_example": "Мустаҳкамкунӣ: Ctrl+A.",
        "description": "Пеш аз нусхабардорӣ ё несткунии оммавӣ.",
    },
    "programmer-basics/practice/Control+Z": {
        "title": "Машқ: бекоркунӣ",
        "action_prompt": "Амали хаторо бекор кунед",
        "usage_example": "Мустаҳкамкунӣ: Ctrl+Z.",
        "description": "Суғурта аз ҳама гуна таҳрирҳо.",
    },
    "programmer-basics/practice/End": {
        "title": "Машқ: охири сатр",
        "action_prompt": "Ба охири сатр гузаред",
        "usage_example": "Мустаҳкамкунӣ: End.",
        "description": "Навигатсия бе муш.",
    },
    "programmer-basics/practice/Control+P": {
        "title": "Машқ: файли зуд",
        "action_prompt": "Файлро аз рӯи ном зуд кушоед",
        "usage_example": "Мустаҳкамкунӣ: Ctrl+P дар муҳаррири код.",
        "description": "Тугмаи асосии IDE барои навигатсия.",
    },
    # ---- vscode/navigation ----
    "vscode/navigation/Control+P": {
        "title": "Кушодани зуди файл",
        "action_prompt": "Файлро аз рӯи ном кушоед",
        "usage_example": "Ctrl+P — палитраи файлҳо",
        "description": "Ctrl+P — палитраи файлҳо",
    },
    "vscode/navigation/Control+G": {
        "title": "Гузаштан ба сатр",
        "action_prompt": "Аз рӯи рақам ба сатр гузаред",
        "usage_example": "Ctrl+G",
        "description": "Ctrl+G",
    },
    "vscode/navigation/Control+Shift+O": {
        "title": "Гузаштан ба рамз",
        "action_prompt": "Рӯйхати рамзҳоро дар файл кушоед",
        "usage_example": "Ctrl+Shift+O",
        "description": "Ctrl+Shift+O",
    },
    "vscode/navigation/F12": {
        "title": "Гузаштан ба таъриф",
        "action_prompt": "Ба таърифи рамз гузаред",
        "usage_example": "F12",
        "description": "F12",
    },
    "vscode/navigation/Alt+ArrowLeft": {
        "title": "Бозгашт",
        "action_prompt": "Ба мавқеи қаблӣ баргардед",
        "usage_example": "Alt+←",
        "description": "Alt+←",
    },
    "vscode/navigation/Alt+ArrowRight": {
        "title": "Пешравӣ",
        "action_prompt": "Дар таърих пеш равед",
        "usage_example": "Alt+→",
        "description": "Alt+→",
    },
    "vscode/navigation/Control+Tab": {
        "title": "Иваз кардани варақа",
        "action_prompt": "Варақаи навбатии муҳаррир",
        "usage_example": "Ctrl+Tab",
        "description": "Ctrl+Tab",
    },
    "vscode/navigation/Control+W": {
        "title": "Пӯшидани варақа",
        "action_prompt": "Варақаи фаъолро пӯшед",
        "usage_example": "Ctrl+W",
        "description": "Ctrl+W",
    },
    "vscode/navigation/Control+Shift+E": {
        "title": "Гузаранда",
        "action_prompt": "Панели канории гузарандаро кушоед",
        "usage_example": "Ctrl+Shift+E",
        "description": "Ctrl+Shift+E",
    },
    "vscode/navigation/Control+Shift+F": {
        "title": "Ҷустуҷӯ дар лоиҳа",
        "action_prompt": "Ҷустуҷӯи глобалиро кушоед",
        "usage_example": "Ctrl+Shift+F",
        "description": "Ctrl+Shift+F",
    },
    # ---- vscode/editing ----
    "vscode/editing/Control+Slash": {
        "title": "Шарҳи сатр",
        "action_prompt": "Сатрро шарҳ кунед",
        "usage_example": "Ctrl+/",
        "description": "Ctrl+/",
    },
    "vscode/editing/Shift+Alt+A": {
        "title": "Шарҳи блокӣ",
        "action_prompt": "Шарҳи блокӣ",
        "usage_example": "Shift+Alt+A",
        "description": "Shift+Alt+A",
    },
    "vscode/editing/Shift+Alt+ArrowDown": {
        "title": "Такрор кардани сатр",
        "action_prompt": "Сатри ҷориро такрор кунед",
        "usage_example": "Shift+Alt+↓",
        "description": "Shift+Alt+↓",
    },
    "vscode/editing/Control+Shift+K": {
        "title": "Нест кардани сатр",
        "action_prompt": "Сатри ҷориро нест кунед",
        "usage_example": "Ctrl+Shift+K",
        "description": "Ctrl+Shift+K",
    },
    "vscode/editing/Alt+ArrowUp": {
        "title": "Кӯчонидани сатр боло",
        "action_prompt": "Сатрро боло кӯчонед",
        "usage_example": "Alt+↑",
        "description": "Alt+↑",
    },
    "vscode/editing/Alt+ArrowDown": {
        "title": "Кӯчонидани сатр поён",
        "action_prompt": "Сатрро поён кӯчонед",
        "usage_example": "Alt+↓",
        "description": "Alt+↓",
    },
    "vscode/editing/Control+D": {
        "title": "Интихоби мутобиқати навбатӣ",
        "action_prompt": "Мутобиқати навбатиро илова кунед",
        "usage_example": "Ctrl+D",
        "description": "Ctrl+D",
    },
    "vscode/editing/Control+Shift+L": {
        "title": "Интихоби ҳамаи мутобиқатҳо",
        "action_prompt": "Ҳамаи мутобиқатҳоро интихоб кунед",
        "usage_example": "Ctrl+Shift+L",
        "description": "Ctrl+Shift+L",
    },
    "vscode/editing/Control+Alt+ArrowDown": {
        "title": "Мультикурсор",
        "action_prompt": "Курсорро поён илова кунед",
        "usage_example": "Ctrl+Alt+↓",
        "description": "Ctrl+Alt+↓",
    },
    "vscode/editing/Control+Z": {
        "title": "Бекор кардан",
        "action_prompt": "Амали охиринро бекор кунед",
        "usage_example": "Ctrl+Z",
        "description": "Ctrl+Z",
    },
    "vscode/editing/Control+Y": {
        "title": "Такрор кардан",
        "action_prompt": "Бекоршударо такрор кунед",
        "usage_example": "Ctrl+Y",
        "description": "Ctrl+Y",
    },
    "vscode/editing/Shift+Alt+F": {
        "title": "Форматбандии ҳуҷҷат",
        "action_prompt": "Файлро формат бандед",
        "usage_example": "Shift+Alt+F",
        "description": "Shift+Alt+F",
    },
    # ---- vscode/files ----
    "vscode/files/Control+S": {
        "title": "Захира кардан",
        "action_prompt": "Файлро захира кунед",
        "usage_example": "Ctrl+S",
        "description": "Ctrl+S",
    },
    "vscode/files/Control+K+S": {
        "title": "Ҳамаро захира кардан",
        "action_prompt": "Ҳамаи файлҳоро захира кунед",
        "usage_example": "Ctrl+K S",
        "description": "Ctrl+K S",
    },
    "vscode/files/Control+N": {
        "title": "Файли нав",
        "action_prompt": "Файли нав эҷод кунед",
        "usage_example": "Ctrl+N",
        "description": "Ctrl+N",
    },
    "vscode/files/Control+W": {
        "title": "Пӯшидани муҳаррир",
        "action_prompt": "Муҳаррирро пӯшед",
        "usage_example": "Ctrl+W",
        "description": "Ctrl+W",
    },
    "vscode/files/F2": {
        "title": "Номивазкунӣ",
        "action_prompt": "Рамз/файлро номиваз кунед",
        "usage_example": "F2",
        "description": "F2",
    },
    # ---- vscode/search ----
    "vscode/search/Control+F": {
        "title": "Ёфтан",
        "action_prompt": "Ҷустуҷӯро дар файл кушоед",
        "usage_example": "Ctrl+F",
        "description": "Ctrl+F",
    },
    "vscode/search/Control+H": {
        "title": "Иваз кардан",
        "action_prompt": "Ивазкуниро кушоед",
        "usage_example": "Ctrl+H",
        "description": "Ctrl+H",
    },
    "vscode/search/Control+Shift+F": {
        "title": "Ёфтан дар лоиҳа",
        "action_prompt": "Ҷустуҷӯи глобалӣ",
        "usage_example": "Ctrl+Shift+F",
        "description": "Ctrl+Shift+F",
    },
    "vscode/search/F3": {
        "title": "Мутобиқати навбатӣ",
        "action_prompt": "Мутобиқати навбатӣ",
        "usage_example": "F3",
        "description": "F3",
    },
    "vscode/search/Shift+F3": {
        "title": "Мутобиқати қаблӣ",
        "action_prompt": "Мутобиқати қаблӣ",
        "usage_example": "Shift+F3",
        "description": "Shift+F3",
    },
    # ---- vscode/debug (first F5 wins: start debug) ----
    "vscode/debug/F5": {
        "title": "Оғози отладка",
        "action_prompt": "Отладкаро оғоз кунед",
        "usage_example": "F5",
        "description": "F5",
    },
    "vscode/debug/F10": {
        "title": "Қадам бо гузаштан",
        "action_prompt": "Step over",
        "usage_example": "F10",
        "description": "F10",
    },
    "vscode/debug/F11": {
        "title": "Қадам бо даромадан",
        "action_prompt": "Step into",
        "usage_example": "F11",
        "description": "F11",
    },
    "vscode/debug/F9": {
        "title": "Нуқтаи исто",
        "action_prompt": "Breakpoint-ро иваз кунед",
        "usage_example": "F9",
        "description": "F9",
    },
    # ---- vscode/terminal ----
    "vscode/terminal/Control+Backquote": {
        "title": "Терминал",
        "action_prompt": "Терминали дарунсохтро кушоед",
        "usage_example": "Ctrl+`",
        "description": "Ctrl+`",
    },
    "vscode/terminal/Control+Shift+Backquote": {
        "title": "Терминали нав",
        "action_prompt": "Терминали нав эҷод кунед",
        "usage_example": "Ctrl+Shift+`",
        "description": "Ctrl+Shift+`",
    },
    "vscode/terminal/Control+K": {
        "title": "Тоза кардани терминал",
        "action_prompt": "Баромади терминалро тоза кунед",
        "usage_example": "Ctrl+K дар терминал",
        "description": "Ctrl+K дар терминал",
    },
    # ---- vscode/git ----
    "vscode/git/Control+Shift+G": {
        "title": "Source Control",
        "action_prompt": "Панели Git-ро кушоед",
        "usage_example": "Ctrl+Shift+G",
        "description": "Ctrl+Shift+G",
    },
    # ---- windows named (first wins before bulk Ctrl+C etc.) ----
    "windows/basics/Control+C": {
        "title": "Нусхабардорӣ",
        "action_prompt": "Интихобро нусхабардорӣ кунед",
        "usage_example": "Win: Ctrl+C",
        "description": "Win: Ctrl+C",
    },
    "windows/basics/Control+V": {
        "title": "Гузоштан",
        "action_prompt": "Аз буфер гузоред",
        "usage_example": "Ctrl+V",
        "description": "Ctrl+V",
    },
    "windows/basics/Control+X": {
        "title": "Буридан",
        "action_prompt": "Интихобро буред",
        "usage_example": "Ctrl+X",
        "description": "Ctrl+X",
    },
    "windows/basics/Control+Z": {
        "title": "Бекор кардан",
        "action_prompt": "Амалро бекор кунед",
        "usage_example": "Ctrl+Z",
        "description": "Ctrl+Z",
    },
    "windows/basics/Control+Shift+Escape": {
        "title": "Мудири вазифаҳо",
        "action_prompt": "Мудири вазифаҳоро кушоед",
        "usage_example": "Ctrl+Shift+Esc",
        "description": "Ctrl+Shift+Esc",
    },
    "windows/basics/Meta+L": {
        "title": "Қулфкунӣ",
        "action_prompt": "Компютерро қулф кунед",
        "usage_example": "Win+L",
        "description": "Win+L",
    },
    "windows/basics/Alt+Tab": {
        "title": "Гузариш байни тирезаҳо",
        "action_prompt": "Тирезаро иваз кунед",
        "usage_example": "Alt+Tab",
        "description": "Alt+Tab",
    },
    "windows/basics/Meta+D": {
        "title": "Мизи корӣ",
        "action_prompt": "Ҳамаи тирезаҳоро печонед",
        "usage_example": "Win+D",
        "description": "Win+D",
    },
    "windows/basics/Meta+E": {
        "title": "Гузаранда",
        "action_prompt": "Гузарандаро кушоед",
        "usage_example": "Win+E",
        "description": "Win+E",
    },
    "windows/basics/Meta+I": {
        "title": "Параметрҳо",
        "action_prompt": "Параметрҳоро кушоед",
        "usage_example": "Win+I",
        "description": "Win+I",
    },
    "windows/basics/Meta+Shift+S": {
        "title": "Акси экран",
        "action_prompt": "Акси қисми экран",
        "usage_example": "Win+Shift+S",
        "description": "Win+Shift+S",
    },
    "windows/basics/Meta+S": {
        "title": "Ҷустуҷӯ",
        "action_prompt": "Ҷустуҷӯи Windows-ро кушоед",
        "usage_example": "Win+S",
        "description": "Win+S",
    },
    # ---- chrome named ----
    "chrome/tabs/Control+T": {
        "title": "Варақаи нав",
        "action_prompt": "Варақаи нав кушоед",
        "usage_example": "Ctrl+T",
        "description": "Ctrl+T",
    },
    "chrome/tabs/Control+W": {
        "title": "Пӯшидани варақа",
        "action_prompt": "Варақаро пӯшед",
        "usage_example": "Ctrl+W",
        "description": "Ctrl+W",
    },
    "chrome/tabs/Control+Shift+T": {
        "title": "Барқарор кардани варақа",
        "action_prompt": "Варақаи пӯшидаро барқарор кунед",
        "usage_example": "Ctrl+Shift+T",
        "description": "Ctrl+Shift+T",
    },
    "chrome/tabs/Control+L": {
        "title": "Сатри адрес",
        "action_prompt": "Фокус ба сатри адрес",
        "usage_example": "Ctrl+L",
        "description": "Ctrl+L",
    },
    "chrome/tabs/Control+R": {
        "title": "Навсозӣ",
        "action_prompt": "Саҳифаро навсозӣ кунед",
        "usage_example": "Ctrl+R",
        "description": "Ctrl+R",
    },
    "chrome/tabs/Control+Shift+R": {
        "title": "Навсозии сахт",
        "action_prompt": "Бе кэш навсозӣ кунед",
        "usage_example": "Ctrl+Shift+R",
        "description": "Ctrl+Shift+R",
    },
    "chrome/tabs/Control+H": {
        "title": "Таърих",
        "action_prompt": "Таърихро кушоед",
        "usage_example": "Ctrl+H",
        "description": "Ctrl+H",
    },
    "chrome/tabs/Control+J": {
        "title": "Боргириҳо",
        "action_prompt": "Боргириҳоро кушоед",
        "usage_example": "Ctrl+J",
        "description": "Ctrl+J",
    },
    "chrome/tabs/F12": {
        "title": "DevTools",
        "action_prompt": "Асбобҳои таҳиягарро кушоед",
        "usage_example": "F12",
        "description": "F12",
    },
    "chrome/tabs/Control+Shift+J": {
        "title": "Консол",
        "action_prompt": "Консолро кушоед",
        "usage_example": "Ctrl+Shift+J",
        "description": "Ctrl+Shift+J",
    },
    # ---- edge ----
    "edge/navigation/Control+T": {
        "title": "Варақаи нав",
        "action_prompt": "Варақаи нав кушоед",
        "usage_example": "Ctrl+T",
        "description": "Ctrl+T",
    },
    "edge/navigation/Control+W": {
        "title": "Пӯшидани варақа",
        "action_prompt": "Варақаро пӯшед",
        "usage_example": "Ctrl+W",
        "description": "Ctrl+W",
    },
    "edge/navigation/Control+Shift+T": {
        "title": "Барқарор кардани варақа",
        "action_prompt": "Варақаи пӯшидаро барқарор кунед",
        "usage_example": "Ctrl+Shift+T",
        "description": "Ctrl+Shift+T",
    },
    "edge/navigation/Control+L": {
        "title": "Сатри адрес",
        "action_prompt": "Фокус ба сатри адрес",
        "usage_example": "Ctrl+L",
        "description": "Ctrl+L",
    },
    "edge/navigation/Control+R": {
        "title": "Навсозӣ",
        "action_prompt": "Саҳифаро навсозӣ кунед",
        "usage_example": "Ctrl+R",
        "description": "Ctrl+R",
    },
    "edge/navigation/Control+Shift+R": {
        "title": "Навсозии сахт",
        "action_prompt": "Бе кэш навсозӣ кунед",
        "usage_example": "Ctrl+Shift+R",
        "description": "Ctrl+Shift+R",
    },
    "edge/navigation/Control+H": {
        "title": "Таърих",
        "action_prompt": "Таърихро кушоед",
        "usage_example": "Ctrl+H",
        "description": "Ctrl+H",
    },
    "edge/navigation/Control+J": {
        "title": "Боргириҳо",
        "action_prompt": "Боргириҳоро кушоед",
        "usage_example": "Ctrl+J",
        "description": "Ctrl+J",
    },
    # ---- cursor ----
    "cursor/ai/Control+Shift+P": {
        "title": "Command Palette",
        "action_prompt": "Палитраи фармонҳоро кушоед",
        "usage_example": "Ctrl+Shift+P",
        "description": "Ctrl+Shift+P",
    },
    "cursor/ai/Control+L": {
        "title": "AI Chat",
        "action_prompt": "Чати Cursor-ро кушоед",
        "usage_example": "Ctrl+L",
        "description": "Ctrl+L",
    },
    "cursor/ai/Control+K": {
        "title": "Inline Edit",
        "action_prompt": "Таҳрири Inline",
        "usage_example": "Ctrl+K",
        "description": "Ctrl+K",
    },
    "cursor/ai/Control+I": {
        "title": "Composer",
        "action_prompt": "Composer",
        "usage_example": "Ctrl+I",
        "description": "Ctrl+I",
    },
    "cursor/ai/Control+Backquote": {
        "title": "Terminal",
        "action_prompt": "Терминал",
        "usage_example": "Ctrl+`",
        "description": "Ctrl+`",
    },
    "cursor/ai/Control+Slash": {
        "title": "Шарҳи сатр",
        "action_prompt": "Сатрро шарҳ кунед",
        "usage_example": "Ctrl+/",
        "description": "Ctrl+/",
    },
    "cursor/ai/Shift+Alt+A": {
        "title": "Шарҳи блокӣ",
        "action_prompt": "Шарҳи блокӣ",
        "usage_example": "Shift+Alt+A",
        "description": "Shift+Alt+A",
    },
    "cursor/ai/Shift+Alt+ArrowDown": {
        "title": "Такрор кардани сатр",
        "action_prompt": "Сатри ҷориро такрор кунед",
        "usage_example": "Shift+Alt+↓",
        "description": "Shift+Alt+↓",
    },
    "cursor/ai/Control+Shift+K": {
        "title": "Нест кардани сатр",
        "action_prompt": "Сатри ҷориро нест кунед",
        "usage_example": "Ctrl+Shift+K",
        "description": "Ctrl+Shift+K",
    },
    "cursor/ai/Alt+ArrowUp": {
        "title": "Кӯчонидани сатр боло",
        "action_prompt": "Сатрро боло кӯчонед",
        "usage_example": "Alt+↑",
        "description": "Alt+↑",
    },
    # ---- git (first Control+Shift+G) ----
    "git/workflow/Control+Shift+G": {
        "title": "Ҳолат",
        "action_prompt": "git status (дар терминал)",
        "usage_example": "Аксар дар IDE",
        "description": "Аксар дар IDE",
    },
    # ---- visual-studio ----
    "visual-studio/ide/Control+N": {
        "title": "Ҷустуҷӯи класс",
        "action_prompt": "Классро ёбед",
        "usage_example": "VS: Классро ёбед",
        "description": "VS: Классро ёбед",
    },
    "visual-studio/ide/Shift+F6": {
        "title": "Рефакторинг",
        "action_prompt": "Номиваз кунед",
        "usage_example": "VS: Номиваз кунед",
        "description": "VS: Номиваз кунед",
    },
    "visual-studio/ide/Control+Alt+L": {
        "title": "Форматбандӣ",
        "action_prompt": "Кодро формат бандед",
        "usage_example": "VS: Кодро формат бандед",
        "description": "VS: Кодро формат бандед",
    },
    "visual-studio/ide/Control+Slash": {
        "title": "Шарҳ",
        "action_prompt": "Сатрро шарҳ кунед",
        "usage_example": "VS: Сатрро шарҳ кунед",
        "description": "VS: Сатрро шарҳ кунед",
    },
    "visual-studio/ide/Shift+F10": {
        "title": "Иҷро",
        "action_prompt": "Конфигурацияро иҷро кунед",
        "usage_example": "VS: Конфигурацияро иҷро кунед",
        "description": "VS: Конфигурацияро иҷро кунед",
    },
    "visual-studio/ide/Shift+F9": {
        "title": "Отладка",
        "action_prompt": "Отладка",
        "usage_example": "VS: Отладка",
        "description": "VS: Отладка",
    },
    # ---- word ----
    "word/formatting/Control+S": {
        "title": "Захира кардан",
        "action_prompt": "Ҳуҷҷатро захира кунед",
        "usage_example": "Word: Ҳуҷҷатро захира кунед",
        "description": "Word: Ҳуҷҷатро захира кунед",
    },
    "word/formatting/Control+B": {
        "title": "Ғафс",
        "action_prompt": "Матнро ғафс кунед",
        "usage_example": "Word: Матнро ғафс кунед",
        "description": "Word: Матнро ғафс кунед",
    },
    "word/formatting/Control+I": {
        "title": "Курсив",
        "action_prompt": "Матнро курсив кунед",
        "usage_example": "Word: Матнро курсив кунед",
        "description": "Word: Матнро курсив кунед",
    },
    "word/formatting/Control+U": {
        "title": "Зери хат",
        "action_prompt": "Матнро зери хат кунед",
        "usage_example": "Word: Матнро зери хат кунед",
        "description": "Word: Матнро зери хат кунед",
    },
    "word/formatting/Control+F": {
        "title": "Ёфтан",
        "action_prompt": "Ҷустуҷӯро кушоед",
        "usage_example": "Word: Ҷустуҷӯро кушоед",
        "description": "Word: Ҷустуҷӯро кушоед",
    },
    "word/formatting/Control+H": {
        "title": "Иваз кардан",
        "action_prompt": "Ивазкуниро кушоед",
        "usage_example": "Word: Ивазкуниро кушоед",
        "description": "Word: Ивазкуниро кушоед",
    },
    "word/formatting/Control+P": {
        "title": "Чоп",
        "action_prompt": "Чопро кушоед",
        "usage_example": "Word: Чопро кушоед",
        "description": "Word: Чопро кушоед",
    },
    "word/formatting/Control+Z": {
        "title": "Бекор кардан",
        "action_prompt": "Амалро бекор кунед",
        "usage_example": "Word: Амалро бекор кунед",
        "description": "Word: Амалро бекор кунед",
    },
    # ---- excel ----
    "excel/sheets/Control+S": {
        "title": "Захира кардан",
        "action_prompt": "Ҳуҷҷатро захира кунед",
        "usage_example": "Excel: Ҳуҷҷатро захира кунед",
        "description": "Excel: Ҳуҷҷатро захира кунед",
    },
    "excel/sheets/Control+B": {
        "title": "Ғафс",
        "action_prompt": "Матнро ғафс кунед",
        "usage_example": "Excel: Матнро ғафс кунед",
        "description": "Excel: Матнро ғафс кунед",
    },
    "excel/sheets/Control+I": {
        "title": "Курсив",
        "action_prompt": "Матнро курсив кунед",
        "usage_example": "Excel: Матнро курсив кунед",
        "description": "Excel: Матнро курсив кунед",
    },
    "excel/sheets/Control+U": {
        "title": "Зери хат",
        "action_prompt": "Матнро зери хат кунед",
        "usage_example": "Excel: Матнро зери хат кунед",
        "description": "Excel: Матнро зери хат кунед",
    },
    "excel/sheets/Control+F": {
        "title": "Ёфтан",
        "action_prompt": "Ҷустуҷӯро кушоед",
        "usage_example": "Excel: Ҷустуҷӯро кушоед",
        "description": "Excel: Ҷустуҷӯро кушоед",
    },
    "excel/sheets/Control+H": {
        "title": "Иваз кардан",
        "action_prompt": "Ивазкуниро кушоед",
        "usage_example": "Excel: Ивазкуниро кушоед",
        "description": "Excel: Ивазкуниро кушоед",
    },
    "excel/sheets/Control+P": {
        "title": "Чоп",
        "action_prompt": "Чопро кушоед",
        "usage_example": "Excel: Чопро кушоед",
        "description": "Excel: Чопро кушоед",
    },
    "excel/sheets/Control+Z": {
        "title": "Бекор кардан",
        "action_prompt": "Амалро бекор кунед",
        "usage_example": "Excel: Амалро бекор кунед",
        "description": "Excel: Амалро бекор кунед",
    },
    "excel/sheets/Control+Shift+U": {
        "title": "Формула",
        "action_prompt": "Формуларо гузоред",
        "usage_example": "Excel: Формуларо гузоред",
        "description": "Excel: Формуларо гузоред",
    },
    # ---- powerpoint ----
    "powerpoint/slides/Control+S": {
        "title": "Захира кардан",
        "action_prompt": "Ҳуҷҷатро захира кунед",
        "usage_example": "PowerPoint: Ҳуҷҷатро захира кунед",
        "description": "PowerPoint: Ҳуҷҷатро захира кунед",
    },
    "powerpoint/slides/Control+B": {
        "title": "Ғафс",
        "action_prompt": "Матнро ғафс кунед",
        "usage_example": "PowerPoint: Матнро ғафс кунед",
        "description": "PowerPoint: Матнро ғафс кунед",
    },
    "powerpoint/slides/Control+I": {
        "title": "Курсив",
        "action_prompt": "Матнро курсив кунед",
        "usage_example": "PowerPoint: Матнро курсив кунед",
        "description": "PowerPoint: Матнро курсив кунед",
    },
    "powerpoint/slides/Control+U": {
        "title": "Зери хат",
        "action_prompt": "Матнро зери хат кунед",
        "usage_example": "PowerPoint: Матнро зери хат кунед",
        "description": "PowerPoint: Матнро зери хат кунед",
    },
    "powerpoint/slides/Control+F": {
        "title": "Ёфтан",
        "action_prompt": "Ҷустуҷӯро кушоед",
        "usage_example": "PowerPoint: Ҷустуҷӯро кушоед",
        "description": "PowerPoint: Ҷустуҷӯро кушоед",
    },
    "powerpoint/slides/Control+H": {
        "title": "Иваз кардан",
        "action_prompt": "Ивазкуниро кушоед",
        "usage_example": "PowerPoint: Ивазкуниро кушоед",
        "description": "PowerPoint: Ивазкуниро кушоед",
    },
    "powerpoint/slides/Control+P": {
        "title": "Чоп",
        "action_prompt": "Чопро кушоед",
        "usage_example": "PowerPoint: Чопро кушоед",
        "description": "PowerPoint: Чопро кушоед",
    },
    "powerpoint/slides/Control+Z": {
        "title": "Бекор кардан",
        "action_prompt": "Амалро бекор кунед",
        "usage_example": "PowerPoint: Амалро бекор кунед",
        "description": "PowerPoint: Амалро бекор кунед",
    },
    # ---- photoshop ----
    "photoshop/layers/Control+Z": {
        "title": "Undo",
        "action_prompt": "Бекор кардан",
        "usage_example": "Photoshop: Бекор кардан",
        "description": "Photoshop: Бекор кардан",
    },
    "photoshop/layers/Control+S": {
        "title": "Save",
        "action_prompt": "Захира кардан",
        "usage_example": "Photoshop: Захира кардан",
        "description": "Photoshop: Захира кардан",
    },
    "photoshop/layers/Control+T": {
        "title": "Free Transform",
        "action_prompt": "Free Transform",
        "usage_example": "Photoshop: Free Transform",
        "description": "Photoshop: Free Transform",
    },
    "photoshop/layers/Control+Shift+N": {
        "title": "New Layer",
        "action_prompt": "Қабати нав",
        "usage_example": "Photoshop: Қабати нав",
        "description": "Photoshop: Қабати нав",
    },
    # ---- figma ----
    "figma/design/V": {
        "title": "Move",
        "action_prompt": "Move tool",
        "usage_example": "Figma: Move tool",
        "description": "Figma: Move tool",
    },
    "figma/design/F": {
        "title": "Frame",
        "action_prompt": "Frame tool",
        "usage_example": "Figma: Frame tool",
        "description": "Figma: Frame tool",
    },
    "figma/design/P": {
        "title": "Pen",
        "action_prompt": "Pen tool",
        "usage_example": "Figma: Pen tool",
        "description": "Figma: Pen tool",
    },
    "figma/design/Control+Alt+K": {
        "title": "Components",
        "action_prompt": "Components",
        "usage_example": "Figma: Components",
        "description": "Figma: Components",
    },
    # ---- intellij ----
    "intellij/java/Control+N": {
        "title": "Ҷустуҷӯи класс",
        "action_prompt": "Классро ёбед",
        "usage_example": "IntelliJ: Классро ёбед",
        "description": "IntelliJ: Классро ёбед",
    },
    "intellij/java/Shift+F6": {
        "title": "Рефакторинг",
        "action_prompt": "Номиваз кунед",
        "usage_example": "IntelliJ: Номиваз кунед",
        "description": "IntelliJ: Номиваз кунед",
    },
    "intellij/java/Control+Alt+L": {
        "title": "Форматбандӣ",
        "action_prompt": "Кодро формат бандед",
        "usage_example": "IntelliJ: Кодро формат бандед",
        "description": "IntelliJ: Кодро формат бандед",
    },
    "intellij/java/Control+Slash": {
        "title": "Шарҳ",
        "action_prompt": "Сатрро шарҳ кунед",
        "usage_example": "IntelliJ: Сатрро шарҳ кунед",
        "description": "IntelliJ: Сатрро шарҳ кунед",
    },
    "intellij/java/Shift+F10": {
        "title": "Иҷро",
        "action_prompt": "Конфигурацияро иҷро кунед",
        "usage_example": "IntelliJ: Конфигурацияро иҷро кунед",
        "description": "IntelliJ: Конфигурацияро иҷро кунед",
    },
    "intellij/java/Shift+F9": {
        "title": "Отладка",
        "action_prompt": "Отладка",
        "usage_example": "IntelliJ: Отладка",
        "description": "IntelliJ: Отладка",
    },
    # ---- pycharm ----
    "pycharm/python/Control+N": {
        "title": "Ҷустуҷӯи класс",
        "action_prompt": "Классро ёбед",
        "usage_example": "PyCharm: Классро ёбед",
        "description": "PyCharm: Классро ёбед",
    },
    "pycharm/python/Shift+F6": {
        "title": "Рефакторинг",
        "action_prompt": "Номиваз кунед",
        "usage_example": "PyCharm: Номиваз кунед",
        "description": "PyCharm: Номиваз кунед",
    },
    "pycharm/python/Control+Alt+L": {
        "title": "Форматбандӣ",
        "action_prompt": "Кодро формат бандед",
        "usage_example": "PyCharm: Кодро формат бандед",
        "description": "PyCharm: Кодро формат бандед",
    },
    "pycharm/python/Control+Slash": {
        "title": "Шарҳ",
        "action_prompt": "Сатрро шарҳ кунед",
        "usage_example": "PyCharm: Сатрро шарҳ кунед",
        "description": "PyCharm: Сатрро шарҳ кунед",
    },
    "pycharm/python/Shift+F10": {
        "title": "Иҷро",
        "action_prompt": "Конфигурацияро иҷро кунед",
        "usage_example": "PyCharm: Конфигурацияро иҷро кунед",
        "description": "PyCharm: Конфигурацияро иҷро кунед",
    },
    "pycharm/python/Shift+F9": {
        "title": "Отладка",
        "action_prompt": "Отладка",
        "usage_example": "PyCharm: Отладка",
        "description": "PyCharm: Отладка",
    },
    # ---- github-desktop ----
    "github-desktop/desktop/Control+Shift+G": {
        "title": "Ҳолат",
        "action_prompt": "git status (дар терминал)",
        "usage_example": "Аксар дар IDE",
        "description": "Аксар дар IDE",
    },
    "github-desktop/desktop/Control+Shift+F": {
        "title": "Fetch",
        "action_prompt": "Fetch origin",
        "usage_example": "GH Desktop: Fetch origin",
        "description": "GH Desktop: Fetch origin",
    },
    # ---- terminal ----
    "terminal/shell/Control+Alt+T": {
        "title": "Терминал",
        "action_prompt": "Терминалро кушоед",
        "usage_example": "Terminal: Терминалро кушоед",
        "description": "Terminal: Терминалро кушоед",
    },
    "terminal/shell/Alt+Tab": {
        "title": "Гузариш",
        "action_prompt": "Тирезаро иваз кунед",
        "usage_example": "Terminal: Тирезаро иваз кунед",
        "description": "Terminal: Тирезаро иваз кунед",
    },
    "terminal/shell/Control+L": {
        "title": "Clear",
        "action_prompt": "Экранро тоза кунед",
        "usage_example": "Terminal: Экранро тоза кунед",
        "description": "Terminal: Экранро тоза кунед",
    },
    # ---- linux ----
    "linux/desktop/Control+Alt+T": {
        "title": "Терминал",
        "action_prompt": "Терминалро кушоед",
        "usage_example": "Linux: Терминалро кушоед",
        "description": "Linux: Терминалро кушоед",
    },
    "linux/desktop/Alt+Tab": {
        "title": "Гузариш",
        "action_prompt": "Тирезаро иваз кунед",
        "usage_example": "Linux: Тирезаро иваз кунед",
        "description": "Linux: Тирезаро иваз кунед",
    },
    # ---- macos ----
    "macos/system/Meta+C": {
        "title": "Нусхабардорӣ",
        "action_prompt": "Нусхабардорӣ кунед",
        "usage_example": "macOS: Нусхабардорӣ кунед",
        "description": "macOS: Нусхабардорӣ кунед",
    },
    "macos/system/Meta+V": {
        "title": "Гузоштан",
        "action_prompt": "Гузоред",
        "usage_example": "macOS: Гузоред",
        "description": "macOS: Гузоред",
    },
    "macos/system/Meta+Space": {
        "title": "Spotlight",
        "action_prompt": "Spotlight",
        "usage_example": "macOS: Spotlight",
        "description": "macOS: Spotlight",
    },
    "macos/system/Meta+Q": {
        "title": "Quit",
        "action_prompt": "Барномаро пӯшед",
        "usage_example": "macOS: Барномаро пӯшед",
        "description": "macOS: Барномаро пӯшед",
    },
}


def pretty_combo(keys: list[str]) -> str:
    mapping = {
        "Control": "Ctrl",
        "Meta": "Win",
        "ArrowLeft": "←",
        "ArrowRight": "→",
        "ArrowUp": "↑",
        "ArrowDown": "↓",
        "Backquote": "`",
        "Slash": "/",
        "Escape": "Esc",
        "Backspace": "Backspace",
        "Delete": "Delete",
        "PrintScreen": "Print Screen",
    }
    return "+".join(mapping.get(k, k) for k in keys)


def looks_like_shortcut_label(title: str) -> bool:
    t = title.strip()
    if re.fullmatch(r"F\d{1,2}", t):
        return True
    if t.startswith("Chrome "):
        return True
    if re.fullmatch(r"(Ctrl|Control|Alt|Shift|Win|Meta|Cmd|Command)([+ ].+)?", t, re.I):
        return True
    if re.fullmatch(r"(Ctrl|Alt|Shift|Win)\+[A-Za-z0-9+]+", t):
        return True
    return False


def translate_bulk(course: str, keys: list[str], title: str, action: str, usage: str, desc: str) -> dict[str, str] | None:
    combo = pretty_combo(keys)
    # VS Code panel Ctrl+0..9
    if course == "vscode" and re.fullmatch(r"Ctrl\+\d", combo):
        return {
            "title": combo,
            "action_prompt": f"Панел: {combo}",
            "usage_example": f"VS Code — {combo}",
            "description": f"VS Code — {combo}",
        }
    # Chrome tab switch Ctrl+1..9
    if course == "chrome" and re.fullmatch(r"Ctrl\+\d", combo) and "вкладк" in action.lower():
        n = combo.split("+")[-1]
        return {
            "title": f"Гузаштан ба варақаи {n}",
            "action_prompt": f"Ба варақаи {n} гузаред",
            "usage_example": f"{combo} дар Chrome",
            "description": f"{combo} дар Chrome",
        }
    # Chrome Ctrl+Alt+X bulk
    if course == "chrome" and title.startswith("Chrome "):
        return {
            "title": f"Chrome {combo}",
            "action_prompt": f"Омезиш {combo}",
            "usage_example": "Омезишҳои васеъи Chrome",
            "description": "Омезишҳои васеъи Chrome",
        }
    # Windows F-keys
    if course == "windows" and re.fullmatch(r"F\d{1,2}", combo):
        return {
            "title": combo,
            "action_prompt": f"{combo}-ро пахш кунед",
            "usage_example": f"Тугмаи функсионалии {combo}",
            "description": f"Тугмаи функсионалии {combo}",
        }
    # Windows bulk Ctrl / Ctrl+Shift labels
    if course == "windows" and looks_like_shortcut_label(title):
        if title.startswith("Ctrl+Shift+") or combo.startswith("Ctrl+Shift+"):
            return {
                "title": combo,
                "action_prompt": f"{combo}-ро пахш кунед",
                "usage_example": combo,
                "description": combo,
            }
        if title.startswith("Ctrl+") or combo.startswith("Ctrl+"):
            return {
                "title": combo,
                "action_prompt": f"{combo}-ро пахш кунед",
                "usage_example": f"Омезиши системавии {combo}",
                "description": f"Омезиши системавии {combo}",
            }
        return {
            "title": combo,
            "action_prompt": f"{combo}-ро пахш кунед",
            "usage_example": combo,
            "description": combo,
        }
    return None


def ts_escape(s: str) -> str:
    return s.replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n")


def emit_ts(courses: dict, categories: dict, lessons: dict) -> str:
    lines = [
        "export type ContentLessonTg = {",
        "  title: string",
        "  action_prompt: string",
        "  usage_example: string",
        "  description: string",
        "}",
        "",
        "export type ContentCatalogTg = {",
        "  courses: Record<string, { title: string; description: string }>",
        "  categories: Record<string, string> // key: `${courseSlug}/${categorySlug}`",
        "  lessons: Record<string, ContentLessonTg> // key: `${courseSlug}/${categorySlug}/${keys.join('+')}`",
        "}",
        "",
        "export const contentTg: ContentCatalogTg = {",
        "  courses: {",
    ]
    for slug, c in courses.items():
        lines.append(f"    '{slug}': {{")
        lines.append(f"      title: '{ts_escape(c['title'])}',")
        lines.append(f"      description: '{ts_escape(c['description'])}',")
        lines.append("    },")
    lines.append("  },")
    lines.append("  categories: {")
    for key, title in categories.items():
        lines.append(f"    '{key}': '{ts_escape(title)}',")
    lines.append("  },")
    lines.append("  lessons: {")
    for key, les in lessons.items():
        lines.append(f"    '{key}': {{")
        lines.append(f"      title: '{ts_escape(les['title'])}',")
        lines.append(f"      action_prompt: '{ts_escape(les['action_prompt'])}',")
        lines.append(f"      usage_example: '{ts_escape(les['usage_example'])}',")
        lines.append(f"      description: '{ts_escape(les['description'])}',")
        lines.append("    },")
    lines.append("  },")
    lines.append("}")
    lines.append("")
    return "\n".join(lines)


def main() -> None:
    dump = json.loads(DUMP.read_text(encoding="utf-8"))

    courses_out: dict[str, dict[str, str]] = {}
    categories_out: dict[str, str] = {}
    lessons_out: dict[str, dict[str, str]] = {}

    missing_courses = []
    missing_cats = []
    missing_lessons = []
    dump_lesson_count = 0
    dump_keys_ordered: list[str] = []

    for c in dump:
        slug = c["slug"]
        if slug not in COURSES:
            missing_courses.append(slug)
            courses_out[slug] = {"title": c["title"], "description": c["description"]}
        else:
            courses_out[slug] = COURSES[slug]

        for cat in c["categories"]:
            cat_key = f"{slug}/{cat['slug']}"
            if cat_key not in CATEGORIES:
                missing_cats.append(cat_key)
                categories_out[cat_key] = cat["title"]
            else:
                categories_out[cat_key] = CATEGORIES[cat_key]

            for les in cat["lessons"]:
                dump_lesson_count += 1
                key = f"{slug}/{cat['slug']}/{'+'.join(les['keys'])}"
                dump_keys_ordered.append(key)

                if key in lessons_out:
                    # Duplicate key in dump — keep first (already filled)
                    continue

                if key in LESSONS:
                    lessons_out[key] = LESSONS[key]
                    continue

                bulk = translate_bulk(
                    slug,
                    les["keys"],
                    les["title"],
                    les["action_prompt"],
                    les["usage_example"],
                    les["description"],
                )
                if bulk:
                    lessons_out[key] = bulk
                    continue

                missing_lessons.append(key)
                # Fallback: keep product-ish labels, mark so we notice
                lessons_out[key] = {
                    "title": les["title"],
                    "action_prompt": les["action_prompt"],
                    "usage_example": les["usage_example"],
                    "description": les["description"],
                }

    OUT.write_text(emit_ts(courses_out, categories_out, lessons_out), encoding="utf-8")

    unique_dump = len(set(dump_keys_ordered))
    report = [
        f"dump_lessons={dump_lesson_count}",
        f"unique_dump_keys={unique_dump}",
        f"contentTg_lesson_keys={len(lessons_out)}",
        f"courses={len(courses_out)} cats={len(categories_out)}",
        f"missing_courses={missing_courses}",
        f"missing_cats={missing_cats}",
        f"missing_lessons_count={len(missing_lessons)}",
    ]
    if missing_lessons:
        report.append("MISSING:")
        report.extend(missing_lessons)
    (HERE / "_gen_report.txt").write_text("\n".join(report), encoding="utf-8")
    print("\n".join(report[:8]))
    if missing_lessons:
        print("WARNING: untranslated fallbacks:", len(missing_lessons))
    if len(lessons_out) != unique_dump:
        raise ValueError(f"lesson count mismatch: {len(lessons_out)} vs {unique_dump}")
    if missing_courses:
        raise ValueError(f"missing courses: {missing_courses}")
    if missing_cats:
        raise ValueError(f"missing categories: {missing_cats}")
    if missing_lessons:
        raise ValueError(f"missing lessons: {missing_lessons[:20]}")
    print("OK wrote", OUT)


if __name__ == "__main__":
    main()
