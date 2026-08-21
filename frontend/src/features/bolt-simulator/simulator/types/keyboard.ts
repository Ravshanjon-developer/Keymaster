export type KeyModifier = 'ctrl' | 'shift' | 'alt' | 'meta';
export type KeyCombo = {
  modifiers: KeyModifier[];
  key: string;
};

export interface ShortcutDef {
  id: string;
  label: string;
  combo: KeyCombo;
  category: 'navigation' | 'editing' | 'files' | 'search' | 'terminal' | 'panels' | 'command';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description?: string;
}

export interface KeyEvent {
  combo: KeyCombo;
  shortcutId: string | null;
  timestamp: number;
  actionLabel: string;
}

export interface KeyboardState {
  pressedKeys: Set<string>;
  activeModifiers: Set<KeyModifier>;
  history: KeyEvent[];
  lastCombo: KeyCombo | null;
}
