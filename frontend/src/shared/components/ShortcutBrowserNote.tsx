import { formatShortcut, isOsCapturedShortcut, webPracticeKeys } from '@/shared/lib/hotkeys'
import { useT } from '@/shared/i18n'

/** Shown on cards / theory when the real OS shortcut differs from browser practice. */
export function ShortcutBrowserNote({ keys }: { keys: string[] }) {
  const t = useT()
  if (!isOsCapturedShortcut(keys)) return null
  const practice = webPracticeKeys(keys)
  return (
    <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-950 dark:text-amber-100">
      {t('lesson.browserPractice', {
        system: formatShortcut(keys),
        practice: formatShortcut(practice),
      })}
    </p>
  )
}
