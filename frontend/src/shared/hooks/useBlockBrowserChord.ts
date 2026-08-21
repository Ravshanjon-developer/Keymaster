import { useEffect, useMemo, useRef } from 'react'

import {
  chordKey,
  isDestructiveBrowserEvent,
  matchesShortcut,
  normalizeShortcutKeys,
  webPracticeKeys,
} from '@/shared/lib/hotkeys'

/**
 * Blocks the lesson chord (and remapped practice chord) from reaching the browser
 * while a hotkey lesson page is open — e.g. Ctrl+S must not open “Save page”.
 */
export function useBlockBrowserChord(
  keys: string[] | null | undefined,
  enabled = true,
  onBlocked?: () => void,
) {
  const onBlockedRef = useRef(onBlocked)
  onBlockedRef.current = onBlocked

  const chordId = useMemo(
    () => (keys?.length ? chordKey(normalizeShortcutKeys(keys)) : ''),
    [keys],
  )

  useEffect(() => {
    if (!enabled || !keys?.length) return

    const expected = normalizeShortcutKeys(keys)
    const practice = webPracticeKeys(expected)

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return
      const hitsLesson =
        matchesShortcut(expected, e) ||
        matchesShortcut(practice, e) ||
        isDestructiveBrowserEvent(e)
      if (!hitsLesson) return
      e.preventDefault()
      e.stopPropagation()
      onBlockedRef.current?.()
    }

    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [chordId, enabled, keys])
}
