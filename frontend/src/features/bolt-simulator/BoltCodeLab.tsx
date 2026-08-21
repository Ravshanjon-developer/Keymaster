import { useEffect, useCallback, useRef } from 'react'
import { SimulatorProvider, useSimulator } from '@/features/bolt-simulator/simulator/engine/SimulatorContext'
import { getCombo, matchShortcut, shouldPreventDefault } from '@/features/bolt-simulator/simulator/engine/keyboardEngine'
import { TopBar } from '@/features/bolt-simulator/simulator/components/TopBar'
import { ActivityBar } from '@/features/bolt-simulator/simulator/components/ActivityBar'
import { FileTree } from '@/features/bolt-simulator/simulator/components/FileTree'
import { SearchPanel } from '@/features/bolt-simulator/simulator/components/SearchPanel'
import { RunPanel } from '@/features/bolt-simulator/simulator/components/RunPanel'
import { ExtensionsPanel } from '@/features/bolt-simulator/simulator/components/ExtensionsPanel'
import { ScmPanel } from '@/features/bolt-simulator/simulator/components/ScmPanel'
import { EditorTabs } from '@/features/bolt-simulator/simulator/components/EditorTabs'
import { Editor } from '@/features/bolt-simulator/simulator/components/Editor'
import { Terminal } from '@/features/bolt-simulator/simulator/components/Terminal'
import { CommandPalette } from '@/features/bolt-simulator/simulator/components/CommandPalette'
import { TaskPanel } from '@/features/bolt-simulator/simulator/components/TaskPanel'
import { StatusBar } from '@/features/bolt-simulator/simulator/components/StatusBar'
import { VirtualKeyboard } from '@/features/bolt-simulator/simulator/components/VirtualKeyboard'
import { PreviewPanel } from '@/features/bolt-simulator/simulator/components/PreviewPanel'
import { Notifications } from '@/features/bolt-simulator/simulator/components/Notifications'
import { cn } from '@/shared/lib/utils'

import '@/features/bolt-simulator/bolt-simulator.css'

function ResizerV({ onResize }: { onResize: (delta: number) => void }) {
  const startX = useRef(0)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    startX.current = e.clientX
    const onMove = (ev: MouseEvent) => onResize(ev.clientX - startX.current)
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }
  return <div className="resizer-v w-1 bg-edge hover:bg-accent transition-colors shrink-0" onMouseDown={handleMouseDown} />
}

function ResizerH({ onResize }: { onResize: (delta: number) => void }) {
  const startY = useRef(0)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    startY.current = e.clientY
    const onMove = (ev: MouseEvent) => onResize(ev.clientY - startY.current)
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'
  }
  return <div className="resizer-h h-1 bg-edge hover:bg-accent transition-colors shrink-0" onMouseDown={handleMouseDown} />
}

function SimulatorShell() {
  const sim = useSimulator()
  const { state } = sim

  const handleShortcut = useCallback(
    (shortcutId: string) => {
      switch (shortcutId) {
        case 'command-palette':
          sim.openCommandPalette(true)
          break
        case 'quick-open':
          sim.openQuickOpen(true)
          break
        case 'toggle-sidebar':
          sim.toggleSidebar()
          break
        case 'toggle-terminal':
          sim.toggleTerminal()
          break
        case 'toggle-panel':
          sim.toggleTerminal()
          break
        case 'show-explorer':
          sim.setActiveView('explorer')
          break
        case 'global-search':
          sim.setActiveView('search')
          break
        case 'find':
          sim.toggleFind(true)
          break
        case 'replace':
          sim.toggleFind(true)
          break
        case 'save':
          sim.saveFile()
          sim.notify({ type: 'success', message: 'File saved' })
          break
        case 'save-all':
          state.openTabs.forEach((t) => sim.saveFile(t.fileId))
          sim.notify({ type: 'success', message: 'All files saved' })
          break
        case 'close-tab':
          if (state.activeTabId) sim.closeFile(state.activeTabId)
          break
        case 'reopen-closed-tab':
          if (state.closedTabHistory[0]) sim.reopenTab(state.closedTabHistory[0])
          break
        case 'new-file':
          sim.createNode(state.rootId, 'untitled.txt', 'file')
          break
        case 'next-tab': {
          if (state.openTabs.length > 1) {
            const idx = state.openTabs.findIndex((t) => t.fileId === state.activeTabId)
            const next = state.openTabs[(idx + 1) % state.openTabs.length]
            sim.setActiveFile(next.fileId)
          }
          break
        }
        case 'undo':
          sim.dispatch({ type: 'UNDO' })
          break
        case 'redo':
          sim.dispatch({ type: 'REDO' })
          break
        default:
          break
      }
    },
    [sim, state.activeTabId, state.openTabs, state.closedTabHistory, state.rootId],
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const combo = getCombo(e)
      const shortcutId = matchShortcut(combo)

      sim.dispatch({ type: 'KB_PRESS', combo, shortcutId, actionLabel: shortcutId ?? combo.key })

      if (shortcutId) {
        if (shouldPreventDefault(e)) e.preventDefault()
        handleShortcut(shortcutId)
      } else if (combo.key === 'f5' && combo.modifiers.length === 0) {
        e.preventDefault()
        void sim.runActiveFile()
      } else if (combo.modifiers.length > 0 && shouldPreventDefault(e)) {
        e.preventDefault()
      }

      if (e.key === 'Escape') {
        sim.openCommandPalette(false)
        sim.openQuickOpen(false)
        sim.toggleFind(false)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      sim.dispatch({ type: 'KB_RELEASE', key: e.key.toLowerCase() })
    }

    window.addEventListener('keydown', handleKeyDown, true)
    window.addEventListener('keyup', handleKeyUp, true)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
      window.removeEventListener('keyup', handleKeyUp, true)
    }
  }, [handleShortcut, sim])

  const sidebarContent = (() => {
    switch (state.activeView) {
      case 'search':
        return <SearchPanel />
      case 'run':
        return <RunPanel />
      case 'extensions':
        return <ExtensionsPanel />
      case 'scm':
        return <ScmPanel />
      default:
        return <FileTree />
    }
  })()

  return (
    <div
      className={cn(
        'bolt-simulator-root flex h-full min-h-0 flex-col overflow-hidden bg-surface-1',
        state.theme === 'light' && 'bolt-theme-light',
      )}
    >
      <div className="relative z-[60] shrink-0 overflow-visible">
        <TopBar />
      </div>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <ActivityBar />
        {state.sidebarVisible && (
          <>
            <div
              className="flex shrink-0 flex-col overflow-hidden border-r border-edge bg-surface-1"
              style={{ width: state.sidebarWidth }}
            >
              {sidebarContent}
            </div>
            <ResizerV onResize={(d) => sim.setSidebarWidth(state.sidebarWidth + d)} />
          </>
        )}

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <EditorTabs />
          <div className="flex min-h-0 flex-1 overflow-hidden">
            <Editor />
            {state.previewOpen && <PreviewPanel />}
            {state.taskPanelVisible && (
              <>
                <ResizerV onResize={(d) => sim.setTaskPanelWidth(state.taskPanelWidth - d)} />
                <div
                  className="flex shrink-0 flex-col overflow-hidden border-l border-edge bg-surface-0"
                  style={{ width: state.taskPanelWidth }}
                >
                  <TaskPanel />
                </div>
              </>
            )}
          </div>

          {state.terminalVisible && (
            <>
              <ResizerH onResize={(d) => sim.setTerminalHeight(state.terminalHeight - d)} />
              <div className="flex shrink-0 flex-col overflow-hidden" style={{ height: state.terminalHeight }}>
                <Terminal />
              </div>
            </>
          )}
        </div>
      </div>

      {state.keyboardVisible && <VirtualKeyboard />}
      <StatusBar />

      <CommandPalette mode="command" />
      <CommandPalette mode="quickopen" />
      <Notifications />
    </div>
  )
}

/** Full Bolt Code Lab simulator (source: Desktop/Bolt). */
export function BoltCodeLab() {
  return (
    <SimulatorProvider>
      <SimulatorShell />
    </SimulatorProvider>
  )
}
