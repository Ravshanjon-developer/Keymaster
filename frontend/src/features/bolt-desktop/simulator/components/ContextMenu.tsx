import { useEffect, useRef } from 'react';
import type { ThemeTokens } from '@/features/bolt-desktop/simulator/theme';

export interface MenuItem {
  label: string;
  action: () => void;
  disabled?: boolean;
  danger?: boolean;
  separator?: boolean;
}

interface Props {
  x: number;
  y: number;
  items: MenuItem[];
  theme: ThemeTokens;
  onClose: () => void;
}

export function ContextMenu({ x, y, items, theme, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('mousedown', handleClick);
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  // Adjust position to keep within viewport
  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - (items.length * 36 + 16));

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        left: adjustedX,
        top: adjustedY,
        minWidth: 180,
        background: theme.bgElevated,
        border: `1px solid ${theme.borderStrong}`,
        borderRadius: 10,
        boxShadow: theme.shadow,
        padding: 6,
        zIndex: 10050,
        backdropFilter: 'blur(8px)',
      }}
    >
      {items.map((item, i) =>
        item.separator ? (
          <div key={i} style={{ height: 1, background: theme.border, margin: '4px 0' }} />
        ) : (
          <button
            key={i}
            disabled={item.disabled}
            onClick={() => {
              item.action();
              onClose();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              padding: '7px 12px',
              border: 'none',
              background: 'transparent',
              color: item.danger ? theme.error : theme.text,
              fontSize: 13,
              textAlign: 'left',
              cursor: item.disabled ? 'default' : 'pointer',
              borderRadius: 6,
              opacity: item.disabled ? 0.4 : 1,
              transition: 'background 0.12s',
            }}
            onMouseEnter={(e) => {
              if (!item.disabled) e.currentTarget.style.background = theme.bgHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {item.label}
          </button>
        )
      )}
    </div>
  );
}
