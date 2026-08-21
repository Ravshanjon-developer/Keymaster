import { useSimulator, type EditorTab } from '@/features/bolt-simulator/simulator/engine/SimulatorContext';
import { X, Circle } from 'lucide-react';
import { getFileIcon, getFileColor } from '@/features/bolt-simulator/simulator/components/fileIcons';
import { useRef } from 'react';

export function EditorTabs() {
  const { state, setActiveFile, closeFile } = useSimulator();
  const containerRef = useRef<HTMLDivElement>(null);

  if (state.openTabs.length === 0) {
    return <div className="h-9 shrink-0 border-b border-edge bg-surface-1" />;
  }

  return (
    <div
      ref={containerRef}
      className="flex h-9 shrink-0 items-center overflow-x-auto border-b border-edge bg-surface-1 no-select"
    >
      {state.openTabs.map((tab: EditorTab) => {
        const file = state.nodes[tab.fileId];
        if (!file) return null;
        const Icon = getFileIcon(file.name);
        const colorClass = getFileColor(file.name);
        const isActive = state.activeTabId === tab.fileId;

        return (
          <div
            key={tab.fileId}
            onClick={() => setActiveFile(tab.fileId)}
            className={`group relative flex h-9 min-w-0 cursor-pointer items-center gap-1.5 border-r border-edge px-3 transition-colors ${
              isActive ? 'bg-surface-0 text-ink' : 'bg-tab-inactive text-ink-dim hover:text-ink'
            }`}
          >
            {isActive && <span className="absolute top-0 right-0 left-0 h-[1px] bg-[#0078d4]" />}
            <Icon size={16} className={`shrink-0 ${colorClass}`} />
            <span className="max-w-[140px] truncate text-[13px]">{file.name}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                closeFile(tab.fileId);
              }}
              className="ml-1 shrink-0 rounded-[2px] p-0.5 hover:bg-surface-3"
              aria-label={`Close ${file.name}`}
            >
              {tab.modified ? (
                <Circle size={8} className="fill-current text-ink group-hover:hidden" />
              ) : null}
              <X size={14} className={tab.modified ? 'hidden group-hover:block' : 'block'} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
