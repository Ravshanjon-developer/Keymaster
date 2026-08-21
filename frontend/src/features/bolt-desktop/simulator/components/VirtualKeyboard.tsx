import { useState } from 'react';
import { ChevronDown, ChevronUp, Keyboard } from 'lucide-react';
import type { ThemeTokens } from '@/features/bolt-desktop/simulator/theme';
import { useT } from '@/shared/i18n';

interface Props {
  theme: ThemeTokens;
  visible: boolean;
}

const keyRows: string[][] = [
  ['Esc', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'],
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
  ['Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
  ['Caps', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", 'Enter'],
  ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'Shift'],
  ['Ctrl', 'Alt', 'Space', 'Alt', 'Ctrl'],
];

export function VirtualKeyboard({ theme, visible }: Props) {
  const t = useT();
  const [expanded, setExpanded] = useState(false);

  if (!visible) return null;

  const specialKeys = new Set([
    'Esc', 'Tab', 'Caps', 'Shift', 'Ctrl', 'Alt', 'Enter', 'Backspace', 'Space',
    'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
  '`', '-', '=', '[', ']', '\\', ';', "'", ',', '.', '/',
  ]);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 48,
        left: 0,
        right: 0,
        zIndex: 8900,
        background: theme.bgElevated,
        borderTop: `1px solid ${theme.border}`,
        transition: 'all 0.3s ease',
        maxHeight: expanded ? 280 : 44,
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        style={{
          width: '100%',
          height: 44,
          border: 'none',
          background: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          cursor: 'pointer',
          color: theme.textMuted,
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        <Keyboard size={15} />
        {t('desktopSimulator.tbKeyboard')}
        {expanded ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
      </button>
      {expanded && (
        <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {keyRows.map((row, i) => (
            <div key={i} style={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
              {row.map((key) => {
                const isSpecial = specialKeys.has(key);
                const isWide = key === 'Space' || key === 'Backspace' || key === 'Tab' || key === 'Caps' || key === 'Enter' || key === 'Shift';
                return (
                  <div
                    key={key}
                    style={{
                      minWidth: isWide ? 60 : 28,
                      flex: key === 'Space' ? 4 : isWide ? 1.5 : 0,
                      height: 28,
                      borderRadius: 5,
                      background: isSpecial ? theme.bgHover : theme.bgSurface,
                      border: `1px solid ${theme.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 600,
                      color: isSpecial ? theme.accent : theme.text,
                      cursor: 'default',
                      userSelect: 'none',
                      transition: 'all 0.1s',
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.background = theme.accentSoft;
                      e.currentTarget.style.borderColor = theme.accent;
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.background = isSpecial ? theme.bgHover : theme.bgSurface;
                      e.currentTarget.style.borderColor = theme.border;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isSpecial ? theme.bgHover : theme.bgSurface;
                      e.currentTarget.style.borderColor = theme.border;
                    }}
                  >
                    {key === 'Space' ? '' : key}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
