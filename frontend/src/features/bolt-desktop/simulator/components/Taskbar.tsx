import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Keyboard, Sun, Moon, LogOut, ListTodo, Search } from 'lucide-react'
import { RealExplorerIcon, RealTrashIcon, RealVsCodeIcon } from '@/features/bolt-desktop/simulator/components/RealIcons'
import { getVfsDragNodeId } from '@/features/bolt-desktop/simulator/engine/desktopDnD'
import type { WindowState } from '@/features/bolt-desktop/simulator/hooks/useWindowManager'
import type { ThemeTokens } from '@/features/bolt-desktop/simulator/theme'
import { useT } from '@/shared/i18n'
import { useLocaleStore } from '@/shared/i18n/localeStore'

interface Props {
  theme: ThemeTokens
  windows: WindowState[]
  onOpenFiles: () => void
  onOpenTrash: () => void
  onOpenVsCode: () => void
  onDropOnVsCode?: (nodeId: string) => void
  onDropOnTrash?: (nodeId: string) => void
  onToggleKeyboard: () => void
  onToggleTasks: () => void
  onToggleTheme: () => void
  keyboardOpen: boolean
  tasksOpen: boolean
  onFocusWindow: (id: string) => void
}

function WindowsLogo({ size = 18, color }: { size?: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <rect x="1" y="1" width="10" height="10" rx="0.5" fill={color} />
      <rect x="13" y="1" width="10" height="10" rx="0.5" fill={color} />
      <rect x="1" y="13" width="10" height="10" rx="0.5" fill={color} />
      <rect x="13" y="13" width="10" height="10" rx="0.5" fill={color} />
    </svg>
  )
}

function TrayClock({ theme }: { theme: ThemeTokens }) {
  const locale = useLocaleStore((s) => s.locale)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15000)
    return () => window.clearInterval(id)
  }, [])

  const loc = locale === 'tg' ? 'tg-TJ' : 'ru-RU'
  const time = now.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' })
  const date = now.toLocaleDateString(loc, { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <div
      style={{
        minWidth: 74,
        padding: '4px 10px',
        textAlign: 'right',
        lineHeight: 1.2,
        color: theme.text,
        fontSize: 12,
        fontWeight: 500,
        borderRadius: 6,
        fontFamily: '"Segoe UI Variable", "Segoe UI", system-ui, sans-serif',
      }}
    >
      <div>{time}</div>
      <div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 400 }}>{date}</div>
    </div>
  )
}

/** Windows 11–style centered taskbar with acrylic bar + tray. */
export function Taskbar({
  theme,
  windows,
  onOpenFiles,
  onOpenTrash,
  onOpenVsCode,
  onDropOnVsCode,
  onDropOnTrash,
  onToggleKeyboard,
  onToggleTasks,
  onToggleTheme,
  keyboardOpen,
  tasksOpen,
  onFocusWindow,
}: Props) {
  const t = useT()
  const locale = useLocaleStore((s) => s.locale)
  const [startOpen, setStartOpen] = useState(false)
  const startRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!startOpen) return
    const onDown = (e: MouseEvent) => {
      if (startRef.current && !startRef.current.contains(e.target as Node)) {
        setStartOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [startOpen])

  const pill = theme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const pillHover = theme.mode === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.1)'

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 52,
        background: theme.mode === 'dark' ? 'rgba(28, 28, 28, 0.78)' : 'rgba(243, 243, 243, 0.82)',
        backdropFilter: 'blur(48px) saturate(1.6)',
        WebkitBackdropFilter: 'blur(48px) saturate(1.6)',
        borderTop: `1px solid ${theme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        padding: '0 10px',
        zIndex: 9000,
        fontFamily: '"Segoe UI Variable", "Segoe UI", system-ui, sans-serif',
        boxShadow: theme.mode === 'dark' ? '0 -1px 0 rgba(255,255,255,0.04)' : '0 -1px 0 rgba(0,0,0,0.04)',
      }}
    >
      {/* Left spacer — keeps center cluster true-center like Win11 */}
      <div />

      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <div ref={startRef} style={{ position: 'relative' }}>
          <TaskbarBtn
            theme={theme}
            pill={pill}
            pillHover={pillHover}
            onClick={() => setStartOpen((o) => !o)}
            title={t('desktopSimulator.start')}
            active={startOpen}
          >
            <WindowsLogo size={18} color={theme.mode === 'dark' ? '#fff' : '#111'} />
          </TaskbarBtn>
          {startOpen && (
            <StartMenu
              theme={theme}
              onOpenFiles={() => {
                onOpenFiles()
                setStartOpen(false)
              }}
              onOpenTrash={() => {
                onOpenTrash()
                setStartOpen(false)
              }}
              onOpenVsCode={() => {
                onOpenVsCode()
                setStartOpen(false)
              }}
              onToggleKeyboard={() => {
                onToggleKeyboard()
                setStartOpen(false)
              }}
              onToggleTheme={() => {
                onToggleTheme()
                setStartOpen(false)
              }}
              onClose={() => setStartOpen(false)}
            />
          )}
        </div>

        <TaskbarBtn theme={theme} pill={pill} pillHover={pillHover} onClick={onOpenFiles} title={t('desktopSimulator.tbSearch')}>
          <Search size={17} color={theme.text} strokeWidth={2} />
        </TaskbarBtn>

        <TaskbarBtn theme={theme} pill={pill} pillHover={pillHover} onClick={onOpenFiles} title={t('desktopSimulator.tbFiles')}>
          <RealExplorerIcon size={22} />
        </TaskbarBtn>
        <TaskbarBtn
          theme={theme}
          pill={pill}
          pillHover={pillHover}
          onClick={onOpenTrash}
          title={t('desktopSimulator.tbTrash')}
          onDragOver={
            onDropOnTrash
              ? (e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                }
              : undefined
          }
          onDrop={
            onDropOnTrash
              ? (e) => {
                  e.preventDefault()
                  const nodeId = getVfsDragNodeId(e.dataTransfer)
                  if (nodeId && !nodeId.startsWith('sys:')) onDropOnTrash(nodeId)
                }
              : undefined
          }
        >
          <RealTrashIcon size={22} />
        </TaskbarBtn>
        <TaskbarBtn
          theme={theme}
          pill={pill}
          pillHover={pillHover}
          onClick={onOpenVsCode}
          title={t('desktopSimulator.openVscode')}
          onDragOver={
            onDropOnVsCode
              ? (e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'copy'
                }
              : undefined
          }
          onDrop={
            onDropOnVsCode
              ? (e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const nodeId = getVfsDragNodeId(e.dataTransfer)
                  if (nodeId && !nodeId.startsWith('sys:')) onDropOnVsCode(nodeId)
                }
              : undefined
          }
        >
          <RealVsCodeIcon size={22} />
        </TaskbarBtn>

        {windows.map((w) => (
          <TaskbarBtn
            key={w.id}
            theme={theme}
            pill={pill}
            pillHover={pillHover}
            onClick={() => onFocusWindow(w.id)}
            title={w.title}
            active={!w.minimized}
            showIndicator
          >
            {w.appId === 'files' ? <RealExplorerIcon size={20} /> : <RealTextFileIconTiny color={theme.text} />}
          </TaskbarBtn>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
        <TaskbarBtn theme={theme} pill={pill} pillHover={pillHover} onClick={onToggleTasks} title={t('desktopSimulator.tbTasks')} active={tasksOpen}>
          <ListTodo size={16} color={tasksOpen ? theme.accent : theme.text} />
        </TaskbarBtn>
        <TaskbarBtn
          theme={theme}
          pill={pill}
          pillHover={pillHover}
          onClick={onToggleKeyboard}
          title={t('desktopSimulator.tbKeyboard')}
          active={keyboardOpen}
        >
          <Keyboard size={16} color={keyboardOpen ? theme.accent : theme.text} />
        </TaskbarBtn>
        <TaskbarBtn theme={theme} pill={pill} pillHover={pillHover} onClick={onToggleTheme} title={t('desktopSimulator.tbTheme')}>
          {theme.mode === 'dark' ? <Sun size={16} color={theme.text} /> : <Moon size={16} color={theme.text} />}
        </TaskbarBtn>

        <div
          title={locale === 'tg' ? 'TJ' : 'RU'}
          style={{
            height: 36,
            minWidth: 40,
            padding: '0 8px',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 600,
            color: theme.text,
            letterSpacing: '0.02em',
          }}
        >
          {locale === 'tg' ? 'TJ' : 'РУС'}
        </div>

        <TrayClock theme={theme} />

        <NavLink to="/practice" title={t('practiceShell.exitSim')} style={{ textDecoration: 'none' }}>
          <span
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LogOut size={16} color={theme.text} />
          </span>
        </NavLink>
      </div>
    </div>
  )
}

function RealTextFileIconTiny({ color }: { color: string }) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
        stroke={color}
        strokeWidth="1.6"
        fill="rgba(255,255,255,0.08)"
      />
      <path d="M14 3v4h4" stroke={color} strokeWidth="1.6" />
    </svg>
  )
}

function StartMenu({
  theme,
  onOpenFiles,
  onOpenTrash,
  onOpenVsCode,
  onToggleKeyboard,
  onToggleTheme,
  onClose,
}: {
  theme: ThemeTokens
  onOpenFiles: () => void
  onOpenTrash: () => void
  onOpenVsCode: () => void
  onToggleKeyboard: () => void
  onToggleTheme: () => void
  onClose: () => void
}) {
  const t = useT()

  const pins = [
    { id: 'files', label: t('desktopSimulator.tbFiles'), onClick: onOpenFiles, icon: <RealExplorerIcon size={32} /> },
    { id: 'trash', label: t('desktopSimulator.tbTrash'), onClick: onOpenTrash, icon: <RealTrashIcon size={32} /> },
    { id: 'code', label: t('desktopSimulator.openVscode'), onClick: onOpenVsCode, icon: <RealVsCodeIcon size={32} /> },    {
      id: 'kb',
      label: t('desktopSimulator.tbKeyboard'),
      onClick: onToggleKeyboard,
      icon: <Keyboard size={26} color={theme.text} />,
    },
  ]

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 60,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 420,
        borderRadius: 16,
        background: theme.mode === 'dark' ? 'rgba(32,32,32,0.94)' : 'rgba(255,255,255,0.94)',
        backdropFilter: 'blur(48px)',
        border: `1px solid ${theme.borderStrong}`,
        boxShadow: theme.shadow,
        padding: 18,
        color: theme.text,
        zIndex: 9100,
      }}
    >
      <p style={{ margin: '0 0 12px 6px', fontSize: 13, fontWeight: 600, color: theme.textMuted }}>
        {t('desktopSimulator.pinned')}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
        {pins.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={p.onClick}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              padding: '14px 8px',
              border: 'none',
              borderRadius: 10,
              background: 'transparent',
              color: theme.text,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.bgHover
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            {p.icon}
            <span style={{ textAlign: 'center', lineHeight: 1.2 }}>{p.label}</span>
          </button>
        ))}
      </div>
      <div style={{ height: 1, background: theme.border, margin: '4px 0 10px' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <button type="button" onClick={onToggleTheme} style={footerBtn(theme)}>
          {theme.mode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          {t('desktopSimulator.tbTheme')}
        </button>
        <NavLink to="/practice" onClick={onClose} style={{ ...footerBtn(theme), textDecoration: 'none' }}>
          <LogOut size={16} />
          {t('practiceShell.exitSim')}
        </NavLink>
      </div>
    </div>
  )
}

function footerBtn(theme: ThemeTokens): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 12px',
    border: 'none',
    borderRadius: 10,
    background: 'transparent',
    color: theme.text,
    cursor: 'pointer',
    fontSize: 12,
    flex: 1,
  }
}

function TaskbarBtn({
  children,
  onClick,
  theme,
  title,
  active,
  pill,
  pillHover,
  showIndicator,
  onDragOver,
  onDrop,
}: {
  children: React.ReactNode
  onClick: () => void
  theme: ThemeTokens
  title: string
  active?: boolean
  pill: string
  pillHover: string
  showIndicator?: boolean
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      aria-label={title}
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={{
        position: 'relative',
        width: 44,
        height: 44,
        border: 'none',
        borderRadius: 10,
        background: active ? pill : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'background 0.12s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = active ? pill : pillHover
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = active ? pill : 'transparent'
      }}
    >
      {children}
      {showIndicator ? (
        <span
          style={{
            position: 'absolute',
            bottom: 4,
            left: '50%',
            transform: 'translateX(-50%)',
            width: active ? 16 : 6,
            height: 3,
            borderRadius: 2,
            background: theme.accent,
          }}
        />
      ) : null}
    </button>
  )
}
