import { useSimulator } from '@/features/bolt-simulator/simulator/engine/SimulatorContext';
import { comboToString } from '@/features/bolt-simulator/simulator/engine/keyboardEngine';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface KeyDef {
  label: string;
  key: string;
  width?: number;
}

const ROW1: KeyDef[] = [
  { label: 'Esc', key: 'escape' },
  { label: 'F1', key: 'f1' }, { label: 'F2', key: 'f2' }, { label: 'F3', key: 'f3' }, { label: 'F4', key: 'f4' },
  { label: 'F5', key: 'f5' }, { label: 'F6', key: 'f6' }, { label: 'F7', key: 'f7' }, { label: 'F8', key: 'f8' },
];

const ROW2: KeyDef[] = [
  { label: '~', key: '`' }, { label: '1', key: '1' }, { label: '2', key: '2' }, { label: '3', key: '3' },
  { label: '4', key: '4' }, { label: '5', key: '5' }, { label: '6', key: '6' }, { label: '7', key: '7' },
  { label: '8', key: '8' }, { label: '9', key: '9' }, { label: '0', key: '0' },
  { label: 'Bksp', key: 'backspace', width: 2 },
];

const ROW3: KeyDef[] = [
  { label: 'Tab', key: 'tab', width: 2 },
  { label: 'Q', key: 'q' }, { label: 'W', key: 'w' }, { label: 'E', key: 'e' }, { label: 'R', key: 'r' },
  { label: 'T', key: 't' }, { label: 'Y', key: 'y' }, { label: 'U', key: 'u' }, { label: 'I', key: 'i' },
  { label: 'O', key: 'o' }, { label: 'P', key: 'p' },
  { label: '[', key: '[' }, { label: ']', key: ']' },
];

const ROW4: KeyDef[] = [
  { label: 'Caps', key: 'capslock', width: 2 },
  { label: 'A', key: 'a' }, { label: 'S', key: 's' }, { label: 'D', key: 'd' }, { label: 'F', key: 'f' },
  { label: 'G', key: 'g' }, { label: 'H', key: 'h' }, { label: 'J', key: 'j' }, { label: 'K', key: 'k' },
  { label: 'L', key: 'l' },
  { label: ';', key: ';' }, { label: "'", key: "'" },
  { label: 'Enter', key: 'enter', width: 2 },
];

const ROW5: KeyDef[] = [
  { label: 'Shift', key: 'shift', width: 2 },
  { label: 'Z', key: 'z' }, { label: 'X', key: 'x' }, { label: 'C', key: 'c' }, { label: 'V', key: 'v' },
  { label: 'B', key: 'b' }, { label: 'N', key: 'n' }, { label: 'M', key: 'm' },
  { label: ',', key: ',' }, { label: '.', key: '.' }, { label: '/', key: '/' },
  { label: 'Shift', key: 'shift', width: 2 },
];

const ROW6: KeyDef[] = [
  { label: 'Ctrl', key: 'ctrl', width: 1.5 },
  { label: 'Win', key: 'meta', width: 1.5 },
  { label: 'Alt', key: 'alt', width: 1.5 },
  { label: 'Space', key: 'space', width: 6 },
  { label: 'Alt', key: 'alt', width: 1.5 },
  { label: 'Ctrl', key: 'ctrl', width: 1.5 },
  { label: '←', key: 'arrowleft' }, { label: '↑', key: 'arrowup' },
  { label: '↓', key: 'arrowdown' }, { label: '→', key: 'arrowright' },
];

function KeyCap({ keyDef, active }: { keyDef: KeyDef; active: boolean }) {
  const width = keyDef.width ?? 1;
  return (
    <div
      className={`h-8 rounded text-2xs font-mono font-medium flex items-center justify-center transition-all duration-100 ${
        active
          ? 'bg-accent text-surface-0 scale-95 shadow-md'
          : 'bg-surface-3 text-ink-dim hover:bg-surface-4'
      }`}
      style={{ width: `${width * 32 + (width - 1) * 3}px` }}
    >
      {keyDef.label}
    </div>
  );
}

export function VirtualKeyboard() {
  const { state, toggleKeyboard } = useSimulator();
  const [flashKeys, setFlashKeys] = useState<Set<string>>(new Set());

  // Flash keys when a combo is pressed
  useEffect(() => {
    if (!state.comboFlash) return;
    const combo = state.comboFlash.combo;
    const keys = new Set<string>();
    keys.add(combo.key);
    combo.modifiers.forEach((m) => keys.add(m));
    setFlashKeys(keys);

    const timer = setTimeout(() => setFlashKeys(new Set()), 600);
    return () => clearTimeout(timer);
  }, [state.comboFlash]);

  // Also track real-time pressed modifier keys
  const activeKeys = new Set([...flashKeys]);
  state.activeModifiers.forEach((m) => activeKeys.add(m));
  state.pressedKeys.forEach((k) => activeKeys.add(k));

  const rows = [ROW1, ROW2, ROW3, ROW4, ROW5, ROW6];

  return (
    <div className="flex shrink-0 flex-col gap-1 border-t border-edge bg-surface-1 p-2">
      <div className="mb-1 flex items-center justify-between gap-2 px-1">
        <span className="text-2xs font-semibold uppercase tracking-wider text-ink-dim">
          Keyboard Visualizer
        </span>
        <div className="flex min-w-0 items-center gap-2">
          {state.lastCombo && (
            <span className="truncate text-2xs font-mono text-accent bg-accent/10 px-2 py-0.5 rounded animate-scale-in">
              {comboToString(state.lastCombo)}
            </span>
          )}
          <button
            type="button"
            onClick={toggleKeyboard}
            className="flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-2xs text-ink-dim transition-colors hover:bg-surface-2 hover:text-ink"
            title="Hide keyboard visualizer"
            aria-label="Hide keyboard visualizer"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-1 items-center overflow-x-auto">
        {rows.map((row, i) => (
          <div key={i} className="flex gap-1">
            {row.map((keyDef, j) => (
              <KeyCap
                key={`${i}-${j}`}
                keyDef={keyDef}
                active={activeKeys.has(keyDef.key)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
