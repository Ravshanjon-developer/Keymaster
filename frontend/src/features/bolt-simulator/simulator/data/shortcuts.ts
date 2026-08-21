import type { ShortcutDef } from '@/features/bolt-simulator/simulator/types/keyboard';

export const SHORTCUTS: ShortcutDef[] = [
  // Navigation
  { id: 'quick-open', label: 'Quick Open File', combo: { modifiers: ['ctrl'], key: 'p' }, category: 'navigation', difficulty: 'beginner', description: 'Open file by name' },
  { id: 'command-palette', label: 'Command Palette', combo: { modifiers: ['ctrl', 'shift'], key: 'p' }, category: 'command', difficulty: 'beginner', description: 'Open the command palette' },
  { id: 'go-to-line', label: 'Go to Line', combo: { modifiers: ['ctrl'], key: 'g' }, category: 'navigation', difficulty: 'intermediate' },
  { id: 'next-tab', label: 'Next Tab', combo: { modifiers: ['ctrl'], key: 'tab' }, category: 'navigation', difficulty: 'beginner' },
  { id: 'close-tab', label: 'Close Tab', combo: { modifiers: ['ctrl'], key: 'w' }, category: 'navigation', difficulty: 'beginner' },
  { id: 'reopen-closed-tab', label: 'Reopen Closed Tab', combo: { modifiers: ['ctrl', 'shift'], key: 't' }, category: 'navigation', difficulty: 'intermediate' },
  { id: 'navigate-back', label: 'Navigate Back', combo: { modifiers: ['alt'], key: 'arrowleft' }, category: 'navigation', difficulty: 'intermediate' },
  { id: 'navigate-forward', label: 'Navigate Forward', combo: { modifiers: ['alt'], key: 'arrowright' }, category: 'navigation', difficulty: 'intermediate' },

  // Editing
  { id: 'copy', label: 'Copy', combo: { modifiers: ['ctrl'], key: 'c' }, category: 'editing', difficulty: 'beginner' },
  { id: 'cut', label: 'Cut', combo: { modifiers: ['ctrl'], key: 'x' }, category: 'editing', difficulty: 'beginner' },
  { id: 'paste', label: 'Paste', combo: { modifiers: ['ctrl'], key: 'v' }, category: 'editing', difficulty: 'beginner' },
  { id: 'undo', label: 'Undo', combo: { modifiers: ['ctrl'], key: 'z' }, category: 'editing', difficulty: 'beginner' },
  { id: 'redo', label: 'Redo', combo: { modifiers: ['ctrl'], key: 'y' }, category: 'editing', difficulty: 'beginner' },
  { id: 'select-all', label: 'Select All', combo: { modifiers: ['ctrl'], key: 'a' }, category: 'editing', difficulty: 'beginner' },
  { id: 'select-next', label: 'Select Next Occurrence', combo: { modifiers: ['ctrl'], key: 'd' }, category: 'editing', difficulty: 'advanced' },
  { id: 'toggle-comment', label: 'Toggle Line Comment', combo: { modifiers: ['ctrl'], key: '/' }, category: 'editing', difficulty: 'intermediate' },
  { id: 'duplicate-line-up', label: 'Duplicate Line Up', combo: { modifiers: ['shift', 'alt'], key: 'arrowup' }, category: 'editing', difficulty: 'advanced' },
  { id: 'duplicate-line-down', label: 'Duplicate Line Down', combo: { modifiers: ['shift', 'alt'], key: 'arrowdown' }, category: 'editing', difficulty: 'advanced' },
  { id: 'move-line-up', label: 'Move Line Up', combo: { modifiers: ['alt'], key: 'arrowup' }, category: 'editing', difficulty: 'advanced' },
  { id: 'move-line-down', label: 'Move Line Down', combo: { modifiers: ['alt'], key: 'arrowdown' }, category: 'editing', difficulty: 'advanced' },

  // Files
  { id: 'new-file', label: 'New File', combo: { modifiers: ['ctrl'], key: 'n' }, category: 'files', difficulty: 'beginner', description: 'Create a new file' },
  { id: 'save', label: 'Save File', combo: { modifiers: ['ctrl'], key: 's' }, category: 'files', difficulty: 'beginner', description: 'Save the current file' },
  { id: 'save-all', label: 'Save All', combo: { modifiers: ['ctrl', 'shift'], key: 's' }, category: 'files', difficulty: 'intermediate' },
  { id: 'open-file', label: 'Open File', combo: { modifiers: ['ctrl'], key: 'o' }, category: 'files', difficulty: 'beginner' },

  // Search
  { id: 'find', label: 'Find', combo: { modifiers: ['ctrl'], key: 'f' }, category: 'search', difficulty: 'beginner', description: 'Find in file' },
  { id: 'replace', label: 'Replace', combo: { modifiers: ['ctrl'], key: 'h' }, category: 'search', difficulty: 'intermediate' },
  { id: 'global-search', label: 'Global Search', combo: { modifiers: ['ctrl', 'shift'], key: 'f' }, category: 'search', difficulty: 'intermediate' },

  // Terminal
  { id: 'toggle-terminal', label: 'Toggle Terminal', combo: { modifiers: ['ctrl'], key: '`' }, category: 'terminal', difficulty: 'beginner', description: 'Toggle the terminal panel' },
  { id: 'new-terminal', label: 'New Terminal', combo: { modifiers: ['ctrl', 'shift'], key: '`' }, category: 'terminal', difficulty: 'advanced' },

  // Panels
  { id: 'toggle-sidebar', label: 'Toggle Sidebar', combo: { modifiers: ['ctrl'], key: 'b' }, category: 'panels', difficulty: 'beginner', description: 'Show/hide the sidebar' },
  { id: 'toggle-panel', label: 'Toggle Panel', combo: { modifiers: ['ctrl'], key: 'j' }, category: 'panels', difficulty: 'intermediate' },
  { id: 'show-explorer', label: 'Show Explorer', combo: { modifiers: ['ctrl', 'shift'], key: 'e' }, category: 'panels', difficulty: 'beginner' },
];

export const SHORTCUT_MAP: Record<string, ShortcutDef> = Object.fromEntries(
  SHORTCUTS.map((s) => [s.id, s]),
);

export function comboKey(combo: { modifiers: string[]; key: string }): string {
  return [...combo.modifiers.map((m) => m.charAt(0).toUpperCase() + m.slice(1)), combo.key.toUpperCase()].join('+');
}
