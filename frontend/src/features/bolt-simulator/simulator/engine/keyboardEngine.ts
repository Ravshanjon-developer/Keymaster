import type { KeyCombo, KeyModifier } from '@/features/bolt-simulator/simulator/types/keyboard';
import { SHORTCUTS } from '@/features/bolt-simulator/simulator/data/shortcuts';

export function normalizeKey(e: KeyboardEvent): string {
  const key = e.key.toLowerCase();
  // Normalize common keys
  if (key === ' ') return 'space';
  if (key === '`') return '`';
  if (key === '/') return '/';
  if (key.startsWith('arrow')) return key;
  return key;
}

export function getModifiers(e: KeyboardEvent): KeyModifier[] {
  const mods: KeyModifier[] = [];
  // Use e.ctrlKey for both Ctrl (Windows/Linux) and treat Meta as Ctrl on Mac
  if (e.ctrlKey || e.metaKey) mods.push('ctrl');
  if (e.shiftKey) mods.push('shift');
  if (e.altKey) mods.push('alt');
  return mods;
}

export function getCombo(e: KeyboardEvent): KeyCombo {
  return {
    modifiers: getModifiers(e),
    key: normalizeKey(e),
  };
}

export function comboToString(combo: KeyCombo): string {
  const parts: string[] = [];
  if (combo.modifiers.includes('ctrl')) parts.push('Ctrl');
  if (combo.modifiers.includes('shift')) parts.push('Shift');
  if (combo.modifiers.includes('alt')) parts.push('Alt');
  if (combo.modifiers.includes('meta')) parts.push('Cmd');

  const keyMap: Record<string, string> = {
    arrowup: '↑',
    arrowdown: '↓',
    arrowleft: '←',
    arrowright: '→',
    space: 'Space',
    '`': '`',
    '/': '/',
    enter: 'Enter',
    escape: 'Esc',
    tab: 'Tab',
    backspace: 'Backspace',
    delete: 'Delete',
  };

  parts.push(keyMap[combo.key] ?? combo.key.toUpperCase());
  return parts.join(' + ');
}

export function matchShortcut(combo: KeyCombo): string | null {
  for (const s of SHORTCUTS) {
    if (s.combo.key !== combo.key) continue;
    if (s.combo.modifiers.length !== combo.modifiers.length) continue;
    const sMods = new Set(s.combo.modifiers);
    const cMods = new Set(combo.modifiers);
    if (sMods.size === cMods.size && [...sMods].every((m) => cMods.has(m))) {
      return s.id;
    }
  }
  return null;
}

// Shortcuts that should prevent default browser behavior
export const PREVENT_DEFAULT_KEYS = new Set([
  'p', 's', 'o', 'n', 'w', 't', 'f', 'h', 'g', 'd', 'a', 'b', 'j', 'e', 'y', 'z', 'tab',
  '/', '`', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'space',
]);

export function shouldPreventDefault(e: KeyboardEvent): boolean {
  const mods = getModifiers(e);
  if (mods.length === 0) return false;
  const key = normalizeKey(e);
  if (PREVENT_DEFAULT_KEYS.has(key)) return true;
  if (mods.includes('ctrl') && mods.length >= 1) return true;
  return false;
}
