import { useEffect, useRef, useState } from 'react';
import { useSimulator } from '@/features/bolt-simulator/simulator/engine/SimulatorContext';
import {
  Files, Search, GitBranch, Play, Puzzle, Zap, Settings, Keyboard, Sun, Moon, type LucideIcon,
} from 'lucide-react';
import type { SimulatorState } from '@/features/bolt-simulator/simulator/engine/SimulatorContext';

interface ActivityItem {
  id: SimulatorState['activeView'];
  icon: LucideIcon;
  label: string;
}

export function ActivityBar() {
  const { state, setActiveView, toggleTaskPanel, toggleSidebar, toggleTheme, toggleKeyboard } = useSimulator();
  const [manageOpen, setManageOpen] = useState(false);
  const manageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!manageOpen) return;
    const onDown = (e: MouseEvent) => {
      if (manageRef.current && !manageRef.current.contains(e.target as Node)) {
        setManageOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [manageOpen]);

  const items: ActivityItem[] = [
    { id: 'explorer', icon: Files, label: 'Explorer' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'scm', icon: GitBranch, label: 'Source Control' },
    { id: 'run', icon: Play, label: 'Run and Debug' },
    { id: 'extensions', icon: Puzzle, label: 'Extensions' },
  ];

  return (
    <div className="flex w-12 shrink-0 flex-col items-center border-r border-edge bg-activity py-1 no-select">
      {items.map((item) => {
        const active = state.activeView === item.id && state.sidebarVisible;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              if (state.activeView === item.id && state.sidebarVisible) {
                toggleSidebar();
              } else {
                setActiveView(item.id);
              }
            }}
            className={`relative flex h-12 w-12 items-center justify-center transition-colors group ${
              active ? 'text-white' : 'text-white/40 hover:text-white'
            }`}
            title={item.label}
          >
            {active && <span className="absolute top-0 bottom-0 left-0 w-[2px] bg-white" />}
            <item.icon size={24} strokeWidth={1.5} />
            <span className="pointer-events-none absolute left-full z-50 ml-2 whitespace-nowrap rounded-[2px] bg-[#1f1f1f] px-2 py-1 text-[12px] text-[#cccccc] opacity-0 shadow-lg group-hover:opacity-100">
              {item.label}
            </span>
          </button>
        );
      })}

      <div className="flex-1" />

      <button
        type="button"
        onClick={toggleTaskPanel}
        className={`relative flex h-12 w-12 items-center justify-center transition-colors group ${
          state.taskPanelVisible ? 'text-white' : 'text-white/40 hover:text-white'
        }`}
        title="Tasks"
      >
        {state.taskPanelVisible && (
          <span className="absolute top-0 bottom-0 left-0 w-[2px] bg-white" />
        )}
        <Zap size={24} strokeWidth={1.5} />
        <span className="pointer-events-none absolute left-full z-50 ml-2 whitespace-nowrap rounded-[2px] bg-[#1f1f1f] px-2 py-1 text-[12px] text-[#cccccc] opacity-0 shadow-lg group-hover:opacity-100">
          Tasks
        </span>
      </button>

      <div ref={manageRef} className="relative">
        <button
          type="button"
          onClick={() => setManageOpen((o) => !o)}
          className={`relative flex h-12 w-12 items-center justify-center transition-colors group ${
            manageOpen ? 'text-white' : 'text-white/40 hover:text-white'
          }`}
          title="Manage"
          aria-expanded={manageOpen}
        >
          <Settings size={24} strokeWidth={1.5} />
        </button>
        {manageOpen && (
          <div className="absolute bottom-2 left-full z-[80] ml-1 min-w-[220px] rounded-[2px] border border-edge bg-surface-1 py-1 shadow-lg">
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-1.5 text-[13px] text-ink-soft hover:bg-[#094771] hover:text-white"
              onClick={() => {
                toggleTheme();
                setManageOpen(false);
              }}
            >
              {state.theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              Color Theme
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-1.5 text-[13px] text-ink-soft hover:bg-[#094771] hover:text-white"
              onClick={() => {
                toggleKeyboard();
                setManageOpen(false);
              }}
            >
              <Keyboard size={14} />
              Keyboard Visualizer
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-1.5 text-[13px] text-ink-soft hover:bg-[#094771] hover:text-white"
              onClick={() => {
                setActiveView('extensions');
                setManageOpen(false);
              }}
            >
              <Puzzle size={14} />
              Extensions
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
