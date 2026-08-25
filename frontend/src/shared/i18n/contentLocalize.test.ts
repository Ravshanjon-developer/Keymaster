import { afterEach, describe, expect, it } from 'vitest'

import { localizeLesson } from './contentLocalize'
import { useLocaleStore } from './localeStore'

afterEach(() => {
  useLocaleStore.setState({ locale: 'ru' })
})

describe('localizeLesson', () => {
  it('overlays git command lessons when locale is Tajik', () => {
    useLocaleStore.setState({ locale: 'tg' })
    const loc = localizeLesson('git', 'repo', ['cmd:init'], {
      title: 'git init',
      action_prompt: 'Создайте Git-репозиторий в текущей папке',
      usage_example:
        'Создайте папку my-project; перейдите в неё: cd my-project; выполните git init; проверьте состояние: git status',
      description: 'Появляется скрытая папка .git — в ней хранится история.',
    })
    expect(loc.action_prompt).toBe('Дар папка ҷорӣ Git-репозиторий созед')
    expect(loc.usage_example).toContain('Папка my-project созед')
  })

  it('overlays concept lessons without keys when locale is Tajik', () => {
    useLocaleStore.setState({ locale: 'tg' })
    const loc = localizeLesson('computer-basics', 'basics', [], {
      title: 'Расширение файла',
      action_prompt: 'Узнайте, зачем нужно .txt, .jpg, .zip',
      usage_example: '.txt — текст; .jpg — фото; .zip — архив (много файлов в одном)',
      description: 'Windows может скрывать расширения — важно видеть полное имя, чтобы не перепутать тип.',
    })
    expect(loc.title).toBe('Пасванди файл')
    expect(loc.description).toContain('Windows пасвандҳоро')
  })

  it('keeps Russian seed text when locale is Russian', () => {
    useLocaleStore.setState({ locale: 'ru' })
    const loc = localizeLesson('git', 'repo', ['cmd:init'], {
      title: 'git init',
      action_prompt: 'Создайте Git-репозиторий в текущей папке',
    })
    expect(loc.action_prompt).toBe('Создайте Git-репозиторий в текущей папке')
  })
})
