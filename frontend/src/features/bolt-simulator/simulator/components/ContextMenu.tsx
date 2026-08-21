import { useState, useRef, useEffect, useCallback } from 'react';

interface Position {
  x: number;
  y: number;
}

export interface ContextMenuItem {
  label: string;
  action: () => void;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  disabled?: boolean;
  separator?: boolean;
  danger?: boolean;
  shortcut?: string;
}

interface ContextMenuProps {
  position: Position | null;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ position, items, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = useState<Position | null>(null);

  useEffect(() => {
    if (!position || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    let x = position.x;
    let y = position.y;
    if (x + rect.width > window.innerWidth) x = window.innerWidth - rect.width - 8;
    if (y + rect.height > window.innerHeight) y = window.innerHeight - rect.height - 8;
    setAdjustedPos({ x, y });
  }, [position]);

  useEffect(() => {
    if (!position) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('keydown', handleEsc);
    }, 0);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [position, onClose]);

  const handleItemClick = useCallback((item: ContextMenuItem) => {
    if (item.disabled) return;
    item.action();
    onClose();
  }, [onClose]);

  if (!position || !adjustedPos) return null;

  return (
    <div
      ref={ref}
      className="fixed z-[100] min-w-[200px] py-1 bg-surface-0 border border-edge rounded-lg shadow-2xl animate-scale-in no-select"
      style={{ left: adjustedPos.x, top: adjustedPos.y }}
    >
      {items.map((item, i) => (
        item.separator ? (
          <div key={i} className="h-px bg-edge my-1 mx-2" />
        ) : (
          <button
            key={i}
            disabled={item.disabled}
            onClick={() => handleItemClick(item)}
            className={`w-full flex items-center gap-3 px-3 py-1.5 text-sm text-left transition-colors ${
              item.disabled
                ? 'text-ink-faint cursor-not-allowed'
                : item.danger
                  ? 'text-danger hover:bg-danger/10'
                  : 'text-ink-soft hover:bg-accent/10 hover:text-ink'
            }`}
          >
            {item.icon && <item.icon size={15} className="shrink-0" />}
            <span className="flex-1">{item.label}</span>
            {item.shortcut && (
              <span className="text-2xs text-ink-faint font-mono">{item.shortcut}</span>
            )}
          </button>
        )
      ))}
    </div>
  );
}
