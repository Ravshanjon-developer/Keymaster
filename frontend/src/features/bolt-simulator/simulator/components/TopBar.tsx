import { useSimulator } from '@/features/bolt-simulator/simulator/engine/SimulatorContext';
import { Keyboard, Search, Zap, Sun, Moon, PanelLeft, PanelBottom } from 'lucide-react';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { VsCodeWorkbenchLinks } from '@/shared/components/SimulatorChrome';

const MENU_ITEMS = ['File', 'Edit', 'View', 'Go', 'Run', 'Terminal', 'Help'];

function VsCodeMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden className="shrink-0">
      <path
        fill="#007ACC"
        d="M17.6.4 8.2 8.1 3.7 4.7.8 6.3v11.4l2.9 1.6 4.5-3.4 9.4 7.7L23.2 21V3z"
      />
      <path fill="#1F9CF0" d="M17.6.4 23.2 3v18l-5.6 2.6V.4z" opacity=".9" />
    </svg>
  );
}

export function TopBar() {
  const sim = useSimulator();
  const { state, toggleTheme, openCommandPalette, openQuickOpen, toggleTaskPanel, toggleKeyboard, toggleSidebar, toggleTerminal, importLocalFiles, runActiveFile, notify } = sim;
  const folderInputRef = useRef<HTMLInputElement>(null);
  const filesInputRef = useRef<HTMLInputElement>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleImport = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      try {
        const stats = await importLocalFiles(files);
        notify({
          type: 'success',
          message: 'Imported from computer',
          detail: `${stats.fileCount} file(s)`,
        });
      } catch (err) {
        notify({
          type: 'error',
          message: 'Import failed',
          detail: err instanceof Error ? err.message : String(err),
        });
      }
    },
    [importLocalFiles, notify],
  );

  const runCmd = (cmdId: string) => {
    const rootId = state.rootId;
    switch (cmdId) {
      case 'cmd.new-file':
        sim.createNode(rootId, 'untitled.txt', 'file');
        break;
      case 'cmd.new-folder':
        sim.createNode(rootId, 'new-folder', 'folder');
        break;
      case 'cmd.save':
        sim.saveFile();
        break;
      case 'cmd.save-all':
        state.openTabs.forEach((t) => sim.saveFile(t.fileId));
        break;
      case 'cmd.open-file':
        openQuickOpen(true);
        break;
      case 'cmd.undo':
        sim.dispatch({ type: 'UNDO' });
        break;
      case 'cmd.redo':
        sim.dispatch({ type: 'REDO' });
        break;
      case 'cmd.find':
        sim.toggleFind(true);
        break;
      case 'cmd.replace':
        sim.toggleFind(true);
        break;
      case 'cmd.toggle-sidebar':
        toggleSidebar();
        break;
      case 'cmd.toggle-terminal':
        toggleTerminal();
        break;
      case 'cmd.toggle-panel':
        toggleTerminal();
        break;
      case 'cmd.toggle-task-panel':
        toggleTaskPanel();
        break;
      case 'cmd.toggle-keyboard':
        toggleKeyboard();
        break;
      case 'cmd.show-explorer':
        sim.setActiveView('explorer');
        break;
      case 'cmd.global-search':
        sim.setActiveView('search');
        break;
      case 'cmd.quick-open':
        openQuickOpen(true);
        break;
      case 'cmd.next-tab':
        if (state.openTabs.length > 1) {
          const idx = state.openTabs.findIndex((t) => t.fileId === state.activeTabId);
          const next = state.openTabs[(idx + 1) % state.openTabs.length];
          sim.setActiveFile(next.fileId);
        }
        break;
      case 'cmd.close-tab':
        if (state.activeTabId) sim.closeFile(state.activeTabId);
        break;
      case 'cmd.reopen-closed-tab':
        if (state.closedTabHistory[0]) sim.reopenTab(state.closedTabHistory[0]);
        break;
      case 'cmd.new-terminal':
        sim.toggleTerminal();
        break;
      case 'cmd.clear-terminal':
        sim.clearTerminal();
        break;
      case 'cmd.next-task':
        sim.nextTask();
        break;
      case 'cmd.hint':
        sim.showHint();
        break;
      case 'cmd.skip-task':
        sim.skipTask();
        break;
      case 'cmd.start-task':
        if (!state.currentTaskId && state.taskProgress === null) {
          sim.startTask('task.create-file');
        }
        break;
      case 'cmd.palette':
        openCommandPalette(true);
        break;
      case 'cmd.import-folder':
        folderInputRef.current?.click();
        break;
      case 'cmd.import-files':
        filesInputRef.current?.click();
        break;
      case 'cmd.run-code':
        void runActiveFile();
        break;
      default:
        break;
    }
  };

  const menuActions = useMemo(
    (): Record<string, { label: string; cmdId: string; shortcut?: string }[]> => ({
      File: [
        { label: 'New File', cmdId: 'cmd.new-file', shortcut: 'Ctrl+N' },
        { label: 'New Folder', cmdId: 'cmd.new-folder' },
        { label: 'Open Folder from Computer…', cmdId: 'cmd.import-folder' },
        { label: 'Open Files from Computer…', cmdId: 'cmd.import-files' },
        { label: 'Save', cmdId: 'cmd.save', shortcut: 'Ctrl+S' },
        { label: 'Save All', cmdId: 'cmd.save-all', shortcut: 'Ctrl+Shift+S' },
        { label: 'Open File', cmdId: 'cmd.open-file', shortcut: 'Ctrl+O' },
      ],
      Edit: [
        { label: 'Undo', cmdId: 'cmd.undo', shortcut: 'Ctrl+Z' },
        { label: 'Redo', cmdId: 'cmd.redo', shortcut: 'Ctrl+Y' },
        { label: 'Find', cmdId: 'cmd.find', shortcut: 'Ctrl+F' },
        { label: 'Replace', cmdId: 'cmd.replace', shortcut: 'Ctrl+H' },
      ],
      View: [
        { label: 'Toggle Primary Side Bar', cmdId: 'cmd.toggle-sidebar', shortcut: 'Ctrl+B' },
        { label: 'Toggle Panel', cmdId: 'cmd.toggle-terminal', shortcut: 'Ctrl+`' },
        { label: 'Toggle Keyboard Visualizer', cmdId: 'cmd.toggle-keyboard' },
        { label: 'Command Palette', cmdId: 'cmd.palette', shortcut: 'Ctrl+Shift+P' },
        { label: 'Toggle Task Panel', cmdId: 'cmd.toggle-task-panel' },
      ],
      Go: [
        { label: 'Go to File…', cmdId: 'cmd.quick-open', shortcut: 'Ctrl+P' },
        { label: 'Next Tab', cmdId: 'cmd.next-tab', shortcut: 'Ctrl+Tab' },
        { label: 'Close Tab', cmdId: 'cmd.close-tab', shortcut: 'Ctrl+W' },
        { label: 'Reopen Closed Tab', cmdId: 'cmd.reopen-closed-tab', shortcut: 'Ctrl+Shift+T' },
      ],
      Run: [
        { label: 'Run Code', cmdId: 'cmd.run-code', shortcut: 'F5' },
        { label: 'Start First Task', cmdId: 'cmd.start-task' },
      ],
      Terminal: [
        { label: 'Toggle Terminal', cmdId: 'cmd.toggle-terminal', shortcut: 'Ctrl+`' },
        { label: 'Clear Terminal', cmdId: 'cmd.clear-terminal' },
      ],
      Help: [
        { label: 'Command Palette', cmdId: 'cmd.palette', shortcut: 'Ctrl+Shift+P' },
        { label: 'Show Hint', cmdId: 'cmd.hint' },
        { label: 'Skip Task', cmdId: 'cmd.skip-task' },
      ],
    }),
    [],
  );

  return (
    <div className="relative flex h-[35px] shrink-0 items-center gap-0.5 border-b border-edge bg-titlebar px-1 no-select">
      <input
        ref={folderInputRef}
        type="file"
        className="hidden"
        // @ts-expect-error webkitdirectory
        webkitdirectory=""
        directory=""
        multiple
        onChange={(e) => {
          void handleImport(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={filesInputRef}
        type="file"
        className="hidden"
        multiple
        onChange={(e) => {
          void handleImport(e.target.files);
          e.target.value = '';
        }}
      />

      <div className="flex h-full shrink-0 items-center px-2">
        <VsCodeMark />
      </div>

      <div ref={menuRef} className="relative flex h-full shrink-0 items-center text-[13px] text-ink-soft">
        {MENU_ITEMS.map((menu) => (
          <button
            key={menu}
            type="button"
            onClick={() => setOpenMenu(openMenu === menu ? null : menu)}
            onMouseEnter={() => openMenu && setOpenMenu(menu)}
            className={`h-[22px] rounded-[2px] px-2 transition-colors ${
              openMenu === menu ? 'bg-surface-2 text-ink' : 'hover:bg-surface-2'
            }`}
          >
            {menu}
          </button>
        ))}
        {openMenu && (
          <div className="bolt-menubar-dropdown absolute top-full left-0 z-[100] mt-0 min-w-[260px] animate-scale-in rounded-[2px] border border-edge bg-surface-1 py-1 shadow-lg">
            {menuActions[openMenu]?.map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  runCmd(item.cmdId);
                  setOpenMenu(null);
                }}
                className="flex w-full items-center justify-between px-3 py-[6px] text-[13px] text-ink-soft transition-colors hover:bg-[#094771] hover:text-white"
              >
                <span>{item.label}</span>
                {item.shortcut && (
                  <span className="ml-10 font-sans text-[12px] text-ink-faint">{item.shortcut}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 justify-center px-3">
        <button
          type="button"
          onClick={() => openCommandPalette(true)}
          className="flex h-[26px] w-full max-w-[min(36rem,55%)] items-center justify-center gap-2 rounded-[2px] border border-edge bg-surface-2 px-3 text-[13px] text-ink-dim transition-colors hover:bg-surface-3 hover:text-ink"
          title="Show All Commands (Ctrl+Shift+P)"
        >
          <Search size={12} className="shrink-0 opacity-70" />
          <span className="truncate">keymaster-project</span>
        </button>
      </div>

      <div className="flex h-full shrink-0 items-center gap-px">
        <button
          type="button"
          onClick={toggleSidebar}
          className={`rounded-[2px] p-1.5 transition-colors ${
            state.sidebarVisible ? 'text-ink' : 'text-ink-dim hover:bg-surface-2 hover:text-ink'
          }`}
          title="Toggle Primary Side Bar (Ctrl+B)"
          aria-pressed={state.sidebarVisible}
        >
          <PanelLeft size={16} />
        </button>
        <button
          type="button"
          onClick={toggleTerminal}
          className={`rounded-[2px] p-1.5 transition-colors ${
            state.terminalVisible ? 'text-ink' : 'text-ink-dim hover:bg-surface-2 hover:text-ink'
          }`}
          title="Toggle Panel (Ctrl+`)"
          aria-pressed={state.terminalVisible}
        >
          <PanelBottom size={16} />
        </button>
        <button
          type="button"
          onClick={toggleTaskPanel}
          className={`rounded-[2px] p-1.5 transition-colors ${
            state.taskPanelVisible ? 'text-ink' : 'text-ink-dim hover:bg-surface-2 hover:text-ink'
          }`}
          title="Toggle Task Panel"
          aria-pressed={state.taskPanelVisible}
        >
          <Zap size={16} />
        </button>
        <button
          type="button"
          onClick={toggleKeyboard}
          className={`rounded-[2px] p-1.5 transition-colors ${
            state.keyboardVisible ? 'text-ink' : 'text-ink-dim hover:bg-surface-2 hover:text-ink'
          }`}
          title="Toggle keyboard visualizer"
          aria-pressed={state.keyboardVisible}
        >
          <Keyboard size={16} />
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-[2px] p-1.5 text-ink-dim transition-colors hover:bg-surface-2 hover:text-ink"
          title="Toggle theme"
        >
          {state.theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <VsCodeWorkbenchLinks />
      </div>
    </div>
  );
}
