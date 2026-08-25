import type { Locale } from '@/shared/i18n/types';
import type { Task } from '@/features/bolt-desktop/simulator/engine/TaskEngine';
import { tasks as baseTasks } from '@/features/bolt-desktop/simulator/engine/TaskEngine';

type TaskCopy = { title: string; description: string; hint: string };

const ru: Record<number, TaskCopy> = {
  1: {
    title: 'Создайте папку «Practice»',
    description: 'Щёлкните правой кнопкой по фону рабочего стола → «Новая папка». Или дважды щёлкните «Этот компьютер» и создайте папку в проводнике.',
    hint: 'Правый клик по пустому месту на обоях (не по панели браузера). Альтернатива: «Этот компьютер» → правый клик в пустой области → «Новая папка». Горячие клавиши: Ctrl+Shift+N.',
  },
  2: {
    title: 'Создайте файл «notes.txt»',
    description: 'Создайте на рабочем столе текстовый файл notes.txt.',
    hint: 'Правый клик по пустому месту → «Новый файл», введите notes.txt.',
  },
  3: {
    title: 'Переименуйте notes.txt в my-notes.txt',
    description: 'Выделите notes.txt, нажмите F2 (или правый клик → Переименовать) и задайте имя my-notes.txt.',
    hint: 'Правый клик по notes.txt → «Переименовать» или выделите файл и нажмите F2.',
  },
  4: {
    title: 'Создайте папку «Projects»',
    description: 'Создайте папку Projects на рабочем столе (в боковой панели проводника библиотека с таким именем не засчитывается).',
    hint: 'Правый клик по пустому месту на рабочем столе → «Новая папка» → имя Projects.',
  },
  5: {
    title: 'Переместите my-notes.txt в Projects',
    description: 'Вырежьте my-notes.txt и вставьте его в папку Projects.',
    hint: 'Правый клик по my-notes.txt → «Вырезать». Откройте Projects, правый клик по пустому месту → «Вставить».',
  },
  6: {
    title: 'Скопируйте файл',
    description: 'Скопируйте любой файл и вставьте копию (появится второй файл, например «notes 2.txt»).',
    hint: 'Правый клик по файлу → «Копировать», затем правый клик по пустому месту → «Вставить».',
  },
  7: {
    title: 'Удалите файл',
    description: 'Удалите любой файл — он должен попасть в корзину.',
    hint: 'Выделите файл и нажмите Delete или правый клик → «Удалить».',
  },
  8: {
    title: 'Восстановите файл из корзины',
    description: 'Откройте корзину, щёлкните правой кнопкой по удалённому файлу и восстановите его.',
    hint: 'Откройте «Этот компьютер» или «Корзина», правый клик по файлу → «Восстановить».',
  },  9: {
    title: 'Создайте ZIP из файла',
    description: 'Щёлкните правой кнопкой по любому файлу и выберите «Сжать в ZIP».',
    hint: 'Правый клик по файлу (например .txt) → «Сжать в ZIP».',
  },
  10: {
    title: 'Распакуйте ZIP',
    description: 'Щёлкните правой кнопкой по файлу .zip и выберите «Извлечь сюда».',
    hint: 'Найдите созданный .zip, правый клик → «Извлечь сюда».',
  },
  11: {
    title: 'Структура Website',
    description: 'На рабочем столе создайте папку «Website», внутри — три подпапки: html, css и js.',
    hint: 'Создайте Website на рабочем столе, откройте её и добавьте папки html, css и js.',
  },
  12: {
    title: 'Создайте index.html в html',
    description: 'В папке Website/html создайте файл index.html.',
    hint: 'Откройте Website → html, правый клик → «Новый файл», имя index.html.',
  },
};

const tg: Record<number, TaskCopy> = {
  1: {
    title: 'Папка «Practice» эҷод кунед',
    description: 'Ба фони рабочий стол клики рост → «Новая папка». Ё два бор «Файлҳо»-ро клик кунед ва дар равандни файл папка созед.',
    hint: 'Клики рост дар ҷои холии обои (на менюи браузер). Ё «Файлҳо» → клики рост → «Новая папка». Ctrl+Shift+N.',
  },
  2: {
    title: 'Файли «notes.txt» эҷод кунед',
    description: 'Дар рабочий стол файли матнии notes.txt созед.',
    hint: 'Клики рост → «Файли нав», notes.txt нависед.',
  },
  3: {
    title: 'notes.txt-ро ба my-notes.txt иваз ном кунед',
    description: 'notes.txt-ро интихоб кунед, F2 (ё клики рост → Ивази ном) ва номи my-notes.txt гузоред.',
    hint: 'Клики рост ба notes.txt → «Ивази ном» ё F2.',
  },
  4: {
    title: 'Папка «Projects» эҷод кунед',
    description: 'Дар рабочий стол папка Projects эҷод кунед (китобхонаи ҳамном дар панели чап ҳисоб намешавад).',
    hint: 'Клики рост дар ҷои холии рабочий стол → «Новая папка» → номи Projects.',
  },
  5: {
    title: 'my-notes.txt-ро ба Projects кӯчонед',
    description: 'my-notes.txt-ро бурид ва дар дохили Projects гузоред.',
    hint: 'Клики рост → «Буридан». Projects-ро кушоед, клики рост → «Гузоштан».',
  },
  6: {
    title: 'Файлро нусха баред',
    description: 'Як файли дилхоҳро нусха кунед ва гузоред (файли дуюм пайдо мешавад, масалан «notes 2.txt»).',
    hint: 'Клики рост → «Нусха», сипас клики рост ба ҷои холӣ → «Гузоштан».',
  },
  7: {
    title: 'Файлро нест кунед',
    description: 'Як файли дилхоҳро нест кунед — бояд ба сабад биравад.',
    hint: 'Файлро интихоб карда Delete пахш кунед ё клики рост → «Нест кардан».',
  },
  8: {
    title: 'Файлро аз сабад баргардонед',
    description: 'Сабадро кушоед, ба файли нестшуда клики рост кунед ва барқарор кунед.',
    hint: '«Файлҳо» → «Сабад», клики рост → «Барқарорсозӣ».',
  },
  9: {
    title: 'Аз файла ZIP созед',
    description: 'Ба файли дилхоҳ клики рост кунед ва «Фишурда ба ZIP»-ро интихоб кунед.',
    hint: 'Клики рост ба файли .txt → «Фишурда ба ZIP».',
  },
  10: {
    title: 'ZIP-ро кушоед',
    description: 'Ба файли .zip клики рост кунед ва «Инҷо кушоед»-ро интихоб кунед.',
    hint: 'Файли .zip-и эҷодшударо ёбед, клики рост → «Инҷо кушоед».',
  },
  11: {
    title: 'Сохтори Website',
    description: 'Дар рабочий стол «Website» созед, дар дохили он html, css ва js.',
    hint: 'Website дар рабочий стол, баъд html, css, js.',
  },
  12: {
    title: 'index.html дар html',
    description: 'Дар Website/html файли index.html эҷод кунед.',
    hint: 'Website → html, клики рост → «Файли нав», index.html.',
  },
};

const catalogs: Record<Locale, Record<number, TaskCopy>> = { ru, tg };

export function getLocalizedDesktopTasks(locale: Locale): Task[] {
  const copy = catalogs[locale];
  return baseTasks.map((task) => {
    const c = copy[task.id];
    if (!c) return task;
    return { ...task, title: c.title, description: c.description, hint: c.hint };
  });
}
