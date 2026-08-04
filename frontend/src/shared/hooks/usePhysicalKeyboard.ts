import { useEffect, useState } from 'react'

const HARDWARE_CODES =
  /^(Key|Digit|Control|Alt|Meta|Shift|Arrow|Space|Enter|Tab|Backspace|Delete|Home|End|PageUp|PageDown|F\d|Numpad|Bracket|Backquote|Minus|Equal|Semicolon|Quote|Comma|Period|Slash|Backslash)/

function isLikelyDesktop(): boolean {
  if (typeof window === 'undefined') return true
  const finePointer = window.matchMedia('(pointer: fine)').matches
  const hoverCapable = window.matchMedia('(hover: hover)').matches
  const noTouch = navigator.maxTouchPoints === 0
  return (finePointer && hoverCapable) || noTouch
}

function isHardwareKeyEvent(e: KeyboardEvent): boolean {
  const tag = (e.target as HTMLElement | null)?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) {
    return false
  }
  if (!e.code || e.code === 'Unidentified') return false
  return HARDWARE_CODES.test(e.code)
}

/** True when a physical keyboard is available (desktop or BT keyboard on tablet/phone). */
export function usePhysicalKeyboard(): boolean {
  const [hasPhysical, setHasPhysical] = useState(() => isLikelyDesktop())

  useEffect(() => {
    if (isLikelyDesktop()) {
      setHasPhysical(true)
      return
    }
    setHasPhysical(false)

    const onKeyDown = (e: KeyboardEvent) => {
      if (isHardwareKeyEvent(e)) setHasPhysical(true)
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [])

  return hasPhysical
}
