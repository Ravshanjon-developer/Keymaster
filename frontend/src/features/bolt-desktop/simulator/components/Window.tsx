import { useRef, useEffect, type ReactNode } from 'react';
import { Minus, Square, X, Copy } from 'lucide-react';
import type { WindowState } from '@/features/bolt-desktop/simulator/hooks/useWindowManager';
import type { ThemeTokens } from '@/features/bolt-desktop/simulator/theme';

interface Props {
  win: WindowState;
  theme: ThemeTokens;
  isMobile: boolean;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onMove: (x: number, y: number) => void;
  children: ReactNode;
}

export function Window({
  win,
  theme,
  isMobile,
  onFocus,
  onClose,
  onMinimize,
  onToggleMaximize,
  onMove,
  children,
}: Props) {
  const dragRef = useRef<{ startX: number; startY: number; winX: number; winY: number } | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (win.minimized) return;
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!dragRef.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const dx = clientX - dragRef.current.startX;
      const dy = clientY - dragRef.current.startY;
      onMove(dragRef.current.winX + dx, Math.max(0, dragRef.current.winY + dy));
    };
    const handleUp = () => {
      dragRef.current = null;
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [win.minimized, onMove]);

  if (win.minimized) return null;

  const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (win.maximized || isMobile) return;
    onFocus();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    dragRef.current = { startX: clientX, startY: clientY, winX: win.x, winY: win.y };
  };

  const style: React.CSSProperties = isMobile || win.maximized
    ? {
        position: 'absolute',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        zIndex: win.zIndex,
      }
    : {
        position: 'absolute',
        left: win.x,
        top: win.y,
        width: win.width,
        height: win.height,
        zIndex: win.zIndex,
        boxShadow: theme.shadow,
      };

  return (
    <div
      style={{
        ...style,
        background: theme.bgSurface,
        borderRadius: isMobile || win.maximized ? 0 : 8,
        border: `1px solid ${theme.borderStrong}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: '"Segoe UI Variable", "Segoe UI", system-ui, sans-serif',
      }}
      onMouseDown={onFocus}
    >
      <div
        ref={headerRef}
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        style={{
          height: 32,
          flexShrink: 0,
          background: theme.windowHeader,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: 12,
          cursor: isMobile || win.maximized ? 'default' : 'grab',
          userSelect: 'none',
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 400, color: theme.text }}>{win.title}</span>
        <div style={{ display: 'flex', height: '100%' }}>
            <CaptionBtn theme={theme} onClick={onMinimize} label="Minimize">
            <Minus size={12} />
          </CaptionBtn>
          {!isMobile && (
            <CaptionBtn theme={theme} onClick={onToggleMaximize} label="Maximize">
              {win.maximized ? <Copy size={10} /> : <Square size={10} />}
            </CaptionBtn>
          )}
          <CaptionBtn theme={theme} onClick={onClose} label="Close" close>
            <X size={12} />
          </CaptionBtn>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {children}
      </div>
    </div>
  );
}

function CaptionBtn({
  theme,
  onClick,
  label,
  close,
  children,
}: {
  theme: ThemeTokens;
  onClick: () => void;
  label: string;
  close?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{
        width: 46,
        height: '100%',
        border: 'none',
        borderRadius: 0,
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme.text,
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = close ? theme.closeHover : theme.captionHover;
        if (close) e.currentTarget.style.color = '#fff';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = theme.text;
      }}
    >
      {children}
    </button>
  );
}
