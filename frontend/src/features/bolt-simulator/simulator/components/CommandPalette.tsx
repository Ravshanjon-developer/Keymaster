import { useState, useRef, useEffect, useMemo } from 'react';
import { useSimulator } from '@/features/bolt-simulator/simulator/engine/SimulatorContext';
import { COMMANDS } from '@/features/bolt-simulator/simulator/data/commands';
import { SHORTCUT_MAP } from '@/features/bolt-simulator/simulator/data/shortcuts';
import { Search, ChevronRight, CornerDownLeft } from 'lucide-react';
import { comboKey } from '@/features/bolt-simulator/simulator/engine/SimulatorContext';

interface PaletteProps {
  mode: 'command' | 'quickopen';
}

export function CommandPalette({ mode }: PaletteProps) {
  const { state, openCommandPalette, openQuickOpen, openFile, createNode, toggleSidebar, toggleTerminal, toggleFind, setActiveView, closeFile, reopenTab, saveFile, nextTask, showHint, skipTask, clearTerminal } = useSimulator();
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isOpen = mode === 'command' ? state.commandPaletteOpen : state.quickOpenOpen;

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const close = () => {
    openCommandPalette(false);
    openQuickOpen(false);
  };

  // Build items based on mode
  const items = useMemo(() => {
    if (mode === 'quickopen') {
      const allFiles = Object.values(state.nodes).filter((n) => n.type === 'file');
      const filtered = query
        ? allFiles.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()))
        : allFiles;
      return filtered.slice(0, 20).map((f) => ({
        id: f.id,
        label: f.name,
        detail: '',
        shortcutId: undefined,
        action: () => { openFile(f.id); close(); },
      }));
    }
    // Command mode
    const filtered = query
      ? COMMANDS.filter((c) => c.label.toLowerCase().includes(query.toLowerCase().replace('>', '')))
      : COMMANDS;
    return filtered.map((cmd) => ({
      id: cmd.id,
      label: cmd.label,
      detail: cmd.category,
      shortcutId: cmd.shortcutId,
      action: () => {
        executeCommandAction(cmd.id);
        close();
      },
    }));
  }, [query, mode, state.nodes]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.children[selectedIdx] as HTMLElement;
      selected?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIdx]);

  const executeCommandAction = (cmdId: string) => {
    const rootId = state.rootId;
    switch (cmdId) {
      case 'cmd.new-file': createNode(rootId, 'untitled.txt', 'file'); break;
      case 'cmd.new-folder': createNode(rootId, 'new-folder', 'folder'); break;
      case 'cmd.save': saveFile(); break;
      case 'cmd.save-all': state.openTabs.forEach((t) => saveFile(t.fileId)); break;
      case 'cmd.toggle-sidebar': toggleSidebar(); break;
      case 'cmd.toggle-terminal': toggleTerminal(); break;
      case 'cmd.toggle-panel': toggleTerminal(); break;
      case 'cmd.show-explorer': setActiveView('explorer'); break;
      case 'cmd.global-search': setActiveView('search'); break;
      case 'cmd.find': toggleFind(true); break;
      case 'cmd.close-tab': if (state.activeTabId) closeFile(state.activeTabId); break;
      case 'cmd.reopen-closed-tab': if (state.closedTabHistory[0]) reopenTab(state.closedTabHistory[0]); break;
      case 'cmd.next-task': nextTask(); break;
      case 'cmd.hint': showHint(); break;
      case 'cmd.skip-task': skipTask(); break;
      case 'cmd.clear-terminal': clearTerminal(); break;
      default: break;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      items[selectedIdx]?.action();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[90] bg-black/20 animate-fade-in"
        onClick={close}
      />
      {/* Palette */}
      <div className="fixed top-[15%] left-1/2 -translate-x-1/2 w-[600px] max-w-[90vw] z-[91] animate-scale-in">
        <div className="flex items-center gap-2 px-3 py-2.5 bg-surface-0 border border-edge rounded-t-lg shadow-2xl">
          <Search size={16} className="text-ink-dim" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={mode === 'command' ? 'Type a command...' : 'Search files by name...'}
            className="flex-1 bg-transparent outline-none text-sm text-ink placeholder:text-ink-faint"
          />
          <kbd className="text-2xs text-ink-faint font-mono px-1.5 py-0.5 bg-surface-2 rounded">Esc</kbd>
        </div>
        <div
          ref={listRef}
          className="max-h-[400px] overflow-y-auto bg-surface-1 border-x border-b border-edge rounded-b-lg shadow-2xl"
        >
          {items.length === 0 && (
            <div className="px-3 py-4 text-sm text-ink-dim text-center">No results</div>
          )}
          {items.map((item, i) => (
            <button
              key={item.id}
              onMouseEnter={() => setSelectedIdx(i)}
              onClick={() => item.action()}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                i === selectedIdx ? 'bg-[#094771] text-white' : 'hover:bg-surface-2'
              }`}
            >
              {mode === 'quickopen' ? (
                <ChevronRight size={14} className="text-ink-faint" />
              ) : (
                <span className="text-2xs text-ink-faint font-mono w-16 shrink-0">{item.detail}</span>
              )}
              <span className="flex-1 text-sm text-ink-soft truncate">{item.label}</span>
              {item.shortcutId && SHORTCUT_MAP[item.shortcutId] && (
                <kbd className="text-2xs text-ink-faint font-mono px-1.5 py-0.5 bg-surface-2 rounded">
                  {comboKey(SHORTCUT_MAP[item.shortcutId].combo)}
                </kbd>
              )}
              {i === selectedIdx && <CornerDownLeft size={12} className="text-ink-faint" />}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
